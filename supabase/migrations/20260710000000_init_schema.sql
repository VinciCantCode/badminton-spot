-- Create slots table (to store court availability)
CREATE TABLE IF NOT EXISTS public.slots (
    event_id TEXT PRIMARY KEY,
    event_name TEXT NOT NULL,
    location_name TEXT NOT NULL,
    date_desc TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    spots TEXT NOT NULL,
    spots_count INTEGER NOT NULL DEFAULT 0,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    button_text TEXT NOT NULL,
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create subscriptions table (to store user alert criteria)
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id BIGSERIAL PRIMARY KEY,
    email TEXT NOT NULL,
    locations TEXT[] NOT NULL DEFAULT '{}',
    weekdays TEXT[] NOT NULL DEFAULT '{}',
    start_time_min TIME NOT NULL DEFAULT '00:00:00',
    start_time_max TIME NOT NULL DEFAULT '23:59:59',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on subscriptions email and slots start_time for fast lookup
CREATE INDEX IF NOT EXISTS idx_subscriptions_email ON public.subscriptions(email);
CREATE INDEX IF NOT EXISTS idx_slots_start_time ON public.slots(start_time);

-- Create alert_history table (to track sent alerts and avoid duplicates)
CREATE TABLE IF NOT EXISTS public.alert_history (
    id BIGSERIAL PRIMARY KEY,
    subscription_id BIGINT REFERENCES public.subscriptions(id) ON DELETE CASCADE,
    event_id TEXT REFERENCES public.slots(event_id) ON DELETE CASCADE,
    spots_count INTEGER NOT NULL,
    notified_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create unique index to prevent duplicate notifications for the same subscription + event + spot count configuration
CREATE UNIQUE INDEX IF NOT EXISTS idx_alert_history_unique ON public.alert_history(subscription_id, event_id, spots_count);
