create table if not exists public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create index if not exists project_members_user_id_idx
on public.project_members(user_id);

alter table public.project_members enable row level security;

insert into public.project_members(project_id, user_id)
select project_id, user_id
from (
  select id as project_id, created_by as user_id
  from public.projects
  where created_by is not null

  union

  select project_id, creator_id as user_id
  from public.tasks
  where project_id is not null

  union

  select project_id, assignee_id as user_id
  from public.tasks
  where project_id is not null
    and assignee_id is not null

  union

  select tasks.project_id, task_watchers.user_id
  from public.tasks
  join public.task_watchers on task_watchers.task_id = tasks.id
  where tasks.project_id is not null
) seed_members
where project_id is not null
  and user_id is not null
on conflict (project_id, user_id) do nothing;

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

drop policy if exists "users update own projects" on public.projects;
create policy "users update own projects"
on public.projects for update
to authenticated
using (created_by = auth.uid() or public.current_user_role() = 'admin')
with check (created_by = auth.uid() or public.current_user_role() = 'admin');

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'project_members'
  ) then
    alter publication supabase_realtime add table public.project_members;
  end if;
end $$;
