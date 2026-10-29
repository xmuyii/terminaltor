import React from 'react';
import { X, Award, CheckCircle2, Lock, Sparkles } from 'lucide-react';
import { arcadeLeaderboard, PLAYSTYLE_TITLES, PlaystyleTitleInfo } from '../lib/arcadeLeaderboard';

interface PlaystyleBadgesModalProps {
  isOpen: boolean;
  onClose: () => void;
  equippedStyle: string;
  onStyleEquipped: (newStyle: string) => void;
}

export const PlaystyleBadgesModal: React.FC<PlaystyleBadgesModalProps> = ({
  isOpen,
  onClose,
  equippedStyle,
  onStyleEquipped,
}) => {
  if (!isOpen) return null;

  const unlockedStyles = arcadeLeaderboard.getUnlockedStyles();

  const handleEquip = (title: string) => {
    arcadeLeaderboard.setPlayerEquippedStyle(title);
    onStyleEquipped(title);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-amber-200/90 rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl space-y-6 text-slate-800 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-amber-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <span>Playstyle Combat Badges</span>
                <span className="text-[11px] font-mono font-bold text-amber-800 bg-amber-100/80 px-2.5 py-0.5 rounded-full">
                  Emoji + 1 Word
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Titles are not given to top 10, but earned through distinct gameplay combat styles!
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Badge Highlight */}
        <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-emerald-50 border border-amber-200/90 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏷️</span>
            <div>
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-800">
                Currently Equipped Playstyle
              </span>
              <div className="text-lg font-black text-slate-900 flex items-center gap-2">
                <span>{equippedStyle}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Active in Arenas
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Grid of Playstyle Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {PLAYSTYLE_TITLES.map((badge: PlaystyleTitleInfo) => {
            const isUnlocked = unlockedStyles.includes(badge.title);
            const isEquipped = equippedStyle === badge.title;

            return (
              <div
                key={badge.id}
                className={`p-4 rounded-2xl border transition-all space-y-2 flex flex-col justify-between ${
                  isEquipped
                    ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-400/30'
                    : isUnlocked
                    ? 'bg-white border-slate-200 hover:border-amber-300 shadow-xs'
                    : 'bg-slate-50/70 border-slate-200 opacity-75'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-base font-black text-slate-900 flex items-center gap-2">
                      {badge.title}
                    </span>
                    {isEquipped ? (
                      <span className="text-[10px] font-mono font-bold bg-amber-500 text-white px-2 py-0.5 rounded-md flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>EQUIPPED</span>
                      </span>
                    ) : isUnlocked ? (
                      <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-emerald-600" />
                        <span>UNLOCKED</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        <span>LOCKED</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {badge.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-400 capitalize">
                    Style: {badge.styleType}
                  </span>
                  {isUnlocked && !isEquipped && (
                    <button
                      type="button"
                      onClick={() => handleEquip(badge.title)}
                      className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                    >
                      Equip Title
                    </button>
                  )}
                  {!isUnlocked && (
                    <span className="text-[11px] text-amber-700 font-semibold italic">
                      Achieve in Arena
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="text-xs text-slate-500 bg-slate-50 p-3.5 rounded-xl border border-slate-200 leading-relaxed">
          💡 <strong>How to unlock:</strong> Play in live arenas! For example, forge multiple anagram permutations (such as <em>pears</em>, <em>rapes</em>, <em>pares</em>, <em>spare</em>) to instantly trigger and equip the <strong>🔥 Anagrammer</strong> badge!
        </div>
      </div>
    </div>
  );
};
