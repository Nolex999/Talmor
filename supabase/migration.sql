-- =============================================================
-- TALMOR — Supabase Database Migration
-- Run this in: Supabase Dashboard > SQL Editor > New Query
-- Safe to re-run (uses IF NOT EXISTS everywhere)
-- =============================================================

-- 1. Profiles table (user metadata + role)
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username    TEXT,
  role        TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('owner', 'admin', 'user')),
  license_key TEXT,
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Service role can do everything (for admin APIs)
DO $$ BEGIN
  CREATE POLICY "Service role full access"
    ON profiles FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Auto-create profile on signup via trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, role)
  VALUES (NEW.id, NULL, 'user')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$ BEGIN
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 2. Tickets table
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

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view own tickets"
    ON tickets FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert own tickets"
    ON tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role full access tickets"
    ON tickets FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at DESC);

-- 3. Invite codes
CREATE TABLE IF NOT EXISTS invite_codes (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code       TEXT NOT NULL UNIQUE,
  used       BOOLEAN DEFAULT FALSE NOT NULL,
  used_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role only invite codes"
    ON invite_codes FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code);

-- Add created_by column if it doesn't exist (safe for existing tables)
DO $$ BEGIN
  ALTER TABLE invite_codes ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- 3b. Invite RPCs — single source of truth for invite logic, shared by BOTH
-- the web app and the Talmor desktop app. SECURITY DEFINER lets them run with
-- table owner privileges (bypassing the "service role only" RLS above) while
-- still being safe: they only ever touch invite_codes in a controlled way.
-- Granted to `anon` so the desktop client can call them with just the anon key
-- (no service-role key is ever shipped in the desktop binary).

CREATE OR REPLACE FUNCTION public.validate_invite(p_code TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id   UUID;
  v_used BOOLEAN;
BEGIN
  IF p_code IS NULL OR length(trim(p_code)) < 6 THEN
    RETURN json_build_object('valid', false, 'error', 'Invalid code format');
  END IF;

  SELECT id, used INTO v_id, v_used
  FROM invite_codes WHERE code = upper(trim(p_code));

  IF v_id IS NULL THEN
    RETURN json_build_object('valid', false, 'error', 'Invalid invite code');
  ELSIF v_used THEN
    RETURN json_build_object('valid', false, 'error', 'This invite code has already been used');
  END IF;

  RETURN json_build_object('valid', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.consume_invite(p_code TEXT, p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id   UUID;
  v_used BOOLEAN;
BEGIN
  SELECT id, used INTO v_id, v_used
  FROM invite_codes WHERE code = upper(trim(p_code));

  IF v_id IS NULL OR v_used THEN
    RETURN json_build_object('success', false, 'error', 'Code invalid or already used');
  END IF;

  -- Atomic guard: only claim the code if it is still unused.
  UPDATE invite_codes
  SET used = true, used_by = p_user_id
  WHERE id = v_id AND used = false;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Code already used');
  END IF;

  RETURN json_build_object('success', true);
END;
$$;

REVOKE ALL ON FUNCTION public.validate_invite(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.consume_invite(TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_invite(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_invite(TEXT, UUID) TO anon, authenticated;

-- 4. Backfill profiles for existing users who signed up before the trigger
INSERT INTO profiles (id, username, role)
SELECT id, NULL, 'user' FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;

-- 5. Set n0lex9999@gmail.com as owner (upsert — creates profile if missing)
INSERT INTO profiles (id, username, role)
SELECT id, NULL, 'owner' FROM auth.users WHERE email = 'n0lex9999@gmail.com'
ON CONFLICT (id) DO UPDATE SET role = 'owner';

-- Generate 10 random invite codes (24 chars, uppercase, no vowels for readability)
INSERT INTO invite_codes (code)
SELECT upper(substring(
  replace(replace(replace(replace(replace(
    md5(random()::text || clock_timestamp()::text),
    'A',''), 'E',''), 'I',''), 'O',''), 'U',''),
1, 24))
FROM generate_series(1, 10)
ON CONFLICT DO NOTHING;
