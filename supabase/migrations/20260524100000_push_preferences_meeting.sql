-- Add a dedicated push preference for meeting minutes (was previously gated by report_enabled).
alter table public.push_preferences
  add column if not exists meeting_enabled boolean not null default true;
