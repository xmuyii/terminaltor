export interface AcademyRecord {
  id: string;
  name: string;
  joinCode?: string;
  join_code?: string;
  membersCount?: number;
  maxMembers?: number;
  seat_cap?: number;
  seats_total?: number;
  next_billing_date?: string;
  leaderId?: string;
  owner_id?: string;
  leaderName?: string;
  points?: number;
  tier?: 'free' | 'pro' | 'premium';
  subscription_plan: string;
  plan?: string;
  billing_email?: string;
  paystack_ref?: string;
  description?: string;
  created_at?: string;
}

export interface AcademyMemberRecord {
  id: string;
  userId?: string;
  user_id?: string;
  username: string;
  role: 'leader' | 'officer' | 'cadet';
  points?: number;
  xp_points?: number;
  challenges_solved?: number;
  last_active?: string;
  joined_at: string;
}

export interface MonthlyAcademyStanding {
  rank: number;
  academyId: string;
  academyName: string;
  name?: string;
  points: number;
  membersCount?: number;
  activeStudents: number;
  challengesSolved: number;
  badge?: string;
  tier?: string;
}

export const DEFAULT_ACADEMY: AcademyRecord = {
  id: 'acad_lagos_high',
  name: 'Lagos Tech High Alliance',
  joinCode: 'LOV300',
  join_code: 'LOV300',
  membersCount: 42,
  maxMembers: 100,
  seat_cap: 100,
  seats_total: 100,
  next_billing_date: 'Nov 15, 2026',
  leaderId: 'u_ada',
  owner_id: 'u_ada',
  leaderName: 'AdaLovelace',
  points: 48950,
  tier: 'premium',
  subscription_plan: 'premium',
  description: 'Premier West African cyber guild focusing on algorithms, backend infrastructure, and sovereign cryptography.',
  created_at: '2026-01-15T00:00:00Z',
};

export const DEFAULT_MEMBERS: AcademyMemberRecord[] = [
  { id: 'm1', userId: 'u_ada', user_id: 'u_ada', username: 'AdaLovelace', role: 'leader', points: 3840, xp_points: 3840, challenges_solved: 38, last_active: '15m ago', joined_at: 'Jan 2026' },
  { id: 'm2', userId: 'u_alan', user_id: 'u_alan', username: 'AlanTuring', role: 'officer', points: 3120, xp_points: 3120, challenges_solved: 31, last_active: '1h ago', joined_at: 'Feb 2026' },
  { id: 'm3', userId: 'me', user_id: 'me', username: 'QuantumCadet', role: 'cadet', points: 2890, xp_points: 2890, challenges_solved: 28, last_active: 'Active now', joined_at: 'Mar 2026' },
  { id: 'm4', userId: 'u_margaret', user_id: 'u_margaret', username: 'MargaretHamilton', role: 'officer', points: 2450, xp_points: 2450, challenges_solved: 24, last_active: 'Yesterday', joined_at: 'Feb 2026' },
];

export const CURRENT_MONTH_STANDINGS: MonthlyAcademyStanding[] = [
  { rank: 1, academyId: 'acad_lagos_high', academyName: 'Lagos Tech High Alliance', name: 'Lagos Tech High Alliance', points: 48950, membersCount: 42, activeStudents: 42, challengesSolved: 342, badge: '👑 Champions', tier: 'premium' },
  { rank: 2, academyId: 'acad_sovereign', academyName: 'Sovereign Core Guild', name: 'Sovereign Core Guild', points: 41200, membersCount: 38, activeStudents: 38, challengesSolved: 290, badge: '🥈 Contenders', tier: 'premium' },
  { rank: 3, academyId: 'acad_apollo', academyName: 'Apollo Engineering Academy', name: 'Apollo Engineering Academy', points: 36700, membersCount: 30, activeStudents: 30, challengesSolved: 240, badge: '🥉 Vanguard', tier: 'pro' },
  { rank: 4, academyId: 'acad_navy', academyName: 'Navy Tech Alliance', name: 'Navy Tech Alliance', points: 31500, membersCount: 25, activeStudents: 25, challengesSolved: 210, tier: 'pro' },
  { rank: 5, academyId: 'acad_bell', academyName: 'Bell Labs Cohort', name: 'Bell Labs Cohort', points: 27800, membersCount: 22, activeStudents: 22, challengesSolved: 180, tier: 'free' },
];

