export interface VSharpExample {
  id: string;
  name: string;
  title: string;
  description: string;
  code: string;
}

export const TREASURE_QUEST_CODE = `say.title "TREASURE QUEST"
say.box "A V# Console Adventure"
say.line

say "Welcome brave adventurer!"
set name = ask "What is your name, traveler?"

set health = 100
set coins = 0
set backpack = ["Torch", "Rusty Dagger", "Bread"]
set monsters = ["Goblin", "Skeleton", "Shadow Wolf"]
set treasures = ["Ruby Gem", "Golden Goblet", "Diamond Necklace"]

make show_stats
    say.line
    say name + " the Adventurer"
    say "Health: " + health
    say "Coins:  " + coins
    say "Items:  " + backpack
    say.line
end

say.box "Goal: Collect 60 coins to win!"

while health > 0
    show_stats
    say "What will you do next?"
    say "1. Explore the dungeon"
    say "2. Rest by the campfire (+20 health)"
    say "3. Visit the merchant"
    say "4. Give up and leave"
    
    set action = ask.number "Choose an action (1, 2, 3, or 4):"

    if action = 1
        say.line
        say "You venture into the dark dungeon..."
        wait 0.5
        set event_roll = random 1 100

        if event_roll > 50
            # Monster encounter!
            set enemy = choose monsters
            say "A wild " + enemy + " jumps out from the shadows!"
            set enemy_power = random 10 25
            
            say "1. Fight back!"
            say "2. Try to flee!"
            set fight_choice = ask.number "Choose (1 or 2):"

            if fight_choice = 1
                set player_attack = random 15 35
                say "You swing your dagger dealing " + player_attack + " damage!"
                if player_attack >= enemy_power
                    set loot = random 15 30
                    set coins = coins + loot
                    say.box "Victory! You defeated the " + enemy + " and found " + loot + " coins!"
                else
                    set health = health - enemy_power
                    say "The " + enemy + " struck you for " + enemy_power + " damage!"
                end
            else
                set escape_chance = random 1 2
                if escape_chance = 1
                    say "You successfully escaped back to safety!"
                else
                    set health = health - 10
                    say "The monster slashed your back for 10 damage as you ran!"
                end
            end
        else
            # Found treasure!
            set prize = choose treasures
            set prize_value = random 20 40
            set coins = coins + prize_value
            add prize to backpack
            say.box "TREASURE! You uncovered a " + prize + " worth " + prize_value + " coins!"
        end

    else if action = 2
        set health = health + 20
        if health > 100
            set health = 100
        end
        say "You rested by the fire and recovered health. Current Health: " + health

    else if action = 3
        say.line
        say "The merchant offers healing potion for 15 coins."
        if coins >= 15
            set buy = ask "Buy potion? (yes / no):"
            if buy = "yes"
                set coins = coins - 15
                set health = health + 40
                if health > 100
                    set health = 100
                end
                say "You drank the potion! Health restored to " + health
            else
                say "You decided not to buy."
            end
        else
            say "You don't have enough coins right now."
        end

    else if action = 4
        say "You decided to leave the dungeon."
        break
    else
        say "Invalid choice. Please choose 1, 2, 3, or 4."
    end

    # Check winning condition
    if coins >= 60
        say.line
        say.title "VICTORY!"
        say.box "Congratulations " + name + "! You gathered " + coins + " coins and won the quest!"
        break
    end

    # Check health
    if health <= 0
        say.line
        say.title "DEFEATED"
        say.box "Your health reached 0. " + name + " perished in the dungeon."
        break
    end
end

say.line
say "Thank you for playing Treasure Quest in V#!"`;

export const GUESS_THE_NUMBER_CODE = `say.title "GUESS THE NUMBER"
say.line

set secret = random 1 10
set attempts = 0

say "I'm thinking of a number from 1 to 10."

while true
    set guess = ask.number "Your guess:"

    set attempts = attempts + 1

    if guess = secret
        say.box "You got it!"
        say "Total attempts: " + attempts
        break
    else if guess < secret
        say "Too low! Try higher."
    else
        say "Too high! Try lower."
    end
end`;

export const ROCK_PAPER_SCISSORS_CODE = `say.title "ROCK PAPER SCISSORS"
say.line

set player = ask "Choose rock, paper, or scissors:"
set computer = choose ["rock", "paper", "scissors"]

say "Computer chose: " + computer

if player = computer
    say.box "It's a draw!"
else
    if player = "rock"
        if computer = "scissors"
            say.box "You win! Rock smashes scissors."
        else
            say.box "You lose! Paper covers rock."
        end
    end

    if player = "paper"
        if computer = "rock"
            say.box "You win! Paper covers rock."
        else
            say.box "You lose! Scissors cut paper."
        end
    end

    if player = "scissors"
        if computer = "paper"
            say.box "You win! Scissors cut paper."
        else
            say.box "You lose! Rock crushes scissors."
        end
    end
end`;

export const MODULAR_MAIN_CODE = `# Modular V# Adventure
use gameTools
use mathTools

say.title "HERO QUEST"
say.box "A Multi-File V# Game"
say.line

set hero_name = ask "What is your hero's name?"
say "Welcome, " + hero_name + "!"

set level = 1
set gold = 50
set bonus = calculate_bonus level gold
say "Starting bonus gold: " + bonus

say.line
say "Your journey begins in the Whispering Forest..."
spawn_monster "Forest Goblin" 30
`;

export const GAME_TOOLS_CODE = `# Game Utilities Module
# Loaded in other files via: use gameTools

make spawn_monster name hp
    say.line
    say "⚔️ A wild " + name + " appears!"
    say "Enemy Health: " + hp
    say.line
end

make roll_dice sides
    give random 1 sides
end
`;

export const MATH_TOOLS_CODE = `# Math Utilities Module
# Loaded in other files via: use mathTools

make add a b
    give a + b
end

make multiply a b
    give a * b
end

make calculate_bonus level gold
    set multiplier = 10
    give (level * multiplier) + gold
end
`;

export const MATH_AND_TEXT_CODE = `say "hello!"

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

say apple * orange
`;

export const EXAMPLES: VSharpExample[] = [
  {
    id: 'math-and-text',
    name: 'math_and_text.v',
    title: 'Text vs Math Expressions',
    description: 'Demonstrates literal text vs real operators, wait timers, and calculations.',
    code: MATH_AND_TEXT_CODE,
  },
  {
    id: 'modular-hero',
    name: 'main.v',
    title: 'Hero Quest (Multi-Module)',
    description: 'Demonstrates the V# module system using "use gameTools" and "use mathTools".',
    code: MODULAR_MAIN_CODE,
  },
  {
    id: 'treasure-quest',
    name: 'treasure_quest.v#',
    title: 'Treasure Quest',
    description: 'Full playable RPG adventure with enemies, choices, and loot.',
    code: TREASURE_QUEST_CODE,
  },
  {
    id: 'guess-number',
    name: 'guess_number.v#',
    title: 'Guess the Number',
    description: 'Classic interactive number guessing game with loops and hints.',
    code: GUESS_THE_NUMBER_CODE,
  },
  {
    id: 'rock-paper-scissors',
    name: 'rock_paper_scissors.v#',
    title: 'Rock Paper Scissors',
    description: 'Play against the computer with choose and conditions.',
    code: ROCK_PAPER_SCISSORS_CODE,
  },
];
