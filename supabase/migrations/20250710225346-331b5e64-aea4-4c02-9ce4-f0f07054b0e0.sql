-- Fix infinite recursion in profiles RLS policies
-- Drop the problematic policy that causes circular dependency
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create a simpler policy structure without circular reference
-- Users can always view their own profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can always insert their own profile
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Note: We removed the admin-specific policy to avoid recursion
-- Admin access will be handled at the application level after profile fetch