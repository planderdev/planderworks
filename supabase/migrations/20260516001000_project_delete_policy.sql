drop policy if exists "users delete own projects" on public.projects;
create policy "users delete own projects"
on public.projects for delete
to authenticated
using (created_by = auth.uid() or public.current_user_role() = 'admin');
