import React from 'react';
import { 
  Play, 
  Square, 
  ArrowRight, 
  CornerDownRight, 
  CircleDot, 
  Layers, 
  ListTree, 
  AlertCircle,
  Hash,
  Type,
  List,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { DebuggerPauseInfo } from '../vsharp/debugger';
import { VSharpValue } from '../vsharp/types';

interface DebuggerPanelProps {
  isDebugging: boolean;
  isPaused: boolean;
  pauseInfo?: DebuggerPauseInfo | null;
  breakpoints: Record<string, number[]>;
  onContinue: () => void;
  onStepOver: () => void;
  onStepInto: () => void;
  onStop: () => void;
  onToggleBreakpoint: (file: string, line: number) => void;
  onSelectStackFrame?: (file: string, line: number) => void;
}

export const DebuggerPanel: React.FC<DebuggerPanelProps> = ({
  isDebugging,
  isPaused,
  pauseInfo,
  breakpoints,
  onContinue,
  onStepOver,
  onStepInto,
  onStop,
  onToggleBreakpoint,
  onSelectStackFrame,
}) => {
  const totalBreakpoints = Object.values(breakpoints).reduce(
    (acc, lines) => acc + lines.length,
    0
  );

  const renderValueBadge = (val: VSharpValue) => {
    if (typeof val === 'number') {
      return (
        <span className="flex items-center gap-1 text-cyan-400 font-mono">
          <Hash className="w-3 h-3 text-cyan-500/70" />
          <span>{val}</span>
        </span>
      );
    }
    if (typeof val === 'string') {
      return (
        <span className="flex items-center gap-1 text-emerald-400 font-mono">
          <Type className="w-3 h-3 text-emerald-500/70" />
          <span>"{val}"</span>
        </span>
      );
    }
    if (typeof val === 'boolean') {
      return (
        <span className="text-amber-400 font-mono">
          {val ? 'true' : 'false'}
        </span>
      );
    }
    if (Array.isArray(val)) {
      return (
        <span className="flex items-center gap-1 text-purple-400 font-mono">
          <List className="w-3 h-3 text-purple-500/70" />
          <span>[{val.map((x) => JSON.stringify(x)).join(', ')}]</span>
        </span>
      );
    }
    return <span className="text-zinc-500">{String(val)}</span>;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#10131b] select-none text-xs text-zinc-300 font-sans">
      {/* Header with Title and Control Toolbar */}
      <div className="p-3 border-b border-white/[0.06] bg-[#0c0e15] space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[11px] text-zinc-200 uppercase tracking-wider">
              V# Debugger
            </span>
            {isDebugging && (
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider font-semibold ${
                  isPaused
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {isPaused ? 'Paused' : 'Running'}
              </span>
            )}
          </div>
        </div>

        {/* Debug Action Buttons */}
        <div className="flex items-center gap-1.5 bg-white/[0.03] p-1 rounded-lg border border-white/[0.04]">
          <button
            onClick={onContinue}
            disabled={!isDebugging || !isPaused}
            title="Continue (F5)"
            className="flex-1 py-1 px-2 rounded flex items-center justify-center gap-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 disabled:opacity-30 disabled:pointer-events-none transition-colors font-medium text-[11px]"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Continue</span>
          </button>

          <button
            onClick={onStepOver}
            disabled={!isDebugging || !isPaused}
            title="Step Over (F10)"
            className="p-1.5 rounded hover:bg-white/[0.08] text-zinc-300 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <ArrowRight className="w-4 h-4 text-cyan-400" />
          </button>

          <button
            onClick={onStepInto}
            disabled={!isDebugging || !isPaused}
            title="Step Into (F11)"
            className="p-1.5 rounded hover:bg-white/[0.08] text-zinc-300 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <CornerDownRight className="w-4 h-4 text-emerald-400" />
          </button>

          <button
            onClick={onStop}
            disabled={!isDebugging}
            title="Stop Debugging (Shift+F5)"
            className="p-1.5 rounded hover:bg-rose-500/20 text-rose-400 disabled:opacity-30 disabled:pointer-events-none transition-colors ml-auto"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
          </button>
        </div>
      </div>

      {/* Main Debugger Views Accordion */}
      <div className="flex-1 overflow-y-auto divide-y divide-white/[0.04]">
        {/* 1. Variables in Scope */}
        <div className="p-3">
          <div className="flex items-center gap-1.5 text-zinc-400 mb-2 font-mono text-[11px] font-semibold uppercase tracking-wider">
            <ListTree className="w-3.5 h-3.5 text-cyan-400" />
            <span>Variables</span>
            {pauseInfo && (
              <span className="ml-auto text-[10px] text-zinc-500">
                {Object.keys(pauseInfo.variables).length} items
              </span>
            )}
          </div>

          {!isDebugging ? (
            <p className="text-[11px] text-zinc-600 italic">
              Start debugging to inspect variables.
            </p>
          ) : !isPaused ? (
            <p className="text-[11px] text-zinc-500 animate-pulse">
              Program running...
            </p>
          ) : pauseInfo && Object.keys(pauseInfo.variables).length > 0 ? (
            <div className="space-y-1.5 font-mono text-[11px]">
              {Object.entries(pauseInfo.variables).map(([name, val]) => (
                <div
                  key={name}
                  className="flex items-baseline justify-between p-1.5 rounded bg-white/[0.02] border border-white/[0.03] hover:border-white/[0.08] transition-colors"
                >
                  <span className="text-zinc-300 font-medium">{name}</span>
                  <div className="max-w-[65%] truncate">
                    {renderValueBadge(val)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-zinc-500">No variables in current scope.</p>
          )}
        </div>

        {/* 2. Call Stack */}
        <div className="p-3">
          <div className="flex items-center gap-1.5 text-zinc-400 mb-2 font-mono text-[11px] font-semibold uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>Call Stack</span>
          </div>

          {isPaused && pauseInfo ? (
            <div className="space-y-1 font-mono text-[11px]">
              {pauseInfo.stack.map((frame, idx) => (
                <div
                  key={frame.id || idx}
                  onClick={() => onSelectStackFrame?.(frame.file, frame.line)}
                  className={`p-2 rounded cursor-pointer transition-colors border ${
                    idx === 0
                      ? 'bg-cyan-500/[0.08] border-cyan-500/30 text-cyan-200'
                      : 'bg-white/[0.02] border-white/[0.03] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-200">
                      {frame.functionName}
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      {frame.file}:{frame.line}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-zinc-600 italic">
              Stack available when paused at a breakpoint.
            </p>
          )}
        </div>

        {/* 3. Breakpoints */}
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-zinc-400 font-mono text-[11px] font-semibold uppercase tracking-wider">
              <CircleDot className="w-3.5 h-3.5 text-rose-400" />
              <span>Breakpoints</span>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">
              {totalBreakpoints} active
            </span>
          </div>

          {totalBreakpoints === 0 ? (
            <div className="text-[11px] text-zinc-500 py-2">
              <p>No breakpoints set.</p>
              <p className="text-zinc-600 mt-1">
                Click in the editor gutter next to any line number to add one.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5 font-mono text-[11px]">
              {Object.entries(breakpoints).map(([file, lines]) =>
                lines.map((lineNum) => (
                  <div
                    key={`${file}-${lineNum}`}
                    className="flex items-center justify-between p-1.5 rounded bg-white/[0.02] border border-white/[0.04] group hover:bg-white/[0.05]"
                  >
                    <div
                      onClick={() => onSelectStackFrame?.(file, lineNum)}
                      className="flex items-center gap-2 cursor-pointer flex-1 truncate"
                    >
                      <CircleDot className="w-3 h-3 text-rose-500 fill-rose-500 shrink-0" />
                      <span className="text-zinc-300 truncate">{file}</span>
                      <span className="text-zinc-500">:{lineNum}</span>
                    </div>
                    <button
                      onClick={() => onToggleBreakpoint(file, lineNum)}
                      title="Remove Breakpoint"
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 text-zinc-500 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
