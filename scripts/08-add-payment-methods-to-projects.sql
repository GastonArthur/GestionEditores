-- Add payment methods columns to projects table

ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS currency TEXT CHECK (currency IN ('ARS', 'USD')) DEFAULT 'ARS',
ADD COLUMN IF NOT EXISTS payment_method_in TEXT, -- Client -> Me (Ingresos)
ADD COLUMN IF NOT EXISTS payment_method_out TEXT; -- Me -> Client/Editor (Egresos)

-- Add comments for clarity
COMMENT ON COLUMN public.projects.payment_method_in IS 'Payment method for client payments to admin (Ingresos)';
COMMENT ON COLUMN public.projects.payment_method_out IS 'Payment method for admin payments to others (Egresos)';
