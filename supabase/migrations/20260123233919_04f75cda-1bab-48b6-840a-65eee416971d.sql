-- Drop existing UPDATE policy and recreate with proper WITH CHECK clause
DROP POLICY IF EXISTS "Users can update their own PDF settings" ON public.pdf_settings;

CREATE POLICY "Users can update their own PDF settings" 
ON public.pdf_settings 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Ensure the INSERT policy also validates the user_id properly
DROP POLICY IF EXISTS "Users can create their own PDF settings" ON public.pdf_settings;

CREATE POLICY "Users can create their own PDF settings" 
ON public.pdf_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);