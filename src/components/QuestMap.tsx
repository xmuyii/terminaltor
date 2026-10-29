import React from 'react';
import {
  CheckCircle2,
  Lock,
  Play,
  Sparkles,
  Zap,
  Repeat,
  Layers,
  Gamepad2,
  Trophy,
  ShieldAlert,
  Flame,
  RotateCcw,
} from 'lucide-react';
import { QUESTS } from '../data/quests';
import { Profile, UserProgress } from '../types';
import { SupabaseStore } from '../lib/supabase';

interface QuestMapProps {
  profile: Profile;
  progress: Record<string, UserProgress>;
  onSelectQuest: (questId: string) => void;
  onOpenPassModal: () => void;
  onResetProgress: () => void;
}

export const QuestMap: React.FC<QuestMapProps> = ({
  profile,
  progress,
  onSelectQuest,
  onOpenPassModal,
  onResetProgress,
}) => {
  const completedCount = Object.values(progress).filter((p) => p.completed).length;
  const totalQuests = QUESTS.length;
  const progressPercent = Math.round((completedCount / totalQuests) * 100);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Fundamentals':
        return 'text-sky-400 border-sky-800/60 bg-sky-950/30';
      case 'Algorithms':
        return 'text-emerald-400 border-emerald-800/60 bg-emerald-950/30';
      case 'Data Structures':
        return 'text-purple-400 border-purple-800/60 bg-purple-950/30';
      case 'Game Dev':
        return 'text-amber-400 border-amber-800/60 bg-amber-950/30';
      default:
        return 'text-slate-400 border-slate-800 bg-slate-900';
    }
  };

  const getBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case 'Zap':
        return <Zap className="w-5 h-5 text-amber-400" />;
      case 'Repeat':
        return <Repeat className="w-5 h-5 text-emerald-400" />;
      case 'Layers':
        return <Layers className="w-5 h-5 text-purple-400" />;
      case 'Gamepad2':
        return <Gamepad2 className="w-5 h-5 text-sky-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-amber-400" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Student Progress Overview Header */}
      <div className="p-6 bg-[#0a0f1d] border border-slate-800 rounded-xl shadow-lg">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Cadet Info */}
          <div className="lg:col-span-4 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-sky-500/10 border-2 border-sky-400/40 p-1 shrink-0 overflow-hidden">
              <img
                src={profile.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=QuantumCadet'}
                alt={profile.username}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-100">{profile.username}</h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-sky-300">
                  {profile.role.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                <span className="flex items-center gap-1 text-amber-400 font-mono font-semibold">
                  <Flame className="w-3.5 h-3.5 fill-amber-400" />
                  <span className="tabular-nums">{profile.streak_days} Day Streak</span>
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-slate-400 font-mono tabular-nums">{profile.xp_points} Total XP</span>
              </div>
            </div>
          </div>

          {/* Curriculum Completion Bar */}
          <div className="lg:col-span-5 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400 font-medium">Curriculum Progression</span>
              <span className="text-sky-400 font-mono font-bold">{progressPercent}% Completed</span>
            </div>
            <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-500">
              {completedCount} of {totalQuests} logic challenges solved
            </div>
          </div>

          {/* Pro Pass Status */}
          <div className="lg:col-span-3 flex justify-end">
            {profile.has_pro_pass ? (
              <div className="p-3 bg-amber-950/30 border border-amber-800/60 rounded-lg text-xs w-full text-center">
                <div className="font-bold text-amber-300 flex items-center justify-center gap-1.5">
                  <Trophy className="w-4 h-4" />
                  <span>Sovereign Pass Active</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">All Pro challenges unlocked</p>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenPassModal}
                className="w-full p-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 rounded-lg text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 fill-slate-950" />
                <span>Unlock Sovereign Pass</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quest Line Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-100">Gamified Logic Quest Line</h3>
            <p className="text-xs text-slate-400">
              Progressive WebAssembly modules designed for young developers.
            </p>
          </div>

          <button
            type="button"
            onClick={onResetProgress}
            className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded transition-colors"
            title="Reset progress to test again"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Progress</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {QUESTS.map((quest) => {
            const isCompleted = Boolean(progress[quest.id]?.completed);
            const isLockedPro = quest.is_pro && !profile.has_pro_pass && profile.role === 'student';

            return (
              <div
                key={quest.id}
                className={`flex flex-col bg-[#0b1120] border rounded-xl overflow-hidden shadow-lg transition-all ${
                  isCompleted
                    ? 'border-emerald-800/70 hover:border-emerald-600'
                    : isLockedPro
                    ? 'border-amber-900/50 opacity-90'
                    : 'border-slate-800 hover:border-sky-500/50'
                }`}
              >
                {/* Card Header Banner */}
                <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                      {getBadgeIcon(quest.badge_icon)}
                    </div>
                    <div>
                      <div className="text-[11px] font-mono text-sky-400 font-semibold">
                        LEVEL {quest.level}
                      </div>
                      <h4 className="text-sm font-bold text-slate-100">{quest.title}</h4>
                    </div>
                  </div>

                  {isCompleted ? (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>SOLVED</span>
                    </span>
                  ) : quest.is_pro ? (
                    <span className="text-[10px] font-bold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
                      PRO
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                      OPEN
                    </span>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 space-y-3 text-xs">
                  <p className="text-slate-400 leading-relaxed line-clamp-2">
                    {quest.description}
                  </p>

                  <div className="p-2.5 bg-slate-950/60 rounded border border-slate-800/80 text-[11px] text-slate-300 space-y-1">
                    <div className="font-semibold text-slate-400">Objectives:</div>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-400">
                      {quest.objectives.slice(0, 2).map((o, idx) => (
                        <li key={idx} className="truncate">{o}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className={`px-2 py-0.5 rounded border text-[11px] ${getCategoryColor(quest.category)}`}>
                      {quest.category}
                    </span>
                    <span className="font-mono text-amber-400 font-semibold">
                      +{quest.xp_reward} XP
                    </span>
                  </div>
                </div>

                {/* Card Footer Action */}
                <div className="p-4 bg-slate-950/60 border-t border-slate-900">
                  {isLockedPro ? (
                    <button
                      type="button"
                      onClick={onOpenPassModal}
                      className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded transition-colors shadow-sm"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Unlock with Sovereign Pass</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSelectQuest(quest.id)}
                      className={`w-full flex items-center justify-center gap-2 py-2 text-xs font-bold rounded transition-colors ${
                        isCompleted
                          ? 'bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-900/50'
                          : 'bg-sky-500 hover:bg-sky-400 text-white shadow-sm'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{isCompleted ? 'Replay Challenge' : 'Start Workspace'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quest Mastery Insignia Section */}
      <div className="p-6 bg-[#0a0f1d] border border-slate-800 rounded-xl shadow-lg">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8 space-y-2">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Python Master Insignia</span>
            </h3>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Complete all five sovereign levels to receive the verifiable Python Master Digital Medal, proving mastery of variables, logical branching, accumulator loops, list collections, and game loops.
            </p>
            <div className="flex items-center gap-4 text-xs pt-2">
              <span className="text-slate-400">Total Available XP: <strong className="text-slate-200 font-mono">1,100 XP</strong></span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-400">Student Status: <strong className="text-emerald-400 font-mono">Active Cadet</strong></span>
            </div>
          </div>

          <div className="lg:col-span-4 flex justify-center">
            <div className="w-28 h-28 rounded-xl overflow-hidden border border-amber-500/40 shadow-xl bg-slate-900 p-1">
              <img
                src="/src/assets/images/quest_cyber_badge_1791795630494.jpg"
                alt="Python Master Coding Quest Achievement Badge"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestMap;
