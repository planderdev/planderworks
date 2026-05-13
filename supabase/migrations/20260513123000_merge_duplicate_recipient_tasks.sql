insert into public.task_watchers (task_id, user_id)
select id, assignee_id
from public.tasks
where assignee_id is not null
on conflict do nothing;

with duplicate_groups as (
  select
    title,
    coalesce(description, '') as description_key,
    task_type,
    status,
    priority,
    creator_id,
    coalesce(client_id::text, '') as client_id_key,
    coalesce(project_id::text, '') as project_id_key,
    coalesce(due_at::text, '') as due_at_key,
    date_trunc('minute', created_at) as created_minute,
    (array_agg(id order by created_at, id::text))[1] as keep_id,
    array_agg(id order by created_at, id::text) as task_ids,
    count(*) as task_count
  from public.tasks
  group by
    title,
    coalesce(description, ''),
    task_type,
    status,
    priority,
    creator_id,
    coalesce(client_id::text, ''),
    coalesce(project_id::text, ''),
    coalesce(due_at::text, ''),
    date_trunc('minute', created_at)
  having count(*) > 1
),
duplicate_tasks as (
  select
    duplicate_groups.keep_id,
    unnest(duplicate_groups.task_ids) as task_id
  from duplicate_groups
),
removed_tasks as (
  select keep_id, task_id
  from duplicate_tasks
  where task_id <> keep_id
)
insert into public.task_watchers (task_id, user_id)
select distinct removed_tasks.keep_id, tasks.assignee_id
from removed_tasks
join public.tasks on tasks.id = removed_tasks.task_id
where tasks.assignee_id is not null
on conflict do nothing;

with duplicate_groups as (
  select
    title,
    coalesce(description, '') as description_key,
    task_type,
    status,
    priority,
    creator_id,
    coalesce(client_id::text, '') as client_id_key,
    coalesce(project_id::text, '') as project_id_key,
    coalesce(due_at::text, '') as due_at_key,
    date_trunc('minute', created_at) as created_minute,
    (array_agg(id order by created_at, id::text))[1] as keep_id,
    array_agg(id order by created_at, id::text) as task_ids
  from public.tasks
  group by
    title,
    coalesce(description, ''),
    task_type,
    status,
    priority,
    creator_id,
    coalesce(client_id::text, ''),
    coalesce(project_id::text, ''),
    coalesce(due_at::text, ''),
    date_trunc('minute', created_at)
  having count(*) > 1
),
removed_tasks as (
  select duplicate_groups.keep_id, unnest(duplicate_groups.task_ids) as task_id
  from duplicate_groups
)
update public.task_files
set task_id = removed_tasks.keep_id
from removed_tasks
where task_files.task_id = removed_tasks.task_id
  and removed_tasks.task_id <> removed_tasks.keep_id;

with duplicate_groups as (
  select
    title,
    coalesce(description, '') as description_key,
    task_type,
    status,
    priority,
    creator_id,
    coalesce(client_id::text, '') as client_id_key,
    coalesce(project_id::text, '') as project_id_key,
    coalesce(due_at::text, '') as due_at_key,
    date_trunc('minute', created_at) as created_minute,
    (array_agg(id order by created_at, id::text))[1] as keep_id,
    array_agg(id order by created_at, id::text) as task_ids
  from public.tasks
  group by
    title,
    coalesce(description, ''),
    task_type,
    status,
    priority,
    creator_id,
    coalesce(client_id::text, ''),
    coalesce(project_id::text, ''),
    coalesce(due_at::text, ''),
    date_trunc('minute', created_at)
  having count(*) > 1
),
removed_tasks as (
  select duplicate_groups.keep_id, unnest(duplicate_groups.task_ids) as task_id
  from duplicate_groups
)
update public.task_comments
set task_id = removed_tasks.keep_id
from removed_tasks
where task_comments.task_id = removed_tasks.task_id
  and removed_tasks.task_id <> removed_tasks.keep_id;

with duplicate_groups as (
  select
    title,
    coalesce(description, '') as description_key,
    task_type,
    status,
    priority,
    creator_id,
    coalesce(client_id::text, '') as client_id_key,
    coalesce(project_id::text, '') as project_id_key,
    coalesce(due_at::text, '') as due_at_key,
    date_trunc('minute', created_at) as created_minute,
    (array_agg(id order by created_at, id::text))[1] as keep_id,
    array_agg(id order by created_at, id::text) as task_ids
  from public.tasks
  group by
    title,
    coalesce(description, ''),
    task_type,
    status,
    priority,
    creator_id,
    coalesce(client_id::text, ''),
    coalesce(project_id::text, ''),
    coalesce(due_at::text, ''),
    date_trunc('minute', created_at)
  having count(*) > 1
),
removed_tasks as (
  select duplicate_groups.keep_id, unnest(duplicate_groups.task_ids) as task_id
  from duplicate_groups
)
delete from public.tasks
using removed_tasks
where tasks.id = removed_tasks.task_id
  and removed_tasks.task_id <> removed_tasks.keep_id;
