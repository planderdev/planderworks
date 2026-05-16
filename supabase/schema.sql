create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('admin', 'manager', 'staff');
  end if;

  if not exists (select 1 from pg_type where typname = 'task_status') then
    create type public.task_status as enum ('pending', 'in_progress', 'blocked', 'completion_requested', 'completed', 'rejected', 'cancelled');
  end if;

  if not exists (select 1 from pg_type where typname = 'task_priority') then
    create type public.task_priority as enum ('low', 'normal', 'high');
  end if;
end $$;

create table if not exists public.job_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.task_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null,
  phone text,
  avatar_url text,
  role public.user_role not null default 'staff',
  job_type_id uuid references public.job_types(id),
  theme_mode text not null default 'system' check (theme_mode in ('system', 'light', 'dark')),
  color_theme text not null default 'default' check (color_theme in ('default', 'metal-silver', 'british-green', 'navy', 'orange', 'pastel-pink')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_name text,
  phone text,
  region text,
  memo text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete set null,
  name text not null,
  status text not null default 'active',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create index if not exists project_members_user_id_idx
on public.project_members(user_id);

create table if not exists public.project_messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.project_message_reads (
  message_id uuid not null references public.project_messages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (message_id, user_id)
);

create index if not exists project_message_reads_user_id_idx
on public.project_message_reads(user_id);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  task_type text not null default '업무 요청',
  status public.task_status not null default 'pending',
  priority public.task_priority not null default 'normal',
  creator_id uuid not null references public.profiles(id),
  assignee_id uuid references public.profiles(id),
  client_id uuid references public.clients(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  due_at timestamptz,
  started_at timestamptz,
  read_at timestamptz,
  creator_read_at timestamptz,
  show_on_calendar boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.task_watchers (
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (task_id, user_id)
);

create table if not exists public.task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  parent_comment_id uuid references public.task_comments(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  comment_type text not null default 'comment',
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists task_comments_parent_comment_id_idx
on public.task_comments(parent_comment_id);

create or replace function public.is_valid_comment_parent(parent_id uuid, child_task_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select parent_id is null
    or exists (
      select 1
      from public.task_comments parent
      where parent.id = parent_id
        and parent.task_id = child_task_id
        and parent.parent_comment_id is null
    );
$$;

create table if not exists public.task_files (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  uploaded_by uuid not null references public.profiles(id),
  file_name text not null,
  file_path text not null,
  file_size bigint,
  mime_type text,
  created_at timestamptz not null default now()
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references public.tasks(id) on delete cascade,
  user_id uuid references public.profiles(id),
  action text not null,
  before_value jsonb,
  after_value jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.push_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  task_enabled boolean not null default true,
  report_enabled boolean not null default true,
  project_message_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  scope text not null check (scope in ('personal_schedule')),
  key_prefix text not null,
  key_hash text not null unique,
  active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_task_started_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'in_progress' and new.started_at is null then
    new.started_at = now();
  end if;

  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_clients_updated_at on public.clients;
create trigger set_clients_updated_at
before update on public.clients
for each row execute function public.set_updated_at();

drop trigger if exists set_projects_updated_at on public.projects;
create trigger set_projects_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

drop trigger if exists set_tasks_updated_at on public.tasks;
create trigger set_tasks_updated_at
before update on public.tasks
for each row execute function public.set_updated_at();

drop trigger if exists set_tasks_started_at on public.tasks;
create trigger set_tasks_started_at
before insert or update on public.tasks
for each row execute function public.set_task_started_at();

drop trigger if exists set_push_subscriptions_updated_at on public.push_subscriptions;
create trigger set_push_subscriptions_updated_at
before update on public.push_subscriptions
for each row execute function public.set_updated_at();

drop trigger if exists set_push_preferences_updated_at on public.push_preferences;
create trigger set_push_preferences_updated_at
before update on public.push_preferences
for each row execute function public.set_updated_at();

drop trigger if exists set_api_keys_updated_at on public.api_keys;
create trigger set_api_keys_updated_at
before update on public.api_keys
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'staff')
  )
  on conflict (id) do update
  set
    email = excluded.email,
    name = excluded.name,
    role = excluded.role;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.current_user_role()
returns public.user_role
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.prevent_non_admin_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.role is distinct from new.role and public.current_user_role() <> 'admin' then
    raise exception 'Only admins can change user roles';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_non_admin_role_change on public.profiles;
create trigger prevent_non_admin_role_change
before update on public.profiles
for each row execute function public.prevent_non_admin_role_change();

insert into public.job_types (name)
values
  ('일본 마케팅'),
  ('국내 마케팅'),
  ('디자인'),
  ('개발'),
  ('영업'),
  ('운영'),
  ('대표'),
  ('회계·정산')
on conflict (name) do nothing;

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

alter table public.job_types enable row level security;
alter table public.task_types enable row level security;
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.project_messages enable row level security;
alter table public.project_message_reads enable row level security;
alter table public.tasks enable row level security;
alter table public.task_watchers enable row level security;
alter table public.task_comments enable row level security;
alter table public.task_files enable row level security;
alter table public.activity_logs enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.push_preferences enable row level security;
alter table public.api_keys enable row level security;

drop policy if exists "job types are readable" on public.job_types;
create policy "job types are readable"
on public.job_types for select
to authenticated
using (true);

drop policy if exists "admins manage job types" on public.job_types;
create policy "admins manage job types"
on public.job_types for all
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

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

drop policy if exists "profiles are readable" on public.profiles;
create policy "profiles are readable"
on public.profiles for select
to authenticated
using (true);

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "admins manage profiles" on public.profiles;
create policy "admins manage profiles"
on public.profiles for all
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

drop policy if exists "clients are readable" on public.clients;
create policy "clients are readable"
on public.clients for select
to authenticated
using (true);

drop policy if exists "users create clients" on public.clients;
create policy "users create clients"
on public.clients for insert
to authenticated
with check (created_by = auth.uid());

drop policy if exists "users update own clients" on public.clients;
create policy "users update own clients"
on public.clients for update
to authenticated
using (created_by = auth.uid() or public.current_user_role() = 'admin')
with check (created_by = auth.uid() or public.current_user_role() = 'admin');

drop policy if exists "users delete own clients" on public.clients;
create policy "users delete own clients"
on public.clients for delete
to authenticated
using (created_by = auth.uid() or public.current_user_role() = 'admin');

drop policy if exists "projects are readable" on public.projects;
create policy "projects are readable"
on public.projects for select
to authenticated
using (true);

drop policy if exists "users create projects" on public.projects;
create policy "users create projects"
on public.projects for insert
to authenticated
with check (created_by = auth.uid());

drop policy if exists "users update own projects" on public.projects;
create policy "users update own projects"
on public.projects for update
to authenticated
using (created_by = auth.uid() or public.current_user_role() = 'admin')
with check (created_by = auth.uid() or public.current_user_role() = 'admin');

drop policy if exists "users delete own projects" on public.projects;
create policy "users delete own projects"
on public.projects for delete
to authenticated
using (created_by = auth.uid() or public.current_user_role() = 'admin');

drop policy if exists "project members are readable" on public.project_members;
create policy "project members are readable"
on public.project_members for select
to authenticated
using (true);

drop policy if exists "users manage project members" on public.project_members;
create policy "users manage project members"
on public.project_members for all
to authenticated
using (
  public.current_user_role() = 'admin'
  or exists (
    select 1
    from public.projects
    where projects.id = project_members.project_id
      and projects.created_by = auth.uid()
  )
)
with check (
  public.current_user_role() = 'admin'
  or exists (
    select 1
    from public.projects
    where projects.id = project_members.project_id
      and projects.created_by = auth.uid()
  )
);

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

drop policy if exists "task participants read tasks" on public.tasks;
drop policy if exists "authenticated users read tasks" on public.tasks;
create policy "authenticated users read tasks"
on public.tasks for select
to authenticated
using (true);

drop policy if exists "users create tasks" on public.tasks;
create policy "users create tasks"
on public.tasks for insert
to authenticated
with check (creator_id = auth.uid());

drop policy if exists "task participants update tasks" on public.tasks;
create policy "task participants update tasks"
on public.tasks for update
to authenticated
using (
  creator_id = auth.uid()
  or assignee_id = auth.uid()
  or exists (
    select 1 from public.task_watchers
    where task_watchers.task_id = tasks.id
      and task_watchers.user_id = auth.uid()
  )
  or public.current_user_role() = 'admin'
)
with check (
  creator_id = auth.uid()
  or assignee_id = auth.uid()
  or exists (
    select 1 from public.task_watchers
    where task_watchers.task_id = tasks.id
      and task_watchers.user_id = auth.uid()
  )
  or public.current_user_role() = 'admin'
);

drop policy if exists "watchers are readable" on public.task_watchers;
create policy "watchers are readable"
on public.task_watchers for select
to authenticated
using (true);

drop policy if exists "task creator adds watchers" on public.task_watchers;
create policy "task creator adds watchers"
on public.task_watchers for insert
to authenticated
with check (
  exists (
    select 1 from public.tasks
    where tasks.id = task_watchers.task_id
      and tasks.creator_id = auth.uid()
  )
);

drop policy if exists "task participants read comments" on public.task_comments;
create policy "task participants read comments"
on public.task_comments for select
to authenticated
using (
  public.current_user_role() = 'admin'
  or exists (
    select 1 from public.tasks
    where tasks.id = task_comments.task_id
      and (tasks.creator_id = auth.uid() or tasks.assignee_id = auth.uid())
  )
  or exists (
    select 1 from public.task_watchers
    where task_watchers.task_id = task_comments.task_id
      and task_watchers.user_id = auth.uid()
  )
);

drop policy if exists "task participants create comments" on public.task_comments;
create policy "task participants create comments"
on public.task_comments for insert
to authenticated
with check (
  user_id = auth.uid()
  and (
    public.current_user_role() = 'admin'
    or exists (
      select 1 from public.tasks
      where tasks.id = task_comments.task_id
        and (tasks.creator_id = auth.uid() or tasks.assignee_id = auth.uid())
    )
    or exists (
      select 1 from public.task_watchers
      where task_watchers.task_id = task_comments.task_id
        and task_watchers.user_id = auth.uid()
    )
  )
  and public.is_valid_comment_parent(parent_comment_id, task_id)
);

drop policy if exists "users delete own comments" on public.task_comments;
create policy "users delete own comments"
on public.task_comments for delete
to authenticated
using (user_id = auth.uid() or public.current_user_role() = 'admin');

drop policy if exists "task participants read files" on public.task_files;
drop policy if exists "authenticated users read task file records" on public.task_files;
create policy "authenticated users read task file records"
on public.task_files for select
to authenticated
using (true);

drop policy if exists "task participants create file records" on public.task_files;
create policy "task participants create file records"
on public.task_files for insert
to authenticated
with check (uploaded_by = auth.uid());

drop policy if exists "users manage own push subscriptions" on public.push_subscriptions;
create policy "users manage own push subscriptions"
on public.push_subscriptions for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "users manage own push preferences" on public.push_preferences;
create policy "users manage own push preferences"
on public.push_preferences for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "admins read api keys" on public.api_keys;
create policy "admins read api keys"
on public.api_keys for select
to authenticated
using (public.current_user_role() = 'admin');

drop policy if exists "admins create api keys" on public.api_keys;
create policy "admins create api keys"
on public.api_keys for insert
to authenticated
with check (public.current_user_role() = 'admin' and created_by = auth.uid());

drop policy if exists "admins update api keys" on public.api_keys;
create policy "admins update api keys"
on public.api_keys for update
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

drop policy if exists "activity logs are readable to admins" on public.activity_logs;
create policy "activity logs are readable to admins"
on public.activity_logs for select
to authenticated
using (public.current_user_role() = 'admin');

insert into storage.buckets (id, name, public, file_size_limit)
values ('task-files', 'task-files', false, 10485760)
on conflict (id) do update
set public = false,
    file_size_limit = 10485760;

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
