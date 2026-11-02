import React, { useState, useEffect } from 'react';
import { Target, CheckCircle2, Clock, Zap, Sparkles, X, ChevronRight, Award } from 'lucide-react';
import { DailyQuest, retentionService } from '../lib/retentionService';
import { Profile } from '../types';

interface DailyQuestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: Profile;
  onNavigateToQuest?: () => void;
}

export const DailyQuestsModal: React.FC<DailyQuestsModalProps> = ({
  isOpen,
  onClose,
  currentProfile,
  onNavigateToQuest,
}) => {
  const [quests, setQuests] = useState<DailyQuest[]>([]);
  const [lagosDate, setLagosDate] = useState<string>('');
  const [countdown, setCountdown] = useState<string>('00:00:00');
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch quests and start timer
  useEffect(() => {
    if (!isOpen) return;

    let active = true;
    const fetchQuests = async () => {
      setLoading(true);
      const data = await retentionService.getDailyQuests(currentProfile.id);
      if (active) {
        setQuests(data.quests);
        setLagosDate(data.date);
        setLoading(false);
      }
    };

    fetchQuests();

    const interval = setInterval(() => {
      const remaining = retentionService.getTimeUntilMidnightLagos();
      setCountdown(remaining.formatted);
    }, 1000);

    const initial = retentionService.getTimeUntilMidnightLagos();
    setCountdown(initial.formatted);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [isOpen, currentProfile.id]);

  if (!isOpen) return null;

  const completedCount = quests.filter((q) => Boolean(q.completed || (q as any).completed_at)).length;
  const totalPotentialXp = quests.reduce((acc, q) => acc + q.reward_xp, 0);
  const earnedXp = quests.filter((q) => Boolean(q.completed || (q as any).completed_at)).reduce((acc, q) => acc + q.reward_xp, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-[#0c1222] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-800/80 bg-gradient-to-r from-emerald-950/40 via-slate-900/60 to-teal-950/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-100">Daily Quests</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  {completedCount}/3 Complete
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Resets in <strong className="text-emerald-300 font-mono">{countdown}</strong> (Africa/Lagos)</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Overview Stats Bar */}
        <div className="px-6 py-3 bg-[#080d19] border-b border-slate-800/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <span>Date: <span className="font-mono text-slate-200">{lagosDate || 'Today'}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-slate-300">
              Earned <strong className="text-amber-400 font-mono font-bold">{earnedXp}</strong> / {totalPotentialXp} XP
            </span>
          </div>
        </div>

        {/* Quests List */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              <Sparkles className="w-6 h-6 mx-auto mb-2 text-emerald-400 animate-spin" />
              <span>Generating today&apos;s quests...</span>
            </div>
          ) : (
            quests.map((q, idx) => {
              const isDone = Boolean(q.completed || (q as any).completed_at);
              const cur = q.progress ?? q.current_count ?? 0;
              const tar = q.target ?? q.target_count ?? 1;
              const progressPct = Math.min(100, Math.round((cur / tar) * 100));

              const badgeColors = {
                easy: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
                medium: 'bg-sky-500/10 border-sky-500/30 text-sky-400',
                stretch: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
              }[q.tier_category];

              return (
                <div
                  key={q.id || q.quest_index || idx}
                  className={`p-4 rounded-2xl border transition-all ${
                    isDone
                      ? 'bg-emerald-950/20 border-emerald-500/40 shadow-xs'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${badgeColors}`}>
                        {q.tier_category}
                      </span>
                      <h3 className={`text-sm font-bold ${isDone ? 'text-emerald-300 line-through' : 'text-slate-100'}`}>
                        {q.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 font-mono text-xs font-bold text-amber-400 flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5" />
                        +{q.reward_xp} XP
                      </span>
                      <span className="px-2.5 py-1 rounded-xl bg-amber-400/10 border border-amber-400/30 font-mono text-xs font-bold text-amber-300 flex items-center gap-1">
                        🪙 +{q.reward_credits || (q.tier_category === 'stretch' ? 80 : q.tier_category === 'medium' ? 40 : 20)}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                    {q.description}
                  </p>

                  {/* Progress Indicator */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-400">Progress</span>
                      <span className={isDone ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                        {isDone ? 'Completed' : `${q.progress ?? q.current_count ?? 0} / ${q.target ?? q.target_count ?? 1}`}
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          isDone
                            ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
                            : 'bg-gradient-to-r from-sky-500 to-emerald-400'
                        }`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  {isDone && (
                    <div className="mt-3 pt-2 border-t border-emerald-900/40 flex items-center gap-2 text-xs font-semibold text-emerald-400">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Completed! +{q.reward_xp} XP &amp; +{q.reward_credits || (q.tier_category === 'stretch' ? 80 : q.tier_category === 'medium' ? 40 : 20)} Credits awarded.</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer info & Action */}
        <div className="p-5 border-t border-slate-800/80 bg-slate-900/80 flex items-center justify-between gap-4">
          <div className="text-[11px] text-slate-400 leading-tight">
            Quests do not stack. Unsolved quests expire at midnight Africa/Lagos.
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              onNavigateToQuest?.();
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors shrink-0 shadow-lg shadow-emerald-500/20 active:scale-95"
          >
            <span>Solve Now</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DailyQuestsModal;
