import React, { useState } from 'react';
import { BookOpen, Copy, Check, Play, Search, Code2, Compass } from 'lucide-react';

interface DocumentationPanelProps {
  onInsertCode?: (snippet: string) => void;
}

export const DocumentationPanel: React.FC<DocumentationPanelProps> = ({
  onInsertCode,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const sections = [
    {
      id: 'modules',
      title: 'Modules & Multi-File (use)',
      description: 'Break your program into clean, reusable files using "use".',
      code: `# combat.v
make hit attacker defender
    set damage = attacker.power - defender.armor
    set defender.health = defender.health - damage
    give damage
end

# main.v
use combat
set damage = hit player enemy`,
    },
    {
      id: 'records',
      title: 'Records & Structured Objects',
      description: 'Group related information together with named properties.',
      code: `set hero = {
    name: "Hayden",
    health: 100,
    inventory: ["Sword", "Shield"]
}

say hero.name
set hero.health = 80
say hero.health`,
    },
    {
      id: 'scope',
      title: 'Lexical Scoping (Local by Default)',
      description: 'Variables created inside functions stay local. Use "share" for globals.',
      code: `share gameScore = 0

make updateScore bonus
    set localBonus = bonus * 2
    share gameScore = gameScore + localBonus
end

updateScore 10
say gameScore`,
    },
    {
      id: 'functions',
      title: 'Functions & Returns (make / give)',
      description: 'Define reusable blocks of code and return results with "give".',
      code: `make add a b
    give a + b
end

set result = add 10 20
say result`,
    },
    {
      id: 'loops',
      title: 'Loops (for in, repeat, while)',
      description: 'Loop over lists, repeat a fixed number of times, or loop while a condition is true.',
      code: `# Iterate over list
set items = ["Ruby", "Sapphire", "Emerald"]
for gem in items
    say "Found: " + gem
end

# Repeat
repeat 3
    say "Victory!"
end

# While
while health > 0
    set health = health - 10
end`,
    },
    {
      id: 'logic',
      title: 'Conditions & Logic (and, or, not)',
      description: 'Use natural English logical conjunctions in if conditions.',
      code: `if health > 0 and alive = true
    say "Still fighting!"
else if health <= 0 or not alive
    say "Game Over"
end`,
    },
    {
      id: 'errors',
      title: 'Error Handling (attempt / recover)',
      description: 'Catch and recover from errors gracefully without crashing your program.',
      code: `attempt
    set answer = 100 / 0
recover err
    say "Caught error: " + err.message
end`,
    },
    {
      id: 'stdlib',
      title: 'Standard Library Modules',
      description: 'Built-in modules available with "use".',
      code: `use mathTools
say square_root 64
say round 3.75

use stringTools
say upper "hello v#"
say contains "Hayden" "den"

use timeTools
say time.today`,
    },
  ];

  const handleCopy = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const filtered = sections.filter(
    (sec) =>
      sec.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sec.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sec.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-[#10131b] select-none text-xs text-zinc-300 font-sans overflow-hidden">
      {/* Search Header */}
      <div className="p-3 border-b border-white/[0.06] bg-[#0d1017]">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-xs text-zinc-200 uppercase tracking-wider">
            V# Language Manual
          </span>
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search V# syntax, functions, records..."
            className="w-full bg-[#080a0e] border border-white/[0.08] rounded-md pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-500 outline-none focus:border-cyan-500/50"
          />
        </div>
      </div>

      {/* Docs List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {filtered.map((sec) => (
          <div
            key={sec.id}
            className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1] transition-colors"
          >
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-semibold text-cyan-300 text-xs">{sec.title}</h4>
              <div className="flex items-center gap-1">
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
                    title="Insert into editor"
                    className="p-1 rounded text-zinc-500 hover:text-cyan-300 hover:bg-white/[0.05]"
                  >
                    <Code2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
            <p className="text-[11px] text-zinc-400 mb-2 leading-relaxed">
              {sec.description}
            </p>
            <pre className="p-2 rounded bg-[#080a0e] text-zinc-200 font-mono text-[11px] leading-relaxed overflow-x-auto border border-white/[0.03]">
              {sec.code}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
};
