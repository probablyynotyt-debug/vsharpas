import { VSharpProjectConfig, VSharpError } from './types';
import { Lexer } from './lexer';
import { Parser } from './parser';

export const DEFAULT_VPROJ_NAME = 'project.vproj';

export interface ProjectFileItem {
  id: string;
  name: string;
  path: string;
  content: string;
  isFolder?: boolean;
}

export function parseVproj(content: string): VSharpProjectConfig {
  try {
    return JSON.parse(content);
  } catch {
    // Fallback: simple line parser for V# project format
    const lines = content.split('\n');
    const config: VSharpProjectConfig = {
      name: 'V# Project',
      start: 'main.v',
      version: '1.0',
    };
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const colonIdx = trimmed.indexOf(':');
      if (colonIdx !== -1) {
        const key = trimmed.slice(0, colonIdx).trim();
        const val = trimmed.slice(colonIdx + 1).trim().replace(/^["']|["']$/g, '');
        if (key === 'name') config.name = val;
        if (key === 'start') config.start = val;
        if (key === 'version') config.version = val;
      }
    }
    return config;
  }
}

export function serializeVproj(config: VSharpProjectConfig): string {
  return JSON.stringify(config, null, 2);
}

// Multi-file project validator: validates all .v files, checks syntax, reports problems
export function validateProject(files: Record<string, string>): VSharpError[] {
  const problems: VSharpError[] = [];
  const declaredFunctionsByFile: Record<string, Set<string>> = {};

  for (const [filePath, content] of Object.entries(files)) {
    if (!filePath.endsWith('.v') && !filePath.endsWith('.v#')) continue;

    const lexer = new Lexer(content, filePath);
    const { tokens, error: lexErr } = lexer.tokenize();
    if (lexErr) {
      problems.push({ ...lexErr, file: filePath });
      continue;
    }

    const parser = new Parser(tokens, filePath);
    const { program, error: parseErr } = parser.parse();
    if (parseErr) {
      problems.push({ ...parseErr, file: filePath });
      continue;
    }

    // Check module imports existence
    if (program) {
      for (const stmt of program.statements) {
        if (stmt.type === 'UseStatement') {
          const mod = stmt.modulePath.replace(/\.v#?$/, '');
          const std = ['mathTools', 'stringTools', 'randomizer', 'timeTools', 'gameUtils'];
          if (!std.includes(mod)) {
            const possible = [`${mod}.v`, `${mod}.v#`, `modules/${mod}.v`, `${mod}/index.v`];
            const exists = possible.some((p) => p in files);
            if (!exists) {
              problems.push({
                line: stmt.line,
                col: 1,
                file: filePath,
                title: 'Missing Module',
                message: `Module "${mod}.v" does not exist in the project workspace.`,
                suggestion: `Create a file named "${mod}.v".`,
              });
            }
          }
        }
      }
    }
  }

  return problems;
}
