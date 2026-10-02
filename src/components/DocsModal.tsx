import React, { useState, useMemo } from 'react';
import { 
  X, 
  BookOpen, 
  Search, 
  Copy, 
  Check, 
  Code2, 
  Sparkles, 
  Terminal, 
  Cpu, 
  ArrowRight, 
  Hash, 
  Layers, 
  Clock, 
  ShieldCheck, 
  HelpCircle,
  FileCode2,
  ExternalLink,
  Zap,
  ListFilter
} from 'lucide-react';

interface DocsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertCode?: (snippet: string) => void;
}

interface DocTopic {
  id: string;
  category: string;
  title: string;
  badge?: string;
  badgeColor?: string;
  summary: string;
  explanation: string[];
  code: string;
  output?: string;
  tips?: string[];
}

export const DocsModal: React.FC<DocsModalProps> = ({
  isOpen,
  onClose,
  onInsertCode,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTopicId, setActiveTopicId] = useState<string>('golden-rule');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: 'All Topics' },
    { id: 'golden-rule', label: '⭐ Golden Rule (Text vs Real)' },
    { id: 'basics', label: 'Basics & I/O' },
    { id: 'strings', label: 'Strings & Interpolation' },
    { id: 'math', label: 'Math & Precedence' },
    { id: 'control', label: 'Control Flow' },
    { id: 'functions', label: 'Functions & Scope' },
    { id: 'data', label: 'Lists & Records' },
    { id: 'async', label: 'Async Timers (wait)' },
    { id: 'modules', label: 'Modules (use)' },
    { id: 'stdlib', label: 'Standard Library' },
    { id: 'tests', label: 'Canonical Test Suite' },
  ];

  const topics: DocTopic[] = useMemo(() => [
    {
      id: 'golden-rule',
      category: 'golden-rule',
      title: 'Quoted Text vs. Real Operators',
      badge: 'Core Principle',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      summary: 'In V#, there is a strict, unambiguous distinction between text inside quotes and code outside quotes.',
      explanation: [
        'Anything enclosed in double quotation marks "..." is LITERAL TEXT. Mathematical symbols inside quotes are never evaluated.',
        'Outside quotation marks, operators like +, -, *, /, %, >, <, =, and parentheses evaluate as real code.',
        'Variable names inside quotes are NOT replaced automatically: say "apple" prints "apple", not its value.',
        'To insert variables inside text, use explicit curly braces: "Apple: {apple}".',
      ],
      code: `# 1. Quoted Text is LITERAL
say "apple + orange"        # Prints: apple + orange
say "whats apple x orange?" # Prints: whats apple x orange?

# 2. Outside Quotes is EVALUATED
set apple = 2
set orange = 5
say apple + orange          # Prints: 7
say apple * orange          # Prints: 10

# 3. Combining Text with Expressions
say "Total: " + (apple + orange) # Prints: Total: 7

# 4. Explicit {variable} Interpolation
say "Apple has {apple} and orange has {orange}"`,
      output: `apple + orange
whats apple x orange?
7
10
Total: 7
Apple has 2 and orange has 5`,
      tips: [
        'Letters like "x" inside quotes are just ordinary text words, never special math operators.',
        'Outside quotes, multiplication is always the "*" asterisk operator.',
      ],
    },
    {
      id: 'variables-io',
      category: 'basics',
      title: 'Variables & Output Commands',
      badge: 'Syntax',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      summary: 'Store data using "set" and display results using "say", "say.title", "say.line", or "say.box".',
      explanation: [
        'Use "set <name> = <value>" to create or update variables.',
        'The "say" command prints text, variables, or expressions on a new line in the console.',
        '"say.hello" gives an instant friendly greeting.',
        '"say.title", "say.line", and "say.box" provide formatted decorative output headers.',
      ],
      code: `set playerName = "Knight"
set playerLevel = 1
set gold = 250

say.box "WELCOME TO THE ARENA"
say.title "Player Status"
say "Hero: " + playerName
say "Level: " + playerLevel
say "Gold in pouch: " + gold
say.line`,
      output: `╔══════════════════════╗
║ WELCOME TO THE ARENA ║
╚══════════════════════╝
=== Player Status ===
Hero: Knight
Level: 1
Gold in pouch: 250
──────────────────────`,
      tips: [
        'Variable names can contain letters, numbers, and underscores (e.g. player_level).',
      ],
    },
    {
      id: 'user-input',
      category: 'basics',
      title: 'Interactive User Input (ask)',
      badge: 'Input / Output',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      summary: 'Prompt users for interactive responses using "ask" and "ask.number".',
      explanation: [
        'Use "ask <prompt>" to request text input from the console dock.',
        'Use "ask.number <prompt>" when expecting a numerical response (automatically parsed to a number).',
      ],
      code: `set heroName = ask "Enter your hero name: "
set age = ask.number "Enter your hero age: "

say "Welcome, " + heroName + "! Age: " + age`,
      output: `Enter your hero name: Hayden
Enter your hero age: 24
Welcome, Hayden! Age: 24`,
      tips: [
        'The console dock features an interactive input field that automatically prompts the user when "ask" runs.',
      ],
    },
    {
      id: 'string-interpolation',
      category: 'strings',
      title: 'Strings, Escapes & {variable} Interpolation',
      badge: 'Text Engine',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      summary: 'Robust string literals supporting escape sequences and explicit curly-brace interpolation.',
      explanation: [
        'Strings are enclosed in double quotes: "Hello world".',
        'Standard escape sequences are supported: \\" for quotation marks, \\n for newlines, \\t for tabs, and \\\\ for backslashes.',
        'V# does not automatically inspect or replace words in strings, preventing accidental variable collisions.',
        'To embed variable values directly inside a string, place them in {curly_braces}.',
      ],
      code: `set item = "Mystic Wand"
set cost = 75

# Literal string without replacements
say "The price of item is cost"

# Explicit {variable} interpolation
say "The price of {item} is {cost} gold."

# Escaped quotes and newlines
say "The shopkeeper whispered: \\"Take this.\\"\\nSafe travels!"`,
      output: `The price of item is cost
The price of Mystic Wand is 75 gold.
The shopkeeper whispered: "Take this."
Safe travels!`,
      tips: [
        'Expressions can also be used inside interpolation: "Sum: {apple + orange}".',
      ],
    },
    {
      id: 'math-operators',
      category: 'math',
      title: 'Math Operators & Precedence',
      badge: 'Arithmetic',
      badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
      summary: 'Full arithmetic support obeying standard mathematical operator precedence.',
      explanation: [
        'Operators: + (addition), - (subtraction), * (multiplication), / (division), % (modulo/remainder).',
        'Multiplication, division, and modulo take precedence over addition and subtraction.',
        'Use parentheses ( ... ) to explicitly override precedence.',
        'V# reports division by zero with helpful error diagnostics.',
      ],
      code: `# Standard Precedence: 2 + (3 * 4) = 14
say 2 + 3 * 4

# Parentheses override precedence: (2 + 3) * 4 = 20
say (2 + 3) * 4

# Modulo operator for remainders
set remainder = 17 % 5
say "17 % 5 = " + remainder

# Float arithmetic
say 10 / 4`,
      output: `14
20
17 % 5 = 2
2.5`,
      tips: [
        'Remember: inside quotes, "2 + 3 * 4" prints literally as text: 2 + 3 * 4.',
      ],
    },
    {
      id: 'comparisons-logic',
      category: 'control',
      title: 'Comparisons & Logical Conditions',
      badge: 'Logic',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      summary: 'Branch execution with if, else if, else, end, and natural English logic words.',
      explanation: [
        'Comparison operators: = (equals), != (not equals), > (greater), < (less), >= (greater or equal), <= (less or equal).',
        'Logical operators: "and", "or", and "not".',
        'Every if block is closed with the "end" keyword.',
      ],
      code: `set health = 45
set hasPotion = true

if health > 50
    say "Health is healthy!"
else if health > 20 and hasPotion
    say "Health is low! Drinking healing potion..."
    set health = health + 50
    say "New health: " + health
else
    say "Warning: Critical health!"
end`,
      output: `Health is low! Drinking healing potion...
New health: 95`,
      tips: [
        'In V#, equality comparison is a single "=" outside quotes, matching natural reading.',
      ],
    },
    {
      id: 'loops',
      category: 'control',
      title: 'Loops: repeat, while & for-in',
      badge: 'Iteration',
      badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
      summary: 'Repeat actions a fixed number of times, while a condition holds, or iterate through collections.',
      explanation: [
        '"repeat <count>" repeats a block a fixed number of times.',
        '"while <condition>" loops while the condition evaluates to true.',
        '"for <item> in <list>" loops across each element of a list.',
        'Use "break" to exit any loop immediately.',
      ],
      code: `# 1. Repeat a fixed count
repeat 3
    say "Powering up..."
end

# 2. While loop with countdown
set energy = 3
while energy > 0
    say "Energy remaining: " + energy
    set energy = energy - 1
end

# 3. For-in loop over a list
set gems = ["Ruby", "Sapphire", "Emerald"]
for gem in gems
    say "Found precious gem: " + gem
end`,
      output: `Powering up...
Powering up...
Powering up...
Energy remaining: 3
Energy remaining: 2
Energy remaining: 1
Found precious gem: Ruby
Found precious gem: Sapphire
Found precious gem: Emerald`,
      tips: [
        'Loops are protected against browser hangs with cancellation hooks and step yielding.',
      ],
    },
    {
      id: 'functions-scope',
      category: 'functions',
      title: 'Functions & Lexical Scope (make / give)',
      badge: 'Functions',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      summary: 'Declare reusable procedures with "make", return results with "give", and manage scope with "share".',
      explanation: [
        'Define a function with: make <name> <param1> <param2> ... body ... end.',
        'Return values using: give <expression>.',
        'Variables declared inside a function are local to that function call.',
        'To read or modify global state from inside a function, declare with "share <variable> = <value>".',
      ],
      code: `share globalHighscore = 100

make calculateScore points bonus
    set total = points * 2 + bonus
    if total > globalHighscore
        share globalHighscore = total
    end
    give total
end

set roundScore = calculateScore 40 25
say "Round Score: " + roundScore
say "New Highscore: " + globalHighscore`,
      output: `Round Score: 105
New Highscore: 105`,
      tips: [
        'Functions can be called with space-separated arguments (calculateScore 40 25) or with parentheses calculateScore(40, 25).',
      ],
    },
    {
      id: 'lists-records',
      category: 'data',
      title: 'Lists & Structured Records',
      badge: 'Data Structures',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      summary: 'Work with ordered collections and composite records with dot property access.',
      explanation: [
        'Lists are created with brackets: ["Sword", "Shield", "Potion"].',
        'Access list items with 1-based indexing: inventory[1].',
        'Add items with "add <item> to <list>" and remove with "remove <item> from <list>".',
        'Records are defined with curly braces: set hero = { name: "Arthur", hp: 100 }.',
        'Access and update record properties using dot notation: hero.name, set hero.hp = 80.',
      ],
      code: `# Lists
set party = ["Warrior", "Mage", "Rogue"]
add "Cleric" to party
say "Party leader: " + party[1]
say "Full party: " + party

# Records
set hero = {
    name: "Arthur",
    health: 120,
    weapon: "Excalibur"
}

say hero.name + " wields " + hero.weapon
set hero.health = hero.health - 20
say "Health after battle: " + hero.health`,
      output: `Party leader: Warrior
Full party: [Warrior, Mage, Rogue, Cleric]
Arthur wields Excalibur
Health after battle: 100`,
      tips: [
        'Random element selection from a list can be done with "choose": set surprise = choose ["Dragon", "Goblin", "Slime"].',
      ],
    },
    {
      id: 'async-timers',
      category: 'async',
      title: 'Non-Blocking Timers: wait(seconds)',
      badge: 'Async Engine',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      summary: 'Pause execution smoothly without locking up the browser or freezing the IDE.',
      explanation: [
        'Use "wait(seconds)" or "wait seconds" to pause execution.',
        'Wait uses asynchronous timers internally, keeping the browser UI fully responsive and interactive.',
        'The user can pause, step, or stop execution during a wait at any time.',
      ],
      code: `say "Starting countdown in 3 seconds..."
wait(1)
say "3..."
wait(1)
say "2..."
wait(1)
say "1..."
wait(1)
say "LIFTOFF!"`,
      output: `Starting countdown in 3 seconds...
3...
2...
1...
LIFTOFF!`,
      tips: [
        'Both wait(2) and wait 2 are valid and perform identical non-blocking delays.',
      ],
    },
    {
      id: 'modules-use',
      category: 'modules',
      title: 'Multi-File Modules (use <module>)',
      badge: 'Modular Architecture',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      summary: 'Decompose large projects into clean, reusable modules with project-wide imports.',
      explanation: [
        'Use "use <filename>" to import functions and variables from other .v files.',
        'Supports aliasing with "use <module> as <alias>".',
        'Includes circular dependency protection and smart caching for blazing-fast multi-file builds.',
        'The entry file can be set in the Project Explorer by right-clicking or clicking the Star icon.',
      ],
      code: `# --- combat.v ---
make hit attacker defender
    set damage = attacker.power - defender.armor
    set defender.health = defender.health - damage
    give damage
end

# --- main.v ---
use combat

set player = { name: "Knight", power: 25 }
set goblin = { name: "Goblin", armor: 5, health: 40 }

set dealt = hit player goblin
say "Dealt " + dealt + " damage! Goblin health: " + goblin.health`,
      output: `Dealt 20 damage! Goblin health: 20`,
      tips: [
        'File extensions are optional: "use combat" automatically locates combat.v.',
      ],
    },
    {
      id: 'stdlib-modules',
      category: 'stdlib',
      title: 'Standard Library Modules',
      badge: 'Built-in Tools',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      summary: 'Out-of-the-box utility modules ready for import.',
      explanation: [
        '"mathTools": square_root, power, round, abs, clamp, sin, cos.',
        '"stringTools": upper, lower, contains, length_of, slice_text, replace_text.',
        '"timeTools": time.now, time.today, time.stamp.',
      ],
      code: `use mathTools
use stringTools
use timeTools

# Math tools
say "Sqrt of 144: " + square_root 144
say "Clamped (150, 0, 100): " + clamp 150 0 100

# String tools
say upper "hello world from v#"
say "Contains 'v#'? " + contains "hello v#" "v#"

# Time tools
say "Today is: " + time.today`,
      output: `Sqrt of 144: 12
Clamped (150, 0, 100): 100
HELLO WORLD FROM V#
Contains 'v#'? true
Today is: 2026-10-02`,
      tips: [
        'Standard library modules are always available and do not require external installation.',
      ],
    },
    {
      id: 'error-recovery',
      category: 'control',
      title: 'Error Handling (attempt / recover)',
      badge: 'Resilience',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      summary: 'Catch and recover from runtime errors gracefully without halting the application.',
      explanation: [
        'Wrap potentially risky operations in "attempt ... recover <errVar> ... end".',
        'The caught error object provides err.title and err.message for inspection.',
      ],
      code: `attempt
    set risky = 100 / 0
recover err
    say "Handled gracefully: " + err.message
    set risky = 0
end

say "Program continued safely! Result: " + risky`,
      output: `Handled gracefully: Cannot divide a number by zero.
Program continued safely! Result: 0`,
      tips: [
        'The IDE Problems panel will also flag syntax errors before running your code.',
      ],
    },
    {
      id: 'canonical-tests',
      category: 'tests',
      title: 'V# Specification Acceptance Tests',
      badge: 'Verified 8/8 Tests',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      summary: 'The 8 official test suites specified in the language standard. All 8 execute cleanly.',
      explanation: [
        'Test 1: Variable addition (2 + 5 = 7)',
        'Test 2 & 3: Quoted math remains literal ("apple + orange", "apple * orange")',
        'Test 4: Expression combination ("The answer is " + (apple + orange) = "The answer is 7")',
        'Test 5: Explicit variable interpolation ("Apple: {apple}" = "Apple: 2")',
        'Test 6 & 7: Operator precedence (2 + 3 * 4 = 14, "2 + 3 * 4" = "2 + 3 * 4")',
        'Test 8: Full async sequence with wait(2), wait(5), textual "x", and multiplication (*).',
      ],
      code: `# --- TEST 8 FROM SPECIFICATION ---
say "hello!"

wait(2)

say "whats apple + orange?"

wait(5)

set apple = 2
set orange = 5
set peach = 231

say apple + orange

wait(2)

say "nice! now whats apple x orange?"

wait(2)

say apple * orange`,
      output: `hello!
whats apple + orange?
7
nice! now whats apple x orange?
10`,
      tips: [
        'Click "Insert into Editor" to try any test immediately in your editor.',
      ],
    },
  ], []);

  const filteredTopics = useMemo(() => {
    return topics.filter((topic) => {
      const matchesCategory =
        selectedCategory === 'all' || topic.category === selectedCategory;
      const matchesSearch =
        searchTerm.trim() === '' ||
        topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        topic.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        topic.code.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [topics, selectedCategory, searchTerm]);

  const activeTopic = useMemo(() => {
    return (
      topics.find((t) => t.id === activeTopicId) ||
      filteredTopics[0] ||
      topics[0]
    );
  }, [topics, activeTopicId, filteredTopics]);

  const handleCopy = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 z-50 select-none animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl h-[90vh] max-h-[850px] bg-[#0f1219] border border-white/[0.09] rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="h-14 px-5 border-b border-white/[0.07] bg-[#0c0e15] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm sm:text-base text-zinc-100 tracking-tight">
                  V# Language Specification & Reference Manual
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-mono font-semibold">
                  v1.0 LTS
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 hidden sm:block">
                The official guide to writing expressive, beginner-friendly V# programs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06] transition-colors"
              title="Close Manual (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="px-5 py-2.5 border-b border-white/[0.06] bg-[#0a0c12] flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between shrink-0">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search concepts, operators, syntax, examples..."
              className="w-full bg-[#121622] border border-white/[0.08] rounded-lg pl-9 pr-4 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-500 outline-none focus:border-cyan-500/50 transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
            <span className="text-[11px] text-zinc-500 font-medium mr-1 flex items-center gap-1">
              <ListFilter className="w-3 h-3" /> Filter:
            </span>
            {categories.slice(0, 5).map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-zinc-400 hover:text-zinc-200 bg-white/[0.03] hover:bg-white/[0.06]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Split Body: Sidebar Navigation + Detailed Topic View */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Topics List Navigation Sidebar */}
          <div className="w-64 sm:w-72 bg-[#0c0e15] border-r border-white/[0.06] flex flex-col shrink-0 overflow-y-auto p-2.5 space-y-1">
            <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider px-2 py-1 mb-1">
              {filteredTopics.length} Documentation Topics
            </div>
            {filteredTopics.map((topic) => {
              const isSelected = activeTopic.id === topic.id;
              return (
                <button
                  key={topic.id}
                  onClick={() => setActiveTopicId(topic.id)}
                  className={`w-full text-left p-2.5 rounded-lg transition-all flex flex-col gap-1 border ${
                    isSelected
                      ? 'bg-cyan-500/10 border-cyan-500/30 text-zinc-100 shadow-xs'
                      : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`text-xs font-semibold truncate ${isSelected ? 'text-cyan-300' : ''}`}>
                      {topic.title}
                    </span>
                    {topic.badge && (
                      <span className={`text-[9px] px-1.5 py-0.2 rounded-md font-mono border ${topic.badgeColor || 'bg-white/[0.05] text-zinc-400 border-white/[0.08]'}`}>
                        {topic.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-500 line-clamp-1 leading-snug">
                    {topic.summary}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Detailed Content Panel */}
          <div className="flex-1 bg-[#10131b] overflow-y-auto p-6 space-y-6">
            {activeTopic ? (
              <div className="max-w-3xl space-y-6 animate-in fade-in duration-100">
                {/* Topic Header */}
                <div className="space-y-2 border-b border-white/[0.06] pb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-zinc-100 tracking-tight">
                      {activeTopic.title}
                    </h3>
                    {activeTopic.badge && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono border font-semibold ${activeTopic.badgeColor}`}>
                        {activeTopic.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {activeTopic.summary}
                  </p>
                </div>

                {/* Key Bullet Explanations */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>How it Works</span>
                  </h4>
                  <ul className="space-y-2">
                    {activeTopic.explanation.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-zinc-300 leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Interactive Code Example Box */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                      <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Code Example</span>
                    </h4>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleCopy(activeTopic.id, activeTopic.code)}
                        className="px-2.5 py-1 rounded-md bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-xs font-medium text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Copy snippet"
                      >
                        {copiedId === activeTopic.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400 text-[11px]">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-zinc-400" />
                            <span className="text-[11px]">Copy</span>
                          </>
                        )}
                      </button>

                      {onInsertCode && (
                        <button
                          onClick={() => {
                            onInsertCode(activeTopic.code);
                            onClose();
                          }}
                          className="px-2.5 py-1 rounded-md bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-500/30 text-xs font-medium text-cyan-300 hover:text-cyan-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Insert into active editor"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span className="text-[11px]">Insert into Editor</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl overflow-hidden border border-white/[0.08] bg-[#07090e]">
                    <div className="px-3.5 py-2 bg-white/[0.02] border-b border-white/[0.05] flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                      <span>example.v</span>
                      <span>V# Syntax</span>
                    </div>
                    <pre className="p-4 font-mono text-xs text-cyan-100 overflow-x-auto leading-relaxed select-text">
                      {activeTopic.code}
                    </pre>
                  </div>
                </div>

                {/* Expected Console Output */}
                {activeTopic.output && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Expected Console Output</span>
                    </h4>
                    <div className="p-3.5 rounded-xl bg-black/60 border border-emerald-500/20 font-mono text-xs text-emerald-300 whitespace-pre-wrap select-text leading-relaxed">
                      {activeTopic.output}
                    </div>
                  </div>
                )}

                {/* Pro Tips */}
                {activeTopic.tips && activeTopic.tips.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-amber-500/[0.06] border border-amber-500/20 text-amber-200 text-xs space-y-1">
                    <div className="font-semibold flex items-center gap-1.5 text-amber-300">
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      <span>Best Practice</span>
                    </div>
                    {activeTopic.tips.map((tip, i) => (
                      <p key={i} className="text-[11px] text-amber-200/80 leading-relaxed">
                        {tip}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <HelpCircle className="w-8 h-8 text-zinc-600 mb-2" />
                <p className="text-xs text-zinc-500">Select a topic from the sidebar</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t border-white/[0.07] bg-[#0c0e15] flex items-center justify-between text-[11px] text-zinc-500 shrink-0">
          <span>V# Language Reference Manual · Quoted Literals & Real Operators Standard</span>
          <div className="flex items-center gap-3">
            <span>Press <kbd className="px-1 py-0.5 rounded bg-white/[0.06] font-mono text-zinc-400">Esc</kbd> to close</span>
          </div>
        </div>
      </div>
    </div>
  );
};
