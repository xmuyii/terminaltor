-- Phase 1 Schema Migration: Core Execution Loop
-- Creates profiles, challenges, submissions tables with RLS and triggers

-- 1. Profiles Table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL UNIQUE,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Challenges Table (20 hand-authored challenges)
CREATE TABLE IF NOT EXISTS public.challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    tier SMALLINT NOT NULL CHECK (tier >= 1 AND tier <= 10),
    topic TEXT NOT NULL,
    starter_code TEXT NOT NULL,
    test_spec JSONB NOT NULL DEFAULT '[]'::jsonb,
    evaluation_spec JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Submissions Table (Execution audit & idempotency guard)
CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    passed BOOLEAN NOT NULL DEFAULT FALSE,
    execution_ms INT NOT NULL DEFAULT 0,
    stdout TEXT NOT NULL DEFAULT '',
    stderr TEXT NOT NULL DEFAULT '',
    results JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_user_challenge_submission UNIQUE (user_id, challenge_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_submissions_user_created ON public.submissions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_challenges_tier ON public.challenges(tier);

-- Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Profiles: Public read, Self update
CREATE POLICY "Profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Challenges: Public read
CREATE POLICY "Challenges are viewable by all authenticated users"
    ON public.challenges FOR SELECT
    USING (true);

-- Submissions: Self read + Self insert only
CREATE POLICY "Users can view their own submissions"
    ON public.submissions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own submissions"
    ON public.submissions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Trigger: auto-insert profile row on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, avatar_url, created_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url',
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
