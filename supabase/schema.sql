create type public.user_role as enum ('admin', 'manager', 'staff');
create type public.task_status as enum ('pending', 'in_progress', 'blocked', 'completion_requested', 'completed', 'rejected', 'cancelled');
create type public.task_priority as enum ('low', 'normal', 'high');

create table public.job_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null,
  phone text,
  role public.user_role not null default 'staff',
  job_type_id uuid references public.job_types(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_name text,
  phone text,
  memo text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete set null,
  name text not null,
  status text not null default 'active',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tasks (
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

create table public.task_watchers (
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (task_id, user_id)
);

create table public.task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  comment_type text not null default 'comment',
  content text not null,
  created_at timestamptz not null default now()
);

create table public.task_files (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  uploaded_by uuid not null references public.profiles(id),
  file_name text not null,
  file_path text not null,
  file_size bigint,
  mime_type text,
  created_at timestamptz not null default now()
);

create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references public.tasks(id) on delete cascade,
  user_id uuid references public.profiles(id),
  action text not null,
  before_value jsonb,
  after_value jsonb,
  created_at timestamptz not null default now()
);

alter table public.job_types enable row level security;
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.task_watchers enable row level security;
alter table public.task_comments enable row level security;
alter table public.task_files enable row level security;
alter table public.activity_logs enable row level security;

create policy "authenticated users can read job types"
on public.job_types for select
to authenticated
using (true);

create policy "admins can manage job types"
on public.job_types for all
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

create policy "authenticated users can read profiles"
on public.profiles for select
to authenticated
using (true);

create policy "users can update own profile"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "admins can manage profiles"
on public.profiles for all
to authenticated
using (
  exists (
    select 1 from public.profiles admin_profile
    where admin_profile.id = auth.uid()
      and admin_profile.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles admin_profile
    where admin_profile.id = auth.uid()
      and admin_profile.role = 'admin'
  )
);

create policy "authenticated users can read clients"
on public.clients for select
to authenticated
using (true);

create policy "authenticated users can write clients"
on public.clients for insert
to authenticated
with check (created_by = auth.uid());

create policy "authenticated users can read projects"
on public.projects for select
to authenticated
using (true);

create policy "authenticated users can write projects"
on public.projects for insert
to authenticated
with check (created_by = auth.uid());

create policy "task participants can read tasks"
on public.tasks for select
to authenticated
using (
  creator_id = auth.uid()
  or assignee_id = auth.uid()
  or exists (
    select 1 from public.task_watchers
    where task_watchers.task_id = tasks.id
      and task_watchers.user_id = auth.uid()
  )
  or exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in ('admin', 'manager')
  )
);

create policy "authenticated users can create tasks"
on public.tasks for insert
to authenticated
with check (creator_id = auth.uid());

create policy "task participants can update tasks"
on public.tasks for update
to authenticated
using (
  creator_id = auth.uid()
  or assignee_id = auth.uid()
  or exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in ('admin', 'manager')
  )
)
with check (
  creator_id = auth.uid()
  or assignee_id = auth.uid()
  or exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in ('admin', 'manager')
  )
);

create policy "task participants can read watchers"
on public.task_watchers for select
to authenticated
using (true);

create policy "task creator can add watchers"
on public.task_watchers for insert
to authenticated
with check (
  exists (
    select 1 from public.tasks
    where tasks.id = task_watchers.task_id
      and tasks.creator_id = auth.uid()
  )
);

create policy "task participants can read comments"
on public.task_comments for select
to authenticated
using (
  exists (
    select 1 from public.tasks
    where tasks.id = task_comments.task_id
      and (
        tasks.creator_id = auth.uid()
        or tasks.assignee_id = auth.uid()
      )
  )
  or exists (
    select 1 from public.task_watchers
    where task_watchers.task_id = task_comments.task_id
      and task_watchers.user_id = auth.uid()
  )
);

create policy "task participants can create comments"
on public.task_comments for insert
to authenticated
with check (user_id = auth.uid());

create policy "task participants can read files"
on public.task_files for select
to authenticated
using (
  exists (
    select 1 from public.tasks
    where tasks.id = task_files.task_id
      and (
        tasks.creator_id = auth.uid()
        or tasks.assignee_id = auth.uid()
      )
  )
  or exists (
    select 1 from public.task_watchers
    where task_watchers.task_id = task_files.task_id
      and task_watchers.user_id = auth.uid()
  )
);

create policy "task participants can create file records"
on public.task_files for insert
to authenticated
with check (uploaded_by = auth.uid());
