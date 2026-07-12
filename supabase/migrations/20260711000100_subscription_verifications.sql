-- Create subscription_verifications table for temporary verification codes (Scheme A: Overwrite mechanism)
CREATE TABLE IF NOT EXISTS public.subscription_verifications (
    email TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    locations TEXT[] NOT NULL DEFAULT '{}',
    weekdays TEXT[] NOT NULL DEFAULT '{}',
    start_time_min TIME NOT NULL DEFAULT '00:00:00',
    start_time_max TIME NOT NULL DEFAULT '23:59:59',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

-- Enable Row Level Security (RLS)
-- Note: We do NOT create any public policies for this table. Only our secure backend Vercel functions 
-- (which use the service_role key) can read, write, or delete rows here. This keeps verification codes 100% secure.
ALTER TABLE public.subscription_verifications ENABLE ROW LEVEL SECURITY;
