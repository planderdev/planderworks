-- 주간업무일지 (Weekly Work Journal)
-- - work_journal_entries: 일지 entry (사용자별)
-- - journal_status_defs : 상태 팔레트 (전역, admin이 관리. 모든 직원 공유)
-- - weekly_contracts    : 이번주 진행중 계약·할일 표 (사용자별)
--
-- RLS: 읽기 전원 (다른 직원 일지 열람), 쓰기 본인+admin

-- ─── 상태 팔레트 (전역) ─────────────────────────────────────────────
create table if not exists public.journal_status_defs (
  id text primary key,
  name text not null unique,
  phase text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

insert into public.journal_status_defs (id, name, phase, sort_order) values
  ('st-1',  '작업예정',       'plan',      10),
  ('st-2',  '작업진행중',     'progress',  20),
  ('st-3',  '작업완료',       'done',      30),
  ('st-4',  '미팅예정',       'plan',      40),
  ('st-5',  '미팅중',         'progress',  50),
  ('st-6',  '미팅완료',       'done',      60),
  ('st-7',  '작성예정',       'plan',      70),
  ('st-8',  '작성중',         'progress',  80),
  ('st-9',  '제출완료',       'done',      90),
  ('st-10', '요청예정',       'plan',     100),
  ('st-11', '요청확인',       'progress', 110),
  ('st-12', '수행완료',       'done',     120),
  ('st-13', '견적예정',       'plan',     130),
  ('st-14', '견적중',         'progress', 140),
  ('st-15', '견적완료',       'done',     150),
  ('st-16', '마케팅실행중',   'execute',  160),
  ('st-17', '필수',           'must',     170),
  ('st-18', '내일작업',       'next',     180),
  ('st-19', '일정변경',       'change',   190),
  ('st-20', '이어서',         'continue', 200),
  ('st-21', '중지',           'stop',     210),
  ('st-22', '매니저와진행',   'coop',     220),
  ('st-23', '신이사와진행',   'coop',     230),
  ('st-24', '최실장과진행',   'coop',     240),
  ('st-25', '인성팀장과진행', 'coop',     250),
  ('st-26', '이슬팀장과진행', 'coop',     260),
  ('st-27', '개발자와진행',   'coop',     270),
  ('st-28', '이동욱작업',     'coop',     280)
on conflict (id) do update set
  name       = excluded.name,
  phase      = excluded.phase,
  sort_order = excluded.sort_order;

-- ─── 일지 entry ─────────────────────────────────────────────────────
create table if not exists public.work_journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  week_start date not null,
  date date not null,
  kind text not null default '작업',
  title text not null default '',
  detail text not null default '',
  status text not null default '',
  project_id uuid references public.projects(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  source text not null default 'manual',
  source_ref text,
  edited boolean not null default false,
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists work_journal_entries_user_week_idx
on public.work_journal_entries(user_id, week_start desc, date desc, created_at);

drop trigger if exists set_work_journal_entries_updated_at on public.work_journal_entries;
create trigger set_work_journal_entries_updated_at
before update on public.work_journal_entries
for each row execute function public.set_updated_at();

-- ─── 이번주 진행중 계약·할일 ──────────────────────────────────────
create table if not exists public.weekly_contracts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  week_start date not null,
  sequence integer not null default 0,
  company text not null default '',
  due_date text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists weekly_contracts_user_week_idx
on public.weekly_contracts(user_id, week_start desc, sequence);

-- ─── RLS ────────────────────────────────────────────────────────────
alter table public.journal_status_defs enable row level security;
alter table public.work_journal_entries enable row level security;
alter table public.weekly_contracts enable row level security;

-- journal_status_defs: 읽기 전원, 쓰기 admin
drop policy if exists "journal status defs are readable" on public.journal_status_defs;
create policy "journal status defs are readable"
on public.journal_status_defs for select
to authenticated
using (true);

drop policy if exists "admins manage journal status defs" on public.journal_status_defs;
create policy "admins manage journal status defs"
on public.journal_status_defs for all
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

-- work_journal_entries: 읽기 전원(다른 직원 일지 열람), 쓰기 본인+admin
drop policy if exists "journal entries are readable" on public.work_journal_entries;
create policy "journal entries are readable"
on public.work_journal_entries for select
to authenticated
using (true);

drop policy if exists "users create own journal entries" on public.work_journal_entries;
create policy "users create own journal entries"
on public.work_journal_entries for insert
to authenticated
with check (user_id = auth.uid() or public.current_user_role() = 'admin');

drop policy if exists "users update own journal entries" on public.work_journal_entries;
create policy "users update own journal entries"
on public.work_journal_entries for update
to authenticated
using (user_id = auth.uid() or public.current_user_role() = 'admin')
with check (user_id = auth.uid() or public.current_user_role() = 'admin');

drop policy if exists "users delete own journal entries" on public.work_journal_entries;
create policy "users delete own journal entries"
on public.work_journal_entries for delete
to authenticated
using (user_id = auth.uid() or public.current_user_role() = 'admin');

-- weekly_contracts: 읽기 전원, 쓰기 본인+admin
drop policy if exists "weekly contracts are readable" on public.weekly_contracts;
create policy "weekly contracts are readable"
on public.weekly_contracts for select
to authenticated
using (true);

drop policy if exists "users create own weekly contracts" on public.weekly_contracts;
create policy "users create own weekly contracts"
on public.weekly_contracts for insert
to authenticated
with check (user_id = auth.uid() or public.current_user_role() = 'admin');

drop policy if exists "users update own weekly contracts" on public.weekly_contracts;
create policy "users update own weekly contracts"
on public.weekly_contracts for update
to authenticated
using (user_id = auth.uid() or public.current_user_role() = 'admin')
with check (user_id = auth.uid() or public.current_user_role() = 'admin');

drop policy if exists "users delete own weekly contracts" on public.weekly_contracts;
create policy "users delete own weekly contracts"
on public.weekly_contracts for delete
to authenticated
using (user_id = auth.uid() or public.current_user_role() = 'admin');

-- ─── realtime publication ──────────────────────────────────────────
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'work_journal_entries'
  ) then
    alter publication supabase_realtime add table public.work_journal_entries;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'journal_status_defs'
  ) then
    alter publication supabase_realtime add table public.journal_status_defs;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'weekly_contracts'
  ) then
    alter publication supabase_realtime add table public.weekly_contracts;
  end if;
end $$;
