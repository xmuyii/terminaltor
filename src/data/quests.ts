import { Quest } from '../types';

export const QUESTS: Quest[] = [
  {
    id: 'quest-1',
    level: 1,
    title: 'Variables & Ifá Logic',
    subtitle: 'Binary patterns, conditional wisdom, and gate activation',
    category: 'Fundamentals',
    xp_reward: 100,
    badge_title: 'Binary Oracle',
    badge_icon: 'Zap',
    is_pro: false,
    lore: 'Deep inside the digital sanctuary of the Sovereign Elders, binary patterns (0 and 1) mirror ancient Ifá computational lore. The Temple Portal only unlocks when the binary oracle registers the exact sacred combination: signal_a active (1) and signal_b dormant (0).',
    description: 'Learn how to declare variables and evaluate Boolean conditions using if/else branching in Python.',
    objectives: [
      'Create a variable named signal_a and set it to 1.',
      'Create a variable named signal_b and set it to 0.',
      'Write an if statement: if signal_a is 1 and signal_b is 0, print "Sanctuary Gate Open".',
      'Otherwise in the else block, print "Access Denied".'
    ],
    starter_code: `# Level 1: Variables & Ifá Logic
# Task: Declare the binary signals and evaluate the sanctuary condition

# 1. Declare the variables
signal_a = 1
signal_b = 0

# 2. Check the condition and print the sanctuary status
if signal_a == 1 and signal_b == 0:
    print("Sanctuary Gate Open")
else:
    print("Access Denied")
`,
    solution_code: `signal_a = 1
signal_b = 0

if signal_a == 1 and signal_b == 0:
    print("Sanctuary Gate Open")
else:
    print("Access Denied")
`,
    hints: [
      'Remember in Python, equality comparison uses double equals: `==`.',
      'Combine multiple logical conditions using the `and` operator.',
      'Indentation matters in Python! Use 4 spaces inside your `if` and `else` blocks.'
    ],
    test_cases: [
      {
        id: 'tc-1-1',
        title: 'Oracle Gate Status Check',
        description: 'Verify standard output outputs the sacred unlocked message.',
        expected_output: 'Sanctuary Gate Open',
        assertion_code: `assert 'signal_a' in globals(), "Variable signal_a is not defined"
assert 'signal_b' in globals(), "Variable signal_b is not defined"
assert signal_a == 1, "signal_a must equal 1"
assert signal_b == 0, "signal_b must equal 0"
`
      },
      {
        id: 'tc-1-2',
        title: 'Variable Integrity Assertion',
        description: 'Assert signal variables exist with integer values.',
        assertion_code: `assert type(signal_a) is int and type(signal_b) is int, "Signals must be integer values"`
      }
    ]
  },
  {
    id: 'quest-2',
    level: 2,
    title: 'Loop Structures & Energy Rings',
    subtitle: 'Iterative counting, for loops, and accumulator registers',
    category: 'Algorithms',
    xp_reward: 150,
    badge_title: 'Loop Harmonizer',
    badge_icon: 'Repeat',
    is_pro: false,
    lore: 'The Orbital Cyber Engine requires 5 harmonic pulse charges to reach superluminal velocity. Repeating commands by hand is slow and dangerous — automated loop sequences guarantee continuous flow!',
    description: 'Harness Python for-loops and range generators to automate repetitive mechanical instructions.',
    objectives: [
      'Use a for loop with range(1, 6) to cycle through levels 1 to 5.',
      'Inside the loop, print "Charging core: level X" where X is the current number.',
      'After the loop completes, print "Core at maximum power!"'
    ],
    starter_code: `# Level 2: Loop Structures & Energy Rings
# Task: Cycle the energy rings from level 1 to 5 using a for loop

for level in range(1, 6):
    print(f"Charging core: level {level}")

print("Core at maximum power!")
`,
    solution_code: `for level in range(1, 6):
    print(f"Charging core: level {level}")

print("Core at maximum power!")
`,
    hints: [
      '`range(1, 6)` produces the numbers: 1, 2, 3, 4, 5.',
      'You can format strings using f-strings: `f"Charging core: level {level}"`.',
      'Make sure the final print statement is NOT indented so it runs after the loop finishes.'
    ],
    test_cases: [
      {
        id: 'tc-2-1',
        title: 'Sequence Output Match',
        description: 'Check that all 5 charge stages and final power confirmation are printed.',
        expected_output: `Charging core: level 1
Charging core: level 2
Charging core: level 3
Charging core: level 4
Charging core: level 5
Core at maximum power!`
      },
      {
        id: 'tc-2-2',
        title: 'Max Level Check',
        description: 'Ensure the final accumulator reached 5.',
        assertion_code: `assert 'level' in globals(), "Loop variable 'level' was not found"
assert level == 5, f"Expected final level to be 5, got {level}"`
      }
    ]
  },
  {
    id: 'quest-3',
    level: 3,
    title: 'List Vault & Inventory Arrays',
    subtitle: 'Dynamic collections, indexing, and item appending',
    category: 'Data Structures',
    xp_reward: 200,
    badge_title: 'Vault Architect',
    badge_icon: 'Layers',
    is_pro: false,
    lore: 'A cyber explorer in the Sovereign Matrix needs to equip gadgets in their digital backpack. The quantum vault stores items in indexed list sequences ready for quick retrieval.',
    description: 'Learn how to create lists, access elements by index, add new elements with .append(), and calculate collection length.',
    objectives: [
      'Create a list named `inventory` with: ["plasma_blade", "shield_glyph", "nano_potion"]',
      'Add a new item "datapad" using the .append() method.',
      'Print "Inventory slots: " followed by the count of items.',
      'Print the first item in the list using inventory[0].'
    ],
    starter_code: `# Level 3: List Vault & Inventory Arrays
# Task: Initialize the cyber backpack, append an item, and print stats

inventory = ["plasma_blade", "shield_glyph", "nano_potion"]

# Add "datapad" to the inventory
inventory.append("datapad")

# Print inventory count and primary weapon
print("Inventory slots:", len(inventory))
print("Primary item:", inventory[0])
`,
    solution_code: `inventory = ["plasma_blade", "shield_glyph", "nano_potion"]
inventory.append("datapad")

print("Inventory slots:", len(inventory))
print("Primary item:", inventory[0])
`,
    hints: [
      'To add to a list in Python, use `list_name.append(new_item)`.',
      '`len(inventory)` returns the number of elements in the list.',
      'Lists in Python are zero-indexed, so `inventory[0]` is the first item.'
    ],
    test_cases: [
      {
        id: 'tc-3-1',
        title: 'Inventory Count Verification',
        description: 'Check that 4 items exist in the inventory array.',
        expected_output: 'Inventory slots: 4',
        assertion_code: `assert len(inventory) == 4, f"Expected 4 items, got {len(inventory)}"`
      },
      {
        id: 'tc-3-2',
        title: 'Item Contents Assertion',
        description: 'Confirm "datapad" is present and first item is "plasma_blade".',
        assertion_code: `assert "datapad" in inventory, "'datapad' was not appended to inventory"
assert inventory[0] == "plasma_blade", "First item should be 'plasma_blade'"`
      }
    ]
  },
  {
    id: 'quest-4',
    level: 4,
    title: 'Spellcraft Functions & Modifiers',
    subtitle: 'Modular code blocks, parameters, and return formulas',
    category: 'Fundamentals',
    xp_reward: 250,
    badge_title: 'Spellcraft Coder',
    badge_icon: 'Sparkles',
    is_pro: false,
    lore: 'Why write the same logic twice when you can weave an invocable function spell? Master cyber-alchemists encapsulate formulas into reusable functions that take inputs and yield calculated outputs.',
    description: 'Learn how to define functions with the `def` keyword, pass parameters, and return calculated values.',
    objectives: [
      'Define a function `calculate_power(base_power, multiplier)`',
      'The function must return base_power multiplied by multiplier.',
      'Call the function with base_power = 25 and multiplier = 4.',
      'Print the result formatted as "Total Spell Power: X"'
    ],
    starter_code: `# Level 4: Spellcraft Functions & Modifiers
# Task: Define the power calculation function and return the amplified value

def calculate_power(base_power, multiplier):
    # Calculate and return the product
    return base_power * multiplier

# Call your function
result = calculate_power(25, 4)
print(f"Total Spell Power: {result}")
`,
    solution_code: `def calculate_power(base_power, multiplier):
    return base_power * multiplier

result = calculate_power(25, 4)
print(f"Total Spell Power: {result}")
`,
    hints: [
      'Use `def function_name(param1, param2):` to define a function.',
      'Return the calculated result with the `return` keyword.',
      '`25 * 4` equals 100.'
    ],
    test_cases: [
      {
        id: 'tc-4-1',
        title: 'Function Output String',
        description: 'Verify formatted power message output.',
        expected_output: 'Total Spell Power: 100'
      },
      {
        id: 'tc-4-2',
        title: 'Dynamic Parameter Testing',
        description: 'Run automated assertions against calculate_power with diverse inputs.',
        assertion_code: `assert callable(calculate_power), "calculate_power must be a defined callable function"
assert calculate_power(10, 2) == 20, "calculate_power(10, 2) should return 20"
assert calculate_power(50, 3) == 150, "calculate_power(50, 3) should return 150"`
      }
    ]
  },
  {
    id: 'quest-5',
    level: 5,
    title: 'Text-Based Cyber Game Engine',
    subtitle: 'State loops, health tracking, and combat resolution',
    category: 'Game Dev',
    xp_reward: 400,
    badge_title: 'Game Engine Architect',
    badge_icon: 'Gamepad2',
    is_pro: true,
    lore: 'The penultimate milestone before the final boss of TERMINALTOR: assemble your first text RPG battle simulator! Track player HP, simulate enemy encounters, and print round-by-round battle dispatches.',
    description: 'Combine variables, conditionals, loops, and math to create a playable turn-based game loop in Python.',
    objectives: [
      'Initialize `player_hp = 100` and `enemy_hp = 60`.',
      'Write a while loop that runs while `player_hp > 0` and `enemy_hp > 0`.',
      'Each turn, player deals 20 damage to enemy, and enemy deals 15 to player.',
      'When loop ends, print "Victory: Cyber Beast Defeated!" if player survived.'
    ],
    starter_code: `# Level 5: Text-Based Cyber Game Engine [TERMINALTOR]
# Task: Create an automated turn-based combat engine loop

player_hp = 100
enemy_hp = 60
turns = 0

print("=== BATTLE COMMENCED ===")
while player_hp > 0 and enemy_hp > 0:
    turns += 1
    # Player strikes
    enemy_hp -= 20
    # Enemy strikes back
    if enemy_hp > 0:
        player_hp -= 15
    print(f"Turn {turns}: Player HP={player_hp}, Enemy HP={enemy_hp}")

if enemy_hp <= 0:
    print("Victory: Cyber Beast Defeated!")
print(f"Total Turns: {turns}")
`,
    solution_code: `player_hp = 100
enemy_hp = 60
turns = 0

print("=== BATTLE COMMENCED ===")
while player_hp > 0 and enemy_hp > 0:
    turns += 1
    enemy_hp -= 20
    if enemy_hp > 0:
        player_hp -= 15
    print(f"Turn {turns}: Player HP={player_hp}, Enemy HP={enemy_hp}")

if enemy_hp <= 0:
    print("Victory: Cyber Beast Defeated!")
print(f"Total Turns: {turns}")
`,
    hints: [
      'A `while` loop continues executing as long as its Boolean condition is True.',
      'Remember to decrease `enemy_hp` by 20 and `player_hp` by 15 in each round.',
      'Check if `enemy_hp <= 0` to declare the victory.'
    ],
    test_cases: [
      {
        id: 'tc-5-1',
        title: 'Victory Dispatch Output',
        description: 'Verify victory dispatch is printed upon battle completion.',
        expected_output: 'Victory: Cyber Beast Defeated!'
      },
      {
        id: 'tc-5-2',
        title: 'Turn Counter Assertion',
        description: 'Verify combat resolved in exactly 3 turns with player having 70 HP remaining.',
        assertion_code: `assert turns == 3, f"Expected 3 turns, resolved in {turns}"
assert player_hp == 70, f"Expected player_hp to be 70, got {player_hp}"
assert enemy_hp <= 0, "Enemy HP must be 0 or less"`
      }
    ]
  },
  {
    id: 'quest-terminaltor',
    level: 6,
    title: 'The Terminaltor: Final Core Overthrow',
    subtitle: 'Face the ultimate rogue AI overseer. Defeat the Terminaltor to finish the game!',
    category: 'Final Boss',
    xp_reward: 1000,
    badge_title: 'Terminaltor Executioner',
    badge_icon: 'Skull',
    is_pro: false,
    is_boss: true,
    lore: 'At the deepest level of the Ose Engine mainframe lies The Terminaltor—a rogue, self-evolving cybernetic intelligence created by IRETE LABS that has seized root control. It locks down all compilers in a perpetual death-spiral. To finish TERMINALTOR, you must code the master override sequence that computes total vulnerability bypass across all defense nodes and shuts down the boss for good!',
    description: 'Implement the `defeat_terminaltor(boss_power, defense_nodes)` function. Sum the defense node bypass values, compare against boss power, and trigger the final system restore.',
    objectives: [
      'Define function `defeat_terminaltor(boss_power, defense_nodes)`.',
      'Sum all integer values in the `defense_nodes` list.',
      'If total >= `boss_power`, return "TERMINALTOR DEFEATED: SYSTEM RESTORED".',
      'Otherwise, return "CRITICAL FAILURE: INSUFFICIENT PURGE POWER".',
      'Execute with `boss_power = 500` and `defense_nodes = [120, 180, 250]`.',
      'Print the result and "=== GAME COMPLETED: YOU HAVE FINISHED TERMINALTOR ===".'
    ],
    starter_code: `# FINAL BOSS: THE TERMINALTOR [IRETE LABS • Powered by Ose Engine]
# Objective: Write the purge function and defeat the ultimate boss to finish the game!

def defeat_terminaltor(boss_power, defense_nodes):
    # TODO: Calculate sum of defense_nodes
    total_power = sum(defense_nodes)
    
    # TODO: Compare against boss_power and return appropriate status
    if total_power >= boss_power:
        return "TERMINALTOR DEFEATED: SYSTEM RESTORED"
    return "CRITICAL FAILURE: INSUFFICIENT PURGE POWER"

# Core Engagement Simulation:
boss_power = 500
defense_nodes = [120, 180, 250]

result = defeat_terminaltor(boss_power, defense_nodes)
print(result)

if result == "TERMINALTOR DEFEATED: SYSTEM RESTORED":
    print("=== GAME COMPLETED: YOU HAVE FINISHED TERMINALTOR ===")
`,
    solution_code: `def defeat_terminaltor(boss_power, defense_nodes):
    total_power = sum(defense_nodes)
    if total_power >= boss_power:
        return "TERMINALTOR DEFEATED: SYSTEM RESTORED"
    return "CRITICAL FAILURE: INSUFFICIENT PURGE POWER"

boss_power = 500
defense_nodes = [120, 180, 250]
result = defeat_terminaltor(boss_power, defense_nodes)
print(result)
if result == "TERMINALTOR DEFEATED: SYSTEM RESTORED":
    print("=== GAME COMPLETED: YOU HAVE FINISHED TERMINALTOR ===")
`,
    hints: [
      'Use Python builtin `sum(defense_nodes)` or iterate through the list with a for loop to calculate total power.',
      'Check if `total_power >= boss_power` using an `if/else` block.',
      'Ensure the exact return string "TERMINALTOR DEFEATED: SYSTEM RESTORED" is returned when power is sufficient.'
    ],
    test_cases: [
      {
        id: 'tc-boss-1',
        title: 'Core Override Output Check',
        description: 'Verify the boss is defeated and game completion announcement is printed.',
        expected_output: '=== GAME COMPLETED: YOU HAVE FINISHED TERMINALTOR ==='
      },
      {
        id: 'tc-boss-2',
        title: 'Function Logic & Assertion Check',
        description: 'Test defeat_terminaltor with diverse inputs for winning and losing thresholds.',
        assertion_code: `assert callable(defeat_terminaltor), "defeat_terminaltor must be defined as a function"
assert defeat_terminaltor(500, [100, 200, 300]) == "TERMINALTOR DEFEATED: SYSTEM RESTORED", "500 vs 600 power should defeat boss"
assert defeat_terminaltor(800, [100, 200, 300]) == "CRITICAL FAILURE: INSUFFICIENT PURGE POWER", "800 vs 600 power should return failure"
assert defeat_terminaltor(100, [50, 50]) == "TERMINALTOR DEFEATED: SYSTEM RESTORED", "Exact match should defeat boss"
assert result == "TERMINALTOR DEFEATED: SYSTEM RESTORED", "Main simulation must defeat the Terminaltor"`
      }
    ]
  }
];
