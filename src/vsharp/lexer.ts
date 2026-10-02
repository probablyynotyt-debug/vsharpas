import { Token, TokenType, VSharpError } from './types';
import { createVSharpError } from './errors';

export class Lexer {
  private source: string;
  private pos: number = 0;
  private line: number = 1;
  private col: number = 1;

  constructor(source: string) {
    this.source = source;
  }

  tokenize(): { tokens: Token[]; error?: VSharpError } {
    const tokens: Token[] = [];

    while (this.pos < this.source.length) {
      const char = this.source[this.pos];

      // Newlines
      if (char === '\n') {
        tokens.push({
          type: 'NEWLINE',
          value: '\n',
          line: this.line,
          col: this.col,
        });
        this.advance();
        this.line++;
        this.col = 1;
        continue;
      }

      // Carriage return
      if (char === '\r') {
        this.advance();
        continue;
      }

      // Skip whitespace
      if (char === ' ' || char === '\t') {
        this.advance();
        continue;
      }

      // Comments: # until end of line
      if (char === '#') {
        let commentText = '';
        const startCol = this.col;
        while (this.pos < this.source.length && this.source[this.pos] !== '\n') {
          commentText += this.source[this.pos];
          this.advance();
        }
        tokens.push({
          type: 'COMMENT',
          value: commentText,
          line: this.line,
          col: startCol,
        });
        continue;
      }

      // Brackets, Parentheses, Commas
      if (char === '[') {
        tokens.push({ type: 'LBRACKET', value: '[', line: this.line, col: this.col });
        this.advance();
        continue;
      }
      if (char === ']') {
        tokens.push({ type: 'RBRACKET', value: ']', line: this.line, col: this.col });
        this.advance();
        continue;
      }
      if (char === '(') {
        tokens.push({ type: 'LPAREN', value: '(', line: this.line, col: this.col });
        this.advance();
        continue;
      }
      if (char === ')') {
        tokens.push({ type: 'RPAREN', value: ')', line: this.line, col: this.col });
        this.advance();
        continue;
      }
      if (char === ',') {
        tokens.push({ type: 'COMMA', value: ',', line: this.line, col: this.col });
        this.advance();
        continue;
      }

      // Two-character operators (!=, >=, <=)
      if (char === '!' && this.peekNext() === '=') {
        tokens.push({ type: 'NOT_EQUALS', value: '!=', line: this.line, col: this.col });
        this.advance();
        this.advance();
        continue;
      }
      if (char === '>' && this.peekNext() === '=') {
        tokens.push({ type: 'GREATER_EQUAL', value: '>=', line: this.line, col: this.col });
        this.advance();
        this.advance();
        continue;
      }
      if (char === '<' && this.peekNext() === '=') {
        tokens.push({ type: 'LESS_EQUAL', value: '<=', line: this.line, col: this.col });
        this.advance();
        this.advance();
        continue;
      }

      // Single-character comparison / assignment operators
      if (char === '>') {
        tokens.push({ type: 'GREATER', value: '>', line: this.line, col: this.col });
        this.advance();
        continue;
      }
      if (char === '<') {
        tokens.push({ type: 'LESS', value: '<', line: this.line, col: this.col });
        this.advance();
        continue;
      }
      if (char === '=') {
        tokens.push({ type: 'EQUALS', value: '=', line: this.line, col: this.col });
        this.advance();
        continue;
      }

      // Math operators
      if (char === '+') {
        tokens.push({ type: 'PLUS', value: '+', line: this.line, col: this.col });
        this.advance();
        continue;
      }
      if (char === '-') {
        tokens.push({ type: 'MINUS', value: '-', line: this.line, col: this.col });
        this.advance();
        continue;
      }
      if (char === '*') {
        tokens.push({ type: 'STAR', value: '*', line: this.line, col: this.col });
        this.advance();
        continue;
      }
      if (char === '/') {
        tokens.push({ type: 'SLASH', value: '/', line: this.line, col: this.col });
        this.advance();
        continue;
      }
      if (char === '%') {
        tokens.push({ type: 'PERCENT', value: '%', line: this.line, col: this.col });
        this.advance();
        continue;
      }

      // Strings (double quotes)
      if (char === '"') {
        const startLine = this.line;
        const startCol = this.col;
        this.advance(); // Skip opening quote
        let strVal = '';
        let closed = false;

        while (this.pos < this.source.length) {
          const c = this.source[this.pos];
          if (c === '\n') {
            break; // Unterminated string on current line
          }
          if (c === '"') {
            closed = true;
            this.advance(); // Skip closing quote
            break;
          }
          // Escape sequences: \n, \t, \", \\
          if (c === '\\' && this.pos + 1 < this.source.length) {
            this.advance();
            const nextC = this.source[this.pos];
            if (nextC === 'n') strVal += '\n';
            else if (nextC === 't') strVal += '\t';
            else if (nextC === '"') strVal += '"';
            else if (nextC === '\\') strVal += '\\';
            else strVal += nextC;
            this.advance();
            continue;
          }
          strVal += c;
          this.advance();
        }

        if (!closed) {
          return {
            tokens,
            error: createVSharpError(
              startLine,
              startCol,
              'Unclosed String',
              'Unclosed text quote. Text strings must end with a matching closing quote (").',
              'Add a closing quote: "' + strVal + '"'
            ),
          };
        }

        tokens.push({
          type: 'STRING',
          value: strVal,
          line: startLine,
          col: startCol,
        });
        continue;
      }

      // Numbers
      if (this.isDigit(char)) {
        const startCol = this.col;
        let numStr = '';
        let hasDot = false;

        while (this.pos < this.source.length) {
          const c = this.source[this.pos];
          if (this.isDigit(c)) {
            numStr += c;
            this.advance();
          } else if (c === '.' && !hasDot && this.isDigit(this.peekNext())) {
            hasDot = true;
            numStr += c;
            this.advance();
          } else {
            break;
          }
        }

        tokens.push({
          type: 'NUMBER',
          value: numStr,
          line: this.line,
          col: startCol,
        });
        continue;
      }

      // Identifiers & Keywords
      if (this.isAlpha(char)) {
        const startCol = this.col;
        let ident = '';

        while (this.pos < this.source.length) {
          const c = this.source[this.pos];
          if (this.isAlphaNumeric(c) || c === '_' || c === '.') {
            ident += c;
            this.advance();
          } else {
            break;
          }
        }

        // Keywords mapping
        const keywordType = this.getKeywordType(ident);
        if (keywordType) {
          tokens.push({
            type: keywordType,
            value: ident,
            line: this.line,
            col: startCol,
          });
        } else {
          tokens.push({
            type: 'IDENTIFIER',
            value: ident,
            line: this.line,
            col: startCol,
          });
        }
        continue;
      }

      // Unexpected character
      return {
        tokens,
        error: createVSharpError(
          this.line,
          this.col,
          'Unexpected Character',
          `V# encountered an unexpected character: "${char}".`,
          'Try removing this character or wrapping text in quotes like "Hello".'
        ),
      };
    }

    tokens.push({
      type: 'EOF',
      value: '',
      line: this.line,
      col: this.col,
    });

    return { tokens };
  }

