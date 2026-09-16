-- ==============================================================================
-- ERSONA APP - UPGRADE v1.9: SHARED WORKSPACES & TEAM COLLABORATION
-- ==============================================================================
-- Jalankan skrip ini di Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- untuk mengaktifkan fitur ruang kerja bersama (Team Workspace) & kolaborasi realtime.
-- ==============================================================================

-- 1. TABEL WORKSPACES (Ruang Kerja Tim)
CREATE TABLE IF NOT EXISTS public.workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL CHECK (char_length(name) <= 100),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    invite_code TEXT UNIQUE NOT NULL DEFAULT upper(substring(md5(random()::text || clock_timestamp()::text), 1, 8)),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. TABEL WORKSPACE_MEMBERS (Anggota Ruang Kerja)
CREATE TABLE IF NOT EXISTS public.workspace_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(workspace_id, user_id)
);

-- 3. TAMBAHKAN KOLOM WORKSPACE_ID DI TABEL TODOS & NOTES
ALTER TABLE public.todos 
    ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;

ALTER TABLE public.notes 
    ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_todos_workspace ON public.todos(workspace_id);
CREATE INDEX IF NOT EXISTS idx_notes_workspace ON public.notes(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ws_members_user ON public.workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_ws_members_ws ON public.workspace_members(workspace_id);

-- 4. FUNGSI BANTU PENGECEKAN KEANGGOTAAN SECARA AMAN (Mencegah Infinite Recursion di RLS)
CREATE OR REPLACE FUNCTION public.is_workspace_member(ws_id UUID, u_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.workspace_members 
        WHERE workspace_id = ws_id AND user_id = u_id
    );
$$;

-- 5. AKTIFKAN RLS PADA TABEL WORKSPACES & WORKSPACE_MEMBERS
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- Kebijakan RLS untuk Workspaces
DROP POLICY IF EXISTS "Users can view workspaces they belong to" ON public.workspaces;
CREATE POLICY "Users can view workspaces they belong to"
ON public.workspaces FOR SELECT
USING (
    owner_id = auth.uid() 
    OR public.is_workspace_member(id, auth.uid())
);

DROP POLICY IF EXISTS "Users can create workspaces" ON public.workspaces;
CREATE POLICY "Users can create workspaces"
ON public.workspaces FOR INSERT
WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can update their workspaces" ON public.workspaces;
CREATE POLICY "Owners can update their workspaces"
ON public.workspaces FOR UPDATE
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can delete their workspaces" ON public.workspaces;
CREATE POLICY "Owners can delete their workspaces"
ON public.workspaces FOR DELETE
USING (auth.uid() = owner_id);

-- Kebijakan RLS untuk Workspace Members
DROP POLICY IF EXISTS "Members can view other members in same workspace" ON public.workspace_members;
CREATE POLICY "Members can view other members in same workspace"
ON public.workspace_members FOR SELECT
USING (
    user_id = auth.uid() 
    OR public.is_workspace_member(workspace_id, auth.uid())
);

DROP POLICY IF EXISTS "Users can join workspace or owner can add members" ON public.workspace_members;
CREATE POLICY "Users can join workspace or owner can add members"
ON public.workspace_members FOR INSERT
WITH CHECK (
    user_id = auth.uid() 
    OR EXISTS (SELECT 1 FROM public.workspaces WHERE id = workspace_id AND owner_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can leave or owner can remove members" ON public.workspace_members;
CREATE POLICY "Users can leave or owner can remove members"
ON public.workspace_members FOR DELETE
USING (
    user_id = auth.uid() 
    OR EXISTS (SELECT 1 FROM public.workspaces WHERE id = workspace_id AND owner_id = auth.uid())
);

-- 6. PERBARUI KEBIJAKAN RLS PADA TODOS (Mendukung Personal & Shared Workspace)
DROP POLICY IF EXISTS "Users can view their own todos" ON public.todos;
DROP POLICY IF EXISTS "Users can view their own todos or shared workspace todos" ON public.todos;
CREATE POLICY "Users can view their own todos or shared workspace todos" 
ON public.todos FOR SELECT 
USING (
    (workspace_id IS NULL AND auth.uid() = user_id)
    OR (workspace_id IS NOT NULL AND public.is_workspace_member(workspace_id, auth.uid()))
);

DROP POLICY IF EXISTS "Users can create their own todos" ON public.todos;
DROP POLICY IF EXISTS "Users can create their own todos or shared workspace todos" ON public.todos;
CREATE POLICY "Users can create their own todos or shared workspace todos" 
ON public.todos FOR INSERT 
WITH CHECK (
    auth.uid() = user_id 
    AND (workspace_id IS NULL OR public.is_workspace_member(workspace_id, auth.uid()))
);

DROP POLICY IF EXISTS "Users can update their own todos" ON public.todos;
DROP POLICY IF EXISTS "Users can update their own todos or shared workspace todos" ON public.todos;
CREATE POLICY "Users can update their own todos or shared workspace todos" 
ON public.todos FOR UPDATE 
USING (
    (workspace_id IS NULL AND auth.uid() = user_id)
    OR (workspace_id IS NOT NULL AND public.is_workspace_member(workspace_id, auth.uid()))
)
WITH CHECK (
    (workspace_id IS NULL AND auth.uid() = user_id)
    OR (workspace_id IS NOT NULL AND public.is_workspace_member(workspace_id, auth.uid()))
);

DROP POLICY IF EXISTS "Users can delete their own todos" ON public.todos;
DROP POLICY IF EXISTS "Users can delete their own todos or shared workspace todos" ON public.todos;
CREATE POLICY "Users can delete their own todos or shared workspace todos" 
ON public.todos FOR DELETE 
USING (
    (workspace_id IS NULL AND auth.uid() = user_id)
    OR (workspace_id IS NOT NULL AND public.is_workspace_member(workspace_id, auth.uid()))
);

-- 7. PERBARUI KEBIJAKAN RLS PADA NOTES (Mendukung Personal & Shared Workspace)
DROP POLICY IF EXISTS "Users can view their own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can view their own notes or shared workspace notes" ON public.notes;
CREATE POLICY "Users can view their own notes or shared workspace notes" 
ON public.notes FOR SELECT 
USING (
    (workspace_id IS NULL AND auth.uid() = user_id)
    OR (workspace_id IS NOT NULL AND public.is_workspace_member(workspace_id, auth.uid()))
);

DROP POLICY IF EXISTS "Users can create their own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can create their own notes or shared workspace notes" ON public.notes;
CREATE POLICY "Users can create their own notes or shared workspace notes" 
ON public.notes FOR INSERT 
WITH CHECK (
    auth.uid() = user_id 
    AND (workspace_id IS NULL OR public.is_workspace_member(workspace_id, auth.uid()))
);

DROP POLICY IF EXISTS "Users can update their own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can update their own notes or shared workspace notes" ON public.notes;
CREATE POLICY "Users can update their own notes or shared workspace notes" 
ON public.notes FOR UPDATE 
USING (
    (workspace_id IS NULL AND auth.uid() = user_id)
    OR (workspace_id IS NOT NULL AND public.is_workspace_member(workspace_id, auth.uid()))
)
WITH CHECK (
    (workspace_id IS NULL AND auth.uid() = user_id)
    OR (workspace_id IS NOT NULL AND public.is_workspace_member(workspace_id, auth.uid()))
);

DROP POLICY IF EXISTS "Users can delete their own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can delete their own notes or shared workspace notes" ON public.notes;
CREATE POLICY "Users can delete their own notes or shared workspace notes" 
ON public.notes FOR DELETE 
USING (
    (workspace_id IS NULL AND auth.uid() = user_id)
    OR (workspace_id IS NOT NULL AND public.is_workspace_member(workspace_id, auth.uid()))
);

-- 8. FUNGSI RPC: GABUNG WORKSPACE DENGAN KODE UNDANGAN
CREATE OR REPLACE FUNCTION public.join_workspace_by_code(code_input TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    target_ws RECORD;
    current_user_id UUID := auth.uid();
    user_email_val TEXT;
BEGIN
    IF current_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Authentication required.');
    END IF;

    -- Cari workspace dengan kode undangan
    SELECT id, name, owner_id INTO target_ws
    FROM public.workspaces
    WHERE UPPER(invite_code) = UPPER(TRIM(code_input))
    LIMIT 1;

    IF target_ws.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Kode undangan tidak valid atau tidak ditemukan.');
    END IF;

    -- Cek jika sudah menjadi anggota
    IF EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_id = target_ws.id AND user_id = current_user_id) THEN
        RETURN jsonb_build_object(
            'success', true, 
            'workspace_id', target_ws.id, 
            'name', target_ws.name, 
            'message', 'Anda sudah bergabung di ruang kerja ini.'
        );
    END IF;

    -- Dapatkan email pengguna saat ini
    SELECT email INTO user_email_val FROM auth.users WHERE id = current_user_id;

    -- Tambahkan sebagai member
    INSERT INTO public.workspace_members (workspace_id, user_id, user_email, role)
    VALUES (target_ws.id, current_user_id, COALESCE(user_email_val, 'user'), 'member');

    RETURN jsonb_build_object(
        'success', true, 
        'workspace_id', target_ws.id, 
        'name', target_ws.name, 
        'message', 'Berhasil bergabung ke ruang kerja!'
    );
END;
$$;

-- 9. PUBLIKASIKAN TABEL KE REALTIME REPLICATION (Abaikan error jika sudah ada)
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.workspaces;
    EXCEPTION WHEN duplicate_object THEN END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.workspace_members;
    EXCEPTION WHEN duplicate_object THEN END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.todos;
    EXCEPTION WHEN duplicate_object THEN END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notes;
    EXCEPTION WHEN duplicate_object THEN END;
END $$;
