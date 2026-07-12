-- Enable Row Level Security (RLS) on all tables explicitly
ALTER TABLE public.slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_history ENABLE ROW LEVEL SECURITY;

-- 1. Allow anyone to read the slots table (for frontend live dashboard loading)
CREATE POLICY "Allow public read slots" 
ON public.slots 
FOR SELECT 
TO public 
USING (true);

-- 2. Allow anyone to insert data into subscriptions table (for public alerts signup)
-- Note: We do not grant SELECT permissions, preventing unauthorized users from reading other subscribers' emails
CREATE POLICY "Allow public insert subscriptions" 
ON public.subscriptions 
FOR INSERT 
TO public 
WITH CHECK (true);
