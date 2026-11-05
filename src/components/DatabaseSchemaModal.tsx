import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  Database,
  ShieldCheck,
  Terminal,
  FileCode2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Wifi,
  WifiOff,
  UploadCloud,
} from 'lucide-react';
import {
  isSupabaseConfigured,
  getSupabaseConfig,
  testSupabaseConnection,
  SupabaseStore,
} from '../lib/supabase';

const SQL_MIGRATION_SCRIPT = `-- ============================================================================
-- TERMINALTOR: SUPABASE DATABASE MIGRATION SCRIPT
-- Tables: profiles, quests, user_progress
-- Supports Telegram handles, Google accounts, and custom cadet IDs
-- ============================================================================

-- 1. Create User Role ENUM (if not exists)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('student', 'instructor', 'teacher', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create PROFILES Table (Supports Cadet IDs, Google, and Telegram identities)
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    xp_points INTEGER NOT NULL DEFAULT 0 CHECK (xp_points >= 0),
    has_pro_pass BOOLEAN NOT NULL DEFAULT FALSE,
    streak_days INTEGER NOT NULL DEFAULT 1,
    avatar_url TEXT,
    telegram_username TEXT,
    google_email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Ensure columns exist if table was already created
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS telegram_username TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS google_email TEXT;

-- 3. Create QUESTS Table (Curriculum challenges & test suites)
CREATE TABLE IF NOT EXISTS public.quests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level INTEGER NOT NULL UNIQUE,
    title TEXT NOT NULL,
    subtitle TEXT,
    category TEXT NOT NULL DEFAULT 'Fundamentals',
    description TEXT NOT NULL,
    lore TEXT,
    objectives JSONB NOT NULL DEFAULT '[]'::jsonb,
    starter_code TEXT NOT NULL,
    solution_code TEXT,
    hints JSONB NOT NULL DEFAULT '[]'::jsonb,
    test_cases JSONB NOT NULL DEFAULT '[]'::jsonb,
    xp_reward INTEGER NOT NULL DEFAULT 100 CHECK (xp_reward > 0),
    badge_title TEXT NOT NULL DEFAULT 'Cadet',
    is_pro BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Create USER_PROGRESS Table (Student submissions & grades)
CREATE TABLE IF NOT EXISTS public.user_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    quest_id TEXT NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    score INTEGER NOT NULL DEFAULT 0 CHECK (score >= 0),
    submitted_code TEXT,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    CONSTRAINT unique_user_quest UNIQUE (user_id, quest_id)
);

-- 5. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- 6. Row Level Security Policies (Allow client read/write with anon key)
DROP POLICY IF EXISTS "Allow public read profiles" ON public.profiles;
CREATE POLICY "Allow public read profiles" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert profiles" ON public.profiles;
CREATE POLICY "Allow public insert profiles" ON public.profiles FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update profiles" ON public.profiles;
CREATE POLICY "Allow public update profiles" ON public.profiles FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public read quests" ON public.quests;
CREATE POLICY "Allow public read quests" ON public.quests FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read progress" ON public.user_progress;
CREATE POLICY "Allow public read progress" ON public.user_progress FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert progress" ON public.user_progress;
CREATE POLICY "Allow public insert progress" ON public.user_progress FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update progress" ON public.user_progress;
CREATE POLICY "Allow public update progress" ON public.user_progress FOR UPDATE USING (true);
`;

const ENV_LOCAL_TEMPLATE = `# .env or environment configuration
VITE_SUPABASE_URL="https://your-project-ref.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
`;

