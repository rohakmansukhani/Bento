-- Fix RLS Policy for user_profiles table
-- This allows users to insert their own profiles

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can delete own profiles" ON public.user_profiles;

-- Recreate policies with correct logic
-- SELECT: Users can view their own profiles
CREATE POLICY "Users can view own profiles"
ON public.user_profiles
FOR SELECT
USING (user_id = auth.uid());

-- INSERT: Users can insert profiles for themselves
CREATE POLICY "Users can insert own profiles"
ON public.user_profiles
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- UPDATE: Users can update their own profiles
CREATE POLICY "Users can update own profiles"
ON public.user_profiles
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- DELETE: Users can delete their own profiles
CREATE POLICY "Users can delete own profiles"
ON public.user_profiles
FOR DELETE
USING (user_id = auth.uid());
