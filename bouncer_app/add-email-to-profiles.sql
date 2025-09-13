-- Optional: Add email field to profiles table for email-based lookups
-- Run this in your Supabase SQL editor if you want to enable email-based profile lookups

-- Add email column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Add index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Add unique constraint on email (optional - only if you want to enforce unique emails)
-- ALTER TABLE profiles ADD CONSTRAINT unique_profiles_email UNIQUE (email);

-- Update existing profiles to include email from auth.users
-- This is a one-time migration to populate existing profiles
UPDATE profiles 
SET email = auth.users.email
FROM auth.users 
WHERE profiles.id = auth.users.id 
AND profiles.email IS NULL;
