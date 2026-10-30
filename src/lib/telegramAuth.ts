import { Profile, UserRole } from '../types';
import { SupabaseStore } from './supabase';

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
  return (import.meta.env.VITE_TELEGRAM_BOT_USERNAME as string) || 'TerminaltorBot';
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

  setSession(data: TelegramUserData): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY_TG, JSON.stringify(data));
    SupabaseStore.updateProfile({
      id: data.id,
      username: data.username || data.first_name || 'CyberExplorer',
      avatar_url: data.photo_url || '',
      role: data.role || 'student',
    });
  }

  clearSession(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY_TG);
  }

  signOut(): void {
    this.clearSession();
  }

  detectTelegramWebApp(): TelegramUserData | null {
    if (typeof window === 'undefined') return null;
    const win = window as any;
    if (win.Telegram?.WebApp?.initDataUnsafe?.user) {
      const tgUser = win.Telegram.WebApp.initDataUnsafe.user;
      const session: TelegramUserData = {
        id: String(tgUser.id),
        first_name: tgUser.first_name,
        last_name: tgUser.last_name,
        username: tgUser.username || tgUser.first_name || 'TelegramUser',
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

  signInWithTelegram(handle: string): TelegramUserData {
    const clean = handle.replace('@', '').trim();
    const session: TelegramUserData = {
      id: `tg_${Date.now()}`,
      first_name: clean,
      username: clean,
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
