-- Add delivery_date column to quotations table
ALTER TABLE public.quotations 
ADD COLUMN delivery_date TIMESTAMP WITH TIME ZONE;