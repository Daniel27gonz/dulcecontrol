-- Create base_ingredients table for user's ingredient catalog
CREATE TABLE public.base_ingredients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  purchase_unit TEXT NOT NULL,
  presentation_quantity NUMERIC NOT NULL,
  presentation_price NUMERIC NOT NULL,
  cost_per_base_unit NUMERIC NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.base_ingredients ENABLE ROW LEVEL SECURITY;

-- RLS policies for base_ingredients
CREATE POLICY "Users can view their own ingredients"
ON public.base_ingredients FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own ingredients"
ON public.base_ingredients FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ingredients"
ON public.base_ingredients FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ingredients"
ON public.base_ingredients FOR DELETE
USING (auth.uid() = user_id);

-- Create workers table for labor management
CREATE TABLE public.workers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  hours_per_day NUMERIC NOT NULL,
  days_per_month NUMERIC NOT NULL,
  monthly_salary NUMERIC NOT NULL,
  monthly_hours NUMERIC NOT NULL,
  daily_salary NUMERIC NOT NULL,
  hourly_rate NUMERIC NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;

-- RLS policies for workers
CREATE POLICY "Users can view their own workers"
ON public.workers FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own workers"
ON public.workers FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workers"
ON public.workers FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workers"
ON public.workers FOR DELETE
USING (auth.uid() = user_id);

-- Create indirect_costs table (combines fixed, variable expenses, and equipment)
CREATE TABLE public.indirect_costs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  cost_type TEXT NOT NULL, -- 'fixed', 'variable', 'equipment'
  concept TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  -- Equipment-specific fields (nullable for expenses)
  purchase_cost NUMERIC,
  useful_life_months NUMERIC,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.indirect_costs ENABLE ROW LEVEL SECURITY;

-- RLS policies for indirect_costs
CREATE POLICY "Users can view their own indirect costs"
ON public.indirect_costs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own indirect costs"
ON public.indirect_costs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own indirect costs"
ON public.indirect_costs FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own indirect costs"
ON public.indirect_costs FOR DELETE
USING (auth.uid() = user_id);

-- Create quotations table
CREATE TABLE public.quotations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  number TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT,
  client_email TEXT,
  notes TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  discount NUMERIC NOT NULL DEFAULT 0,
  discount_type TEXT NOT NULL DEFAULT 'percentage',
  subtotal NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  valid_until TEXT,
  converted_to_order_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;

-- RLS policies for quotations
CREATE POLICY "Users can view their own quotations"
ON public.quotations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own quotations"
ON public.quotations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quotations"
ON public.quotations FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quotations"
ON public.quotations FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for quotations updated_at
CREATE TRIGGER update_quotations_updated_at
BEFORE UPDATE ON public.quotations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();