alter table public.tasks
add column if not exists creator_read_at timestamptz;
