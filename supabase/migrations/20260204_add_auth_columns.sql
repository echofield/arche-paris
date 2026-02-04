-- Add missing authentication columns to cards table
ALTER TABLE cards ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS failed_attempts INTEGER DEFAULT 0;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
