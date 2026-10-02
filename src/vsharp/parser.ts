import {
  Token,
  Program,
  Statement,
  UseStatement,
  Expression,
  VSharpError,
  BinaryExpression,
  GroupingExpression,
  ElseIfClause,
} from './types';
import { createVSharpError, findBestCommandMatch } from './errors';

export class Parser {
  private tokens: Token[];
  private current: number = 0;
  // Track declared functions to know how many args they expect in expressions
  private functionArities: Map<string, number> = new Map();

  constructor(tokens: Token[], externalFunctionArities?: Map<string, number>) {
    this.tokens = tokens;
    if (externalFunctionArities) {
      for (const [k, v] of externalFunctionArities.entries()) {
        this.functionArities.set(k, v);
      }
    }
    this.preScanFunctionDeclarations();
  }

  // Pre-scan pass to register declared functions so expressions like 'set x = add 10 20' know 'add' takes 2 args
  private preScanFunctionDeclarations(): void {
    for (let i = 0; i < this.tokens.length; i++) {
      if (this.tokens[i].type === 'KEYWORD_MAKE' && i + 1 < this.tokens.length) {
        const nameToken = this.tokens[i + 1];
        if (nameToken.type === 'IDENTIFIER' || nameToken.type === 'KEYWORD_ADD') {
          let paramCount = 0;
          let j = i + 2;
          while (
            j < this.tokens.length &&
            this.tokens[j].type !== 'NEWLINE' &&
            this.tokens[j].type !== 'EOF'
          ) {
            if (this.tokens[j].type === 'IDENTIFIER' || this.tokens[j].type === 'KEYWORD_ADD') {
              paramCount++;
            }
            j++;
          }
          this.functionArities.set(nameToken.value, paramCount);
        }
      }
    }
  }

  parse(): { program?: Program; error?: VSharpError } {
    const statements: Statement[] = [];

    while (!this.isAtEnd()) {
      // Skip newlines and comments
      if (this.match('NEWLINE', 'COMMENT')) {
        continue;
      }

      try {
        const stmt = this.statement();
        if (stmt) {
          statements.push(stmt);
        }
      } catch (err: any) {
        if (err && err.line !== undefined) {
          return { error: err as VSharpError };
        }
        return {
          error: createVSharpError(
            this.peek().line,
            this.peek().col,
            'Syntax Error',
            err.message || 'Failed to parse V# code.'
          ),
        };
      }
    }

    return { program: { statements } };
  }

