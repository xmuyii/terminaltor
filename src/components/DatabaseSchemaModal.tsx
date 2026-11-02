import React, { useState } from 'react';
import { X, Copy, Check, Database, ShieldCheck, Terminal, FileCode2 } from 'lucide-react';

const SQL_MIGRATION_SCRIPT = `-- ============================================================================
-- SOVEREIGN ACADEMY: SUPABASE DATABASE MIGRATION SCRIPT
-- Tables: profiles, quests, user_progress
-- Includes ENUMs, Triggers, RLS Security Policies, and Seed Data
-- ============================================================================

-- 1. Create User Role ENUM
CREATE TYPE user_role AS ENUM ('student', 'instructor', 'admin');

-- 2. Create PROFILES Table (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL UNIQUE,
    role user_role NOT NULL DEFAULT 'student',
    xp_points INTEGER NOT NULL DEFAULT 0 CHECK (xp_points >= 0),
    has_pro_pass BOOLEAN NOT NULL DEFAULT FALSE,
    streak_days INTEGER NOT NULL DEFAULT 1,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

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
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    quest_id UUID NOT NULL REFERENCES public.quests(id) ON DELETE CASCADE,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    score INTEGER NOT NULL DEFAULT 0 CHECK (score >= 0),
    submitted_code TEXT,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    CONSTRAINT unique_user_quest UNIQUE (user_id, quest_id)
);

-- 5. Indexes for High-Performance Queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_quests_level ON public.quests(level);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_quest_id ON public.user_progress(quest_id);

-- 6. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- 7. Row Level Security Policies
-- Profiles: public read, user self-update
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Quests: Public free quests, Pro quests gated by pass
CREATE POLICY "Quests are viewable by appropriate tier" 
ON public.quests FOR SELECT 
USING (
    is_pro = FALSE 
    OR (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND (profiles.has_pro_pass = TRUE OR profiles.role IN ('instructor', 'admin'))
        )
    )
);

-- User Progress: Owner and instructors can read
CREATE POLICY "Users view own progress, instructors view all" 
ON public.user_progress FOR SELECT 
USING (
    auth.uid() = user_id 
    OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('instructor', 'admin')
    )
);

CREATE POLICY "Users insert own progress" 
ON public.user_progress FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own progress" 
ON public.user_progress FOR UPDATE 
USING (auth.uid() = user_id);

-- 8. Auto-create profile trigger on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, role, xp_points, has_pro_pass)
    VALUES (
        new.id, 
        COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)), 
        'student', 
        0, 
        FALSE
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. Award XP upon quest completion trigger
CREATE OR REPLACE FUNCTION public.award_xp_on_completion()
RETURNS TRIGGER AS $$
DECLARE
    quest_xp INTEGER;
BEGIN
    IF NEW.completed = TRUE AND (OLD.completed IS NULL OR OLD.completed = FALSE) THEN
        SELECT xp_reward INTO quest_xp FROM public.quests WHERE id = NEW.quest_id;
        IF quest_xp IS NOT NULL THEN
            UPDATE public.profiles 
            SET xp_points = xp_points + quest_xp,
                updated_at = NOW()
            WHERE id = NEW.user_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_quest_completed
    AFTER INSERT OR UPDATE OF completed ON public.user_progress
    FOR EACH ROW EXECUTE FUNCTION public.award_xp_on_completion();
`;

const ENV_LOCAL_TEMPLATE = `# .env.local
NEXT_PUBLIC_SUPABASE_URL="https://your-project-ref.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
PAYSTACK_SECRET_KEY="sk_live_..."
PAYSTACK_PUBLIC_KEY="pk_live_..."
`;

interface DatabaseSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DatabaseSchemaModal: React.FC<DatabaseSchemaModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'sql' | 'env' | 'tables'>('sql');
  const [copied, setCopied] = useState(false);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-[#0b1120] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                Supabase PostgreSQL Schema &amp; Security Architecture
              </h3>
              <p className="text-xs text-slate-400">
                Production-ready migrations, RLS policies, triggers, and connection parameters.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleCopy(activeTab === 'sql' ? SQL_MIGRATION_SCRIPT : ENV_LOCAL_TEMPLATE)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard' : 'Copy'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex items-center gap-2 px-6 py-2.5 bg-slate-950 border-b border-slate-800 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('sql')}
            className={`px-3 py-1.5 rounded transition-colors ${
              activeTab === 'sql'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            SQL Migration Script
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tables')}
            className={`px-3 py-1.5 rounded transition-colors ${
              activeTab === 'tables'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Table Specifications
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('env')}
            className={`px-3 py-1.5 rounded transition-colors ${
              activeTab === 'env'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Environment (.env.local)
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#080d19]">
          {activeTab === 'sql' && (
            <pre className="font-mono text-xs text-sky-200 bg-slate-950 p-4 rounded-xl border border-slate-800 leading-relaxed overflow-x-auto select-text">
              {SQL_MIGRATION_SCRIPT}
            </pre>
          )}

          {activeTab === 'tables' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
                  <Database className="w-4 h-4" />
                  <span>public.profiles</span>
                </div>
                <p className="text-slate-300">
                  Extends Supabase auth.users. Stores student role, username, cumulative XP points, streak counters, and Sovereign Creator Pass entitlement.
                </p>
                <div className="font-mono text-[11px] text-slate-400 bg-slate-950 p-2.5 rounded">
                  id (uuid, PK), username (text, unique), role (user_role enum), xp_points (int), has_pro_pass (boolean), streak_days (int), created_at (timestamp)
                </div>
              </div>

              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <FileCode2 className="w-4 h-4" />
                  <span>public.quests</span>
                </div>
                <p className="text-slate-300">
                  Defines logic challenges, starter code templates, unit assertion scripts, lore briefings, and is_pro gating flag.
                </p>
                <div className="font-mono text-[11px] text-slate-400 bg-slate-950 p-2.5 rounded">
                  id (uuid, PK), level (int, unique), title (text), description (text), starter_code (text), test_cases (jsonb), xp_reward (int), is_pro (boolean)
                </div>
              </div>

              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                  <ShieldCheck className="w-4 h-4" />
                  <span>public.user_progress</span>
                </div>
                <p className="text-slate-300">
                  Records individual quest completions, submission timestamps, highest score, and saved Python source code.
                </p>
                <div className="font-mono text-[11px] text-slate-400 bg-slate-950 p-2.5 rounded">
                  id (uuid, PK), user_id (FK to profiles.id), quest_id (FK to quests.id), completed (boolean), score (int), submitted_code (text), completed_at (timestamp)
                </div>
              </div>
            </div>
          )}

          {activeTab === 'env' && (
            <div className="space-y-4 text-xs">
              <p className="text-slate-300">
                To connect to your live Supabase project, create a <code className="text-sky-400 font-mono">.env.local</code> file in your repository root with these keys:
              </p>
              <pre className="font-mono text-xs text-amber-300 bg-slate-950 p-4 rounded-xl border border-slate-800 leading-relaxed overflow-x-auto select-text">
                {ENV_LOCAL_TEMPLATE}
              </pre>
              <div className="p-3 bg-sky-950/30 border border-sky-800/50 rounded-lg text-slate-300">
                <div className="font-bold text-sky-400 mb-1">Zero-Friction Fallback Note:</div>
                <p>
                  TERMINALTOR includes an intelligent client-side bridge that provides instant local state persistence even before your Supabase credentials are plugged in. Once configured, requests transparently synchronize to your cloud PostgreSQL instance!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DatabaseSchemaModal;
