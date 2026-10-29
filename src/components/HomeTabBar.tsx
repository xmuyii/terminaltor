import React from 'react';
import {
  Gamepad2,
  Building2,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Flame,
  Shield,
  Users,
  Coins,
  Target,
  Trophy,
  Compass,
} from 'lucide-react';
import { AppView } from './Navigation';
import { Profile } from '../types';

interface HomeTabBarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  profile: Profile;
  onOpenCreditsModal: () => void;
  onOpenDailyQuestsModal: () => void;
  onOpenPassModal: () => void;
}

export type HomeTabKey = 'arcade' | 'academies' | 'classroom' | 'quests';

export const HomeTabBar: React.FC<HomeTabBarProps> = ({
  currentView,
  onNavigate,
  profile,
  onOpenCreditsModal,
  onOpenDailyQuestsModal,
  onOpenPassModal,
}) => {
  const [activeTab, setActiveTab] = React.useState<HomeTabKey>('arcade');

  return (
    <section className="px-4 sm:px-6 max-w-7xl mx-auto pt-6 pb-12">
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Section Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Academy Arena Hub</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Explore The Platform Modules
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Select any tab below to jump into multiplayer battles, manage your school alliance, or enter your classroom.
            </p>
          </div>

          {/* Quick Credits Counter Pill */}
          <button
            type="button"
            onClick={onOpenCreditsModal}
            className="self-start sm:self-center flex items-center gap-2 px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl text-amber-300 text-xs font-bold font-mono transition-colors cursor-pointer"
            title="Click to manage Telegram Stars Credits & Crypto Tokens"
          >
            <Coins className="w-4 h-4 text-amber-400" />
            <span>⭐️ {profile.credits ?? 150} Credits</span>
          </button>
        </div>

        {/* Home Navigation Tabs Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 p-1.5 bg-slate-950/80 rounded-2xl border border-slate-800 mb-8">
          <button
            type="button"
            onClick={() => setActiveTab('arcade')}
            className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'arcade'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 font-black'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            <span>Multiplayer Arcade</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('academies')}
            className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'academies'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 font-black'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Academy Alliances</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('classroom')}
            className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'classroom'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 font-black'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Classroom</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('quests')}
            className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'quests'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 font-black'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Python Quests</span>
          </button>
        </div>

        {/* Tab 1: Multiplayer Arcade Content */}
        {activeTab === 'arcade' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center animate-in fade-in duration-200">
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
                  Live 16-Player Matchmaking Active
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Code Forgers &amp; Debugs Hunting
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Step directly into the current active room. Play fast-paced anagram forging and bug-squashing code trivia. Every word submission costs 10 tokens. Round winners claim 100, 70, or 50 tokens with live scoreboard updates.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-mono block">Submission Cost</span>
                  <span className="font-bold text-amber-400 text-sm">10 Credits / Word</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-mono block">1st Place Bonus</span>
                  <span className="font-bold text-emerald-400 text-sm">+100 Credits</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-slate-400 font-mono block">Daily Login</span>
                  <span className="font-bold text-sky-400 text-sm">100 Free Credits</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => onNavigate('arcade')}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-emerald-500/25 transition-all active:scale-95"
                >
                  <Gamepad2 className="w-4 h-4" />
                  <span>Launch Multiplayer Arcade</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={onOpenCreditsModal}
                  className="flex items-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold rounded-xl transition-all border border-slate-700"
                >
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span>Get Tokens (₦1,000 / 1,000)</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs font-mono">
                  <span className="text-slate-400">Matchmaker Room</span>
                  <span className="text-emerald-400 font-bold">Room 1 (Active)</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 text-xs">
                    <span className="font-semibold text-white">⚡ Code Forgers</span>
                    <span className="text-emerald-400 font-mono font-bold">6-Letter Seed Words</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 text-xs">
                    <span className="font-semibold text-white">🐞 Debugs Hunting</span>
                    <span className="text-sky-400 font-mono font-bold">Syntax &amp; Logic Bugs</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 text-xs">
                    <span className="font-semibold text-white">⚡ Auto-Allocation</span>
                    <span className="text-amber-400 font-mono font-bold">Up to 16 Players</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 leading-normal">
                  Players are automatically placed into the current active room. Room codes can be configured in the Advanced Settings collapsible inside the arena.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Academy Alliances Content */}
        {activeTab === 'academies' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center animate-in fade-in duration-200">
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
                  B2B2C School Subscriptions (Phase 5.5)
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Academy Alliances for Schools &amp; Bootcamps
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Academic institutions pay a flat ₦25,000/month subscription that grants Sovereign Premium to ALL enrolled students under a single license. Students join in 1-click using your school join link.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Flat Institutional Pricing</span>
                  </div>
                  <p className="text-xs text-slate-400">₦25,000/month flat for up to 30 enrolled students. No per-seat surprise bills.</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <Users className="w-3.5 h-3.5 text-sky-400" />
                    <span>Dual-Track Entitlements</span>
                  </div>
                  <p className="text-xs text-slate-400">Students retain the higher of individual or school tiers. Zero progress loss if school lapses.</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => onNavigate('academy-signup')}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-emerald-500/25 transition-all active:scale-95"
                >
                  <Building2 className="w-4 h-4" />
                  <span>Register School (₦25,000/mo)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('academy-dashboard')}
                  className="flex items-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold rounded-xl transition-all border border-slate-700"
                >
                  <span>Academy Dashboard</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('academy-join')}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold underline px-2 py-1"
                >
                  Have a Student Join Link?
                </button>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-950 to-slate-900 border border-emerald-500/30 space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-emerald-400 font-bold uppercase">Alliance Features</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">PRO &amp; PREMIUM</span>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Unlocks Tier 6–10 Pro Quests for all students</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Access to all four time-window leaderboards</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>3 hint levels per day per student</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Automated Paystack subscription renewal</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Classroom Content */}
        {activeTab === 'classroom' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center animate-in fade-in duration-200">
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-mono font-bold text-sky-400 uppercase tracking-widest">
                  Cohorts, Assignments &amp; Gradebook (Phase 8B)
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Classroom &amp; Academic Cohorts
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Connect students into structured classroom groups, set weekly coding assignments with strict deadlines, track hint usage telemetry, and download real-time CSV gradebooks.
              </p>

              <div className="grid grid-cols-3 gap-3 pt-2 text-center">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-mono block">Join Codes</span>
                  <span className="font-bold text-white text-xs mt-0.5 block">6-Char Codes</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-mono block">Hint Tracker</span>
                  <span className="font-bold text-amber-400 text-xs mt-0.5 block">Level 1–3 Telemetry</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-mono block">Gradebook</span>
                  <span className="font-bold text-emerald-400 text-xs mt-0.5 block">Instant Export</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => onNavigate('teach')}
                  className="flex items-center gap-2 px-6 py-3 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-sky-500/25 transition-all active:scale-95"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Enter Classroom</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  How Students Join Cohorts
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Instructors generate 6-character cohort codes (e.g. <code className="text-sky-300">LAGOS-101</code>). Students enter the code to join their class roster, unlocking assigned challenges with synchronized due dates.
                </p>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono flex items-center justify-between">
                  <span>Sample Cohort: CS101-Intro</span>
                  <span className="text-emerald-400 font-bold">24 Students Enrolled</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Python Quests Content */}
        {activeTab === 'quests' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center animate-in fade-in duration-200">
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
                  Browser-Based Code Execution
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                5-Tier Python Mastery Quests
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Level up through syntax foundations, list comprehensions, algorithm design, binary search trees, and full text game engines running 100% in-browser with Pyodide WebAssembly.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => onNavigate('quests')}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-emerald-500/25 transition-all active:scale-95"
                >
                  <Compass className="w-4 h-4" />
                  <span>Open Quest Line</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={onOpenDailyQuestsModal}
                  className="flex items-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-sm font-bold rounded-xl transition-all border border-slate-700"
                >
                  <Target className="w-4 h-4" />
                  <span>View Daily Rotating Quests</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                  Curriculum Tiers
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900">
                    <span className="text-white font-semibold">Tier 1: Sovereign Syntax</span>
                    <span className="text-sky-400 font-mono">Quests 1–5</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900">
                    <span className="text-white font-semibold">Tier 2: Algorithmic Logic</span>
                    <span className="text-emerald-400 font-mono">Quests 6–10</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900">
                    <span className="text-white font-semibold">Tier 3–5: Data Structures &amp; Engine</span>
                    <span className="text-amber-400 font-mono">Quests 11–20</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default HomeTabBar;
