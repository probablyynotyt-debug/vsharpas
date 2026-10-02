import React from 'react';
import { X, BookOpen, Gamepad2, Play, Sparkles } from 'lucide-react';
import { EXAMPLES, VSharpExample } from '../vsharp/examples';

interface RightPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadExample?: (example: VSharpExample) => void;
  onInsertSnippet?: (snippet: string) => void;
  onLoadTemplateProject?: (templateKey: string) => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  isOpen,
  onClose,
  onLoadExample,
  onInsertSnippet,
  onLoadTemplateProject,
}) => {
  if (!isOpen) return null;

  const starterTemplates = [
    {
      id: 'rpg-multi-file',
      title: 'V# Multi-File RPG (Acceptance Test)',
      description: 'main.v with player.v and combat.v modules demonstrating records, functions, and damage calculation.',
    },
    {
      id: 'treasure-quest',
      title: 'Treasure Quest Adventure',
      description: 'Single-file text RPG with inventory, enemies, shops, and dungeon crawling.',
    },
    {
      id: 'guess-number',
      title: 'Guess the Number',
      description: 'Clean interactive console game using while loops, random, and user input.',
    },
  ];

  const quickSnippets = [
    {
      title: 'Records & Property Access',
      code: `set monster = {\n    name: "Goblin",\n    health: 50,\n    armor: 5\n}\nsay monster.name\nset monster.health = 35`,
    },
    {
      title: 'Module Import (use)',
      code: `use combat\nset damage = hit player enemy\nsay "Damage dealt: " + damage`,
    },
    {
      title: 'Collection Loop (for in)',
      code: `set backpack = ["Sword", "Potion", "Shield"]\nfor item in backpack\n    say "Inventory: " + item\nend`,
    },
    {
      title: 'Error Handling (attempt/recover)',
      code: `attempt\n    set x = 10 / 0\nrecover err\n    say "Handled error: " + err.message\nend`,
    },
  ];

  return (
    <aside 
      className="w-80 sm:w-96 bg-[#10131b] border-l border-white/[0.06] flex flex-col shrink-0 select-none overflow-hidden"
      aria-label="V# Companion Panel"
    >
      {/* Header */}
      <div className="h-9 px-3.5 border-b border-white/[0.06] flex items-center justify-between text-xs text-zinc-400">
        <div className="flex items-center gap-1.5 font-semibold text-zinc-200 tracking-wider text-[11px] uppercase">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>V# Starter Lab</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.05] transition-colors"
          title="Close Panel"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-5 text-xs text-zinc-300 font-sans">
        {/* Starter Project Templates */}
        <div>
          <div className="flex items-center gap-1.5 text-cyan-400 font-semibold uppercase tracking-wider text-[11px] mb-2.5">
            <Gamepad2 className="w-4 h-4" />
            <span>Ready-to-Play Templates</span>
          </div>
          <div className="space-y-2">
            {starterTemplates.map((t) => (
              <div
                key={t.id}
                className="p-3 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-zinc-100">{t.title}</span>
                  <button
                    onClick={() => onLoadTemplateProject?.(t.id)}
                    className="px-2 py-0.5 rounded bg-cyan-500/20 hover:bg-cyan-500/35 text-cyan-300 font-mono text-[10px] flex items-center gap-1 transition-colors"
                  >
                    <Play className="w-2.5 h-2.5 fill-current" />
                    <span>Load</span>
                  </button>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  {t.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Snippets */}
        {onInsertSnippet && (
          <div className="pt-2 border-t border-white/[0.04]">
            <h5 className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider mb-2">
              Insert V# Snippets
            </h5>
            <div className="space-y-2">
              {quickSnippets.map((snip, idx) => (
                <button
                  key={idx}
                  onClick={() => onInsertSnippet(snip.code)}
                  className="w-full text-left p-2.5 rounded bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.04] transition-colors group"
                >
                  <div className="text-[11px] font-semibold text-zinc-200 group-hover:text-cyan-400 mb-1">
                    {snip.title}
                  </div>
                  <pre className="text-[10px] text-zinc-500 font-mono overflow-hidden truncate">
                    {snip.code.split('\n')[0]}
                  </pre>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
