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

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null,
  phone text,
  role public.user_role not null default 'staff',
  job_type_id uuid references public.job_types(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_name text,
  phone text,
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
  user_id uuid not null references public.profiles(id),
  comment_type text not null default 'comment',
  content text not null,
  created_at timestamptz not null default now()
);

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

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
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

drop trigger if exists set_push_subscriptions_updated_at on public.push_subscriptions;
create trigger set_push_subscriptions_updated_at
before update on public.push_subscriptions
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

alter table public.job_types enable row level security;
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.task_watchers enable row level security;
alter table public.task_comments enable row level security;
alter table public.task_files enable row level security;
alter table public.activity_logs enable row level security;
alter table public.push_subscriptions enable row level security;

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

drop policy if exists "task participants read tasks" on public.tasks;
create policy "task participants read tasks"
on public.tasks for select
to authenticated
using (
  creator_id = auth.uid()
  or assignee_id = auth.uid()
  or public.current_user_role() = 'admin'
  or exists (
    select 1 from public.task_watchers
    where task_watchers.task_id = tasks.id
      and task_watchers.user_id = auth.uid()
  )
);

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
  or public.current_user_role() = 'admin'
)
with check (
  creator_id = auth.uid()
  or assignee_id = auth.uid()
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
with check (user_id = auth.uid());

drop policy if exists "task participants read files" on public.task_files;
create policy "task participants read files"
on public.task_files for select
to authenticated
using (
  public.current_user_role() = 'admin'
  or exists (
    select 1 from public.tasks
    where tasks.id = task_files.task_id
      and (tasks.creator_id = auth.uid() or tasks.assignee_id = auth.uid())
  )
  or exists (
    select 1 from public.task_watchers
    where task_watchers.task_id = task_files.task_id
      and task_watchers.user_id = auth.uid()
  )
);

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

drop policy if exists "activity logs are readable to admins" on public.activity_logs;
create policy "activity logs are readable to admins"
on public.activity_logs for select
to authenticated
using (public.current_user_role() = 'admin');
