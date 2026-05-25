# 공지 게시판 (Notices Board) — 설계 문서

> 작성 2026-05-24, 결정 반영 업데이트. 구현 전 구조 설계. 기준: 기존 **회의록 게시판(meeting_minutes)** + **업무 댓글(task comments)** + **project_message_reads** 패턴 복제.

## 확정 사항
- **메뉴명**: 사이드바 라벨 = **"공지/전달사항"**.
- **작성**: 관리자만 / **읽기**: 전원.
- **카테고리**: 관리자 페이지에서 커스터마이징 (회의록 카테고리 관리와 동일 패턴, 별도 테이블).
- **작성 폼**: 제목 옆에 **[중요] 체크**, **[상단고정] 체크**, **[댓글 허용] 체크**, **[메인 접속 팝업] 체크 (+ 팝업 종료 날짜)**.
- **댓글**: 기능 넣되 **공지별로 댓글 허용/비허용 설정** (작성 시 토글).
- **읽음확인 없음**: 서버 읽음추적(notice_reads) **제거**. 사이드바 **새글 배지는 localStorage**(마지막 본 시점 이후 새 공지 개수)만.
- **푸시**: **중요(important) 공지 = 전원 강제 발송**(개인 설정 무시). **일반 공지 = 설정창 '공지' 토글(notice_enabled) 켠 사람만**.
- **메인 접속 팝업**: `popup=true`인 공지는 메인(대시보드) 접속 시 모달 팝업. `popup_until` 날짜까지만. 팝업에 **닫기 버튼 + "하루동안 안보이게" 체크박스**(체크 시 24h 동안 그 공지 팝업 숨김, localStorage).

---

## 0. 설계 원칙
- 검증된 패턴 복제: 게시판=`meeting_minutes`, 카테고리=`meeting_minute_categories`, 댓글=task comments(+replies). (읽음확인은 두지 않음 — 새글 배지만 localStorage)
- **배포 순서 안전성 1순위** (지난 `meeting_enabled` 사고: 프론트가 없는 테이블/컬럼 쿼리 → `loadBackendData` 전체 중단 → 앱 먹통). §7 참고.

---

## 1. 데이터 모델 (DB 마이그레이션 — 대시보드 SQL Editor로 배포 가능)

### 1-1. `notice_categories` (커스터마이징, 관리자 관리)
```sql
create table if not exists public.notice_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
insert into public.notice_categories (name, sort_order) values
  ('없음', 0), ('일반', 10), ('이벤트', 20), ('긴급', 30)
on conflict (name) do update set is_active = true, sort_order = excluded.sort_order;
-- '없음'은 기본 카테고리(작성 시 기본 선택). 카테고리 미선택/일반 공지용.
-- RLS: read=authenticated(true) / for all = admin (current_user_role()='admin')
```

### 1-2. `notices`
```sql
create table if not exists public.notices (
  id uuid primary key default gen_random_uuid(),
  category text not null default '없음',
  title text not null,
  content text not null default '',
  important boolean not null default false,      -- 중요 체크 (푸시 전원 강제)
  pinned boolean not null default false,         -- 상단고정 체크
  allow_comments boolean not null default true,  -- 댓글 허용 체크
  popup boolean not null default false,          -- 메인 접속 시 팝업
  popup_until date,                              -- 팝업 종료 날짜(이 날짜까지 표시, null=무기한)
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists notices_sort_idx on public.notices(pinned desc, created_at desc);
create index if not exists notices_category_idx on public.notices(category);
-- trigger set_updated_at (기존 함수)
-- RLS: read=authenticated(true) / insert·update·delete = admin
-- realtime publication add (회의록과 동일)
```

### 1-3. `notice_comments` (업무 댓글 패턴 복제, 답글 지원)
```sql
create table if not exists public.notice_comments (
  id uuid primary key default gen_random_uuid(),
  notice_id uuid not null references public.notices(id) on delete cascade,
  parent_comment_id uuid references public.notice_comments(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  content text not null,
  created_at timestamptz not null default now()
);
create index if not exists notice_comments_notice_idx on public.notice_comments(notice_id, created_at);
-- RLS: read=authenticated(true)
--      insert = author 본인(user_id=auth.uid()) + (해당 notice의 allow_comments=true)  ※ 정책에서 EXISTS로 체크
--      delete = 본인 or admin
-- realtime publication add
```

