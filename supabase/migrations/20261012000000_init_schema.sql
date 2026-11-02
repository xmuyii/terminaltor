-- ============================================================================
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

-- PROFILES Policies:
-- Any authenticated user can read public profile data (leaderboards, badges)
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

-- Users can only update their own profile (e.g. username, avatar)
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- QUESTS Policies:
-- Everyone can read standard (free) quests; Pro quests require has_pro_pass OR instructor/admin role
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

-- Instructors and Admins can create or modify quests
CREATE POLICY "Instructors can manage quests" 
ON public.quests FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('instructor', 'admin')
    )
);

-- USER_PROGRESS Policies:
-- Users can read their own progress; Instructors can read all progress
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

-- Users can insert/upsert their own progress submissions
CREATE POLICY "Users insert own progress" 
ON public.user_progress FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own progress" 
ON public.user_progress FOR UPDATE 
USING (auth.uid() = user_id);

-- 8. Automation Function: Automatically Create Profile on Signup
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

-- Trigger to execute on auth.users creation
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. Function & Trigger: Award XP on Quest Completion
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