interface DatabaseSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DatabaseSchemaModal: React.FC<DatabaseSchemaModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'diagnostics' | 'sql' | 'env' | 'tables'>('diagnostics');
  const [copied, setCopied] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    configured: boolean;
    url: string;
    connected: boolean;
    profilesAccessible: boolean;
    message: string;
    errorDetail?: string;
  } | null>(null);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const config = getSupabaseConfig();

  useEffect(() => {
    if (isOpen) {
      setSyncFeedback(null);
      runDiagnostic();
    }
  }, [isOpen]);

  const runDiagnostic = async () => {
    setIsTesting(true);
    try {
      const res = await testSupabaseConnection();
      setTestResult(res);
    } finally {
      setIsTesting(false);
    }
  };

  const handleForceSyncProfile = async () => {
    setSyncFeedback(null);
    try {
      const prof = SupabaseStore.getProfile();
      SupabaseStore.updateProfile(prof);
      setSyncFeedback(`Triggered live sync for cadet: ${prof.username} (${prof.id})`);
      setTimeout(runDiagnostic, 1200);
    } catch (e: any) {
      setSyncFeedback(`Sync failed: ${e.message}`);
    }
  };

  if (!isOpen) return null;

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#0b1120] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-slate-100 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                Supabase Database Connection &amp; Diagnostics
              </h3>
              <p className="text-xs text-slate-400">
                Verify live cloud sync, check credentials, and deploy SQL migrations.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleCopy(activeTab === 'sql' ? SQL_MIGRATION_SCRIPT : ENV_LOCAL_TEMPLATE)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy SQL'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex items-center gap-2 px-6 py-2.5 bg-slate-950 border-b border-slate-800 text-xs font-medium overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('diagnostics')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'diagnostics'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>Connection Diagnostics</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sql')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'sql'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>SQL Migration Script</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tables')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'tables'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5" />
            <span>Table Schema</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('env')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'env'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Environment Config</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#070b14] space-y-6">
          {activeTab === 'diagnostics' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Status Header Box */}
              <div
                className={`p-5 rounded-2xl border ${
                  testResult?.connected
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                    : config.isConfigured
                    ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                    : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {testResult?.connected ? (
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                    )}
                    <div>
                      <h4 className="text-sm font-bold">
                        {testResult?.connected
                          ? 'Supabase Cloud Connected & Syncing'
                          : config.isConfigured
                          ? 'Supabase Credentials Found, Checking Connectivity...'
                          : 'Supabase Not Connected (Operating in Local Mode)'}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {testResult?.message ||
                          'Testing connection to your remote Supabase PostgreSQL project...'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={runDiagnostic}
                    disabled={isTesting}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shrink-0 transition-all"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                    <span>Run Connection Test</span>
                  </button>
                </div>
              </div>

              {/* Configuration Checklist */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
                  <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                    Project URL (VITE_SUPABASE_URL)
                  </span>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-200 truncate max-w-[240px]">
                      {config.url || 'Not configured'}
                    </span>
                    {config.url && !config.url.includes('your-project') ? (
                      <span className="text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded text-[10px]">
                        Configured
                      </span>
                    ) : (
                      <span className="text-amber-400 font-bold bg-amber-950/60 px-2 py-0.5 rounded text-[10px]">
                        Missing
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
                  <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                    Anon Key (VITE_SUPABASE_ANON_KEY)
                  </span>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-200">
                      {config.hasKey ? '••••••••••••••••••••' : 'Not configured'}
                    </span>
                    {config.hasKey ? (
                      <span className="text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded text-[10px]">
                        Configured
                      </span>
                    ) : (
                      <span className="text-amber-400 font-bold bg-amber-950/60 px-2 py-0.5 rounded text-[10px]">
                        Missing
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Why Tables Might Be Empty */}
              <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <span>Why your Supabase wasn't filling up:</span>
                </h4>
                <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside leading-relaxed">
                  <li>
                    <strong>Local Offline Store:</strong> Until credentials are provided, TERMINALTOR stores cadet profiles, points, and quest progress in high-performance browser storage (<code className="text-sky-400">localStorage</code>) and server files so the game never lags.
                  </li>
                  <li>
                    <strong>Missing Table Columns:</strong> If you ran the original schema, the <code className="text-emerald-400">public.profiles</code> table was missing <code className="text-sky-400">telegram_username</code> and <code className="text-sky-400">google_email</code>, causing Supabase to reject updates.
                  </li>
                  <li>
                    <strong>Row-Level Security (RLS):</strong> Supabase tables need permissive RLS policies so client requests using the anon key can insert and update cadet profiles.
                  </li>
                </ul>

                <div className="pt-2 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('sql')}
                    className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>View &amp; Copy Updated SQL Migration</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleForceSyncProfile}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer transition-all border border-slate-700"
                  >
                    <UploadCloud className="w-3.5 h-3.5 text-sky-400" />
                    <span>Sync Current Profile to Supabase Now</span>
                  </button>
                </div>

                {syncFeedback && (
                  <div className="text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 p-2.5 rounded-xl">
                    {syncFeedback}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'sql' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 bg-sky-950/30 border border-sky-500/30 rounded-xl text-xs text-sky-300 leading-relaxed">
                <strong>How to Run This Migration:</strong> Open your Supabase Dashboard &rarr; Click <strong>SQL Editor</strong> &rarr; Click <strong>New Query</strong> &rarr; Paste this script &rarr; Click <strong>Run</strong>.
              </div>
              <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed">
                {SQL_MIGRATION_SCRIPT}
              </pre>
            </div>
          )}

          {activeTab === 'tables' && (
            <div className="space-y-4 animate-in fade-in duration-200 text-xs text-slate-300">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <h5 className="font-bold text-emerald-400">1. public.profiles</h5>
                <p className="text-slate-400">
                  Holds cadet identity, callsign, role, XP points, streak, Google email, and Telegram handle.
                </p>
                <div className="font-mono text-[11px] text-slate-400">
                  id (TEXT, PK) • username (TEXT) • role (user_role) • xp_points (INT) • has_pro_pass (BOOL) • telegram_username (TEXT) • google_email (TEXT)
                </div>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <h5 className="font-bold text-sky-400">2. public.user_progress</h5>
                <p className="text-slate-400">
                  Tracks quest submissions, test outcomes, completed flags, and submitted code.
                </p>
                <div className="font-mono text-[11px] text-slate-400">
                  id (UUID, PK) • user_id (TEXT, FK) • quest_id (TEXT) • completed (BOOL) • score (INT) • submitted_code (TEXT)
                </div>
              </div>
            </div>
          )}

          {activeTab === 'env' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2 text-xs">
                <h5 className="font-bold text-slate-200">Client-Side Environment Setup</h5>
                <p className="text-slate-400 leading-relaxed">
                  In Vite applications, client environment variables must be prefixed with <code className="text-emerald-400">VITE_</code>.
                </p>
              </div>
              <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed">
                {ENV_LOCAL_TEMPLATE}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DatabaseSchemaModal;
