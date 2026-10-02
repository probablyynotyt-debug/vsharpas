import { VSharpValue } from './types';

export interface StackFrame {
  id: string;
  file: string;
  line: number;
  functionName: string;
  variables: Record<string, VSharpValue>;
}

export interface DebuggerPauseInfo {
  file: string;
  line: number;
  reason: 'breakpoint' | 'step' | 'pause';
  stack: StackFrame[];
  variables: Record<string, VSharpValue>;
}

export type DebugStepAction = 'continue' | 'stepOver' | 'stepInto' | 'stop';

export interface DebuggerController {
  isDebugging: boolean;
  isPaused: boolean;
  currentPauseInfo: DebuggerPauseInfo | null;
  breakpoints: Record<string, number[]>; // file -> line[]
  
  // Hooks called by runtime
  shouldPause: (file: string, line: number, stackDepth: number) => boolean;
  onPause: (info: DebuggerPauseInfo) => Promise<DebugStepAction>;
}

export class VSharpDebuggerSession {
  private _isDebugging: boolean = false;
  private _isPaused: boolean = false;
  private _pauseInfo: DebuggerPauseInfo | null = null;
  private _breakpoints: Record<string, number[]> = {};
  private _stepMode: 'none' | 'stepOver' | 'stepInto' | 'continue' = 'none';
  private _targetStackDepth: number = 0;
  private _stepResolver: ((action: DebugStepAction) => void) | null = null;

  constructor(breakpoints: Record<string, number[]> = {}) {
    this._breakpoints = { ...breakpoints };
  }

  get isDebugging(): boolean {
    return this._isDebugging;
  }

  get isPaused(): boolean {
    return this._isPaused;
  }

  get pauseInfo(): DebuggerPauseInfo | null {
    return this._pauseInfo;
  }

  get breakpoints(): Record<string, number[]> {
    return this._breakpoints;
  }

  public setBreakpoints(bps: Record<string, number[]>): void {
    this._breakpoints = { ...bps };
  }

  public toggleBreakpoint(file: string, line: number): void {
    const list = this._breakpoints[file] ? [...this._breakpoints[file]] : [];
    const idx = list.indexOf(line);
    if (idx >= 0) {
      list.splice(idx, 1);
    } else {
      list.push(line);
      list.sort((a, b) => a - b);
    }
    this._breakpoints[file] = list;
  }

  public startDebugging(): void {
    this._isDebugging = true;
    this._isPaused = false;
    this._pauseInfo = null;
    this._stepMode = 'continue';
  }

  public stop(): void {
    this._isDebugging = false;
    this._isPaused = false;
    this._pauseInfo = null;
    this._stepMode = 'none';
    if (this._stepResolver) {
      this._stepResolver('stop');
      this._stepResolver = null;
    }
  }

  public continue(): void {
    if (this._stepResolver) {
      this._isPaused = false;
      this._pauseInfo = null;
      this._stepMode = 'continue';
      const res = this._stepResolver;
      this._stepResolver = null;
      res('continue');
    }
  }

  public stepOver(currentDepth: number): void {
    if (this._stepResolver) {
      this._isPaused = false;
      this._pauseInfo = null;
      this._stepMode = 'stepOver';
      this._targetStackDepth = currentDepth;
      const res = this._stepResolver;
      this._stepResolver = null;
      res('stepOver');
    }
  }

  public stepInto(): void {
    if (this._stepResolver) {
      this._isPaused = false;
      this._pauseInfo = null;
      this._stepMode = 'stepInto';
      const res = this._stepResolver;
      this._stepResolver = null;
      res('stepInto');
    }
  }

  /**
   * Evaluates whether interpreter should pause on this line
   */
  public checkShouldPause(file: string, line: number, stackDepth: number): boolean {
    if (!this._isDebugging) return false;

    // Check hit breakpoint
    const fileBps = this._breakpoints[file] || [];
    if (fileBps.includes(line)) {
      return true;
    }

    // Check stepping condition
    if (this._stepMode === 'stepInto') {
      return true;
    }

    if (this._stepMode === 'stepOver') {
      if (stackDepth <= this._targetStackDepth) {
        return true;
      }
    }

    return false;
  }

  /**
   * Pause execution and wait for user to hit Continue / Step
   */
  public pause(info: DebuggerPauseInfo): Promise<DebugStepAction> {
    this._isPaused = true;
    this._pauseInfo = info;

    return new Promise<DebugStepAction>((resolve) => {
      this._stepResolver = resolve;
    });
  }
}
