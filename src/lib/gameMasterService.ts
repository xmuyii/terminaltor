export interface GameMasterModifier {
  id: string;
  name: string;
  taunt: string;
  ruleDescription: string;
  affectedGame: 'both' | 'codeforgers' | 'debugshunting';
  durationSeconds: number;
  pointsMultiplier?: number;
}

export interface SadisticQuest {
  id: string;
  title: string;
  taunt: string;
  requirement: string;
  rewardCredits: number;
  completed: boolean;
}

export const GAME_MASTER_MODIFIERS: GameMasterModifier[] = [
  {
    id: 'gm_vowel_tax',
    name: '🌀 VOWEL TAXATION',
    taunt: '“Did you think words were free? Vowels now cost blood. Heavy vowel words pay double, consonants alone earn NOTHING!”',
    ruleDescription: 'Words with 3+ vowels earn 2.0x points; words with <2 vowels earn 0 points.',
    affectedGame: 'codeforgers',
    durationSeconds: 45,
    pointsMultiplier: 2.0,
  },
  {
    id: 'gm_anagram_tyranny',
    name: '🎭 ANAGRAM CONJURING',
    taunt: '“I crave letter manipulation! Submit two words with identical letter counts back-to-back or face my wrath!”',
    ruleDescription: 'Forging anagrams awards +50 Bonus Points and unlocks the 🔥 Anagrammer badge.',
    affectedGame: 'codeforgers',
    durationSeconds: 60,
  },
  {
    id: 'gm_zero_margin',
    name: '⚡ ZERO-TOLERANCE COMPILER',
    taunt: '“One typo and your accuracy rate plummets to the digital gutter. Impress me if you dare!”',
    ruleDescription: 'Debugs Hunting active timer reduced to 7 seconds! Correct answers earn +150 points.',
    affectedGame: 'debugshunting',
    durationSeconds: 40,
  },
  {
    id: 'gm_point_heist',
    name: '🎲 LEADERBOARD MUTATION',
    taunt: '“Rank 1 is too comfortable! Let’s roll the dice and see where you land when the clock strikes zero!”',
    ruleDescription: 'The Sadistic Game Master threatens to swap the top podium with the 20th contender!',
    affectedGame: 'both',
    durationSeconds: 30,
  },
];

export const SADISTIC_QUESTS: SadisticQuest[] = [
  {
    id: 'sq_anagram_chain',
    title: 'Dance of the Anagrams',
    taunt: '“Can your feeble brain forge 3 permutations in a single round? Prove it!”',
    requirement: 'Forge 3 anagrams in one Code Forgers session',
    rewardCredits: 75,
    completed: false,
  },
  {
    id: 'sq_perfect_accuracy',
    title: 'Survive the Executioner',
    taunt: '“Fix 3 bugs consecutively with zero failed attempts. Make a single error and I laugh!”',
    requirement: 'Answer 3 Debugs Hunting questions with 100% accuracy',
    rewardCredits: 100,
    completed: false,
  },
  {
    id: 'sq_base_fortify',
    title: 'Defy My Invasions',
    taunt: '“Equip an Aegis shield on your cyber base before I scramble your standings!”',
    requirement: 'Equip a Firewall Shield in your Cyber Arsenal',
    rewardCredits: 50,
    completed: true,
  },
];

const STORAGE_KEY_GM_POPUP = 'sovereign_gm_popup_seen_v1';

class GameMasterService {
  private activeModifier: GameMasterModifier | null = null;
  private modifierEndsAt: number = 0;

  getActiveModifier(): GameMasterModifier | null {
    if (this.activeModifier && Date.now() < this.modifierEndsAt) {
      return this.activeModifier;
    }
    this.activeModifier = null;
    return null;
  }

  triggerRandomChaos(game: 'codeforgers' | 'debugshunting'): GameMasterModifier {
    const candidates = GAME_MASTER_MODIFIERS.filter(
      (m) => m.affectedGame === 'both' || m.affectedGame === game
    );
    const chosen = candidates[Math.floor(Math.random() * candidates.length)];
    this.activeModifier = chosen;
    this.modifierEndsAt = Date.now() + chosen.durationSeconds * 1000;
    return chosen;
  }

  clearModifier(): void {
    this.activeModifier = null;
    this.modifierEndsAt = 0;
  }

  getQuests(): SadisticQuest[] {
    return SADISTIC_QUESTS;
  }
}

export const gameMasterService = new GameMasterService();
