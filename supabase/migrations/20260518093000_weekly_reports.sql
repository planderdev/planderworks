create table if not exists public.weekly_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  week_start date not null,
  week_end date not null,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'reviewed')),
  this_week_done text not null default '',
  next_week_plan text not null default '',
  notes text not null default '',
  suggestions text not null default '',
  submitted_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week_start)
);

create index if not exists weekly_reports_user_id_idx
on public.weekly_reports(user_id);

create index if not exists weekly_reports_week_start_idx
on public.weekly_reports(week_start desc);

drop trigger if exists set_weekly_reports_updated_at on public.weekly_reports;
create trigger set_weekly_reports_updated_at
before update on public.weekly_reports
for each row execute function public.set_updated_at();

alter table public.weekly_reports enable row level security;

drop policy if exists "weekly reports are readable" on public.weekly_reports;
create policy "weekly reports are readable"
on public.weekly_reports for select
to authenticated
using (user_id = auth.uid() or public.current_user_role() = 'admin');

drop policy if exists "users create own weekly reports" on public.weekly_reports;
create policy "users create own weekly reports"
on public.weekly_reports for insert
to authenticated
with check (user_id = auth.uid() or public.current_user_role() = 'admin');

drop policy if exists "users update own weekly reports" on public.weekly_reports;
create policy "users update own weekly reports"
on public.weekly_reports for update
to authenticated
using (user_id = auth.uid() or public.current_user_role() = 'admin')
with check (user_id = auth.uid() or public.current_user_role() = 'admin');

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'weekly_reports'
  ) then
    alter publication supabase_realtime add table public.weekly_reports;
  end if;
end $$;
