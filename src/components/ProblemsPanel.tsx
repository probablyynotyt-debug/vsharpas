import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { VSharpError } from '../vsharp/types';

interface ProblemsPanelProps {
  problems: VSharpError[];
  onSelectProblem?: (file: string, line: number) => void;
}

export const ProblemsPanel: React.FC<ProblemsPanelProps> = ({
  problems,
  onSelectProblem,
}) => {
  return (
    <div className="flex-1 flex flex-col h-full bg-[#10131b] select-none text-xs text-zinc-300 font-mono">
      <div className="px-3 py-2 border-b border-white/[0.04] flex items-center justify-between text-zinc-400 bg-white/[0.01]">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
          <span className="font-semibold text-[11px] text-zinc-300 uppercase tracking-wider">
            Problems ({problems.length})
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {problems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 py-8">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 mb-2 opacity-80" />
            <p className="text-xs font-semibold text-zinc-300">No problems detected</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">All project files have valid V# syntax.</p>
          </div>
        ) : (
          problems.map((prob, idx) => (
            <div
              key={idx}
              onClick={() => onSelectProblem?.(prob.file || 'main.v', prob.line)}
              className="p-2.5 rounded bg-rose-500/[0.05] border border-rose-500/20 hover:bg-rose-500/[0.1] cursor-pointer transition-colors"
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-rose-300 text-xs">{prob.title}</span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {prob.file || 'main.v'}:{prob.line}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-300 font-sans mt-0.5 leading-relaxed">
                    {prob.message}
                  </p>
                  {prob.suggestion && (
                    <div className="mt-1 text-[10px] text-amber-300/90 bg-amber-500/10 px-1.5 py-0.5 rounded font-sans inline-block">
                      💡 {prob.suggestion}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
