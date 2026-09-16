-- ==============================================================================
-- ERSONA APP - UPGRADE v2.2: WORKSPACE JOIN APPROVAL & MEMBER KICK
-- ==============================================================================
-- Jalankan skrip ini di Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- untuk menambahkan dukungan toggle persetujuan join (requires_approval)
-- dan manajemen status anggota (pending vs active).
-- ==============================================================================

-- 1. TAMBAHKAN KOLOM REQUIRES_APPROVAL PADA TABEL WORKSPACES
ALTER TABLE public.workspaces 
    ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN NOT NULL DEFAULT false;

-- 2. TAMBAHKAN KOLOM STATUS PADA TABEL WORKSPACE_MEMBERS
ALTER TABLE public.workspace_members 
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending'));

-- 3. PERBARUI FUNGSI JOIN AGAR MENDUKUNG SISTEM APPROVAL
CREATE OR REPLACE FUNCTION public.join_workspace_by_invite_code(code_input TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    target_ws RECORD;
    current_user_id UUID := auth.uid();
    user_email_val TEXT;
    initial_status TEXT := 'active';
    is_pending BOOLEAN := false;
BEGIN
    IF current_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Authentication required.');
    END IF;

    -- Cari workspace dengan kode undangan
    SELECT id, name, owner_id, requires_approval INTO target_ws
    FROM public.workspaces
    WHERE UPPER(invite_code) = UPPER(TRIM(code_input))
    LIMIT 1;

    IF target_ws.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Kode undangan tidak valid atau tidak ditemukan.');
    END IF;

    -- Cek jika sudah menjadi anggota aktif atau pemilik
    IF target_ws.owner_id = current_user_id THEN
        RETURN jsonb_build_object(
            'success', true, 
            'workspace_id', target_ws.id, 
            'name', target_ws.name, 
            'message', 'Anda adalah pemilik ruang kerja ini.'
        );
    END IF;

    IF EXISTS (
        SELECT 1 FROM public.workspace_members 
        WHERE workspace_id = target_ws.id AND user_id = current_user_id AND status = 'active'
    ) THEN
        RETURN jsonb_build_object(
            'success', true, 
            'workspace_id', target_ws.id, 
            'name', target_ws.name, 
            'message', 'Anda sudah menjadi anggota aktif di ruang kerja ini.'
        );
    END IF;

    -- Cek jika sudah mengirim permintaan pending sebelumnya
    IF EXISTS (
        SELECT 1 FROM public.workspace_members 
        WHERE workspace_id = target_ws.id AND user_id = current_user_id AND status = 'pending'
    ) THEN
        RETURN jsonb_build_object(
            'success', true, 
            'pending', true,
            'workspace_id', target_ws.id, 
            'name', target_ws.name, 
            'message', 'Permintaan bergabung Anda sebelumnya masih menunggu persetujuan pemilik.'
        );
    END IF;

    -- Dapatkan email pengguna saat ini
    SELECT email INTO user_email_val FROM auth.users WHERE id = current_user_id;

    -- Tentukan status awal berdasarkan pengaturan ruang kerja
    IF target_ws.requires_approval THEN
        initial_status := 'pending';
        is_pending := true;
    ELSE
        initial_status := 'active';
        is_pending := false;
    END IF;

    -- Masukkan atau perbarui data ke workspace_members
    INSERT INTO public.workspace_members (workspace_id, user_id, user_email, role, status)
    VALUES (target_ws.id, current_user_id, COALESCE(user_email_val, 'user'), 'member', initial_status)
    ON CONFLICT (workspace_id, user_id) 
    DO UPDATE SET status = initial_status, user_email = COALESCE(user_email_val, workspace_members.user_email);

    IF is_pending THEN
        RETURN jsonb_build_object(
            'success', true, 
            'pending', true,
            'workspace_id', target_ws.id, 
            'name', target_ws.name, 
            'message', 'Permintaan bergabung telah dikirim. Menunggu persetujuan pemilik ruang kerja.'
        );
    ELSE
        RETURN jsonb_build_object(
            'success', true, 
            'pending', false,
            'workspace_id', target_ws.id, 
            'name', target_ws.name, 
            'message', 'Berhasil bergabung ke ruang kerja!'
        );
    END IF;
END;
$$;

-- 4. KEBIJAKAN RLS AGAR PEMILIK DAPAT MENGUBAH STATUS ANGGOTA (APPROVE/REJECT)
DROP POLICY IF EXISTS "Owners can update workspace members status" ON public.workspace_members;
CREATE POLICY "Owners can update workspace members status"
ON public.workspace_members FOR UPDATE
USING (
    EXISTS (SELECT 1 FROM public.workspaces WHERE id = workspace_members.workspace_id AND owner_id = auth.uid())
)
WITH CHECK (
    EXISTS (SELECT 1 FROM public.workspaces WHERE id = workspace_members.workspace_id AND owner_id = auth.uid())
);
