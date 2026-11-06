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
  Terminal,
  Database,
} from 'lucide-react';
import { Profile, UserRole } from '../types';
import { SupabaseStore, SyncStatus } from '../lib/supabase';
import { AcademyBadge } from './AcademyBadge';
import { ArcadeCreditArt } from './CurrencyArt';

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
  onOpenDatabaseModal?: () => void;
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
  onOpenDatabaseModal,
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
    const unsubscribe = SupabaseStore.onSyncStatusChange((status) => {
      setSyncStatus(status);
    });

    return () => {
      window.removeEventListener('sovereign_sync_status_updated', handleSyncStatus);
      unsubscribe();
    };
  }, []);

  const handleMobileNav = (view: AppView) => {
    onNavigate(view);
    setIsMobileMenuOpen(false);
  };

  const isInstructor = profile.role === 'instructor' || profile.role === 'teacher' || profile.role === 'admin';

  return (
    <header className="flex flex-col bg-[#070b14]/95 border-b border-slate-800 backdrop-blur sticky top-0 z-40 w-full max-w-full overflow-x-hidden">
      <div className="flex items-center justify-between gap-2 sm:gap-3 px-3 sm:px-4 lg:px-6 py-2 w-full max-w-full box-border">
        {/* Left Hand: Mobile Bar Toggle + Wordmark */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-4 h-4 text-sky-400" />
            ) : (
              <Menu className="w-4 h-4" />
            )}
          </button>

          <button
            type="button"
            onClick={() => handleMobileNav('sandbox')}
            className="text-left flex items-center gap-2 group cursor-pointer shrink-0"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg overflow-hidden ring-1 ring-emerald-500/50 bg-black/60 shadow-xs group-hover:scale-105 transition-transform shrink-0">
              <img
                src="/assets/irete_labs_logo.jpg"
                alt="IRETE LABS Emblem"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-sm sm:text-base font-black tracking-wider text-slate-100 group-hover:text-emerald-400 transition-colors">
                  TERMINALTOR
                </span>
                <span className="hidden 2xl:inline text-[9px] font-mono font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                  Ose Engine
                </span>
              </div>
              <span className="text-[9px] font-mono tracking-widest text-slate-400 uppercase -mt-0.5">
                IRETE LABS
              </span>
            </div>
          </button>
        </div>

        {/* Center Desktop Navigation Links (Responsive, avoids overflowing laptop screens) */}
        <nav className="hidden md:flex items-center gap-3 lg:gap-4 xl:gap-5 text-sm font-medium text-slate-400 min-w-0">
          <button
            type="button"
            onClick={() => onNavigate('sandbox')}
            className={`hover:text-slate-100 transition-colors shrink-0 cursor-pointer ${
              currentView === 'sandbox' ? 'text-emerald-400 font-bold' : ''
            }`}
          >
            Home
          </button>

          <button
            type="button"
            onClick={() => onNavigate('quests')}
            className={`hover:text-slate-100 transition-colors shrink-0 cursor-pointer ${
              currentView === 'quests' ? 'text-emerald-400 font-bold' : ''
            }`}
          >
            Quest Line
          </button>

          <button
            type="button"
            onClick={() => onNavigate('workspace')}
            className={`hover:text-slate-100 transition-colors shrink-0 flex items-center gap-1 cursor-pointer ${
              currentView === 'workspace' ? 'text-emerald-400 font-bold' : ''
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sandbox</span>
          </button>

          {/* Shown on lg+ screens */}
          <button
            type="button"
            onClick={() => onNavigate('arcade')}
            className={`hidden lg:flex hover:text-slate-100 transition-colors shrink-0 items-center gap-1 cursor-pointer ${
              currentView === 'arcade' ? 'text-emerald-400 font-bold' : ''
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>Arcade</span>
          </button>

          {/* Shown on xl+ screens to keep laptop header clean */}
          <button
            type="button"
            onClick={() => onNavigate('academy-dashboard')}
            className={`hidden xl:flex hover:text-slate-100 transition-colors shrink-0 items-center gap-1 cursor-pointer ${
              currentView === 'academy-dashboard' || currentView === 'academy-signup' || currentView === 'academy-join'
                ? 'text-emerald-400 font-bold'
                : ''
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Alliances</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('teach')}
            className={`hidden xl:flex hover:text-slate-100 transition-colors shrink-0 items-center gap-1 cursor-pointer ${
              currentView === 'teach' ? 'text-emerald-400 font-bold' : ''
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Classroom</span>
          </button>

          {/* Instructor View: ONLY RENDERED IF USER IS AN INSTRUCTOR / TEACHER ON XL+ SCREENS */}
          {isInstructor && (
            <button
              type="button"
              onClick={() => onNavigate('instructor')}
              className={`hidden xl:flex hover:text-slate-100 transition-colors shrink-0 items-center gap-1.5 px-2 py-0.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 font-semibold cursor-pointer ${
                currentView === 'instructor' ? 'bg-sky-500/20 text-sky-300 font-bold ring-1 ring-sky-400/40' : ''
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Instructor</span>
            </button>
          )}
        </nav>

        {/* Right Header Cluster: Grouped Cleanly without Horizontal Bleed */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Secondary Quick Action: Daily Quests (Icon on lg, full on 2xl) */}
          <button
            type="button"
            onClick={onOpenDailyQuestsModal}
            className="hidden lg:flex items-center gap-1.5 px-2 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-bold transition-all cursor-pointer shadow-xs"
            title="Daily Rotating Python & Arena Quests"
          >
            <Target className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden 2xl:inline">Daily Quests</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </button>

          {/* Secondary Quick Action: Leaderboards (Icon on lg, full on 2xl) */}
          <button
            type="button"
            onClick={onOpenLeaderboardModal}
            className="hidden lg:flex items-center gap-1.5 px-2 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl text-amber-300 text-xs font-bold transition-all cursor-pointer shadow-xs"
            title="Global & Academy Leaderboards"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden 2xl:inline">Leaderboards</span>
          </button>

          {/* Day Streak indicator (xl+ screens only) */}
          <div className="hidden xl:flex items-center gap-1 px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-xs font-semibold">
            <Flame className="w-3.5 h-3.5 fill-amber-400" />
            <span className="font-mono">{profile.streak_days || 1}d</span>
          </div>

          {/* Academy Badge (xl+ screens only) */}
          <div className="hidden xl:block">
            <AcademyBadge
              userId={profile.id}
              onOpenDashboard={() => onNavigate('academy-dashboard')}
              onOpenJoinModal={() => onNavigate('academy-join')}
            />
          </div>

          {/* =========================================================================
              CLEAN CADET SPACE: [ 460 | @Muyiwa_Judah | Pass | Supabase DB ]
              Clean, unified capsule that never wraps or bleeds out of the screen.
              ========================================================================= */}
          <div className="flex items-center bg-slate-900/90 border border-slate-700/80 rounded-2xl p-1 gap-1 sm:gap-1.5 shadow-sm shrink-0">
            {/* 1. CREDITS COUNTER: 460 */}
            <button
              type="button"
              onClick={onOpenCreditsModal}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 hover:bg-cyan-950/60 rounded-xl text-cyan-200 text-xs font-bold font-mono transition-colors cursor-pointer group shrink-0"
              title="Arcade Credits: Click to view balance and recharge"
            >
              <ArcadeCreditArt size={15} />
              <span className="text-cyan-300 font-extrabold text-xs">
                {typeof profile.credits === 'number' ? profile.credits : 150}
              </span>
              <span className="hidden 2xl:inline text-[10px] text-cyan-400/80 uppercase font-bold">Credits</span>
            </button>

            {/* Subtle Divider */}
            <div className="h-3.5 w-px bg-slate-700/80 shrink-0" />

            {/* 2. PLAYER CALLSIGN: @Muyiwa_Judah */}
            <button
              type="button"
              onClick={onOpenTelegramModal}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 hover:bg-sky-950/50 rounded-xl text-sky-300 text-xs font-medium transition-colors cursor-pointer group shrink-0"
              title="Cadet Account & Profile: Click to open"
            >
              <Send className="w-3 h-3 -rotate-12 text-sky-400 group-hover:scale-110 transition-transform shrink-0" />
              <span className="max-w-[70px] xs:max-w-[85px] sm:max-w-[110px] md:max-w-[140px] truncate font-semibold text-slate-200 group-hover:text-sky-300">
                {profile.username?.startsWith('@') ? profile.username : `@${profile.username}`}
              </span>
            </button>

            {/* Subtle Divider */}
            <div className="h-3.5 w-px bg-slate-700/80 shrink-0" />

            {/* 3. PRO / PASS BUTTON */}
            {profile.has_pro_pass ? (
              <div
                className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold rounded-lg uppercase tracking-wider shrink-0"
                title="Pro Pass Active"
              >
                <Shield className="w-3 h-3 text-emerald-400" />
                <span className="hidden sm:inline">PRO</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenPassModal}
                className="flex items-center gap-1 px-2 sm:px-2.5 py-1 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 active:scale-95 text-slate-950 text-xs font-black rounded-xl shadow-xs transition-transform cursor-pointer whitespace-nowrap shrink-0"
                title="Unlock Pro Pass for Unlimited Access & Battle Hints"
              >
                <Sparkles className="w-3 h-3 fill-slate-950" />
                <span>Pass</span>
              </button>
            )}

            {/* Subtle Divider */}
            <div className="h-3.5 w-px bg-slate-700/80 shrink-0" />

            {/* 4. SUPABASE DATABASE BUTTON (Prominently placed, passcode protected) */}
            <button
              type="button"
              onClick={onOpenDatabaseModal}
              className="flex items-center gap-1 px-1.5 sm:px-2 py-1 hover:bg-slate-800 rounded-xl text-slate-300 hover:text-emerald-300 transition-colors cursor-pointer shrink-0"
              title={`Supabase Database: ${syncStatus === 'synced' ? 'Connected (Synced)' : 'Local / Offline Mode'}. Click for connection diagnostics & setup.`}
            >
              <Database className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  syncStatus === 'synced'
                    ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                    : syncStatus === 'syncing'
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-slate-500'
                }`}
              />
              <span className="hidden 2xl:inline text-[10px] font-mono font-bold text-slate-300">
                DB
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Collapsible Navigation Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden flex flex-col bg-[#090e1a] border-b border-slate-800 px-4 py-3 gap-2 shadow-2xl animate-in slide-in-from-top-2 duration-200 max-h-[85vh] overflow-y-auto">
          {/* Mobile Cadet Profile Capsule */}
          <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-2xl flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-300 text-xs font-bold shrink-0">
                <Send className="w-3.5 h-3.5 -rotate-12" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate">
                  {profile.username?.startsWith('@') ? profile.username : `@${profile.username}`}
                </div>
                <div className="text-[10px] text-cyan-400 font-mono flex items-center gap-1">
                  <Coins className="w-2.5 h-2.5" />
                  <span>{profile.credits ?? 150} Credits</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenCreditsModal?.();
                }}
                className="px-2 py-1 bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-[10px] font-bold rounded-lg cursor-pointer"
              >
                + Credits
              </button>
              {!profile.has_pro_pass && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenPassModal();
                  }}
                  className="px-2 py-1 bg-amber-400 text-slate-950 text-[10px] font-black rounded-lg cursor-pointer"
                >
                  Pass
                </button>
              )}
            </div>
          </div>

          {/* DEDICATED SUPABASE DATABASE SECTION (Unmissable on mobile) */}
          <button
            type="button"
            onClick={() => {
              setIsMobileMenuOpen(false);
              onOpenDatabaseModal?.();
            }}
            className="p-3 bg-emerald-950/30 hover:bg-emerald-950/50 border border-emerald-500/40 rounded-2xl flex items-center justify-between gap-3 text-left cursor-pointer transition-all group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                <Database className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <span>Supabase Database &amp; Cloud Sync</span>
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  PostgreSQL credentials, tables &amp; real-time diagnostics
                </div>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-[10px] font-mono">
              <span
                className={`w-2 h-2 rounded-full ${
                  syncStatus === 'synced'
                    ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
                    : syncStatus === 'syncing'
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-slate-500'
                }`}
              />
              <span className="text-slate-300">
                {syncStatus === 'synced' ? 'Synced' : 'Config'}
              </span>
            </div>
          </button>

          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 pt-1">
            Navigation Menu
          </div>

          <button
            type="button"
            onClick={() => handleMobileNav('sandbox')}
            className={`flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all text-left cursor-pointer ${
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
            className={`flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all text-left cursor-pointer ${
              currentView === 'quests'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-300 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <Compass className="w-4 h-4 text-emerald-400" />
            <span>Quest Line</span>
          </button>

          <button
            type="button"
            onClick={() => handleMobileNav('workspace')}
            className={`flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all text-left cursor-pointer ${
              currentView === 'workspace'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-300 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>Code Sandbox</span>
          </button>

          <button
            type="button"
            onClick={() => handleMobileNav('arcade')}
            className={`flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all text-left cursor-pointer ${
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
            className={`flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all text-left cursor-pointer ${
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
            className={`flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all text-left cursor-pointer ${
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
              className={`flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all text-left cursor-pointer ${
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
              className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 cursor-pointer"
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
              className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 cursor-pointer"
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
            className="mt-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-sky-300 bg-sky-500/10 border border-sky-500/20 cursor-pointer"
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
