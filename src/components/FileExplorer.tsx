import React, { useState, useRef } from 'react';
import { 
  FileCode, 
  FilePlus, 
  PlayCircle, 
  Trash2, 
  Edit3, 
  Download, 
  Upload, 
  Check, 
  X, 
  FolderGit2,
  MoreVertical,
  Star
} from 'lucide-react';

interface FileExplorerProps {
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
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
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
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [renamingFile, setRenamingFile] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [menuOpenFile, setMenuOpenFile] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleStartCreate = () => {
    setIsCreating(true);
    setNewFileName('');
  };

  const handleConfirmCreate = () => {
    let name = newFileName.trim();
    if (!name) {
      setIsCreating(false);
      return;
    }
    if (!name.endsWith('.v') && !name.endsWith('.v#')) {
      name += '.v';
    }
    onCreateFile(name);
    setIsCreating(false);
    setNewFileName('');
  };

  const handleStartRename = (fileName: string) => {
    setRenamingFile(fileName);
    setRenameValue(fileName);
    setMenuOpenFile(null);
  };

  const handleConfirmRename = () => {
    if (!renamingFile) return;
    let newName = renameValue.trim();
    if (newName && newName !== renamingFile) {
      if (!newName.endsWith('.v') && !newName.endsWith('.v#')) {
        newName += '.v';
      }
      onRenameFile(renamingFile, newName);
    }
    setRenamingFile(null);
    setRenameValue('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    const file = uploadedFiles[0];
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        // Check if JSON project export
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          if (typeof parsed === 'object' && parsed !== null) {
            onImportFiles(parsed);
          }
        } else {
          // Single source file import
          onImportFiles({ [file.name]: text });
        }
      } catch (err) {
        console.error('Failed to import file:', err);
      }
    };

    reader.readAsText(file);
    e.target.value = '';
  };

  const fileList = Object.keys(files);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#10131b] select-none text-xs text-zinc-300 font-sans">
      {/* Explorer Header */}
      <div className="px-3 py-2.5 border-b border-white/[0.04] bg-[#0c0e15] flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-zinc-300 font-semibold text-[11px] uppercase tracking-wider">
          <FolderGit2 className="w-3.5 h-3.5 text-cyan-400" />
          <span>Project Files</span>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleStartCreate}
            title="New V# File"
            className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05] transition-colors"
          >
            <FilePlus className="w-3.5 h-3.5 text-cyan-400" />
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            title="Import File / Project"
            className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05] transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-zinc-400" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".v,.v#,.json,.txt"
            onChange={handleFileUpload}
            className="hidden"
          />

          <button
            onClick={onExportProject}
            title="Export Project (JSON)"
            className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05] transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-zinc-400" />
          </button>
        </div>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {/* Inline New File Form */}
        {isCreating && (
          <div className="flex items-center gap-1.5 p-1.5 rounded bg-cyan-500/10 border border-cyan-500/30 mb-1">
            <FileCode className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <input
              type="text"
              autoFocus
              placeholder="filename.v"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirmCreate();
                if (e.key === 'Escape') setIsCreating(false);
              }}
              className="bg-transparent text-xs text-zinc-100 outline-none w-full font-mono placeholder:text-zinc-500"
            />
            <button
              onClick={handleConfirmCreate}
              className="p-0.5 hover:text-cyan-300 text-zinc-400"
            >
              <Check className="w-3 h-3" />
            </button>
            <button
              onClick={() => setIsCreating(false)}
              className="p-0.5 hover:text-rose-400 text-zinc-400"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Existing files */}
        {fileList.map((fileName) => {
          const isActive = fileName === activeFile;
          const isEntry = fileName === entryFile;
          const isRenaming = renamingFile === fileName;

          if (isRenaming) {
            return (
              <div
                key={fileName}
                className="flex items-center gap-1.5 p-1.5 rounded bg-white/[0.05] border border-cyan-500/30"
              >
                <FileCode className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <input
                  type="text"
                  autoFocus
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleConfirmRename();
                    if (e.key === 'Escape') setRenamingFile(null);
                  }}
                  className="bg-transparent text-xs text-zinc-100 outline-none w-full font-mono"
                />
                <button
                  onClick={handleConfirmRename}
                  className="p-0.5 hover:text-cyan-300 text-zinc-400"
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setRenamingFile(null)}
                  className="p-0.5 hover:text-rose-400 text-zinc-400"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          }

          return (
            <div
              key={fileName}
              onClick={() => onSelectFile(fileName)}
              className={`group flex items-center justify-between px-2.5 py-1.5 rounded cursor-pointer transition-colors relative font-mono text-[11px] ${
                isActive
                  ? 'bg-cyan-500/[0.12] text-cyan-200 border border-cyan-500/20'
                  : 'hover:bg-white/[0.04] text-zinc-400 hover:text-zinc-200 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <FileCode
                  className={`w-3.5 h-3.5 shrink-0 ${
                    isActive ? 'text-cyan-400' : 'text-zinc-500 group-hover:text-zinc-300'
                  }`}
                />
                <span className="truncate">{fileName}</span>
                {isEntry && (
                  <span
                    title="Program Entry File (runs first)"
                    className="flex items-center gap-0.5 px-1 py-0.2 rounded text-[9px] font-sans font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                  >
                    <PlayCircle className="w-2.5 h-2.5" />
                    <span>ENTRY</span>
                  </span>
                )}
              </div>

              {/* Hover actions */}
              <div
                className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                {!isEntry && (
                  <button
                    onClick={() => onSetEntryFile(fileName)}
                    title="Set as Entry Point"
                    className="p-1 hover:text-emerald-400 text-zinc-500 transition-colors"
                  >
                    <Star className="w-3 h-3" />
                  </button>
                )}
                <button
                  onClick={() => handleStartRename(fileName)}
                  title="Rename"
                  className="p-1 hover:text-cyan-300 text-zinc-500 transition-colors"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
                {fileList.length > 1 && (
                  <button
                    onClick={() => onDeleteFile(fileName)}
                    title="Delete File"
                    className="p-1 hover:text-rose-400 text-zinc-500 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-2.5 border-t border-white/[0.04] bg-[#0c0e15] text-[10px] text-zinc-500 font-sans">
        <p>Use <code className="text-cyan-400 font-mono">use moduleName</code> to include functions from other files.</p>
      </div>
    </div>
  );
};
