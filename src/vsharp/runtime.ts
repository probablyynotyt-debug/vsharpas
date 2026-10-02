import {
  Program,
  Statement,
  UseStatement,
  ExecutionResult,
  ConsoleOutputItem,
  VSharpError,
  VSharpValue,
  InputRequest,
} from './types';
import { evaluateExpression, RuntimeContext } from './evaluator';
import { createVSharpError } from './errors';
import { Lexer } from './lexer';
import { Parser } from './parser';
import { VSharpDebuggerSession, StackFrame, DebuggerPauseInfo } from './debugger';

interface FunctionDef {
  parameters: string[];
  body: Statement[];
}

class BreakException {}
class GiveException {
  constructor(public value: VSharpValue) {}
}

export interface ExecuteOptions {
  onOutput?: (item: ConsoleOutputItem) => void;
  onClear?: () => void;
  requestInput?: (req: InputRequest) => void;
  signal?: AbortSignal;
  projectFiles?: Record<string, string>;
  currentFile?: string;
  debuggerSession?: VSharpDebuggerSession;
}

export class Interpreter {
  private globalVariables: Record<string, VSharpValue> = {};
  private functions: Map<string, FunctionDef> = new Map();
  private outputs: ConsoleOutputItem[] = [];
  private loopIterations: number = 0;
  private readonly MAX_LOOP_ITERATIONS = 100000;
  private isCancelled: boolean = false;

  // Multi-file & Module tracking
  private projectFiles: Record<string, string> = {};
  private currentFile: string = 'main.v';
  private loadingModules: Set<string> = new Set();
  private loadedModulesCache: Map<
    string,
    { functions: Map<string, FunctionDef>; variables: Record<string, VSharpValue> }
  > = new Map();

  // Debugger tracking
  private debuggerSession?: VSharpDebuggerSession;
  private callStack: StackFrame[] = [];

  public abort(): void {
    this.isCancelled = true;
  }