### 1-4. (읽음확인 없음)
- 서버 읽음추적 테이블 두지 않음. **새글 배지 = localStorage `notices-last-seen`** 타임스탬프 → `createdAt > lastSeen` 개수. 공지 페이지 진입 시 now로 갱신. (기기별, DB 불필요)

---

## 2. 권한
- **RLS**: notices·notice_categories write = admin / read 전원. notice_comments = 본인 작성·삭제(+admin 삭제), 읽기 전원, insert 시 allow_comments 확인.
- **UI 게이팅**: 공지 작성·수정·삭제·pin·카테고리관리 버튼 = `currentUser.accountRole === 'admin'`만. 댓글은 전원(allow_comments=true인 공지에서).
- 프로토타입 모드: seed/로컬 state.

---

## 3. 프론트엔드 구조

### 3-1. types.ts
```ts
export type NoticeComment = { id; noticeId; parentId?; userId?; author; avatarUrl?; content; createdAt };
export type Notice = {
  id; category; title; content;
  important: boolean; pinned: boolean; allowComments: boolean;
  popup: boolean; popupUntil?: string | null;
  createdBy?; author; authorAvatarUrl?; createdAt?; updatedAt?;
  comments: NoticeComment[];
};
export type NoticeDraft = Pick<Notice,'category'|'title'|'content'|'important'|'pinned'|'allowComments'|'popup'|'popupUntil'>;
// handlers: NoticeSubmit/Update/Delete, NoticeCommentSubmit/Delete, NoticeCategory 관리 핸들러
```
- `ActiveView`에 `'notices'` 추가.

### 3-2. main.tsx
- `isImmersiveView`에 `'notices'` 추가.
- 사이드바 nav: `{ id:'notices', label:'공지/전달사항', icon: Megaphone }` (lucide `Megaphone` import).
- state: `notices`, `noticeCategories` (+ seed). `loadBackendData`에서 **TOLERANT 로드**(§7).
- 핸들러: addNotice / updateNotice / deleteNotice / togglePinNotice / toggleImportant / addNoticeComment / deleteNoticeComment / 카테고리 CRUD. (회의록 핸들러 복제, 읽음추적 핸들러 없음)
- `addNotice` → insert 후 `send-notice-notification` invoke.
- `navUnreadBadges.notices` = **localStorage `notices-last-seen` 이후 새 공지 개수**. 공지 페이지 진입 시 last-seen 갱신.

### 3-3. NoticesPage (회의록 페이지 복제)
- ImmersivePageFrame, 관리자면 action="공지 작성".
- 목록 정렬: **pinned desc → created_at desc**. 카테고리 필터칩. pinned 📌 / important 🔴(또는 '중요' 뱃지) 표시.
- 카드 펼침 → 상세 + (allow_comments면) 댓글 영역.
- **작성/수정 모달**: 제목 입력 + 옆에 [중요][상단고정][댓글허용][메인 접속 팝업] 체크 + (팝업 체크 시) **팝업 종료 날짜** date input + 카테고리 select + 내용 textarea. (관리자만)
- 카드 액션(관리자): 수정 / 삭제 / 고정토글.

### 3-4. 메인 접속 팝업 (NoticePopup)
- 위치: App 최상단(대시보드/메인 렌더 시) — 로그인 후 메인 진입에서 1회 평가.
- 조건: `popup === true` AND (`popup_until` 없음 OR `popup_until >= 오늘`) AND **로컬 미차단**(localStorage `notice-popup-dismissed-{id}` 타임스탬프가 24h 안 지났으면 숨김).
- 여러 개면: 중요(important) 우선 → 최신순으로 1개씩(또는 스택). v1은 1개(가장 우선)만.
- 모달 UI: 제목·내용 + **닫기 버튼** + **"하루동안 안보이게" 체크박스** — **이 둘은 모든 팝업에 항상 표시(필수, 조건 없음)**. 닫기=이번 세션만 닫음 / 체크 후 닫으면 `notice-popup-dismissed-{id}=now` 저장 → 24h 숨김.

