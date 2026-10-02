import React, { useState } from 'react';
import { 
  BookOpen, 
  Copy, 
  Check, 
  Code2, 
  Search, 
  ExternalLink, 
  Sparkles, 
  Zap, 
  HelpCircle,
  Hash,
  Terminal,
  ShieldAlert
} from 'lucide-react';

interface DocumentationPanelProps {
  onInsertCode?: (snippet: string) => void;
  onOpenFullManual?: () => void;
}

export const DocumentationPanel: React.FC<DocumentationPanelProps> = ({
  onInsertCode,
  onOpenFullManual,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const tags = [
    { id: 'all', label: 'All' },
    { id: 'golden', label: '⭐ Golden Rule' },
    { id: 'io', label: 'Output / Input' },
    { id: 'math', label: 'Math & Logic' },
    { id: 'modules', label: 'Modules' },
    { id: 'async', label: 'Async Timers' },
  ];

  const sections = [
    {
      id: 'golden-rule',
      tag: 'golden',
      badge: 'Core Rule',
      badgeColor: 'text-amber-400 bg-amber-500/15 border-amber-500/30',
      title: 'Quoted Text vs. Real Operators',
      description: 'Quoted text "..." is always literal. Operators (+, -, *, /) and variable names inside quotes are never calculated.',
      code: `# Quoted Text is LITERAL
say "apple + orange"        # Output: apple + orange
say "whats apple x orange?" # Output: whats apple x orange?

# Outside Quotes is EVALUATED
set apple = 2
set orange = 5
say apple + orange          # Output: 7
say apple * orange          # Output: 10

# Combining Text + Expression
say "Total: " + (apple + orange)

# Explicit {var} Interpolation
say "Apple: {apple} and Orange: {orange}"`,
    },
    {
      id: 'async-wait',
      tag: 'async',
      badge: 'Non-Blocking',
      badgeColor: 'text-cyan-400 bg-cyan-500/15 border-cyan-500/30',
      title: 'Wait & Timers: wait(seconds)',
      description: 'Pause execution smoothly using wait(2) or wait 2 without locking or freezing the browser.',
      code: `say "Ready..."
wait(1)
say "Set..."
wait(1)
say "GO!"`,
    },
    {
      id: 'math-precedence',
      tag: 'math',
      badge: 'Math',
      badgeColor: 'text-sky-400 bg-sky-500/15 border-sky-500/30',
      title: 'Operator Precedence & Math',
      description: 'V# respects standard mathematical order of operations: () > *, /, % > +, - > comparisons.',
      code: `# 2 + 3 * 4 = 14 (not 20)
say 2 + 3 * 4

# Parentheses override
say (2 + 3) * 4

# Float division and modulo
say 10 / 4
say 17 % 5`,
    },
    {
      id: 'io-commands',
      tag: 'io',
      badge: 'Console',
      badgeColor: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
      title: 'Output & Input Commands',
      description: 'Output messages with say, say.title, say.line, say.box, and ask for user input with ask / ask.number.',
      code: `say.box "V# ADVENTURE"
say.title "Status"
say "Hero: " + playerName
say.line

set name = ask "Hero name? "
set level = ask.number "Hero level? "`,
    },
    {
      id: 'modules-use',
      tag: 'modules',
      badge: 'Multi-File',
      badgeColor: 'text-purple-400 bg-purple-500/15 border-purple-500/30',
      title: 'Multi-File Modules: use <module>',
      description: 'Break your program into reusable .v files with circular dependency protection and smart caching.',
      code: `# combat.v
make hit attacker defender
    set dmg = attacker.power - defender.armor
    give dmg
end

# main.v
use combat
set damage = hit player enemy`,
    },
    {
      id: 'stdlib',
      tag: 'modules',
      badge: 'Standard Lib',
      badgeColor: 'text-teal-400 bg-teal-500/15 border-teal-500/30',
      title: 'Standard Library Modules',
      description: 'Built-in modules ready to use: mathTools, stringTools, timeTools.',
      code: `use mathTools
say square_root 64
say clamp 120 0 100

use stringTools
say upper "hello v#"
say contains "Hayden" "den"

use timeTools
say time.today`,
    },
    {
      id: 'loops-conditions',
      tag: 'math',
      badge: 'Control Flow',
      badgeColor: 'text-blue-400 bg-blue-500/15 border-blue-500/30',
      title: 'Conditions & Loops',
      description: 'Natural English keywords: if, else if, else, end, repeat, while, for in, and, or, not.',
      code: `if health > 0 and alive = true
    say "Still standing!"
else
    say "Defeated!"
end

repeat 3
    say "Charging!"
end

set items = ["Sword", "Shield"]
for item in items
    say "Item: " + item
end`,
    },
    {
      id: 'records',
      tag: 'golden',
      badge: 'Structures',
      badgeColor: 'text-rose-400 bg-rose-500/15 border-rose-500/30',
      title: 'Records & Property Access',
      description: 'Group related information together in objects with dot notation.',
      code: `set hero = {
    name: "Arthur",
    health: 100,
    inventory: ["Sword", "Potion"]
}

say hero.name
set hero.health = 80
say "Health: " + hero.health`,
    },
    {
      id: 'error-handling',
      tag: 'golden',
      badge: 'Resilience',
      badgeColor: 'text-amber-400 bg-amber-500/15 border-amber-500/30',
      title: 'Error Handling: attempt / recover',
      description: 'Safely catch runtime exceptions without crashing the program.',
      code: `attempt
    set answer = 100 / 0
recover err
    say "Caught error: " + err.message
end`,
    },
  ];

  const handleCopy = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const filtered = sections.filter((sec) => {
    const matchesTag = selectedTag === 'all' || sec.tag === selectedTag;
    const matchesSearch =
      sec.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sec.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sec.code.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTag && matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-[#10131b] select-none text-xs text-zinc-300 font-sans overflow-hidden">
      {/* Search & Header */}
      <div className="p-3 border-b border-white/[0.06] bg-[#0d1017] space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-xs text-zinc-200 uppercase tracking-wider">
              V# Language Manual
            </span>
          </div>
          {onOpenFullManual && (
            <button
              onClick={onOpenFullManual}
              className="text-[11px] px-2 py-0.5 rounded bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 flex items-center gap-1 transition-colors cursor-pointer"
              title="Open full interactive manual"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Full Guide</span>
            </button>
          )}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search syntax, operators, rules..."
            className="w-full bg-[#080a0e] border border-white/[0.08] rounded-md pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-500 outline-none focus:border-cyan-500/50"
          />
        </div>

        {/* Quick Tag Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none text-[11px]">
          {tags.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTag(t.id)}
              className={`px-2 py-0.5 rounded whitespace-nowrap transition-colors ${
                selectedTag === t.id
                  ? 'bg-cyan-500/25 text-cyan-300 font-medium border border-cyan-500/40'
                  : 'text-zinc-400 hover:text-zinc-200 bg-white/[0.03]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Docs List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3.5">
        {filtered.map((sec) => (
          <div
            key={sec.id}
            className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-colors space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="font-semibold text-zinc-100 text-xs">{sec.title}</h4>
                {sec.badge && (
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono border ${sec.badgeColor}`}>
                    {sec.badge}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleCopy(sec.id, sec.code)}
                  title="Copy code"
                  className="p-1 rounded text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.05]"
                >
                  {copiedId === sec.id ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
                {onInsertCode && (
                  <button
                    onClick={() => onInsertCode(sec.code)}
                    title="Insert snippet into editor"
                    className="p-1 rounded text-zinc-500 hover:text-cyan-300 hover:bg-white/[0.05]"
                  >
                    <Code2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              {sec.description}
            </p>
            <pre className="p-2.5 rounded-lg bg-[#07090e] text-cyan-100/90 font-mono text-[11px] leading-relaxed overflow-x-auto border border-white/[0.04]">
              {sec.code}
            </pre>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-8 text-zinc-500">
            <HelpCircle className="w-6 h-6 mx-auto mb-2 opacity-50" />
            <p className="text-xs">No matching documentation topics found</p>
          </div>
        )}
      </div>
    </div>
  );
};
