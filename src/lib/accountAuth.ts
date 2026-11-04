import { Profile, UserRole, AuthProvider } from '../types';
import { SupabaseStore } from './supabase';

export interface AccountSession {
  id: string;
  username: string;
  role: UserRole;
  auth_provider: AuthProvider;
  email?: string;
  telegram_username?: string;
  telegram_id?: string;
  google_email?: string;
  avatar_url?: string;
  created_at: string;
}

export interface StoredCredential {
  id: string;
  username: string;
  passwordHash: string;
  role: UserRole;
  email?: string;
  telegram_username?: string;
  google_email?: string;
  created_at: string;
}

const STORAGE_KEY_ACCOUNT = 'sovereign_account_session_v1';
const STORAGE_KEY_USERS = 'sovereign_registered_cadets_v1';

// Simple client-side hash function for password storage resilience
async function hashPassword(password: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + ':SOVEREIGN_SALT_2026');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback hash
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    hash = (hash << 5) - hash + password.charCodeAt(i);
    hash |= 0;
  }
  return 'fb_' + Math.abs(hash).toString(16);
}

class AccountAuthService {
  private getRegisteredUsers(): Record<string, StoredCredential> {
    if (typeof window === 'undefined') return {};
    try {
      const stored = localStorage.getItem(STORAGE_KEY_USERS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed reading registered users:', e);
    }
    return {};
  }

  private saveRegisteredUsers(users: Record<string, StoredCredential>): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    } catch (e) {
      console.warn('Failed saving registered users:', e);
    }
  }

  getSession(): AccountSession | null {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ACCOUNT);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed reading account session:', e);
    }
    return null;
  }

  hasActiveSession(): boolean {
    return !!this.getSession();
  }

  setSession(session: AccountSession): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_ACCOUNT, JSON.stringify(session));
      localStorage.setItem('sovereign_account_onboarded_v1', 'true');
    } catch (e) {
      console.warn('Failed setting session:', e);
    }

    // Keep SupabaseStore synchronized with authenticated identity
    SupabaseStore.updateProfile({
      id: session.id,
      username: session.username,
      avatar_url: session.avatar_url || '',
      role: session.role || 'student',
      auth_provider: session.auth_provider,
      telegram_username: session.telegram_username,
      google_email: session.google_email,
      academy_id: undefined,
      academy_name: 'Solo Developer',
    });
  }

  clearSession(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY_ACCOUNT);
  }

  signOut(): void {
    this.clearSession();
    // Reset to default cadet profile
    SupabaseStore.updateProfile({
      id: `cadet_${Date.now()}`,
      username: 'SoloCadet',
      role: 'student',
      has_pro_pass: false,
      auth_provider: undefined,
      telegram_username: undefined,
      google_email: undefined,
      academy_id: undefined,
      academy_name: 'Solo Developer',
    });
  }

  async registerWithCredentials(
    rawUsername: string,
    rawPassword: string,
    options?: {
      email?: string;
      telegramUsername?: string;
      googleEmail?: string;
    }
  ): Promise<{ success: boolean; session?: AccountSession; message?: string }> {
    const cleanUsername = rawUsername.trim().replace(/^@+/, '');
    if (!cleanUsername || cleanUsername.length < 3) {
      return { success: false, message: 'Username must be at least 3 characters long.' };
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(cleanUsername)) {
      return { success: false, message: 'Username may only contain letters, numbers, underscores, and dashes.' };
    }
    if (!rawPassword || rawPassword.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters long.' };
    }

    const key = cleanUsername.toLowerCase();
    const users = this.getRegisteredUsers();
    if (users[key]) {
      return { success: false, message: `The username "${cleanUsername}" is already registered. Please sign in or choose another.` };
    }

    const passwordHash = await hashPassword(rawPassword);
    const userId = `cadet_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const newCredential: StoredCredential = {
      id: userId,
      username: cleanUsername,
      passwordHash,
      role: 'student',
      email: options?.email?.trim(),
      telegram_username: options?.telegramUsername?.trim().replace(/^@+/, ''),
      google_email: options?.googleEmail?.trim(),
      created_at: now,
    };

    users[key] = newCredential;
    this.saveRegisteredUsers(users);

    // Call backend endpoint to persist across devices
    try {
      await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: cleanUsername,
          password: rawPassword,
          email: options?.email,
          telegramUsername: options?.telegramUsername,
          googleEmail: options?.googleEmail,
        }),
      });
    } catch {
      // Backend optional; client-side persistent storage guarantees offline/resilient play
    }

    const session: AccountSession = {
      id: userId,
      username: cleanUsername,
      role: 'student',
      auth_provider: 'credentials',
      email: options?.email,
      telegram_username: options?.telegramUsername,
      google_email: options?.googleEmail,
      created_at: now,
    };

    this.setSession(session);
    return { success: true, session, message: 'Account successfully registered!' };
  }

  async loginWithCredentials(
    rawUsername: string,
    rawPassword: string
  ): Promise<{ success: boolean; session?: AccountSession; message?: string }> {
    const cleanUsername = rawUsername.trim().replace(/^@+/, '');
    if (!cleanUsername) {
      return { success: false, message: 'Please enter your username.' };
    }
    if (!rawPassword) {
      return { success: false, message: 'Please enter your password.' };
    }

    const key = cleanUsername.toLowerCase();
    const users = this.getRegisteredUsers();
    const localUser = users[key];

    // Try backend verification first
    try {
      const resp = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUsername, password: rawPassword }),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.success && data.user) {
          const session: AccountSession = {
            id: data.user.id || `cadet_${cleanUsername}`,
            username: data.user.username || cleanUsername,
            role: data.user.role || 'student',
            auth_provider: 'credentials',
            email: data.user.email,
            telegram_username: data.user.telegram_username,
            google_email: data.user.google_email,
            created_at: data.user.created_at || new Date().toISOString(),
          };
          this.setSession(session);
          return { success: true, session };
        }
      }
    } catch {
      // Continue to local verification
    }

    // Local credential check
    if (!localUser) {
      return { success: false, message: `Account "${cleanUsername}" not found. Please create an account first.` };
    }

    const hash = await hashPassword(rawPassword);
    if (localUser.passwordHash !== hash) {
      return { success: false, message: 'Incorrect password. Please try again.' };
    }

    const session: AccountSession = {
      id: localUser.id,
      username: localUser.username,
      role: localUser.role,
      auth_provider: 'credentials',
      email: localUser.email,
      telegram_username: localUser.telegram_username,
      google_email: localUser.google_email,
      created_at: localUser.created_at,
    };

    this.setSession(session);
    return { success: true, session };
  }

  async loginWithGoogle(googleUser: {
    email: string;
    name?: string;
    avatarUrl?: string;
    sub?: string;
    desiredUsername?: string;
  }): Promise<{ success: boolean; session?: AccountSession; message?: string }> {
    const email = googleUser.email.trim().toLowerCase();
    if (!email) {
      return { success: false, message: 'Google account did not return a valid email address.' };
    }

    // Suggest username from email prefix if not supplied
    const fallbackUsername = email.split('@')[0].replace(/[^a-zA-Z0-9_-]/g, '_');
    const cleanUsername = (googleUser.desiredUsername || googleUser.name || fallbackUsername).replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 20);

    const users = this.getRegisteredUsers();
    // Check if a user already has this google email linked
    let existingUser = Object.values(users).find(
      (u) => u.google_email?.toLowerCase() === email || u.email?.toLowerCase() === email
    );

    const now = new Date().toISOString();
    let finalId = existingUser?.id || `cadet_g_${Date.now().toString(36)}`;
    let finalUsername = existingUser?.username || cleanUsername;

    if (!existingUser) {
      // Register new user under this Google account
      const key = finalUsername.toLowerCase();
      // Ensure unique username
      if (users[key]) {
        finalUsername = `${finalUsername}_${Math.floor(100 + Math.random() * 900)}`;
      }

      const newCred: StoredCredential = {
        id: finalId,
        username: finalUsername,
        passwordHash: 'google_oauth_authenticated',
        role: 'student',
        email,
        google_email: email,
        created_at: now,
      };
      users[finalUsername.toLowerCase()] = newCred;
      this.saveRegisteredUsers(users);
    }

    // Attempt backend registration/login
    try {
      await fetch('/api/v1/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: googleUser.name || finalUsername,
          googleId: googleUser.sub || finalId,
          avatarUrl: googleUser.avatarUrl,
        }),
      });
    } catch {
      // offline fallback
    }

    const session: AccountSession = {
      id: finalId,
      username: finalUsername,
      role: existingUser?.role || 'student',
      auth_provider: 'google',
      email,
      google_email: email,
      avatar_url: googleUser.avatarUrl,
      created_at: existingUser?.created_at || now,
    };

    this.setSession(session);
    return { success: true, session };
  }

  linkTelegramToCurrentAccount(telegramUsername: string, tgId?: string): boolean {
    const current = this.getSession();
    if (!current) return false;

    const cleanTg = telegramUsername.replace(/^@+/, '').trim();
    current.telegram_username = cleanTg;
    if (tgId) current.telegram_id = String(tgId);

    this.setSession(current);

    // Update in stored credentials
    const users = this.getRegisteredUsers();
    const key = current.username.toLowerCase();
    if (users[key]) {
      users[key].telegram_username = cleanTg;
      this.saveRegisteredUsers(users);
    }

    // Call backend to sync
    try {
      fetch('/api/v1/auth/link-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: current.username,
          provider: 'telegram',
          identifier: cleanTg,
        }),
      });
    } catch {}

    return true;
  }

  linkGoogleToCurrentAccount(googleEmail: string): boolean {
    const current = this.getSession();
    if (!current) return false;

    const cleanEmail = googleEmail.trim().toLowerCase();
    current.google_email = cleanEmail;
    this.setSession(current);

    const users = this.getRegisteredUsers();
    const key = current.username.toLowerCase();
    if (users[key]) {
      users[key].google_email = cleanEmail;
      this.saveRegisteredUsers(users);
    }

    try {
      fetch('/api/v1/auth/link-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: current.username,
          provider: 'google',
          identifier: cleanEmail,
        }),
      });
    } catch {}

    return true;
  }

  async updateUsername(newUsername: string): Promise<{ success: boolean; message: string; username?: string }> {
    const cleanNew = newUsername.trim().replace(/^@+/, '');
    if (!cleanNew || cleanNew.length < 3) {
      return { success: false, message: 'Callsign must be at least 3 characters long.' };
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(cleanNew)) {
      return { success: false, message: 'Callsign may only contain letters, numbers, underscores, and dashes.' };
    }

    const currentSession = this.getSession();
    const currentProfile = SupabaseStore.getProfile();
    const userId = currentSession?.id || currentProfile.id;

    // Check local collision
    const users = this.getRegisteredUsers();
    const newKey = cleanNew.toLowerCase();
    const existing = users[newKey];
    if (existing && existing.id !== userId) {
      return { success: false, message: `The callsign "${cleanNew}" is already taken by another cadet.` };
    }

    // Call backend endpoint to synchronize
    try {
      const resp = await fetch('/api/v1/auth/update-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newUsername: cleanNew }),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (!data.success) {
          return { success: false, message: data.message || 'Callsign already taken.' };
        }
      }
    } catch {
      // offline support
    }

    // Update in stored credentials
    const oldUsername = currentSession?.username || currentProfile.username;
    const oldKey = oldUsername.replace(/^@+/, '').toLowerCase();
    let userCred = users[oldKey];
    if (userCred) {
      delete users[oldKey];
      userCred.username = cleanNew;
      users[newKey] = userCred;
    } else {
      userCred = {
        id: userId,
        username: cleanNew,
        passwordHash: '',
        role: currentProfile.role || 'student',
        created_at: new Date().toISOString(),
      };
      users[newKey] = userCred;
    }
    this.saveRegisteredUsers(users);

    // Update session
    if (currentSession) {
      currentSession.username = cleanNew;
      this.setSession(currentSession);
    }

    // Update SupabaseStore profile
    SupabaseStore.updateProfile({ username: cleanNew });

    return {
      success: true,
      username: cleanNew,
      message: `Callsign successfully changed to "${cleanNew}"!`,
    };
  }
}

export function resolveCanonicalPlayerId(params: {
  telegramId?: string | number;
  googleEmail?: string;
  username?: string;
  existingId?: string;
}): string {
  if (params.telegramId) {
    return `tg_${params.telegramId}`;
  }
  if (params.googleEmail) {
    const cleanEmail = params.googleEmail.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');
    return `g_${cleanEmail}`;
  }
  if (params.existingId && !params.existingId.startsWith('cadet_init')) {
    return params.existingId;
  }
  const cleanUser = (params.username || 'cadet').trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');
  return `usr_${cleanUser}`;
}

export const accountAuth = new AccountAuthService();
