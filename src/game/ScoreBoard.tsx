import React from 'react';
import { Trophy, Medal, Crown } from 'lucide-react';
import { PlayerInfo } from '../lib/gameProtocol';

export interface ScoreBoardProps {
  players: PlayerInfo[];
  myPlayerId: string;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({ players, myPlayerId }) => {
  const sorted = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
      <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
        <Trophy className="w-4 h-4 text-amber-400" />
        <span>Live Round Scores</span>
      </div>

      <div className="space-y-1.5 max-h-60 overflow-y-auto">
        {sorted.map((player, idx) => {
          const isMe = player.id === myPlayerId;
          return (
            <div
              key={player.id}
              className={`flex items-center justify-between p-2 rounded-xl text-xs font-mono transition-all ${
                isMe
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold'
                  : 'bg-slate-950/60 border border-slate-800/60 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <span className="w-5 text-center text-slate-500 font-bold">
                  {idx === 0 ? <Crown className="w-3.5 h-3.5 text-amber-400 inline" /> : `#${idx + 1}`}
                </span>
                <span className="truncate">{player.username}</span>
                {isMe && <span className="text-[10px] text-emerald-400 font-sans font-bold">(You)</span>}
              </div>
              <span className="font-bold text-amber-400 tabular-nums">{player.score} pts</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ScoreBoard;
