-- PROPER SUPABASE WAY: Automatic Profile Creation with Database Triggers
-- Run this in your Supabase SQL Editor to replace the manual profile creation

-- Step 1: Create the trigger function that creates profiles automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert the new profile with only the fields that exist in your profiles table
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    qr_code_data
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.id::text  -- Use user ID as QR code data
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Step 2: Create the trigger that fires when new users are created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 3: Set up RLS policies for profiles (if not already done)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- Create proper RLS policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Step 4: Create profiles for existing users who don't have them yet
-- (This is a one-time migration for existing users)
INSERT INTO public.profiles (id, email, full_name, qr_code_data)
SELECT 
  au.id,
  au.email,
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    split_part(au.email, '@', 1)
  ) as full_name,
  au.id::text as qr_code_data
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;  -- Only create profiles for users who don't have them yet

-- Confirmation message
SELECT 'Automatic profile creation set up successfully! New users will get profiles automatically.' as status;
