import React from 'react';
import { AlertCircle, AlertTriangle } from 'lucide-react';

interface StatusBarProps {
  line?: number;
  col?: number;
  vsharpVersion?: string;
  encoding?: string;
  indentation?: string;
  languageMode?: string;
  isVisible?: boolean;
  errorCount?: number;
  onToggleConsole?: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  line = 1,
  col = 1,
  vsharpVersion = 'V# 0.1',
  encoding = 'UTF-8',
  indentation = 'Spaces: 4',
  languageMode = 'V#',
  isVisible = true,
  errorCount = 0,
  onToggleConsole,
}) => {
  if (!isVisible) return null;

  return (
    <footer 
      className="h-6 bg-[#090b0e] border-t border-white/[0.06] px-3 flex items-center justify-between text-[11px] text-zinc-400 select-none shrink-0 font-mono z-20"
      aria-label="Status Bar"
    >
      {/* Left Zone: Language engine status & problems slot */}
      <div className="flex items-center gap-3">
        {/* V# Engine status indicator */}
        <div className="flex items-center gap-1.5 text-zinc-300 hover:text-white transition-colors cursor-pointer">
          <span className={`w-1.5 h-1.5 rounded-full ${errorCount > 0 ? 'bg-rose-400' : 'bg-cyan-400'} shadow-[0_0_6px_rgba(34,211,238,0.6)]`} />
          <span className="font-semibold text-zinc-300">{vsharpVersion}</span>
          <span className="text-zinc-600">·</span>
          <span className="text-zinc-500 font-sans text-[11px]">Ready</span>
        </div>

        {/* Problems & Diagnostics slot */}
        <button 
          onClick={onToggleConsole}
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer pl-1"
        >
          <div className="flex items-center gap-1">
            <AlertCircle className={`w-3 h-3 ${errorCount > 0 ? 'text-rose-400' : 'text-zinc-500'}`} />
            <span className={`tabular-nums ${errorCount > 0 ? 'text-rose-400 font-bold' : ''}`}>
              {errorCount}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-zinc-500" />
            <span className="tabular-nums">0</span>
          </div>
        </button>
      </div>

      {/* Right Zone: Editor metadata (cursor pos, encoding, language) */}
      <div className="flex items-center gap-3 tabular-nums">
        {/* Cursor Position */}
        <div className="text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer">
          Ln <span className="text-zinc-200">{line}</span>, Col <span className="text-zinc-200">{col}</span>
        </div>

        <span className="text-zinc-700" aria-hidden="true">·</span>

        {/* Indentation */}
        <div className="hidden sm:block text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer">
          {indentation}
        </div>

        <span className="hidden sm:inline text-zinc-700" aria-hidden="true">·</span>

        {/* Encoding */}
        <div className="hidden md:block text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer">
          {encoding}
        </div>

        <span className="hidden md:inline text-zinc-700" aria-hidden="true">·</span>

        {/* Language Mode */}
        <div className="text-cyan-400 font-medium hover:text-cyan-300 transition-colors cursor-pointer">
          {languageMode}
        </div>
      </div>
    </footer>
  );
};