  async execute(
    program: Program,
    options?: ExecuteOptions
  ): Promise<ExecutionResult> {
    const startTime = performance.now();
    this.globalVariables = {};
    this.functions.clear();
    this.outputs = [];
    this.loopIterations = 0;
    this.isCancelled = false;

    this.projectFiles = options?.projectFiles || {};
    this.currentFile = options?.currentFile || 'main.v';
    this.loadingModules.clear();
    this.loadedModulesCache.clear();
    this.debuggerSession = options?.debuggerSession;

    // Root callstack frame
    this.callStack = [
      {
        id: 'frame-root',
        file: this.currentFile,
        line: 1,
        functionName: '<main>',
        variables: this.globalVariables,
      },
    ];

    if (options?.signal) {
      options.signal.addEventListener('abort', () => {
        this.isCancelled = true;
      });
    }

    const emitOutput = (item: ConsoleOutputItem) => {
      this.outputs.push(item);
      if (options?.onOutput) {
        options.onOutput(item);
      }
    };

    const ctx: RuntimeContext = {
      isAborted: () => this.isCancelled || (options?.signal?.aborted ?? false),
      requestInput: async (prompt: string, isNumber: boolean): Promise<string | number> => {
        if (ctx.isAborted()) {
          throw createVSharpError(1, 1, 'Program Stopped', 'Execution was stopped by user.');
        }

        // Show prompt in console
        if (prompt) {
          emitOutput({
            id: `prompt-${Date.now()}-${Math.random()}`,
            type: 'stdout',
            text: prompt,
          });
        }

        if (!options?.requestInput) {
          return isNumber ? 0 : '';
        }

        return new Promise<string | number>((resolve, reject) => {
          options.requestInput!({
            id: `req-${Date.now()}-${Math.random()}`,
            prompt,
            isNumber,
            resolve: (rawAnswer: string) => {
              if (ctx.isAborted()) {
                reject(createVSharpError(1, 1, 'Program Stopped', 'Execution was stopped by user.'));
                return;
              }

              // Echo user's typed input
              emitOutput({
                id: `echo-${Date.now()}-${Math.random()}`,
                type: 'input-echo',
                text: rawAnswer,
              });

              if (isNumber) {
                const parsed = Number(rawAnswer);
                resolve(isNaN(parsed) ? 0 : parsed);
              } else {
                resolve(rawAnswer);
              }
            },
          });
        });
      },

      callFunction: async (name: string, args: VSharpValue[], line: number): Promise<VSharpValue> => {
        const func = this.functions.get(name);
        if (!func) {
          throw createVSharpError(
            line,
            1,
            'Undefined Function',
            `I don't know the function "${name}".`,
            `Define it first with: make ${name} ... end, or check module "use" statement.`
          );
        }

        // Local scope inherited from globalVariables
        const localScope: Record<string, VSharpValue> = { ...this.globalVariables };
        for (let i = 0; i < func.parameters.length; i++) {
          const paramName = func.parameters[i];
          localScope[paramName] = i < args.length ? args[i] : 0;
        }

        const frameId = `frame-${Date.now()}-${Math.random()}`;
        this.callStack.push({
          id: frameId,
          file: this.currentFile,
          line,
          functionName: name,
          variables: localScope,
        });

        try {
          await this.executeBlock(func.body, localScope, ctx, emitOutput, options?.onClear);
          return 0; // Default return if no give statement
        } catch (e) {
          if (e instanceof GiveException) {
            return e.value;
          }
          throw e;
        } finally {
          this.callStack.pop();
        }
      },
    };

    let executionError: VSharpError | undefined;

    try {
      await this.executeBlock(
        program.statements,
        this.globalVariables,
        ctx,
        emitOutput,
        options?.onClear
      );
    } catch (error: any) {
      if (this.isCancelled) {
        emitOutput({
          id: `stopped-${Date.now()}`,
          type: 'info',
          text: '[Program stopped]',
        });
        return {
          success: false,
          outputs: this.outputs,
          variables: { ...this.globalVariables },
          executionTimeMs: Math.round((performance.now() - startTime) * 100) / 100,
          aborted: true,
        };
      }

      if (error && error.line !== undefined) {
        executionError = {
          ...error,
          file: error.file || this.currentFile,
        } as VSharpError;
      } else {
        executionError = createVSharpError(
          1,
          1,
          'Runtime Error',
          error.message || 'Error occurred while executing program.'
        );
        executionError.file = this.currentFile;
      }

      emitOutput({
        id: `err-${Date.now()}-${Math.random()}`,
        type: 'error',
        text: `V# Error in ${executionError.file || 'main.v'} (Line ${executionError.line}): ${executionError.title} — ${executionError.message}`,
        line: executionError.line,
        suggestion: executionError.suggestion,
      });
    }

    const executionTimeMs = Math.round((performance.now() - startTime) * 100) / 100;

    return {
      success: !executionError && !this.isCancelled,
      outputs: this.outputs,
      error: executionError,
      variables: { ...this.globalVariables },
      executionTimeMs,
      aborted: this.isCancelled,
    };
  }

  private async executeBlock(
    statements: Statement[],
    scope: Record<string, VSharpValue>,
    ctx: RuntimeContext,
    emitOutput: (item: ConsoleOutputItem) => void,
    onClear?: () => void
  ): Promise<void> {
    for (const stmt of statements) {
      if (ctx.isAborted()) {
        throw createVSharpError(stmt.line, 1, 'Program Stopped', 'Execution was stopped by user.');
      }
      await this.executeStatement(stmt, scope, ctx, emitOutput, onClear);
    }
  }

