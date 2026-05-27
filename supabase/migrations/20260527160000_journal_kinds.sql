-- 주간업무일지 — kind(업무 종류) 커스터마이징 가능 팔레트
-- 기존: hardcoded ['작업','미팅','작성','요청','견적','출근','문서','확인','기타']
-- 변경: journal_kind_defs 테이블로 분리, 관리자가 추가/수정/삭제 가능

create table if not exists public.journal_kind_defs (
  id text primary key,
  name text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

insert into public.journal_kind_defs (id, name, sort_order) values
  ('k-1', '작업', 10),
  ('k-2', '미팅', 20),
  ('k-3', '작성', 30),
  ('k-4', '요청', 40),
  ('k-5', '견적', 50),
  ('k-6', '출근', 60),
  ('k-7', '문서', 70),
  ('k-8', '확인', 80),
  ('k-9', '기타', 90)
on conflict (id) do update set
  name       = excluded.name,
  sort_order = excluded.sort_order;

-- RLS
alter table public.journal_kind_defs enable row level security;

drop policy if exists "journal kind defs are readable" on public.journal_kind_defs;
create policy "journal kind defs are readable"
on public.journal_kind_defs for select
to authenticated
using (true);

drop policy if exists "admins manage journal kind defs" on public.journal_kind_defs;
create policy "admins manage journal kind defs"
on public.journal_kind_defs for all
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

-- realtime
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'journal_kind_defs'
  ) then
    alter publication supabase_realtime add table public.journal_kind_defs;
  end if;
end $$;
