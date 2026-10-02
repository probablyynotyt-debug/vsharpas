import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { TopBar } from './components/TopBar';
import { ActivityBar, ActivityTab } from './components/ActivityBar';
import { Sidebar } from './components/Sidebar';
import { EditorTabs, TabItem } from './components/EditorTabs';
import { EditorArea } from './components/EditorArea';
import { Console } from './components/Console';
import { RightPanel } from './components/RightPanel';
import { StatusBar } from './components/StatusBar';
import { SettingsModal } from './components/SettingsModal';
import { CommandPalette, CommandItem } from './components/CommandPalette';
import { FilePlus } from 'lucide-react';
import { VSharpLogo } from './components/VSharpLogo';
import { 
  runVSharpAsync, 
  ConsoleOutputItem, 
  VSharpError, 
  InputRequest,
  VSharpDebuggerSession,
  DebuggerPauseInfo,
  VSharpLanguageService
} from './vsharp';
import { 
  MODULAR_MAIN_CODE,
  GAME_TOOLS_CODE,
  MATH_TOOLS_CODE,
  TREASURE_QUEST_CODE, 
  GUESS_THE_NUMBER_CODE,
  VSharpExample 
} from './vsharp/examples';

export default function App() {
  // Layout toggles
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [rightPanelOpen, setRightPanelOpen] = useState<boolean>(false);
  const [consoleOpen, setConsoleOpen] = useState<boolean>(true);
  const [statusBarOpen, setStatusBarOpen] = useState<boolean>(true);
  const [activeActivityTab, setActiveActivityTab] = useState<ActivityTab>('explorer');

  // Multi-File Project State
  const [files, setFiles] = useState<Record<string, string>>({
    'main.v': MODULAR_MAIN_CODE,
    'gameTools.v': GAME_TOOLS_CODE,
    'mathTools.v': MATH_TOOLS_CODE,
    'treasure_quest.v#': TREASURE_QUEST_CODE,
    'guess_number.v#': GUESS_THE_NUMBER_CODE,
  });
  const [entryFile, setEntryFile] = useState<string>('main.v');
  const [openTabNames, setOpenTabNames] = useState<string[]>([
    'main.v',
    'gameTools.v',
    'mathTools.v',
  ]);
  const [activeFileName, setActiveFileName] = useState<string>('main.v');

  // Real-time cursor coordinates
  const [cursor, setCursor] = useState<{ line: number; col: number }>({ line: 1, col: 1 });

  // Execution & Console State
  const [consoleOutputs, setConsoleOutputs] = useState<ConsoleOutputItem[]>([]);
  const [currentError, setCurrentError] = useState<VSharpError | undefined>(undefined);
  const [lastRunSuccess, setLastRunSuccess] = useState<boolean | null>(null);
  const [executionTimeMs, setExecutionTimeMs] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [activeInputRequest, setActiveInputRequest] = useState<InputRequest | null>(null);

  // Debugger State
  const [isDebugging, setIsDebugging] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [pauseInfo, setPauseInfo] = useState<DebuggerPauseInfo | null>(null);
  const [breakpoints, setBreakpoints] = useState<Record<string, number[]>>({
    'main.v': [12],
  });
  const [currentDebugLine, setCurrentDebugLine] = useState<number | undefined>(undefined);

  // Settings & Command Palette State
  const [settingsModalOpen, setSettingsModalOpen] = useState<boolean>(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState<boolean>(false);
  const [settings, setSettings] = useState({
    theme: 'dark' as 'dark' | 'light',
    fontSize: 13,
    autosave: true,
    minimap: true,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const debuggerSessionRef = useRef<VSharpDebuggerSession>(new VSharpDebuggerSession(breakpoints));

  // Sync breakpoints with debugger session
  useEffect(() => {
    debuggerSessionRef.current.setBreakpoints(breakpoints);
  }, [breakpoints]);

  // Real-time project problems / diagnostics
  const problems = useMemo(() => {
    const list: VSharpError[] = [];
    for (const [fileName, content] of Object.entries(files)) {
      const diags = VSharpLanguageService.getDiagnostics(content, fileName);
      list.push(...diags);
    }
    return list;
  }, [files]);

  // Current active file code
  const activeCode = files[activeFileName] || '';

  // Tab list formatted for EditorTabs
  const tabsList: TabItem[] = useMemo(() => {
    return openTabNames.map((name) => ({
      id: name,
      name,
    }));
  }, [openTabNames]);

  // Switch active tab
  const handleSelectTab = (fileName: string) => {
    if (!openTabNames.includes(fileName)) {
      setOpenTabNames((prev) => [...prev, fileName]);
    }
    setActiveFileName(fileName);
    setCurrentError(undefined);
  };

  // Close tab
  const handleCloseTab = (fileName: string) => {
    setOpenTabNames((prev) => {
      const remaining = prev.filter((name) => name !== fileName);
      if (activeFileName === fileName) {
        setActiveFileName(remaining.length > 0 ? remaining[remaining.length - 1] : '');
      }
      return remaining;
    });
  };

  // Update code in current file
  const handleCodeChange = (newCode: string) => {
    if (!activeFileName) return;
    setFiles((prev) => ({
      ...prev,
      [activeFileName]: newCode,
    }));
    if (currentError && currentError.file === activeFileName) {
      setCurrentError(undefined);
    }
  };

  // Create new file
  const handleCreateFile = (newFileName: string) => {
    let name = newFileName.trim();
    if (!name.endsWith('.v') && !name.endsWith('.v#')) {
      name += '.v';
    }
    setFiles((prev) => ({
      ...prev,
      [name]: `# ${name}\n\nsay.title "${name.toUpperCase()}"\n`,
    }));
    handleSelectTab(name);
  };

  // Rename file
  const handleRenameFile = (oldName: string, newName: string) => {
    if (oldName === newName || !newName) return;
    setFiles((prev) => {
      const updated: Record<string, string> = {};
      for (const [k, v] of Object.entries(prev)) {
        if (k === oldName) {
          updated[newName] = v;
        } else {
          updated[k] = v;
        }
      }
      return updated;
    });

    setOpenTabNames((prev) => prev.map((n) => (n === oldName ? newName : n)));
    if (activeFileName === oldName) {
      setActiveFileName(newName);
    }
    if (entryFile === oldName) {
      setEntryFile(newName);
    }

    setBreakpoints((prev) => {
      const updated = { ...prev };
      if (updated[oldName]) {
        updated[newName] = updated[oldName];
        delete updated[oldName];
      }
      return updated;
    });
  };

  // Delete file
  const handleDeleteFile = (fileName: string) => {
    const keys = Object.keys(files);
    if (keys.length <= 1) return; // keep at least 1 file

    setFiles((prev) => {
      const updated = { ...prev };
      delete updated[fileName];
      return updated;
    });

    handleCloseTab(fileName);
    if (entryFile === fileName) {
      const remaining = keys.filter((k) => k !== fileName);
      setEntryFile(remaining[0] || 'main.v');
    }
  };

  // Set entry file
  const handleSetEntryFile = (fileName: string) => {
    setEntryFile(fileName);
    handleSelectTab(fileName);
  };

  // Toggle breakpoint in active file
  const handleToggleBreakpoint = (file: string, line: number) => {
    setBreakpoints((prev) => {
      const list = prev[file] ? [...prev[file]] : [];
      const idx = list.indexOf(line);
      if (idx >= 0) {
        list.splice(idx, 1);
      } else {
        list.push(line);
        list.sort((a, b) => a - b);
      }
      return { ...prev, [file]: list };
    });
  };

  // Export project files as JSON
  const handleExportProject = () => {
    const projectData = {
      name: 'VSharp Project',
      version: '1.0',
      entryFile,
      files,
    };
    const blob = new Blob([JSON.stringify(projectData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vsharp-project.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import files into project
  const handleImportFiles = (imported: Record<string, string>) => {
    // If it's a full project export
    if (imported.files && typeof imported.files === 'object') {
      setFiles(imported.files as Record<string, string>);
      if (imported.entryFile && typeof imported.entryFile === 'string') {
        setEntryFile(imported.entryFile);
      }
      const first = Object.keys(imported.files)[0];
      if (first) {
        setOpenTabNames(Object.keys(imported.files).slice(0, 3));
        setActiveFileName(first);
      }
      return;
    }

    // Direct files map
    setFiles((prev) => ({ ...prev, ...imported }));
    const firstKey = Object.keys(imported)[0];
    if (firstKey) {
      handleSelectTab(firstKey);
    }
  };

  // Load example into project
  const handleLoadExample = (example: VSharpExample) => {
    setFiles((prev) => ({
      ...prev,
      [example.name]: example.code,
    }));
    handleSelectTab(example.name);
    setEntryFile(example.name);
  };

  // Run the current program
  const handleRun = useCallback(async () => {
    if (isRunning) return;

    // Reset status
    setCurrentError(undefined);
    setLastRunSuccess(null);
    setIsRunning(true);
    setIsDebugging(false);
    setIsPaused(false);
    setPauseInfo(null);
    setCurrentDebugLine(undefined);
    setActiveInputRequest(null);
    setConsoleOutputs([]);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    if (!consoleOpen) {
      setConsoleOpen(true);
    }

    const codeToRun = files[entryFile] || files[activeFileName] || '';
    const runFile = files[entryFile] ? entryFile : activeFileName;

    try {
      const result = await runVSharpAsync(codeToRun, {
        projectFiles: files,
        currentFile: runFile,
        onOutput: (item) => {
          setConsoleOutputs((prev) => [...prev, item]);
        },
        onClear: () => {
          setConsoleOutputs([]);
        },
        requestInput: (req) => {
          setActiveInputRequest(req);
        },
        signal: controller.signal,
      });

      setCurrentError(result.error);
      setLastRunSuccess(result.success);
      setExecutionTimeMs(result.executionTimeMs);
    } catch (err: any) {
      console.error('Execution error:', err);
    } finally {
      setIsRunning(false);
      setActiveInputRequest(null);
      abortControllerRef.current = null;
    }
  }, [activeFileName, consoleOpen, entryFile, files, isRunning]);

  // Start Debugging Session
  const handleStartDebugging = useCallback(async () => {
    if (isRunning) return;

    setCurrentError(undefined);
    setLastRunSuccess(null);
    setIsRunning(true);
    setIsDebugging(true);
    setIsPaused(false);
    setPauseInfo(null);
    setCurrentDebugLine(undefined);
    setActiveInputRequest(null);
    setConsoleOutputs([]);

    // Open debugger sidebar
    setActiveActivityTab('debugger');
    setSidebarOpen(true);
    if (!consoleOpen) {
      setConsoleOpen(true);
    }

    const session = debuggerSessionRef.current;
    session.setBreakpoints(breakpoints);
    session.startDebugging();

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const codeToRun = files[entryFile] || files[activeFileName] || '';
    const runFile = files[entryFile] ? entryFile : activeFileName;

    // Hook pause
    const origPause = session.pause.bind(session);
    session.pause = async (info: DebuggerPauseInfo) => {
      setIsPaused(true);
      setPauseInfo(info);
      setCurrentDebugLine(info.line);

      // Switch editor to the paused file
      if (info.file && info.file !== activeFileName) {
        handleSelectTab(info.file);
      }

      return origPause(info);
    };

    try {
      const result = await runVSharpAsync(codeToRun, {
        projectFiles: files,
        currentFile: runFile,
        debuggerSession: session,
        onOutput: (item) => {
          setConsoleOutputs((prev) => [...prev, item]);
        },
        onClear: () => {
          setConsoleOutputs([]);
        },
        requestInput: (req) => {
          setActiveInputRequest(req);
        },
        signal: controller.signal,
      });

      setCurrentError(result.error);
      setLastRunSuccess(result.success);
      setExecutionTimeMs(result.executionTimeMs);
    } catch (err: any) {
      console.error('Debug session error:', err);
    } finally {
      setIsRunning(false);
      setIsDebugging(false);
      setIsPaused(false);
      setPauseInfo(null);
      setCurrentDebugLine(undefined);
      setActiveInputRequest(null);
      session.stop();
      abortControllerRef.current = null;
    }
  }, [activeFileName, breakpoints, consoleOpen, entryFile, files, isRunning]);

  // Stop running or debugging
  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    debuggerSessionRef.current.stop();
    setIsRunning(false);
    setIsDebugging(false);
    setIsPaused(false);
    setPauseInfo(null);
    setCurrentDebugLine(undefined);
    setActiveInputRequest(null);
  }, []);

  // Debugger stepping
  const handleDebugContinue = () => {
    debuggerSessionRef.current.continue();
  };
  const handleDebugStepOver = () => {
    const depth = pauseInfo?.stack.length || 1;
    debuggerSessionRef.current.stepOver(depth);
  };
  const handleDebugStepInto = () => {
    debuggerSessionRef.current.stepInto();
  };

  // Handle user input submit in console
  const handleInputSubmit = (answer: string) => {
    if (activeInputRequest) {
      const resolveFunc = activeInputRequest.resolve;
      setActiveInputRequest(null);
      resolveFunc(answer);
    }
  };

  // Clear console
  const handleClearConsole = () => {
    setConsoleOutputs([]);
    setCurrentError(undefined);
    setLastRunSuccess(null);
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command palette: Ctrl+Shift+P or Cmd+Shift+P
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
        return;
      }
      // Run: Ctrl+Enter or Cmd+Enter
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (isRunning) {
          handleStop();
        } else {
          handleRun();
        }
        return;
      }
      // F5: Start / Continue Debug
      if (e.key === 'F5') {
        e.preventDefault();
        if (isDebugging && isPaused) {
          handleDebugContinue();
        } else if (!isRunning) {
          handleStartDebugging();
        }
        return;
      }
      // F10: Step Over
      if (e.key === 'F10' && isDebugging && isPaused) {
        e.preventDefault();
        handleDebugStepOver();
        return;
      }
      // F11: Step Into
      if (e.key === 'F11' && isDebugging && isPaused) {
        e.preventDefault();
        handleDebugStepInto();
        return;
      }
      // F9: Toggle Breakpoint on current line
      if (e.key === 'F9' && activeFileName) {
        e.preventDefault();
        handleToggleBreakpoint(activeFileName, cursor.line);
        return;
      }
      // Sidebar toggle: Ctrl+B or Cmd+B
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setSidebarOpen((prev) => !prev);
        return;
      }
      // Console toggle: Ctrl+J or Cmd+J
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setConsoleOpen((prev) => !prev);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    activeFileName,
    cursor.line,
    handleRun,
    handleStartDebugging,
    handleStop,
    isDebugging,
    isPaused,
    isRunning,
  ]);

  // Command palette actions
  const commandPaletteItems: CommandItem[] = [
    {
      id: 'cmd-run',
      title: 'V#: Run Program',
      shortcut: 'Ctrl+Enter',
      icon: <span className="text-cyan-400">▶</span>,
      action: handleRun,
    },
    {
      id: 'cmd-debug',
      title: 'V#: Start Debugging',
      shortcut: 'F5',
      icon: <span className="text-amber-400">🐞</span>,
      action: handleStartDebugging,
    },
    {
      id: 'cmd-newfile',
      title: 'File: New V# File',
      shortcut: 'Ctrl+N',
      icon: <FilePlus className="w-3.5 h-3.5 text-cyan-400" />,
      action: () => handleCreateFile(`script_${Date.now().toString().slice(-4)}.v`),
    },
    {
      id: 'cmd-set-entry',
      title: `Project: Set "${activeFileName}" as Entry File`,
      icon: <span className="text-emerald-400">★</span>,
      action: () => handleSetEntryFile(activeFileName),
    },
    {
      id: 'cmd-export',
      title: 'Project: Export Project (JSON)',
      icon: <span className="text-zinc-400">💾</span>,
      action: handleExportProject,
    },
    {
      id: 'cmd-clear-console',
      title: 'Console: Clear Console Output',
      icon: <span className="text-zinc-400">🧹</span>,
      action: handleClearConsole,
    },
    {
      id: 'cmd-settings',
      title: 'Preferences: Open Editor Settings',
      icon: <span className="text-cyan-400">⚙</span>,
      action: () => setSettingsModalOpen(true),
    },
  ];

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0c0e14] text-[#e1e4ea] overflow-hidden select-none font-sans">
      {/* 1. Top Bar */}
      <TopBar
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        rightPanelOpen={rightPanelOpen}
        onToggleRightPanel={() => setRightPanelOpen((prev) => !prev)}
        consoleOpen={consoleOpen}
        onToggleConsole={() => setConsoleOpen((prev) => !prev)}
        workspaceName={`V# [Entry: ${entryFile}]`}
        onRun={handleRun}
        onDebug={handleStartDebugging}
        onStop={handleStop}
        isRunning={isRunning}
        isDebugging={isDebugging}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
      />

      {/* 2. Main Workbench Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Activity Bar */}
        <ActivityBar
          activeTab={activeActivityTab}
          onSelectTab={(tab) => {
            setActiveActivityTab(tab);
            setSidebarOpen(true);
          }}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          problemCount={problems.length}
          onOpenSettings={() => setSettingsModalOpen(true)}
        />

        {/* Primary Sidebar */}
        <Sidebar
          activeTab={activeActivityTab}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          files={files}
          activeFile={activeFileName}
          entryFile={entryFile}
          onSelectFile={handleSelectTab}
          onCreateFile={handleCreateFile}
          onRenameFile={handleRenameFile}
          onDeleteFile={handleDeleteFile}
          onImportFiles={handleImportFiles}
          onExportProject={handleExportProject}
          onSetEntryFile={handleSetEntryFile}
          isDebugging={isDebugging}
          isPaused={isPaused}
          pauseInfo={pauseInfo}
          breakpoints={breakpoints}
          onContinue={handleDebugContinue}
          onStepOver={handleDebugStepOver}
          onStepInto={handleDebugStepInto}
          onStop={handleStop}
          onToggleBreakpoint={handleToggleBreakpoint}
          problems={problems}
          onSelectProblem={(file, line) => {
            handleSelectTab(file);
            setCursor({ line, col: 1 });
          }}
          onInsertCode={(snippet) => {
            handleCodeChange(activeCode ? `${activeCode}\n\n${snippet}` : snippet);
          }}
        />

        {/* Central Editor & Console Stack */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#0c0e15] overflow-hidden">
          {/* Editor Tabs Bar */}
          <EditorTabs
            tabs={tabsList}
            activeTabId={activeFileName}
            onSelectTab={handleSelectTab}
            onCloseTab={handleCloseTab}
            onNewTab={() => handleCreateFile(`new_file_${openTabNames.length + 1}.v`)}
          />

          {/* Active Editor or Clean Empty State */}
          {activeFileName && files[activeFileName] !== undefined ? (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <EditorArea
                key={activeFileName}
                activeFileName={activeFileName}
                code={activeCode}
                onChange={handleCodeChange}
                errorLine={currentError?.file === activeFileName ? currentError.line : undefined}
                currentDebugLine={
                  pauseInfo?.file === activeFileName ? currentDebugLine : undefined
                }
                breakpoints={breakpoints[activeFileName] || []}
                onToggleBreakpoint={(line) => handleToggleBreakpoint(activeFileName, line)}
                onCursorChange={(line, col) => setCursor({ line, col })}
                onRun={handleRun}
                fontSize={settings.fontSize}
                showMinimap={settings.minimap}
                projectFiles={files}
                onNavigateToFileLine={(f, l) => {
                  handleSelectTab(f);
                  setCursor({ line: l, col: 1 });
                }}
              />

              {/* V# Console Dock */}
              <Console
                outputs={consoleOutputs}
                error={currentError}
                onClear={handleClearConsole}
                onRun={handleRun}
                onStop={handleStop}
                isRunning={isRunning}
                activeInputRequest={activeInputRequest}
                onInputSubmit={handleInputSubmit}
                isOpen={consoleOpen}
                onToggleOpen={() => setConsoleOpen((prev) => !prev)}
                executionTimeMs={executionTimeMs}
                lastRunSuccess={lastRunSuccess}
              />
            </div>
          ) : (
            /* Clean Empty Workspace when all tabs are closed */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#0c0e15]">
              <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04] mb-4">
                <VSharpLogo size={36} showText={false} />
              </div>
              <h3 className="text-sm font-semibold text-zinc-300 mb-1">No Open Files</h3>
              <p className="text-xs text-zinc-500 max-w-sm mb-5 leading-relaxed">
                Open a file from the Project Explorer or create a new V# module.
              </p>
              <button
                onClick={() => handleCreateFile('main.v')}
                className="px-3.5 py-1.5 rounded-md bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] text-xs font-medium text-zinc-200 transition-colors flex items-center gap-2"
              >
                <FilePlus className="w-3.5 h-3.5 text-cyan-400" />
                <span>Create New File</span>
              </button>
            </div>
          )}
        </main>

        {/* 3. Right Panel (Docs & Quick Examples) */}
        <RightPanel
          isOpen={rightPanelOpen}
          onClose={() => setRightPanelOpen(false)}
          onLoadExample={handleLoadExample}
          onInsertSnippet={(snippet) => {
            handleCodeChange(activeCode ? `${activeCode}\n\n${snippet}` : snippet);
          }}
        />
      </div>

      {/* 4. Bottom Status Bar */}
      <StatusBar
        line={cursor.line}
        col={cursor.col}
        vsharpVersion="V# 1.0 (Modules + Debugger)"
        languageMode="V#"
        isVisible={statusBarOpen}
        errorCount={problems.length}
        onToggleConsole={() => setConsoleOpen((prev) => !prev)}
      />

      {/* 5. Modals & Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        commands={commandPaletteItems}
      />

      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        settings={settings}
        onUpdateSettings={(newSet) => setSettings((prev) => ({ ...prev, ...newSet }))}
      />
    </div>
  );
}