  private getKeywordType(ident: string): TokenType | null {
    switch (ident) {
      case 'use':
        return 'KEYWORD_USE';
      case 'as':
        return 'KEYWORD_AS';
      case 'say.hello':
        return 'KEYWORD_SAY_HELLO';
      case 'say.title':
        return 'KEYWORD_SAY_TITLE';
      case 'say.line':
        return 'KEYWORD_SAY_LINE';
      case 'say.box':
        return 'KEYWORD_SAY_BOX';
      case 'say':
        return 'KEYWORD_SAY';
      case 'math':
        return 'KEYWORD_MATH';
      case 'set':
        return 'KEYWORD_SET';
      case 'give':
        return 'KEYWORD_GIVE';
      case 'ask.number':
        return 'KEYWORD_ASK_NUMBER';
      case 'ask':
        return 'KEYWORD_ASK';
      case 'if':
        return 'KEYWORD_IF';
      case 'else':
        return 'KEYWORD_ELSE';
      case 'end':
        return 'KEYWORD_END';
      case 'while':
        return 'KEYWORD_WHILE';
      case 'repeat':
        return 'KEYWORD_REPEAT';
      case 'break':
        return 'KEYWORD_BREAK';
      case 'make':
        return 'KEYWORD_MAKE';
      case 'random':
        return 'KEYWORD_RANDOM';
      case 'choose':
        return 'KEYWORD_CHOOSE';
      case 'clear':
        return 'KEYWORD_CLEAR';
      case 'wait':
        return 'KEYWORD_WAIT';
      case 'add':
        return 'KEYWORD_ADD';
      case 'to':
        return 'KEYWORD_TO';
      case 'remove':
        return 'KEYWORD_REMOVE';
      case 'from':
        return 'KEYWORD_FROM';
      case 'true':
        return 'KEYWORD_TRUE';
      case 'false':
        return 'KEYWORD_FALSE';
      default:
        return null;
    }
  }

  private advance(): void {
    this.pos++;
    this.col++;
  }

  private peekNext(): string {
    if (this.pos + 1 < this.source.length) {
      return this.source[this.pos + 1];
    }
    return '';
  }

  private isDigit(char: string): boolean {
    return char >= '0' && char <= '9';
  }

  private isAlpha(char: string): boolean {
    return (
      (char >= 'a' && char <= 'z') ||
      (char >= 'A' && char <= 'Z') ||
      char === '_'
    );
  }

  private isAlphaNumeric(char: string): boolean {
    return this.isAlpha(char) || this.isDigit(char);
  }
}
