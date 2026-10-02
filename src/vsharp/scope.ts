import { VSharpValue } from './types';
import { createVSharpError } from './errors';

export class Scope {
  public parent?: Scope;
  public isFunctionScope: boolean;
  public variables: Map<string, VSharpValue> = new Map();
  public name: string;

  constructor(parent?: Scope, isFunctionScope: boolean = false, name: string = 'local') {
    this.parent = parent;
    this.isFunctionScope = isFunctionScope;
    this.name = name;
  }

  // Get root global scope
  public getGlobal(): Scope {
    let current: Scope = this;
    while (current.parent) {
      current = current.parent;
    }
    return current;
  }

  // Check if variable is defined anywhere in the scope chain
  public has(name: string): boolean {
    if (this.variables.has(name)) return true;
    if (this.parent) return this.parent.has(name);
    return false;
  }

  // Get variable value
  public get(name: string, line: number = 1, file?: string): VSharpValue {
    if (this.variables.has(name)) {
      return this.variables.get(name)!;
    }
    if (this.parent) {
      return this.parent.get(name, line, file);
    }
    throw createVSharpError(
      line,
      1,
      'Undefined Variable',
      `The variable "${name}" hasn't been set yet.`,
      `Set it before using it: set ${name} = ...`,
      undefined,
      file
    );
  }

  // Local assignment: set x = value (stays in local function scope by default!)
  public set(name: string, value: VSharpValue): void {
    // If it already exists in the current scope, update it
    if (this.variables.has(name)) {
      this.variables.set(name, value);
      return;
    }

    // If we are in a non-function block (like an if or while inside a function/global),
    // and a parent function/global scope already has it, update it there
    if (!this.isFunctionScope && this.parent && this.parent.has(name)) {
      this.parent.set(name, value);
      return;
    }

    // Otherwise, define it in this local scope
    this.variables.set(name, value);
  }

  // Shared assignment: share x = value (explicitly sets in root project/global scope)
  public share(name: string, value: VSharpValue): void {
    this.getGlobal().variables.set(name, value);
  }

  // Snapshot of all accessible variables (for inspector and autocompletion)
  public getAllVariables(): Record<string, VSharpValue> {
    const vars: Record<string, VSharpValue> = {};
    if (this.parent) {
      Object.assign(vars, this.parent.getAllVariables());
    }
    this.variables.forEach((val, key) => {
      vars[key] = val;
    });
    return vars;
  }
}
