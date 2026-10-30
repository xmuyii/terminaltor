export interface WordForgeRecord {
  id: string;
  rank?: number;
  username: string;
  score: number;
  wordsForged: number;
  longestWord: string;
  allianceName?: string;
  styleTitle?: string;
  playedAt: string;
}

export interface DebugsHuntingRecord {
  id: string;
  rank?: number;
  username: string;
  score: number;
  correctAnswers: number;
  fastestAnswerMs: number;
  allianceName?: string;
  bugsFixed?: number;
  speedRecordSeconds?: number;
  accuracyRate?: number;
  styleTitle?: string;
  playedAt: string;
}

export interface LastWeekChampion {
  rank: number;
  username: string;
  score: number;
  allianceName: string;
  gameMode: string;
  badge: string;
  title: string; // Playstyle title (Emoji + 1 word)
}

export interface PlaystyleTitleInfo {
  id: string;
  title: string; // Emoji + 1 word format
  description: string;
  styleType: 'anagrams' | 'speed' | 'length' | 'accuracy' | 'volume' | 'defense';
}

export const PLAYSTYLE_TITLES: PlaystyleTitleInfo[] = [
  { id: 'anagrammer', title: '🔥 Anagrammer', description: 'Consistently plays anagram chains (e.g. pears, rapes, pares, spare)', styleType: 'anagrams' },
  { id: 'sprinter', title: '⚡ Sprinter', description: 'Consistently submits valid words or fixes in under 3 seconds', styleType: 'speed' },
  { id: 'titan', title: '💎 Titan', description: 'Frequently creates long, heavy 7+ and 8+ letter words', styleType: 'length' },
  { id: 'sniper', title: '🎯 Sniper', description: 'Maintains 95%+ precision accuracy in Debugs Hunting without wasted attempts', styleType: 'accuracy' },
  { id: 'exterminator', title: '⚔️ Exterminator', description: 'Crushes 6+ bugs in a single rapid 3-minute round', styleType: 'volume' },
  { id: 'synthesizer', title: '🚀 Synthesizer', description: 'Consistently forges 15+ words per 3-minute session', styleType: 'volume' },
  { id: 'permutator', title: '🌪️ Permutator', description: 'Master of letter permutations and root word variants', styleType: 'anagrams' },
  { id: 'sentinel', title: '🛡️ Sentinel', description: 'Maintains fortified cyber shields against rival attacks & chaos events', styleType: 'defense' },
  { id: 'glitcher', title: '💀 Glitcher', description: 'Executes rapid-fire code fixes under extreme time pressure', styleType: 'speed' },
  { id: 'architect', title: '👑 Architect', description: 'Builds and upgrades the Cyber Base Citadel to Level 3+', styleType: 'defense' },
];

const STORAGE_KEY_FORGE = 'sovereign_lb_wordforge_v1';
const STORAGE_KEY_DEBUGS = 'sovereign_lb_debugs_v1';
const STORAGE_KEY_STYLE = 'sovereign_player_style_title_v1';
const STORAGE_KEY_UNLOCKED_STYLES = 'sovereign_unlocked_styles_v1';

const INITIAL_FORGE_BOARD: WordForgeRecord[] = [
  { id: 'wf_1', username: 'AdaLovelace', score: 384, wordsForged: 24, longestWord: 'RECURSION', allianceName: 'Lagos Tech High', styleTitle: '🔥 Anagrammer', playedAt: '10m ago' },
  { id: 'wf_2', username: 'AlanTuring', score: 310, wordsForged: 19, longestWord: 'ALGORITHM', allianceName: 'Sovereign Core', styleTitle: '⚡ Sprinter', playedAt: '35m ago' },
  { id: 'wf_3', username: 'QuantumCadet', score: 260, wordsForged: 16, longestWord: 'SYNTAX', allianceName: 'Lagos Tech High', styleTitle: '💎 Titan', playedAt: '1h ago' },
  { id: 'wf_4', username: 'GuidoVanRossum', score: 215, wordsForged: 14, longestWord: 'GENERATOR', allianceName: 'Solo Developer', styleTitle: '🚀 Synthesizer', playedAt: '2h ago' },
  { id: 'wf_5', username: 'GraceHopper', score: 180, wordsForged: 11, longestWord: 'COMPILER', allianceName: 'Navy Tech Alliance', styleTitle: '🌪️ Permutator', playedAt: '3h ago' },
  { id: 'wf_6', username: 'LinusTorvalds', score: 155, wordsForged: 10, longestWord: 'KERNEL', allianceName: 'Freelancer', styleTitle: '💀 Glitcher', playedAt: '5h ago' },
];

