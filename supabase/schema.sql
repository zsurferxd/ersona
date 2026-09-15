-- ==============================================================================
-- SOLIST APP - SUPABASE DATABASE SCHEMA & ROW LEVEL SECURITY (RLS)
-- ==============================================================================
-- Jalankan skrip ini di Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ==============================================================================

-- 1. TABEL TODOS (Tugas / Jadwal dengan Catatan, Media, Pengingat & Soft Delete)
CREATE TABLE IF NOT EXISTS public.todos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL CHECK (char_length(title) <= 200),
    description TEXT CHECK (description IS NULL OR char_length(description) <= 2000),
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    due_date TIMESTAMPTZ,
    reminder_date TIMESTAMPTZ,
    priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
    tag TEXT DEFAULT 'General',
    media_url TEXT,
    media_type TEXT,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. TABEL NOTES (Catatan Notion-Style dengan dukungan Multi-Media & Soft Delete)
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL CHECK (char_length(title) <= 200),
    content TEXT CHECK (content IS NULL OR char_length(content) <= 30000),
    icon_emoji TEXT DEFAULT '📝',
    media_url TEXT,
    media_type TEXT CHECK (media_type IN ('image', 'video', 'embed_gdrive', 'embed_youtube', 'embed_generic', NULL)),
    media_items JSONB DEFAULT '[]'::jsonb,
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    tag TEXT DEFAULT 'Personal',
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. AKTIFKAN ROW LEVEL SECURITY (RLS)
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- 4. KEBIJAKAN RLS - TODOS
DROP POLICY IF EXISTS "Users can view their own todos" ON public.todos;
CREATE POLICY "Users can view their own todos" 
ON public.todos FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own todos" ON public.todos;
CREATE POLICY "Users can create their own todos" 
ON public.todos FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own todos" ON public.todos;
CREATE POLICY "Users can update their own todos" 
ON public.todos FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own todos" ON public.todos;
CREATE POLICY "Users can delete their own todos" 
ON public.todos FOR DELETE 
USING (auth.uid() = user_id);

-- 5. KEBIJAKAN RLS - NOTES
DROP POLICY IF EXISTS "Users can view their own notes" ON public.notes;
CREATE POLICY "Users can view their own notes" 
ON public.notes FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own notes" ON public.notes;
CREATE POLICY "Users can create their own notes" 
ON public.notes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notes" ON public.notes;
CREATE POLICY "Users can update their own notes" 
ON public.notes FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own notes" ON public.notes;
CREATE POLICY "Users can delete their own notes" 
ON public.notes FOR DELETE 
USING (auth.uid() = user_id);

-- 6. INDEXING UNTUK PERFORMA QUERY CEPAT
CREATE INDEX IF NOT EXISTS idx_todos_user_due ON public.todos(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_todos_user_reminder ON public.todos(user_id, reminder_date);
CREATE INDEX IF NOT EXISTS idx_todos_deleted_at ON public.todos(user_id, deleted_at);
CREATE INDEX IF NOT EXISTS idx_notes_user_created ON public.notes(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_deleted_at ON public.notes(user_id, deleted_at);
