-- GORA: user_addresses table migration
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS user_addresses (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  label         TEXT        NOT NULL DEFAULT ''Home'',
  full_name     TEXT        NOT NULL DEFAULT '''',
  phone         TEXT        NOT NULL DEFAULT '''',
  address_line1 TEXT        NOT NULL DEFAULT '''',
  address_line2 TEXT,
  city          TEXT        NOT NULL DEFAULT '''',
  state         TEXT        NOT NULL DEFAULT ''Tamil Nadu'',
  pincode       TEXT        NOT NULL DEFAULT '''',
  is_primary    BOOLEAN     NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION enforce_single_primary_address()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary = true THEN
    UPDATE user_addresses
    SET is_primary = false
    WHERE user_id = NEW.user_id AND id <> NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS single_primary_address ON user_addresses;
CREATE TRIGGER single_primary_address
  AFTER INSERT OR UPDATE OF is_primary ON user_addresses
  FOR EACH ROW EXECUTE FUNCTION enforce_single_primary_address();

ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own addresses" ON user_addresses;
CREATE POLICY "Users manage own addresses"
  ON user_addresses FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON user_addresses(user_id);

-- ============================================================
-- Add optional profile columns (run if not already present)
-- ============================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dob DATE;
