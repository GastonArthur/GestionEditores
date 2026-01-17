-- =====================================================
-- SISTEMA DE GESTIÓN DE EDITORES DE VIDEO
-- SQL COMPLETO PARA SUPABASE
-- Copiar y pegar en el SQL Editor de Supabase
-- =====================================================

-- PASO 1: ELIMINAR TABLAS EXISTENTES
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS project_comments CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS project_templates CASCADE;
DROP TABLE IF EXISTS user_permissions CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- PASO 2: CREAR TABLA DE PERFILES (usuarios)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('admin', 'editor')),
  payment_frequency TEXT DEFAULT 'semanal' CHECK (payment_frequency IN ('diario', 'semanal', 'quincenal', 'mensual', 'por_proyecto')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PASO 3: CREAR TABLA DE PERMISOS DE SECCIONES
CREATE TABLE user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  section_key TEXT NOT NULL,
  can_view BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, section_key)
);

-- PASO 4: CREAR TABLA DE CLIENTES
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PASO 5: CREAR TABLA DE PROYECTOS
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PASO 6: CREAR TABLA DE TAREAS (trabajos de edición)
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  editor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  content_type TEXT,
  content_quantity INTEGER DEFAULT 1,
  billed_amount DECIMAL(10,2) DEFAULT 0,
  editor_payment DECIMAL(10,2) DEFAULT 0,
  net_profit DECIMAL(10,2) DEFAULT 0,
  billed_by TEXT,
  paid_by TEXT,
  payment_received BOOLEAN DEFAULT false,
  payment_made BOOLEAN DEFAULT false,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PASO 7: CREAR TABLA DE LOGS DE ACTIVIDAD
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  entity_name TEXT,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PASO 8: CREAR INDICES PARA OPTIMIZACIÓN
CREATE INDEX idx_tasks_editor ON tasks(editor_id);
CREATE INDEX idx_tasks_client ON tasks(client_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at DESC);
CREATE INDEX idx_user_permissions_user ON user_permissions(user_id);

-- PASO 9: FUNCIÓN PARA ACTUALIZAR updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- PASO 10: TRIGGERS PARA updated_at
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_clients_updated_at 
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_tasks_updated_at 
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_projects_updated_at 
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- PASO 11: DESHABILITAR RLS (simplifica el desarrollo)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs DISABLE ROW LEVEL SECURITY;

-- PASO 12: CREAR USUARIO ADMIN (username: admin, password: admin)
INSERT INTO profiles (username, password_hash, full_name, role, is_active)
VALUES ('admin', 'admin', 'Administrador', 'admin', true);

-- PASO 13: CREAR 3 EDITORES DE PRUEBA
INSERT INTO profiles (username, password_hash, full_name, email, phone, role, payment_frequency, is_active)
VALUES 
  ('carlos', 'carlos123', 'Carlos Martínez', 'carlos@editores.com', '+54 9 11 2345-6789', 'editor', 'semanal', true),
  ('maria', 'maria123', 'María González', 'maria@editores.com', '+54 9 11 3456-7890', 'editor', 'quincenal', true),
  ('juan', 'juan123', 'Juan López', 'juan@editores.com', '+54 9 11 4567-8901', 'editor', 'mensual', true);

-- PASO 14: CREAR 10 CLIENTES DE PRUEBA
INSERT INTO clients (name, email, phone, company, notes, is_active)
VALUES 
  ('Tech Solutions SA', 'contacto@techsolutions.com', '+54 9 11 5000-1000', 'Tech Solutions', 'Cliente premium - pagos mensuales', true),
  ('Digital Marketing Pro', 'info@digitalmp.com', '+54 9 11 5000-2000', 'DM Pro', 'Requiere entregas rápidas', true),
  ('Content Creators Inc', 'hello@contentcreators.com', '+54 9 11 5000-3000', 'CC Inc', 'Videos educativos', true),
  ('Social Media Agency', 'team@socialmedia.com', '+54 9 11 5000-4000', 'SMA', 'Especialistas en TikTok', true),
  ('E-commerce Masters', 'ventas@ecommerce.com', '+54 9 11 5000-5000', 'E-Masters', 'Videos de productos', true),
  ('Fitness Online', 'coach@fitnessonline.com', '+54 9 11 5000-6000', 'FitOnline', 'Tutoriales de ejercicios', true),
  ('Food Bloggers United', 'contact@foodbloggers.com', '+54 9 11 5000-7000', 'FBU', 'Recetas y reseñas', true),
  ('Travel Vloggers', 'trips@travelvlog.com', '+54 9 11 5000-8000', 'TravelVlog', 'Documentales de viajes', true),
  ('Gaming Channel Pro', 'admin@gamingpro.com', '+54 9 11 5000-9000', 'GamePro', 'Gameplays y reviews', true),
  ('Music Production Co', 'studio@musicpro.com', '+54 9 11 5000-0000', 'MusicPro', 'Videoclips musicales', true);

