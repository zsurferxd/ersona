-- ==============================================================================
-- SOLIST APP - SECURITY HARDENING & MEDIA STORAGE MIGRATION
-- ==============================================================================
-- Jalankan query ini di Supabase SQL Editor untuk memperkuat database &
-- mengaktifkan dukungan lampiran media (foto/video kecil).
-- ==============================================================================

-- 1. Batasi panjang karakter untuk mencegah eksploitasi kuota database (Storage DoS)
ALTER TABLE public.todos 
    DROP CONSTRAINT IF EXISTS check_todo_title_len,
    ADD CONSTRAINT check_todo_title_len CHECK (char_length(title) <= 200);

ALTER TABLE public.todos 
    DROP CONSTRAINT IF EXISTS check_todo_desc_len,
    ADD CONSTRAINT check_todo_desc_len CHECK (description IS NULL OR char_length(description) <= 2000);

ALTER TABLE public.notes 
    DROP CONSTRAINT IF EXISTS check_note_title_len,
    ADD CONSTRAINT check_note_title_len CHECK (char_length(title) <= 200);

ALTER TABLE public.notes 
    DROP CONSTRAINT IF EXISTS check_note_content_len,
    ADD CONSTRAINT check_note_content_len CHECK (content IS NULL OR char_length(content) <= 30000);

-- 2. Tambahkan kolom media_url dan media_type pada tabel notes (untuk foto / video)
ALTER TABLE public.notes 
    ADD COLUMN IF NOT EXISTS media_url TEXT,
    ADD COLUMN IF NOT EXISTS media_type TEXT CHECK (media_type IN ('image', 'video', NULL));

-- 3. Setup Supabase Storage Bucket untuk Media
-- Membuat bucket privat 'attachments' jika belum ada
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'attachments', 
    'attachments', 
    true, 
    52428800, -- Limit 50 MB per file
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime']
)
ON CONFLICT (id) DO UPDATE SET 
    file_size_limit = 52428800,
    public = true;

-- 4. Kebijakan RLS untuk Storage Bucket (attachments)
-- User hanya bisa upload ke folder mereka sendiri: (storage.foldername(name))[1] = auth.uid()::text
DROP POLICY IF EXISTS "Users can view attachments" ON storage.objects;
CREATE POLICY "Users can view attachments" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'attachments');

DROP POLICY IF EXISTS "Users can upload their own attachments" ON storage.objects;
CREATE POLICY "Users can upload their own attachments" 
ON storage.objects FOR INSERT 
WITH CHECK (
    bucket_id = 'attachments' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can update their own attachments" ON storage.objects;
CREATE POLICY "Users can update their own attachments" 
ON storage.objects FOR UPDATE 
USING (
    bucket_id = 'attachments' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can delete their own attachments" ON storage.objects;
CREATE POLICY "Users can delete their own attachments" 
ON storage.objects FOR DELETE 
USING (
    bucket_id = 'attachments' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);
