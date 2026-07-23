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

-- CREATE TABLE IF NOT EXISTS does not add new columns to an older table.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS license_key TEXT;

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

-- RLS limits rows, not columns. Without column grants, users could update
-- their own role to owner or choose their own activation key. Only username
-- is client-editable; trusted SECURITY DEFINER functions manage license_key.
REVOKE INSERT, UPDATE ON TABLE profiles FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE profiles TO authenticated;
GRANT INSERT (id, username) ON TABLE profiles TO authenticated;
GRANT UPDATE (username) ON TABLE profiles TO authenticated;

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

-- Replace the bootstrap profile trigger with the complete registration
-- transaction. The invite is claimed in the SAME transaction as auth.users,
-- so a race cannot create an account without consuming a valid invite.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite TEXT := upper(trim(COALESCE(NEW.raw_user_meta_data->>'invite_code', '')));
BEGIN
  IF length(v_invite) < 6 THEN
    RAISE EXCEPTION 'Invitation code is required';
  END IF;

  UPDATE invite_codes
  SET used = true, used_by = NEW.id
  WHERE code = v_invite AND used = false;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation code is invalid or already used';
  END IF;

  INSERT INTO profiles (id, username, role)
  VALUES (
    NEW.id,
    NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'username', '')), ''),
    'user'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 3b. Invite validation RPC. Consumption is intentionally not exposed as a
-- client RPC; handle_new_user claims the invite atomically during signup.

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

REVOKE ALL ON FUNCTION public.validate_invite(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_invite(TEXT) TO anon, authenticated;

-- Remove the old unauthenticated consume endpoint on existing deployments.
DROP FUNCTION IF EXISTS public.consume_invite(TEXT, UUID);

-- 3c. Activation keys — every user generates their OWN activation key on the
-- website. The desktop app requires it as a second step after email/password
-- login. The key is stored in profiles.license_key. Format: 16-char base36
-- (lowercase a-z + 0-9), e.g. 0fx3dfc49g384vm3.

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_license_key
ON profiles (license_key)
WHERE license_key IS NOT NULL AND license_key <> '';

CREATE OR REPLACE FUNCTION public.generate_activation_key()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid      UUID := auth.uid();
  v_existing TEXT;
  v_key      TEXT := '';
  v_alphabet TEXT := '0123456789abcdefghijklmnopqrstuvwxyz';
  v_bytes    BYTEA := uuid_send(gen_random_uuid());
  i          INT;
BEGIN
  IF v_uid IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- The signup trigger normally creates this row. The upsert makes the RPC
  -- resilient for accounts created before that trigger existed.
  INSERT INTO profiles (id) VALUES (v_uid) ON CONFLICT (id) DO NOTHING;

  -- Lock the row so two simultaneous requests cannot return different keys.
  SELECT license_key INTO v_existing
  FROM profiles
  WHERE id = v_uid
  FOR UPDATE;
  IF v_existing IS NOT NULL AND length(v_existing) > 0 THEN
    RETURN json_build_object('success', true, 'key', v_existing, 'existing', true);
  END IF;

  FOR i IN 0..15 LOOP
    v_key := v_key || substr(v_alphabet, 1 + (get_byte(v_bytes, i) % 36), 1);
  END LOOP;

  UPDATE profiles SET license_key = v_key WHERE id = v_uid;
  RETURN json_build_object('success', true, 'key', v_key, 'existing', false);
END;
$$;

-- Remove the earlier user-id-taking signature if this migration was already
-- run. Validation must always target the currently authenticated user.
DROP FUNCTION IF EXISTS public.validate_activation_key(UUID, TEXT);

CREATE OR REPLACE FUNCTION public.validate_activation_key(p_key TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_key TEXT;
BEGIN
  IF v_uid IS NULL THEN
    RETURN json_build_object('valid', false, 'error', 'Not authenticated');
  END IF;

  IF p_key IS NULL OR trim(p_key) !~ '^[0-9A-Za-z]{16}$' THEN
    RETURN json_build_object('valid', false,
      'error', 'Activation keys must be 16 letters or numbers');
  END IF;

  SELECT license_key INTO v_key FROM profiles WHERE id = v_uid;

  IF v_key IS NULL OR length(v_key) = 0 THEN
    RETURN json_build_object('valid', false,
      'error', 'No activation key found. Generate one on the Talmor website first.');
  END IF;

  IF lower(trim(p_key)) = lower(v_key) THEN
    RETURN json_build_object('valid', true);
  END IF;

  RETURN json_build_object('valid', false, 'error', 'Incorrect activation key');
END;
$$;

REVOKE ALL ON FUNCTION public.generate_activation_key() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.validate_activation_key(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.generate_activation_key() TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_activation_key(TEXT) TO authenticated;

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
