import React, { useEffect, useState } from 'react';
import { GraduationCap, Shield, ChevronRight, Sparkles } from 'lucide-react';
import { academyService, AcademyRecord } from '../lib/academyService';

interface AcademyBadgeProps {
  userId: string;
  onOpenDashboard?: () => void;
  onOpenJoinModal?: () => void;
}

export const AcademyBadge: React.FC<AcademyBadgeProps> = ({
  userId,
  onOpenDashboard,
  onOpenJoinModal,
}) => {
  const [enrolledAcademy, setEnrolledAcademy] = useState<AcademyRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    academyService.getMyEnrolledAcademy(userId).then((res) => {
      if (mounted) {
        setEnrolledAcademy(res ? res.academy : null);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, [userId]);

  if (loading) return null;

  if (enrolledAcademy) {
    const isPro = enrolledAcademy.subscription_plan === 'pro';
    return (
      <button
        type="button"
        onClick={onOpenDashboard}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-xs ${
          isPro
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 hover:bg-amber-500/20'
            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 hover:bg-emerald-500/20'
        }`}
        title={`Member of ${enrolledAcademy.name} (${enrolledAcademy.subscription_plan.toUpperCase()})`}
      >
        <GraduationCap className={`w-3.5 h-3.5 ${isPro ? 'text-amber-600' : 'text-emerald-600'}`} />
        <span className="truncate max-w-[140px] font-medium">{enrolledAcademy.name}</span>
        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
          isPro ? 'bg-amber-200 text-amber-900' : 'bg-emerald-200 text-emerald-900'
        }`}>
          {isPro ? 'Pro' : 'Prem'}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpenJoinModal}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-slate-300 hover:border-emerald-400 bg-white/70 hover:bg-emerald-50/50 text-slate-600 hover:text-emerald-700 text-xs font-medium transition-colors"
    >
      <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
      <span>Join School Alliance</span>
      <ChevronRight className="w-3 h-3 text-slate-400" />
    </button>
  );
};

export default AcademyBadge;