-- PASO 15: CREAR TAREAS DE PRUEBA
DO $$
DECLARE
    carlos_id UUID;
    maria_id UUID;
    juan_id UUID;
    client1_id UUID;
    client2_id UUID;
    client3_id UUID;
    client4_id UUID;
    client5_id UUID;
BEGIN
    SELECT id INTO carlos_id FROM profiles WHERE username = 'carlos';
    SELECT id INTO maria_id FROM profiles WHERE username = 'maria';
    SELECT id INTO juan_id FROM profiles WHERE username = 'juan';
    
    SELECT id INTO client1_id FROM clients WHERE company = 'Tech Solutions';
    SELECT id INTO client2_id FROM clients WHERE company = 'DM Pro';
    SELECT id INTO client3_id FROM clients WHERE company = 'CC Inc';
    SELECT id INTO client4_id FROM clients WHERE company = 'SMA';
    SELECT id INTO client5_id FROM clients WHERE company = 'E-Masters';
    
    -- Tareas para Carlos (pago semanal)
    INSERT INTO tasks (title, description, editor_id, client_id, status, content_type, content_quantity, billed_amount, editor_payment, net_profit, billed_by, paid_by, payment_received, payment_made)
    VALUES
    ('Videos Corporativos', 'Pack de 5 videos institucionales', carlos_id, client1_id, 'pending', 'Videos Corporativos', 5, 15000, 9000, 6000, 'Transferencia', 'Efectivo', true, false),
    ('Reels Instagram', 'Serie de 10 reels para campaña', carlos_id, client2_id, 'in_progress', 'Reels', 10, 8000, 5000, 3000, 'MercadoPago', 'Transferencia', false, false),
    ('Tutorial Producto', 'Video explicativo de 3 minutos', carlos_id, client5_id, 'completed', 'Tutorial', 1, 5000, 3000, 2000, 'Efectivo', 'Efectivo', true, true);
    
    -- Tareas para María (pago quincenal)
    INSERT INTO tasks (title, description, editor_id, client_id, status, content_type, content_quantity, billed_amount, editor_payment, net_profit, billed_by, paid_by, payment_received, payment_made)
    VALUES
    ('Videos Educativos', 'Pack de 8 videos educativos', maria_id, client3_id, 'in_progress', 'Videos Educativos', 8, 12000, 7500, 4500, 'Transferencia', 'MercadoPago', true, false),
    ('TikToks Viral', 'Edición de 15 TikToks', maria_id, client4_id, 'pending', 'TikToks', 15, 9000, 6000, 3000, 'MercadoPago', 'Transferencia', false, false),
    ('Shorts YouTube', 'Pack de 20 Shorts', maria_id, client2_id, 'completed', 'Shorts', 20, 10000, 6500, 3500, 'Transferencia', 'Efectivo', true, true);
    
    -- Tareas para Juan (pago mensual)
    INSERT INTO tasks (title, description, editor_id, client_id, status, content_type, content_quantity, billed_amount, editor_payment, net_profit, billed_by, paid_by, payment_received, payment_made)
    VALUES
    ('Video Productos', 'Videos de productos para tienda', juan_id, client5_id, 'pending', 'Videos Productos', 12, 18000, 11000, 7000, 'Transferencia', 'Transferencia', false, false),
    ('Edición Videoclip', 'Videoclip musical profesional', juan_id, client1_id, 'in_progress', 'Videoclip', 1, 25000, 15000, 10000, 'Efectivo', 'Efectivo', true, false),
    ('Campaña Publicitaria', 'Pack de 6 videos publicitarios', juan_id, client4_id, 'completed', 'Videos Publicitarios', 6, 20000, 13000, 7000, 'Transferencia', 'MercadoPago', true, true);
END $$;

-- PASO 16: VISTA PARA ESTADÍSTICAS DEL DASHBOARD
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM tasks WHERE status != 'completed' AND status != 'cancelled') as pending_tasks,
  (SELECT COUNT(*) FROM tasks WHERE status = 'completed') as completed_tasks,
  (SELECT COALESCE(SUM(billed_amount), 0) FROM tasks WHERE payment_received = true) as total_income,
  (SELECT COALESCE(SUM(editor_payment), 0) FROM tasks WHERE payment_made = true) as total_expenses,
  (SELECT COALESCE(SUM(net_profit), 0) FROM tasks WHERE payment_received = true) as total_profit,
  (SELECT COUNT(*) FROM profiles WHERE role = 'editor' AND is_active = true) as active_editors,
  (SELECT COUNT(*) FROM clients WHERE is_active = true) as active_clients,
  (SELECT COALESCE(SUM(editor_payment), 0) FROM tasks WHERE payment_made = false AND status = 'completed') as pending_payments;

-- =====================================================
-- FIN DEL SCRIPT
-- Usuario admin: admin / admin
-- Editores: carlos/carlos123, maria/maria123, juan/juan123
-- =====================================================
