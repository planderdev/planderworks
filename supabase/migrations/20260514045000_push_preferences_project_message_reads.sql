create table if not exists public.push_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  task_enabled boolean not null default true,
  report_enabled boolean not null default true,
  project_message_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_message_reads (
  message_id uuid not null references public.project_messages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (message_id, user_id)
);

create index if not exists project_message_reads_user_id_idx
on public.project_message_reads(user_id);

drop trigger if exists set_push_preferences_updated_at on public.push_preferences;
create trigger set_push_preferences_updated_at
before update on public.push_preferences
for each row execute function public.set_updated_at();

alter table public.push_preferences enable row level security;
alter table public.project_message_reads enable row level security;

drop policy if exists "users manage own push preferences" on public.push_preferences;
create policy "users manage own push preferences"
on public.push_preferences for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "project message reads are readable" on public.project_message_reads;
create policy "project message reads are readable"
on public.project_message_reads for select
to authenticated
using (true);

drop policy if exists "users create own project message reads" on public.project_message_reads;
create policy "users create own project message reads"
on public.project_message_reads for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "users update own project message reads" on public.project_message_reads;
create policy "users update own project message reads"
on public.project_message_reads for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'project_message_reads'
  ) then
    alter publication supabase_realtime add table public.project_message_reads;
  end if;
end $$;
