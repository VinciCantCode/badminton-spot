-- Add course_id and booking_url columns to public.slots table
ALTER TABLE public.slots ADD COLUMN IF NOT EXISTS course_id TEXT;
ALTER TABLE public.slots ADD COLUMN IF NOT EXISTS booking_url TEXT;
