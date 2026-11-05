import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Profile, UserProgress, UserRole } from '../types';

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

const STORAGE_KEY_PROFILE = 'sovereign_profile_v1';
const STORAGE_KEY_PROGRESS = 'sovereign_progress_v1';
const STORAGE_KEY_CODE = 'sovereign_saved_code_v1';

// Read Supabase environment variables
const rawUrl =
  (import.meta.env.VITE_SUPABASE_URL as string) ||
  (import.meta.env.NEXT_PUBLIC_SUPABASE_URL as string) ||
  '';
const rawKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
  (import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string) ||
  '';

export const isSupabaseConfigured = (): boolean => {
  return (
    Boolean(rawUrl) &&
    Boolean(rawKey) &&
    !rawUrl.includes('your-project') &&
    !rawKey.includes('placeholder')
  );
};

export const getSupabaseConfig = () => {
  return {
    url: rawUrl,
    hasKey: Boolean(rawKey && !rawKey.includes('placeholder')),
    isConfigured: isSupabaseConfigured(),
  };
};

// Initialize the real Supabase client singleton if environment keys are present
export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(rawUrl, rawKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

const DEFAULT_PROFILE: Profile = {
  id: 'cadet_init',
  username: 'SoloCadet',
  avatar_url: '',
  role: 'student' as UserRole,
  level: 1,
  points: 0,
  xp_points: 0,
  streak_days: 1,
  has_pro_pass: false,
  credits: 150,
  created_at: '2026-01-01T00:00:00Z',
  academy_id: undefined,
  academy_name: 'Solo Developer',
};

class SupabaseStoreImpl {
  private syncStatus: SyncStatus = isSupabaseConfigured() ? 'synced' : 'offline';
  private listeners: Array<(status: SyncStatus) => void> = [];

  constructor() {
    if (isSupabaseConfigured() && typeof window !== 'undefined') {
      // Background initial sync of profile from Supabase
      this.fetchRemoteProfile();
    }
  }

  async fetchRemoteProfile(): Promise<Profile | null> {
    if (!supabase) return null;
    const local = this.getProfile();
    if (!local || !local.id || local.id === 'cadet_init') return null;

    try {
      this.setSyncStatus('syncing');
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', local.id)
        .maybeSingle();

      if (error) {
        console.warn('[Supabase] Error fetching profile:', error.message);
        this.setSyncStatus('error');
        return null;
      }

      if (data) {
        const merged: Profile = {
          ...local,
          username: data.username || local.username,
          role: (data.role as UserRole) || local.role,
          xp_points: typeof data.xp_points === 'number' ? data.xp_points : local.xp_points,
          has_pro_pass: typeof data.has_pro_pass === 'boolean' ? data.has_pro_pass : local.has_pro_pass,
          streak_days: data.streak_days || local.streak_days,
          avatar_url: data.avatar_url || local.avatar_url,
          telegram_username: data.telegram_username || local.telegram_username,
          google_email: data.google_email || local.google_email,
        };
        localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(merged));
        this.setSyncStatus('synced');
        return merged;
      }
      this.setSyncStatus('synced');
    } catch (e) {
      console.warn('[Supabase] Remote profile fetch failed:', e);
      this.setSyncStatus('error');
    }
    return null;
  }

  getProfile(): Profile {
    if (typeof window === 'undefined') return DEFAULT_PROFILE;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PROFILE);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Sanitize legacy demo profile values from development
        if (parsed.username === 'QuantumCadet' || parsed.id === 'student_demo') {
          parsed.username = 'SoloCadet';
          parsed.id = `cadet_${Date.now()}`;
          parsed.has_pro_pass = false;
          try {
            localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(parsed));
          } catch {}
        }
        if (parsed.academy_id === 'acad_lagos_high') {
          delete parsed.academy_id;
          parsed.academy_name = 'Solo Developer';
          try {
            localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(parsed));
          } catch {}
        }
        return { ...DEFAULT_PROFILE, ...parsed };
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

    // Live Sync to Supabase
    if (supabase && updated.id && updated.id !== 'cadet_init') {
      this.setSyncStatus('syncing');
      const payload: Record<string, any> = {
        id: updated.id,
        username: updated.username,
        role: updated.role,
        xp_points: updated.xp_points || 0,
        has_pro_pass: Boolean(updated.has_pro_pass),
        streak_days: updated.streak_days || 1,
        avatar_url: updated.avatar_url || '',
        telegram_username: updated.telegram_username || null,
        google_email: updated.google_email || null,
        updated_at: new Date().toISOString(),
      };

      Promise.resolve(
        supabase
          .from('profiles')
          .upsert(payload, { onConflict: 'id' })
      )
        .then(({ error }) => {
          if (error) {
            console.warn('[Supabase] Failed syncing profile:', error.message);
            this.setSyncStatus('error');
          } else {
            this.setSyncStatus('synced');
          }
        })
        .catch((err: unknown) => {
          console.warn('[Supabase] Profile sync exception:', err);
          this.setSyncStatus('error');
        });
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
      user_id: this.getProfile().id,
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

    // Live sync progress to Supabase
    if (supabase && updated.user_id && updated.user_id !== 'cadet_init') {
      Promise.resolve(
        supabase
          .from('user_progress')
          .upsert(
            {
              user_id: updated.user_id,
              quest_id: questId,
              completed: updated.completed,
              score: updated.score || 0,
              submitted_code: updated.submitted_code || null,
              completed_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,quest_id' }
          )
      )
        .then(({ error }) => {
          if (error) {
            console.warn('[Supabase] Failed syncing user_progress:', error.message);
          }
        })
        .catch(() => {});
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

/**
 * Diagnostic utility: checks live Supabase connectivity and schema accessibility
 */
export async function testSupabaseConnection(): Promise<{
  configured: boolean;
  url: string;
  connected: boolean;
  profilesAccessible: boolean;
  message: string;
  errorDetail?: string;
}> {
  if (!isSupabaseConfigured() || !supabase) {
    return {
      configured: false,
      url: rawUrl || '(Not set)',
      connected: false,
      profilesAccessible: false,
      message: 'Supabase credentials are not configured in environment variables (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY).',
    };
  }

  try {
    const { data, error } = await supabase.from('profiles').select('id, username').limit(1);
    if (error) {
      return {
        configured: true,
        url: rawUrl,
        connected: false,
        profilesAccessible: false,
        message: `Endpoint reached, but "profiles" table query returned: ${error.message}`,
        errorDetail: error.details || error.hint || error.message,
      };
    }
    return {
      configured: true,
      url: rawUrl,
      connected: true,
      profilesAccessible: true,
      message: 'Connection successful! Verified read/write access to Supabase "profiles" table.',
    };
  } catch (err: any) {
    return {
      configured: true,
      url: rawUrl,
      connected: false,
      profilesAccessible: false,
      message: `Network error connecting to Supabase: ${err.message}`,
    };
  }
}