const INITIAL_DEBUGS_BOARD: DebugsHuntingRecord[] = [
  { id: 'dh_1', username: 'GraceHopper', score: 420, correctAnswers: 9, fastestAnswerMs: 820, bugsFixed: 9, speedRecordSeconds: 0.82, accuracyRate: 98, allianceName: 'Navy Tech Alliance', styleTitle: '🎯 Sniper', playedAt: '15m ago' },
  { id: 'dh_2', username: 'MargaretHamilton', score: 375, correctAnswers: 8, fastestAnswerMs: 1100, bugsFixed: 8, speedRecordSeconds: 1.1, accuracyRate: 95, allianceName: 'Apollo Academy', styleTitle: '⚔️ Exterminator', playedAt: '42m ago' },
  { id: 'dh_3', username: 'QuantumCadet', score: 290, correctAnswers: 6, fastestAnswerMs: 1450, bugsFixed: 6, speedRecordSeconds: 1.45, accuracyRate: 92, allianceName: 'Lagos Tech High', styleTitle: '⚡ Sprinter', playedAt: '1h ago' },
  { id: 'dh_4', username: 'AlanTuring', score: 240, correctAnswers: 5, fastestAnswerMs: 1620, bugsFixed: 5, speedRecordSeconds: 1.62, accuracyRate: 90, allianceName: 'Sovereign Core', styleTitle: '💎 Titan', playedAt: '2h ago' },
  { id: 'dh_5', username: 'DennisRitchie', score: 190, correctAnswers: 4, fastestAnswerMs: 1800, bugsFixed: 4, speedRecordSeconds: 1.8, accuracyRate: 88, allianceName: 'Bell Labs Cohort', styleTitle: '💀 Glitcher', playedAt: '4h ago' },
  { id: 'dh_6', username: 'BarbaraLiskov', score: 140, correctAnswers: 3, fastestAnswerMs: 2100, bugsFixed: 3, speedRecordSeconds: 2.1, accuracyRate: 85, allianceName: 'Solo Developer', styleTitle: '🛡️ Sentinel', playedAt: '6h ago' },
];

