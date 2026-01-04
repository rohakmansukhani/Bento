-- =====================================================
-- Bento: User Profiles Table (Multi-Profile Vault)
-- =====================================================
-- This table stores user-defined privacy profiles.
-- Each user can have multiple profiles (Work, Personal, etc.)
-- Only one profile can be active at a time per user.

-- Drop existing table if recreating
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- Create user_profiles table
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Profile Metadata
    name TEXT NOT NULL,
    icon_name TEXT DEFAULT 'User',
    color TEXT DEFAULT 'text-zinc-400',
    description TEXT DEFAULT 'Custom user profile',
    is_active BOOLEAN DEFAULT false,
    
    -- The 7 Core Allowances (Privacy Toggles)
    redact_email BOOLEAN DEFAULT true,
    redact_phone BOOLEAN DEFAULT true,
    redact_names BOOLEAN DEFAULT true,
    redact_payment BOOLEAN DEFAULT true,
    redact_location BOOLEAN DEFAULT true,
    redact_credentials BOOLEAN DEFAULT true,
    
    -- Custom Keywords Array
    custom_keywords TEXT[] DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_user_profile_name UNIQUE(user_id, name),
    CONSTRAINT valid_profile_name CHECK(length(name) > 0 AND length(name) <= 100)
);

-- Create index for fast user lookups
CREATE INDEX idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX idx_user_profiles_active ON public.user_profiles(user_id, is_active) WHERE is_active = true;

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================
-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own profiles
CREATE POLICY "Users can view own profiles"
    ON public.user_profiles
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own profiles
CREATE POLICY "Users can create own profiles"
    ON public.user_profiles
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own profiles
CREATE POLICY "Users can update own profiles"
    ON public.user_profiles
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own profiles
CREATE POLICY "Users can delete own profiles"
    ON public.user_profiles
    FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- Trigger: Ensure Only One Active Profile Per User
-- =====================================================
CREATE OR REPLACE FUNCTION enforce_single_active_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- If setting a profile to active, deactivate all others for this user
    IF NEW.is_active = true THEN
        UPDATE public.user_profiles
        SET is_active = false, updated_at = NOW()
        WHERE user_id = NEW.user_id 
          AND id != NEW.id 
          AND is_active = true;
    END IF;
    
    -- Update the updated_at timestamp
    NEW.updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_single_active_profile
    BEFORE INSERT OR UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION enforce_single_active_profile();

-- =====================================================
-- Helper Function: Get Active Profile
-- =====================================================
CREATE OR REPLACE FUNCTION get_active_profile(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    icon_name TEXT,
    color TEXT,
    redact_email BOOLEAN,
    redact_phone BOOLEAN,
    redact_names BOOLEAN,
    redact_payment BOOLEAN,
    redact_location BOOLEAN,
    redact_credentials BOOLEAN,
    custom_keywords TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.id,
        up.name,
        up.icon_name,
        up.color,
        up.redact_email,
        up.redact_phone,
        up.redact_names,
        up.redact_payment,
        up.redact_location,
        up.redact_credentials,
        up.custom_keywords
    FROM public.user_profiles up
    WHERE up.user_id = p_user_id 
      AND up.is_active = true
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Sample Data (Optional - for testing)
-- =====================================================
-- Uncomment to insert test profiles for a specific user
-- Replace 'YOUR_USER_ID_HERE' with actual UUID from auth.users

-- INSERT INTO public.user_profiles (user_id, name, icon_name, color, is_active, redact_email, redact_phone, redact_names, redact_payment, redact_location, redact_credentials, custom_keywords)
-- VALUES 
--     ('YOUR_USER_ID_HERE', 'Work', 'Briefcase', 'text-blue-400', true, true, true, true, true, true, true, ARRAY['Project X', 'Confidential']),
--     ('YOUR_USER_ID_HERE', 'Personal', 'Home', 'text-emerald-400', false, false, false, false, true, false, true, ARRAY[]::TEXT[]);

-- =====================================================
-- Verification Queries
-- =====================================================
-- Check table structure
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'user_profiles' 
-- ORDER BY ordinal_position;

-- Check RLS policies
-- SELECT * FROM pg_policies WHERE tablename = 'user_profiles';

-- Count profiles per user
-- SELECT user_id, COUNT(*) as profile_count, 
--        SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as active_count
-- FROM public.user_profiles
-- GROUP BY user_id;
