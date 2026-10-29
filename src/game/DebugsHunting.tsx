import React, { useState, useEffect, useRef } from 'react';
import {
  Bug,
  Trophy,
  Zap,
  Clock,
  CheckCircle2,
  XCircle,
  Flame,
  Award,
  Sparkles,
  Coins,
  Send,
  Calendar,
  AlertCircle,
  HelpCircle,
  Timer,
} from 'lucide-react';
import {
  AnswerRevealed,
  PlayerInfo,
  QuestionMessage,
  RoundEndScore,
} from '../lib/gameProtocol';
import { arcadeLeaderboard, DebugsHuntingRecord } from '../lib/arcadeLeaderboard';

export interface DebugsHuntingProps {
  language: string;
  currentQuestion: QuestionMessage | null;
  questionIndex?: number;
  debugPhase?: 'active' | 'reveal' | 'break';
  phaseSecondsRemaining?: number;
  solvedByUsername?: string | null;
  endsAt?: number;
  players: PlayerInfo[];
  myPlayerId: string;
  myScore: number;
  gameState: 'waiting' | 'playing' | 'scoring' | 'intermission';
  roundEndScores: RoundEndScore[];
  intermissionEndsAt: number;
  currentUsername: string;
  debugAccuracy?: number;
  debugFeedback?: string | null;
  onSubmitAnswer: (typedAnswer: string) => void;
}

