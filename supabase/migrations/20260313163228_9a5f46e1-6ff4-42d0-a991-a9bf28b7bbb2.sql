
CREATE TABLE public.other_income (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  concept text NOT NULL,
  amount numeric NOT NULL,
  date timestamp with time zone NOT NULL DEFAULT now(),
  note text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.other_income ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own other income" ON public.other_income FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own other income" ON public.other_income FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own other income" ON public.other_income FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own other income" ON public.other_income FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_other_income_updated_at BEFORE UPDATE ON public.other_income FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
