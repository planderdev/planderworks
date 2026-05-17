drop policy if exists "admins delete api keys" on public.api_keys;
create policy "admins delete api keys"
on public.api_keys for delete
to authenticated
using (public.current_user_role() = 'admin' and active = false);
