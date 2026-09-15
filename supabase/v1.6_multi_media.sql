-- ==============================================================================
-- SOLIST APP - UPGRADE v1.6: MULTI-MEDIA NOTES (UP TO 5 PHOTOS & 1 VIDEO)
-- ==============================================================================
-- Jalankan query ini di Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- untuk menambahkan kolom JSONB 'media_items' pada tabel notes.
-- ==============================================================================

-- 1. Tambahkan kolom media_items ke tabel notes
ALTER TABLE public.notes 
    ADD COLUMN IF NOT EXISTS media_items JSONB DEFAULT '[]'::jsonb;
