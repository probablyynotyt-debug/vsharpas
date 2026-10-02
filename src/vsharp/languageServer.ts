import { Lexer } from './lexer';
import { Parser } from './parser';
import { VSharpError } from './types';

export interface CompletionItem {
  label: string;
  kind: 'keyword' | 'function' | 'variable' | 'module' | 'snippet';
  detail?: string;
  documentation?: string;
  insertText?: string;
}

export interface HoverInfo {
  title: string;
  description: string;
  syntax?: string;
}

export interface DefinitionLocation {
  file: string;
  line: number;
  col: number;
}

export class VSharpLanguageService {
  /**
   * Built-in keywords and command completions
   */
  private static BUILTIN_COMPLETIONS: CompletionItem[] = [
    {
      label: 'say',
      kind: 'keyword',
      detail: 'say <message>',
      documentation: 'Prints text, numbers, or variable values to the console.',
      insertText: 'say "',
    },
    {
      label: 'say.hello',
      kind: 'keyword',
      detail: 'say.hello',
      documentation: 'Prints a friendly "Hello!" to the console.',
      insertText: 'say.hello',
    },
    {
      label: 'say.title',
      kind: 'keyword',
      detail: 'say.title <text>',
      documentation: 'Prints a prominent header title in the console.',
      insertText: 'say.title "',
    },
    {
      label: 'say.box',
      kind: 'keyword',
      detail: 'say.box <text>',
      documentation: 'Prints a decorative banner box around your message.',
      insertText: 'say.box "',
    },
    {
      label: 'say.line',
      kind: 'keyword',
      detail: 'say.line',
      documentation: 'Draws a divider line across the console.',
      insertText: 'say.line',
    },
    {
      label: 'set',
      kind: 'keyword',
      detail: 'set <variable> = <value>',
      documentation: 'Creates or updates a variable.',
      insertText: 'set ',
    },
    {
      label: 'math',
      kind: 'keyword',
      detail: 'math <expression>',
      documentation: 'Evaluates and prints a mathematical calculation.',
      insertText: 'math ',
    },
    {
      label: 'ask',
      kind: 'keyword',
      detail: 'ask <question>',
      documentation: 'Prompts the user for text input from the console.',
      insertText: 'ask "',
    },
    {
      label: 'ask.number',
      kind: 'keyword',
      detail: 'ask.number <question>',
      documentation: 'Prompts the user for a numeric answer from the console.',
      insertText: 'ask.number "',
    },
    {
      label: 'use',
      kind: 'keyword',
      detail: 'use <module>',
      documentation: 'Loads an external V# module file to reuse functions and values.',
      insertText: 'use ',
    },
    {
      label: 'if',
      kind: 'snippet',
      detail: 'if <condition> ... end',
      documentation: 'Executes a block of code if the condition is true.',
      insertText: 'if \n    \nend',
    },
    {
      label: 'while',
      kind: 'snippet',
      detail: 'while <condition> ... end',
      documentation: 'Loops code repeatedly as long as the condition holds true.',
      insertText: 'while \n    \nend',
    },
    {
      label: 'repeat',
      kind: 'snippet',
      detail: 'repeat <times> ... end',
      documentation: 'Loops code a specific number of times.',
      insertText: 'repeat 5\n    \nend',
    },
    {
      label: 'make',
      kind: 'snippet',
      detail: 'make <name> <params> ... end',
      documentation: 'Defines a custom reusable function.',
      insertText: 'make functionName\n    \nend',
    },
    {
      label: 'give',
      kind: 'keyword',
      detail: 'give <value>',
      documentation: 'Returns a value from inside a function back to the caller.',
      insertText: 'give ',
    },
    {
      label: 'random',
      kind: 'keyword',
      detail: 'random <min> <max>',
      documentation: 'Generates a random whole number between min and max inclusive.',
      insertText: 'random 1 100',
    },
    {
      label: 'choose',
      kind: 'keyword',
      detail: 'choose <list>',
      documentation: 'Picks a random item from a list.',
      insertText: 'choose ',
    },
    {
      label: 'wait',
      kind: 'keyword',
      detail: 'wait <seconds>',
      documentation: 'Pauses execution for a number of seconds.',
      insertText: 'wait 1',
    },
    {
      label: 'clear',
      kind: 'keyword',
      detail: 'clear',
      documentation: 'Clears all messages currently displayed in the console.',
      insertText: 'clear',
    },
    {
      label: 'add',
      kind: 'keyword',
      detail: 'add <item> to <list>',
      documentation: 'Appends an element to the end of a list.',
      insertText: 'add ',
    },
    {
      label: 'remove',
      kind: 'keyword',
      detail: 'remove <item> from <list>',
      documentation: 'Removes the first matching item from a list.',
      insertText: 'remove ',
    },
  ];

