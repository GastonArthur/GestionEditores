-- Drop todas las políticas existentes que causan recursión
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can insert users" ON public.users;
DROP POLICY IF EXISTS "Admins can update users" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can view clients" ON public.clients;
DROP POLICY IF EXISTS "Admins can manage clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can view projects" ON public.projects;
DROP POLICY IF EXISTS "Admins can manage projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Editors can update their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Admins can manage all tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can view their own reports" ON public.weekly_reports;
DROP POLICY IF EXISTS "Admins can manage reports" ON public.weekly_reports;
DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
DROP POLICY IF EXISTS "Admins can manage payments" ON public.payments;

-- Desactivar RLS temporalmente para simplificar (ya que usamos autenticación custom)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;

-- Agregar nuevos campos a la tabla tasks
ALTER TABLE public.tasks 
  ADD COLUMN IF NOT EXISTS client_name TEXT,
  ADD COLUMN IF NOT EXISTS client_phone TEXT,
  ADD COLUMN IF NOT EXISTS editor_phone TEXT,
  ADD COLUMN IF NOT EXISTS content_type TEXT,
  ADD COLUMN IF NOT EXISTS content_quantity INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS billed_amount DECIMAL(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS editor_payment DECIMAL(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS net_profit DECIMAL(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS charged_by TEXT,
  ADD COLUMN IF NOT EXISTS paid_by TEXT,
  ADD COLUMN IF NOT EXISTS payment_received BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS payment_made BOOLEAN DEFAULT false;

-- Crear usuario admin si no existe
DO $$
BEGIN
  -- Insertar usuario admin en la tabla users
  INSERT INTO public.users (id, email, full_name, role, phone)
  VALUES (
    gen_random_uuid(),
    'admin@vantum.agency',
    'Admin Vantum',
    'admin',
    NULL
  )
  ON CONFLICT (email) DO NOTHING;
END $$;