export const DebugsHunting: React.FC<DebugsHuntingProps> = ({
  language,
  currentQuestion,
  questionIndex = 0,
  debugPhase = 'active',
  phaseSecondsRemaining = 10,
  solvedByUsername = null,
  endsAt,
  players,
  myPlayerId,
  myScore,
  gameState,
  roundEndScores,
  intermissionEndsAt,
  currentUsername,
  debugAccuracy = 100,
  debugFeedback,
  onSubmitAnswer,
}) => {
  const [typedInput, setTypedInput] = useState('');
  const [roundTimeLeft, setRoundTimeLeft] = useState(180);
  const [intermissionRemaining, setIntermissionRemaining] = useState(30);
  const [dailyBoard, setDailyBoard] = useState<DebugsHuntingRecord[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Overall 3-minute round countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const rem = endsAt ? Math.max(0, endsAt - now) : 180;
      setRoundTimeLeft(rem);
    }, 1000);
    return () => clearInterval(timer);
  }, [endsAt]);

  // Intermission 30-second break countdown & leaderboard loader
  useEffect(() => {
    if (gameState === 'intermission' || gameState === 'scoring') {
      setDailyBoard(arcadeLeaderboard.getDebugsHuntingLeaderboard('today'));
      const timer = setInterval(() => {
        const now = Math.floor(Date.now() / 1000);
        const rem = Math.max(0, intermissionEndsAt - now);
        setIntermissionRemaining(rem);
      }, 500);
      return () => clearInterval(timer);
    }
  }, [gameState, intermissionEndsAt]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedInput.trim()) return;
    if (debugPhase !== 'active') return;
    onSubmitAnswer(typedInput.trim());
    setTypedInput('');
    inputRef.current?.focus();
  };

  const minutes = Math.floor(roundTimeLeft / 60);
  const seconds = roundTimeLeft % 60;
  const timeFormatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  // If in 30-second intermission break, show Latest Round Scoreboard + Daily Leaderboard
  if (gameState === 'intermission' || gameState === 'scoring') {
    return (
      <div className="w-full max-w-5xl mx-auto space-y-6 animate-in fade-in">
        {/* Break Header Banner */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-mono font-bold tracking-wider uppercase mb-1">
              <Clock className="w-3.5 h-3.5 text-amber-300 animate-spin" />
              <span>30-Second Intermission Break</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black">Debugs Hunting Round Ended!</h2>
            <p className="text-amber-100 text-xs sm:text-sm">
              Review round standings below. Next 3-minute round begins automatically!
            </p>
          </div>

          <div className="flex flex-col items-center bg-black/30 border border-white/20 px-6 py-4 rounded-2xl shrink-0">
            <span className="text-[11px] font-mono text-amber-200 uppercase tracking-widest">Next Round Starts In</span>
            <span className="text-3xl font-mono font-black text-amber-300">{intermissionRemaining}s</span>
          </div>
        </div>

        {/* Section 1: Latest Round Scoreboard */}
        <div className="bg-white border border-amber-200/90 rounded-2xl p-6 sm:p-7 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-amber-100">
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
                  <div className="font-mono font-bold text-amber-700 text-base">{score.score} PTS</div>
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
        <div className="bg-white border border-amber-200/90 rounded-2xl p-6 sm:p-7 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-amber-100">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-700" />
              <h3 className="text-sm font-bold text-slate-900">Daily Leaderboard (Debugs Hunting)</h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">Today&apos;s Active Bug Hunters</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-amber-100 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Rank</th>
                  <th className="py-2.5 px-3">Player</th>
                  <th className="py-2.5 px-3">Alliance</th>
                  <th className="py-2.5 px-3 text-right">Bugs Fixed</th>
                  <th className="py-2.5 px-3 text-right">Accuracy</th>
                  <th className="py-2.5 px-3 text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dailyBoard.slice(0, 8).map((r) => (
                  <tr key={r.id} className="hover:bg-amber-50/40 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-700">
                      {r.rank === 1 ? '🥇 1' : r.rank === 2 ? '🥈 2' : r.rank === 3 ? '🥉 3' : `#${r.rank}`}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">
                      {r.username}
                      {r.username.toLowerCase() === currentUsername.toLowerCase() && (
                        <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 font-semibold">
                          You
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 font-medium">
                      🎓 {r.allianceName || 'Solo Developer'}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-right text-slate-700 font-semibold">
                      {r.bugsFixed}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-right text-emerald-700 font-bold">
                      {r.accuracyRate}%
                    </td>
                    <td className="py-2.5 px-3 font-mono text-right font-bold text-amber-800">
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

  // Active Gameplay View (3-minute round with 9 questions in 10s active / 5s reveal / 5s break cycle)
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 w-full max-w-7xl mx-auto">
      {/* Question Stage (3 cols) */}
      <div className="lg:col-span-3 space-y-6">
        {/* Arena Header Bar */}
        <div className="bg-white/95 border border-amber-200/90 rounded-2xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-700">
              <Bug className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Debugs Hunting Arena
                <span className="text-xs font-mono font-medium text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full capitalize">
                  {language}
                </span>
                <span className="text-xs font-mono font-bold text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-md">
                  Challenge {questionIndex + 1} of 9
                </span>
              </h2>
              <p className="text-xs text-slate-600">
                9 fast challenges in 3 mins. 10s active · 5s answer reveal · 5s break
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Accuracy Indicator */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-mono font-bold text-emerald-900 shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{debugAccuracy}% ACC</span>
            </div>

            {/* Overall 3-Minute Round Timer */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-mono font-semibold shadow-xs">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{timeFormatted}</span>
            </div>

            {/* Score */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-600 text-white rounded-xl text-xs font-mono font-semibold shadow-xs">
              <Zap className="w-3.5 h-3.5" />
              <span>{myScore} PTS</span>
            </div>
          </div>
        </div>

        {/* Question Card */}
        {currentQuestion ? (
          <div className="bg-white/95 border border-amber-200/90 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                  <Bug className="w-3.5 h-3.5" />
                  <span>Challenge {questionIndex + 1} of 9</span>
                </span>

                {/* Question Phase Timer */}
                <div className="flex items-center gap-2 font-mono font-bold text-xs">
                  {debugPhase === 'active' && (
                    <span className="px-3 py-1 bg-amber-500 text-slate-950 rounded-lg animate-pulse flex items-center gap-1.5">
                      <Timer className="w-3.5 h-3.5" />
                      <span>{phaseSecondsRemaining}s Active</span>
                    </span>
                  )}
                  {debugPhase === 'reveal' && (
                    <span className="px-3 py-1 bg-emerald-600 text-white rounded-lg flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Revealed ({phaseSecondsRemaining}s)</span>
                    </span>
                  )}
                  {debugPhase === 'break' && (
                    <span className="px-3 py-1 bg-slate-800 text-amber-300 rounded-lg flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Next in {phaseSecondsRemaining}s</span>
                    </span>
                  )}
                </div>
              </div>

              <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                {currentQuestion.text}
              </h3>

              {/* Code Snippet Box */}
              {currentQuestion.codeSnippet && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-xs sm:text-sm leading-relaxed overflow-x-auto shadow-inner">
                  <pre>{currentQuestion.codeSnippet}</pre>
                </div>
              )}

              {/* Target Assertion Clue */}
              {currentQuestion.targetAssertion && (
                <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200 text-amber-900 font-mono text-xs flex items-center gap-2">
                  <span className="font-bold text-[10px] uppercase text-amber-700 bg-amber-200/80 px-2 py-0.5 rounded">
                    Goal
                  </span>
                  <span>{currentQuestion.targetAssertion}</span>
                </div>
              )}
            </div>

            {/* Phase 2: Correct Answer Displayed for 5 Seconds */}
            {debugPhase === 'reveal' && (
              <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-400 text-emerald-950 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in zoom-in-95">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-lg shrink-0">
                    {solvedByUsername ? '🎉' : '⌛'}
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-emerald-800">
                      {solvedByUsername ? (
                        <>Solved by <strong>{solvedByUsername}</strong>!</>
                      ) : (
                        <>Time expired! No player answered in 10s.</>
                      )}
                    </span>
                    <div className="text-sm font-mono font-black text-emerald-950">
                      Correct Answer: <span className="bg-emerald-200 px-2.5 py-0.5 rounded border border-emerald-300">{currentQuestion.canonicalAnswer}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right text-[11px] text-emerald-700 font-mono font-bold">
                  <span>Answer clears in {phaseSecondsRemaining}s...</span>
                </div>
              </div>
            )}

            {/* Phase 3: 5 Seconds Break Before Next Question (Answer is deleted / hidden) */}
            {debugPhase === 'break' && (
              <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between gap-4 animate-in fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-base shrink-0">
                    ⚡
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-amber-300">
                      Answer Cleared · 5-Second Break
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      {questionIndex < 8
                        ? `Challenge ${questionIndex + 2} of 9 loads in ${phaseSecondsRemaining}s...`
                        : `Final challenge complete! Calculating round scoreboard in ${phaseSecondsRemaining}s...`}
                    </p>
                  </div>
                </div>
                <div className="text-amber-400 font-mono font-black text-xl">
                  {phaseSecondsRemaining}s
                </div>
              </div>
            )}

            {/* Phase 1: Manual Text Input Form (enabled during active phase) */}
            <form onSubmit={handleSubmit} className="space-y-3 pt-2">
              <label className="block text-xs font-semibold text-slate-700">
                Type your answer / fix below:
              </label>
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={typedInput}
                  onChange={(e) => setTypedInput(e.target.value)}
                  disabled={debugPhase !== 'active'}
                  placeholder={
                    debugPhase === 'active'
                      ? 'Type your fix, operator, or return value...'
                      : debugPhase === 'reveal'
                      ? 'Answer displayed for 5s...'
                      : 'Next question loading in 5s...'
                  }
                  className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition-all disabled:opacity-50"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={debugPhase !== 'active'}
                  className="bg-amber-600 hover:bg-amber-500 disabled:bg-slate-400 text-white px-6 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md shrink-0 cursor-pointer"
                >
                  <span>Submit Fix</span>
                  <Send className="w-4 h-4" />
                </button>
              </div>

              {debugFeedback && (
                <div
                  className={`p-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                    debugFeedback.includes('Correct')
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'bg-rose-100 text-rose-900 border border-rose-300 animate-shake'
                  }`}
                >
                  {debugFeedback.includes('Correct') ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-700 shrink-0" />
                  )}
                  <span>{debugFeedback}</span>
                </div>
              )}
            </form>
          </div>
        ) : (
          <div className="bg-white/95 border border-amber-200/90 rounded-2xl p-12 text-center text-slate-500">
            Waiting for next challenge batch...
          </div>
        )}
      </div>

      {/* Right Column: Standings */}
      <div className="space-y-6">
        <div className="bg-white/95 border border-amber-200/90 rounded-2xl p-5 shadow-xs space-y-4">
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
                      ? 'bg-amber-50 border border-amber-300 font-bold text-amber-950'
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

export default DebugsHunting;
