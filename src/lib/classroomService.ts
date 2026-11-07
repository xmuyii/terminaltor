export interface Cohort {
  id: string;
  name: string;
  section?: string;
  join_code: string;
  joinCode?: string;
  member_count: number;
  memberCount?: number;
  assignment_count?: number;
  instructorId?: string;
  created_at?: string;
  role?: 'student' | 'teacher';
}

export interface CohortMember {
  id: string;
  cohort_id: string;
  user_id: string;
  username: string;
  role: 'student' | 'ta' | 'teacher';
  xp: number;
  streak: number;
  completed_quests?: number;
  total_points?: number;
  last_active: string;
}

export interface Assignment {
  id: string;
  cohort_id: string;
  title: string;
  description: string;
  due_at: string;
  due_date?: string;
  challenge_ids: string[];
  solved_count: number;
  total_count: number;
  is_completed?: boolean;
}

export interface GradebookRow {
  user_id: string;
  username: string;
  total_xp: number;
  streak: number;
  assignments: Record<string, { status: string; score: number }>;
  progress: number;
}

export interface CohortHintActivity {
  total_hints: number;
  active_students: number;
  hints_by_level: Record<string | number, number> & { level_3?: number };
  stuck_students: Array<{ student_name: string; quest_id: string; hints_used: number }>;
}

const STORAGE_COHORTS = 'sovereign_cohorts_v2';
const STORAGE_COHORT_MEMBERS = 'sovereign_cohort_members_v2';
const STORAGE_ASSIGNMENTS = 'sovereign_assignments_v2';

export class ClassroomService {
  static initDefaults(): void {
    // Zero preseeded dummy data
  }

  static getStoredCohorts(): Array<Cohort & { role: 'student' | 'teacher' }> {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_COHORTS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return parsed.filter((c) => c.id !== 'cohort_1' && c.name !== 'AP Computer Science A');
        }
      }
    } catch {}
    return [];
  }

  static saveStoredCohorts(list: Array<Cohort & { role: 'student' | 'teacher' }>): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_COHORTS, JSON.stringify(list));
    } catch {}
  }

  static getUserCohorts(userId?: string): Array<Cohort & { role: 'student' | 'teacher' }> {
    const list = this.getStoredCohorts();
    if (!userId) return list;
    return list.filter((c) => c.instructorId === userId || c.role === 'teacher' || c.role === 'student');
  }

  static getCohortMembers(cohortId?: string, userId?: string): CohortMember[] {
    if (typeof window === 'undefined' || !cohortId) return [];
    try {
      const data = localStorage.getItem(`${STORAGE_COHORT_MEMBERS}_${cohortId}`);
      if (data) {
        return JSON.parse(data);
      }
    } catch {}
    return [];
  }

  static getMembers(): CohortMember[] {
    return [];
  }

  static getCohortAssignments(cohortId?: string, userId?: string): Assignment[] {
    if (typeof window === 'undefined' || !cohortId) return [];
    try {
      const data = localStorage.getItem(`${STORAGE_ASSIGNMENTS}_${cohortId}`);
      if (data) {
        return JSON.parse(data);
      }
    } catch {}
    return [];
  }

  static getGradebook(cohortId?: string, userId?: string): { assignments: Assignment[]; rows: GradebookRow[] } {
    const assignments = this.getCohortAssignments(cohortId, userId);
    const members = this.getCohortMembers(cohortId, userId);
    const rows: GradebookRow[] = members.map((m) => ({
      user_id: m.user_id,
      username: m.username,
      total_xp: m.xp,
      streak: m.streak,
      assignments: {},
      progress: 0,
    }));
    return { assignments, rows };
  }

  static getCohortHintActivity(cohortId?: string, userId?: string): CohortHintActivity {
    return {
      total_hints: 0,
      active_students: 0,
      hints_by_level: { 1: 0, 2: 0, 3: 0 },
      stuck_students: [],
    };
  }

  static createCohort(userId: string, name: string): Cohort & { role: 'teacher' } {
    const newCohort: Cohort & { role: 'teacher' } = {
      id: `cohort_${Date.now()}`,
      name,
      join_code: `CODE-${Math.floor(100 + Math.random() * 900)}`,
      member_count: 1,
      assignment_count: 0,
      instructorId: userId,
      created_at: new Date().toISOString(),
      role: 'teacher',
    };

    const current = this.getStoredCohorts();
    current.push(newCohort);
    this.saveStoredCohorts(current);

    // Save initial instructor member
    if (typeof window !== 'undefined') {
      const instructorMember: CohortMember = {
        id: `cm_${Date.now()}`,
        cohort_id: newCohort.id,
        user_id: userId,
        username: 'Instructor',
        role: 'teacher',
        xp: 0,
        streak: 1,
        last_active: 'Just now',
      };
      localStorage.setItem(`${STORAGE_COHORT_MEMBERS}_${newCohort.id}`, JSON.stringify([instructorMember]));
    }

    return newCohort;
  }

  static joinCohort(userId: string, code: string): { success: boolean; message?: string; cohort?: Cohort & { role: 'student' } } {
    const clean = code.trim().toUpperCase();
    const cohorts = this.getStoredCohorts();
    const target = cohorts.find((c) => c.join_code?.toUpperCase() === clean || c.joinCode?.toUpperCase() === clean);

    if (!target) {
      return {
        success: false,
        message: 'Invalid cohort code. No active classroom found with this code.',
      };
    }

    const currentMembers = this.getCohortMembers(target.id);
    const existing = currentMembers.find((m) => m.user_id === userId);
    if (!existing) {
      currentMembers.push({
        id: `cm_${Date.now()}`,
        cohort_id: target.id,
        user_id: userId,
        username: 'Cadet',
        role: 'student',
        xp: 0,
        streak: 1,
        last_active: 'Just now',
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem(`${STORAGE_COHORT_MEMBERS}_${target.id}`, JSON.stringify(currentMembers));
      }
      target.member_count = currentMembers.length;
      this.saveStoredCohorts(cohorts);
    }

    return {
      success: true,
      cohort: { ...target, role: 'student' },
    };
  }

  static createAssignment(
    cohortId: string,
    userId: string,
    title: string,
    description: string,
    challenge_ids: string[],
    due_at: string
  ): Assignment {
    const newAs: Assignment = {
      id: `as_${Date.now()}`,
      cohort_id: cohortId,
      title,
      description,
      challenge_ids,
      due_at,
      solved_count: 0,
      total_count: 0,
      is_completed: false,
    };
    const current = this.getCohortAssignments(cohortId, userId);
    current.push(newAs);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`${STORAGE_ASSIGNMENTS}_${cohortId}`, JSON.stringify(current));
    }
    return newAs;
  }

  static removeMember(cohortId: string, userId: string, targetUserId: string): boolean {
    const members = this.getCohortMembers(cohortId, userId);
    const filtered = members.filter((m) => m.user_id !== targetUserId);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`${STORAGE_COHORT_MEMBERS}_${cohortId}`, JSON.stringify(filtered));
    }
    return true;
  }

  static exportGradebookCSV(cohortId: string, userId: string): string {
    const members = this.getCohortMembers(cohortId, userId);
    let csv = `Student,Total XP,Streak,Role\n`;
    members.forEach((m) => {
      csv += `${m.username},${m.xp},${m.streak},${m.role}\n`;
    });
    return csv;
  }
}