export const FORGE_BOARDS: Record<'today' | 'weekly' | 'all_time', WordForgeRecord[]> = {
  today: INITIAL_FORGE_BOARD,
  weekly: [
    { id: 'wfw_1', username: 'AdaLovelace', score: 3840, wordsForged: 240, longestWord: 'RECURSION', allianceName: 'Lagos Tech High', styleTitle: '🔥 Anagrammer', playedAt: 'Today' },
    { id: 'wfw_2', username: 'AlanTuring', score: 3120, wordsForged: 210, longestWord: 'COMPILER', allianceName: 'Sovereign Core', styleTitle: '⚡ Sprinter', playedAt: 'Yesterday' },
    { id: 'wfw_3', username: 'QuantumCadet', score: 2890, wordsForged: 180, longestWord: 'ALGORITHM', allianceName: 'Solo Developer', styleTitle: '💎 Titan', playedAt: '2d ago' },
    { id: 'wfw_4', username: 'GuidoVanRossum', score: 2650, wordsForged: 165, longestWord: 'GENERATOR', allianceName: 'Solo Developer', styleTitle: '🚀 Synthesizer', playedAt: '3d ago' },
    { id: 'wfw_5', username: 'GraceHopper', score: 2420, wordsForged: 150, longestWord: 'INTERPRETER', allianceName: 'Navy Tech Alliance', styleTitle: '🌪️ Permutator', playedAt: '4d ago' },
    { id: 'wfw_6', username: 'LinusTorvalds', score: 2180, wordsForged: 135, longestWord: 'MONOLITHIC', allianceName: 'Freelancer', styleTitle: '💀 Glitcher', playedAt: '5d ago' },
  ],
  all_time: [
    { id: 'wfa_1', username: 'AdaLovelace', score: 28400, wordsForged: 1950, longestWord: 'RECURSION', allianceName: 'Lagos Tech High', styleTitle: '🔥 Anagrammer', playedAt: 'Oct 2026' },
    { id: 'wfa_2', username: 'AlanTuring', score: 24100, wordsForged: 1680, longestWord: 'TURINGMACHINE', allianceName: 'Sovereign Core', styleTitle: '⚡ Sprinter', playedAt: 'Oct 2026' },
    { id: 'wfa_3', username: 'QuantumCadet', score: 21200, wordsForged: 1420, longestWord: 'SUPERPOSITION', allianceName: 'Solo Developer', styleTitle: '💎 Titan', playedAt: 'Sep 2026' },
    { id: 'wfa_4', username: 'GuidoVanRossum', score: 18900, wordsForged: 1290, longestWord: 'METACLASS', allianceName: 'Solo Developer', styleTitle: '🚀 Synthesizer', playedAt: 'Sep 2026' },
    { id: 'wfa_5', username: 'GraceHopper', score: 16700, wordsForged: 1150, longestWord: 'STANDARDIZED', allianceName: 'Navy Tech Alliance', styleTitle: '🌪️ Permutator', playedAt: 'Aug 2026' },
    { id: 'wfa_6', username: 'LinusTorvalds', score: 14500, wordsForged: 980, longestWord: 'FILESYSTEM', allianceName: 'Freelancer', styleTitle: '💀 Glitcher', playedAt: 'Aug 2026' },
  ],
};

