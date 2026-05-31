DROP POLICY IF EXISTS "Authenticated users can read own avatar files" ON storage.objects;

CREATE POLICY "Authenticated users can read own avatar files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);