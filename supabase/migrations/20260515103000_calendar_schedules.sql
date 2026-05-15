create table if not exists public.calendar_schedules (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  memo text,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists calendar_schedules_start_at_idx on public.calendar_schedules(start_at);
create index if not exists calendar_schedules_created_by_idx on public.calendar_schedules(created_by);

drop trigger if exists set_calendar_schedules_updated_at on public.calendar_schedules;
create trigger set_calendar_schedules_updated_at
before update on public.calendar_schedules
for each row execute function public.set_updated_at();

alter table public.calendar_schedules enable row level security;

drop policy if exists "calendar schedules are readable" on public.calendar_schedules;
create policy "calendar schedules are readable"
on public.calendar_schedules
for select
to authenticated
using (true);

drop policy if exists "users create calendar schedules" on public.calendar_schedules;
create policy "users create calendar schedules"
on public.calendar_schedules
for insert
to authenticated
with check (created_by = auth.uid());

drop policy if exists "users update own calendar schedules" on public.calendar_schedules;
create policy "users update own calendar schedules"
on public.calendar_schedules
for update
to authenticated
using (created_by = auth.uid() or public.current_user_role() = 'admin')
with check (created_by = auth.uid() or public.current_user_role() = 'admin');

drop policy if exists "users delete own calendar schedules" on public.calendar_schedules;
create policy "users delete own calendar schedules"
on public.calendar_schedules
for delete
to authenticated
using (created_by = auth.uid() or public.current_user_role() = 'admin');

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'calendar_schedules'
  ) then
    alter publication supabase_realtime add table public.calendar_schedules;
  end if;
end $$;