export const DEBUGS_BOARDS: Record<'today' | 'weekly' | 'all_time', DebugsHuntingRecord[]> = {
  today: INITIAL_DEBUGS_BOARD,
  weekly: [
    { id: 'dhw_1', username: 'GraceHopper', score: 4200, correctAnswers: 42, fastestAnswerMs: 820, bugsFixed: 42, speedRecordSeconds: 0.82, accuracyRate: 98, allianceName: 'Navy Tech Alliance', styleTitle: '🎯 Sniper', playedAt: 'Today' },
    { id: 'dhw_2', username: 'MargaretHamilton', score: 3750, correctAnswers: 38, fastestAnswerMs: 1100, bugsFixed: 38, speedRecordSeconds: 1.1, accuracyRate: 95, allianceName: 'Apollo Academy', styleTitle: '⚔️ Exterminator', playedAt: 'Yesterday' },
    { id: 'dhw_3', username: 'QuantumCadet', score: 2900, correctAnswers: 29, fastestAnswerMs: 1450, bugsFixed: 29, speedRecordSeconds: 1.45, accuracyRate: 92, allianceName: 'Solo Developer', styleTitle: '⚡ Sprinter', playedAt: '2d ago' },
    { id: 'dhw_4', username: 'DennisRitchie', score: 2450, correctAnswers: 24, fastestAnswerMs: 1720, bugsFixed: 24, speedRecordSeconds: 1.72, accuracyRate: 91, allianceName: 'Bell Labs Cohort', styleTitle: '💀 Glitcher', playedAt: '3d ago' },
    { id: 'dhw_5', username: 'AlanTuring', score: 2100, correctAnswers: 21, fastestAnswerMs: 1620, bugsFixed: 21, speedRecordSeconds: 1.62, accuracyRate: 89, allianceName: 'Sovereign Core', styleTitle: '💎 Titan', playedAt: '4d ago' },
    { id: 'dhw_6', username: 'BarbaraLiskov', score: 1850, correctAnswers: 18, fastestAnswerMs: 1980, bugsFixed: 18, speedRecordSeconds: 1.98, accuracyRate: 88, allianceName: 'Solo Developer', styleTitle: '🛡️ Sentinel', playedAt: '5d ago' },
  ],
  all_time: [
    { id: 'dha_1', username: 'GraceHopper', score: 24100, correctAnswers: 240, fastestAnswerMs: 650, bugsFixed: 240, speedRecordSeconds: 0.65, accuracyRate: 99, allianceName: 'Navy Tech Alliance', styleTitle: '🎯 Sniper', playedAt: 'Oct 2026' },
    { id: 'dha_2', username: 'MargaretHamilton', score: 21500, correctAnswers: 212, fastestAnswerMs: 820, bugsFixed: 212, speedRecordSeconds: 0.82, accuracyRate: 97, allianceName: 'Apollo Academy', styleTitle: '⚔️ Exterminator', playedAt: 'Oct 2026' },
    { id: 'dha_3', username: 'DennisRitchie', score: 17800, correctAnswers: 175, fastestAnswerMs: 1150, bugsFixed: 175, speedRecordSeconds: 1.15, accuracyRate: 94, allianceName: 'Bell Labs Cohort', styleTitle: '💀 Glitcher', playedAt: 'Sep 2026' },
    { id: 'dha_4', username: 'AlanTuring', score: 15400, correctAnswers: 150, fastestAnswerMs: 1220, bugsFixed: 150, speedRecordSeconds: 1.22, accuracyRate: 92, allianceName: 'Sovereign Core', styleTitle: '💎 Titan', playedAt: 'Sep 2026' },
    { id: 'dha_5', username: 'QuantumCadet', score: 12650, correctAnswers: 122, fastestAnswerMs: 1350, bugsFixed: 122, speedRecordSeconds: 1.35, accuracyRate: 93, allianceName: 'Solo Developer', styleTitle: '⚡ Sprinter', playedAt: 'Aug 2026' },
    { id: 'dha_6', username: 'BarbaraLiskov', score: 10200, correctAnswers: 98, fastestAnswerMs: 1480, bugsFixed: 98, speedRecordSeconds: 1.48, accuracyRate: 90, allianceName: 'Solo Developer', styleTitle: '🛡️ Sentinel', playedAt: 'Aug 2026' },
  ],
};

