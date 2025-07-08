
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

-- Update the handle_new_user function to include mobile from signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email, name, mobile)
  VALUES (
    new.id,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    new.email,
    COALESCE(
      new.raw_user_meta_data ->> 'full_name',
      CONCAT(
        COALESCE(new.raw_user_meta_data ->> 'first_name', ''),
        CASE 
          WHEN new.raw_user_meta_data ->> 'first_name' IS NOT NULL AND new.raw_user_meta_data ->> 'last_name' IS NOT NULL 
          THEN ' ' 
          ELSE '' 
        END,
        COALESCE(new.raw_user_meta_data ->> 'last_name', '')
      )
    ),
    new.raw_user_meta_data ->> 'mobile'
  );
  RETURN new;
END;
$$;

-- Remove any existing companies without user_id (they were global)
DELETE FROM public.companies WHERE user_id IS NULL;
