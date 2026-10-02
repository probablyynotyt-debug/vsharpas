import React, { useRef, useEffect, useState } from 'react';
import { 
  Play, 
  Square,
  Trash2, 
  Terminal, 
  AlertCircle, 
  ChevronUp, 
  ChevronDown, 
  Lightbulb,
  CheckCircle2,
  CornerDownLeft,
  CircleDot
} from 'lucide-react';
import { ConsoleOutputItem, VSharpError, InputRequest } from '../vsharp/types';

interface ConsoleProps {
  outputs: ConsoleOutputItem[];
  error?: VSharpError;
  onClear: () => void;
  onRun: () => void;
  onStop?: () => void;
  isRunning?: boolean;
  activeInputRequest?: InputRequest | null;
  onInputSubmit?: (val: string) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
  executionTimeMs?: number;
  lastRunSuccess?: boolean | null;
}

export const Console: React.FC<ConsoleProps> = ({
  outputs,
  error,
  onClear,
  onRun,
  onStop,
  isRunning = false,
  activeInputRequest = null,
  onInputSubmit,
  isOpen,
  onToggleOpen,
  executionTimeMs,
  lastRunSuccess,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputText, setInputText] = useState('');

  // Auto-scroll on new output or when input prompt appears
  useEffect(() => {
    if (scrollRef.current && isOpen) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [outputs, activeInputRequest, isOpen]);

  // Focus input field when waiting for input
  useEffect(() => {
    if (activeInputRequest && inputRef.current) {
      inputRef.current.focus();
    }
  }, [activeInputRequest]);

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInputRequest || !onInputSubmit) return;
    const value = inputText;
    setInputText('');
    onInputSubmit(value);
  };

  return (
    <div className={`bg-[#0a0c10] border-t border-white/[0.08] flex flex-col shrink-0 select-none z-10 transition-all duration-150 ${
      isOpen ? 'h-64 sm:h-72' : 'h-8'
    }`}>
      {/* Console Header Bar */}
      <div className="h-8 px-3 bg-[#0d1017] border-b border-white/[0.04] flex items-center justify-between text-xs text-zinc-400 shrink-0">
        {/* Left: Tab Title & Status */}
        <div 
          onClick={onToggleOpen}
          className="flex items-center gap-2 cursor-pointer hover:text-zinc-200 transition-colors"
        >
          <button className="text-zinc-500 hover:text-zinc-300">
            {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
          <div className="flex items-center gap-1.5 font-semibold text-zinc-200 text-[11px] tracking-wider uppercase">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>V# Console</span>
          </div>

          {isRunning && (
            <span className="flex items-center gap-1.5 text-[11px] text-cyan-400 font-mono ml-2 animate-pulse">
              <CircleDot className="w-3 h-3" />
              <span>{activeInputRequest ? 'Waiting for Player...' : 'Running...'}</span>
            </span>
          )}

          {!isRunning && lastRunSuccess === true && (
            <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono ml-2">
              <CheckCircle2 className="w-3 h-3" />
              <span>Finished in {executionTimeMs}ms</span>
            </span>
          )}

          {!isRunning && lastRunSuccess === false && (
            <span className="flex items-center gap-1 text-[11px] text-rose-400 font-mono ml-2">
              <AlertCircle className="w-3 h-3" />
              <span>Error</span>
            </span>
          )}
        </div>

        {/* Right: Actions (Run, Stop, Clear, Collapse) */}
        <div className="flex items-center gap-2">
          {/* Run or Stop Button */}
          {isRunning ? (
            <button
              onClick={onStop}
              title="Stop Program"
              className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/50 text-rose-300 text-xs font-semibold rounded transition-colors active:scale-95"
            >
              <Square className="w-3 h-3 fill-current text-rose-400" />
              <span>Stop</span>
            </button>
          ) : (
            <button
              onClick={onRun}
              title="Run Code (Ctrl + Enter)"
              className="flex items-center gap-1.5 px-3 py-1 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 text-xs font-semibold rounded transition-colors active:scale-95"
            >
              <Play className="w-3 h-3 fill-current text-cyan-400" />
              <span>Run</span>
              <kbd className="hidden sm:inline-block ml-1 text-[9px] px-1 py-0.2 bg-cyan-900/40 border border-cyan-500/30 rounded text-cyan-300/80 font-mono">
                Ctrl+↵
              </kbd>
            </button>
          )}

          {/* Clear Button */}
          <button
            onClick={onClear}
            title="Clear Console"
            className="p-1 rounded text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.05] transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Output Content Area */}
      {isOpen && (
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-3 font-mono text-xs select-text bg-[#090b0f] text-zinc-200 space-y-1.5"
        >
          {outputs.length === 0 && !activeInputRequest && (
            <div className="h-full flex flex-col items-center justify-center text-center text-zinc-600 select-none py-6">
              <p className="text-xs">V# Console Ready.</p>
              <p className="text-[11px] text-zinc-600 mt-1">
                Click <span className="text-cyan-400 font-medium">Run</span> or press <kbd className="text-[10px] px-1 py-0.5 bg-white/[0.05] rounded border border-white/[0.1]">Ctrl + Enter</kbd> to execute your V# code.
              </p>
            </div>
          )}

          {/* Output Items */}
          {outputs.map((item) => {
            // Formatted Title
            if (item.type === 'title') {
              return (
                <div key={item.id} className="py-2 text-center select-none">
                  <div className="inline-block px-4 py-1 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-bold tracking-widest text-sm uppercase">
                    ★ {item.text} ★
                  </div>
                </div>
              );
            }

            // Formatted Line
            if (item.type === 'line') {
              return (
                <div key={item.id} className="py-1 text-zinc-700 select-none overflow-hidden">
                  ────────────────────────────────────────────────────────────
                </div>
              );
            }

            // Formatted Box
            if (item.type === 'box') {
              const borderLen = Math.max(item.text.length + 4, 24);
              const topBorder = '┌' + '─'.repeat(borderLen) + '┐';
              const bottomBorder = '└' + '─'.repeat(borderLen) + '┘';
              const paddedText = '│  ' + item.text.padEnd(borderLen - 4, ' ') + '  │';

              return (
                <div key={item.id} className="my-1.5 font-mono text-cyan-300/90 leading-tight select-none">
                  <div>{topBorder}</div>
                  <div className="font-semibold text-zinc-100">{paddedText}</div>
                  <div>{bottomBorder}</div>
                </div>
              );
            }

            // Input Echo (What user typed)
            if (item.type === 'input-echo') {
              return (
                <div key={item.id} className="flex items-baseline gap-2 text-cyan-300 pl-4 py-0.5 font-mono">
                  <span className="text-zinc-600 select-none">↳</span>
                  <span className="font-semibold">{item.text}</span>
                </div>
              );
            }

            // Info (e.g. [Program stopped])
            if (item.type === 'info') {
              return (
                <div key={item.id} className="py-1 text-zinc-500 italic text-[11px]">
                  {item.text}
                </div>
              );
            }

            // Error Display
            if (item.type === 'error') {
              return (
                <div 
                  key={item.id}
                  className="p-3 my-1.5 rounded-lg bg-rose-500/[0.07] border border-rose-500/30 text-rose-200 flex flex-col gap-1.5 shadow-sm"
                >
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-rose-300">V# Error</span>
                        {item.line && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono">
                            Line {item.line}
                          </span>
                        )}
                      </div>
                      <div className="text-rose-100/90 leading-relaxed font-sans text-xs">
                        {item.text.replace(/^V# Error \(Line \d+\): /, '')}
                      </div>
                    </div>
                  </div>

                  {item.suggestion && (
                    <div className="ml-6 mt-1 flex items-start gap-1.5 text-[11px] text-amber-300/90 bg-amber-500/10 border border-amber-500/20 rounded p-1.5 font-sans">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{item.suggestion}</span>
                    </div>
                  )}
                </div>
              );
            }

            // Standard Output
            return (
              <div key={item.id} className="flex items-baseline gap-2 leading-5 hover:bg-white/[0.02] px-1 py-0.5 rounded">
                <span className="text-cyan-500/60 select-none text-[11px]">&gt;</span>
                <span className="text-zinc-100 whitespace-pre-wrap font-mono text-[13px]">
                  {item.text}
                </span>
              </div>
            );
          })}

          {/* Active Interactive Player Input Prompt */}
          {activeInputRequest && (
            <form 
              onSubmit={handleInputSubmit} 
              className="mt-2 p-2 rounded bg-cyan-950/20 border border-cyan-500/40 flex items-center gap-2"
            >
              <span className="text-cyan-400 text-xs font-semibold shrink-0 select-none">
                ?
              </span>
              <input
                ref={inputRef}
                type={activeInputRequest.isNumber ? 'number' : 'text'}
                step="any"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={activeInputRequest.isNumber ? 'Enter a number...' : 'Type your answer...'}
                className="flex-1 bg-transparent border-none outline-none font-mono text-zinc-100 text-xs placeholder:text-zinc-600 caret-cyan-400"
                autoFocus
              />
              <button
                type="submit"
                className="px-2 py-1 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 text-[11px] font-semibold rounded flex items-center gap-1 transition-colors"
              >
                <span>Send</span>
                <CornerDownLeft className="w-3 h-3" />
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
