create table if not exists public.meeting_minute_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

insert into public.meeting_minute_categories (name, sort_order)
values
  ('프로젝트회의', 10),
  ('내부회의', 20),
  ('신규브리핑', 30)
on conflict (name) do update
set is_active = true,
    sort_order = excluded.sort_order;

create table if not exists public.meeting_minutes (
  id uuid primary key default gen_random_uuid(),
  category text not null default '내부회의',
  title text not null,
  content text not null default '',
  summary text not null default '',
  decisions text not null default '',
  action_items text not null default '',
  attendees text not null default '',
  project_id uuid references public.projects(id) on delete set null,
  held_at timestamptz,
  source_app text,
  external_id text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_app, external_id)
);

create index if not exists meeting_minutes_category_idx
on public.meeting_minutes(category);

create index if not exists meeting_minutes_project_id_idx
on public.meeting_minutes(project_id);

create index if not exists meeting_minutes_created_at_idx
on public.meeting_minutes(created_at desc);

drop trigger if exists set_meeting_minutes_updated_at on public.meeting_minutes;
create trigger set_meeting_minutes_updated_at
before update on public.meeting_minutes
for each row execute function public.set_updated_at();

alter table public.meeting_minute_categories enable row level security;
alter table public.meeting_minutes enable row level security;

drop policy if exists "meeting minute categories are readable" on public.meeting_minute_categories;
create policy "meeting minute categories are readable"
on public.meeting_minute_categories for select
to authenticated
using (true);

drop policy if exists "admins manage meeting minute categories" on public.meeting_minute_categories;
create policy "admins manage meeting minute categories"
on public.meeting_minute_categories for all
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

drop policy if exists "meeting minutes are readable" on public.meeting_minutes;
create policy "meeting minutes are readable"
on public.meeting_minutes for select
to authenticated
using (true);

drop policy if exists "users create meeting minutes" on public.meeting_minutes;
create policy "users create meeting minutes"
on public.meeting_minutes for insert
to authenticated
with check (created_by = auth.uid() or public.current_user_role() = 'admin');

drop policy if exists "users update own meeting minutes" on public.meeting_minutes;
create policy "users update own meeting minutes"
on public.meeting_minutes for update
to authenticated
using (created_by = auth.uid() or public.current_user_role() = 'admin')
with check (created_by = auth.uid() or public.current_user_role() = 'admin');

drop policy if exists "users delete own meeting minutes" on public.meeting_minutes;
create policy "users delete own meeting minutes"
on public.meeting_minutes for delete
to authenticated
using (created_by = auth.uid() or public.current_user_role() = 'admin');

alter table public.api_keys
drop constraint if exists api_keys_scope_check;

alter table public.api_keys
add constraint api_keys_scope_check
check (scope in ('personal_schedule', 'meeting_minutes'));

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'meeting_minutes'
  ) then
    alter publication supabase_realtime add table public.meeting_minutes;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'meeting_minute_categories'
  ) then
    alter publication supabase_realtime add table public.meeting_minute_categories;
  end if;
end $$;
