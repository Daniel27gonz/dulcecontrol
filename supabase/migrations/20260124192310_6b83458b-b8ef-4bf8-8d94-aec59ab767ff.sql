-- Add new columns for text customization in pdf_settings
ALTER TABLE public.pdf_settings 
ADD COLUMN IF NOT EXISTS quotation_title TEXT DEFAULT 'COTIZACIÓN',
ADD COLUMN IF NOT EXISTS event_date_label TEXT DEFAULT 'Fecha de entrega',
ADD COLUMN IF NOT EXISTS event_type_label TEXT DEFAULT 'Válida hasta',
ADD COLUMN IF NOT EXISTS footer_message TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS thank_you_message TEXT DEFAULT 'Gracias por confiar en mi trabajo para endulzar tus momentos';