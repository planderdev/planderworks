-- Remove the weekly reports feature entirely.
-- Dropping the table cascades its indexes, the updated_at trigger and all RLS
-- policies, and automatically removes it from the supabase_realtime publication.
drop table if exists public.weekly_reports cascade;
