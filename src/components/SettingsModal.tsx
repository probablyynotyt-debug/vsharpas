import React from 'react';
import { X, Sliders, Sun, Moon, Type, Save, Map } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: {
    theme: 'dark' | 'light';
    fontSize: number;
    autosave: boolean;
    minimap: boolean;
  };
  onUpdateSettings: (newSettings: Partial<SettingsModalProps['settings']>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 select-none animate-in fade-in duration-100"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#121620] border border-white/[0.1] rounded-xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08] bg-[#0d1017]">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-xs text-zinc-100 uppercase tracking-wider">
              V# Editor Settings
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.05]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5 text-xs text-zinc-300 font-sans">
          {/* Theme */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-zinc-200">Editor Theme</div>
              <div className="text-[11px] text-zinc-500">Choose between dark obsidian or light canvas</div>
            </div>
            <div className="flex items-center gap-1 p-1 bg-white/[0.04] rounded-lg border border-white/[0.06]">
              <button
                onClick={() => onUpdateSettings({ theme: 'dark' })}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${
                  settings.theme === 'dark' ? 'bg-cyan-500/20 text-cyan-300' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Dark</span>
              </button>
              <button
                onClick={() => onUpdateSettings({ theme: 'light' })}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${
                  settings.theme === 'light' ? 'bg-cyan-500/20 text-cyan-300' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Light</span>
              </button>
            </div>
          </div>

          {/* Font Size */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-zinc-200">Editor Font Size</div>
              <div className="text-[11px] text-zinc-500">Current: {settings.fontSize}px</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onUpdateSettings({ fontSize: Math.max(11, settings.fontSize - 1) })}
                className="w-7 h-7 rounded bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 flex items-center justify-center font-bold"
              >
                -
              </button>
              <span className="font-mono text-cyan-300 w-8 text-center">{settings.fontSize}px</span>
              <button
                onClick={() => onUpdateSettings({ fontSize: Math.min(22, settings.fontSize + 1) })}
                className="w-7 h-7 rounded bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 flex items-center justify-center font-bold"
              >
                +
              </button>
            </div>
          </div>

          {/* Autosave */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-zinc-200">Autosave Workspace</div>
              <div className="text-[11px] text-zinc-500">Automatically save files to browser persistence</div>
            </div>
            <button
              onClick={() => onUpdateSettings({ autosave: !settings.autosave })}
              className={`w-10 h-5 rounded-full transition-colors relative ${
                settings.autosave ? 'bg-cyan-500' : 'bg-zinc-700'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${
                  settings.autosave ? 'right-0.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          {/* Minimap */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-zinc-200">Code Minimap</div>
              <div className="text-[11px] text-zinc-500">Display mini overview on the right edge of editor</div>
            </div>
            <button
              onClick={() => onUpdateSettings({ minimap: !settings.minimap })}
              className={`w-10 h-5 rounded-full transition-colors relative ${
                settings.minimap ? 'bg-cyan-500' : 'bg-zinc-700'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${
                  settings.minimap ? 'right-0.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="p-3 bg-[#0d1017] border-t border-white/[0.06] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-semibold text-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
