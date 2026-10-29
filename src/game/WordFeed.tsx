import React from 'react';
import { WordFeedBatch } from '../lib/gameProtocol';

export interface WordFeedProps {
  batches: WordFeedBatch[];
  currentUserId?: string;
}

export const WordFeed: React.FC<WordFeedProps> = ({ batches }) => {
  const allItems = batches.flatMap((b) => b.words || []);

  return (
    <div className="space-y-2 max-h-48 overflow-y-auto">
      {allItems.length === 0 ? (
        <div className="text-center text-xs text-slate-500 py-4 font-mono">
          Waiting for first word forged...
        </div>
      ) : (
        allItems.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs font-mono"
          >
            <div className="flex items-center gap-2 truncate">
              <span className="text-slate-400">{item.player}:</span>
              <span className="text-emerald-400 font-bold tracking-wider">{item.word}</span>
            </div>
            <span className="text-amber-400 font-bold tabular-nums">+{item.points}</span>
          </div>
        ))
      )}
    </div>
  );
};

export default WordFeed;