  private async executeStatement(
    stmt: Statement,
    scope: Record<string, VSharpValue>,
    ctx: RuntimeContext,
    emitOutput: (item: ConsoleOutputItem) => void,
    onClear?: () => void
  ): Promise<void> {
    // Debugger step & breakpoint hook
    if (this.debuggerSession?.isDebugging) {
      const depth = this.callStack.length;
      if (depth > 0) {
        this.callStack[depth - 1].line = stmt.line;
        this.callStack[depth - 1].file = this.currentFile;
        this.callStack[depth - 1].variables = { ...scope };
      }

      if (this.debuggerSession.checkShouldPause(this.currentFile, stmt.line, depth)) {
        const stepAction = await this.debuggerSession.pause({
          file: this.currentFile,
          line: stmt.line,
          reason: 'breakpoint',
          stack: [...this.callStack],
          variables: { ...scope },
        });

        if (stepAction === 'stop' || this.isCancelled) {
          throw createVSharpError(stmt.line, 1, 'Program Stopped', 'Execution was stopped by debugger.');
        }
      }
    }

    switch (stmt.type) {
      case 'UseStatement': {
        await this.executeUseStatement(stmt, scope, ctx, emitOutput, onClear);
        break;
      }

      case 'SayHelloStatement': {
        emitOutput({
          id: `out-${Date.now()}-${Math.random()}`,
          type: 'stdout',
          text: 'Hello!',
          line: stmt.line,
        });
        break;
      }

      case 'SayTitleStatement': {
        const titleVal = await evaluateExpression(stmt.title, scope, ctx);
        emitOutput({
          id: `out-${Date.now()}-${Math.random()}`,
          type: 'title',
          text: String(titleVal),
          line: stmt.line,
        });
        break;
      }

      case 'SayLineStatement': {
        emitOutput({
          id: `out-${Date.now()}-${Math.random()}`,
          type: 'line',
          text: '────────────────────────────────────────',
          line: stmt.line,
        });
        break;
      }

      case 'SayBoxStatement': {
        const boxVal = await evaluateExpression(stmt.text, scope, ctx);
        emitOutput({
          id: `out-${Date.now()}-${Math.random()}`,
          type: 'box',
          text: String(boxVal),
          line: stmt.line,
        });
        break;
      }

      case 'SayStatement': {
        const val = await evaluateExpression(stmt.expression, scope, ctx);
        emitOutput({
          id: `out-${Date.now()}-${Math.random()}`,
          type: 'stdout',
          text: this.formatValue(val),
          line: stmt.line,
        });
        break;
      }

      case 'MathStatement': {
        const val = await evaluateExpression(stmt.expression, scope, ctx);
        if (typeof val !== 'number') {
          throw createVSharpError(
            stmt.line,
            1,
            'Invalid Math Output',
            `The "math" command expected a number, but got "${val}".`,
            'Use "say" to print text messages, and "math" for numeric calculations.'
          );
        }
        emitOutput({
          id: `out-${Date.now()}-${Math.random()}`,
          type: 'stdout',
          text: String(val),
          line: stmt.line,
        });
        break;
      }

      case 'SetStatement': {
        const val = await evaluateExpression(stmt.expression, scope, ctx);
        scope[stmt.variableName] = val;
        // Keep global variables in sync
        this.globalVariables[stmt.variableName] = val;
        break;
      }

      case 'ClearStatement': {
        this.outputs = [];
        if (onClear) {
          onClear();
        }
        break;
      }

      case 'WaitStatement': {
        const secVal = await evaluateExpression(stmt.duration, scope, ctx);
        if (typeof secVal !== 'number' || secVal < 0) {
          throw createVSharpError(
            stmt.line,
            1,
            'Invalid Wait Time',
            `Wait duration must be a positive number of seconds.`,
            'Example: wait 1 or wait 0.5'
          );
        }
        const ms = Math.min(secVal * 1000, 30000); // 30s cap per wait for safety
        await new Promise<void>((resolve) => {
          const timer = setTimeout(resolve, ms);
          if (ctx.isAborted()) {
            clearTimeout(timer);
            resolve();
          }
        });
        break;
      }

      case 'IfStatement': {
        const conditionVal = await evaluateExpression(stmt.condition, scope, ctx);
        if (this.isTruthy(conditionVal)) {
          await this.executeBlock(stmt.thenBranch, scope, ctx, emitOutput, onClear);
          return;
        }

        // Check else-if branches
        for (const elseIf of stmt.elseIfBranches) {
          const elseIfVal = await evaluateExpression(elseIf.condition, scope, ctx);
          if (this.isTruthy(elseIfVal)) {
            await this.executeBlock(elseIf.statements, scope, ctx, emitOutput, onClear);
            return;
          }
        }

        // Else branch
        if (stmt.elseBranch) {
          await this.executeBlock(stmt.elseBranch, scope, ctx, emitOutput, onClear);
        }
        break;
      }

      case 'RepeatStatement': {
        const countVal = await evaluateExpression(stmt.count, scope, ctx);
        if (typeof countVal !== 'number' || countVal < 0) {
          throw createVSharpError(
            stmt.line,
            1,
            'Invalid Repeat Count',
            `Repeat count must be a positive number, but got "${countVal}".`,
            'Example: repeat 5'
          );
        }

        const times = Math.floor(countVal);
        for (let i = 0; i < times; i++) {
          this.checkLoopLimit(stmt.line);
          try {
            await this.executeBlock(stmt.body, scope, ctx, emitOutput, onClear);
          } catch (e) {
            if (e instanceof BreakException) {
              break;
            }
            throw e;
          }
        }
        break;
      }

      case 'WhileStatement': {
        while (true) {
          this.checkLoopLimit(stmt.line);
          const conditionVal = await evaluateExpression(stmt.condition, scope, ctx);
          if (!this.isTruthy(conditionVal)) {
            break;
          }
          try {
            await this.executeBlock(stmt.body, scope, ctx, emitOutput, onClear);
          } catch (e) {
            if (e instanceof BreakException) {
              break;
            }
            throw e;
          }
        }
        break;
      }

      case 'BreakStatement': {
        throw new BreakException();
      }

      case 'MakeFunctionStatement': {
        this.functions.set(stmt.name, {
          parameters: stmt.parameters,
          body: stmt.body,
        });
        break;
      }

      case 'GiveStatement': {
        const giveVal = await evaluateExpression(stmt.expression, scope, ctx);
        throw new GiveException(giveVal);
      }

      case 'FunctionCallStatement': {
        const argValues: VSharpValue[] = [];
        for (const argExpr of stmt.args) {
          argValues.push(await evaluateExpression(argExpr, scope, ctx));
        }
        await ctx.callFunction(stmt.name, argValues, stmt.line);
        break;
      }

      case 'AddToListStatement': {
        const itemVal = await evaluateExpression(stmt.item, scope, ctx);
        const listVal = scope[stmt.listName];
        if (!Array.isArray(listVal)) {
          throw createVSharpError(
            stmt.line,
            1,
            'Not A List',
            `Cannot add item to "${stmt.listName}" because it is not a list.`,
            `Initialize it first: set ${stmt.listName} = []`
          );
        }
        listVal.push(itemVal);
        break;
      }

      case 'RemoveFromListStatement': {
        const itemVal = await evaluateExpression(stmt.item, scope, ctx);
        const listVal = scope[stmt.listName];
        if (!Array.isArray(listVal)) {
          throw createVSharpError(
            stmt.line,
            1,
            'Not A List',
            `Cannot remove item from "${stmt.listName}" because it is not a list.`,
            `Example: remove "Sword" from inventory`
          );
        }
        const index = listVal.findIndex((el) => el === itemVal);
        if (index !== -1) {
          listVal.splice(index, 1);
        }
        break;
      }

      case 'StandaloneExpressionStatement': {
        await evaluateExpression(stmt.expression, scope, ctx);
        break;
      }
    }
  }

