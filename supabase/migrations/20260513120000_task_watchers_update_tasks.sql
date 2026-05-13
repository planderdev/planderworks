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
