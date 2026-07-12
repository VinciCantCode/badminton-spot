-- Add unsubscribe_token column to subscriptions table (with auto-generated random UUID)
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS unsubscribe_token UUID NOT NULL DEFAULT gen_random_uuid();

-- Create unique index on unsubscribe_token for fast lookup and integrity
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_token ON public.subscriptions(unsubscribe_token);
