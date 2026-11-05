import { Profile, UserRole } from '../types';
import { SupabaseStore } from './supabase';
import { accountAuth } from './accountAuth';

export interface TelegramUserData {
  id: string;
  first_name: string;
  last_name?: string;
  username: string;
  language_code?: string;
  photo_url?: string;
  role?: UserRole;
  auth_date?: number;
  hash?: string;
  is_webapp?: boolean;
}

const STORAGE_KEY_TG = 'sovereign_tg_session_v1';

export const getTelegramBotUsername = (): string => {
  const raw = (import.meta.env.VITE_TELEGRAM_BOT_USERNAME as string) || 'Hqgamebot';
  const clean = raw.replace(/^@+/, '').trim();
  return clean || 'Hqgamebot';
};

class TelegramAuthService {
  getSession(): TelegramUserData | null {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_TG);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      // fallback
    }
    return null;
  }

  hasActiveSession(): boolean {
    return !!this.getSession() || accountAuth.hasActiveSession();
  }

  setSession(data: TelegramUserData): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY_TG, JSON.stringify(data));
    const tgUsername = data.username ? (data.username.startsWith('@') ? data.username : `@${data.username}`) : (data.first_name || 'Cadet');
    const cleanTg = tgUsername.replace(/^@+/, '').toLowerCase();

    // Check if an existing cadet account already has this Telegram handle linked
    const users = accountAuth.getRegisteredUsers();
    let existingAccount: any;
    for (const u of Object.values(users)) {
      if (
        (u.telegram_username && u.telegram_username.toLowerCase() === cleanTg) ||
        (data.id && (u.id === data.id || u.id === `tg_${data.id}`))
      ) {
        existingAccount = u;
        break;
      }
    }

    const canonicalId = existingAccount ? existingAccount.id : data.id;
    const finalCallsign = existingAccount ? existingAccount.username : tgUsername;
    const finalRole = existingAccount ? existingAccount.role : (data.role || 'student');
    const googleEmail = existingAccount?.google_email;

    SupabaseStore.updateProfile({
      id: canonicalId,
      username: finalCallsign,
      avatar_url: data.photo_url || '',
      role: finalRole,
      auth_provider: 'telegram',
      telegram_username: cleanTg,
      google_email: googleEmail,
      academy_id: undefined,
      academy_name: 'Solo Developer',
    });

    accountAuth.setSession({
      id: canonicalId,
      username: finalCallsign,
      role: finalRole,
      auth_provider: 'telegram',
      telegram_username: cleanTg,
      google_email: googleEmail,
      avatar_url: data.photo_url,
      created_at: existingAccount?.created_at || new Date().toISOString(),
    });
  }

  clearSession(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY_TG);
    accountAuth.clearSession();
  }

  signOut(): void {
    this.clearSession();
  }

  detectTelegramWebApp(): TelegramUserData | null {
    if (typeof window === 'undefined') return null;
    const win = window as any;
    try {
      if (win.Telegram?.WebApp) {
        win.Telegram.WebApp.ready?.();
        win.Telegram.WebApp.expand?.();
      }
    } catch (e) {
      // ignore
    }

    if (win.Telegram?.WebApp?.initDataUnsafe?.user) {
      const tgUser = win.Telegram.WebApp.initDataUnsafe.user;
      const handle = tgUser.username ? `@${tgUser.username.replace('@', '')}` : (tgUser.first_name || 'Cadet');
      const session: TelegramUserData = {
        id: String(tgUser.id),
        first_name: tgUser.first_name,
        last_name: tgUser.last_name,
        username: handle,
        language_code: tgUser.language_code,
        photo_url: tgUser.photo_url,
        role: 'student',
        is_webapp: true,
      };
      this.setSession(session);
      return session;
    }
    return this.getSession();
  }

  async createSessionChallenge(): Promise<{ success: boolean; sessionToken?: string; botUsername?: string; deepLink?: string; message?: string }> {
    try {
      const resp = await fetch('/api/v1/auth/telegram/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (resp.ok) {
        return await resp.json();
      }
    } catch {
      // Backend route unreachable
    }

    const fallbackToken = 'sess_' + Math.random().toString(36).substring(2, 10);
    const bot = getTelegramBotUsername();
    return {
      success: true,
      sessionToken: fallbackToken,
      botUsername: bot,
      deepLink: `https://t.me/${bot}?start=auth_${fallbackToken}`,
      message: `Open @${bot} in Telegram to authenticate.`,
    };
  }

  async requestCode(handle: string): Promise<{ success: boolean; sessionToken?: string; botUsername?: string; deepLink?: string; message?: string }> {
    const raw = handle.replace(/^@+/, '').trim().toLowerCase();
    if (!raw || raw.length < 3) {
      return { success: false, message: 'Please enter a valid Telegram username (at least 3 characters).' };
    }

    try {
      const resp = await fetch('/api/v1/auth/telegram/request-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: raw }),
      });
      if (resp.ok) {
        return await resp.json();
      }
    } catch {
      // Backend route unreachable
    }

    // Client-side fallback pairing session token (never the PIN)
    const fallbackToken = Math.random().toString(36).substring(2, 10);
    const bot = getTelegramBotUsername();
    return {
      success: true,
      sessionToken: fallbackToken,
      botUsername: bot,
      deepLink: `https://t.me/${bot}?start=auth_${fallbackToken}`,
      message: `Verification challenge created. Open @${bot} in Telegram to verify.`,
    };
  }

  async checkStatus(sessionToken: string, username?: string): Promise<{ verified: boolean; session?: TelegramUserData; mismatch?: boolean; message?: string }> {
    const raw = (username || '').replace(/^@+/, '').trim().toLowerCase();
    const token = sessionToken.trim();
    try {
      const query = raw
        ? `/api/v1/auth/telegram/check-status?sessionToken=${encodeURIComponent(token)}&username=${encodeURIComponent(raw)}`
        : `/api/v1/auth/telegram/check-status?sessionToken=${encodeURIComponent(token)}`;
      const resp = await fetch(query);
      if (resp.ok) {
        const data = await resp.json();
        if (data.verified && data.user) {
          const verifiedHandle = data.user.username.startsWith('@') ? data.user.username : `@${data.user.username}`;
          const session: TelegramUserData = {
            id: data.user.id || `tg_${data.user.username}`,
            username: verifiedHandle,
            first_name: data.user.first_name || data.user.username,
            role: 'student',
            is_webapp: false,
            auth_date: Math.floor(Date.now() / 1000),
          };
          this.setSession(session);
          return { verified: true, session };
        }
        if (data.mismatch) {
          return { verified: false, mismatch: true, message: data.message };
        }
      }
    } catch {
      // network/dev fallback
    }
    return { verified: false };
  }

  authenticateWithTelegramWidget(userData: {
    id: string | number;
    first_name: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
    auth_date?: number;
    hash?: string;
  }): TelegramUserData {
    const cleanHandle = userData.username
      ? (userData.username.startsWith('@') ? userData.username : `@${userData.username}`)
      : `@${userData.first_name || 'Cadet'}`;

    const session: TelegramUserData = {
      id: String(userData.id),
      first_name: userData.first_name,
      last_name: userData.last_name,
      username: cleanHandle,
      photo_url: userData.photo_url,
      role: 'student',
      auth_date: userData.auth_date || Math.floor(Date.now() / 1000),
      hash: userData.hash,
      is_webapp: false,
    };
    this.setSession(session);
    return session;
  }

  async verifyCode(sessionToken: string, code: string, username: string): Promise<{ success: boolean; session?: TelegramUserData; message?: string }> {
    const raw = username.replace(/^@+/, '').trim().toLowerCase();
    const cleanCode = code.trim();

    if (!cleanCode) {
      return { success: false, message: 'Please enter the 6-digit confirmation code.' };
    }

    try {
      const resp = await fetch('/api/v1/auth/telegram/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionToken, code: cleanCode, username: raw }),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.success && data.user) {
          const session: TelegramUserData = {
            id: data.user.id || `tg_${raw}`,
            username: data.user.username || `@${raw}`,
            first_name: data.user.first_name || raw,
            role: 'student',
            is_webapp: false,
            auth_date: Math.floor(Date.now() / 1000),
          };
          this.setSession(session);
          return { success: true, session };
        } else {
          return { success: false, message: data.message || 'Incorrect confirmation code.' };
        }
      }
    } catch {
      // Backend route unreachable
    }

    return { success: false, message: 'Invalid or expired PIN. Please enter the code received in Telegram.' };
  }

  signInWithTelegram(handle: string): TelegramUserData {
    const raw = handle.replace('@', '').trim();
    const clean = raw || 'Cadet';
    const session: TelegramUserData = {
      id: `tg_${clean.toLowerCase()}`,
      first_name: clean,
      username: `@${clean}`,
      role: 'student',
      is_webapp: false,
      auth_date: Math.floor(Date.now() / 1000),
    };
    this.setSession(session);
    return session;
  }

  linkAccount(handle: string, role: UserRole = 'student'): { success: boolean; message: string; session: TelegramUserData } {
    const session = this.signInWithTelegram(handle);
    session.role = role;
    this.setSession(session);
    return {
      success: true,
      message: `Successfully linked Telegram session @${session.username}`,
      session,
    };
  }

  verifyInstructorPasscode(code: string): { success: boolean; message: string } {
    if (code.trim().toUpperCase() === 'INSTRUCTOR2026' || code.trim() === 'SOVEREIGN_INSTRUCTOR') {
      SupabaseStore.updateProfile({ role: 'instructor' });
      return { success: true, message: 'Instructor credentials verified! Access granted.' };
    }
    return { success: false, message: 'Invalid instructor passcode. Please contact your institution admin.' };
  }

  resetToStudent(): Profile {
    return SupabaseStore.updateProfile({ role: 'student' });
  }
}

export const telegramAuth = new TelegramAuthService();
