import { Lexer } from './lexer';
import { Parser } from './parser';
import { Interpreter, ExecuteOptions } from './runtime';
import { ExecutionResult, ConsoleOutputItem } from './types';

export * from './types';
export * from './errors';
export { Interpreter } from './runtime';
export type { ExecuteOptions } from './runtime';
export { 
  VSharpDebuggerSession, 
  type StackFrame, 
  type DebuggerPauseInfo,
  type DebugStepAction 
} from './debugger';
export { 
  VSharpLanguageService, 
  type CompletionItem, 
  type HoverInfo, 
  type DefinitionLocation 
} from './languageServer';

export async function runVSharpAsync(
  sourceCode: string,
  options?: ExecuteOptions
): Promise<ExecutionResult> {
  const startTime = performance.now();
  const currentFile = options?.currentFile || 'main.v';

  // 1. Lexing
  const lexer = new Lexer(sourceCode);
  const { tokens, error: lexError } = lexer.tokenize();

  if (lexError) {
    const executionTimeMs = Math.round((performance.now() - startTime) * 100) / 100;
    const finalErr = { ...lexError, file: currentFile };
    const errItem: ConsoleOutputItem = {
      id: `lex-err-${Date.now()}`,
      type: 'error',
      text: `V# Error in ${currentFile} (Line ${finalErr.line}): ${finalErr.title} — ${finalErr.message}`,
      line: finalErr.line,
      suggestion: finalErr.suggestion,
    };
    if (options?.onOutput) options.onOutput(errItem);
    return {
      success: false,
      outputs: [errItem],
      error: finalErr,
      variables: {},
      executionTimeMs,
    };
  }

  // 2. Parsing
  const parser = new Parser(tokens);
  const { program, error: parseError } = parser.parse();

  if (parseError || !program) {
    const err = { ...parseError!, file: currentFile };
    const executionTimeMs = Math.round((performance.now() - startTime) * 100) / 100;
    const errItem: ConsoleOutputItem = {
      id: `parse-err-${Date.now()}`,
      type: 'error',
      text: `V# Error in ${currentFile} (Line ${err.line}): ${err.title} — ${err.message}`,
      line: err.line,
      suggestion: err.suggestion,
    };
    if (options?.onOutput) options.onOutput(errItem);
    return {
      success: false,
      outputs: [errItem],
      error: err,
      variables: {},
      executionTimeMs,
    };
  }

  // 3. Execution
  const interpreter = new Interpreter();
  return await interpreter.execute(program, options);
}

// Synchronous wrapper for basic tests
export function runVSharp(sourceCode: string): ExecutionResult {
  const lexer = new Lexer(sourceCode);
  const { tokens, error: lexError } = lexer.tokenize();
  if (lexError) {
    return {
      success: false,
      outputs: [{ id: 'err', type: 'error', text: lexError.message, line: lexError.line }],
      error: lexError,
      variables: {},
      executionTimeMs: 0,
    };
  }
  const parser = new Parser(tokens);
  const { program, error: parseError } = parser.parse();
  if (parseError || !program) {
    return {
      success: false,
      outputs: [{ id: 'err', type: 'error', text: parseError!.message, line: parseError!.line }],
      error: parseError,
      variables: {},
      executionTimeMs: 0,
    };
  }
  const interpreter = new Interpreter();
  let syncResult: ExecutionResult = {
    success: false,
    outputs: [],
    variables: {},
    executionTimeMs: 0,
  };
  interpreter.execute(program).then((res) => {
    syncResult = res;
  });
  return syncResult;
}
