import { VSharpProjectConfig } from '../vsharp/types';
import { serializeVproj } from '../vsharp/project';

const STORAGE_KEY = 'vsharp_ide_workspace_v2';

export const FINAL_ACCEPTANCE_TEST_FILES: Record<string, string> = {
  'main.v': `use player
use combat

say.title "V# RPG TEST"

set enemy = {
    name: "Goblin",
    health: 50,
    armor: 5
}

set playerData = {
    name: "Hayden",
    health: 100,
    power: 20
}

set damage = hit playerData enemy

say "Enemy: " + enemy.name
say "Damage: " + damage

if enemy.health > 0
    say "The enemy is still alive!"
else
    say "Enemy defeated!"
end`,

  'player.v': `make createPlayer name health power
    set player = {
        name: name,
        health: health,
        power: power
    }

    give player
end`,

  'combat.v': `make hit attacker defender
    set damage = attacker.power - defender.armor

    if damage < 0
        set damage = 0
    end

    set defender.health = defender.health - damage

    give damage
end`,

  'project.vproj': `{
  "name": "V# RPG Adventure",
  "start": "main.v",
  "version": "1.0",
  "author": "Hayden",
  "description": "Multi-file V# RPG test demonstration"
}`,
};

export interface WorkspaceData {
  config: VSharpProjectConfig;
  files: Record<string, string>;
  openTabs: string[];
  activeTab: string;
  breakpoints: Record<string, number[]>;
  settings: {
    theme: 'dark' | 'light';
    fontSize: number;
    autosave: boolean;
    minimap: boolean;
  };
}

export function loadWorkspace(): WorkspaceData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data && data.files && Object.keys(data.files).length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.warn('Could not load workspace from localStorage:', err);
  }

  // Initial default: Acceptance Test multi-file project
  return {
    config: {
      name: 'V# RPG Adventure',
      start: 'main.v',
      version: '1.0',
    },
    files: { ...FINAL_ACCEPTANCE_TEST_FILES },
    openTabs: ['main.v', 'player.v', 'combat.v'],
    activeTab: 'main.v',
    breakpoints: {},
    settings: {
      theme: 'dark',
      fontSize: 13,
      autosave: true,
      minimap: true,
    },
  };
}

export function saveWorkspace(data: WorkspaceData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('Could not save workspace to localStorage:', err);
  }
}
