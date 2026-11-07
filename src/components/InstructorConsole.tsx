import React, { useState } from 'react';
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  Play,
  Clock,
  Sparkles,
  Award,
  Shield,
  Layers,
  GraduationCap,
  KeyRound,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { QUESTS } from '../data/quests';
import { runQuestTests } from '../lib/pyodide';
import { Profile } from '../types';
import { telegramAuth } from '../lib/telegramAuth';

interface InstructorConsoleProps {
  currentProfile: Profile;
  onSelectQuest: (questId: string) => void;
  onNavigateToSignup?: () => void;
  onProfileUpdated?: (updatedProfile: Profile) => void;
  onBackToApp?: () => void;
}

export const InstructorConsole: React.FC<InstructorConsoleProps> = ({
  currentProfile,
  onSelectQuest,
  onNavigateToSignup,
  onProfileUpdated,
  onBackToApp,
}) => {
  const [runningBatch, setRunningBatch] = useState(false);
  const [batchResults, setBatchResults] = useState<Record<string, { passed: boolean; time: number; error?: string }>>({});
  const [passcodeInput, setPasscodeInput] = useState('');
  const [passcodeError, setPasscodeError] = useState<string | null>(null);

  const isInstructor =
    currentProfile.role === 'instructor' || currentProfile.role === 'teacher' || currentProfile.role === 'admin';

  const handleVerifyPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcodeInput.trim()) return;
    const res = telegramAuth.verifyInstructorPasscode(passcodeInput);
    if (!res.success) {
      setPasscodeError(res.message);
    } else {
      setPasscodeError(null);
      const updated: Profile = {
        ...currentProfile,
        role: 'instructor',
      };
      onProfileUpdated?.(updated);
    }
  };

  const handleRunBatchVerification = async () => {
    setRunningBatch(true);
    const results: Record<string, { passed: boolean; time: number; error?: string }> = {};

    for (const quest of QUESTS) {
      try {
        const codeToTest = quest.solution_code || quest.starter_code;
        const res = await runQuestTests(codeToTest, quest.test_cases);
        results[quest.id] = {
          passed: res.allPassed,
          time: res.executionTimeMs,
        };
      } catch (err: unknown) {
        results[quest.id] = {
          passed: false,
          time: 0,
          error: err instanceof Error ? err.message : String(err),
        };
      }
    }

    setBatchResults(results);
    setRunningBatch(false);
  };

  // Restrict access if not verified instructor
  if (!isInstructor) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6 bg-[#070b14]">
        <div className="max-w-xl w-full p-8 bg-[#0b1120] border-2 border-slate-800 rounded-3xl text-center space-y-6 shadow-2xl">
          {onBackToApp && (
            <button
              type="button"
              onClick={onBackToApp}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer self-start"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </button>
          )}

          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-400">
            <GraduationCap className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white">Instructor Access Restricted</h2>
            <p className="text-sm text-slate-400 max-w-lg mx-auto">
              The Instructor Console is reserved for verified teachers, academy staff, and institutional coordinators to grade submissions, supervise cohorts, and inspect telemetry.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left pt-2">
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                <KeyRound className="w-4 h-4 text-sky-400" />
                <span>Method 1: School Passcode</span>
              </div>
              <p className="text-xs text-slate-400">
                Enter the instructor passcode provided by your academic institution.
              </p>

              <form onSubmit={handleVerifyPasscode} className="space-y-2">
                <input
                  type="text"
                  value={passcodeInput}
                  onChange={(e) => setPasscodeInput(e.target.value)}
                  placeholder="e.g. INSTRUCTOR2026"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono uppercase"
                />
                <button
                  type="submit"
                  className="w-full py-2 bg-sky-500 hover:bg-sky-400 active:scale-95 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Verify as Instructor
                </button>
                {passcodeError && (
                  <p className="text-xs text-rose-400 mt-1">{passcodeError}</p>
                )}
                <div className="text-[11px] text-slate-500 font-mono">
                  Master Code: <code className="text-slate-300">INSTRUCTOR2026</code>
                </div>
              </form>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span>Method 2: Register Academy</span>
                </div>
                <p className="text-xs text-slate-400">
                  School owners subscribing to an Academy Alliance (⭐️ 675 Stars/mo flat) receive automatic Instructor &amp; Owner credentials.
                </p>
              </div>

              <button
                type="button"
                onClick={onNavigateToSignup}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Register Academy Alliance</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Console Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-sky-400 uppercase tracking-widest bg-sky-500/10 border border-sky-500/30 px-2 py-0.5 rounded">
              VERIFIED INSTRUCTOR
            </span>
            <span className="text-xs text-slate-400 font-mono">Teacher ID: {currentProfile.id}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight">
            Academic Curriculum &amp; Batch Engine
          </h1>
          <p className="text-xs text-slate-400">
            Execute batch test verification across Python levels and manage enrolled cadet cohorts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onBackToApp && (
            <button
              type="button"
              onClick={onBackToApp}
              className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              Back to Home
            </button>
          )}

          <button
            type="button"
            onClick={handleRunBatchVerification}
            disabled={runningBatch}
            className="flex items-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-400 active:scale-95 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
          >
            {runningBatch ? (
              <>
                <Clock className="w-4 h-4 animate-spin" />
                <span>Running Batch Tests...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Run Batch Test Suite</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Curriculum Health & Batch Verification Status */}
      <div className="p-6 bg-[#0a0f1d] border border-slate-800 rounded-xl shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-400" />
              <span>Curriculum Test Suite Verification</span>
            </h3>
            <p className="text-xs text-slate-400">
              Evaluates canonical solution code against test cases inside browser WebAssembly.
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-800 border border-slate-800 rounded-lg overflow-hidden bg-slate-950/60">
          {QUESTS.map((quest) => {
            const result = batchResults[quest.id];

            return (
              <div
                key={quest.id}
                className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sky-400 font-bold">L{quest.level}</span>
                  <div>
                    <div className="font-bold text-slate-200">{quest.title}</div>
                    <div className="text-[11px] text-slate-400">
                      {quest.test_cases.length} test assertions · {quest.xp_reward} XP
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {result ? (
                    <div className="flex items-center gap-2">
                      {result.passed ? (
                        <span className="flex items-center gap-1 text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800 text-[11px] font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>All Assertions Passed ({result.time}ms)</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800 text-[11px] font-semibold">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Fail: {result.error || 'Assertion Mismatch'}</span>
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-500 font-mono">Pending Batch Run</span>
                  )}

                  <button
                    type="button"
                    onClick={() => onSelectQuest(quest.id)}
                    className="px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors cursor-pointer"
                  >
                    Open Editor
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Student Roster Table */}
      <div className="p-6 bg-[#0a0f1d] border border-slate-800 rounded-xl shadow-lg space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <span>Student Performance Cohort</span>
          </h3>
          <p className="text-xs text-slate-400">
            Real-time telemetry synced with Supabase <code className="text-sky-400 font-mono">public.user_progress</code>.
          </p>
        </div>

        <div className="p-8 text-center bg-slate-950/40 border border-slate-800 rounded-xl space-y-2">
          <Users className="w-8 h-8 text-slate-500 mx-auto" />
          <div className="font-bold text-slate-300 text-sm">No Enrolled Cadets in this Class Yet</div>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Once cadets register or enter your cohort join code, their live XP, solve milestones, and test performance will display here.
          </p>
        </div>
      </div>
    </div>
  );
};

export default InstructorConsole;