  /**
   * Loads and executes a V# module file
   */
  private async executeUseStatement(
    stmt: UseStatement,
    scope: Record<string, VSharpValue>,
    ctx: RuntimeContext,
    emitOutput: (item: ConsoleOutputItem) => void,
    onClear?: () => void
  ): Promise<void> {
    const rawName = stmt.moduleName.trim();
    const available = Object.keys(this.projectFiles);

    // Resolution: match exact, with .v, with .v#, without extension, case-insensitively
    const cleanModName = rawName.replace(/\.v#?$/, '');
    let matchedFile = available.find(
      (f) =>
        f === rawName ||
        f === `${rawName}.v` ||
        f === `${rawName}.v#` ||
        f.replace(/\.v#?$/, '') === cleanModName ||
        f.toLowerCase() === rawName.toLowerCase() ||
        f.toLowerCase() === `${rawName}.v`.toLowerCase() ||
        f.toLowerCase().replace(/\.v#?$/, '') === cleanModName.toLowerCase()
    );

    if (!matchedFile) {
      const list = available.length > 0 ? available.join(', ') : 'none';
      throw createVSharpError(
        stmt.line,
        1,
        'Module Not Found',
        `Cannot find module "${rawName}".`,
        `Create a file named "${cleanModName}.v" in the Project Explorer. Available files: ${list}`
      );
    }

    // Circular dependency detection
    if (this.loadingModules.has(matchedFile)) {
      throw createVSharpError(
        stmt.line,
        1,
        'Circular Dependency',
        `Module "${matchedFile}" has a circular dependency and cannot import itself.`,
        'Check your "use" statements to ensure modules do not cycle back.'
      );
    }

    // Check module cache
    if (this.loadedModulesCache.has(matchedFile)) {
      const cached = this.loadedModulesCache.get(matchedFile)!;
      for (const [fnName, fnDef] of cached.functions.entries()) {
        this.functions.set(fnName, fnDef);
        if (stmt.alias) {
          this.functions.set(`${stmt.alias}.${fnName}`, fnDef);
        }
      }
      for (const [varName, varVal] of Object.entries(cached.variables)) {
        scope[varName] = varVal;
        this.globalVariables[varName] = varVal;
        if (stmt.alias) {
          scope[`${stmt.alias}.${varName}`] = varVal;
          this.globalVariables[`${stmt.alias}.${varName}`] = varVal;
        }
      }
      return;
    }

    // Lex module
    const moduleCode = this.projectFiles[matchedFile];
    const lexer = new Lexer(moduleCode);
    const { tokens, error: lexErr } = lexer.tokenize();
    if (lexErr) {
      throw { ...lexErr, file: matchedFile };
    }

    // Known function arities
    const knownArities = new Map<string, number>();
    for (const [k, v] of this.functions.entries()) {
      knownArities.set(k, v.parameters.length);
    }

    const parser = new Parser(tokens, knownArities);
    const { program, error: parseErr } = parser.parse();
    if (parseErr || !program) {
      throw {
        ...(parseErr || createVSharpError(1, 1, 'Syntax Error', 'Failed to parse module')),
        file: matchedFile,
      };
    }

    this.loadingModules.add(matchedFile);
    const prevFile = this.currentFile;
    this.currentFile = matchedFile;

    const moduleScope: Record<string, VSharpValue> = {};
    const moduleFunctions = new Map<string, FunctionDef>();

    // Register all functions defined in the module
    for (const s of program.statements) {
      if (s.type === 'MakeFunctionStatement') {
        const fnDef: FunctionDef = { parameters: s.parameters, body: s.body };
        moduleFunctions.set(s.name, fnDef);
        this.functions.set(s.name, fnDef);
        if (stmt.alias) {
          this.functions.set(`${stmt.alias}.${s.name}`, fnDef);
        }
      }
    }

    try {
      await this.executeBlock(program.statements, moduleScope, ctx, emitOutput, onClear);
    } finally {
      this.loadingModules.delete(matchedFile);
      this.currentFile = prevFile;
    }

    // Store in cache
    this.loadedModulesCache.set(matchedFile, {
      functions: moduleFunctions,
      variables: moduleScope,
    });

    // Expose variables
    for (const [varName, varVal] of Object.entries(moduleScope)) {
      scope[varName] = varVal;
      this.globalVariables[varName] = varVal;
      if (stmt.alias) {
        scope[`${stmt.alias}.${varName}`] = varVal;
        this.globalVariables[`${stmt.alias}.${varName}`] = varVal;
      }
    }
  }

  private checkLoopLimit(line: number): void {
    this.loopIterations++;
    if (this.loopIterations > this.MAX_LOOP_ITERATIONS) {
      throw createVSharpError(
        line,
        1,
        'Infinite Loop Detected',
        `Loop exceeded maximum safety limit of ${this.MAX_LOOP_ITERATIONS.toLocaleString()} iterations.`,
        'Ensure loop conditions can become false, or use "break" to exit.'
      );
    }
  }

  private isTruthy(val: VSharpValue): boolean {
    if (typeof val === 'boolean') return val;
    if (typeof val === 'number') return val !== 0;
    if (typeof val === 'string') return val.length > 0;
    if (Array.isArray(val)) return val.length > 0;
    return false;
  }

  private formatValue(val: VSharpValue): string {
    if (typeof val === 'string') return val;
    if (typeof val === 'number') return String(val);
    if (typeof val === 'boolean') return val ? 'true' : 'false';
    if (Array.isArray(val)) {
      return '[' + val.map((x) => this.formatValue(x)).join(', ') + ']';
    }
    return String(val);
  }
}