  private statement(): Statement {
    const token = this.peek();

    // 0. Module use statement: use <moduleName> [as <alias>]
    if (this.match('KEYWORD_USE')) {
      if (this.isAtEndOfStatement()) {
        throw createVSharpError(
          token.line,
          token.col,
          'Missing Module Name',
          'The "use" command requires a module name or file path to load.',
          'Example: use mathTools or use "utils/math.v"'
        );
      }
      let moduleName = '';
      if (this.check('IDENTIFIER')) {
        moduleName = this.advance().value;
      } else if (this.check('STRING')) {
        moduleName = this.advance().value;
      } else {
        throw createVSharpError(
          this.peek().line,
          this.peek().col,
          'Invalid Module Name',
          `Expected a module identifier or file string, but found "${this.peek().value}".`,
          'Example: use mathTools or use "my_module.v"'
        );
      }

      let alias: string | undefined = undefined;
      if (this.match('KEYWORD_AS')) {
        if (!this.check('IDENTIFIER')) {
          throw createVSharpError(
            this.peek().line,
            this.peek().col,
            'Missing Module Alias',
            'Expected an identifier alias after "as".',
            'Example: use mathTools as mt'
          );
        }
        alias = this.advance().value;
      }

      this.consumeEndOfStatement();
      return {
        type: 'UseStatement',
        moduleName,
        alias,
        line: token.line,
      };
    }

    // 1. Output commands
    if (this.match('KEYWORD_SAY_HELLO')) {
      this.consumeEndOfStatement();
      return { type: 'SayHelloStatement', line: token.line };
    }

    if (this.match('KEYWORD_SAY_LINE')) {
      this.consumeEndOfStatement();
      return { type: 'SayLineStatement', line: token.line };
    }

    if (this.match('KEYWORD_SAY_TITLE')) {
      if (this.isAtEndOfStatement()) {
        throw createVSharpError(
          token.line,
          token.col,
          'Incomplete Title',
          'The "say.title" command needs title text!',
          'Example: say.title "MY GAME"'
        );
      }
      const title = this.expression();
      this.consumeEndOfStatement();
      return { type: 'SayTitleStatement', title, line: token.line };
    }

    if (this.match('KEYWORD_SAY_BOX')) {
      if (this.isAtEndOfStatement()) {
        throw createVSharpError(
          token.line,
          token.col,
          'Incomplete Box',
          'The "say.box" command needs text inside!',
          'Example: say.box "Welcome to my game!"'
        );
      }
      const text = this.expression();
      this.consumeEndOfStatement();
      return { type: 'SayBoxStatement', text, line: token.line };
    }

    if (this.match('KEYWORD_SAY')) {
      if (this.isAtEndOfStatement()) {
        throw createVSharpError(
          token.line,
          token.col,
          'Incomplete Command',
          'The "say" command needs something to say!',
          'Example: say "Hello!" or say 100'
        );
      }
      const expr = this.expression();
      this.consumeEndOfStatement();
      return { type: 'SayStatement', expression: expr, line: token.line };
    }

    if (this.match('KEYWORD_MATH')) {
      if (this.isAtEndOfStatement()) {
        throw createVSharpError(
          token.line,
          token.col,
          'Incomplete Math Command',
          'The "math" command needs an expression to calculate.',
          'Example: math 10 + 5 or math (4 * 5)'
        );
      }
      const expr = this.expression();
      this.consumeEndOfStatement();
      return { type: 'MathStatement', expression: expr, line: token.line };
    }

    // 2. Set variable
    if (this.match('KEYWORD_SET')) {
      if (!this.check('IDENTIFIER')) {
        throw createVSharpError(
          token.line,
          token.col,
          'Missing Variable Name',
          'Expected a variable name after "set".',
          'Example: set money = 100'
        );
      }

      const varToken = this.advance();
      const varName = varToken.value;

      if (!this.match('EQUALS')) {
        throw createVSharpError(
          varToken.line,
          varToken.col,
          'Missing Equals Sign',
          `In V#, setting a variable requires an "=" sign after "${varName}".`,
          `Example: set ${varName} = 100`
        );
      }

      if (this.isAtEndOfStatement()) {
        throw createVSharpError(
          token.line,
          token.col,
          'Incomplete Assignment',
          `Expected a value for "${varName}".`,
          `Example: set ${varName} = 50 or set ${varName} = "Hayden"`
        );
      }

      const expr = this.expression();
      this.consumeEndOfStatement();

      return {
        type: 'SetStatement',
        variableName: varName,
        expression: expr,
        line: token.line,
      };
    }

    // 3. Clear console
    if (this.match('KEYWORD_CLEAR')) {
      this.consumeEndOfStatement();
      return { type: 'ClearStatement', line: token.line };
    }

    // 4. Wait / timing
    if (this.match('KEYWORD_WAIT')) {
      if (this.isAtEndOfStatement()) {
        throw createVSharpError(
          token.line,
          token.col,
          'Incomplete Wait Command',
          'The "wait" command needs seconds to pause.',
          'Example: wait 1 or wait 0.5'
        );
      }
      const duration = this.expression();
      this.consumeEndOfStatement();
      return { type: 'WaitStatement', duration, line: token.line };
    }

    // 5. Break statement
    if (this.match('KEYWORD_BREAK')) {
      this.consumeEndOfStatement();
      return { type: 'BreakStatement', line: token.line };
    }

    // 6. Give (Return) statement
    if (this.match('KEYWORD_GIVE')) {
      if (this.isAtEndOfStatement()) {
        throw createVSharpError(
          token.line,
          token.col,
          'Incomplete Give',
          'The "give" command needs a value to return from the function.',
          'Example: give a + b'
        );
      }
      const expr = this.expression();
      this.consumeEndOfStatement();
      return { type: 'GiveStatement', expression: expr, line: token.line };
    }

    // 7. If / Else If / Else
    if (this.match('KEYWORD_IF')) {
      return this.ifStatement(token.line);
    }

    // 8. Repeat loop
    if (this.match('KEYWORD_REPEAT')) {
      return this.repeatStatement(token.line);
    }

    // 9. While loop
    if (this.match('KEYWORD_WHILE')) {
      return this.whileStatement(token.line);
    }

    // 10. Make function definition
    if (this.match('KEYWORD_MAKE')) {
      return this.makeFunctionStatement(token.line);
    }

    // 11. Add to list: add "Grape" to fruits
    if (this.match('KEYWORD_ADD')) {
      let hasToOnLine = false;
      for (let k = this.current; k < this.tokens.length; k++) {
        if (this.tokens[k].type === 'NEWLINE' || this.tokens[k].type === 'EOF') break;
        if (this.tokens[k].type === 'KEYWORD_TO') {
          hasToOnLine = true;
          break;
        }
      }

      if (!hasToOnLine && this.functionArities.has('add')) {
        const args: Expression[] = [];
        const arity = this.functionArities.get('add') || 0;
        for (let i = 0; i < arity; i++) {
          if (this.isAtEndOfStatement()) break;
          args.push(this.comparison());
        }
        this.consumeEndOfStatement();
        return {
          type: 'FunctionCallStatement',
          name: 'add',
          args,
          line: token.line,
        };
      }

      const item = this.expression();
      if (!this.match('KEYWORD_TO')) {
        throw createVSharpError(
          token.line,
          token.col,
          'Missing "to"',
          'Expected "to" after the item to add.',
          'Example: add "Grape" to fruits'
        );
      }
      if (!this.check('IDENTIFIER')) {
        throw createVSharpError(
          token.line,
          token.col,
          'Missing List Name',
          'Expected list name after "to".',
          'Example: add "Grape" to fruits'
        );
      }
      const listToken = this.advance();
      this.consumeEndOfStatement();
      return {
        type: 'AddToListStatement',
        item,
        listName: listToken.value,
        line: token.line,
      };
    }

    // 12. Remove from list: remove "Apple" from fruits
    if (this.match('KEYWORD_REMOVE')) {
      const item = this.expression();
      if (!this.match('KEYWORD_FROM')) {
        throw createVSharpError(
          token.line,
          token.col,
          'Missing "from"',
          'Expected "from" after the item to remove.',
          'Example: remove "Apple" from fruits'
        );
      }
      if (!this.check('IDENTIFIER')) {
        throw createVSharpError(
          token.line,
          token.col,
          'Missing List Name',
          'Expected list name after "from".',
          'Example: remove "Apple" from fruits'
        );
      }
      const listToken = this.advance();
      this.consumeEndOfStatement();
      return {
        type: 'RemoveFromListStatement',
        item,
        listName: listToken.value,
        line: token.line,
      };
    }

    // 13. Standalone Ask / Ask.number
    if (this.check('KEYWORD_ASK') || this.check('KEYWORD_ASK_NUMBER')) {
      const isNumber = this.match('KEYWORD_ASK_NUMBER');
      if (!isNumber) this.advance();
      const prompt = this.isAtEndOfStatement()
        ? { type: 'StringLiteral', value: '', line: token.line } as Expression
        : this.expression();
      this.consumeEndOfStatement();
      return {
        type: 'StandaloneExpressionStatement',
        expression: {
          type: 'AskExpression',
          prompt,
          isNumber,
          line: token.line,
        },
        line: token.line,
      };
    }

    // 14. Function call as statement or typo detection
    if (token.type === 'IDENTIFIER') {
      const name = token.value;

      // Check if user is calling a defined function
      if (this.functionArities.has(name)) {
        const identToken = this.advance();
        const args: Expression[] = [];
        if (this.match('LPAREN')) {
          if (!this.check('RPAREN')) {
            do {
              args.push(this.expression());
            } while (this.match('COMMA'));
          }
          if (!this.match('RPAREN')) {
            throw createVSharpError(
              token.line,
              token.col,
              'Missing Closing Parenthesis',
              'Expected ")" after function arguments.'
            );
          }
        } else {
          while (!this.isAtEndOfStatement()) {
            args.push(this.comparison());
          }
        }
        this.consumeEndOfStatement();
        return {
          type: 'FunctionCallStatement',
          name,
          args,
          line: identToken.line,
        };
      }

      // Check if typo of a known command
      const suggestion = findBestCommandMatch(name);
      if (suggestion) {
        this.advance();
        throw createVSharpError(
          token.line,
          token.col,
          'Unknown Command',
          `I don't know the command "${name}".`,
          `Did you mean "${suggestion}"?`
        );
      }

      // Otherwise parse as FunctionCallStatement (will report undefined function at runtime if not defined)
      const identToken = this.advance();
      const args: Expression[] = [];
      while (!this.isAtEndOfStatement()) {
        args.push(this.comparison());
      }
      this.consumeEndOfStatement();
      return {
        type: 'FunctionCallStatement',
        name,
        args,
        line: identToken.line,
      };
    }

    // Check typo suggestions
    const suggestion = findBestCommandMatch(token.value);
    this.advance();
    throw createVSharpError(
      token.line,
      token.col,
      'Unknown Command',
      `I don't know the command "${token.value}".`,
      suggestion ? `Did you mean "${suggestion}"?` : 'Check your spelling or see the V# Guide.'
    );
  }

