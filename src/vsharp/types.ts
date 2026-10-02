export type TokenType =
  // Module system
  | 'KEYWORD_USE'
  | 'KEYWORD_AS'
  // Output commands
  | 'KEYWORD_SAY_HELLO'
  | 'KEYWORD_SAY_TITLE'
  | 'KEYWORD_SAY_LINE'
  | 'KEYWORD_SAY_BOX'
  | 'KEYWORD_SAY'
  | 'KEYWORD_MATH'
  | 'KEYWORD_SET'
  | 'KEYWORD_GIVE'
  // Input commands
  | 'KEYWORD_ASK_NUMBER'
  | 'KEYWORD_ASK'
  // Control flow
  | 'KEYWORD_IF'
  | 'KEYWORD_ELSE'
  | 'KEYWORD_END'
  | 'KEYWORD_WHILE'
  | 'KEYWORD_REPEAT'
  | 'KEYWORD_BREAK'
  // Functions
  | 'KEYWORD_MAKE'
  // Utility & Game
  | 'KEYWORD_RANDOM'
  | 'KEYWORD_CHOOSE'
  | 'KEYWORD_CLEAR'
  | 'KEYWORD_WAIT'
  // List operations
  | 'KEYWORD_ADD'
  | 'KEYWORD_TO'
  | 'KEYWORD_REMOVE'
  | 'KEYWORD_FROM'
  // Booleans
  | 'KEYWORD_TRUE'
  | 'KEYWORD_FALSE'
  // Literals & Identifiers
  | 'IDENTIFIER'
  | 'NUMBER'
  | 'STRING'
  // Operators
  | 'PLUS'
  | 'MINUS'
  | 'STAR'
  | 'SLASH'
  | 'PERCENT'
  | 'EQUALS'
  | 'NOT_EQUALS'
  | 'GREATER'
  | 'LESS'
  | 'GREATER_EQUAL'
  | 'LESS_EQUAL'
  // Delimiters
  | 'LPAREN'
  | 'RPAREN'
  | 'LBRACKET'
  | 'RBRACKET'
  | 'COMMA'
  | 'COMMENT'
  | 'NEWLINE'
  | 'EOF';

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  col: number;
}

export interface VSharpError {
  file?: string;
  line: number;
  col: number;
  title: string;
  message: string;
  suggestion?: string;
  snippet?: string;
}

// Runtime Value Types
export type VSharpValue = number | string | boolean | VSharpValue[];

// AST Expressions
export type Expression =
  | NumberLiteral
  | StringLiteral
  | BooleanLiteral
  | ListLiteral
  | VariableReference
  | IndexAccessExpression
  | BinaryExpression
  | GroupingExpression
  | FunctionCallExpression
  | RandomExpression
  | ChooseExpression
  | AskExpression;

export interface NumberLiteral {
  type: 'NumberLiteral';
  value: number;
  line: number;
}

export interface StringLiteral {
  type: 'StringLiteral';
  value: string;
  line: number;
}

export interface BooleanLiteral {
  type: 'BooleanLiteral';
  value: boolean;
  line: number;
}

export interface ListLiteral {
  type: 'ListLiteral';
  elements: Expression[];
  line: number;
}

export interface VariableReference {
  type: 'VariableReference';
  name: string;
  line: number;
}

export interface IndexAccessExpression {
  type: 'IndexAccessExpression';
  target: Expression;
  index: Expression;
  line: number;
}

export interface BinaryExpression {
  type: 'BinaryExpression';
  operator: '+' | '-' | '*' | '/' | '%' | '=' | '!=' | '>' | '<' | '>=' | '<=';
  left: Expression;
  right: Expression;
  line: number;
}

export interface GroupingExpression {
  type: 'GroupingExpression';
  expression: Expression;
  line: number;
}

export interface FunctionCallExpression {
  type: 'FunctionCallExpression';
  name: string;
  args: Expression[];
  line: number;
}

