-- Add username column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Create index for username lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);

-- Note: To create the admin user, you need to:
-- 1. Sign up through the app with email: admin@vantum.agency and password: 1234
-- 2. Then run this query to update your role and username:
--
-- UPDATE public.users 
-- SET username = 'VantumAgency', role = 'admin' 
-- WHERE email = 'admin@vantum.agency';