  // If statement parser
  private ifStatement(line: number): Statement {
    if (this.isAtEndOfStatement()) {
      throw createVSharpError(
        line,
        1,
        'Incomplete If Condition',
        'Expected a condition after "if".',
        'Example: if score >= 10'
      );
    }

    const condition = this.expression();
    this.consumeEndOfStatement();

    const thenBranch: Statement[] = [];
    const elseIfBranches: ElseIfClause[] = [];
    let elseBranch: Statement[] | undefined = undefined;

    while (!this.isAtEnd() && !this.check('KEYWORD_ELSE') && !this.check('KEYWORD_END')) {
      if (this.match('NEWLINE', 'COMMENT')) continue;
      thenBranch.push(this.statement());
    }

    // Handle else if / else
    while (this.match('KEYWORD_ELSE')) {
      const elseToken = this.previous();
      if (this.match('KEYWORD_IF')) {
        // Else If
        if (this.isAtEndOfStatement()) {
          throw createVSharpError(
            elseToken.line,
            1,
            'Incomplete Else If Condition',
            'Expected a condition after "else if".',
            'Example: else if score >= 50'
          );
        }
        const elseIfCond = this.expression();
        this.consumeEndOfStatement();
        const elseIfStatements: Statement[] = [];

        while (!this.isAtEnd() && !this.check('KEYWORD_ELSE') && !this.check('KEYWORD_END')) {
          if (this.match('NEWLINE', 'COMMENT')) continue;
          elseIfStatements.push(this.statement());
        }

        elseIfBranches.push({
          condition: elseIfCond,
          statements: elseIfStatements,
          line: elseToken.line,
        });
      } else {
        // Plain Else
        this.consumeEndOfStatement();
        elseBranch = [];
        while (!this.isAtEnd() && !this.check('KEYWORD_END')) {
          if (this.match('NEWLINE', 'COMMENT')) continue;
          elseBranch.push(this.statement());
        }
        break;
      }
    }

    if (!this.match('KEYWORD_END')) {
      throw createVSharpError(
        line,
        1,
        'Missing "end"',
        'This "if" statement is missing a closing "end".',
        'Add "end" on a new line to close the if block.'
      );
    }
    this.consumeEndOfStatement();

    return {
      type: 'IfStatement',
      condition,
      thenBranch,
      elseIfBranches,
      elseBranch,
      line,
    };
  }

