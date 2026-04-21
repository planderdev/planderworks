create table if not exists public.task_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

insert into public.task_types (name, sort_order)
values
  ('영업 브리핑', 10),
  ('디자인 요청', 20),
  ('보고', 30),
  ('제안', 40),
  ('확인 요청', 50),
  ('촬영 요청', 60),
  ('시장 조사', 70)
on conflict (name) do update
set is_active = true,
    sort_order = excluded.sort_order;

alter table public.tasks
add column if not exists read_at timestamptz;

alter table public.task_types enable row level security;

drop policy if exists "task types are readable" on public.task_types;
create policy "task types are readable"
on public.task_types for select
to authenticated
using (true);

drop policy if exists "admins manage task types" on public.task_types;
create policy "admins manage task types"
on public.task_types for all
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

drop policy if exists "task participants read tasks" on public.tasks;
create policy "authenticated users read tasks"
on public.tasks for select
to authenticated
using (true);

drop policy if exists "task participants read files" on public.task_files;
drop policy if exists "authenticated users read task file records" on public.task_files;
create policy "authenticated users read task file records"
on public.task_files for select
to authenticated
using (true);

insert into storage.buckets (id, name, public, file_size_limit)
values ('task-files', 'task-files', false, 52428800)
on conflict (id) do update
set public = false,
    file_size_limit = 52428800;

drop policy if exists "authenticated read task files" on storage.objects;
create policy "authenticated read task files"
on storage.objects for select
to authenticated
using (bucket_id = 'task-files');

drop policy if exists "authenticated upload task files" on storage.objects;
create policy "authenticated upload task files"
on storage.objects for insert
to authenticated
with check (bucket_id = 'task-files');

drop policy if exists "authenticated update own task files" on storage.objects;
create policy "authenticated update own task files"
on storage.objects for update
to authenticated
using (bucket_id = 'task-files' and owner = auth.uid())
with check (bucket_id = 'task-files' and owner = auth.uid());

drop policy if exists "authenticated delete own task files" on storage.objects;
create policy "authenticated delete own task files"
on storage.objects for delete
to authenticated
using (bucket_id = 'task-files' and owner = auth.uid());
