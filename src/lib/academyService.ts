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

const STORAGE_ACADEMIES_LIST = 'sovereign_academies_list_v2';
const STORAGE_MY_ACADEMY = 'sovereign_my_academy_v2';
const STORAGE_ACADEMY_MEMBERS_PREFIX = 'sovereign_acad_members_v2_';

// Purge any legacy preseeded Lagos Tech High from localStorage
if (typeof window !== 'undefined') {
  try {
    const legacy = localStorage.getItem('sovereign_my_academy');
    if (legacy && (legacy.includes('acad_lagos_high') || legacy.includes('Lagos Tech High'))) {
      localStorage.removeItem('sovereign_my_academy');
    }
    const legacyList = localStorage.getItem('sovereign_academies_list');
    if (legacyList && (legacyList.includes('acad_lagos_high') || legacyList.includes('Lagos Tech High'))) {
      localStorage.removeItem('sovereign_academies_list');
    }
  } catch {}
}

class AcademyService {
  private getStoredAcademies(): AcademyRecord[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_ACADEMIES_LIST);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return parsed.filter((a) => a.id !== 'acad_lagos_high' && a.name !== 'Lagos Tech High Alliance');
        }
      }
    } catch {}
    return [];
  }

  private saveStoredAcademies(list: AcademyRecord[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_ACADEMIES_LIST, JSON.stringify(list));
    } catch {}
  }

  getCurrentMonthLeaderboard(): MonthlyAcademyStanding[] {
    const academies = this.getStoredAcademies();
    return academies
      .map((a, i) => ({
        rank: i + 1,
        academyId: a.id,
        academyName: a.name,
        name: a.name,
        points: a.points || 0,
        membersCount: a.membersCount || 1,
        activeStudents: a.membersCount || 1,
        challengesSolved: Math.round((a.points || 0) / 25),
        badge: i === 0 ? '👑 Champions' : i === 1 ? '🥈 Finalist' : undefined,
        tier: a.tier || 'pro',
      }))
      .sort((a, b) => b.points - a.points);
  }

  getLastMonthLeaderboard(): MonthlyAcademyStanding[] {
    return [];
  }

  async getEffectiveTier(
    userId: string,
    hasProPass: boolean
  ): Promise<{ source: 'academy' | 'individual' | 'free'; tier: 'premium' | 'pro' | 'free'; academyName?: string }> {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_MY_ACADEMY);
      if (stored) {
        try {
          const acad = JSON.parse(stored);
          if (acad && acad.id && acad.id !== 'acad_lagos_high' && acad.name !== 'Lagos Tech High Alliance') {
            return {
              source: 'academy',
              tier: (acad.tier as 'premium' | 'pro') || 'pro',
              academyName: acad.name,
            };
          }
        } catch {}
      }
    }
    if (hasProPass) {
      return { source: 'individual', tier: 'pro' };
    }
    return { source: 'free', tier: 'free' };
  }

  async getAcademy(id?: string): Promise<AcademyRecord | null> {
    const academies = this.getStoredAcademies();
    if (id) {
      return academies.find((a) => a.id === id) || null;
    }
    const my = await this.getMyEnrolledAcademy();
    return my ? my.academy : academies[0] || null;
  }

  async getAcademyById(id: string): Promise<AcademyRecord | null> {
    const academies = this.getStoredAcademies();
    return academies.find((a) => a.id === id) || null;
  }

  async getAcademies(): Promise<AcademyRecord[]> {
    return this.getStoredAcademies();
  }

  async getAcademyMembers(id: string): Promise<AcademyMemberRecord[]> {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(`${STORAGE_ACADEMY_MEMBERS_PREFIX}${id}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}
    return [];
  }

  async getMembers(id?: string): Promise<AcademyMemberRecord[]> {
    if (!id) return [];
    return this.getAcademyMembers(id);
  }

  async getMonthlyStandings(): Promise<MonthlyAcademyStanding[]> {
    return this.getCurrentMonthLeaderboard();
  }

  async getMyEnrolledAcademy(userId?: string): Promise<{ academy: AcademyRecord } | null> {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_MY_ACADEMY);
      if (stored) {
        try {
          const acad: AcademyRecord = JSON.parse(stored);
          if (acad && acad.id && acad.id !== 'acad_lagos_high' && acad.name !== 'Lagos Tech High Alliance') {
            return { academy: acad };
          }
        } catch {}
      }
    }
    return null;
  }

  async getAcademyByJoinCode(code: string): Promise<AcademyRecord | null> {
    const cleanCode = code.trim().toUpperCase();
    const academies = this.getStoredAcademies();
    return (
      academies.find(
        (a) => (a.join_code && a.join_code.toUpperCase() === cleanCode) || (a.joinCode && a.joinCode.toUpperCase() === cleanCode)
      ) || null
    );
  }

  async createAcademy(data: Partial<AcademyRecord>): Promise<AcademyRecord> {
    const joinCode = `ACAD-${Math.floor(1000 + Math.random() * 9000)}`;
    const newAcad: AcademyRecord = {
      id: `acad_${Date.now()}`,
      name: data.name || 'Custom Academy Alliance',
      joinCode,
      join_code: joinCode,
      membersCount: 1,
      maxMembers: data.plan === 'pro' ? 100 : 30,
      seat_cap: data.plan === 'pro' ? 100 : 30,
      seats_total: data.plan === 'pro' ? 100 : 30,
      next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      owner_id: data.owner_id || 'usr_academy_owner',
      leaderId: data.owner_id || 'usr_academy_owner',
      points: 0,
      tier: (data.plan as 'premium' | 'pro') || 'pro',
      subscription_plan: data.plan || 'pro',
      billing_email: data.billing_email || '',
      paystack_ref: data.paystack_ref || `STARS_${Date.now()}`,
      description: data.description || 'Verified educational academy alliance on TERMINALTOR.',
      created_at: new Date().toISOString(),
    };

    const existing = this.getStoredAcademies();
    existing.push(newAcad);
    this.saveStoredAcademies(existing);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_MY_ACADEMY, JSON.stringify(newAcad));
        const leaderMember: AcademyMemberRecord = {
          id: `mem_${Date.now()}`,
          userId: newAcad.owner_id,
          user_id: newAcad.owner_id,
          username: 'Academy Owner',
          role: 'leader',
          points: 0,
          xp_points: 0,
          challenges_solved: 0,
          last_active: 'Just now',
          joined_at: new Date().toISOString(),
        };
        localStorage.setItem(`${STORAGE_ACADEMY_MEMBERS_PREFIX}${newAcad.id}`, JSON.stringify([leaderMember]));
      } catch {}
    }

    return newAcad;
  }

  async joinAcademy(
    joinCode: string,
    userId?: string,
    username?: string
  ): Promise<{ success: boolean; message: string; academy?: AcademyRecord; error?: string }> {
    const clean = joinCode.trim().toUpperCase();
    const academy = await this.getAcademyByJoinCode(clean);

    if (!academy) {
      return {
        success: false,
        message: 'Invalid academy invite code. No active alliance matches this code.',
        error: 'Invalid academy invite code.',
      };
    }

    // Add member
    const currentMembers = await this.getAcademyMembers(academy.id);
    const existing = currentMembers.find((m) => m.userId === userId || m.user_id === userId);

    if (!existing) {
      const newMember: AcademyMemberRecord = {
        id: `mem_${Date.now()}`,
        userId: userId || `u_${Date.now()}`,
        user_id: userId || `u_${Date.now()}`,
        username: username || 'Cadet',
        role: 'cadet',
        points: 0,
        xp_points: 0,
        challenges_solved: 0,
        last_active: 'Just now',
        joined_at: new Date().toISOString(),
      };
      currentMembers.push(newMember);
      academy.membersCount = currentMembers.length;

      if (typeof window !== 'undefined') {
        localStorage.setItem(`${STORAGE_ACADEMY_MEMBERS_PREFIX}${academy.id}`, JSON.stringify(currentMembers));
        localStorage.setItem(STORAGE_MY_ACADEMY, JSON.stringify(academy));
      }
    }

    return {
      success: true,
      message: `Successfully joined ${academy.name}!`,
      academy,
    };
  }

  async removeMember(academyId: string, memberUserId: string): Promise<boolean> {
    const members = await this.getAcademyMembers(academyId);
    const filtered = members.filter((m) => m.userId !== memberUserId && m.user_id !== memberUserId);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`${STORAGE_ACADEMY_MEMBERS_PREFIX}${academyId}`, JSON.stringify(filtered));
    }
    return true;
  }

  async leaveAcademy(userId: string): Promise<{ success: boolean; message: string }> {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_MY_ACADEMY);
    }
    return { success: true, message: 'Successfully departed the academy.' };
  }
}

export const academyService = new AcademyService();
