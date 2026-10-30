import React from 'react';
import { Sparkles, ArrowRight, Gamepad2, Compass, Trophy, Flame, Zap, Shield, Target, Terminal } from 'lucide-react';

interface LandingHeroProps {
  onEnterQuestLine: () => void;
  onOpenSandbox?: () => void;
  onOpenPassModal: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onEnterQuestLine,
  onOpenSandbox,
  onOpenPassModal,
}) => {
  return (
    <div className="space-y-16 sm:space-y-24 pb-20">
      {/* SECTION 1: The Core Hero & Battlefield Creed */}
      <section className="relative px-4 sm:px-6 pt-10 sm:pt-16 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Hero Copy */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-400 uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>The High-Octane Code Arena</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-100 tracking-tight leading-[1.1] text-balance">
              Code, Battle &amp; Conquer
              <span className="block text-xl sm:text-2xl lg:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400 mt-2">
                The Most Addictive Coding Arena on Earth
              </span>
            </h1>

            {/* Creed Quote */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-2 shadow-inner">
              <p className="text-base sm:text-lg font-bold text-slate-100 tracking-wide flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Code like it&apos;s a sport. Play like it&apos;s a game.</span>
              </p>
              <p className="text-sm sm:text-base text-slate-300 font-medium pl-7">
                Your keyboard is your weapon. The leaderboard is your battlefield.
              </p>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="button"
                onClick={onEnterQuestLine}
                className="flex items-center gap-2 px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
              >
                <span>Launch Quest Line</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {onOpenSandbox && (
                <button
                  type="button"
                  onClick={onOpenSandbox}
                  className="flex items-center gap-2 px-6 py-3.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-100 border border-emerald-500/30 hover:border-emerald-500/60 font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer font-mono"
                >
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span>Code Sandbox</span>
                </button>
              )}

              <button
                type="button"
                onClick={onOpenPassModal}
                className="flex items-center gap-2 px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 font-bold text-sm rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Creator Pass</span>
              </button>
            </div>
          </div>

          {/* Hero Visual Asset: The Terminaltor */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden border-2 border-emerald-500/40 bg-slate-950 shadow-[0_0_50px_rgba(16,185,129,0.25)] group">
              <img
                src="/assets/terminaltor_boss.jpg"
                alt="TERMINALTOR - Final Coding Boss"
                referrerPolicy="no-referrer"
                className="w-full h-auto object-cover aspect-video group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/30 to-transparent flex flex-col justify-end p-5">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs text-slate-200 flex items-center gap-2 font-mono">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                    <span className="font-bold text-white uppercase tracking-wider">TERMINALTOR</span>
                    <span className="text-slate-500">·</span>
                    <span className="text-emerald-400 font-semibold">Coding Boss</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-950/80 border border-amber-500/40 px-2 py-0.5 rounded-full">
                    🌿 Ose Engine Core
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-1 font-mono">
                  &ldquo;I AM WATCHING, CODERS. PRESS THROUGH... IF YOU CAN.&rdquo;
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: The Heartbeat & Shifting Leaderboard (Calm & Balanced) */}
      <section className="px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/90 via-[#0a1120] to-slate-900/90 border border-emerald-500/20 p-8 sm:p-14 text-center shadow-xl">
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-mono font-bold tracking-wider uppercase">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Real-Time Arena Dynamics</span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-100 tracking-tight leading-snug">
              &ldquo;Crack the leaderboard, watch it shift under your fingertips &mdash; because someone is always one word ahead of you.&rdquo;
            </h2>

            <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto font-medium">
              Every keystroke counts. Live word feeds and rapid trivia cycles push your skills to the limit in real time.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 3: The Ascent & Progression (From Rookie to Grandmaster) */}
      <section className="px-4 sm:px-6 max-w-7xl mx-auto space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">
            Progression Roadmap
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
            From Wide-Eyed Rookie to Unstoppable Grandmaster
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Level up through rounds that reset, rivals that don&apos;t quit, and mechanics that make &ldquo;one more round&rdquo; the most dangerous phrase in your vocabulary.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 shadow-md hover:border-slate-700 transition-all">
            <div className="text-xs font-mono font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 w-fit px-2.5 py-1 rounded">
              STAGE 01
            </div>
            <h3 className="text-lg font-bold text-slate-100">Wide-Eyed Rookie</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Discover foundational logic quests, crack binary oracle puzzles, and forge your first short tokens under friendly speed constraints.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-emerald-500/30 space-y-3 shadow-md ring-1 ring-emerald-500/20 hover:border-emerald-500/50 transition-all">
            <div className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 w-fit px-2.5 py-1 rounded">
              STAGE 02
            </div>
            <h3 className="text-lg font-bold text-slate-100">Arena Competitor</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Step into 16-player active arenas. Synthesize 6-letter seed words, master mid-round letter surges, and solve speed trivia before opponents.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 shadow-md hover:border-slate-700 transition-all">
            <div className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 w-fit px-2.5 py-1 rounded">
              STAGE 03
            </div>
            <h3 className="text-lg font-bold text-slate-100">Unstoppable Grandmaster</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Top the daily, weekly, and all-time global leaderboards. Unlock legendary creator titles and claim permanent arena glory.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 4: The 3 Pillars (Balanced, Minimal & Calming) */}
      <section className="px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-800/80">
          <div className="flex items-start gap-4 p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-100">Instant Action</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Games kick off the moment one player enters. Zero waiting lobbies, zero idle countdowns.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-100">Zero Setup</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Runs 100% inside your browser with safe execution. No installs, packages, or complex configuration.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-100">100% Pure Addiction</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Addictive word forging, live opponents, rapid question pacing, and continuous 3-round language rotations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: Feature Entry Gateways */}
      <section className="px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            onClick={onEnterQuestLine}
            className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 hover:border-emerald-500/50 hover:bg-slate-900/90 transition-all cursor-pointer group shadow-lg"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-105 transition-transform">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">5-Tier Quest Line</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Master algorithmic logic, solve cyber puzzles, and build text RPG engines directly inside the interactive coding workspace.
            </p>
          </div>

          <div
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.hash = '#arcade';
                window.dispatchEvent(new HashChangeEvent('hashchange'));
              }
            }}
            className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 hover:border-emerald-500/50 hover:bg-slate-900/90 transition-all cursor-pointer group shadow-lg"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-105 transition-transform">
              <Gamepad2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">Multiplayer Arena</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Battle classmates and rivals in real-time Code Forgers and Debugs Hunting speed rounds with live scoreboards.
            </p>
          </div>

          <div
            onClick={onOpenPassModal}
            className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 hover:border-amber-500/50 hover:bg-slate-900/90 transition-all cursor-pointer group shadow-lg"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 group-hover:scale-105 transition-transform">
              <Trophy className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">Leaderboard Glory</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Climb daily, weekly, and all-time academy leaderboards, earn legendary cadet badges, and claim your place at the top.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingHero;
