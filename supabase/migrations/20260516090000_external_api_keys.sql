create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  scope text not null check (scope in ('personal_schedule')),
  key_prefix text not null,
  key_hash text not null unique,
  active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists api_keys_scope_idx on public.api_keys(scope);
create index if not exists api_keys_active_idx on public.api_keys(active);

drop trigger if exists set_api_keys_updated_at on public.api_keys;
create trigger set_api_keys_updated_at
before update on public.api_keys
for each row execute function public.set_updated_at();

alter table public.api_keys enable row level security;

drop policy if exists "admins read api keys" on public.api_keys;
create policy "admins read api keys"
on public.api_keys for select
to authenticated
using (public.current_user_role() = 'admin');

drop policy if exists "admins create api keys" on public.api_keys;
create policy "admins create api keys"
on public.api_keys for insert
to authenticated
with check (public.current_user_role() = 'admin' and created_by = auth.uid());

drop policy if exists "admins update api keys" on public.api_keys;
create policy "admins update api keys"
on public.api_keys for update
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

alter table public.calendar_schedules
add column if not exists external_source text,
add column if not exists external_id text;

create unique index if not exists calendar_schedules_external_unique_idx
on public.calendar_schedules(external_source, external_id)
where external_source is not null and external_id is not null;
