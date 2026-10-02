import React, { useRef, useEffect, useState, useMemo } from 'react';
import { ChevronRight, AlertCircle, CircleDot } from 'lucide-react';
import { highlightVSharpLine } from '../vsharp/highlighter';
import { VSharpLanguageService, CompletionItem } from '../vsharp/languageServer';

interface EditorAreaProps {
  activeFileName?: string;
  code: string;
  onChange: (code: string) => void;
  errorLine?: number;
  currentDebugLine?: number;
  breakpoints?: number[];
  onToggleBreakpoint?: (line: number) => void;
  onCursorChange?: (line: number, col: number) => void;
  onRun?: () => void;
  fontSize?: number;
  showMinimap?: boolean;
  projectFiles?: Record<string, string>;
  onNavigateToFileLine?: (file: string, line: number) => void;
}

export const EditorArea: React.FC<EditorAreaProps> = ({
  activeFileName = 'main.v',
  code,
  onChange,
  errorLine,
  currentDebugLine,
  breakpoints = [],
  onToggleBreakpoint,
  onCursorChange,
  onRun,
  fontSize = 13,
  showMinimap = true,
  projectFiles = {},
  onNavigateToFileLine,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  const lines = code.split('\n');
  const lineCount = Math.max(lines.length, 1);

  // Autocomplete state
  const [completions, setCompletions] = useState<CompletionItem[]>([]);
  const [selectedCompIndex, setSelectedCompIndex] = useState(0);
  const [showCompletions, setShowCompletions] = useState(false);
  const [compCoords, setCompCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  // Sync scroll
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const { scrollTop, scrollLeft } = e.currentTarget;
    if (preRef.current) {
      preRef.current.scrollTop = scrollTop;
      preRef.current.scrollLeft = scrollLeft;
    }
    if (gutterRef.current) {
      gutterRef.current.scrollTop = scrollTop;
    }
  };

  const updateCursorPosition = () => {
    if (!textareaRef.current) return;
    const { selectionStart } = textareaRef.current;
    const textBefore = code.substring(0, selectionStart);
    const beforeLines = textBefore.split('\n');
    const currentLine = beforeLines.length;
    const currentCol = beforeLines[beforeLines.length - 1].length + 1;

    if (onCursorChange) {
      onCursorChange(currentLine, currentCol);
    }

    // Check autocomplete trigger
    const compList = VSharpLanguageService.getCompletions(code, selectionStart, projectFiles);
    const lastWord = textBefore.match(/([a-zA-Z0-9_.]+)$/)?.[1] || '';
    if (compList.length > 0 && lastWord.length >= 1) {
      setCompletions(compList.slice(0, 8));
      setSelectedCompIndex(0);
      setShowCompletions(true);
      // Rough caret coordinate estimation
      const lineHeightPx = fontSize * 1.8;
      setCompCoords({
        top: (currentLine - 1) * lineHeightPx + lineHeightPx + 16,
        left: Math.min(currentCol * (fontSize * 0.6) + 40, 450),
      });
    } else {
      setShowCompletions(false);
    }
  };

  const applyCompletion = (item: CompletionItem) => {
    if (!textareaRef.current) return;
    const { selectionStart } = textareaRef.current;
    const textBefore = code.substring(0, selectionStart);
    const textAfter = code.substring(selectionStart);
    const match = textBefore.match(/([a-zA-Z0-9_.]+)$/);
    const wordLen = match ? match[1].length : 0;

    const insertText = item.insertText || item.label;
    const newCode = textBefore.slice(0, textBefore.length - wordLen) + insertText + textAfter;
    onChange(newCode);
    setShowCompletions(false);

    setTimeout(() => {
      if (textareaRef.current) {
        const newPos = selectionStart - wordLen + insertText.length;
        textareaRef.current.selectionStart = textareaRef.current.selectionEnd = newPos;
        textareaRef.current.focus();
        updateCursorPosition();
      }
    }, 10);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Autocomplete navigation
    if (showCompletions && completions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedCompIndex((prev) => (prev + 1) % completions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedCompIndex((prev) => (prev - 1 + completions.length) % completions.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        applyCompletion(completions[selectedCompIndex]);
        return;
      }
      if (e.key === 'Escape') {
        setShowCompletions(false);
        return;
      }
    }

    // Run shortcut: Ctrl + Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onRun?.();
      return;
    }

    // Tab key: insert 4 spaces
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newCode = code.substring(0, start) + '    ' + code.substring(end);
      onChange(newCode);

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 4;
          updateCursorPosition();
        }
      }, 0);
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [activeFileName]);

  return (
    <div className="flex-1 flex flex-col bg-[#0c0e15] h-full overflow-hidden select-text relative">
      {/* Editor Breadcrumbs Header */}
      <div className="h-7 px-4 border-b border-white/[0.04] flex items-center justify-between text-xs text-zinc-500 bg-[#0e1017]/70 select-none shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="hover:text-zinc-300 transition-colors">workspace</span>
          <ChevronRight className="w-3 h-3 text-zinc-600" />
          <span className="text-zinc-200 font-medium">{activeFileName}</span>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-zinc-500 font-mono">
          <span>V# Source</span>
        </div>
      </div>

      {/* Editor Code Area */}
      <div 
        className="flex-1 flex overflow-hidden relative font-mono leading-relaxed"
        style={{ fontSize: `${fontSize}px` }}
      >
        {/* Line Numbers Gutter with Breakpoints */}
        <div
          ref={gutterRef}
          aria-hidden="true"
          className="w-14 bg-[#0a0c12]/80 border-r border-white/[0.04] py-3 flex flex-col items-end pr-2.5 select-none text-zinc-600 shrink-0 tabular-nums overflow-hidden font-mono"
        >
          {Array.from({ length: Math.max(lineCount, 16) }).map((_, idx) => {
            const lineNum = idx + 1;
            const isError = lineNum === errorLine;
            const isDebug = lineNum === currentDebugLine;
            const hasBp = breakpoints.includes(lineNum);

            return (
              <div
                key={lineNum}
                onClick={() => onToggleBreakpoint?.(lineNum)}
                className={`h-6 w-full text-right px-1 flex items-center justify-end gap-1 cursor-pointer transition-colors group ${
                  isDebug
                    ? 'text-cyan-300 font-bold bg-cyan-500/20 rounded-sm'
                    : isError
                    ? 'text-rose-400 font-bold bg-rose-500/15 rounded-sm'
                    : 'text-zinc-600 hover:text-zinc-300'
                }`}
                title={hasBp ? 'Remove Breakpoint' : 'Add Breakpoint'}
              >
                {/* Breakpoint indicator */}
                {hasBp && (
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.8)] shrink-0" />
                )}
                {!hasBp && (
                  <span className="w-2 h-2 rounded-full bg-rose-500/30 opacity-0 group-hover:opacity-100 shrink-0" />
                )}
                <span>{lineNum <= lineCount ? lineNum : ''}</span>
              </div>
            );
          })}
        </div>

        {/* Editing Container with Syntax Highlight Layer */}
        <div className="flex-1 relative overflow-hidden bg-[#0c0e15]">
          {/* Debug Current Line Highlight */}
          {currentDebugLine && currentDebugLine <= lineCount && (
            <div
              className="absolute left-0 right-0 h-6 bg-cyan-500/15 border-y border-cyan-500/30 pointer-events-none z-0"
              style={{ top: `${(currentDebugLine - 1) * 24 + 12}px` }}
            />
          )}

          {/* Error Line Highlight Background Strip */}
          {errorLine && errorLine <= lineCount && (
            <div
              className="absolute left-0 right-0 h-6 bg-rose-500/[0.08] border-y border-rose-500/20 pointer-events-none z-0"
              style={{ top: `${(errorLine - 1) * 24 + 12}px` }}
            />
          )}

          {/* Syntax Highlighted Render Layer */}
          <pre
            ref={preRef}
            aria-hidden="true"
            className="absolute inset-0 m-0 py-3 px-4 font-mono leading-6 overflow-hidden pointer-events-none whitespace-pre select-none z-0"
            style={{ tabSize: 4 }}
          >
            {lines.map((lineText, lineIdx) => {
              const tokens = highlightVSharpLine(lineText);
              return (
                <div key={lineIdx} className="h-6">
                  {tokens.map((token, tokenIdx) => {
                    let colorClass = 'text-zinc-200';
                    if (token.type === 'keyword') {
                      colorClass = 'text-cyan-400 font-semibold';
                    } else if (token.type === 'string') {
                      colorClass = 'text-amber-300';
                    } else if (token.type === 'number') {
                      colorClass = 'text-purple-400 font-medium';
                    } else if (token.type === 'comment') {
                      colorClass = 'text-zinc-500 italic';
                    } else if (token.type === 'operator') {
                      colorClass = 'text-sky-300';
                    } else if (token.type === 'boolean') {
                      colorClass = 'text-cyan-400 font-bold';
                    }

                    return (
                      <span key={tokenIdx} className={colorClass}>
                        {token.text}
                      </span>
                    );
                  })}
                </div>
              );
            })}
          </pre>

          {/* Interactive Transparent Textarea */}
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => onChange(e.target.value)}
            onScroll={handleScroll}
            onSelect={updateCursorPosition}
            onKeyUp={updateCursorPosition}
            onClick={updateCursorPosition}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            className="absolute inset-0 w-full h-full m-0 py-3 px-4 bg-transparent text-transparent caret-cyan-400 font-mono leading-6 resize-none outline-none border-none overflow-auto z-10 selection:bg-cyan-500/25 selection:text-transparent"
            style={{ tabSize: 4 }}
          />

          {/* Autocomplete Popup */}
          {showCompletions && completions.length > 0 && (
            <div
              className="absolute z-30 bg-[#121622] border border-cyan-500/40 rounded-lg shadow-2xl overflow-hidden py-1 w-64 select-none font-sans"
              style={{
                top: `${Math.min(compCoords.top, 350)}px`,
                left: `${Math.min(compCoords.left, 400)}px`,
              }}
            >
              <div className="px-2 py-0.5 text-[9px] uppercase tracking-wider text-zinc-500 font-semibold border-b border-white/[0.04]">
                V# Suggestions
              </div>
              {completions.map((comp, idx) => {
                const isSel = idx === selectedCompIndex;
                return (
                  <div
                    key={idx}
                    onClick={() => applyCompletion(comp)}
                    className={`px-2.5 py-1 text-xs flex items-center justify-between cursor-pointer font-mono ${
                      isSel ? 'bg-cyan-500/20 text-cyan-200 font-bold' : 'text-zinc-300 hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className={`text-[10px] px-1 rounded ${
                        comp.kind === 'keyword' ? 'bg-sky-500/20 text-sky-300' :
                        comp.kind === 'function' ? 'bg-purple-500/20 text-purple-300' :
                        comp.kind === 'variable' ? 'bg-amber-500/20 text-amber-300' :
                        comp.kind === 'module' ? 'bg-emerald-500/20 text-emerald-300' :
                        'bg-zinc-700/40 text-zinc-400'
                      }`}>
                        {comp.kind[0].toUpperCase()}
                      </span>
                      <span className="truncate">{comp.label}</span>
                    </div>
                    {comp.detail && (
                      <span className="text-[10px] text-zinc-500 truncate ml-2 font-sans">
                        {comp.detail}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Optional Minimap */}
        {showMinimap && (
          <div
            aria-hidden="true"
            className="w-14 hidden lg:block border-l border-white/[0.03] bg-[#090b10]/40 shrink-0 select-none p-2 pointer-events-none"
          >
            <div className="text-[9px] uppercase tracking-wider text-zinc-700 font-mono mb-2 text-center">
              Map
            </div>
            <div className="space-y-1 opacity-20">
              {lines.slice(0, 40).map((l, i) => (
                <div
                  key={i}
                  className={`h-0.5 rounded ${i + 1 === errorLine ? 'bg-rose-500' : 'bg-zinc-500'}`}
                  style={{ width: `${Math.min(l.length * 3, 40)}px` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
