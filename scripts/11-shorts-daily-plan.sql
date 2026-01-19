
-- =====================================================
-- SHORTS DAILY PLAN MODULE
-- =====================================================

-- 1. Create helper function for admin check
CREATE OR REPLACE FUNCTION is_admin() 
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the user is present in profiles table with role 'admin'
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create shorts_plans table
CREATE TABLE IF NOT EXISTS shorts_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  editor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  shorts_per_day INTEGER DEFAULT 10,
  active_days INTEGER[] DEFAULT '{1,2,3,4,5,6,0}', -- 0=Sunday, 1=Monday...
  weekly_rate_client DECIMAL(10,2) DEFAULT 100.00,
  weekly_rate_editor DECIMAL(10,2) DEFAULT 70.00,
  currency TEXT DEFAULT 'USD',
  start_date DATE NOT NULL,
  timezone TEXT DEFAULT 'America/Argentina/Buenos_Aires',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'paused')),
  payment_mode TEXT DEFAULT 'proportional' CHECK (payment_mode IN ('proportional', 'fixed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create shorts_tasks table
CREATE TABLE IF NOT EXISTS shorts_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES shorts_plans(id) ON DELETE CASCADE NOT NULL,
  editor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'done', 'rejected')),
  due_date DATE NOT NULL,
  proof_url TEXT,
  notes TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(plan_id, due_date, title)
);

-- 4. Create weekly_closures table
CREATE TABLE IF NOT EXISTS weekly_closures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES shorts_plans(id) ON DELETE CASCADE NOT NULL,
  editor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  total_shorts_required INTEGER NOT NULL,
  total_shorts_completed INTEGER NOT NULL,
  compliance_percentage DECIMAL(5,2) NOT NULL,
  editor_payment_amount DECIMAL(10,2) NOT NULL,
  client_charge_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'confirmed', 'paid_editor', 'charged_client')),
  payment_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(plan_id, week_start_date)
);

-- 5. Enable RLS
ALTER TABLE shorts_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE shorts_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_closures ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies

-- shorts_plans
DROP POLICY IF EXISTS "Admin full access shorts_plans" ON shorts_plans;
CREATE POLICY "Admin full access shorts_plans" ON shorts_plans
  FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Editor view own plans" ON shorts_plans;
CREATE POLICY "Editor view own plans" ON shorts_plans
  FOR SELECT USING (editor_id = auth.uid());

-- shorts_tasks
DROP POLICY IF EXISTS "Admin full access shorts_tasks" ON shorts_tasks;
CREATE POLICY "Admin full access shorts_tasks" ON shorts_tasks
  FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Editor view own tasks" ON shorts_tasks;
CREATE POLICY "Editor view own tasks" ON shorts_tasks
  FOR SELECT USING (editor_id = auth.uid());

DROP POLICY IF EXISTS "Editor update own tasks" ON shorts_tasks;
CREATE POLICY "Editor update own tasks" ON shorts_tasks
  FOR UPDATE USING (editor_id = auth.uid())
  WITH CHECK (editor_id = auth.uid());

-- weekly_closures
DROP POLICY IF EXISTS "Admin full access weekly_closures" ON weekly_closures;
CREATE POLICY "Admin full access weekly_closures" ON weekly_closures
  FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Editor view own closures" ON weekly_closures;
CREATE POLICY "Editor view own closures" ON weekly_closures
  FOR SELECT USING (editor_id = auth.uid());

-- 7. Triggers for logs and updated_at

-- updated_at trigger function is assumed to exist (update_updated_at)
CREATE TRIGGER update_shorts_plans_updated_at 
  BEFORE UPDATE ON shorts_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_shorts_tasks_updated_at 
  BEFORE UPDATE ON shorts_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_weekly_closures_updated_at 
  BEFORE UPDATE ON weekly_closures
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Logging trigger
CREATE OR REPLACE FUNCTION log_shorts_activity()
RETURNS TRIGGER AS $$
DECLARE
  actor_id UUID;
  action_type TEXT;
  entity_type TEXT;
  entity_id UUID;
  details JSONB;
BEGIN
  actor_id := auth.uid();
  -- If executed by system/trigger without auth context, might need fallback or skip
  IF actor_id IS NULL THEN 
    -- Try to infer from NEW/OLD if possible, or leave NULL
    actor_id := NULL; 
  END IF;
  
  IF TG_OP = 'INSERT' THEN
    action_type := 'create';
    entity_id := NEW.id;
    details := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    action_type := 'update';
    entity_id := NEW.id;
    details := jsonb_build_object('before', OLD, 'after', NEW);
  ELSIF TG_OP = 'DELETE' THEN
    action_type := 'delete';
    entity_id := OLD.id;
    details := to_jsonb(OLD);
  END IF;

  entity_type := TG_TABLE_NAME;

  INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
  VALUES (actor_id, action_type, entity_type, entity_id, details);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS log_shorts_plans ON shorts_plans;
CREATE TRIGGER log_shorts_plans
AFTER INSERT OR UPDATE OR DELETE ON shorts_plans
FOR EACH ROW EXECUTE FUNCTION log_shorts_activity();

DROP TRIGGER IF EXISTS log_shorts_tasks ON shorts_tasks;
CREATE TRIGGER log_shorts_tasks
AFTER INSERT OR UPDATE OR DELETE ON shorts_tasks
FOR EACH ROW EXECUTE FUNCTION log_shorts_activity();

DROP TRIGGER IF EXISTS log_weekly_closures ON weekly_closures;
CREATE TRIGGER log_weekly_closures
AFTER INSERT OR UPDATE OR DELETE ON weekly_closures
FOR EACH ROW EXECUTE FUNCTION log_weekly_closures();

-- 8. Indexes
CREATE INDEX idx_shorts_plans_editor ON shorts_plans(editor_id);
CREATE INDEX idx_shorts_plans_client ON shorts_plans(client_id);
CREATE INDEX idx_shorts_tasks_plan ON shorts_tasks(plan_id);
CREATE INDEX idx_shorts_tasks_editor ON shorts_tasks(editor_id);
CREATE INDEX idx_shorts_tasks_due_date ON shorts_tasks(due_date);
CREATE INDEX idx_shorts_tasks_status ON shorts_tasks(status);
CREATE INDEX idx_weekly_closures_plan ON weekly_closures(plan_id);
CREATE INDEX idx_weekly_closures_week_start ON weekly_closures(week_start_date);

