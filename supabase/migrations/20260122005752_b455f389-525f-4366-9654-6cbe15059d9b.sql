-- Create table for PDF customization settings per user
CREATE TABLE public.pdf_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  business_name TEXT DEFAULT '',
  business_phone TEXT DEFAULT '',
  business_email TEXT DEFAULT '',
  logo_url TEXT DEFAULT NULL,
  primary_color TEXT DEFAULT '#5D4037',
  style TEXT DEFAULT 'professional' CHECK (style IN ('minimal', 'elegant', 'sweet', 'professional')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT pdf_settings_user_id_unique UNIQUE (user_id)
);

-- Enable Row Level Security
ALTER TABLE public.pdf_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own PDF settings" 
ON public.pdf_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own PDF settings" 
ON public.pdf_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own PDF settings" 
ON public.pdf_settings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own PDF settings" 
ON public.pdf_settings 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_pdf_settings_updated_at
BEFORE UPDATE ON public.pdf_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();