export interface RandomExpression {
  type: 'RandomExpression';
  min: Expression;
  max: Expression;
  line: number;
}

export interface ChooseExpression {
  type: 'ChooseExpression';
  target: Expression;
  line: number;
}

export interface AskExpression {
  type: 'AskExpression';
  prompt: Expression;
  isNumber: boolean;
  line: number;
}

// AST Statements
export type Statement =
  | UseStatement
  | SayHelloStatement
  | SayStatement
  | SayTitleStatement
  | SayLineStatement
  | SayBoxStatement
  | MathStatement
  | SetStatement
  | IfStatement
  | RepeatStatement
  | WhileStatement
  | BreakStatement
  | MakeFunctionStatement
  | GiveStatement
  | FunctionCallStatement
  | AddToListStatement
  | RemoveFromListStatement
  | ClearStatement
  | WaitStatement
  | StandaloneExpressionStatement;

export interface UseStatement {
  type: 'UseStatement';
  moduleName: string;
  alias?: string;
  line: number;
}

export interface SayHelloStatement {
  type: 'SayHelloStatement';
  line: number;
}

export interface SayStatement {
  type: 'SayStatement';
  expression: Expression;
  line: number;
}

export interface SayTitleStatement {
  type: 'SayTitleStatement';
  title: Expression;
  line: number;
}

export interface SayLineStatement {
  type: 'SayLineStatement';
  line: number;
}

export interface SayBoxStatement {
  type: 'SayBoxStatement';
  text: Expression;
  line: number;
}

export interface MathStatement {
  type: 'MathStatement';
  expression: Expression;
  line: number;
}

export interface SetStatement {
  type: 'SetStatement';
  variableName: string;
  expression: Expression;
  line: number;
}

export interface ElseIfClause {
  condition: Expression;
  statements: Statement[];
  line: number;
}

export interface IfStatement {
  type: 'IfStatement';
  condition: Expression;
  thenBranch: Statement[];
  elseIfBranches: ElseIfClause[];
  elseBranch?: Statement[];
  line: number;
}

export interface RepeatStatement {
  type: 'RepeatStatement';
  count: Expression;
  body: Statement[];
  line: number;
}

export interface WhileStatement {
  type: 'WhileStatement';
  condition: Expression;
  body: Statement[];
  line: number;
}

export interface BreakStatement {
  type: 'BreakStatement';
  line: number;
}

export interface MakeFunctionStatement {
  type: 'MakeFunctionStatement';
  name: string;
  parameters: string[];
  body: Statement[];
  line: number;
}

export interface GiveStatement {
  type: 'GiveStatement';
  expression: Expression;
  line: number;
}

export interface FunctionCallStatement {
  type: 'FunctionCallStatement';
  name: string;
  args: Expression[];
  line: number;
}

export interface AddToListStatement {
  type: 'AddToListStatement';
  item: Expression;
  listName: string;
  line: number;
}

export interface RemoveFromListStatement {
  type: 'RemoveFromListStatement';
  item: Expression;
  listName: string;
  line: number;
}

export interface ClearStatement {
  type: 'ClearStatement';
  line: number;
}

export interface WaitStatement {
  type: 'WaitStatement';
  duration: Expression;
  line: number;
}

export interface StandaloneExpressionStatement {
  type: 'StandaloneExpressionStatement';
  expression: Expression;
  line: number;
}

export interface Program {
  statements: Statement[];
}

export interface ConsoleOutputItem {
  id: string;
  type: 'stdout' | 'title' | 'line' | 'box' | 'error' | 'info' | 'input-echo';
  text: string;
  line?: number;
  suggestion?: string;
}

export interface InputRequest {
  id: string;
  prompt: string;
  isNumber: boolean;
  resolve: (answer: string) => void;
}

export interface ExecutionResult {
  success: boolean;
  outputs: ConsoleOutputItem[];
  error?: VSharpError;
  variables: Record<string, VSharpValue>;
  executionTimeMs: number;
  aborted?: boolean;
}
