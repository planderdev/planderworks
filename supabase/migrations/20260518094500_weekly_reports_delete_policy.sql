drop policy if exists "users delete own weekly reports" on public.weekly_reports;
create policy "users delete own weekly reports"
on public.weekly_reports for delete
to authenticated
using (user_id = auth.uid() or public.current_user_role() = 'admin');