// Playstyle titles awarded for behavior (emoji + 1 word)
export const LAST_WEEK_CHAMPIONS: Record<'codeforgers' | 'debugshunting', LastWeekChampion[]> = {
  codeforgers: [
    { rank: 1, username: 'AdaLovelace', score: 3840, allianceName: 'Lagos Tech High', gameMode: 'Code Forgers', badge: '🥇 1st Place', title: '🔥 Anagrammer' },
    { rank: 2, username: 'AlanTuring', score: 3120, allianceName: 'Sovereign Core', gameMode: 'Code Forgers', badge: '🥈 2nd Place', title: '⚡ Sprinter' },
    { rank: 3, username: 'QuantumCadet', score: 2890, allianceName: 'Solo Developer', gameMode: 'Code Forgers', badge: '🥉 3rd Place', title: '💎 Titan' },
    { rank: 4, username: 'GuidoVanRossum', score: 2650, allianceName: 'Solo Developer', gameMode: 'Code Forgers', badge: '⭐ 4th Place', title: '🚀 Synthesizer' },
    { rank: 5, username: 'GraceHopper', score: 2420, allianceName: 'Navy Tech Alliance', gameMode: 'Code Forgers', badge: '⭐ 5th Place', title: '🌪️ Permutator' },
    { rank: 6, username: 'LinusTorvalds', score: 2180, allianceName: 'Freelancer', gameMode: 'Code Forgers', badge: '⭐ 6th Place', title: '💀 Glitcher' },
    { rank: 7, username: 'MargaretHamilton', score: 1950, allianceName: 'Apollo Academy', gameMode: 'Code Forgers', badge: '⭐ 7th Place', title: '🎯 Sniper' },
    { rank: 8, username: 'DennisRitchie', score: 1780, allianceName: 'Bell Labs Cohort', gameMode: 'Code Forgers', badge: '⭐ 8th Place', title: '⚔️ Exterminator' },
    { rank: 9, username: 'KenThompson', score: 1620, allianceName: 'Solo Developer', gameMode: 'Code Forgers', badge: '⭐ 9th Place', title: '👑 Architect' },
    { rank: 10, username: 'BarbaraLiskov', score: 1450, allianceName: 'Solo Developer', gameMode: 'Code Forgers', badge: '⭐ 10th Place', title: '🛡️ Sentinel' },
  ],
  debugshunting: [
    { rank: 1, username: 'GraceHopper', score: 4200, allianceName: 'Navy Tech Alliance', gameMode: 'Debugs Hunting', badge: '🥇 1st Place', title: '🎯 Sniper' },
    { rank: 2, username: 'MargaretHamilton', score: 3750, allianceName: 'Apollo Academy', gameMode: 'Debugs Hunting', badge: '🥈 2nd Place', title: '⚔️ Exterminator' },
    { rank: 3, username: 'DennisRitchie', score: 2950, allianceName: 'Solo Developer', gameMode: 'Debugs Hunting', badge: '🥉 3rd Place', title: '💀 Glitcher' },
    { rank: 4, username: 'AlanTuring', score: 2710, allianceName: 'Sovereign Core', gameMode: 'Debugs Hunting', badge: '⭐ 4th Place', title: '⚡ Sprinter' },
    { rank: 5, username: 'AdaLovelace', score: 2540, allianceName: 'Lagos Tech High', gameMode: 'Debugs Hunting', badge: '⭐ 5th Place', title: '🔥 Anagrammer' },
    { rank: 6, username: 'QuantumCadet', score: 2380, allianceName: 'Solo Developer', gameMode: 'Debugs Hunting', badge: '⭐ 6th Place', title: '💎 Titan' },
    { rank: 7, username: 'GuidoVanRossum', score: 2190, allianceName: 'Solo Developer', gameMode: 'Debugs Hunting', badge: '⭐ 7th Place', title: '🚀 Synthesizer' },
    { rank: 8, username: 'BarbaraLiskov', score: 1980, allianceName: 'Solo Developer', gameMode: 'Debugs Hunting', badge: '⭐ 8th Place', title: '🛡️ Sentinel' },
    { rank: 9, username: 'KenThompson', score: 1820, allianceName: 'Bell Labs Cohort', gameMode: 'Debugs Hunting', badge: '⭐ 9th Place', title: '👑 Architect' },
    { rank: 10, username: 'LinusTorvalds', score: 1650, allianceName: 'Freelancer', gameMode: 'Debugs Hunting', badge: '⭐ 10th Place', title: '🌪️ Permutator' },
  ],
};

class ArcadeLeaderboardImpl {
  getWordForgeLeaderboard(timeframe: 'today' | 'weekly' | 'all_time' = 'today'): WordForgeRecord[] {
    if (timeframe !== 'today') {
      return (FORGE_BOARDS[timeframe] || INITIAL_FORGE_BOARD).map((r, i) => ({ ...r, rank: i + 1 }));
    }
    if (typeof window === 'undefined') return INITIAL_FORGE_BOARD;
    try {
      const data = localStorage.getItem(STORAGE_KEY_FORGE);
      if (data) {
        const parsed: WordForgeRecord[] = JSON.parse(data);
        return parsed.sort((a, b) => b.score - a.score).map((r, i) => ({ ...r, rank: i + 1 }));
      }
    } catch (e) {
      console.warn('Failed to read forge board:', e);
    }
    return INITIAL_FORGE_BOARD.map((r, i) => ({ ...r, rank: i + 1 }));
  }

