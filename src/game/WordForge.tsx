import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Trophy,
  Zap,
  Clock,
  Send,
  Flame,
  Award,
  Layers,
  HelpCircle,
  Coins,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import {
  PlayerInfo,
  RoundEndScore,
  WordFeedBatch,
} from '../lib/gameProtocol';
import { PeerInputInfo } from './useRound';
import { calculateWordPoints } from './socket';
import { arcadeLeaderboard, WordForgeRecord } from '../lib/arcadeLeaderboard';

export interface WordForgeProps {
  language: string;
  seedWords: string[];
  pool: string[];
  possibleCount: number;
  startsAt: number;
  midroundAt: number;
  endsAt: number;
  batches: WordFeedBatch[];
  players: PlayerInfo[];
  myPlayerId: string;
  myScore: number;
  inputFlash: boolean;
  rejectionTooltip: string | null;
  gameState: 'waiting' | 'playing' | 'scoring' | 'intermission';
  roundEndScores: RoundEndScore[];
  intermissionEndsAt: number;
  peerInputs?: Record<string, PeerInputInfo>;
  currentUsername: string;
  addedLetters: string[];
  isJammerActive?: boolean;
  jammerUsedThisRound?: boolean;
  onActivateJammer?: () => { success: boolean; message: string };
  onTriggerMidround?: () => void;
  onSubmitWord: (word: string) => void;
  onBroadcastTyping?: (text: string) => void;
}

