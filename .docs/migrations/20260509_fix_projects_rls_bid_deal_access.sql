-- Fix: Allow deal participants to read projects regardless of status
-- (awarded/completed). Previously, only published projects were readable
-- by non-owners, causing project titles to show as null in deals views.
--
-- NOTE: The bids EXISTS clause was intentionally omitted — it causes
-- infinite recursion because the bids SELECT policy itself references
-- the projects table (projects.owner_id check), creating a cycle.
-- Bidding phase is covered by status='published'; post-award access
-- is covered by the deals EXISTS clause.

DROP POLICY IF EXISTS "Anyone can read published projects" ON projects;

CREATE POLICY "Anyone can read published projects" ON projects
FOR SELECT USING (
    status = 'published'
    OR owner_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM deals
        WHERE deals.project_id = projects.id
          AND (deals.buyer_id = auth.uid() OR deals.seller_id = auth.uid())
    )
);
