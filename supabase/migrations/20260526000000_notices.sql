-- 공지/전달사항 게시판
-- - notice_categories: 관리자 커스터마이징 카테고리
-- - notices: 본문 + important/pinned/allow_comments/popup/popup_until 플래그
-- - notice_comments: 답글 지원 (parent_comment_id self-ref)
-- - push_preferences.notice_enabled: 일반 공지 푸시 토글 (중요 공지는 무시 = 전원 강제)
--
-- 회의록 패턴 복제. 읽음추적(notice_reads)은 두지 않음 — 새글 배지는 localStorage.

create table if not exists public.notice_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

insert into public.notice_categories (name, sort_order)
values
  ('없음', 0),
  ('일반', 10),
  ('이벤트', 20),
  ('긴급', 30)
on conflict (name) do update
set is_active = true,
    sort_order = excluded.sort_order;

create table if not exists public.notices (
  id uuid primary key default gen_random_uuid(),
  category text not null default '없음',
  title text not null,
  content text not null default '',
  important boolean not null default false,
  pinned boolean not null default false,
  allow_comments boolean not null default true,
  popup boolean not null default false,
  popup_until date,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notices_sort_idx
on public.notices(pinned desc, created_at desc);

create index if not exists notices_category_idx
on public.notices(category);

drop trigger if exists set_notices_updated_at on public.notices;
create trigger set_notices_updated_at
before update on public.notices
for each row execute function public.set_updated_at();

create table if not exists public.notice_comments (
  id uuid primary key default gen_random_uuid(),
  notice_id uuid not null references public.notices(id) on delete cascade,
  parent_comment_id uuid references public.notice_comments(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists notice_comments_notice_idx
on public.notice_comments(notice_id, created_at);

-- RLS
alter table public.notice_categories enable row level security;
alter table public.notices enable row level security;
alter table public.notice_comments enable row level security;

-- notice_categories: read=전원, write=admin
drop policy if exists "notice categories are readable" on public.notice_categories;
create policy "notice categories are readable"
on public.notice_categories for select
to authenticated
using (true);

drop policy if exists "admins manage notice categories" on public.notice_categories;
create policy "admins manage notice categories"
on public.notice_categories for all
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

-- notices: read=전원, insert/update/delete=admin
drop policy if exists "notices are readable" on public.notices;
create policy "notices are readable"
on public.notices for select
to authenticated
using (true);

drop policy if exists "admins create notices" on public.notices;
create policy "admins create notices"
on public.notices for insert
to authenticated
with check (public.current_user_role() = 'admin');

drop policy if exists "admins update notices" on public.notices;
create policy "admins update notices"
on public.notices for update
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

drop policy if exists "admins delete notices" on public.notices;
create policy "admins delete notices"
on public.notices for delete
to authenticated
using (public.current_user_role() = 'admin');

-- notice_comments: read=전원, insert=본인+해당 공지 allow_comments=true, delete=본인 or admin
drop policy if exists "notice comments are readable" on public.notice_comments;
create policy "notice comments are readable"
on public.notice_comments for select
to authenticated
using (true);

drop policy if exists "users create notice comments" on public.notice_comments;
create policy "users create notice comments"
on public.notice_comments for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.notices n
    where n.id = notice_comments.notice_id
      and n.allow_comments = true
  )
);

drop policy if exists "users delete own notice comments" on public.notice_comments;
create policy "users delete own notice comments"
on public.notice_comments for delete
to authenticated
using (user_id = auth.uid() or public.current_user_role() = 'admin');

-- push_preferences.notice_enabled (일반 공지 푸시 토글)
alter table public.push_preferences
add column if not exists notice_enabled boolean not null default true;

-- realtime publication
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notices'
  ) then
    alter publication supabase_realtime add table public.notices;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notice_categories'
  ) then
    alter publication supabase_realtime add table public.notice_categories;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notice_comments'
  ) then
    alter publication supabase_realtime add table public.notice_comments;
  end if;
end $$;