  // Repeat loop parser
  private repeatStatement(line: number): Statement {
    if (this.isAtEndOfStatement()) {
      throw createVSharpError(
        line,
        1,
        'Incomplete Repeat Loop',
        'Expected a number of times to repeat.',
        'Example: repeat 5'
      );
    }

    const count = this.expression();
    this.consumeEndOfStatement();

    const body: Statement[] = [];
    while (!this.isAtEnd() && !this.check('KEYWORD_END')) {
      if (this.match('NEWLINE', 'COMMENT')) continue;
      body.push(this.statement());
    }

    if (!this.match('KEYWORD_END')) {
      throw createVSharpError(
        line,
        1,
        'Missing "end"',
        'This "repeat" loop is missing a closing "end".',
        'Add "end" on a new line to close the loop.'
      );
    }
    this.consumeEndOfStatement();

    return {
      type: 'RepeatStatement',
      count,
      body,
      line,
    };
  }

  // While loop parser
  private whileStatement(line: number): Statement {
    if (this.isAtEndOfStatement()) {
      throw createVSharpError(
        line,
        1,
        'Incomplete While Condition',
        'Expected a condition after "while".',
        'Example: while money > 0'
      );
    }

    const condition = this.expression();
    this.consumeEndOfStatement();

    const body: Statement[] = [];
    while (!this.isAtEnd() && !this.check('KEYWORD_END')) {
      if (this.match('NEWLINE', 'COMMENT')) continue;
      body.push(this.statement());
    }

    if (!this.match('KEYWORD_END')) {
      throw createVSharpError(
        line,
        1,
        'Missing "end"',
        'This "while" loop is missing a closing "end".',
        'Add "end" on a new line to close the while loop.'
      );
    }
    this.consumeEndOfStatement();

    return {
      type: 'WhileStatement',
      condition,
      body,
      line,
    };
  }

