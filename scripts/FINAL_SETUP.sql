-- =====================================================
-- SISTEMA DE GESTIÓN DE EDITORES DE VIDEO - SCRIPT DEFINITIVO
-- COPIAR Y PEGAR TODO ESTE CONTENIDO EN EL SQL EDITOR DE SUPABASE
-- ESTE SCRIPT REINICIA Y CONFIGURA TODA LA BASE DE DATOS CORRECTAMENTE
-- =====================================================

-- PASO 1: LIMPIEZA TOTAL (CUIDADO: BORRA TODOS LOS DATOS)
DROP VIEW IF EXISTS dashboard_stats;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS project_comments CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS project_templates CASCADE;
DROP TABLE IF EXISTS user_permissions CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE; -- Por si se creó con el otro script

-- PASO 2: CREAR TABLA DE PERFILES (Usuarios del sistema)
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

-- PASO 4: CREAR TABLA DE CLIENTES (Opcional, el sistema permite texto libre también)
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

-- PASO 6: CREAR TABLA DE TAREAS (Principal tabla de trabajo)
-- Adaptada para soportar tanto el modelo relacional como el des-normalizado del frontend actual
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Campos opcionales o legacy
  title TEXT, 
  description TEXT,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  
  -- Relaciones y Datos directos (Soporte híbrido)
  editor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  
  -- Campos usados por el formulario actual
  client_name TEXT,
  client_phone TEXT,
  editor_phone TEXT,
  
  -- Estado y detalles del trabajo
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  content_type TEXT,
  content_quantity INTEGER DEFAULT 1,
  due_date DATE,
  
  -- Finanzas
  billed_amount DECIMAL(10,2) DEFAULT 0,
  editor_payment DECIMAL(10,2) DEFAULT 0,
  net_profit DECIMAL(10,2) DEFAULT 0,
  
  -- Métodos de pago
  charged_by TEXT, -- Antes billed_by
  paid_by TEXT,
  
  -- Estado de pagos
  payment_received BOOLEAN DEFAULT false,
  payment_made BOOLEAN DEFAULT false,
  
  -- Metadatos
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

-- PASO 8: CREAR INDICES
CREATE INDEX idx_tasks_editor ON tasks(editor_id);
CREATE INDEX idx_tasks_client ON tasks(client_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_created ON tasks(created_at DESC);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at DESC);

-- PASO 9: TRIGGER PARA UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- PASO 10: DESHABILITAR RLS (Para evitar problemas de permisos con auth custom)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs DISABLE ROW LEVEL SECURITY;

-- PASO 11: DATOS INICIALES - USUARIO ADMIN
INSERT INTO profiles (username, password_hash, full_name, role, is_active)
VALUES ('admin', 'admin', 'Administrador Principal', 'admin', true);

-- PASO 12: DATOS DE PRUEBA - EDITORES
INSERT INTO profiles (username, password_hash, full_name, email, phone, role, payment_frequency, is_active)
VALUES 
  ('carlos', 'carlos123', 'Carlos Martínez', 'carlos@editores.com', '+54 9 11 2345-6789', 'editor', 'semanal', true),
  ('maria', 'maria123', 'María González', 'maria@editores.com', '+54 9 11 3456-7890', 'editor', 'quincenal', true),
  ('juan', 'juan123', 'Juan López', 'juan@editores.com', '+54 9 11 4567-8901', 'editor', 'mensual', true);

-- PASO 13: DATOS DE PRUEBA - CLIENTES
INSERT INTO clients (name, email, phone, company, notes, is_active)
VALUES 
  ('Tech Solutions SA', 'contacto@techsolutions.com', '+54 9 11 5000-1000', 'Tech Solutions', 'Cliente premium', true),
  ('Digital Marketing Pro', 'info@digitalmp.com', '+54 9 11 5000-2000', 'DM Pro', 'Entregas rápidas', true);

-- PASO 14: DATOS DE PRUEBA - TAREAS
-- Insertamos tareas usando la estructura compatible
DO $$
DECLARE
    carlos_id UUID;
    maria_id UUID;
    client1_id UUID;
    client2_id UUID;
BEGIN
    SELECT id INTO carlos_id FROM profiles WHERE username = 'carlos';
    SELECT id INTO maria_id FROM profiles WHERE username = 'maria';
    SELECT id INTO client1_id FROM clients WHERE company = 'Tech Solutions';
    SELECT id INTO client2_id FROM clients WHERE company = 'DM Pro';
    
    -- Tarea 1
    INSERT INTO tasks (
        title, editor_id, client_id, client_name, status, 
        content_type, content_quantity, billed_amount, editor_payment, net_profit, 
        charged_by, paid_by, payment_received, payment_made
    ) VALUES (
        'Pack Videos Corp', carlos_id, client1_id, 'Tech Solutions SA', 'pending',
        'Videos Corporativos', 5, 15000, 9000, 6000,
        'Transferencia', 'Efectivo', true, false
    );

    -- Tarea 2
    INSERT INTO tasks (
        title, editor_id, client_id, client_name, status, 
        content_type, content_quantity, billed_amount, editor_payment, net_profit, 
        charged_by, paid_by, payment_received, payment_made
    ) VALUES (
        'Reels Campaña', maria_id, client2_id, 'Digital Marketing Pro', 'completed',
        'Reels', 10, 8000, 5000, 3000,
        'MercadoPago', 'Transferencia', true, true
    );
END $$;

-- PASO 15: VISTA DE ESTADÍSTICAS
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
