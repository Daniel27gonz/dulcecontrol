-- Drop the existing overly broad upload policy for quotation references
DROP POLICY IF EXISTS "Allow authenticated users to upload quotation reference images" ON storage.objects;

-- Recreate with user-scoped path: quotation-references/{user_id}/...
CREATE POLICY "Allow authenticated users to upload quotation reference images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'business-logos'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = 'quotation-references'
  AND (storage.foldername(name))[2] = auth.uid()::text
);