import { VSharpError, VSharpStackTraceItem } from './types';

function getLevenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

const KNOWN_COMMANDS = [
  'say',
  'say.hello',
  'say.title',
  'say.line',
  'say.box',
  'math',
  'set',
  'share',
  'use',
  'ask',
  'ask.number',
  'if',
  'else',
  'end',
  'repeat',
  'while',
  'for',
  'in',
  'break',
  'make',
  'give',
  'attempt',
  'recover',
  'when',
  'trigger',
  'random',
  'choose',
  'clear',
  'wait',
  'add',
  'remove',
];

export function findBestCommandMatch(word: string): string | null {
  const lower = word.toLowerCase();

  const directMappings: Record<string, string> = {
    'import': 'use',
    'include': 'use',
    'require': 'use',
    'load': 'use',
    'sayy': 'say',
    'sy': 'say',
    'prnt': 'say',
    'print': 'say',
    'echo': 'say',
    'write': 'say',
    'log': 'say',
    'input': 'ask',
    'prompt': 'ask',
    'function': 'make',
    'def': 'make',
    'fn': 'make',
    'return': 'give',
    'loop': 'repeat',
    'let': 'set',
    'var': 'set',
    'sett': 'set',
    'global': 'share',
    'try': 'attempt',
    'catch': 'recover',
    'except': 'recover',
    'cls': 'clear',
    'sleep': 'wait',
    'delay': 'wait',
    'truee': 'true',
    'falsee': 'false',
    'null': 'nothing',
    'none': 'nothing',
    'nil': 'nothing',
  };

  if (directMappings[lower]) {
    return directMappings[lower];
  }

  let closest: string | null = null;
  let minDistance = 3;

  for (const cmd of KNOWN_COMMANDS) {
    const dist = getLevenshteinDistance(lower, cmd);
    if (dist < minDistance) {
      minDistance = dist;
      closest = cmd;
    }
  }

  return closest;
}

export function createVSharpError(
  line: number,
  col: number,
  title: string,
  message: string,
  suggestion?: string,
  snippet?: string,
  file?: string,
  stack?: VSharpStackTraceItem[]
): VSharpError {
  return {
    line,
    col,
    file,
    title,
    message,
    suggestion,
    snippet,
    stack,
  };
}
