
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_date timestamp with time zone DEFAULT NULL,
ADD COLUMN IF NOT EXISTS advances jsonb NOT NULL DEFAULT '[]'::jsonb;
