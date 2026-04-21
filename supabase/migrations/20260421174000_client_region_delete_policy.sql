alter table public.clients
add column if not exists region text;

drop policy if exists "users delete own clients" on public.clients;
create policy "users delete own clients"
on public.clients for delete
to authenticated
using (created_by = auth.uid() or public.current_user_role() = 'admin');