  // Make function parser
  private makeFunctionStatement(line: number): Statement {
    const isName = this.check('IDENTIFIER') || this.check('KEYWORD_ADD');
    if (!isName) {
      throw createVSharpError(
        line,
        1,
        'Missing Function Name',
        'Expected a function name after "make".',
        'Example: make greet name'
      );
    }

    const nameToken = this.advance();
    const name = nameToken.value;
    const parameters: string[] = [];

    // Parameters on the same line
    while (!this.isAtEndOfStatement() && (this.check('IDENTIFIER') || this.check('KEYWORD_ADD'))) {
      parameters.push(this.advance().value);
    }
    this.consumeEndOfStatement();

    const body: Statement[] = [];
    while (!this.isAtEnd() && !this.check('KEYWORD_END')) {
      if (this.match('NEWLINE', 'COMMENT')) continue;
      body.push(this.statement());
    }

    if (!this.match('KEYWORD_END')) {
      throw createVSharpError(
        line,
        1,
        'Missing "end"',
        `Function "${name}" is missing a closing "end".`,
        'Add "end" on a new line to close the function.'
      );
    }
    this.consumeEndOfStatement();

    return {
      type: 'MakeFunctionStatement',
      name,
      parameters,
      body,
      line,
    };
  }

  // Expressions
  public expression(): Expression {
    return this.comparison();
  }

  // Comparison: =, !=, >, <, >=, <=
  private comparison(): Expression {
    let expr = this.addition();

    while (
      this.match(
        'EQUALS',
        'NOT_EQUALS',
        'GREATER',
        'LESS',
        'GREATER_EQUAL',
        'LESS_EQUAL'
      )
    ) {
      const opToken = this.previous();
      const operator = opToken.value as
        | '='
        | '!='
        | '>'
        | '<'
        | '>='
        | '<=';

      if (this.isAtEndOfStatement() || this.check('RPAREN') || this.check('RBRACKET')) {
        throw createVSharpError(
          opToken.line,
          opToken.col,
          'Incomplete Comparison',
          `I expected a value after "${operator}".`,
          `Example: if score ${operator} 10`
        );
      }

      const right = this.addition();
      expr = {
        type: 'BinaryExpression',
        operator,
        left: expr,
        right,
        line: opToken.line,
      };
    }

    return expr;
  }

