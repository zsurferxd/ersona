-- ==============================================================================
-- SOLIST APP - STORAGE QUOTA RPC FUNCTION (V1.7)
-- ==============================================================================
-- Query ini membuat fungsi penghitungan total bytes file pengguna di bucket 'attachments'
-- secara cepat dan aman di sisi PostgreSQL.
-- ==============================================================================

CREATE OR REPLACE FUNCTION get_user_storage_usage()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    total_bytes BIGINT;
BEGIN
    SELECT COALESCE(SUM((metadata->>'size')::bigint), 0)
    INTO total_bytes
    FROM storage.objects
    WHERE bucket_id = 'attachments'
      AND (storage.foldername(name))[1] = auth.uid()::text;
    
    RETURN total_bytes;
END;
$$;

-- Berikan izin eksekusi ke user yang terotentikasi
GRANT EXECUTE ON FUNCTION get_user_storage_usage() TO authenticated;
