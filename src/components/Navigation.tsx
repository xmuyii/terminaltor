import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Shield,
  GraduationCap,
  Flame,
  Trophy,
  Menu,
  X,
  Target,
  Building2,
  Coins,
  Send,
  Gamepad2,
  Compass,
} from 'lucide-react';
import { Profile, UserRole } from '../types';
import { SupabaseStore, SyncStatus } from '../lib/supabase';
import { AcademyBadge } from './AcademyBadge';
import { ArcadeCreditArt, CryptoTokenArt } from './CurrencyArt';

export type AppView =
  | 'sandbox'
  | 'quests'
  | 'workspace'
  | 'instructor'
  | 'arcade'
  | 'teach'
  | 'academy-dashboard'
  | 'academy-signup'
  | 'academy-join';

interface NavigationProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  profile: Profile;
  onOpenPassModal: () => void;
  onOpenLeaderboardModal: () => void;
  onOpenDailyQuestsModal?: () => void;
  onOpenCreditsModal?: () => void;
  onOpenTelegramModal?: () => void;
  onRoleChange: (role: UserRole) => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentView,
  onNavigate,
  profile,
  onOpenPassModal,
  onOpenLeaderboardModal,
  onOpenDailyQuestsModal,
  onOpenCreditsModal,
  onOpenTelegramModal,
  onRoleChange,
}) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() => SupabaseStore.getSyncStatus());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    const handleSyncStatus = (e: Event) => {
      const customEvent = e as CustomEvent<SyncStatus>;
      setSyncStatus(customEvent.detail);
    };

    window.addEventListener('sovereign_sync_status_updated', handleSyncStatus);
    return () => window.removeEventListener('sovereign_sync_status_updated', handleSyncStatus);
  }, []);

  const handleMobileNav = (view: AppView) => {
    onNavigate(view);
    setIsMobileMenuOpen(false);
  };

  const isInstructor = profile.role === 'instructor' || profile.role === 'teacher' || profile.role === 'admin';

  return (
    <header className="flex flex-col bg-[#070b14]/95 border-b border-slate-800 backdrop-blur sticky top-0 z-40">
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-2.5 w-full">
        {/* Left Hand: Mobile Bar Toggle + Wordmark */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 text-sky-400" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => handleMobileNav('sandbox')}
            className="text-base sm:text-lg font-black tracking-tight text-slate-100 hover:text-emerald-400 transition-colors whitespace-nowrap text-left flex items-center gap-2"
          >
            <span className="w-7 h-7 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-sm font-black">
              ⚡
            </span>
            <span>The Tech Academy</span>
          </button>
        </div>

        {/* Desktop Navigation Links / Primary Tabs */}
        <nav className="hidden md:flex items-center gap-4 lg:gap-5 text-sm font-medium text-slate-400">
          <button
            type="button"
            onClick={() => onNavigate('sandbox')}
            className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 ${
              currentView === 'sandbox' ? 'text-emerald-400 font-bold' : ''
            }`}
          >
            Home
          </button>

          <button
            type="button"
            onClick={() => onNavigate('quests')}
            className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 ${
              currentView === 'quests' || currentView === 'workspace'
                ? 'text-emerald-400 font-bold'
                : ''
            }`}
          >
            Quest Line
          </button>

          <button
            type="button"
            onClick={() => onNavigate('arcade')}
            className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              currentView === 'arcade' ? 'text-emerald-400 font-bold' : ''
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>Multiplayer Arcade</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('academy-dashboard')}
            className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              currentView === 'academy-dashboard' || currentView === 'academy-signup' || currentView === 'academy-join'
                ? 'text-emerald-400 font-bold'
                : ''
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Academy Alliances</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('teach')}
            className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              currentView === 'teach' ? 'text-emerald-400 font-bold' : ''
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Classroom</span>
          </button>

          {/* Instructor View: ONLY RENDERED IF USER IS AN INSTRUCTOR / TEACHER */}
          {isInstructor && (
            <button
              type="button"
              onClick={() => onNavigate('instructor')}
              className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 font-semibold ${
                currentView === 'instructor' ? 'bg-sky-500/20 text-sky-300 font-bold ring-1 ring-sky-400/40' : ''
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Instructor View</span>
            </button>
          )}
        </nav>

        {/* Right Header Cluster: Remaining Game Tokens, Daily Quests, Leaderboards, Telegram */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Daily Quests button */}
          <button
            type="button"
            onClick={onOpenDailyQuestsModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-bold transition-all shadow-xs"
            title="Daily Rotating Python & Arena Quests"
          >
            <Target className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Daily Quests</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </button>

          {/* Leaderboards button */}
          <button
            type="button"
            onClick={onOpenLeaderboardModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl text-amber-300 text-xs font-bold transition-all shadow-xs"
            title="Global & Academy Leaderboards"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Leaderboards</span>
          </button>

          {/* Remaining Game Tokens / Credits Counter with distinct Cyber Core art */}
          <button
            type="button"
            onClick={onOpenCreditsModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-cyan-950/80 via-slate-900 to-slate-900 hover:from-cyan-900/90 hover:to-slate-800 border border-cyan-500/40 hover:border-cyan-400 rounded-xl text-cyan-200 text-xs font-bold font-mono transition-all shadow-xs cursor-pointer group"
            title="Arcade Credits: 10 credits deducted per word or debug attempt · Click to view/recharge"
          >
            <ArcadeCreditArt size={16} />
            <span className="text-cyan-300 font-extrabold">{typeof profile.credits === 'number' ? profile.credits : 150}</span>
            <span className="text-[10px] text-cyan-400/80 font-bold uppercase hidden sm:inline">Credits</span>
          </button>

          {/* Telegram Login / Profile Button */}
          <button
            type="button"
            onClick={onOpenTelegramModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 rounded-xl text-sky-300 text-xs font-semibold transition-all shadow-xs"
            title="Telegram Player Account & Instructor Passcode"
          >
            <Send className="w-3.5 h-3.5 -rotate-12 text-sky-400" />
            <span className="max-w-[90px] sm:max-w-[120px] truncate font-medium">
              {profile.username?.startsWith('@') ? profile.username : `@${profile.username}`}
            </span>
            <span className={`hidden xl:inline text-[10px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider ${
              isInstructor ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
            }`}>
              {isInstructor ? 'Instructor' : 'Student'}
            </span>
          </button>

          {/* Day Streak indicator */}
          <div className="hidden lg:flex items-center gap-1 px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-xs font-semibold">
            <Flame className="w-3.5 h-3.5 fill-amber-400" />
            <span className="font-mono">{profile.streak_days || 1}d</span>
          </div>

          {/* Academy Badge */}
          <div className="hidden sm:block">
            <AcademyBadge
              userId={profile.id}
              onOpenDashboard={() => onNavigate('academy-dashboard')}
              onOpenJoinModal={() => onNavigate('academy-join')}
            />
          </div>

          {/* Creator Pass CTA */}
          {profile.has_pro_pass ? (
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-xl">
              <Shield className="w-3.5 h-3.5" />
              <span>Pass Active</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenPassModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-sm transition-all whitespace-nowrap active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
              <span>Pass</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Collapsible Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden flex flex-col bg-[#090e1a] border-b border-slate-800 px-4 py-3 gap-1.5 shadow-2xl animate-in slide-in-from-top-2 duration-200">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-3 pb-1">
            Navigation Menu
          </div>

          <button
            type="button"
            onClick={() => handleMobileNav('sandbox')}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${
              currentView === 'sandbox'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-300 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <span className="text-base">⚡</span>
            <span>Home</span>
          </button>

          <button
            type="button"
            onClick={() => handleMobileNav('quests')}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${
              currentView === 'quests' || currentView === 'workspace'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-300 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <Compass className="w-4 h-4 text-emerald-400" />
            <span>Quest Line</span>
          </button>

          <button
            type="button"
            onClick={() => handleMobileNav('arcade')}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${
              currentView === 'arcade'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-300 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <Gamepad2 className="w-4 h-4 text-emerald-400" />
            <span>Multiplayer Arcade</span>
          </button>

          <button
            type="button"
            onClick={() => handleMobileNav('academy-dashboard')}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${
              currentView === 'academy-dashboard' || currentView === 'academy-signup' || currentView === 'academy-join'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-300 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4 text-emerald-400" />
            <span>Academy Alliances</span>
          </button>

          <button
            type="button"
            onClick={() => handleMobileNav('teach')}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${
              currentView === 'teach'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-300 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-sky-400" />
            <span>Classroom &amp; Cohorts</span>
          </button>

          {/* Instructor View in Mobile Menu: ONLY IF INSTRUCTOR */}
          {isInstructor && (
            <button
              type="button"
              onClick={() => handleMobileNav('instructor')}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${
                currentView === 'instructor'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                  : 'text-sky-400 hover:bg-slate-900'
              }`}
            >
              <Shield className="w-4 h-4 text-sky-400" />
              <span>Instructor Console</span>
            </button>
          )}

          <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenDailyQuestsModal?.();
              }}
              className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
            >
              <Target className="w-3.5 h-3.5" />
              <span>Daily Quests</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenLeaderboardModal();
              }}
              className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20"
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Leaderboards</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsMobileMenuOpen(false);
              onOpenTelegramModal?.();
            }}
            className="mt-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-sky-300 bg-sky-500/10 border border-sky-500/20"
          >
            <Send className="w-3.5 h-3.5 -rotate-12" />
            <span>Telegram Account &amp; Instructor Passcode</span>
          </button>
        </div>
      )}
    </header>
  );
};

export default Navigation;
