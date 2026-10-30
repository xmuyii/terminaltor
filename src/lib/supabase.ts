import { Profile, UserProgress, UserRole } from '../types';

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

const STORAGE_KEY_PROFILE = 'sovereign_profile_v1';
const STORAGE_KEY_PROGRESS = 'sovereign_progress_v1';
const STORAGE_KEY_CODE = 'sovereign_saved_code_v1';

const DEFAULT_PROFILE: Profile = {
  id: 'student_demo',
  username: 'QuantumCadet',
  avatar_url: '',
  role: 'student' as UserRole,
  level: 5,
  points: 1250,
  xp_points: 1250,
  streak_days: 7,
  has_pro_pass: true,
  credits: 250,
  created_at: '2026-01-01T00:00:00Z',
  academy_id: 'acad_lagos_high',
  academy_name: 'Lagos Tech High',
};

class SupabaseStoreImpl {
  private syncStatus: SyncStatus = 'synced';
  private listeners: Array<(status: SyncStatus) => void> = [];

  getProfile(): Profile {
    if (typeof window === 'undefined') return DEFAULT_PROFILE;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PROFILE);
      if (stored) {
        return { ...DEFAULT_PROFILE, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Failed reading profile from storage:', e);
    }
    return DEFAULT_PROFILE;
  }

  updateProfile(partial: Partial<Profile>): Profile {
    const current = this.getProfile();
    const updated = { ...current, ...partial };
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed saving profile to storage:', e);
      }
    }
    return updated;
  }

  setRole(role: UserRole): Profile {
    return this.updateProfile({ role });
  }

  toggleProPass(): Profile {
    const current = this.getProfile();
    return this.updateProfile({ has_pro_pass: !current.has_pro_pass });
  }

  setProPassExplicit(hasPro: boolean): Profile {
    return this.updateProfile({ has_pro_pass: hasPro });
  }

  getProgress(): Record<string, UserProgress> {
    if (typeof window === 'undefined') return {};
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PROGRESS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed reading progress from storage:', e);
    }
    return {};
  }

  updateProgress(questId: string, partial: Partial<UserProgress>): UserProgress {
    const all = this.getProgress();
    const current = all[questId] || {
      id: `prog_${questId}`,
      user_id: 'student_demo',
      quest_id: questId,
      completed: false,
      score: 0,
    };
    const updated = { ...current, ...partial };
    all[questId] = updated;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(all));
      } catch (e) {
        console.warn('Failed saving progress to storage:', e);
      }
    }
    return updated;
  }

  recordQuestCompletion(
    questId: string,
    scoreOrPassed: number | boolean,
    codeOrScore?: string | number
  ): { profile: Profile; progress: UserProgress } {
    const score =
      typeof scoreOrPassed === 'number'
        ? scoreOrPassed
        : typeof codeOrScore === 'number'
        ? codeOrScore
        : 100;
    const code = typeof codeOrScore === 'string' ? codeOrScore : undefined;
    const prog = this.updateProgress(questId, { completed: true, score, submitted_code: code });
    const prof = this.updateProfile({
      points: (this.getProfile().points || 0) + score,
      xp_points: this.getProfile().xp_points + score,
    });
    return { profile: prof, progress: prog };
  }

  saveCode(questId: string, code: string): void {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CODE) || '{}';
      const parsed = JSON.parse(stored);
      parsed[questId] = code;
      localStorage.setItem(STORAGE_KEY_CODE, JSON.stringify(parsed));
    } catch (e) {
      // fallback
    }
  }

  getSavedCode(questId: string, fallback: string = ''): string {
    if (typeof window === 'undefined') return fallback;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CODE);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed[questId]) return parsed[questId];
      }
    } catch (e) {
      // fallback
    }
    return fallback;
  }

  getSyncStatus(): SyncStatus {
    return this.syncStatus;
  }

  onSyncStatusChange(cb: (status: SyncStatus) => void): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  setSyncStatus(status: SyncStatus) {
    this.syncStatus = status;
    this.listeners.forEach((cb) => cb(status));
  }
}

export const SupabaseStore = new SupabaseStoreImpl();
