export type UserRole = 'student' | 'instructor' | 'teacher' | 'admin';

export interface Profile {
  id: string;
  username: string;
  role: UserRole;
  xp_points: number;
  streak_days: number;
  has_pro_pass: boolean;
  credits: number;
  last_daily_credits_claim?: string;
  avatar_url?: string;
  created_at: string;
  points?: number;
  level?: number;
  academy_id?: string;
  academy_name?: string;
  equipped_style_title?: string;
}

export interface TestCase {
  id: string;
  title: string;
  description: string;
  input?: string;
  expected_output?: string;
  assertion_code?: string;
  hidden?: boolean;
}

export interface Quest {
  id: string;
  level: number;
  title: string;
  subtitle: string;
  category: 'Fundamentals' | 'Data Structures' | 'Algorithms' | 'Game Dev';
  description: string;
  lore: string;
  objectives: string[];
  starter_code: string;
  solution_code?: string;
  hints: string[];
  test_cases: TestCase[];
  xp_reward: number;
  badge_title: string;
  badge_icon: string;
  is_pro: boolean;
  tier?: number;
}

export interface UserProgress {
  id: string;
  user_id: string;
  quest_id: string;
  completed: boolean;
  score: number;
  submitted_code?: string;
  completed_at?: string;
}

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  returnValue: unknown;
  executionTimeMs: number;
  error?: string;
}

export interface TestResultItem {
  testId: string;
  title: string;
  passed: boolean;
  expected: string;
  actual: string;
  error?: string;
}

export interface ValidationResult {
  allPassed: boolean;
  passedCount: number;
  totalCount: number;
  testResults: TestResultItem[];
  stdout: string;
  stderr: string;
  executionTimeMs: number;
}
