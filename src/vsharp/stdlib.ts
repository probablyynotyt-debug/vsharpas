import { VSharpValue, VSharpRecord } from './types';

// Standard Library functions & modules exposed to V#
export const STDLIB_MODULES: Record<string, Record<string, VSharpValue>> = {
  mathTools: {
    round: (n: number) => Math.round(n),
    floor: (n: number) => Math.floor(n),
    ceil: (n: number) => Math.ceil(n),
    absolute: (n: number) => Math.abs(n),
    minimum: (a: number, b: number) => Math.min(a, b),
    maximum: (a: number, b: number) => Math.max(a, b),
    power: (base: number, exp: number) => Math.pow(base, exp),
    square_root: (n: number) => Math.sqrt(n),
    pi: Math.PI,
  },

  stringTools: {
    length: (str: string) => String(str).length,
    upper: (str: string) => String(str).toUpperCase(),
    lower: (str: string) => String(str).toLowerCase(),
    trim: (str: string) => String(str).trim(),
    contains: (str: string, search: string) => String(str).includes(String(search)),
    starts_with: (str: string, prefix: string) => String(str).startsWith(String(prefix)),
    ends_with: (str: string, suffix: string) => String(str).endsWith(String(suffix)),
    replace: (str: string, find: string, replacement: string) =>
      String(str).split(String(find)).join(String(replacement)),
    split: (str: string, delimiter: string) => String(str).split(String(delimiter)),
  },

  randomizer: {
    number: (min: number, max: number) =>
      Math.floor(Math.random() * (Math.max(min, max) - Math.min(min, max) + 1)) + Math.min(min, max),
    chance: (percent: number) => Math.random() * 100 < percent,
  },

  timeTools: {
    now: () => Date.now(),
    today: () => new Date().toLocaleDateString(),
    time_string: () => new Date().toLocaleTimeString(),
  },

  gameUtils: {
    distance: (x1: number, y1: number, x2: number, y2: number) =>
      Math.hypot(x2 - x1, y2 - y1),
    check_box_collision: (
      x1: number,
      y1: number,
      w1: number,
      h1: number,
      x2: number,
      y2: number,
      w2: number,
      h2: number
    ) => x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2,
    clamp: (val: number, min: number, max: number) => Math.max(min, Math.min(max, val)),
  },
};

// Global standard helper functions accessible without module prefix
export const STDLIB_GLOBALS: Record<string, (...args: any[]) => any> = {
  round: (n: number) => Math.round(Number(n)),
  floor: (n: number) => Math.floor(Number(n)),
  ceil: (n: number) => Math.ceil(Number(n)),
  absolute: (n: number) => Math.abs(Number(n)),
  minimum: (a: number, b: number) => Math.min(Number(a), Number(b)),
  maximum: (a: number, b: number) => Math.max(Number(a), Number(b)),
  power: (b: number, e: number) => Math.pow(Number(b), Number(e)),
  square_root: (n: number) => Math.sqrt(Number(n)),
  count: (collection: any) => (Array.isArray(collection) ? collection.length : String(collection).length),
};
