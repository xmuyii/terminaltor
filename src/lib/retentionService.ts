export interface DailyQuest {
  id: string;
  title: string;
  description: string;
  reward_points?: number;
  reward_xp: number;
  reward_tokens?: number;
  reward_credits?: number;
  completed: boolean;
  progress?: number;
  current_count?: number;
  target?: number;
  target_count?: number;
  total?: number;
  tier_category: 'easy' | 'medium' | 'stretch';
  quest_index?: number;
}

export interface FriendLeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatarUrl?: string;
  points: number;
  challengesSolved: number;
  lastActive: string;
  isFriend?: boolean;
  friendship_id?: string;
}

export interface FriendsData {
  friend_count: number;
  pending_inbound: Array<{ id: string; username: string }>;
  friends: FriendLeaderboardEntry[];
  pendingInvites?: string[];
}

const DEFAULT_QUESTS: DailyQuest[] = [
  {
    id: 'quest_daily_word',
    title: 'Code Forger Initiate',
    description: 'Forge 5 valid code words in the multiplayer arcade',
    reward_points: 50,
    reward_xp: 50,
    reward_tokens: 30,
    reward_credits: 30,
    completed: true,
    progress: 5,
    current_count: 5,
    target: 5,
    target_count: 5,
    total: 5,
    tier_category: 'easy',
    quest_index: 1,
  },
  {
    id: 'quest_daily_debug',
    title: 'Bug Sentry Duty',
    description: 'Solve 3 assertions in Debugs Hunting',
    reward_points: 75,
    reward_xp: 75,
    reward_tokens: 45,
    reward_credits: 45,
    completed: false,
    progress: 1,
    current_count: 1,
    target: 3,
    target_count: 3,
    total: 3,
    tier_category: 'medium',
    quest_index: 2,
  },
  {
    id: 'quest_daily_anagram',
    title: 'Anagram Alchemist',
    description: 'Forge 2 anagram pairs from the active letter matrix',
    reward_points: 100,
    reward_xp: 100,
    reward_tokens: 60,
    reward_credits: 60,
    completed: false,
    progress: 0,
    current_count: 0,
    target: 2,
    target_count: 2,
    total: 2,
    tier_category: 'stretch',
    quest_index: 3,
  },
];

const DEFAULT_FRIENDS_BOARD: FriendLeaderboardEntry[] = [
  { rank: 1, userId: 'u1', username: 'AdaLovelace', points: 3840, challengesSolved: 38, lastActive: '10m ago', isFriend: true, friendship_id: 'fr_1' },
  { rank: 2, userId: 'u2', username: 'AlanTuring', points: 3120, challengesSolved: 31, lastActive: '1h ago', isFriend: true, friendship_id: 'fr_2' },
  { rank: 3, userId: 'me', username: 'QuantumCadet', points: 2890, challengesSolved: 28, lastActive: 'Active now', isFriend: false, friendship_id: 'fr_me' },
  { rank: 4, userId: 'u3', username: 'MargaretHamilton', points: 2450, challengesSolved: 24, lastActive: '3h ago', isFriend: true, friendship_id: 'fr_3' },
];

class RetentionService {
  async getDailyQuests(userId?: string): Promise<{ quests: DailyQuest[]; date: string }> {
    const today = new Date().toISOString().split('T')[0];
    return {
      quests: DEFAULT_QUESTS,
      date: today,
    };
  }

  getTimeUntilMidnightLagos(): { formatted: string; hours: number; minutes: number; seconds: number } {
    const now = new Date();
    // UTC+1 for Lagos
    const lagosHours = (now.getUTCHours() + 1) % 24;
    const hoursLeft = 23 - lagosHours;
    const minsLeft = 59 - now.getUTCMinutes();
    const secsLeft = 59 - now.getUTCSeconds();
    const formatted = `${String(hoursLeft).padStart(2, '0')}:${String(minsLeft).padStart(2, '0')}:${String(secsLeft).padStart(2, '0')}`;
    return { formatted, hours: hoursLeft, minutes: minsLeft, seconds: secsLeft };
  }

  async checkQuestCompletion(userId: string, action?: string, details?: any): Promise<any> {
    return {
      completed: true,
      reward_xp: 50,
      inline_messages: ['Daily Quest Updated: Challenge Solved! (+50 XP)'],
    };
  }

  async checkStreakFreeze(userId: string, tier: string): Promise<{ applied: boolean; message?: string }> {
    return {
      applied: true,
      message: '🛡️ Streak Freeze Auto-Applied: Your 7-day coding streak is safe and protected!',
    };
  }

  async getFriends(userId?: string): Promise<FriendsData> {
    return {
      friend_count: 3,
      pending_inbound: [{ id: 'req_1', username: 'GuidoVanRossum' }],
      friends: DEFAULT_FRIENDS_BOARD,
    };
  }

  async getFriendsLeaderboard(userId?: string): Promise<FriendLeaderboardEntry[]> {
    return DEFAULT_FRIENDS_BOARD;
  }

  async getFriendLeaderboard(userId?: string): Promise<FriendsData> {
    return this.getFriends(userId);
  }

  async sendFriendRequest(userId: string, targetUsername: string): Promise<{ success: boolean; message: string }> {
    return { success: true, message: `Friend invite dispatched to @${targetUsername}!` };
  }

  async acceptFriendRequest(userId: string, friendshipId: string): Promise<{ success: boolean; message: string }> {
    return { success: true, message: 'Friend request accepted! Rival added to your board.' };
  }

  async removeFriend(userId: string, friendshipId: string): Promise<{ success: boolean; message: string }> {
    return { success: true, message: 'Friend removed from your leaderboard.' };
  }
}

export const retentionService = new RetentionService();
