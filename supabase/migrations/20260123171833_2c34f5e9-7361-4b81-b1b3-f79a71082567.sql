-- Create policy for users to upload quotation reference images
CREATE POLICY "Users can upload quotation reference images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'business-logos' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = 'quotation-references'
);

-- Create policy for users to update their quotation reference images
CREATE POLICY "Users can update quotation reference images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'business-logos' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = 'quotation-references'
);

-- Create policy for users to delete quotation reference images
CREATE POLICY "Users can delete quotation reference images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'business-logos' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = 'quotation-references'
);