-- =============================================================================
-- Migration: Create rfq_files table
-- Mirrors project_files structure for RFQ attachments
-- =============================================================================
CREATE TABLE rfq_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rfq_id UUID NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
    category TEXT NOT NULL DEFAULT 'general',
    -- 'boq', 'drawings', 'specs', 'general'
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rfq_files_rfq ON rfq_files(rfq_id);

-- Enable RLS
ALTER TABLE
    rfq_files ENABLE ROW LEVEL SECURITY;

-- Read: published RFQs files are visible to all authenticated users
CREATE POLICY "Read rfq files for published rfqs" ON rfq_files FOR
SELECT
    USING (
        EXISTS (
            SELECT
                1
            FROM
                rfqs
            WHERE
                rfqs.id = rfq_files.rfq_id
                AND (
                    rfqs.status = 'published'
                    OR rfqs.poster_id = auth.uid()
                )
        )
    );

-- Insert: only the RFQ poster can add files
CREATE POLICY "Poster can add rfq files" ON rfq_files FOR
INSERT
    WITH CHECK (
        EXISTS (
            SELECT
                1
            FROM
                rfqs
            WHERE
                rfqs.id = rfq_files.rfq_id
                AND rfqs.poster_id = auth.uid()
        )
    );

-- Delete: only the RFQ poster can delete files
CREATE POLICY "Poster can delete rfq files" ON rfq_files FOR DELETE USING (
    EXISTS (
        SELECT
            1
        FROM
            rfqs
        WHERE
            rfqs.id = rfq_files.rfq_id
            AND rfqs.poster_id = auth.uid()
    )
);

-- Storage bucket: rfq-files (must be created in Supabase dashboard or via API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('rfq-files', 'rfq-files', false);