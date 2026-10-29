import React from 'react';
import { Clock } from 'lucide-react';

export interface CountdownProps {
  secondsLeft: number;
  totalSeconds?: number;
  label?: string;
}

export const Countdown: React.FC<CountdownProps> = ({ secondsLeft, label = 'Time Left' }) => {
  const isUrgent = secondsLeft <= 10;
  return (
    <div
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold ${
        isUrgent
          ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 animate-pulse'
          : 'bg-slate-900 border-slate-800 text-slate-200'
      }`}
    >
      <Clock className="w-3.5 h-3.5" />
      <span>{label}: {secondsLeft}s</span>
    </div>
  );
};

export default Countdown;
