
-- Add user_id column to companies table to make it user-specific
ALTER TABLE public.companies 
ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Update RLS policies for companies to be user-specific
DROP POLICY IF EXISTS "Anyone can view companies" ON public.companies;
DROP POLICY IF EXISTS "Authenticated users can insert companies" ON public.companies;
DROP POLICY IF EXISTS "Authenticated users can update companies" ON public.companies;

-- Create new user-specific policies
CREATE POLICY "Users can view their own companies" 
  ON public.companies 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own companies" 
  ON public.companies 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own companies" 
  ON public.companies 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own companies" 
  ON public.companies 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Remove the existing default companies since they don't have user_id
DELETE FROM public.companies WHERE user_id IS NULL;
