import React, { useState } from 'react';
import { ActivityTab } from './ActivityBar';
import { FileExplorer } from './FileExplorer';
import { DebuggerPanel } from './DebuggerPanel';
import { ProblemsPanel } from './ProblemsPanel';
import { DocumentationPanel } from './DocumentationPanel';
import { Search, ChevronRight } from 'lucide-react';
import { VSharpError } from '../vsharp/types';
import { DebuggerPauseInfo } from '../vsharp/debugger';

interface SidebarProps {
  activeTab: ActivityTab;
  isOpen: boolean;
  onClose: () => void;
  // File explorer props
  files: Record<string, string>;
  activeFile: string;
  entryFile: string;
  onSelectFile: (fileName: string) => void;
  onCreateFile: (fileName: string) => void;
  onRenameFile: (oldName: string, newName: string) => void;
  onDeleteFile: (fileName: string) => void;
  onImportFiles: (imported: Record<string, string>) => void;
  onExportProject: () => void;
  onSetEntryFile: (fileName: string) => void;
  // Debugger props
  isDebugging: boolean;
  isPaused: boolean;
  pauseInfo?: DebuggerPauseInfo | null;
  breakpoints: Record<string, number[]>;
  onContinue: () => void;
  onStepOver: () => void;
  onStepInto: () => void;
  onStop: () => void;
  onToggleBreakpoint: (file: string, line: number) => void;
  // Problems props
  problems: VSharpError[];
  onSelectProblem?: (file: string, line: number) => void;
  // Docs insert snippet
  onInsertCode?: (snippet: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  isOpen,
  onClose,
  files,
  activeFile,
  entryFile,
  onSelectFile,
  onCreateFile,
  onRenameFile,
  onDeleteFile,
  onImportFiles,
  onExportProject,
  onSetEntryFile,
  isDebugging,
  isPaused,
  pauseInfo,
  breakpoints,
  onContinue,
  onStepOver,
  onStepInto,
  onStop,
  onToggleBreakpoint,
  problems,
  onSelectProblem,
  onInsertCode,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  // Project search results
  const searchResults = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const matches: Array<{ file: string; line: number; text: string }> = [];

    for (const [file, content] of Object.entries(files)) {
      const lines = content.split('\n');
      lines.forEach((lineText, idx) => {
        if (lineText.toLowerCase().includes(q)) {
          matches.push({ file, line: idx + 1, text: lineText.trim() });
        }
      });
    }
    return matches.slice(0, 30);
  }, [searchQuery, files]);

  return (
    <aside 
      className="w-64 sm:w-72 md:w-80 bg-[#10131b] border-r border-white/[0.06] flex flex-col shrink-0 select-none overflow-hidden"
      aria-label="Sidebar Panel"
    >
      {/* Explorer Tab */}
      {activeTab === 'explorer' && (
        <FileExplorer
          files={files}
          activeFile={activeFile}
          entryFile={entryFile}
          onSelectFile={onSelectFile}
          onCreateFile={onCreateFile}
          onRenameFile={onRenameFile}
          onDeleteFile={onDeleteFile}
          onImportFiles={onImportFiles}
          onExportProject={onExportProject}
          onSetEntryFile={onSetEntryFile}
        />
      )}

      {/* Debugger Tab */}
      {activeTab === 'debugger' && (
        <DebuggerPanel
          isDebugging={isDebugging}
          isPaused={isPaused}
          pauseInfo={pauseInfo}
          breakpoints={breakpoints}
          onContinue={onContinue}
          onStepOver={onStepOver}
          onStepInto={onStepInto}
          onStop={onStop}
          onToggleBreakpoint={onToggleBreakpoint}
          onSelectStackFrame={(file, line) => {
            onSelectFile(file);
          }}
        />
      )}

      {/* Problems Tab */}
      {activeTab === 'problems' && (
        <ProblemsPanel
          problems={problems}
          onSelectProblem={(file, line) => {
            onSelectFile(file);
            onSelectProblem?.(file, line);
          }}
        />
      )}

      {/* Documentation Tab */}
      {activeTab === 'docs' && (
        <DocumentationPanel onInsertCode={onInsertCode} />
      )}

      {/* Project Search Tab */}
      {activeTab === 'search' && (
        <div className="flex-1 flex flex-col h-full bg-[#10131b] select-none text-xs text-zinc-300">
          <div className="p-3 border-b border-white/[0.04] bg-[#0d1017]">
            <span className="font-semibold text-[11px] text-zinc-300 uppercase tracking-wider block mb-2">
              Search across project
            </span>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search files..."
                className="w-full bg-[#080a0e] border border-white/[0.08] rounded-md pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-500 outline-none focus:border-cyan-500/50"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1 font-mono">
            {searchQuery && searchResults.length === 0 ? (
              <div className="text-zinc-600 text-center py-6 font-sans">
                No results found for "{searchQuery}"
              </div>
            ) : (
              searchResults.map((res, idx) => (
                <div
                  key={idx}
                  onClick={() => onSelectFile(res.file)}
                  className="p-2 rounded bg-white/[0.02] hover:bg-white/[0.05] cursor-pointer transition-colors"
                >
                  <div className="text-cyan-400 text-[11px] font-semibold flex items-center justify-between">
                    <span>{res.file}</span>
                    <span className="text-zinc-500 text-[10px]">Line {res.line}</span>
                  </div>
                  <div className="text-zinc-300 text-[11px] truncate mt-0.5">
                    {res.text}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </aside>
  );
};
