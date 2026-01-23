-- Add reference_image column to quotations table for storing reference image URL
ALTER TABLE public.quotations 
ADD COLUMN reference_image TEXT;