export const LAST_MONTH_STANDINGS: MonthlyAcademyStanding[] = [
  { rank: 1, academyId: 'acad_sovereign', academyName: 'Sovereign Core Guild', name: 'Sovereign Core Guild', points: 52400, membersCount: 40, activeStudents: 40, challengesSolved: 410, badge: '👑 Winner', tier: 'premium' },
  { rank: 2, academyId: 'acad_lagos_high', academyName: 'Lagos Tech High Alliance', name: 'Lagos Tech High Alliance', points: 49800, membersCount: 41, activeStudents: 41, challengesSolved: 380, badge: '🥈 Finalist', tier: 'premium' },
  { rank: 3, academyId: 'acad_apollo', academyName: 'Apollo Engineering Academy', name: 'Apollo Engineering Academy', points: 34100, membersCount: 28, activeStudents: 28, challengesSolved: 230, badge: '🥉 Bronze', tier: 'pro' },
];

class AcademyService {
  getCurrentMonthLeaderboard(): MonthlyAcademyStanding[] {
    return CURRENT_MONTH_STANDINGS;
  }

  getLastMonthLeaderboard(): MonthlyAcademyStanding[] {
    return LAST_MONTH_STANDINGS;
  }

  async getEffectiveTier(userId: string, hasProPass: boolean): Promise<{ source: 'academy' | 'individual' | 'free'; tier: 'premium' | 'pro' | 'free'; academyName?: string }> {
    return {
      source: 'academy',
      tier: 'premium',
      academyName: DEFAULT_ACADEMY.name,
    };
  }

  async getAcademy(id?: string): Promise<AcademyRecord> {
    return DEFAULT_ACADEMY;
  }

  async getAcademyById(id: string): Promise<AcademyRecord | null> {
    return DEFAULT_ACADEMY;
  }

  async getAcademies(): Promise<AcademyRecord[]> {
    return [DEFAULT_ACADEMY];
  }

  async getAcademyMembers(id: string): Promise<AcademyMemberRecord[]> {
    return DEFAULT_MEMBERS;
  }

  async getMembers(id?: string): Promise<AcademyMemberRecord[]> {
    return DEFAULT_MEMBERS;
  }

  async getMonthlyStandings(): Promise<MonthlyAcademyStanding[]> {
    return CURRENT_MONTH_STANDINGS;
  }

  async getMyEnrolledAcademy(userId?: string): Promise<{ academy: AcademyRecord } | null> {
    return { academy: DEFAULT_ACADEMY };
  }

  async getAcademyByJoinCode(code: string): Promise<AcademyRecord | null> {
    return DEFAULT_ACADEMY;
  }

  async createAcademy(data: Partial<AcademyRecord>): Promise<AcademyRecord> {
    const acad: AcademyRecord = {
      ...DEFAULT_ACADEMY,
      ...data,
      id: `acad_${Date.now()}`,
      join_code: data.join_code || data.joinCode || 'ACAD-' + Math.floor(100 + Math.random() * 900),
      subscription_plan: data.plan || data.subscription_plan || 'pro',
      created_at: new Date().toISOString(),
    };
    return acad;
  }

  async joinAcademy(
    joinCode: string,
    userId?: string,
    username?: string
  ): Promise<{ success: boolean; message: string; academy?: AcademyRecord; error?: string }> {
    if (joinCode.toUpperCase() === 'LOV300' || joinCode.trim().length > 0) {
      return { success: true, message: `Joined ${DEFAULT_ACADEMY.name}!`, academy: DEFAULT_ACADEMY };
    }
    return { success: false, message: 'Invalid academy invite code.', error: 'Invalid academy invite code.' };
  }

  async removeMember(academyId: string, memberUserId: string): Promise<boolean> {
    return true;
  }

  async leaveAcademy(userId: string): Promise<{ success: boolean; message: string }> {
    return { success: true, message: 'Successfully departed the academy.' };
  }
}

export const academyService = new AcademyService();