  /**
   * Provide completion items at the cursor position
   */
  public static getCompletions(
    code: string,
    offset: number,
    projectFiles?: Record<string, string>
  ): CompletionItem[] {
    const textBefore = code.substring(0, offset);
    const lastWordMatch = textBefore.match(/([a-zA-Z0-9_.]+)$/);
    const lastWord = lastWordMatch ? lastWordMatch[1].toLowerCase() : '';

    const results: CompletionItem[] = [];

    // 1. Built-in keywords and commands
    for (const item of this.BUILTIN_COMPLETIONS) {
      if (!lastWord || item.label.toLowerCase().startsWith(lastWord)) {
        results.push(item);
      }
    }

    // 2. Discover local variables from 'set x = ...'
    const varMatches = code.matchAll(/\bset\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=/g);
    const seenVars = new Set<string>();
    for (const m of varMatches) {
      const varName = m[1];
      if (!seenVars.has(varName)) {
        seenVars.add(varName);
        if (!lastWord || varName.toLowerCase().startsWith(lastWord)) {
          results.push({
            label: varName,
            kind: 'variable',
            detail: `variable ${varName}`,
            documentation: 'User-defined variable.',
            insertText: varName,
          });
        }
      }
    }

    // 3. Discover declared functions: make <funcName> <param>*
    const funcMatches = code.matchAll(/\bmake\s+([a-zA-Z_][a-zA-Z0-9_]*)(.*)$/gm);
    const seenFuncs = new Set<string>();
    for (const m of funcMatches) {
      const funcName = m[1];
      const params = m[2].trim();
      if (!seenFuncs.has(funcName)) {
        seenFuncs.add(funcName);
        if (!lastWord || funcName.toLowerCase().startsWith(lastWord)) {
          results.push({
            label: funcName,
            kind: 'function',
            detail: `make ${funcName} ${params}`,
            documentation: 'User-defined function.',
            insertText: funcName,
          });
        }
      }
    }

    // 4. Discover project modules and their exported functions
    if (projectFiles) {
      for (const fileName of Object.keys(projectFiles)) {
        const cleanName = fileName.replace(/\.v#?$/, '');
        if (!lastWord || cleanName.toLowerCase().startsWith(lastWord)) {
          results.push({
            label: cleanName,
            kind: 'module',
            detail: `module "${fileName}"`,
            documentation: `Project module file. Load with: use ${cleanName}`,
            insertText: cleanName,
          });
        }

        // Functions in other files
        const fileContent = projectFiles[fileName];
        const extFuncMatches = fileContent.matchAll(/\bmake\s+([a-zA-Z_][a-zA-Z0-9_]*)(.*)$/gm);
        for (const m of extFuncMatches) {
          const fnName = m[1];
          const params = m[2].trim();
          if (!seenFuncs.has(fnName)) {
            seenFuncs.add(fnName);
            if (!lastWord || fnName.toLowerCase().startsWith(lastWord)) {
              results.push({
                label: fnName,
                kind: 'function',
                detail: `make ${fnName} ${params} (from ${cleanName})`,
                documentation: `Exported function from module ${cleanName}.`,
                insertText: fnName,
              });
            }
          }
        }
      }
    }

    return results;
  }

  /**
   * Lint and check syntax diagnostics for a file
   */
  public static getDiagnostics(code: string, fileName?: string): VSharpError[] {
    const lexer = new Lexer(code);
    const lexResult = lexer.tokenize();
    if (lexResult.error) {
      return [{ ...lexResult.error, file: fileName }];
    }

    const parser = new Parser(lexResult.tokens);
    const parseResult = parser.parse();
    if (parseResult.error) {
      return [{ ...parseResult.error, file: fileName }];
    }

    return [];
  }

  /**
   * Hover documentation tooltip helper
   */
  public static getHover(code: string, offset: number): HoverInfo | null {
    const textBefore = code.substring(0, offset);
    const textAfter = code.substring(offset);
    const matchBefore = textBefore.match(/([a-zA-Z0-9_.]+)$/)?.[1] || '';
    const matchAfter = textAfter.match(/^([a-zA-Z0-9_.]*)/)?.[1] || '';
    const word = (matchBefore + matchAfter).trim();

    if (!word) return null;

    const builtin = this.BUILTIN_COMPLETIONS.find(
      (b) => b.label === word || b.label === word.toLowerCase()
    );
    if (builtin) {
      return {
        title: builtin.label,
        description: builtin.documentation || '',
        syntax: builtin.detail,
      };
    }

    return null;
  }
}
