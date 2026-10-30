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

const DEFAULT_COHORT: Cohort & { role: 'student' | 'teacher' } = {
  id: 'cohort_1',
  name: 'AP Computer Science A',
  section: 'Period 3',
  join_code: 'APCSA-301',
  joinCode: 'APCSA-301',
  member_count: 28,
  memberCount: 28,
  assignment_count: 2,
  instructorId: 'inst_hopper',
  created_at: '2026-09-01T00:00:00Z',
  role: 'teacher',
};

const DEFAULT_MEMBERS: CohortMember[] = [
  { id: 'cm_1', cohort_id: 'cohort_1', user_id: 'u_1', username: 'AdaLovelace', role: 'student', xp: 1850, streak: 12, last_active: '15m ago' },
  { id: 'cm_2', cohort_id: 'cohort_1', user_id: 'u_2', username: 'AlanTuring', role: 'student', xp: 1720, streak: 9, last_active: '1h ago' },
  { id: 'cm_3', cohort_id: 'cohort_1', user_id: 'me', username: 'QuantumCadet', role: 'student', xp: 1250, streak: 7, last_active: 'Active now' },
];

const DEFAULT_ASSIGNMENTS: Assignment[] = [
  { id: 'as_1', cohort_id: 'cohort_1', title: 'Cyber Core Syntax', description: 'Master foundational syntax and variable scoping', due_at: new Date(Date.now() + 86400000).toISOString(), challenge_ids: ['quest-1'], solved_count: 24, total_count: 28, is_completed: true },
  { id: 'as_2', cohort_id: 'cohort_1', title: 'Algorithm Loopers', description: 'Solve matrix iterations and edge condition assertions', due_at: new Date(Date.now() + 86400000 * 3).toISOString(), challenge_ids: ['quest-2'], solved_count: 18, total_count: 28, is_completed: false },
];

const DEFAULT_GRADEBOOK: { assignments: Assignment[]; rows: GradebookRow[] } = {
  assignments: DEFAULT_ASSIGNMENTS,
  rows: [
    { user_id: 'u_1', username: 'AdaLovelace', total_xp: 1850, streak: 12, assignments: { as_1: { status: 'passed', score: 100 }, as_2: { status: 'passed', score: 95 } }, progress: 100 },
    { user_id: 'u_2', username: 'AlanTuring', total_xp: 1720, streak: 9, assignments: { as_1: { status: 'passed', score: 100 }, as_2: { status: 'passed', score: 90 } }, progress: 95 },
    { user_id: 'me', username: 'QuantumCadet', total_xp: 1250, streak: 7, assignments: { as_1: { status: 'passed', score: 100 }, as_2: { status: 'submitted', score: 85 } }, progress: 90 },
  ],
};

const DEFAULT_HINT_ACTIVITY: CohortHintActivity = {
  total_hints: 14,
  active_students: 8,
  hints_by_level: { 1: 8, 2: 4, 3: 2 },
  stuck_students: [
    { student_name: 'QuantumCadet', quest_id: 'quest-2', hints_used: 2 },
    { student_name: 'AlanTuring', quest_id: 'quest-3', hints_used: 1 },
  ],
};

export class ClassroomService {
  static initDefaults(): void {
    // initialize storage defaults if needed
  }

  static getUserCohorts(userId?: string): Array<Cohort & { role: 'student' | 'teacher' }> {
    return [DEFAULT_COHORT];
  }

  static getCohortMembers(cohortId?: string, userId?: string): CohortMember[] {
    return DEFAULT_MEMBERS;
  }

  static getMembers(): CohortMember[] {
    return DEFAULT_MEMBERS;
  }

  static getCohortAssignments(cohortId?: string, userId?: string): Assignment[] {
    return DEFAULT_ASSIGNMENTS;
  }

  static getGradebook(cohortId?: string, userId?: string): { assignments: Assignment[]; rows: GradebookRow[] } {
    return DEFAULT_GRADEBOOK;
  }

  static getCohortHintActivity(cohortId?: string, userId?: string): CohortHintActivity {
    return DEFAULT_HINT_ACTIVITY;
  }

  static createCohort(userId: string, name: string): Cohort & { role: 'teacher' } {
    return {
      id: `cohort_${Date.now()}`,
      name,
      join_code: `CODE-${Math.floor(100 + Math.random() * 900)}`,
      member_count: 1,
      assignment_count: 0,
      role: 'teacher',
    };
  }

  static joinCohort(userId: string, code: string): { success: boolean; message?: string; cohort?: Cohort & { role: 'student' } } {
    return {
      success: true,
      cohort: { ...DEFAULT_COHORT, role: 'student' },
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
    return {
      id: `as_${Date.now()}`,
      cohort_id: cohortId,
      title,
      description,
      challenge_ids,
      due_at,
      solved_count: 0,
      total_count: 28,
      is_completed: false,
    };
  }

  static removeMember(cohortId: string, userId: string, targetUserId: string): boolean {
    return true;
  }

  static exportGradebookCSV(cohortId: string, userId: string): string {
    return `Student,Total XP,Streak,Progress\nAdaLovelace,1850,12,100%\nAlanTuring,1720,9,95%\nQuantumCadet,1250,7,90%\n`;
  }
}
