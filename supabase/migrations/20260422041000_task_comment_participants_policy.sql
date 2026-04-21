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
);
