-- Add secondary_color column to pdf_settings if it doesn't exist
ALTER TABLE public.pdf_settings 
ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#F5F5F5';