
-- Add purchase_date to base_ingredients
ALTER TABLE public.base_ingredients ADD COLUMN IF NOT EXISTS purchase_date timestamp with time zone DEFAULT NULL;

-- Add payment_date to workers
ALTER TABLE public.workers ADD COLUMN IF NOT EXISTS payment_date timestamp with time zone DEFAULT NULL;

-- Add source tracking columns to transactions for sync
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS source_id text DEFAULT NULL;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS source_type text DEFAULT NULL;

-- Allow users to update their own transactions (needed for sync)
CREATE POLICY "Users can update their own transactions"
ON public.transactions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
