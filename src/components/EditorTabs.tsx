import React from 'react';
import { X, Plus, FileCode } from 'lucide-react';

export interface TabItem {
  id: string;
  name: string;
  isModified?: boolean;
}

interface EditorTabsProps {
  tabs: TabItem[];
  activeTabId: string | null;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onNewTab: () => void;
}

export const EditorTabs: React.FC<EditorTabsProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onNewTab,
}) => {
  return (
    <div className="h-9 bg-[#0e1017] border-b border-white/[0.06] flex items-center justify-between px-1 select-none shrink-0 overflow-x-auto">
      {/* Tabs List */}
      <div className="flex items-center h-full overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`group relative h-full flex items-center gap-2 px-3 text-xs border-r border-white/[0.04] cursor-pointer transition-colors ${
                isActive
                  ? 'bg-[#12151f] text-zinc-100 font-medium'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]'
              }`}
            >
              {/* Active Tab Top Highlight */}
              {isActive && (
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-cyan-400" />
              )}
              
              <FileCode className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-zinc-500'}`} />
              <span className="truncate max-w-[120px]">{tab.name}</span>

              {/* Close Tab Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(tab.id);
                }}
                className={`p-0.5 rounded hover:bg-white/[0.1] text-zinc-500 hover:text-zinc-200 transition-colors ${
                  isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
                title="Close Tab"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}

        {/* New Tab Wireframe Button */}
        <button
          onClick={onNewTab}
          title="New Tab"
          className="h-7 w-7 ml-1 flex items-center justify-center rounded text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03] transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Right Tab Bar Controls (Clean, minimal) */}
      <div className="flex items-center gap-2 pr-2 text-[11px] text-zinc-600 font-mono">
        <span>V# EDITOR</span>
      </div>
    </div>
  );
};
