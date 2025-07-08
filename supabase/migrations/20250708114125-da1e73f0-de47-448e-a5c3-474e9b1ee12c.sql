
-- Add user_name and user_mobile columns to vehicle_entries table
ALTER TABLE public.vehicle_entries 
ADD COLUMN user_name TEXT,
ADD COLUMN user_mobile TEXT;

-- Add name and mobile fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN name TEXT,
ADD COLUMN mobile TEXT;

-- Update the handle_new_user function to include name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email, name)
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
    )
  );
  RETURN new;
END;
$$;
