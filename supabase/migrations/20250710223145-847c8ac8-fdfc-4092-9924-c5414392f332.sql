-- Add missing INSERT policy for profiles table
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Add policy to allow admins to view all profiles (for future admin functionality)
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND type = 'admin'
  ) 
  OR auth.uid() = user_id
);