  getDebugsHuntingLeaderboard(timeframe: 'today' | 'weekly' | 'all_time' = 'today'): DebugsHuntingRecord[] {
    if (timeframe !== 'today') {
      return (DEBUGS_BOARDS[timeframe] || INITIAL_DEBUGS_BOARD).map((r, i) => ({ ...r, rank: i + 1 }));
    }
    if (typeof window === 'undefined') return INITIAL_DEBUGS_BOARD;
    try {
      const data = localStorage.getItem(STORAGE_KEY_DEBUGS);
      if (data) {
        const parsed: DebugsHuntingRecord[] = JSON.parse(data);
        return parsed.sort((a, b) => b.score - a.score).map((r, i) => ({ ...r, rank: i + 1 }));
      }
    } catch (e) {
      console.warn('Failed to read debugs board:', e);
    }
    return INITIAL_DEBUGS_BOARD.map((r, i) => ({ ...r, rank: i + 1 }));
  }

  getLastWeekWinners(mode: 'codeforgers' | 'debugshunting' | 'wordforge'): LastWeekChampion[] {
    const key = mode === 'debugshunting' ? 'debugshunting' : 'codeforgers';
    return LAST_WEEK_CHAMPIONS[key];
  }

  recordWordForgeScore(
    nameOrRecord: string | Omit<WordForgeRecord, 'id' | 'playedAt'>,
    score?: number,
    wordsForged?: number,
    longestWord?: string,
    allianceName?: string
  ): void {
    if (typeof window === 'undefined') return;
    try {
      let record: Omit<WordForgeRecord, 'id' | 'playedAt'>;
      if (typeof nameOrRecord === 'string') {
        record = {
          username: nameOrRecord,
          score: score || 0,
          wordsForged: wordsForged || 0,
          longestWord: longestWord || 'CODE',
          allianceName: allianceName || 'Solo Developer',
        };
      } else {
        record = nameOrRecord;
      }
      const current = this.getWordForgeLeaderboard('today');
      const updated: WordForgeRecord[] = [
        {
          ...record,
          id: `wf_${Date.now()}`,
          playedAt: 'Just now',
          styleTitle: this.getPlayerEquippedStyle(),
        },
        ...current.filter((r) => r.username !== record.username),
      ];
      localStorage.setItem(STORAGE_KEY_FORGE, JSON.stringify(updated.slice(0, 50)));
    } catch (e) {
      console.warn('Failed to save forge score:', e);
    }
  }

  recordDebugsHuntingScore(
    nameOrRecord: string | Omit<DebugsHuntingRecord, 'id' | 'playedAt'>,
    score?: number,
    bugsFixed?: number,
    speedRecordSeconds?: number,
    allianceName?: string
  ): void {
    if (typeof window === 'undefined') return;
    try {
      let record: Omit<DebugsHuntingRecord, 'id' | 'playedAt'>;
      if (typeof nameOrRecord === 'string') {
        record = {
          username: nameOrRecord,
          score: score || 0,
          correctAnswers: bugsFixed || 0,
          fastestAnswerMs: Math.round((speedRecordSeconds || 1.5) * 1000),
          bugsFixed: bugsFixed || 0,
          speedRecordSeconds: speedRecordSeconds || 1.5,
          accuracyRate: 95,
          allianceName: allianceName || 'Solo Developer',
        };
      } else {
        record = nameOrRecord;
      }
      const current = this.getDebugsHuntingLeaderboard('today');
      const updated: DebugsHuntingRecord[] = [
        {
          ...record,
          id: `dh_${Date.now()}`,
          playedAt: 'Just now',
          styleTitle: this.getPlayerEquippedStyle(),
        },
        ...current.filter((r) => r.username !== record.username),
      ];
      localStorage.setItem(STORAGE_KEY_DEBUGS, JSON.stringify(updated.slice(0, 50)));
    } catch (e) {
      console.warn('Failed to save debugs score:', e);
    }
  }

