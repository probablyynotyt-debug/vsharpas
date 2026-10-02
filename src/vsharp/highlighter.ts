export interface HighlightToken {
  type: 'keyword' | 'string' | 'number' | 'comment' | 'operator' | 'identifier' | 'text' | 'boolean';
  text: string;
}

const KEYWORDS = new Set([
  'use',
  'as',
  'say.hello',
  'say.title',
  'say.line',
  'say.box',
  'say',
  'math',
  'set',
  'give',
  'ask.number',
  'ask',
  'if',
  'else',
  'end',
  'while',
  'repeat',
  'break',
  'make',
  'random',
  'choose',
  'clear',
  'wait',
  'add',
  'to',
  'remove',
  'from',
]);

export function highlightVSharpLine(lineText: string): HighlightToken[] {
  const tokens: HighlightToken[] = [];
  let i = 0;

  while (i < lineText.length) {
    const char = lineText[i];

    // Check comment: # to end of line
    if (char === '#') {
      tokens.push({
        type: 'comment',
        text: lineText.slice(i),
      });
      break;
    }

    // Check string: "..."
    if (char === '"') {
      let str = '"';
      i++;
      while (i < lineText.length) {
        if (lineText[i] === '\\' && i + 1 < lineText.length) {
          str += lineText[i] + lineText[i + 1];
          i += 2;
          continue;
        }
        str += lineText[i];
        if (lineText[i] === '"') {
          i++;
          break;
        }
        i++;
      }
      tokens.push({
        type: 'string',
        text: str,
      });
      continue;
    }

    // Check number
    if (char >= '0' && char <= '9') {
      let num = '';
      while (i < lineText.length && ((lineText[i] >= '0' && lineText[i] <= '9') || lineText[i] === '.')) {
        num += lineText[i];
        i++;
      }
      tokens.push({
        type: 'number',
        text: num,
      });
      continue;
    }

    // Check words (keywords or identifiers)
    if ((char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || char === '_') {
      let word = '';
      while (
        i < lineText.length &&
        ((lineText[i] >= 'a' && lineText[i] <= 'z') ||
          (lineText[i] >= 'A' && lineText[i] <= 'Z') ||
          (lineText[i] >= '0' && lineText[i] <= '9') ||
          lineText[i] === '_' ||
          lineText[i] === '.')
      ) {
        word += lineText[i];
        i++;
      }

      if (word === 'true' || word === 'false') {
        tokens.push({
          type: 'boolean',
          text: word,
        });
      } else if (KEYWORDS.has(word)) {
        tokens.push({
          type: 'keyword',
          text: word,
        });
      } else {
        tokens.push({
          type: 'identifier',
          text: word,
        });
      }
      continue;
    }

    // Multi-character operators: !=, >=, <=
    if (i + 1 < lineText.length) {
      const two = lineText.slice(i, i + 2);
      if (two === '!=' || two === '>=' || two === '<=') {
        tokens.push({
          type: 'operator',
          text: two,
        });
        i += 2;
        continue;
      }
    }

    // Single-character operators & delimiters
    if ('+-*/%=><()[],'.includes(char)) {
      tokens.push({
        type: 'operator',
        text: char,
      });
      i++;
      continue;
    }

    // Whitespace or other characters
    tokens.push({
      type: 'text',
      text: char,
    });
    i++;
  }

  return tokens;
}
