import React, { useState, useEffect } from 'react';
import {
  Send,
  AlertCircle,
  LogOut,
  GraduationCap,
  Shield,
  KeyRound,
  ExternalLink,
  Sparkles,
  Building2,
  X,
  Coins,
  Copy,
  Check,
  Mail,
  User,
  Link2,
  CheckCircle2,
  Pencil,
  Loader2,
  Database,
} from 'lucide-react';
import { Profile, UserRole } from '../types';
import { telegramAuth, TelegramUserData, getTelegramBotUsername } from '../lib/telegramAuth';
import { accountAuth, AccountSession } from '../lib/accountAuth';
import { SupabaseStore, isSupabaseConfigured } from '../lib/supabase';
import { signInWithGooglePopup, getUnauthorizedDomainInfo } from '../lib/firebaseGoogleAuth';

interface TelegramAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile;
  onProfileUpdated: (profile: Profile) => void;
  onNavigateToAcademySignup?: () => void;
  onOpenDatabaseModal?: () => void;
}

export const TelegramAuthModal: React.FC<TelegramAuthModalProps> = ({
  isOpen,
  onClose,
  profile,
  onProfileUpdated,
  onNavigateToAcademySignup,
  onOpenDatabaseModal,
}) => {
  const [activeTab, setActiveTab] = useState<'account' | 'instructor'>('account');
  const [instructorCodeInput, setInstructorCodeInput] = useState('');
  const [codeStatus, setCodeStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [session, setSession] = useState<TelegramUserData | null>(() => telegramAuth.getSession());
  const [accountSession, setAccountSession] = useState<AccountSession | null>(() => accountAuth.getSession());
  const [copiedId, setCopiedId] = useState(false);

  // Callsign edit state
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsernameInput, setNewUsernameInput] = useState('');
  const [usernameUpdateMsg, setUsernameUpdateMsg] = useState<{ success: boolean; text: string } | null>(null);

  // Account linking state
  const [isLinkingGoogle, setIsLinkingGoogle] = useState(false);
  const [isLinkingTelegram, setIsLinkingTelegram] = useState(false);
  const [linkInput, setLinkInput] = useState('');
  const [linkFeedback, setLinkFeedback] = useState<string | null>(null);

  // Telegram verification state for linking
  const [tgSessionToken, setTgSessionToken] = useState<string | null>(null);
  const [tgDeepLink, setTgDeepLink] = useState<string | null>(null);
  const [isVerifyingTg, setIsVerifyingTg] = useState(false);
  const [tgPinInput, setTgPinInput] = useState('');
  const [tgWaitingForBot, setTgWaitingForBot] = useState(false);

  const botUsername = getTelegramBotUsername();

  useEffect(() => {
    if (isOpen) {
      setSession(telegramAuth.getSession());
      setAccountSession(accountAuth.getSession());
      setCodeStatus(null);
      setLinkFeedback(null);
      setIsEditingUsername(false);
      setNewUsernameInput(profile.username?.replace(/^@+/, '') || '');
      setUsernameUpdateMsg(null);
      setIsLinkingGoogle(false);
      setIsLinkingTelegram(false);
      setTgWaitingForBot(false);
      setTgSessionToken(null);
      setTgDeepLink(null);
      setTgPinInput('');
    }
  }, [isOpen, profile.username]);

  // Real-time polling while user interacts with Telegram bot
  useEffect(() => {
    if (!tgWaitingForBot || !tgSessionToken) return;

    const interval = setInterval(async () => {
      try {
        const res = await telegramAuth.checkStatus(tgSessionToken);
        if (res.verified && res.session) {
          const verifiedHandle = res.session.username.replace(/^@+/, '');
          const linkResult = await accountAuth.linkTelegramToCurrentAccount(verifiedHandle, res.session.id);
          if (!linkResult.success) {
            setLinkFeedback(linkResult.message || `Telegram @${verifiedHandle} is already linked to another cadet account.`);
            setTgWaitingForBot(false);
            return;
          }
          const updated = SupabaseStore.updateProfile({
            telegram_username: verifiedHandle,
          });
          onProfileUpdated(updated);
          setAccountSession(accountAuth.getSession());
          setTgWaitingForBot(false);
          setIsLinkingTelegram(false);
          setLinkFeedback(`Telegram verified & linked: @${verifiedHandle}!`);
        }
      } catch {
        // continue polling
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [tgWaitingForBot, tgSessionToken, onProfileUpdated]);

  if (!isOpen) return null;

  const handleSignOut = () => {
    telegramAuth.signOut();
    accountAuth.signOut();
    setSession(null);
    setAccountSession(null);

    const reset = SupabaseStore.updateProfile({
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
    onProfileUpdated(reset);
    onClose();
  };

  const handleLinkGoogle = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = linkInput.trim().toLowerCase();
    if (!clean || !clean.includes('@')) {
      setLinkFeedback('Please enter a valid Google email.');
      return;
    }

    const linkResult = await accountAuth.linkGoogleToCurrentAccount(clean);
    if (!linkResult.success) {
      setLinkFeedback(linkResult.message || `Google account ${clean} is already linked to another cadet.`);
      return;
    }

    const updated = SupabaseStore.updateProfile({ google_email: clean });
    onProfileUpdated(updated);
    setAccountSession(accountAuth.getSession());
    setIsLinkingGoogle(false);
    setLinkInput('');
    setLinkFeedback('Google account linked successfully!');
  };

  const handleVerifyGooglePopup = async () => {
    setLinkFeedback(null);
    try {
      const gAuth = await signInWithGooglePopup();
      const linkResult = await accountAuth.linkGoogleToCurrentAccount(gAuth.email);
      if (!linkResult.success) {
        setLinkFeedback(linkResult.message || `Google account ${gAuth.email} is already linked to another cadet.`);
        return;
      }
      const updated = SupabaseStore.updateProfile({
        google_email: gAuth.email,
        avatar_url: gAuth.photoUrl || undefined,
      });
      onProfileUpdated(updated);
      setAccountSession(accountAuth.getSession());
      setIsLinkingGoogle(false);
      setLinkInput('');
    } catch (err: any) {
      if (err.code === 'auth/unauthorized-domain' || err.message?.includes('auth/unauthorized-domain')) {
        const info = getUnauthorizedDomainInfo();
        setLinkFeedback(
          `Firebase: Domain "${info.domain}" is not authorized. Add it in Firebase Console > Authentication > Settings > Authorized domains, or enter your email into the box below to link directly.`
        );
      } else {
        setLinkFeedback(err.message || 'Google account verification failed.');
      }
    }
  };

  const handleStartTelegramVerification = async () => {
    setIsVerifyingTg(true);
    setLinkFeedback(null);
    setTgPinInput('');

    // Check if user is already inside Telegram WebApp
    const win = typeof window !== 'undefined' ? (window as any) : null;
    const tgWebUser = win?.Telegram?.WebApp?.initDataUnsafe?.user;
    if (tgWebUser && (tgWebUser.username || tgWebUser.first_name)) {
      const handle = (tgWebUser.username || tgWebUser.first_name || 'Cadet').replace(/^@+/, '');
      const linkResult = await accountAuth.linkTelegramToCurrentAccount(handle, String(tgWebUser.id));
      if (!linkResult.success) {
        setLinkFeedback(linkResult.message || `Telegram handle @${handle} is already linked to another cadet.`);
        setIsVerifyingTg(false);
        return;
      }
      const updated = SupabaseStore.updateProfile({
        telegram_username: handle,
        avatar_url: tgWebUser.photo_url || undefined,
      });
      onProfileUpdated(updated);
      setAccountSession(accountAuth.getSession());
      setIsLinkingTelegram(false);
      setIsVerifyingTg(false);
      setLinkFeedback(`Telegram account verified via Mini App: @${handle}!`);
      return;
    }

    try {
      const res = await telegramAuth.createSessionChallenge();
      if (res.success && res.sessionToken) {
        setTgSessionToken(res.sessionToken);
        const link = res.deepLink || `https://t.me/${botUsername}?start=auth_${res.sessionToken}`;
        setTgDeepLink(link);
        setTgWaitingForBot(true);
        // Open the bot deep link in a new tab for seamless verification
        window.open(link, '_blank', 'noopener,noreferrer');
      } else {
        setLinkFeedback(res.message || 'Failed creating Telegram verification challenge.');
      }
    } catch (err: any) {
      setLinkFeedback(err.message || 'Error connecting to Telegram verification service.');
    } finally {
      setIsVerifyingTg(false);
    }
  };

  const handleVerifyTgPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tgPinInput.trim()) {
      setLinkFeedback('Please enter the 6-digit confirmation PIN from @' + botUsername);
      return;
    }
    if (!tgSessionToken) {
      setLinkFeedback('Verification session expired. Please tap "1-Tap: Verify with @' + botUsername + '" first.');
      return;
    }

    setIsVerifyingTg(true);
    setLinkFeedback(null);

    try {
      const res = await telegramAuth.verifyCode(tgSessionToken, tgPinInput.trim(), '');
      if (res.success && res.session) {
        const verifiedHandle = res.session.username.replace(/^@+/, '');
        const linkResult = await accountAuth.linkTelegramToCurrentAccount(verifiedHandle, res.session.id);
        if (!linkResult.success) {
          setLinkFeedback(linkResult.message || `Telegram handle @${verifiedHandle} is already linked to another cadet.`);
          return;
        }
        const updated = SupabaseStore.updateProfile({
          telegram_username: verifiedHandle,
        });
        onProfileUpdated(updated);
        setAccountSession(accountAuth.getSession());
        setTgWaitingForBot(false);
        setIsLinkingTelegram(false);
        setLinkFeedback(`Telegram account verified & linked: @${verifiedHandle}!`);
      } else {
        setLinkFeedback(res.message || 'Incorrect confirmation PIN. Check your Telegram chat with the bot.');
      }
    } catch (err: any) {
      setLinkFeedback(err.message || 'Failed verifying PIN.');
    } finally {
      setIsVerifyingTg(false);
    }
  };

  const handleUpdateCallsign = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameUpdateMsg(null);
    const clean = newUsernameInput.trim().replace(/^@+/, '');
    if (!clean || clean.length < 3) {
      setUsernameUpdateMsg({ success: false, text: 'Callsign must be at least 3 characters long.' });
      return;
    }

    const result = await accountAuth.updateUsername(clean);
    if (result.success) {
      const updated = SupabaseStore.getProfile();
      onProfileUpdated(updated);
      setAccountSession(accountAuth.getSession());
      setIsEditingUsername(false);
      setUsernameUpdateMsg({ success: true, text: result.message });
    } else {
      setUsernameUpdateMsg({ success: false, text: result.message });
    }
  };

  const handleVerifyInstructorCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!instructorCodeInput.trim()) return;
    const result = telegramAuth.verifyInstructorPasscode(instructorCodeInput);
    setCodeStatus(result);
    if (result.success) {
      onProfileUpdated({
        ...profile,
        role: 'instructor',
      });
    }
  };

  const handleSwitchToStudent = () => {
    const updated = telegramAuth.resetToStudent();
    onProfileUpdated(updated);
    setCodeStatus({ success: true, message: 'Switched back to Student view.' });
  };

  const copyUserId = () => {
    if (typeof navigator !== 'undefined' && profile.id) {
      navigator.clipboard.writeText(profile.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const isInstructor = profile.role === 'instructor';
  const effectiveProvider = profile.auth_provider || accountSession?.auth_provider || (session ? 'telegram' : 'credentials');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain flex min-h-full items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg my-auto max-h-[92dvh] flex flex-col bg-[#0b1120] border-2 border-slate-700/80 rounded-3xl shadow-[0_0_50px_rgba(15,23,42,0.8)] overflow-hidden font-sans">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-900 to-[#0b1120] border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Cadet Player Account</span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                  {effectiveProvider}
                </span>
              </h2>
              <p className="text-xs text-slate-400">Single Sign-On across all games, leaderboards &amp; alliances</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/80 p-1.5 gap-2 px-6 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('account')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'account'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Account Profile</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('instructor')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'instructor'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 text-sky-400" />
            <span>Instructor Passcode</span>
            {isInstructor && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto overscroll-contain space-y-5 flex-1 text-slate-200">
          {activeTab === 'account' ? (
            <div className="space-y-4">
              {/* User Profile Card */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                    Active Identity
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Verified Cadet
                  </span>
                </div>

                <div className="flex items-center gap-3.5 pt-1">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-sky-600 flex items-center justify-center text-slate-950 text-lg font-black shadow-md shrink-0">
                    {profile.username?.replace('@', '').charAt(0).toUpperCase() || 'C'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-base truncate">
                        {profile.username}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingUsername(!isEditingUsername);
                          setNewUsernameInput(profile.username?.replace(/^@+/, '') || '');
                          setUsernameUpdateMsg(null);
                        }}
                        className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="Change player callsign / username"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          isInstructor
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {isInstructor ? 'Instructor' : 'Student'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-0.5">
                      <span className="truncate">ID: {profile.id}</span>
                      <button
                        type="button"
                        onClick={copyUserId}
                        className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                        title="Copy user ID"
                      >
                        {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Inline Callsign Editor */}
                {isEditingUsername && (
                  <form onSubmit={handleUpdateCallsign} className="p-3 bg-slate-950 border border-emerald-500/40 rounded-xl space-y-2 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-emerald-300">
                        Change Callsign / In-Game Username:
                      </label>
                      <span className="text-[10px] text-slate-400">Unique ID is preserved</span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newUsernameInput}
                        onChange={(e) => setNewUsernameInput(e.target.value)}
                        placeholder="New Callsign"
                        className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                        required
                      />
                      <button
                        type="submit"
                        className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg cursor-pointer transition-colors"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingUsername(false)}
                        className="px-2.5 py-1.5 text-slate-400 hover:text-white text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {usernameUpdateMsg && (
                  <div
                    className={`text-xs p-2.5 rounded-xl flex items-center gap-2 ${
                      usernameUpdateMsg.success
                        ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
                        : 'bg-rose-950/60 border border-rose-800 text-rose-300'
                    }`}
                  >
                    {usernameUpdateMsg.success ? (
                      <Check className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span>{usernameUpdateMsg.text}</span>
                  </div>
                )}

                {/* Tokens and XP stats */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-center">
                  <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Game Tokens</span>
                    <span className="font-mono font-bold text-amber-400 text-xs flex items-center justify-center gap-1 mt-0.5">
                      <Coins className="w-3 h-3" />
                      {profile.credits ?? 150} 🪙
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Total XP</span>
                    <span className="font-mono font-bold text-sky-400 text-xs block mt-0.5">
                      {profile.xp_points || 0} XP
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Day Streak</span>
                    <span className="font-mono font-bold text-amber-400 text-xs block mt-0.5">
                      🔥 {profile.streak_days || 1}d
                    </span>
                  </div>
                </div>
              </div>

              {/* Linked Accounts Section */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Linked Accounts</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">Multi-Channel Access</span>
                </div>

                {/* Google Account Row */}
                <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-white text-slate-900 font-bold text-xs flex items-center justify-center shrink-0">
                      G
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">Google Account</div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {profile.google_email || 'Not connected'}
                      </div>
                    </div>
                  </div>

                  {profile.google_email ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full shrink-0">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Linked</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setIsLinkingGoogle(true);
                        setIsLinkingTelegram(false);
                        setLinkInput('');
                      }}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white font-bold text-[11px] rounded-lg transition-colors cursor-pointer shrink-0"
                    >
                      Connect
                    </button>
                  )}
                </div>

                {/* Linking Google Form */}
                {isLinkingGoogle && (
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5">
                    <button
                      type="button"
                      onClick={handleVerifyGooglePopup}
                      className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow transition-all"
                    >
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                      </svg>
                      <span>Verify &amp; Link with Google Services</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <div className="h-px bg-slate-800 flex-1" />
                      <span className="text-[10px] text-slate-500 font-mono">OR ENTER ADDRESS</span>
                      <div className="h-px bg-slate-800 flex-1" />
                    </div>

                    <form onSubmit={handleLinkGoogle} className="flex gap-2">
                      <input
                        type="email"
                        value={linkInput}
                        onChange={(e) => setLinkInput(e.target.value)}
                        placeholder="yourname@gmail.com"
                        className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                        required
                      />
                      <button
                        type="submit"
                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg cursor-pointer"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsLinkingGoogle(false)}
                        className="px-2 py-1.5 text-slate-400 hover:text-white text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                    </form>
                  </div>
                )}

                {/* Telegram Account Row */}
                <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-sky-500 text-slate-950 font-bold text-xs flex items-center justify-center shrink-0">
                      <Send className="w-3.5 h-3.5 fill-current -rotate-12" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">Telegram Account</div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {profile.telegram_username ? `@${profile.telegram_username}` : 'Not connected'}
                      </div>
                    </div>
                  </div>

                  {profile.telegram_username ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-full shrink-0">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Linked</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setIsLinkingTelegram(true);
                        setIsLinkingGoogle(false);
                        setLinkInput('');
                      }}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white font-bold text-[11px] rounded-lg transition-colors cursor-pointer shrink-0"
                    >
                      Connect
                    </button>
                  )}
                </div>

                {/* Real Verified Telegram Linking Card */}
                {isLinkingTelegram && (
                  <div className="p-3.5 bg-slate-950 border border-sky-500/40 rounded-xl space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-sky-400">
                        <Shield className="w-3.5 h-3.5" />
                        <span>Cryptographic Telegram Verification</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">Anti-Spoofing</span>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      To prevent claiming another cadet's handle, ownership must be confirmed with @{botUsername}.
                    </p>

                    {/* WebApp Fast Path */}
                    {typeof window !== 'undefined' && (window as any)?.Telegram?.WebApp?.initDataUnsafe?.user && (
                      <button
                        type="button"
                        onClick={handleStartTelegramVerification}
                        className="w-full py-2 px-3 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
                      >
                        <Send className="w-3.5 h-3.5 -rotate-12 fill-current" />
                        <span>
                          Link as @{(window as any).Telegram.WebApp.initDataUnsafe.user.username || (window as any).Telegram.WebApp.initDataUnsafe.user.first_name} (Mini App Verified)
                        </span>
                      </button>
                    )}

                    {/* Browser Verification via Bot Deep Link & Poller */}
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={handleStartTelegramVerification}
                        disabled={isVerifyingTg}
                        className="w-full py-2.5 px-3 bg-sky-500 hover:bg-sky-400 active:scale-[0.99] text-slate-950 font-black text-xs rounded-lg shadow-md shadow-sky-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isVerifyingTg ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Creating Secure Challenge...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5 -rotate-12 fill-current" />
                            <span>1-Tap: Verify with @{botUsername}</span>
                            <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
                          </>
                        )}
                      </button>

                      {tgWaitingForBot && (
                        <div className="p-2.5 bg-slate-900 border border-sky-500/30 rounded-lg space-y-2">
                          <div className="flex items-center gap-2 text-xs text-sky-300">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                            </span>
                            <span className="font-semibold text-[11px]">Waiting for Telegram Handshake...</span>
                          </div>
                          <p className="text-[10px] text-slate-400 leading-relaxed">
                            Tap <strong>START</strong> in the opened @{botUsername} chat. This window will automatically link your verified handle!
                          </p>
                          {tgDeepLink && (
                            <a
                              href={tgDeepLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] font-mono text-sky-400 hover:text-sky-300 underline block"
                            >
                              Click here if Telegram didn't open automatically
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    {/* PIN Entry Fallback */}
                    <div className="pt-1">
                      <div className="flex items-center gap-2 my-1">
                        <div className="h-px bg-slate-800 flex-1" />
                        <span className="text-[10px] font-mono uppercase text-slate-500">Or enter 6-digit bot pin</span>
                        <div className="h-px bg-slate-800 flex-1" />
                      </div>

                      <form onSubmit={handleVerifyTgPin} className="flex gap-2 mt-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            maxLength={6}
                            value={tgPinInput}
                            onChange={(e) => setTgPinInput(e.target.value.replace(/[^0-9]/g, ''))}
                            placeholder="6-digit PIN"
                            className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 font-mono tracking-widest text-center"
                          />
                          <KeyRound className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
                        </div>
                        <button
                          type="submit"
                          disabled={isVerifyingTg || tgPinInput.length < 6}
                          className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-slate-950 font-bold text-xs rounded-lg cursor-pointer transition-all"
                        >
                          Confirm PIN
                        </button>
                      </form>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsLinkingTelegram(false);
                          setTgWaitingForBot(false);
                        }}
                        className="text-xs text-slate-400 hover:text-white cursor-pointer px-2 py-1"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {linkFeedback && (
                  <div className="text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 p-2 rounded-lg">
                    {linkFeedback}
                  </div>
                )}
              </div>

              {/* Supabase Cloud Database & Diagnostics Section */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Cloud Database &amp; Supabase</span>
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                      isSupabaseConfigured()
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSupabaseConfigured() ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
                      }`}
                    />
                    {isSupabaseConfigured() ? 'Cloud Synced' : 'Offline / Local'}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {isSupabaseConfigured()
                    ? 'Connected to your remote Supabase project. Player profile and quest completion sync automatically in real-time.'
                    : 'Running in offline localStorage mode. Connect Supabase keys or run schema migrations to sync to PostgreSQL.'}
                </p>

                {onOpenDatabaseModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenDatabaseModal();
                    }}
                    className="w-full py-2.5 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-[0.99] border border-emerald-500/30 hover:border-emerald-500/60 text-emerald-300 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <Database className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Open Supabase Connection Diagnostics &amp; SQL</span>
                  </button>
                )}
              </div>

              {/* Account Security & Sign Out */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">
                    Account Security &amp; Switch
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Session Active
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  You are signed in as <strong>{profile.username}</strong>. Signing out will return you to the security gate where you can switch callsigns or log in via another method.
                </p>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full py-2.5 px-4 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:text-rose-200 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out of Account</span>
                </button>
              </div>

              {/* Telegram Bot Direct Open Button */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                <a
                  href={`https://t.me/${getTelegramBotUsername()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 font-semibold"
                >
                  <Send className="w-3.5 h-3.5 -rotate-12" />
                  <span>Open @{getTelegramBotUsername()} Bot</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Disconnect</span>
                </button>
              </div>
            </div>
          ) : (
            /* Instructor Registration Tab */
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <GraduationCap className="w-4 h-4" />
                  <span>How to Register as an Instructor</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Students join and learn for free. Instructor status is reserved for verified educators, academy staff, and institutional coordinators to create cohorts, grade assignments, and inspect hint analytics.
                </p>
              </div>

              {isInstructor ? (
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <Shield className="w-4 h-4" />
                      <span>Instructor Privileges Active</span>
                    </span>
                    <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                      Verified
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    You have unlocked classroom management, student progress inspection, and grading permissions.
                  </p>
                  <button
                    type="button"
                    onClick={handleSwitchToStudent}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 transition-colors cursor-pointer"
                  >
                    Switch View to Student
                  </button>
                </div>
              ) : (
                <form onSubmit={handleVerifyInstructorCode} className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Enter Institutional Instructor Passcode:</span>
                    </label>
                    <input
                      type="text"
                      value={instructorCodeInput}
                      onChange={(e) => setInstructorCodeInput(e.target.value)}
                      placeholder="e.g. INSTRUCTOR2026"
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl text-sm font-mono text-white placeholder-slate-600 focus:outline-none transition-colors"
                    />
                    <p className="text-[11px] text-slate-500">
                      Educator passcodes are issued by your institution or academy administrator. (Demo: <code className="text-emerald-400 font-mono">INSTRUCTOR2026</code>)
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Shield className="w-4 h-4" />
                    <span>Verify Instructor Credentials</span>
                  </button>
                </form>
              )}

              {codeStatus && (
                <div
                  className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
                    codeStatus.success
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                  }`}
                >
                  {codeStatus.success ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span>{codeStatus.message}</span>
                </div>
              )}

              {onNavigateToAcademySignup && (
                <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-5 h-5 text-sky-400 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-white">Need an Alliance Seat?</div>
                      <div className="text-[11px] text-slate-400">Register your school or coding cohort</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onNavigateToAcademySignup}
                    className="px-3 py-1.5 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 font-bold text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <span>Register</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TelegramAuthModal;
