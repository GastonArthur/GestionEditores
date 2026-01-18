
-- Add default rates to projects for easier task creation
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS default_price DECIMAL(10,2), -- Default client price per unit
ADD COLUMN IF NOT EXISTS default_editor_price DECIMAL(10,2); -- Default editor price per unit

-- Add comment
COMMENT ON COLUMN projects.default_price IS 'Default price to charge client per unit of work';
COMMENT ON COLUMN projects.default_editor_price IS 'Default price to pay editor per unit of work';