export const WordForge: React.FC<WordForgeProps> = ({
  language,
  seedWords,
  pool,
  possibleCount,
  startsAt,
  midroundAt,
  endsAt,
  batches,
  players,
  myPlayerId,
  myScore,
  inputFlash,
  rejectionTooltip,
  gameState,
  roundEndScores,
  intermissionEndsAt,
  peerInputs,
  currentUsername,
  addedLetters,
  isJammerActive = false,
  jammerUsedThisRound = false,
  onActivateJammer,
  onSubmitWord,
  onBroadcastTyping,
}) => {
  const [inputWord, setInputWord] = useState('');
  const [timeLeft, setTimeLeft] = useState(180);
  const [intermissionRemaining, setIntermissionRemaining] = useState(30);
  const [jammerNotice, setJammerNotice] = useState<string | null>(null);
  const [dailyBoard, setDailyBoard] = useState<WordForgeRecord[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Round 3-minute timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const rem = Math.max(0, endsAt - now);
      setTimeLeft(rem);
    }, 1000);
    return () => clearInterval(timer);
  }, [endsAt]);

  // Intermission 30-second break countdown & leaderboard loader
  useEffect(() => {
    if (gameState === 'intermission' || gameState === 'scoring') {
      setDailyBoard(arcadeLeaderboard.getWordForgeLeaderboard('today'));
      const timer = setInterval(() => {
        const now = Math.floor(Date.now() / 1000);
        const rem = Math.max(0, intermissionEndsAt - now);
        setIntermissionRemaining(rem);
      }, 500);
      return () => clearInterval(timer);
    }
  }, [gameState, intermissionEndsAt]);

  const handleLetterClick = (char: string) => {
    setInputWord((prev) => prev + char.toLowerCase());
    inputRef.current?.focus();
  };

  const handleBackspace = () => {
    setInputWord((prev) => prev.slice(0, -1));
    inputRef.current?.focus();
  };

  const handleClear = () => {
    setInputWord('');
    inputRef.current?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputWord.trim()) return;
    onSubmitWord(inputWord.trim());
    setInputWord('');
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toLowerCase();
    setInputWord(val);
  };

  const handleTriggerJammer = () => {
    if (!onActivateJammer) return;
    const res = onActivateJammer();
    setJammerNotice(res.message);
    setTimeout(() => setJammerNotice(null), 3500);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  // If in 30-second break, show the latest scoreboard for this round and the daily leaderboard below it
  if (gameState === 'intermission' || gameState === 'scoring') {
    return (
      <div className="w-full max-w-5xl mx-auto space-y-6 animate-in fade-in">
        {/* Break Header Banner */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-mono font-bold tracking-wider uppercase mb-1">
              <Clock className="w-3.5 h-3.5 text-amber-300 animate-spin" />
              <span>30-Second Intermission Break</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black">Round Finished!</h2>
            <p className="text-emerald-100 text-xs sm:text-sm">
              Review round rewards below. Next 3-minute round begins automatically!
            </p>
          </div>

          <div className="flex flex-col items-center bg-black/30 border border-white/20 px-6 py-4 rounded-2xl shrink-0">
            <span className="text-[11px] font-mono text-emerald-200 uppercase tracking-widest">Next Round Starts In</span>
            <span className="text-3xl font-mono font-black text-amber-300">{intermissionRemaining}s</span>
          </div>
        </div>

        {/* Section 1: Latest Round Scoreboard */}
        <div className="bg-white border border-emerald-200/90 rounded-2xl p-6 sm:p-7 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Latest Round Scoreboard</h3>
                <p className="text-xs text-slate-500">Official token rewards awarded to podium finishers</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
            {roundEndScores.slice(0, 3).map((score, idx) => {
              const isMe = score.player_id === 'me' || score.username === currentUsername;
              return (
                <div
                  key={score.player_id}
                  className={`p-4 rounded-2xl border text-center space-y-2 ${
                    idx === 0
                      ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/20'
                      : idx === 1
                      ? 'bg-slate-50 border-slate-300'
                      : 'bg-orange-50/50 border-orange-300'
                  }`}
                >
                  <span className="text-2xl block">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</span>
                  <div className="font-bold text-slate-900 text-sm">
                    {score.username} {isMe && '(You)'}
                  </div>
                  <div className="font-mono font-bold text-emerald-700 text-base">{score.score} PTS</div>
                  <div className="text-xs font-bold text-amber-800 bg-amber-100/90 px-2.5 py-1 rounded-full w-fit mx-auto flex items-center gap-1">
                    <span>🪙</span>
                    <span>+{score.tokensEarned || score.creditsEarned || (idx === 0 ? 100 : idx === 1 ? 70 : 50)} Tokens</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Daily Leaderboard */}
        <div className="bg-white border border-emerald-200/90 rounded-2xl p-6 sm:p-7 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-700" />
              <h3 className="text-sm font-bold text-slate-900">Daily Leaderboard (Code Forgers)</h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">Today&apos;s Active Champions</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-emerald-100 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Rank</th>
                  <th className="py-2.5 px-3">Player</th>
                  <th className="py-2.5 px-3">Alliance</th>
                  <th className="py-2.5 px-3">Longest Word</th>
                  <th className="py-2.5 px-3 text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dailyBoard.slice(0, 8).map((r) => (
                  <tr key={r.id} className="hover:bg-emerald-50/40 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-700">
                      {r.rank === 1 ? '🥇 1' : r.rank === 2 ? '🥈 2' : r.rank === 3 ? '🥉 3' : `#${r.rank}`}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">
                      {r.username}
                      {r.username.toLowerCase() === currentUsername.toLowerCase() && (
                        <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-semibold">
                          You
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 font-medium">
                      🎓 {r.allianceName || 'Solo Developer'}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-emerald-700 font-bold">
                      {r.longestWord}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-right font-bold text-emerald-800">
                      {r.score.toLocaleString()} pts
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Active Gameplay View
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 w-full max-w-7xl mx-auto">
      {/* Main Game Stage (3 cols) */}
      <div className="lg:col-span-3 space-y-6">
        {/* Top Arena Header Bar */}
        <div className="bg-white/95 border border-emerald-200/90 rounded-2xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-700 font-bold">
              CF
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Code Forgers Arena
                <span className="text-xs font-mono font-medium text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full capitalize">
                  {language}
                </span>
              </h2>
              <p className="text-xs text-slate-600">
                Forge valid words from the 2 six-letter seed words from supaDB1
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* 3-Minute Round Timer */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-mono font-semibold shadow-xs">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>{timeFormatted}</span>
            </div>

            {/* Score */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-mono font-semibold shadow-xs">
              <Zap className="w-3.5 h-3.5" />
              <span>{myScore} PTS</span>
            </div>
          </div>
        </div>

        {/* Simplified Challenge Header & Letter Matrix */}
        <div className="bg-white/95 border border-emerald-200/90 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 text-slate-800 text-xs sm:text-sm leading-relaxed">
            The words are <strong className="text-emerald-950 font-mono font-black text-sm uppercase px-2 py-0.5 bg-emerald-200/70 rounded border border-emerald-300 mx-1">{seedWords.map((w) => w.toUpperCase()).join(' ')}</strong>, the language code is <strong className="text-slate-900 font-bold">{language === 'python' ? 'Python' : 'English'}</strong>. There can be <strong className="text-emerald-800 font-mono font-bold text-sm">{possibleCount || 38}</strong> amount of words that can be forged. Good Luck!
          </div>

          {/* Letter Matrix: Stacked in 3 rows of 4s on mobile/desktop, extra 2 balanced under it */}
          <div className="py-2">
            {/* 3 rows of 4 buttons (12 letters from the 2 six-letter seed words) */}
            <div className="grid grid-cols-4 gap-2.5 sm:gap-3 max-w-xs sm:max-w-md mx-auto">
              {pool.slice(0, 12).map((char, idx) => (
                <button
                  key={`letter_${char}_${idx}`}
                  type="button"
                  onClick={() => handleLetterClick(char)}
                  className="w-full aspect-square max-w-[4rem] rounded-xl flex items-center justify-center font-mono font-bold text-lg sm:text-2xl shadow-xs transition-all active:scale-90 hover:scale-105 select-none bg-emerald-50 border border-emerald-300 text-emerald-950 hover:bg-emerald-100 hover:border-emerald-400 cursor-pointer"
                  title={`Tap to add '${char.toUpperCase()}'`}
                >
                  {char.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Extra 2 midround bonus letters balanced directly under the 3 rows */}
            {pool.length > 12 && (
              <div className="flex justify-center gap-2.5 sm:gap-3 mt-2.5 sm:mt-3">
                {pool.slice(12, 14).map((char, idx) => (
                  <button
                    key={`bonus_${char}_${idx}`}
                    type="button"
                    onClick={() => handleLetterClick(char)}
                    className="w-16 sm:w-20 h-12 sm:h-14 rounded-xl flex items-center justify-center font-mono font-black text-lg sm:text-2xl shadow-md transition-all active:scale-90 hover:scale-105 select-none bg-amber-100 border-2 border-amber-400 text-amber-950 hover:bg-amber-200 animate-pulse cursor-pointer relative"
                    title={`Midround Bonus Letter (+1.5x pts): Tap to add '${char.toUpperCase()}'`}
                  >
                    <span>{char.toUpperCase()}</span>
                    <span className="text-[9px] absolute -bottom-1 font-sans font-bold bg-amber-400 text-amber-950 px-1 rounded-full uppercase">
                      +1.5x
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Word Submission Form */}
        <div className="bg-white/95 border border-emerald-200/90 rounded-2xl p-6 shadow-xs space-y-3">
          <form onSubmit={handleSubmit} className="relative">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputWord}
                  onChange={handleInputChange}
                  placeholder="Type or tap letters above..."
                  className={`w-full bg-slate-50 border rounded-xl px-4 py-3.5 text-sm sm:text-base font-mono uppercase text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all ${
                    inputFlash ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300'
                  }`}
                  autoFocus
                />
                {rejectionTooltip && (
                  <div className="absolute left-2 -top-8 bg-red-600 text-white text-xs font-medium px-2.5 py-1 rounded-md shadow-md animate-in fade-in z-10">
                    {rejectionTooltip}
                  </div>
                )}
              </div>

              {inputWord.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={handleBackspace}
                    className="px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-colors cursor-pointer"
                    title="Backspace"
                  >
                    ⌫
                  </button>
                  <button
                    type="button"
                    onClick={handleClear}
                    className="px-3 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-xl font-bold text-sm transition-colors cursor-pointer"
                    title="Clear"
                  >
                    ✕
                  </button>
                </>
              )}

              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 sm:px-6 rounded-xl font-semibold text-sm flex items-center gap-2 transition-colors shadow-xs shrink-0 cursor-pointer"
              >
                <span>Forge</span>
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Word Cloaking Jammer Tactical Bar (Single-Use per round) */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              {isJammerActive ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950 text-cyan-300 border border-cyan-500/60 text-xs font-mono font-bold animate-pulse">
                  <span>📡</span>
                  <span>STEALTH ACTIVE: Words masked as █ █ █ █ █ (JAMMED)</span>
                </div>
              ) : jammerUsedThisRound ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-500 border border-slate-200 text-xs font-mono font-semibold">
                  <span>📡</span>
                  <span>Jammer Used (1/1 this round)</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleTriggerJammer}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-sky-700 hover:from-cyan-500 hover:to-sky-600 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                  title="Single-use per round: masks your typed keystrokes and forged words in the live room feed so opponents cannot copy them!"
                >
                  <span>📡</span>
                  <span>Deploy Word Jammer (Single-Use)</span>
                </button>
              )}
            </div>

            <span className="text-[11px] text-slate-500">
              {isJammerActive
                ? 'Cloak engaged · Rivals cannot steal your forged words'
                : 'Scrambles keystrokes & feed words into encrypted ciphers'}
            </span>
          </div>

          {jammerNotice && (
            <div className="p-2.5 rounded-xl bg-cyan-50 border border-cyan-300 text-cyan-900 text-xs font-semibold animate-in fade-in flex items-center gap-2">
              <span>📡</span>
              <span>{jammerNotice}</span>
            </div>
          )}
        </div>

        {/* Feed of submitted words */}
        <div className="bg-white/95 border border-emerald-200/90 rounded-2xl p-5 shadow-xs space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Live Word Feed
          </span>
          <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
            {batches.flatMap((b) => b.words).length === 0 ? (
              <p className="text-xs text-slate-400 italic">No words forged yet this round. Submit your first word!</p>
            ) : (
              batches
                .flatMap((b) => b.words)
                .reverse()
                .map((w, idx) => (
                  <span
                    key={`${w.word}_${idx}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs font-mono font-medium"
                  >
                    <strong className="text-emerald-800">{w.word}</strong>
                    <span className="text-emerald-600 text-[10px]">+{w.points}pts</span>
                    <span className="text-slate-600 text-[10px]">({w.player})</span>
                  </span>
                ))
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Live Leaderboard */}
      <div className="space-y-6">
        <div className="bg-white/95 border border-emerald-200/90 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Room Standings</span>
          </div>

          <div className="space-y-2">
            {sortedPlayers.map((p, idx) => {
              const isMe = p.id === myPlayerId || p.username === currentUsername;
              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl text-xs transition-colors ${
                    isMe
                      ? 'bg-emerald-50 border border-emerald-300 font-bold text-emerald-950'
                      : 'bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-[10px] ${
                        idx === 0
                          ? 'bg-amber-400 text-amber-950 font-black'
                          : idx === 1
                          ? 'bg-slate-300 text-slate-800 font-bold'
                          : idx === 2
                          ? 'bg-amber-700 text-white font-bold'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span>{p.username} {isMe && '(You)'}</span>
                  </div>
                  <span className="font-mono font-semibold">{p.score} pts</span>
                </div>
              );
            })}
          </div>

          <div className="border-t border-slate-100 pt-3 text-[11px] text-slate-500 space-y-1">
            <div className="flex justify-between">
              <span>🥇 1st Place</span>
              <strong className="text-amber-600">+100 Credits</strong>
            </div>
            <div className="flex justify-between">
              <span>🥈 2nd Place</span>
              <strong className="text-slate-600">+70 Credits</strong>
            </div>
            <div className="flex justify-between">
              <span>🥉 3rd Place</span>
              <strong className="text-amber-700">+50 Credits</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WordForge;
