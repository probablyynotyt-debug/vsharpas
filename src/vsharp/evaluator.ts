import { Expression, VSharpValue } from './types';
import { createVSharpError } from './errors';
import { Lexer } from './lexer';
import { Parser } from './parser';

export interface RuntimeContext {
  requestInput: (prompt: string, isNumber: boolean) => Promise<string | number>;
  callFunction: (name: string, args: VSharpValue[], line: number) => Promise<VSharpValue>;
  isAborted: () => boolean;
}

function formatValue(val: VSharpValue): string {
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (Array.isArray(val)) {
    return '[' + val.map(formatValue).join(', ') + ']';
  }
  return String(val);
}

export async function evaluateExpression(
  expr: Expression,
  env: Record<string, VSharpValue>,
  ctx: RuntimeContext
): Promise<VSharpValue> {
  if (ctx.isAborted()) {
    throw createVSharpError(expr.line, 1, 'Program Stopped', 'Execution was stopped by user.');
  }

  switch (expr.type) {
    case 'NumberLiteral':
      return expr.value;

    case 'StringLiteral': {
      const text = expr.value;
      if (!text.includes('{') || !text.includes('}')) {
        return text;
      }

      // Explicit variable/expression interpolation {varName}
      const braceRegex = /\{([^{}]+)\}/g;
      let result = '';
      let lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = braceRegex.exec(text)) !== null) {
        result += text.slice(lastIndex, match.index);
        const inner = match[1].trim();

        // 1. Direct variable lookup
        if (Object.prototype.hasOwnProperty.call(env, inner)) {
          result += formatValue(env[inner]);
        } else {
          // 2. Try evaluating expression inside { ... }
          try {
            const innerTokens = new Lexer(inner).tokenize().tokens;
            if (innerTokens.length > 0 && innerTokens[0].type !== 'EOF') {
              const innerAst = new Parser(innerTokens).expression();
              const evalVal = await evaluateExpression(innerAst, env, ctx);
              result += formatValue(evalVal);
            } else {
              result += match[0];
            }
          } catch {
            result += match[0];
          }
        }
        lastIndex = braceRegex.lastIndex;
      }
      result += text.slice(lastIndex);
      return result;
    }

    case 'BooleanLiteral':
      return expr.value;

    case 'ListLiteral': {
      const items: VSharpValue[] = [];
      for (const el of expr.elements) {
        items.push(await evaluateExpression(el, env, ctx));
      }
      return items;
    }

    case 'VariableReference': {
      if (Object.prototype.hasOwnProperty.call(env, expr.name)) {
        return env[expr.name];
      }
      throw createVSharpError(
        expr.line,
        1,
        'Undefined Variable',
        `The variable "${expr.name}" hasn't been set yet.`,
        `Set it before using it: set ${expr.name} = 100`
      );
    }

    case 'IndexAccessExpression': {
      const targetVal = await evaluateExpression(expr.target, env, ctx);
      const indexVal = await evaluateExpression(expr.index, env, ctx);

      if (typeof indexVal !== 'number') {
        throw createVSharpError(
          expr.line,
          1,
          'Invalid List Index',
          `List index must be a number, but got "${indexVal}".`,
          'Example: fruits[1]'
        );
      }

      if (Array.isArray(targetVal)) {
        // Intuitive 1-based indexing for beginners (also handle 0 gracefully)
        const idx = Math.floor(indexVal);
        let actualIndex = idx >= 1 ? idx - 1 : idx;

        if (actualIndex < 0 || actualIndex >= targetVal.length) {
          throw createVSharpError(
            expr.line,
            1,
            'List Index Out of Bounds',
            `Item ${idx} does not exist. This list has ${targetVal.length} ${targetVal.length === 1 ? 'item' : 'items'}.`,
            `Valid items are from 1 to ${targetVal.length}.`
          );
        }
        return targetVal[actualIndex];
      }

      if (typeof targetVal === 'string') {
        const idx = Math.floor(indexVal);
        let actualIndex = idx >= 1 ? idx - 1 : idx;
        if (actualIndex < 0 || actualIndex >= targetVal.length) {
          return '';
        }
        return targetVal[actualIndex];
      }

      throw createVSharpError(
        expr.line,
        1,
        'Cannot Index Non-List',
        `Cannot get an item from ${typeof targetVal}.`,
        'Index access is for lists, like fruits[1].'
      );
    }

    case 'GroupingExpression':
      return await evaluateExpression(expr.expression, env, ctx);

    case 'RandomExpression': {
      const minVal = await evaluateExpression(expr.min, env, ctx);
      const maxVal = await evaluateExpression(expr.max, env, ctx);

      if (typeof minVal !== 'number' || typeof maxVal !== 'number') {
        throw createVSharpError(
          expr.line,
          1,
          'Invalid Random Range',
          'Both minimum and maximum values for "random" must be numbers.',
          'Example: random 1 100'
        );
      }

      const low = Math.min(Math.floor(minVal), Math.floor(maxVal));
      const high = Math.max(Math.floor(minVal), Math.floor(maxVal));
      return Math.floor(Math.random() * (high - low + 1)) + low;
    }

    case 'ChooseExpression': {
      const targetVal = await evaluateExpression(expr.target, env, ctx);
      if (!Array.isArray(targetVal)) {
        throw createVSharpError(
          expr.line,
          1,
          'Cannot Choose From Non-List',
          'The "choose" command requires a list of items.',
          'Example: choose ["Dragon", "Wizard", "Knight"]'
        );
      }

      if (targetVal.length === 0) {
        throw createVSharpError(
          expr.line,
          1,
          'Empty List',
          'Cannot choose from an empty list.',
          'Make sure the list has at least one item.'
        );
      }

      const randIndex = Math.floor(Math.random() * targetVal.length);
      return targetVal[randIndex];
    }

    case 'AskExpression': {
      const promptVal = await evaluateExpression(expr.prompt, env, ctx);
      const promptStr = String(promptVal);
      const answer = await ctx.requestInput(promptStr, expr.isNumber);
      return answer;
    }

    case 'FunctionCallExpression': {
      const evaluatedArgs: VSharpValue[] = [];
      for (const arg of expr.args) {
        evaluatedArgs.push(await evaluateExpression(arg, env, ctx));
      }
      return await ctx.callFunction(expr.name, evaluatedArgs, expr.line);
    }

    case 'BinaryExpression': {
      const leftVal = await evaluateExpression(expr.left, env, ctx);
      const rightVal = await evaluateExpression(expr.right, env, ctx);

      // Equality comparison: '=' or '!='
      if (expr.operator === '=') {
        return leftVal === rightVal;
      }
      if (expr.operator === '!=') {
        return leftVal !== rightVal;
      }

      // Relational comparisons: >, <, >=, <=
      if (
        expr.operator === '>' ||
        expr.operator === '<' ||
        expr.operator === '>=' ||
        expr.operator === '<='
      ) {
        if (typeof leftVal === 'number' && typeof rightVal === 'number') {
          if (expr.operator === '>') return leftVal > rightVal;
          if (expr.operator === '<') return leftVal < rightVal;
          if (expr.operator === '>=') return leftVal >= rightVal;
          if (expr.operator === '<=') return leftVal <= rightVal;
        }
        if (typeof leftVal === 'string' && typeof rightVal === 'string') {
          if (expr.operator === '>') return leftVal > rightVal;
          if (expr.operator === '<') return leftVal < rightVal;
          if (expr.operator === '>=') return leftVal >= rightVal;
          if (expr.operator === '<=') return leftVal <= rightVal;
        }
        return false;
      }

      // Addition '+' (Math addition, String concatenation, or List concatenation)
      if (expr.operator === '+') {
        if (typeof leftVal === 'string' || typeof rightVal === 'string') {
          return String(leftVal) + String(rightVal);
        }
        if (Array.isArray(leftVal) && Array.isArray(rightVal)) {
          return [...leftVal, ...rightVal];
        }
        if (typeof leftVal === 'number' && typeof rightVal === 'number') {
          return leftVal + rightVal;
        }
        return String(leftVal) + String(rightVal);
      }

      // Arithmetic: -, *, /, % require numbers
      if (typeof leftVal !== 'number' || typeof rightVal !== 'number') {
        throw createVSharpError(
          expr.line,
          1,
          'Invalid Math on Non-Numbers',
          `Cannot calculate "${expr.operator}" with text or lists.`,
          'Math operations (-, *, /, %) can only be used with numbers.'
        );
      }

      if (expr.operator === '-') {
        return leftVal - rightVal;
      }

      if (expr.operator === '*') {
        return leftVal * rightVal;
      }

      if (expr.operator === '/') {
        if (rightVal === 0) {
          throw createVSharpError(
            expr.line,
            1,
            'Division by Zero',
            'Cannot divide a number by zero.',
            'Check your calculation to make sure the divisor is not 0.'
          );
        }
        return leftVal / rightVal;
      }

      if (expr.operator === '%') {
        if (rightVal === 0) {
          throw createVSharpError(
            expr.line,
            1,
            'Modulo by Zero',
            'Cannot calculate remainder with a divisor of zero.',
            'Change the divisor to a non-zero number.'
          );
        }
        return leftVal % rightVal;
      }

      throw createVSharpError(
        expr.line,
        1,
        'Unknown Operator',
        `Operator "${expr.operator}" is not supported.`
      );
    }

    default:
      throw createVSharpError(1, 1, 'Evaluation Error', 'Unknown expression node.');
  }
}
