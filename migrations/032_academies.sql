-- Migration 032: Academies (Academy Alliances B2B2C Subscriptions)
-- Represents an institutional alliance entity paying a flat monthly seat-capped subscription.

CREATE TABLE IF NOT EXISTS academies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  owner_id UUID NOT NULL,
  join_code VARCHAR(32) NOT NULL UNIQUE,
  subscription_plan VARCHAR(32) NOT NULL CHECK (subscription_plan IN ('premium', 'pro')),
  subscription_status VARCHAR(32) NOT NULL DEFAULT 'pending' CHECK (subscription_status IN ('pending', 'active', 'lapsed', 'cancelled')),
  paystack_subscription_code VARCHAR(128) UNIQUE,
  paystack_customer_code VARCHAR(128),
  seat_cap INTEGER NOT NULL DEFAULT 30 CHECK (seat_cap > 0),
  billing_email VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_academies_owner ON academies(owner_id);
CREATE INDEX IF NOT EXISTS idx_academies_join_code ON academies(join_code);
CREATE INDEX IF NOT EXISTS idx_academies_sub_code ON academies(paystack_subscription_code);
