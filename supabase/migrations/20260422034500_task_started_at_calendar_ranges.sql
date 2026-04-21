alter table public.tasks
add column if not exists started_at timestamptz;

update public.tasks
set started_at = coalesce(started_at, updated_at, created_at)
where status = 'in_progress'
  and started_at is null;

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

drop trigger if exists set_tasks_started_at on public.tasks;
create trigger set_tasks_started_at
before insert or update on public.tasks
for each row execute function public.set_task_started_at();
