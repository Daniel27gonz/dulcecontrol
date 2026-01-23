-- Add logo_position column to pdf_settings table
ALTER TABLE public.pdf_settings 
ADD COLUMN logo_position text DEFAULT 'center';