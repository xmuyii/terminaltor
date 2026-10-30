import React, { useState, useEffect } from 'react';
import {
  Send,
  CheckCircle2,
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
} from 'lucide-react';
import { Profile, UserRole } from '../types';
import { telegramAuth, TelegramUserData, getTelegramBotUsername } from '../lib/telegramAuth';

interface TelegramAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile;
  onProfileUpdated: (profile: Profile) => void;
  onNavigateToAcademySignup?: () => void;
}

export const TelegramAuthModal: React.FC<TelegramAuthModalProps> = ({
  isOpen,
  onClose,
  profile,
  onProfileUpdated,
  onNavigateToAcademySignup,
}) => {
  const [activeTab, setActiveTab] = useState<'account' | 'instructor'>('account');
  const [handleInput, setHandleInput] = useState('');
  const [instructorCodeInput, setInstructorCodeInput] = useState('');
  const [codeStatus, setCodeStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [session, setSession] = useState<TelegramUserData | null>(() => telegramAuth.getSession());
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const currentSession = telegramAuth.getSession();
      setSession(currentSession);
      if (currentSession?.username) {
        setHandleInput(currentSession.username.replace('@', ''));
      }
      setCodeStatus(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!handleInput.trim()) return;
    const newSession = telegramAuth.signInWithTelegram(handleInput.trim());
    setSession(newSession);
    onProfileUpdated({
      ...profile,
      id: newSession.id,
      username: newSession.username,
    });
  };

  const handleSignOut = () => {
    telegramAuth.signOut();
    setSession(null);
    setHandleInput('');
    onProfileUpdated({
      ...profile,
      id: 'student_adebayo',
      username: 'QuantumCadet',
      role: 'student',
    });
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
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(profile.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const isInstructor = profile.role === 'instructor' || profile.role === 'teacher';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0b1329] border border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-sky-950/60 via-[#0b1329] to-indigo-950/40 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Send className="w-5 h-5 -rotate-12 translate-x-0.5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Telegram Player Account</span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 font-semibold">
                  Supabase Synced
                </span>
              </h2>
              <p className="text-xs text-slate-400">Single Sign-On across all games, leaderboards &amp; alliances</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-900/50 p-1.5 gap-2 px-6">
          <button
            type="button"
            onClick={() => setActiveTab('account')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'account'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Telegram Login</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('instructor')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'instructor'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
            <span>Instructor Registration</span>
            {isInstructor && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
          {activeTab === 'account' ? (
            <div className="space-y-5">
              {/* Connected Telegram User Card */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                    Active Session Status
                  </span>
                  {session?.is_webapp ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      Telegram WebApp
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-full">
                      Browser / Web Session
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3.5 pt-1">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white text-lg font-black shadow-md shrink-0">
                    {profile.username?.replace('@', '').charAt(0).toUpperCase() || 'T'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-base truncate">
                        {profile.username?.startsWith('@') ? profile.username : `@${profile.username}`}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          isInstructor
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {isInstructor ? 'Instructor' : 'Student'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-0.5">
                      <span>ID: {profile.id}</span>
                      <button
                        type="button"
                        onClick={copyUserId}
                        className="text-slate-400 hover:text-white transition-colors"
                        title="Copy user ID"
                      >
                        {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Balance & Game tokens row */}
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

              {/* Login / Link Telegram Handle Form */}
              <form onSubmit={handleSignIn} className="space-y-3">
                <label className="text-xs font-semibold text-slate-300 block">
                  Connect or Switch Telegram Account
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2.5 text-slate-500 font-mono text-sm">@</span>
                    <input
                      type="text"
                      value={handleInput}
                      onChange={(e) => setHandleInput(e.target.value)}
                      placeholder="telegram_username or ID"
                      className="w-full pl-8 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5 shrink-0"
                  >
                    <span>Save &amp; Sync</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Matches your Telegram account with the Supabase <code className="text-sky-300">players</code> table so your points, Code Forging stats, and Chess scores stay unified.
                </p>
              </form>

              {/* Telegram Bot Direct Open Button */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                <a
                  href={`https://t.me/${getTelegramBotUsername()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 font-semibold"
                >
                  <Send className="w-3.5 h-3.5 -rotate-12" />
                  <span>Launch @{getTelegramBotUsername()} WebApp</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                {session && (
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-rose-400 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Disconnect</span>
                  </button>
                )}
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

              {/* Method 1: Enter School Passcode */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-sky-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Option 1: School Instructor Passcode
                  </h4>
                </div>
                <p className="text-xs text-slate-400">
                  If your school or university is an Academy Alliance partner, enter the faculty verification passcode provided by your administrator.
                </p>

                <form onSubmit={handleVerifyInstructorCode} className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={instructorCodeInput}
                      onChange={(e) => setInstructorCodeInput(e.target.value)}
                      placeholder="e.g. INSTRUCTOR_2026 or LAGOS_ACADEMY_2026"
                      className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono uppercase"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md shrink-0"
                    >
                      Verify Passcode
                    </button>
                  </div>

                  {codeStatus && (
                    <div
                      className={`p-2.5 rounded-xl text-xs flex items-start gap-2 ${
                        codeStatus.success
                          ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {codeStatus.success ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                      )}
                      <span>{codeStatus.message}</span>
                    </div>
                  )}

                  <div className="text-[11px] text-slate-500 font-mono">
                    Demo Passcodes: <code className="text-slate-400">INSTRUCTOR_2026</code> · <code className="text-slate-400">TEACHER_PRO</code> · <code className="text-slate-400">LAGOS_ACADEMY_2026</code>
                  </div>
                </form>
              </div>

              {/* Method 2: Subscribe as an Academy Alliance */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Option 2: Register a New Academy Alliance
                  </h4>
                </div>
                <p className="text-xs text-slate-400">
                  School administrators who subscribe for an Academy Alliance (₦25,000/month flat for all students) automatically receive the Instructor &amp; Academy Owner role.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToAcademySignup?.();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                  <span>Start Academy Alliance Signup (₦25,000/mo)</span>
                </button>
              </div>

              {/* Quick Role Reset for Testing */}
              {isInstructor && (
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-emerald-400 font-medium">
                    ✓ Currently registered as Instructor
                  </span>
                  <button
                    type="button"
                    onClick={handleSwitchToStudent}
                    className="text-xs text-slate-400 hover:text-amber-300 underline transition-colors"
                  >
                    Switch back to Student
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
