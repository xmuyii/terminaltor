-- ============================================================================
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
