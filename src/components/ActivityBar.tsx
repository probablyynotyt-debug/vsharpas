import React from 'react';
import { 
  Files, 
  Bug, 
  AlertCircle, 
  BookOpen, 
  Search, 
  Settings,
} from 'lucide-react';

export type ActivityTab = 'explorer' | 'debugger' | 'problems' | 'docs' | 'search';

interface ActivityBarProps {
  activeTab: ActivityTab;
  onSelectTab: (tab: ActivityTab) => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  problemCount?: number;
  onOpenSettings?: () => void;
}

export const ActivityBar: React.FC<ActivityBarProps> = ({
  activeTab,
  onSelectTab,
  sidebarOpen,
  onToggleSidebar,
  problemCount = 0,
  onOpenSettings,
}) => {
  const tools: { id: ActivityTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'explorer', label: 'Explorer', icon: <Files className="w-5 h-5" /> },
    { id: 'debugger', label: 'Debugger', icon: <Bug className="w-5 h-5" /> },
    { 
      id: 'problems', 
      label: 'Problems', 
      icon: <AlertCircle className="w-5 h-5" />, 
      badge: problemCount > 0 ? problemCount : undefined 
    },
    { id: 'docs', label: 'Documentation', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'search', label: 'Search in Project', icon: <Search className="w-5 h-5" /> },
  ];

  const handleTabClick = (tabId: ActivityTab) => {
    if (activeTab === tabId && sidebarOpen) {
      onToggleSidebar();
    } else {
      onSelectTab(tabId);
      if (!sidebarOpen) {
        onToggleSidebar();
      }
    }
  };

  return (
    <nav 
      aria-label="Activity Bar"
      className="w-12 bg-[#090b0f] border-r border-white/[0.06] flex flex-col justify-between items-center py-2.5 shrink-0 z-10 select-none"
    >
      {/* Top tools */}
      <div className="flex flex-col items-center gap-1.5 w-full">
        {tools.map((tool) => {
          const isActive = activeTab === tool.id && sidebarOpen;
          return (
            <button
              key={tool.id}
              onClick={() => handleTabClick(tool.id)}
              title={tool.label}
              className={`relative w-10 h-10 flex items-center justify-center rounded-lg transition-colors group ${
                isActive
                  ? 'text-cyan-400 bg-white/[0.05]'
                  : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.03]'
              }`}
            >
              {/* Active left indicator */}
              {isActive && (
                <span className="absolute left-0 top-2 bottom-2 w-0.5 bg-cyan-400 rounded-r" />
              )}
              {tool.icon}

              {/* Problem count badge */}
              {tool.badge !== undefined && (
                <span className="absolute top-1 right-1 px-1 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-bold">
                  {tool.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom settings tool */}
      <div className="flex flex-col items-center gap-1 w-full">
        <button
          onClick={onOpenSettings}
          title="Settings"
          className="w-10 h-10 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.03] transition-colors"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </nav>
  );
};
