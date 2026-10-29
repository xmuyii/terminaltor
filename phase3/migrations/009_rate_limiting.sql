-- Phase 3 Migration: Rate Limiting Schema
-- Tracks execution frequency per user and client IP

CREATE TABLE IF NOT EXISTS public.rate_limits (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_ip       TEXT,
  endpoint        TEXT NOT NULL DEFAULT '/api/v1/execute',
  request_count   INTEGER NOT NULL DEFAULT 1,
  window_start    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_request_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_rate_limits_user_endpoint UNIQUE (user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_user
  ON public.rate_limits (user_id, window_start);

CREATE INDEX IF NOT EXISTS idx_rate_limits_ip
  ON public.rate_limits (client_ip, window_start);

-- Cleanup function for stale rate limit windows
CREATE OR REPLACE FUNCTION public.cleanup_stale_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM public.rate_limits
  WHERE last_request_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;
