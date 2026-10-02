import {
  Expression,
  VSharpValue,
  VSharpRecord,
  VSharpError,
  VSharpStackTraceItem,
} from './types';
import { Scope } from './scope';
import { createVSharpError } from './errors';
import { STDLIB_GLOBALS } from './stdlib';

export interface RuntimeContext {
  requestInput: (prompt: string, isNumber: boolean) => Promise<string | number>;
  callFunction: (name: string, args: VSharpValue[], line: number, file?: string) => Promise<VSharpValue>;
  isAborted: () => boolean;
  currentFile?: string;
  getCallStack?: () => VSharpStackTraceItem[];
}

export function isTruthy(val: VSharpValue): boolean {
  if (val === null || val === undefined) return false;
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val !== 0;
  if (typeof val === 'string') return val.length > 0;
  if (Array.isArray(val)) return val.length > 0;
  if (typeof val === 'object') return Object.keys(val).length > 0;
  return true;
}

export async function evaluateExpression(
  expr: Expression,
  scope: Scope,
  ctx: RuntimeContext
): Promise<VSharpValue> {
  if (ctx.isAborted()) {
    throw createVSharpError(
      expr.line,
      1,
      'Program Stopped',
      'Execution was stopped by user.',
      undefined,
      undefined,
      ctx.currentFile,
      ctx.getCallStack?.()
    );
  }

  switch (expr.type) {
    case 'NumberLiteral':
      return expr.value;

    case 'StringLiteral':
      return expr.value;

    case 'BooleanLiteral':
      return expr.value;

    case 'NothingLiteral':
      return null;

    case 'ListLiteral': {
      const items: VSharpValue[] = [];
      for (const el of expr.elements) {
        items.push(await evaluateExpression(el, scope, ctx));
      }
      return items;
    }

    case 'RecordLiteral': {
      const record: VSharpRecord = {};
      for (const prop of expr.properties) {
        record[prop.key] = await evaluateExpression(prop.value, scope, ctx);
      }
      return record;
    }

    case 'VariableReference': {
      return scope.get(expr.name, expr.line, ctx.currentFile);
    }

    case 'PropertyAccessExpression': {
      const targetVal = await evaluateExpression(expr.target, scope, ctx);

      // 1. Records / Maps
      if (targetVal !== null && typeof targetVal === 'object' && !Array.isArray(targetVal)) {
        const record = targetVal as VSharpRecord;
        if (expr.property in record) {
          return record[expr.property];
        }
        // Special record helper properties
        if (expr.property === 'count') {
          return Object.keys(record).length;
        }
        if (expr.property === 'keys') {
          return Object.keys(record);
        }
        return null;
      }

      // 2. Strings
      if (typeof targetVal === 'string') {
        if (expr.property === 'length' || expr.property === 'count') {
          return targetVal.length;
        }
        if (expr.property === 'upper') {
          return targetVal.toUpperCase();
        }
        if (expr.property === 'lower') {
          return targetVal.toLowerCase();
        }
        if (expr.property === 'trim') {
          return targetVal.trim();
        }
      }

      // 3. Lists
      if (Array.isArray(targetVal)) {
        if (expr.property === 'length' || expr.property === 'count') {
          return targetVal.length;
        }
        if (expr.property === 'first') {
          return targetVal.length > 0 ? targetVal[0] : null;
        }
        if (expr.property === 'last') {
          return targetVal.length > 0 ? targetVal[targetVal.length - 1] : null;
        }
      }

      throw createVSharpError(
        expr.line,
        1,
        'Property Access Error',
        `Cannot read property "${expr.property}" from ${targetVal === null ? 'nothing' : typeof targetVal}.`,
        undefined,
        undefined,
        ctx.currentFile,
        ctx.getCallStack?.()
      );
    }

    case 'IndexAccessExpression': {
      const targetVal = await evaluateExpression(expr.target, scope, ctx);
      const indexVal = await evaluateExpression(expr.index, scope, ctx);

      // Record indexing by string: monster["health"]
      if (targetVal !== null && typeof targetVal === 'object' && !Array.isArray(targetVal)) {
        const key = String(indexVal);
        return (targetVal as VSharpRecord)[key] ?? null;
      }

      if (typeof indexVal !== 'number') {
        throw createVSharpError(
          expr.line,
          1,
          'Invalid List Index',
          `List index must be a number, but got "${indexVal}".`,
          'Example: fruits[1]',
          undefined,
          ctx.currentFile,
          ctx.getCallStack?.()
        );
      }

      if (Array.isArray(targetVal)) {
        // Intuitive 1-based indexing for beginners (0 is handled gracefully)
        const idx = Math.floor(indexVal);
        const actualIndex = idx >= 1 ? idx - 1 : idx;

        if (actualIndex < 0 || actualIndex >= targetVal.length) {
          throw createVSharpError(
            expr.line,
            1,
            'List Index Out of Bounds',
            `Item ${idx} does not exist. This list has ${targetVal.length} ${targetVal.length === 1 ? 'item' : 'items'}.`,
            `Valid items are from 1 to ${targetVal.length}.`,
            undefined,
            ctx.currentFile,
            ctx.getCallStack?.()
          );
        }
        return targetVal[actualIndex];
      }

      if (typeof targetVal === 'string') {
        const idx = Math.floor(indexVal);
        const actualIndex = idx >= 1 ? idx - 1 : idx;
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
        'Index access is for lists and records, like fruits[1].',
        undefined,
        ctx.currentFile,
        ctx.getCallStack?.()
      );
    }

    case 'LogicalExpression': {
      const leftVal = await evaluateExpression(expr.left, scope, ctx);
      if (expr.operator === 'and') {
        if (!isTruthy(leftVal)) return false;
        const rightVal = await evaluateExpression(expr.right, scope, ctx);
        return isTruthy(rightVal);
      }
      if (expr.operator === 'or') {
        if (isTruthy(leftVal)) return true;
        const rightVal = await evaluateExpression(expr.right, scope, ctx);
        return isTruthy(rightVal);
      }
      return false;
    }

    case 'NotExpression': {
      const val = await evaluateExpression(expr.expression, scope, ctx);
      return !isTruthy(val);
    }

    case 'GroupingExpression':
      return await evaluateExpression(expr.expression, scope, ctx);

    case 'RandomExpression': {
      const minVal = await evaluateExpression(expr.min, scope, ctx);
      const maxVal = await evaluateExpression(expr.max, scope, ctx);

      if (typeof minVal !== 'number' || typeof maxVal !== 'number') {
        throw createVSharpError(
          expr.line,
          1,
          'Invalid Random Range',
          'Both minimum and maximum values for "random" must be numbers.',
          'Example: random 1 100',
          undefined,
          ctx.currentFile,
          ctx.getCallStack?.()
        );
      }

      const low = Math.min(Math.floor(minVal), Math.floor(maxVal));
      const high = Math.max(Math.floor(minVal), Math.floor(maxVal));
      return Math.floor(Math.random() * (high - low + 1)) + low;
    }

    case 'ChooseExpression': {
      const listVal = await evaluateExpression(expr.target, scope, ctx);
      if (!Array.isArray(listVal)) {
        throw createVSharpError(
          expr.line,
          1,
          'Invalid Choose Target',
          '"choose" must be given a list of options.',
          'Example: choose ["Rock", "Paper", "Scissors"]',
          undefined,
          ctx.currentFile,
          ctx.getCallStack?.()
        );
      }
      if (listVal.length === 0) {
        return '';
      }
      const randomIndex = Math.floor(Math.random() * listVal.length);
      return listVal[randomIndex];
    }

    case 'AskExpression': {
      const promptVal = await evaluateExpression(expr.prompt, scope, ctx);
      const promptStr = String(promptVal);
      return await ctx.requestInput(promptStr, expr.isNumber);
    }

    case 'FunctionCallExpression': {
      const evaluatedArgs: VSharpValue[] = [];
      for (const arg of expr.args) {
        evaluatedArgs.push(await evaluateExpression(arg, scope, ctx));
      }

      // Check standard globals (like round, floor, ceil, power, square_root)
      if (expr.name in STDLIB_GLOBALS) {
        return STDLIB_GLOBALS[expr.name](...evaluatedArgs);
      }

      return await ctx.callFunction(expr.name, evaluatedArgs, expr.line, ctx.currentFile);
    }

    case 'BinaryExpression': {
      const leftVal = await evaluateExpression(expr.left, scope, ctx);
      const rightVal = await evaluateExpression(expr.right, scope, ctx);

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
          `Cannot calculate "${expr.operator}" with text or records.`,
          'Math operations (-, *, /, %) can only be used with numbers.',
          undefined,
          ctx.currentFile,
          ctx.getCallStack?.()
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
            'Check your calculation to make sure the divisor is not 0.',
            undefined,
            ctx.currentFile,
            ctx.getCallStack?.()
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
            'Change the divisor to a non-zero number.',
            undefined,
            ctx.currentFile,
            ctx.getCallStack?.()
          );
        }
        return leftVal % rightVal;
      }

      throw createVSharpError(
        expr.line,
        1,
        'Unknown Operator',
        `Operator "${expr.operator}" is not supported.`,
        undefined,
        undefined,
        ctx.currentFile,
        ctx.getCallStack?.()
      );
    }

    default:
      throw createVSharpError(1, 1, 'Evaluation Error', 'Unknown expression node.');
  }
}
