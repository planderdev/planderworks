alter table public.task_comments
add column if not exists parent_comment_id uuid references public.task_comments(id) on delete cascade;

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
