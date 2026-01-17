-- This script creates the admin user
-- First, we need to create the user in auth.users using Supabase's auth system

-- Create admin user in Supabase Auth
-- Email: admin@vantum.agency
-- Password: 1234
-- Username: VantumAgency

-- Insert or update the admin user in public.users
-- Note: The user_id should match the auth.users id created above
-- This is a manual step that needs the actual UUID from auth.users

-- For now, we'll create a function to handle admin creation
CREATE OR REPLACE FUNCTION public.create_admin_user(
  admin_email TEXT,
  admin_username TEXT,
  admin_full_name TEXT,
  admin_password TEXT
)
RETURNS TEXT AS $$
DECLARE
  new_user_id UUID;
BEGIN
  -- This would typically be done via Supabase Auth API
  -- For now, return instructions
  RETURN 'Please create user via Supabase Dashboard: Email: ' || admin_email || ', Username: ' || admin_username || ', Password: ' || admin_password;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Call the function (for documentation purposes)
SELECT public.create_admin_user(
  'admin@vantum.agency',
  'VantumAgency',
  'Vantum Agency Admin',
  '1234'
);