  // Addition & Subtraction: +, -
  private addition(): Expression {
    let expr = this.multiplication();

    while (this.match('PLUS', 'MINUS')) {
      const opToken = this.previous();
      const operator = opToken.value as '+' | '-';

      if (this.isAtEndOfStatement() || this.check('RPAREN') || this.check('RBRACKET')) {
        throw createVSharpError(
          opToken.line,
          opToken.col,
          'Incomplete Expression',
          `This expression is incomplete after "${operator}".`,
          'Provide a number, text, or variable after the operator.'
        );
      }

      const right = this.multiplication();
      expr = {
        type: 'BinaryExpression',
        operator,
        left: expr,
        right,
        line: opToken.line,
      };
    }

    return expr;
  }

  // Multiplication, Division, Modulo: *, /, %
  private multiplication(): Expression {
    let expr = this.unaryOrPrefix();

    while (this.match('STAR', 'SLASH', 'PERCENT')) {
      const opToken = this.previous();
      const operator = opToken.value as '*' | '/' | '%';

      if (this.isAtEndOfStatement() || this.check('RPAREN') || this.check('RBRACKET')) {
        throw createVSharpError(
          opToken.line,
          opToken.col,
          'Incomplete Expression',
          `This expression is incomplete after "${operator}".`,
          'Provide a number or variable after the operator.'
        );
      }

      const right = this.unaryOrPrefix();
      expr = {
        type: 'BinaryExpression',
        operator,
        left: expr,
        right,
        line: opToken.line,
      };
    }

    return expr;
  }

  // Prefix keywords: random, choose, ask, ask.number
  private unaryOrPrefix(): Expression {
    const token = this.peek();

    // random 1 100
    if (this.match('KEYWORD_RANDOM')) {
      const min = this.primary();
      const max = this.primary();
      return {
        type: 'RandomExpression',
        min,
        max,
        line: token.line,
      };
    }

    // choose ["a", "b", "c"]
    if (this.match('KEYWORD_CHOOSE')) {
      const target = this.primary();
      return {
        type: 'ChooseExpression',
        target,
        line: token.line,
      };
    }

    // ask "prompt" / ask.number "prompt"
    if (this.match('KEYWORD_ASK', 'KEYWORD_ASK_NUMBER')) {
      const isNumber = this.previous().type === 'KEYWORD_ASK_NUMBER';
      const prompt = this.isAtEndOfStatement()
        ? { type: 'StringLiteral', value: '', line: token.line } as Expression
        : this.primary();
      return {
        type: 'AskExpression',
        prompt,
        isNumber,
        line: token.line,
      };
    }

    return this.primaryWithPostfix();
  }

  // Primary with index access: fruits[1]
  private primaryWithPostfix(): Expression {
    let expr = this.primary();

    // Check for index access: expr[index]
    while (this.match('LBRACKET')) {
      const bracketToken = this.previous();
      const index = this.expression();
      if (!this.match('RBRACKET')) {
        throw createVSharpError(
          bracketToken.line,
          bracketToken.col,
          'Missing Closing Bracket',
          'Expected "]" after index expression.',
          'Example: fruits[1]'
        );
      }
      expr = {
        type: 'IndexAccessExpression',
        target: expr,
        index,
        line: bracketToken.line,
      };
    }

    return expr;
  }

