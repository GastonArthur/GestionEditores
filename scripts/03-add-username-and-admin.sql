-- Add username column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Create index for username lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);

-- Create function to authenticate with username or email
CREATE OR REPLACE FUNCTION public.authenticate_user(identifier TEXT, user_password TEXT)
RETURNS TABLE (
  user_id UUID,
  user_email TEXT,
  user_role TEXT
) AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Check if identifier is username or email
  SELECT u.id, u.email, u.role 
  INTO user_record
  FROM public.users u
  WHERE u.email = identifier OR u.username = identifier
  LIMIT 1;
  
  IF user_record.id IS NOT NULL THEN
    RETURN QUERY SELECT user_record.id, user_record.email, user_record.role;
  END IF;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create admin user in auth.users (you'll need to run this manually or through Supabase dashboard)
-- The password will be hashed by Supabase Auth
-- This is a placeholder - actual user creation will be done via Supabase Auth API

-- Insert admin user profile (assuming the auth user exists)
-- Note: This will be executed after creating the auth user
INSERT INTO public.users (id, email, username, full_name, role, phone)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid, -- Placeholder ID, will be updated
  'admin@vantum.agency',
  'VantumAgency',
  'Vantum Agency Admin',
  'admin',
  NULL
)
ON CONFLICT (email) DO UPDATE
SET username = 'VantumAgency',
    role = 'admin';
