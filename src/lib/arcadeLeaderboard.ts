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

const STORAGE_KEY_FORGE = 'sovereign_lb_wordforge_v2';
const STORAGE_KEY_DEBUGS = 'sovereign_lb_debugs_v2';
const STORAGE_KEY_STYLE = 'sovereign_player_style_title_v2';
const STORAGE_KEY_UNLOCKED_STYLES = 'sovereign_unlocked_styles_v2';

// Purge any legacy dummy records from localStorage
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('sovereign_lb_wordforge_v1');
    localStorage.removeItem('sovereign_lb_debugs_v1');
  } catch {}
}

const DUMMY_NAMES = new Set([
  'AdaLovelace',
  'AlanTuring',
  'ClaudeShannon',
  'GuidoVanRossum',
  'GraceHopper',
  'LinusTorvalds',
  'MargaretHamilton',
  'DonaldKnuth',
  'DennisRitchie',
  'BarbaraLiskov',
  'KenThompson',
  'QuantumCadet',
  'student_demo',
]);

export const FORGE_BOARDS: Record<'today' | 'weekly' | 'all_time', WordForgeRecord[]> = {
  today: [],
  weekly: [],
  all_time: [],
};

export const DEBUGS_BOARDS: Record<'today' | 'weekly' | 'all_time', DebugsHuntingRecord[]> = {
  today: [],
  weekly: [],
  all_time: [],
};

export const LAST_WEEK_CHAMPIONS: Record<'codeforgers' | 'debugshunting', LastWeekChampion[]> = {
  codeforgers: [],
  debugshunting: [],
};

class ArcadeLeaderboardImpl {
  getWordForgeLeaderboard(timeframe: 'today' | 'weekly' | 'all_time' = 'today'): WordForgeRecord[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEY_FORGE);
      if (data) {
        const parsed: WordForgeRecord[] = JSON.parse(data);
        return parsed
          .filter((r) => !DUMMY_NAMES.has(r.username) && r.allianceName !== 'Lagos Tech High')
          .sort((a, b) => b.score - a.score)
          .map((r, i) => ({ ...r, rank: i + 1 }));
      }
    } catch (e) {
      console.warn('Failed to read forge board:', e);
    }
    return [];
  }

  getDebugsHuntingLeaderboard(timeframe: 'today' | 'weekly' | 'all_time' = 'today'): DebugsHuntingRecord[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEY_DEBUGS);
      if (data) {
        const parsed: DebugsHuntingRecord[] = JSON.parse(data);
        return parsed
          .filter((r) => !DUMMY_NAMES.has(r.username) && r.allianceName !== 'Lagos Tech High')
          .sort((a, b) => b.score - a.score)
          .map((r, i) => ({ ...r, rank: i + 1 }));
      }
    } catch (e) {
      console.warn('Failed to read debugs board:', e);
    }
    return [];
  }

  getLastWeekWinners(mode: 'codeforgers' | 'debugshunting' | 'wordforge'): LastWeekChampion[] {
    const key = mode === 'debugshunting' ? 'debugshunting' : 'codeforgers';
    return LAST_WEEK_CHAMPIONS[key] || [];
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
          accuracyRate: 100,
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

  getPlayerEquippedStyle(): string {
    if (typeof window === 'undefined') return '⚡ Sprinter';
    return localStorage.getItem(STORAGE_KEY_STYLE) || '⚡ Sprinter';
  }

  setPlayerEquippedStyle(title: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY_STYLE, title);
  }

  getUnlockedStyles(): string[] {
    if (typeof window === 'undefined') return ['sprinter'];
    try {
      const data = localStorage.getItem(STORAGE_KEY_UNLOCKED_STYLES);
      if (data) {
        return JSON.parse(data);
      }
    } catch {}
    return ['sprinter'];
  }

  unlockStyle(styleId: string): void {
    if (typeof window === 'undefined') return;
    const current = this.getUnlockedStyles();
    if (!current.includes(styleId)) {
      current.push(styleId);
      localStorage.setItem(STORAGE_KEY_UNLOCKED_STYLES, JSON.stringify(current));
    }
  }

  evaluateAndAwardStyle(stats: {
    gameMode: 'wordforge' | 'debugshunting';
    score: number;
    wordsForged?: number;
    longestWord?: string;
    bugsFixed?: number;
    accuracyRate?: number;
    speedRecordSeconds?: number;
    citadelLevel?: number;
    isAnagram?: boolean;
  }): string | null {
    let unlockedId: string | null = null;

    if (stats.gameMode === 'wordforge') {
      if (stats.isAnagram) unlockedId = 'anagrammer';
      else if ((stats.wordsForged || 0) >= 15) unlockedId = 'synthesizer';
      else if ((stats.longestWord?.length || 0) >= 7) unlockedId = 'titan';
      else if ((stats.longestWord?.length || 0) >= 6) unlockedId = 'permutator';
      else if ((stats.speedRecordSeconds || 99) <= 3) unlockedId = 'sprinter';
    } else {
      if ((stats.accuracyRate || 0) >= 95) unlockedId = 'sniper';
      else if ((stats.bugsFixed || 0) >= 6) unlockedId = 'exterminator';
      else if ((stats.speedRecordSeconds || 99) <= 1.0) unlockedId = 'glitcher';
      else if ((stats.citadelLevel || 0) >= 3) unlockedId = 'architect';
    }

    if (unlockedId) {
      this.unlockStyle(unlockedId);
      const found = PLAYSTYLE_TITLES.find((t) => t.id === unlockedId);
      return found ? found.title : null;
    }

    return null;
  }
}

export const arcadeLeaderboard = new ArcadeLeaderboardImpl();