  // Primary atoms
  private primary(): Expression {
    const token = this.peek();

    // Booleans
    if (this.match('KEYWORD_TRUE')) {
      return { type: 'BooleanLiteral', value: true, line: token.line };
    }
    if (this.match('KEYWORD_FALSE')) {
      return { type: 'BooleanLiteral', value: false, line: token.line };
    }

    // Numbers
    if (this.match('NUMBER')) {
      const num = Number(token.value);
      return {
        type: 'NumberLiteral',
        value: isNaN(num) ? 0 : num,
        line: token.line,
      };
    }

    // Strings
    if (this.match('STRING')) {
      return {
        type: 'StringLiteral',
        value: token.value,
        line: token.line,
      };
    }

    // Lists: ["Apple", "Banana"]
    if (this.match('LBRACKET')) {
      const elements: Expression[] = [];
      if (!this.check('RBRACKET')) {
        do {
          if (this.match('NEWLINE', 'COMMENT')) continue;
          elements.push(this.expression());
        } while (this.match('COMMA'));
      }
      if (!this.match('RBRACKET')) {
        throw createVSharpError(
          token.line,
          token.col,
          'Missing Closing Bracket',
          'Expected "]" to close list.',
          'Example: ["Apple", "Banana", "Orange"]'
        );
      }
      return {
        type: 'ListLiteral',
        elements,
        line: token.line,
      };
    }

    // Parentheses grouping: ( expr )
    if (this.match('LPAREN')) {
      const expr = this.expression();
      if (!this.match('RPAREN')) {
        throw createVSharpError(
          token.line,
          token.col,
          'Missing Closing Parenthesis',
          'Expected a closing parenthesis ")" to match "(".',
          'Make sure every "(" has a matching ")".'
        );
      }
      return {
        type: 'GroupingExpression',
        expression: expr,
        line: token.line,
      };
    }

    // Identifiers or Function Calls
    if (this.match('IDENTIFIER') || (this.functionArities.has('add') && this.match('KEYWORD_ADD'))) {
      const prevToken = this.previous();
      const name = prevToken.value;

      // Check if function call with parens: add(10, 20)
      if (this.match('LPAREN')) {
        const args: Expression[] = [];
        if (!this.check('RPAREN')) {
          do {
            args.push(this.expression());
          } while (this.match('COMMA'));
        }
        if (!this.match('RPAREN')) {
          throw createVSharpError(
            token.line,
            token.col,
            'Missing Closing Parenthesis',
            'Expected ")" after arguments.'
          );
        }
        return {
          type: 'FunctionCallExpression',
          name,
          args,
          line: token.line,
        };
      }

      // Check if registered function taking arguments: e.g. add 10 20
      const arity = this.functionArities.get(name);
      if (arity && arity > 0) {
        const args: Expression[] = [];
        for (let i = 0; i < arity; i++) {
          if (this.isAtEndOfStatement()) break;
          args.push(this.primaryWithPostfix());
        }
        return {
          type: 'FunctionCallExpression',
          name,
          args,
          line: token.line,
        };
      }

      // Plain variable reference
      return {
        type: 'VariableReference',
        name,
        line: token.line,
      };
    }

    // Nothing matched
    throw createVSharpError(
      token.line,
      token.col,
      'Invalid Expression',
      `Unexpected "${token.value || 'end of line'}". Expected a value, variable, or text.`,
      'Example: 10, "Hello", or a variable name like score'
    );
  }

  private consumeEndOfStatement(): void {
    if (this.isAtEnd()) return;

    if (this.match('NEWLINE', 'COMMENT')) {
      while (this.match('NEWLINE', 'COMMENT')) {}
      return;
    }

    if (!this.isAtEnd()) {
      const token = this.peek();
      if (token.type !== 'KEYWORD_ELSE' && token.type !== 'KEYWORD_END') {
        throw createVSharpError(
          token.line,
          token.col,
          'Unexpected Extra Code',
          `Unexpected code "${token.value}" after command.`,
          'Put each command on its own separate line.'
        );
      }
    }
  }

  private isAtEndOfStatement(): boolean {
    return (
      this.isAtEnd() ||
      this.check('NEWLINE') ||
      this.check('COMMENT') ||
      this.check('KEYWORD_ELSE') ||
      this.check('KEYWORD_END')
    );
  }

  private match(...types: string[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private check(type: string): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === 'EOF';
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }
}
