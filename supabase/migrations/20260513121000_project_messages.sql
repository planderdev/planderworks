create table if not exists public.project_messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.project_messages enable row level security;

drop policy if exists "project messages are readable" on public.project_messages;
create policy "project messages are readable"
on public.project_messages for select
to authenticated
using (true);

drop policy if exists "users create project messages" on public.project_messages;
create policy "users create project messages"
on public.project_messages for insert
to authenticated
with check (user_id = auth.uid());

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'project_messages'
  ) then
    alter publication supabase_realtime add table public.project_messages;
  end if;
end $$;