### 3-5. 카테고리 관리 (관리자)
- 설정 > 관리 섹션에 "공지 카테고리 관리" 버튼 → 모달 (회의록 카테고리 관리 UI 복제).

---

## 4. 푸시 알림
- `send-notice-notification` 엣지함수 = `send-meeting-minute-notification` 복제 + **important 분기**:
  - **중요 공지(`important=true`)** → push_subscriptions **전체에 강제 발송** (notice_enabled 무시).
  - **일반 공지(`important=false`)** → `push_preferences.notice_enabled` 켠 유저(미설정=기본 true)에게만.
  - 트리거: `addNotice` → insert → `invoke('send-notice-notification',{noticeId})`. (함수가 notice의 important를 읽어 분기)
  - payload: `{ title:(important?'[중요] ':'')+'새 공지: '+title, body: category+' · '+author, url:'/#notices' }`. sw.js 아이콘 이미 Works.
- **설정 > 알림에 '공지' 토글 추가** = `push_preferences.notice_enabled` 컬럼 신설.
  - 프론트 push-preference 배선: 기존 `task/report/projectMessage`에 `notice` 추가 (types `PushPreferences`, defaultPushPreferences, DB select/mapping, upsert, 설정 UI 토글). ※ 이전 `meeting_enabled` 시도와 동일 구조 (그땐 revert됨 — 순서 때문).
  - ⚠️ **`meeting_enabled` 사고 재발 방지**: `notice_enabled` 마이그레이션을 **반드시 먼저 배포**한 뒤 프론트(select/upsert에 notice_enabled 포함)를 올릴 것. 또는 push_preferences 로드를 tolerant 처리.
- ⚠️ **함수 배포 = CLI = 컴퓨터** (모바일 불가).

---

## 5. 배포 순서 (★ 가장 중요)
1. **마이그레이션 먼저** (notice_categories, notices, notice_comments + RLS, **+ `alter push_preferences add notice_enabled boolean default true`**) — 대시보드 SQL Editor (모바일 OK).
2. 프론트 notices/categories/comments/push_preferences 로드를 **tolerant**하게 (테이블/컬럼 없을 때 에러가 `loadBackendData` 전체를 막지 않게 — 폴백). **특히 push_preferences.notice_enabled는 컬럼 배포 후에 프론트 select/upsert에 포함** (meeting_enabled 사고 방지).
3. 프론트 배포 (git → Vercel).
4. `send-notice-notification` 함수 배포 — **컴퓨터/CLI**.
5. VAPID 정상이라 재구독 불필요.

---

## 6. 구현 체크리스트
- [ ] 마이그레이션 3테이블(notice_categories, notices, notice_comments + RLS, realtime, 트리거) + **push_preferences.notice_enabled 컬럼**
- [ ] types.ts: Notice/NoticeComment/Draft/handlers + ActiveView 'notices' + **PushPreferences에 notice 추가**
- [ ] main.tsx: state·seed·load(tolerant)·핸들러·nav·배지(localStorage)·isImmersiveView + **push pref notice 배선(select/mapping/upsert)**
- [ ] NoticesPage + 작성모달(중요/고정/댓글허용/**팝업+종료날짜** 체크 + 카테고리) + 댓글
- [ ] **NoticePopup 컴포넌트** (메인 접속 시 팝업, 닫기 + 하루안보기 localStorage)
- [ ] 설정>관리에 공지 카테고리 관리 모달 + **설정>알림에 '공지' 토글(notice_enabled)**
- [ ] send-notice-notification 엣지함수 (**important면 전원 강제 / 아니면 notice_enabled 필터**) + 배포(컴퓨터)
- [ ] 권한 가드(admin) + RLS 확인 + 배포순서 §5 준수
