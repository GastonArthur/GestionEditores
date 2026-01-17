-- =============================================
-- SCHEMA COMPLETO: Sistema de Gestión de Edición de Video
-- =============================================

-- Eliminar tablas existentes si existen (en orden de dependencias)
DROP TABLE IF EXISTS project_contents CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- =============================================
-- TABLA: profiles (usuarios del sistema)
-- =============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  alias TEXT,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('admin', 'editor')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLA: clients (clientes)
-- =============================================
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  company TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLA: projects (proyectos/trabajos)
-- =============================================
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  editor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'en_proceso', 'entregado', 'cerrado')),
  start_date DATE,
  due_date DATE,
  -- Facturación (solo visible para admin)
  billed_amount DECIMAL(12,2) DEFAULT 0,
  billed_by TEXT,
  payment_received BOOLEAN DEFAULT false,
  payment_received_date DATE,
  -- Pago al editor
  editor_payment DECIMAL(12,2) DEFAULT 0,
  payment_method TEXT,
  payment_made BOOLEAN DEFAULT false,
  payment_made_date DATE,
  -- Calculado
  net_profit DECIMAL(12,2) GENERATED ALWAYS AS (billed_amount - editor_payment) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLA: project_contents (contenido de cada proyecto)
-- =============================================
CREATE TABLE project_contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('reels', 'youtube', 'tiktok', 'shorts', 'logo_banner', 'guion', 'video_corporativo', 'videoclip', 'otro')),
  quantity INTEGER DEFAULT 1,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLA: tasks (tareas)
-- =============================================
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  editor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  priority TEXT DEFAULT 'media' CHECK (priority IN ('baja', 'media', 'alta', 'urgente')),
  status TEXT DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'en_proceso', 'completada')),
  due_date DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ÍNDICES
-- =============================================
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_projects_client ON projects(client_id);
CREATE INDEX idx_projects_editor ON projects(editor_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_tasks_editor ON tasks(editor_id);
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_project_contents_project ON project_contents(project_id);

-- =============================================
-- FUNCIÓN: actualizar updated_at automáticamente
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- PROFILES: todos pueden ver, solo actualizar el propio
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- CLIENTS: solo admin puede CRUD
CREATE POLICY "clients_admin_all" ON clients FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "clients_editor_select" ON clients FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'editor')
);

-- PROJECTS: admin ve todo, editor solo los suyos
CREATE POLICY "projects_admin_all" ON projects FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "projects_editor_select" ON projects FOR SELECT USING (
  editor_id = auth.uid()
);

-- PROJECT_CONTENTS: sigue las mismas reglas que projects
CREATE POLICY "project_contents_admin_all" ON project_contents FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "project_contents_editor_select" ON project_contents FOR SELECT USING (
  EXISTS (SELECT 1 FROM projects WHERE id = project_id AND editor_id = auth.uid())
);

-- TASKS: admin CRUD completo, editor solo puede actualizar estado de sus tareas
CREATE POLICY "tasks_admin_all" ON tasks FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "tasks_editor_select" ON tasks FOR SELECT USING (
  editor_id = auth.uid()
);
CREATE POLICY "tasks_editor_update" ON tasks FOR UPDATE USING (
  editor_id = auth.uid()
) WITH CHECK (
  editor_id = auth.uid()
);

-- =============================================
-- VISTA SEGURA: proyectos para editores (sin montos de facturación)
-- =============================================
CREATE OR REPLACE VIEW editor_projects_view AS
SELECT 
  p.id,
  p.title,
  p.description,
  p.client_id,
  c.name as client_name,
  p.editor_id,
  p.status,
  p.start_date,
  p.due_date,
  p.editor_payment,
  p.payment_method,
  p.payment_made,
  p.payment_made_date,
  p.created_at,
  p.updated_at
FROM projects p
LEFT JOIN clients c ON c.id = p.client_id
WHERE p.editor_id = auth.uid();

-- =============================================
-- FUNCIÓN: crear perfil automáticamente al registrarse
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'editor')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil automáticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
