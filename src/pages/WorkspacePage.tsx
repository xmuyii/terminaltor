import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  Play,
  CheckCircle2,
  Lock,
  ChevronRight,
  BookOpen,
  Award,
  HelpCircle,
  Code,
  Zap,
  RotateCcw,
  Lightbulb,
  Sparkles,
  X,
  Terminal,
  Target,
  Skull,
  Crown,
} from 'lucide-react';
import CodeEditor from '../components/CodeEditor';
import TerminalConsole from '../components/TerminalConsole';
import { QUESTS } from '../data/quests';
import { runPython, runQuestTests } from '../lib/pyodide';
import { SupabaseStore } from '../lib/supabase';
import { AITutorService, HintResponse } from '../lib/aiTutorService';
import { retentionService } from '../lib/retentionService';
import { Quest, ValidationResult, Profile, UserProgress } from '../types';

interface WorkspaceProps {
  questId?: string;
  onBackToQuests?: () => void;
  onOpenPassModal?: () => void;
}

export const WorkspacePage: React.FC<WorkspaceProps> = ({
  questId = 'quest-1',
  onBackToQuests,
  onOpenPassModal,
}) => {
  const currentQuest: Quest =
    QUESTS.find((q) => q.id === questId) || QUESTS[0];

  const [code, setCode] = useState<string>(() =>
    SupabaseStore.getSavedCode(currentQuest.id, currentQuest.starter_code)
  );
  const [stdout, setStdout] = useState<string>('');
  const [stderr, setStderr] = useState<string>('');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [statusText, setStatusText] = useState<string>('');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [showHints, setShowHints] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'brief' | 'hints' | 'schema'>('brief');
  const [profile, setProfile] = useState<Profile>(() => SupabaseStore.getProfile());
  const [progress, setProgress] = useState<Record<string, UserProgress>>(() =>
    SupabaseStore.getProgress()
  );

  // Mobile / Tablet Responsive Pane State (Phase 8C)
  const [mobilePane, setMobilePane] = useState<'editor' | 'brief' | 'terminal'>('editor');

  // AI Tutor & Guided Nudges State (Phase 8A)
  const [hintModalOpen, setHintModalOpen] = useState<boolean>(false);
  const [currentHintLevel, setCurrentHintLevel] = useState<1 | 2 | 3>(1);
  const [activeHint, setActiveHint] = useState<HintResponse | null>(null);
  const [isRequestingHint, setIsRequestingHint] = useState<boolean>(false);
  const [hintError, setHintError] = useState<string | null>(null);
  const [inlineQuestNotice, setInlineQuestNotice] = useState<string | null>(null);
  const [dailyQuota, setDailyQuota] = useState(() =>
    AITutorService.getDailyQuota(profile.id || 'student', profile.has_pro_pass ? 'pro' : 'free')
  );

  const refreshQuota = () => {
    setDailyQuota(
      AITutorService.getDailyQuota(profile.id || 'student', profile.has_pro_pass ? 'pro' : 'free')
    );
  };

  const handleRequestHint = async (levelToRequest: 1 | 2 | 3 = currentHintLevel) => {
    setIsRequestingHint(true);
    setHintError(null);

    try {
      const userTier = (profile.has_pro_pass || profile.role === 'admin' || profile.role === 'instructor') ? 'pro' : 'free';
      const resp = await AITutorService.requestHint({
        challenge_id: currentQuest.id,
        code,
        level: levelToRequest,
        test_passed: validationResult?.passedCount || 0,
        test_total: validationResult?.totalCount || currentQuest.test_cases.length,
        user_id: profile.id || 'student',
        tier: userTier,
      });

      setActiveHint(resp);
      setCurrentHintLevel(levelToRequest);
      setActiveTab('hints');
      setHintModalOpen(false);
      refreshQuota();
    } catch (err: any) {
      if (err.code === 'upgrade_required' || err.status === 402) {
        if (profile.has_pro_pass || profile.role === 'admin' || profile.role === 'instructor') {
          setHintError('Could not generate hint at this moment. Please try again.');
        } else {
          setHintError('Daily free hint quota reached. Upgrade to Pro for unlimited AI hints.');
        }
      } else if (err.status === 429) {
        setHintError('Maximum hint level 3 already reached for this challenge.');
      } else {
        setHintError(err.message || 'Failed to generate hint');
      }
    } finally {
      setIsRequestingHint(false);
    }
  };

  const handleStillStuck = () => {
    if (currentHintLevel < 3) {
      const nextLevel = (currentHintLevel + 1) as 1 | 2 | 3;
      handleRequestHint(nextLevel);
    }
  };

  // Sync state if questId changes
  useEffect(() => {
    setCode(SupabaseStore.getSavedCode(currentQuest.id, currentQuest.starter_code));
    setStdout('');
    setStderr('');
    setValidationResult(null);
    setActiveHint(null);
    setCurrentHintLevel(1);
    setHintError(null);
    refreshQuota();
  }, [currentQuest.id]);

  const isCompleted = Boolean(progress[currentQuest.id]?.completed);
  const isLockedPro = currentQuest.is_pro && !profile.has_pro_pass && profile.role === 'student';

  // Fast Run code without grading
  const handleRunCodeOnly = async () => {
    if (isRunning) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setStderr("Offline — you can browse, but you can't run code right now.");
      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        setMobilePane('terminal');
      }
      return;
    }
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setMobilePane('terminal');
    }
    setIsRunning(true);
    setStatusText('Compiling Python WebAssembly in browser...');
    setStderr('');

    try {
      const res = await runPython(code, (status: string) => setStatusText(status));
      setStdout(res.stdout);
      setStderr(res.stderr);
    } catch (err: unknown) {
      setStderr(err instanceof Error ? err.message : String(err));
    } finally {
      setIsRunning(false);
      setStatusText('');
    }
  };

  const [showVictoryModal, setShowVictoryModal] = useState<boolean>(false);

  const playVictoryChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 triumph
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.09);
        gain.gain.setValueAtTime(0.18, ctx.currentTime + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.09 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.09);
        osc.stop(ctx.currentTime + idx * 0.09 + 0.35);
      });
    } catch {
      // Audio context not allowed until interaction
    }
  };

  // Run & Test validation against challenge criteria
  const handleRunAndValidate = async () => {
    if (isRunning) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setStderr("Offline — submissions require connectivity to verify results against the sandbox. You can browse, but you can't run code right now.");
      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        setMobilePane('terminal');
      }
      return;
    }
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setMobilePane('terminal');
    }
    setIsRunning(true);
    setStatusText('Running automated challenge test cases...');
    setStderr('');

    try {
      const result = await runQuestTests(code, currentQuest.test_cases, (status: string) =>
        setStatusText(status)
      );
      setValidationResult(result);
      setStdout(result.stdout);
      setStderr(result.stderr);

      if (result.allPassed) {
        playVictoryChime();

        // Multi-cannon juicy confetti fireworks
        confetti({
          particleCount: 75,
          spread: 60,
          origin: { x: 0.25, y: 0.6 },
          colors: ['#38BDF8', '#34D399', '#FBBF24', '#818CF8'],
        });
        confetti({
          particleCount: 75,
          spread: 60,
          origin: { x: 0.75, y: 0.6 },
          colors: ['#38BDF8', '#34D399', '#FBBF24', '#818CF8'],
        });
        setTimeout(() => {
          confetti({
            particleCount: 120,
            spread: 90,
            origin: { x: 0.5, y: 0.5 },
            colors: ['#FBBF24', '#34D399', '#38BDF8'],
          });
        }, 200);

        // Record progress & award XP
        const { profile: updatedProfile } = SupabaseStore.recordQuestCompletion(
          currentQuest.id,
          100,
          code
        );
        setProfile(updatedProfile);
        setProgress(SupabaseStore.getProgress());
        setShowVictoryModal(true);

        // Phase 9A: Evaluate daily quest progress inline at solve time
        retentionService.checkQuestCompletion(updatedProfile.id || 'student_demo', 'solve_challenge', {
          tier: currentQuest.tier || currentQuest.level || 3,
          xp: currentQuest.xp_reward || 35,
          first_attempt: true,
        }).then((questRes) => {
          if (questRes.inline_messages && questRes.inline_messages.length > 0) {
            setInlineQuestNotice(questRes.inline_messages[0]);
            setTimeout(() => setInlineQuestNotice(null), 7000);
          }
        }).catch(() => {
          // Non-blocking
        });
      }
    } catch (err: unknown) {
      setStderr(err instanceof Error ? err.message : String(err));
    } finally {
      setIsRunning(false);
      setStatusText('');
    }
  };

  const handleClearOutput = () => {
    setStdout('');
    setStderr('');
    setValidationResult(null);
  };

  // Find next quest
  const currentIndex = QUESTS.findIndex((q) => q.id === currentQuest.id);
  const nextQuest = QUESTS[currentIndex + 1];

  return (
    <div className="flex flex-col h-[calc(100vh-65px)] bg-[#070b14] text-slate-200 overflow-hidden">
      {/* Inline Daily Quest Completion Banner (Phase 9A) */}
      {inlineQuestNotice && (
        <div className="bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 text-slate-950 font-black text-xs px-4 py-2 flex items-center justify-between shadow-lg animate-in slide-in-from-top-2 duration-300 z-30">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-slate-950" />
            <span className="tracking-wide uppercase text-[10px] bg-slate-950/20 px-2 py-0.5 rounded font-mono">Daily Quest</span>
            <span>{inlineQuestNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setInlineQuestNotice(null)}
            className="p-1 hover:bg-slate-950/10 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Workspace Sub-Header Bar: Responsive vertical list on mobile, clean bar on desktop */}
      <div className="flex flex-col md:flex-row md:items-center justify-between px-3 sm:px-4 py-2.5 bg-slate-900/95 border-b border-slate-800 gap-2.5">
        {/* Left / Top Stack: Navigation + Level + Quest Title */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <div className="flex items-center justify-between sm:justify-start gap-2.5">
            {onBackToQuests && (
              <button
                type="button"
                onClick={onBackToQuests}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-lg border border-slate-700/60 transition-colors shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-sky-400" />
                <span>Quest Map</span>
              </button>
            )}

            <div className="flex items-center gap-2">
              {currentQuest.is_boss ? (
                <>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/50 text-rose-300 flex items-center gap-1 animate-pulse">
                    <Skull className="w-3.5 h-3.5 text-rose-400" />
                    <span>FINAL BOSS</span>
                  </span>
                  <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-600/50">
                    CORE HP: 1,000
                  </span>
                </>
              ) : (
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/20 text-sky-400">
                  Level {currentQuest.level}
                </span>
              )}

              {currentQuest.is_pro && (
                <span className="text-[10px] font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-600/60 tracking-wider">
                  PRO PASS
                </span>
              )}

              {isCompleted && (
                <span className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/80 font-medium">
                  <CheckCircle2 className="w-3 h-3" />
                  <span className="hidden xs:inline">{currentQuest.is_boss ? 'Defeated' : 'Completed'}</span>
                </span>
              )}
            </div>
          </div>

          <div className="hidden sm:block h-4 w-px bg-slate-800" />

          {/* Quest Title */}
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-xs sm:text-sm font-bold text-slate-100 truncate">
              {currentQuest.title}
            </h2>
          </div>
        </div>

        {/* Right / Bottom Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {isLockedPro ? (
            <button
              type="button"
              onClick={onOpenPassModal}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-sm transition-colors"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Unlock Sovereign Creator Pass</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleRunCodeOnly}
                disabled={isRunning}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-xl border border-slate-700 transition-colors disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 text-sky-400" />
                <span>Run Code</span>
              </button>

              <button
                type="button"
                onClick={handleRunAndValidate}
                disabled={isRunning}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-1.5 text-xs font-black text-white bg-sky-500 hover:bg-sky-400 active:scale-95 rounded-xl shadow-sm shadow-sky-500/20 transition-all disabled:opacity-50"
              >
                {isRunning ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Grading Tests...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 fill-white" />
                    <span>Run &amp; Test</span>
                  </>
                )}
              </button>

              {/* [💡 Get a hint] Button */}
              <button
                type="button"
                onClick={() => {
                  setHintError(null);
                  setHintModalOpen(true);
                }}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-300 bg-amber-950/70 hover:bg-amber-900/80 border border-amber-500/50 rounded-xl shadow-sm transition-all active:scale-95"
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
                <span>💡 Hint</span>
                {dailyQuota.remaining !== 'unlimited' && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-mono font-medium">
                    {dailyQuota.remaining} left
                  </span>
                )}
              </button>
            </>
          )}

          {nextQuest && isCompleted && (
            <button
              type="button"
              onClick={() => {
                if (onBackToQuests) onBackToQuests();
              }}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-400 bg-emerald-950/40 hover:bg-emerald-900/60 rounded-xl border border-emerald-800 transition-colors ml-auto sm:ml-0"
            >
              <span>Next Level</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Mobile / Tablet Pane Selector (< 1024px) */}
      <div className="flex lg:hidden items-center justify-between px-3 py-1.5 bg-slate-900/95 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 w-full">
          <button
            type="button"
            onClick={() => setMobilePane('brief')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md font-medium transition-colors ${
              mobilePane === 'brief'
                ? 'bg-sky-500 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Briefing</span>
          </button>
          <button
            type="button"
            onClick={() => setMobilePane('editor')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md font-medium transition-colors ${
              mobilePane === 'editor'
                ? 'bg-sky-500 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Editor</span>
          </button>
          <button
            type="button"
            onClick={() => setMobilePane('terminal')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md font-medium transition-colors ${
              mobilePane === 'terminal'
                ? 'bg-sky-500 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Results</span>
            {validationResult && (
              <span
                className={`text-[10px] px-1 py-0.2 rounded font-mono font-bold ${
                  validationResult.allPassed
                    ? 'bg-emerald-400/20 text-emerald-300'
                    : 'bg-rose-400/20 text-rose-300'
                }`}
              >
                {validationResult.passedCount}/{validationResult.totalCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main 3-Pane Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden p-3 gap-3">
        {/* Left Pane: Quest Lore, Objectives, Test Expectations (cols: 4) */}
        <div className={`lg:col-span-4 flex-col bg-[#0b1120] border border-slate-800 rounded-lg overflow-hidden h-full ${
          mobilePane === 'brief' ? 'flex' : 'hidden lg:flex'
        }`}>
          {/* Pane Tab Navigation */}
          <div className="flex items-center gap-1 p-1 bg-slate-900/90 border-b border-slate-800 text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveTab('brief')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors ${
                activeTab === 'brief'
                  ? 'bg-slate-800 text-slate-100 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-sky-400" />
              <span>Mission Briefing</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('hints')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors ${
                activeTab === 'hints'
                  ? 'bg-slate-800 text-slate-100 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Hints ({currentQuest.hints.length})</span>
            </button>
          </div>

          {/* Left Pane Scrollable Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
            {activeTab === 'brief' && (
              <>
                {/* Lore Box */}
                <div className="p-3 bg-sky-950/20 border border-sky-900/40 rounded-lg">
                  <div className="flex items-center gap-1.5 text-sky-400 font-semibold mb-1">
                    <Award className="w-3.5 h-3.5" />
                    <span>Storyline Lore</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed italic">{currentQuest.lore}</p>
                </div>

                {/* Objectives */}
                <div>
                  <h4 className="font-semibold text-slate-200 mb-2 flex items-center gap-1.5 text-sm">
                    <Code className="w-4 h-4 text-emerald-400" />
                    <span>Quest Objectives</span>
                  </h4>
                  <ul className="space-y-2">
                    {currentQuest.objectives.map((obj, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 p-2 bg-slate-900/60 border border-slate-800/80 rounded"
                      >
                        <span className="w-4 h-4 rounded-full bg-slate-800 text-sky-400 flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span className="text-slate-300 leading-normal">{obj}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Test Cases Criteria */}
                <div>
                  <h4 className="font-semibold text-slate-200 mb-2 text-sm">
                    Target Output Criteria
                  </h4>
                  <div className="space-y-2">
                    {currentQuest.test_cases.map((tc, i) => (
                      <div
                        key={tc.id || i}
                        className="p-2.5 bg-slate-950/70 border border-slate-800 rounded font-mono text-[11px]"
                      >
                        <div className="text-slate-400 font-sans font-medium mb-1">
                          {tc.title}
                        </div>
                        {tc.expected_output && (
                          <div className="text-emerald-400 whitespace-pre-wrap bg-slate-900 p-1.5 rounded border border-slate-800">
                            {tc.expected_output}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-500 font-sans mt-1">
                          {tc.description}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* XP Reward & Badge Preview */}
                <div className="p-3 bg-slate-900/60 border border-slate-800 rounded flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
                      +{currentQuest.xp_reward}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-200">
                        {currentQuest.badge_title}
                      </div>
                      <div className="text-[10px] text-slate-500">Mastery Achievement</div>
                    </div>
                  </div>
                  <span className="text-[11px] text-sky-400 font-medium">
                    {currentQuest.category}
                  </span>
                </div>
              </>
            )}

            {activeTab === 'hints' && (
              <div className="space-y-4">
                {/* Active AI Tutor Hint Panel (Does NOT auto-hide) */}
                {activeHint ? (
                  <div className="p-4 bg-amber-950/30 border-2 border-amber-500/50 rounded-xl space-y-3 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                        <Lightbulb className="w-4 h-4 fill-amber-400/20" />
                        <span>AI Tutor Hint (Level {activeHint.level} of 3)</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-400/10 text-amber-300 border border-amber-400/30">
                        {activeHint.cache_hit ? '⚡ Instant Cached' : activeHint.from_fallback ? '📖 Hand-Authored Bank' : '🤖 AI Nudge'}
                      </span>
                    </div>

                    <div className="text-slate-100 font-medium leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-amber-900/40 text-xs">
                      {activeHint.hint}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-amber-900/40 text-[11px]">
                      <span className="text-slate-400">
                        Hints remaining today: <strong className="text-emerald-400">{activeHint.remaining_today === 'unlimited' ? 'Unlimited' : activeHint.remaining_today}</strong>
                      </span>

                      {currentHintLevel < 3 ? (
                        <button
                          type="button"
                          onClick={handleStillStuck}
                          disabled={isRequestingHint}
                          className="flex items-center gap-1 px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded transition-colors text-[11px] shadow-sm active:scale-95 disabled:opacity-50"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>I&apos;m still stuck → Level {currentHintLevel + 1}</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-amber-400/80 italic font-mono">
                          ✓ Final Level 3 Guidance
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl text-center space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
                      <Lightbulb className="w-5 h-5 fill-amber-400/20" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-200">Need a guided nudge?</h4>
                      <p className="text-slate-400 text-xs mt-1">
                        Get level 1 (gentle), level 2 (directional), or level 3 (specific) hints from the tutor.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setHintModalOpen(true)}
                      className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg text-xs transition-colors shadow-sm"
                    >
                      Get Level 1 Hint
                    </button>
                  </div>
                )}

                <div className="border-t border-slate-800/80 pt-3">
                  <div className="text-slate-400 font-semibold mb-2 text-xs">
                    Curated Challenge Clues:
                  </div>
                  <div className="space-y-2">
                    {currentQuest.hints.map((hint, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 bg-slate-900/60 border border-slate-800 rounded text-slate-300 text-xs"
                      >
                        <div className="text-amber-400/90 font-semibold mb-0.5 text-[11px]">Clue #{idx + 1}</div>
                        <div className="leading-relaxed">{hint}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center Pane: Monaco Editor (cols: 5) */}
        <div className={`lg:col-span-5 flex-col h-full ${
          mobilePane === 'editor' ? 'flex' : 'hidden lg:flex'
        }`}>
          <CodeEditor
            initialCode={currentQuest.starter_code}
            value={code}
            onChange={(val) => {
              setCode(val);
              SupabaseStore.saveCode(currentQuest.id, val);
            }}
            onRun={handleRunAndValidate}
            isRunning={isRunning}
            height="100%"
            className="h-full"
          />
        </div>

        {/* Right Pane: Live Terminal Console & Test Verification (cols: 4) */}
        <div className={`lg:col-span-4 flex-col h-full ${
          mobilePane === 'terminal' ? 'flex' : 'hidden lg:flex'
        }`}>
          <TerminalConsole
            stdout={stdout}
            stderr={stderr}
            isRunning={isRunning}
            statusText={statusText}
            validationResult={validationResult}
            onClear={handleClearOutput}
            className="h-full"
          />
        </div>
      </div>

      {/* Juicy Victory Modal Overlay */}
      {showVictoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
          {currentQuest.is_boss ? (
            <div className="relative w-full max-w-lg bg-gradient-to-b from-[#1c0817] via-[#100718] to-[#070b14] border-2 border-rose-500 rounded-3xl shadow-[0_0_60px_rgba(244,63,94,0.4)] p-6 sm:p-8 text-center space-y-5 overflow-hidden">
              {/* Boss Glow Ring */}
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-rose-500/25 rounded-full blur-3xl pointer-events-none" />

              <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-rose-600 via-amber-500 to-yellow-300 text-slate-950 flex items-center justify-center shadow-xl shadow-rose-600/40 text-4xl font-black animate-bounce">
                👑
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-mono font-black text-rose-300 bg-rose-950/90 border border-rose-500/60 px-3 py-1 rounded-full uppercase tracking-widest inline-block animate-pulse">
                  🏆 GAME COMPLETED • 100% FINISHED
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  You Have Defeated The Terminaltor!
                </h3>
                <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                  The rogue mainframe overseer has been eradicated from the Ose Engine core. You have solved all logic challenges and finished <strong>TERMINALTOR</strong>!
                </p>
              </div>

              {/* Studio & Tech Certificate Badge */}
              <div className="p-3.5 rounded-2xl bg-black/60 border border-rose-500/40 text-left space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-400">Official Completion Certificate:</span>
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-600/40">VERIFIED</span>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] font-mono">
                  <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800 text-center">
                    <span className="text-slate-500 text-[9px] block">STUDIO</span>
                    <strong className="text-slate-200">IRETE LABS</strong>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800 text-center">
                    <span className="text-slate-500 text-[9px] block">PRODUCT</span>
                    <strong className="text-emerald-400">TERMINALTOR</strong>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800 text-center">
                    <span className="text-slate-500 text-[9px] block">TECH</span>
                    <strong className="text-teal-300">Ose Engine</strong>
                  </div>
                </div>
              </div>

              {/* Rewards Strip */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-black/40 border border-slate-800 rounded-xl">
                <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-center">
                  <span className="text-[10px] text-rose-300 font-semibold uppercase block">Boss Bounty</span>
                  <span className="text-lg font-black text-rose-400 font-mono">+{currentQuest.xp_reward} XP</span>
                </div>
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-center">
                  <span className="text-[10px] text-amber-300 font-semibold uppercase block">Credits</span>
                  <span className="text-lg font-black text-amber-400 font-mono">🪙 +100</span>
                </div>
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-center">
                  <span className="text-[10px] text-emerald-300 font-semibold uppercase block">Game Status</span>
                  <span className="text-sm font-black text-emerald-400 font-mono">FINISHED</span>
                </div>
              </div>

              {/* Badge Unlocked */}
              <div className="p-3 bg-slate-900/90 border border-rose-500/40 rounded-xl flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-xl shrink-0">
                  💀
                </div>
                <div>
                  <div className="text-[11px] text-rose-400 font-bold uppercase">Apex Title Acquired</div>
                  <div className="text-sm font-black text-white">{currentQuest.badge_title}</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowVictoryModal(false)}
                  className="w-full sm:flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Review Final Solution
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowVictoryModal(false);
                    if (onBackToQuests) onBackToQuests();
                  }}
                  className="w-full sm:flex-1 py-3 px-4 bg-gradient-to-r from-rose-500 via-amber-500 to-yellow-400 hover:from-rose-400 hover:to-yellow-300 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-rose-500/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <span>Finish &amp; View Completion Map</span>
                  <Crown className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="relative w-full max-w-md bg-gradient-to-b from-[#0f172a] to-[#090d16] border-2 border-amber-400/80 rounded-2xl shadow-[0_0_50px_rgba(251,191,36,0.3)] p-6 text-center space-y-5 overflow-hidden">
              {/* Top Glow Ring */}
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-40 h-40 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />

              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/40 text-3xl font-black animate-bounce">
                🏆
              </div>

              <div className="space-y-1">
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
                  Level Complete
                </span>
                <h3 className="text-2xl font-black text-slate-100 tracking-tight">
                  Challenge Conquered!
                </h3>
                <p className="text-xs text-slate-400">
                  All unit test assertions verified in Pyodide WebAssembly.
                </p>
              </div>

              {/* Rewards Strip */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-center">
                  <span className="text-[10px] text-amber-300 font-semibold uppercase block">Earned XP</span>
                  <span className="text-lg font-black text-amber-400 font-mono">+{currentQuest.xp_reward} XP</span>
                </div>
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-center">
                  <span className="text-[10px] text-emerald-300 font-semibold uppercase block">Credits</span>
                  <span className="text-lg font-black text-emerald-400 font-mono">🪙 +30</span>
                </div>
                <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/30 text-center">
                  <span className="text-[10px] text-orange-300 font-semibold uppercase block">Streak</span>
                  <span className="text-lg font-black text-orange-400 font-mono">🔥 {profile.streak_days}d</span>
                </div>
              </div>

              {/* Badge Unlocked */}
              <div className="p-3 bg-slate-900 border border-emerald-500/30 rounded-xl flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-xl shrink-0">
                  🏅
                </div>
                <div>
                  <div className="text-[11px] text-emerald-400 font-bold uppercase">Badge Unlocked</div>
                  <div className="text-sm font-bold text-slate-100">{currentQuest.badge_title}</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowVictoryModal(false)}
                  className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-lg transition-colors"
                >
                  Review Solution
                </button>

                {nextQuest ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowVictoryModal(false);
                      if (onBackToQuests) onBackToQuests();
                    }}
                    className="flex-1 py-2.5 px-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs rounded-lg shadow-lg shadow-amber-400/20 transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Next Quest</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setShowVictoryModal(false);
                      if (onBackToQuests) onBackToQuests();
                    }}
                    className="flex-1 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-lg transition-all"
                  >
                    Return to Quest Map
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI Tutor Hint Request Modal (§7) */}
      {hintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Lightbulb className="w-4 h-4 fill-amber-400/20" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">AI Tutor Guided Nudge</h3>
                  <span className="text-[11px] text-slate-400">Level {currentHintLevel} of 3</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHintModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-slate-300 font-medium">
                  <span>Current Hint Level</span>
                  <span className="font-mono font-bold text-amber-400">Level {currentHintLevel} of 3</span>
                </div>
                <div className="text-[11px] text-slate-400 leading-relaxed">
                  {currentHintLevel === 1 && "Level 1: Gentle conceptual nudge pointing you in the general direction."}
                  {currentHintLevel === 2 && "Level 2: Directional clue highlighting the malfunctioning statement or loop boundary."}
                  {currentHintLevel === 3 && "Level 3: Specific actionable guidance detailing what change to make."}
                </div>
              </div>

              <div className="flex items-center justify-between px-3 py-2 bg-slate-950/40 rounded-lg border border-slate-800/80">
                <span className="text-slate-400">Hints remaining today:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {dailyQuota.remaining === 'unlimited' ? 'Unlimited (Pro Pass)' : `${dailyQuota.remaining} of ${dailyQuota.limit}`}
                </span>
              </div>

              {hintError && (
                <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-800/80 text-rose-300 flex flex-col gap-2">
                  <span>{hintError}</span>
                  {dailyQuota.remaining === 0 && onOpenPassModal && (
                    <button
                      type="button"
                      onClick={() => {
                        setHintModalOpen(false);
                        onOpenPassModal();
                      }}
                      className="py-1 px-2.5 bg-amber-400 text-slate-950 font-bold rounded text-[11px] hover:bg-amber-300 transition-colors w-fit"
                    >
                      Unlock Sovereign Creator Pass
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setHintModalOpen(false)}
                className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isRequestingHint}
                onClick={() => handleRequestHint(currentHintLevel)}
                className="flex-1 py-2.5 px-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isRequestingHint ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                    <span>Consulting Tutor...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Confirm &amp; Reveal</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspacePage;
