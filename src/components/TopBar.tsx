import React from 'react';
import { VSharpLogo } from './VSharpLogo';
import { 
  Play,
  Bug,
  Square,
  Terminal,
  PanelLeftClose, 
  PanelLeftOpen, 
  PanelRightClose, 
  PanelRightOpen, 
  Maximize2, 
  Minimize2,
  FolderDot,
  Command
} from 'lucide-react';

interface TopBarProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  rightPanelOpen: boolean;
  onToggleRightPanel: () => void;
  consoleOpen: boolean;
  onToggleConsole: () => void;
  workspaceName?: string;
  onRun?: () => void;
  onDebug?: () => void;
  onStop?: () => void;
  isRunning?: boolean;
  isDebugging?: boolean;
  onOpenCommandPalette?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  sidebarOpen,
  onToggleSidebar,
  rightPanelOpen,
  onToggleRightPanel,
  consoleOpen,
  onToggleConsole,
  workspaceName = 'V# Project',
  onRun,
  onDebug,
  onStop,
  isRunning = false,
  isDebugging = false,
  onOpenCommandPalette,
}) => {
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <header className="h-10 bg-[#0f1219] border-b border-white/[0.06] flex items-center justify-between px-3 shrink-0 select-none z-20">
      {/* Zone 1: V# Brand */}
      <div className="flex items-center gap-4">
        <VSharpLogo size={20} showText={true} />
      </div>

      {/* Zone 2: Workspace & Quick Command Palette */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs text-zinc-400 bg-white/[0.03] border border-white/[0.04]">
          <FolderDot className="w-3.5 h-3.5 text-zinc-500" />
          <span className="font-medium text-zinc-200">{workspaceName}</span>
          <span className="text-[11px] text-zinc-600">·</span>
          <span className="text-[11px] text-cyan-400 font-mono">v1.0 Pro</span>
        </div>

        {/* Command Palette Button */}
        <button
          onClick={onOpenCommandPalette}
          title="Command Palette (Ctrl + Shift + P)"
          className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.04] text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <Command className="w-3 h-3 text-cyan-400" />
          <span>Commands</span>
          <kbd className="text-[9px] px-1 py-0.2 rounded bg-white/[0.06] text-zinc-500 font-mono">
            ⌘P
          </kbd>
        </button>
      </div>

      {/* Zone 3: Execution & Layout Controls */}
      <div className="flex items-center gap-1.5">
        {/* Run or Stop Button */}
        {isRunning || isDebugging ? (
          <button
            onClick={onStop}
            title="Stop Execution"
            className="flex items-center gap-1.5 px-3 py-1 bg-rose-500 hover:bg-rose-400 text-white font-semibold text-xs rounded transition-all shadow-sm active:scale-95 mr-1 cursor-pointer"
          >
            <Square className="w-3 h-3 fill-current" />
            <span>Stop</span>
          </button>
        ) : (
          <div className="flex items-center gap-1 mr-1">
            {onRun && (
              <button
                onClick={onRun}
                title="Run Project (Ctrl + Enter)"
                className="flex items-center gap-1.5 px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-semibold text-xs rounded transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Run</span>
                <kbd className="hidden md:inline-block text-[9px] px-1 py-0.2 bg-zinc-950/20 rounded font-mono">
                  Ctrl+↵
                </kbd>
              </button>
            )}

            {onDebug && (
              <button
                onClick={onDebug}
                title="Debug Project (Breakpoints)"
                className="p-1 px-2 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/40 text-purple-300 font-semibold text-xs rounded transition-all flex items-center gap-1"
              >
                <Bug className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden lg:inline">Debug</span>
              </button>
            )}
          </div>
        )}

        <div className="w-[1px] h-3.5 bg-white/[0.08] mx-0.5" />

        {/* Toggle Console */}
        <button
          onClick={onToggleConsole}
          title={consoleOpen ? "Hide Console" : "Show Console"}
          className={`p-1.5 rounded transition-colors ${
            consoleOpen 
              ? 'text-cyan-400 bg-cyan-400/10 hover:bg-cyan-400/20' 
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05]'
          }`}
          aria-label="Toggle Console"
        >
          <Terminal className="w-4 h-4" />
        </button>

        {/* Toggle Left Sidebar */}
        <button
          onClick={onToggleSidebar}
          title={sidebarOpen ? "Hide Sidebar (Ctrl+B)" : "Show Sidebar (Ctrl+B)"}
          className={`p-1.5 rounded transition-colors ${
            sidebarOpen 
              ? 'text-cyan-400 bg-cyan-400/10 hover:bg-cyan-400/20' 
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05]'
          }`}
          aria-label="Toggle Sidebar"
        >
          {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
        </button>

        {/* Toggle Right Panel */}
        <button
          onClick={onToggleRightPanel}
          title={rightPanelOpen ? "Hide Companion Panel" : "Show Companion Panel"}
          className={`p-1.5 rounded transition-colors ${
            rightPanelOpen 
              ? 'text-cyan-400 bg-cyan-400/10 hover:bg-cyan-400/20' 
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05]'
          }`}
          aria-label="Toggle Secondary Panel"
        >
          {rightPanelOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
        </button>

        <div className="w-[1px] h-3.5 bg-white/[0.08] mx-0.5" />

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05] rounded transition-colors"
          aria-label="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    </header>
  );
};
