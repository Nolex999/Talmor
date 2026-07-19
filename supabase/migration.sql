-- =============================================================
-- TALMOR — Supabase Database Migration
-- Run this in: Supabase Dashboard > SQL Editor > New Query
-- =============================================================

-- 1. Create tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_email TEXT NOT NULL,
  category   TEXT NOT NULL DEFAULT 'general',
  subject    TEXT NOT NULL,
  message    TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'replied', 'closed')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Enable Row Level Security
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- 3. Users can only SELECT their own tickets
CREATE POLICY "Users can view own tickets"
  ON tickets FOR SELECT
  USING (auth.uid() = user_id);

-- 4. Users can only INSERT their own tickets
CREATE POLICY "Users can insert own tickets"
  ON tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 5. Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at DESC);

-- =============================================================
-- INVITE CODES
-- =============================================================

CREATE TABLE IF NOT EXISTS invite_codes (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code       TEXT NOT NULL UNIQUE,
  used       BOOLEAN DEFAULT FALSE NOT NULL,
  used_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;

-- Only service role can read/write invite codes (no anon access)
CREATE POLICY "Service role only"
  ON invite_codes FOR ALL
  USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code);

-- Generate 10 random invite codes (24 chars each, alphanumeric)
INSERT INTO invite_codes (code)
SELECT substring(
  replace(
    replace(
      replace(
        replace(
          replace(
            md5(random()::text || clock_timestamp()::text),
            'a', ''), 'e', ''), 'i', ''), 'o', ''), 'u', ''),
  1, 24)
FROM generate_series(1, 10);
