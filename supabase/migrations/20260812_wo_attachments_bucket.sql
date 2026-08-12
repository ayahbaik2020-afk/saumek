-- Bucket publik untuk lampiran WO SIMIP (PDF/foto), diisi oleh sync-agent dari N:\workorder\
INSERT INTO storage.buckets (id, name, public)
VALUES ('wo-attachments', 'wo-attachments', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Baca lampiran tanpa login (anon / authenticated)
DROP POLICY IF EXISTS "Public read wo attachments" ON storage.objects;
CREATE POLICY "Public read wo attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'wo-attachments');

-- Upload/update via service role (sync-agent)
DROP POLICY IF EXISTS "Service role upload wo attachments" ON storage.objects;
CREATE POLICY "Service role upload wo attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'wo-attachments' AND auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role update wo attachments" ON storage.objects;
CREATE POLICY "Service role update wo attachments"
ON storage.objects FOR UPDATE
USING (bucket_id = 'wo-attachments' AND auth.role() = 'service_role');