  recordWordForgeGame(record: Omit<WordForgeRecord, 'id' | 'playedAt'>): void {
    this.recordWordForgeScore(record);
  }

  recordDebugsHuntingGame(record: Omit<DebugsHuntingRecord, 'id' | 'playedAt'>): void {
    this.recordDebugsHuntingScore(record);
  }

  // Playstyle system: Players unlock emoji + 1 word styles based on behavior!
  getPlayerEquippedStyle(): string {
    if (typeof window === 'undefined') return '🔥 Anagrammer';
    return localStorage.getItem(STORAGE_KEY_STYLE) || '🔥 Anagrammer';
  }

  setPlayerEquippedStyle(title: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY_STYLE, title);
  }

  getUnlockedStyles(): string[] {
    if (typeof window === 'undefined') return ['🔥 Anagrammer'];
    try {
      const stored = localStorage.getItem(STORAGE_KEY_UNLOCKED_STYLES);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      // fallback
    }
    return ['🔥 Anagrammer'];
  }

  unlockStyle(title: string): boolean {
    if (typeof window === 'undefined') return false;
    const current = this.getUnlockedStyles();
    if (!current.includes(title)) {
      const updated = [...current, title];
      localStorage.setItem(STORAGE_KEY_UNLOCKED_STYLES, JSON.stringify(updated));
      return true; // Newly unlocked!
    }
    return false;
  }

  // Sadistic Game Master Chaos: Shuffles or swaps leaderboard ranks!
  triggerGameMasterChaos(mode: 'codeforgers' | 'debugshunting'): { eventType: string; description: string } {
    if (mode === 'codeforgers') {
      const board = [...this.getWordForgeLeaderboard('today')];
      if (board.length >= 2) {
        // Swap rank #1 with a lower rank or shuffle top 10
        const isSwap = Math.random() > 0.5;
        if (isSwap && board.length >= 4) {
          const targetIdx = Math.min(board.length - 1, 3);
          const tempScore = board[0].score;
          board[0].score = board[targetIdx].score;
          board[targetIdx].score = tempScore;
          localStorage.setItem(STORAGE_KEY_FORGE, JSON.stringify(board));
          return {
            eventType: 'Rank Swap Mutation',
            description: `😈 The Sadistic Game Master swapped #${1} (${board[0].username}) and #${targetIdx + 1} (${board[targetIdx].username}) points!`,
          };
        } else {
          // Shuffle top ranks
          const topSlice = board.slice(0, Math.min(6, board.length)).sort(() => Math.random() - 0.5);
          const newBoard = [...topSlice, ...board.slice(topSlice.length)];
          localStorage.setItem(STORAGE_KEY_FORGE, JSON.stringify(newBoard));
          return {
            eventType: 'Leaderboard Scramble',
            description: `😈 The Sadistic Game Master scrambled the daily podium positions!`,
          };
        }
      }
    } else {
      const board = [...this.getDebugsHuntingLeaderboard('today')];
      if (board.length >= 2) {
        const topSlice = board.slice(0, Math.min(6, board.length)).sort(() => Math.random() - 0.5);
        const newBoard = [...topSlice, ...board.slice(topSlice.length)];
        localStorage.setItem(STORAGE_KEY_DEBUGS, JSON.stringify(newBoard));
        return {
          eventType: 'Bug Hunter Chaos',
          description: `😈 The Sadistic Game Master scrambled the daily debug rankings!`,
        };
      }
    }
    return {
      eventType: 'Chaos Pulse',
      description: `😈 The Sadistic Game Master inspected the board and laughed sinisterly!`,
    };
  }
}

export const arcadeLeaderboard = new ArcadeLeaderboardImpl();
