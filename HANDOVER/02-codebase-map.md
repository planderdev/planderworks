# 02 — 코드베이스 지도

## 디렉토리 구조

```
planderworks/
├── src/                          # 프론트엔드 소스 (전부 여기)
│   ├── main.tsx                  # ⭐ 전체 앱 (단일 파일, ~11k 라인)
│   ├── styles.css                # ⭐ 전체 스타일 (단일 파일, ~9k 라인)
│   ├── types.ts                  # 모든 TypeScript 타입
│   └── supabaseClient.ts         # Supabase 클라이언트 (env 없으면 null)
├── supabase/
│   ├── schema.sql                # 전체 스키마 스냅샷
│   ├── migrations/               # 시간순 마이그레이션 (33개)
│   ├── functions/                # Edge Functions (Deno)
│   │   ├── _shared/cors.ts
│   │   ├── create-meeting-minute/      # 외부 녹음 앱 → 회의록 자동등록
│   │   ├── create-personal-schedule/   # 외부 캘린더 → 개인일정 자동등록
│   │   ├── create-user/                # 관리자 직원 추가
│   │   ├── update-user/                # 직원 정보 수정
│   │   ├── delete-task/                # 업무 영구 삭제 (RLS 우회)
│   │   ├── send-task-notification/     # 푸시: 업무 배정 알림
│   │   ├── send-comment-notification/
│   │   ├── send-meeting-minute-notification/
│   │   ├── send-notice-notification/
│   │   ├── send-project-message-notification/
│   │   └── sync-google-calendar/       # 구글 캘린더 양방향 동기화
│   └── config.toml
├── api/
│   └── marketing-lead.js         # Vercel API (외부 폼 → Supabase)
├── scripts/
│   └── write-build-meta.mjs      # 빌드 시 commit/builtAt 기록 → dist/build-meta.json
├── public/
│   ├── sw.js                     # Service Worker (오프라인 + 푸시)
│   ├── site.webmanifest          # PWA manifest
│   ├── plander-admin-logo.svg
│   └── app-icon-*.png
├── electron/
│   └── main.cjs                  # 데스크탑 진입점
├── ios/, android/                # Capacitor 네이티브 프로젝트
├── docs/harness/planderworks/
│   └── team-spec.md              # 하네스 사양
├── .agents/skills/               # Claude Code용 스킬 정의
│   └── planderworks-*/SKILL.md   # 6개 (orchestrator, ui-screen, task-workflow 등)
├── .codex/skills/                # Codex CLI용 동일 스킬 미러
├── AGENTS.md                     # 에이전트 진입 가이드
├── HANDOVER/                     # ⭐ 이 문서들
├── README.md
├── package.json
├── tsconfig.json, tsconfig.typecheck.json
├── vite.config.ts
├── vercel.json                   # 캐시 헤더 + SPA rewrite
├── capacitor.config.ts
├── .env.local                    # ⛔ 미커밋, 로컬 환경변수 (없으면 프로토타입 모드)
└── .gitignore
```

## 핵심 파일

### `src/main.tsx` (단일 거대 파일)
- 전체 React 앱 — 분리된 컴포넌트 파일 없음
- 페이지 컴포넌트들: `DashboardPage`, `TaskListPage`, `ProjectPage`, `MeetingMinutesPage`, `CalendarPage`, `NoticesPage`, `ReportsPage`, `JournalPage`, `ClientsPage`, `EmployeesPage`, `OperationsPage`, `SettingsPage`
- 시드 데이터(`seedTasks`, `seedProjects`, `seedClients`, …) — 프로토타입 모드/Supabase 없을 때 사용
- 모든 핸들러(`addTask`, `updateTask`, `addJournalEntry` 등) — Supabase 있으면 DB call, 없으면 in-memory 상태만 변경

### `src/styles.css`
- 디자인 토큰(`--bg`, `--surface`, `--text`, `--accent` …) — 라이트/다크 테마는 `:root[data-theme='light|dark']` 셀렉터로 토큰만 바꿈
- 모든 컴포넌트별 스타일 (페이지·카드·버튼·인풋·테이블 …)
- 일부 글로벌 룰에 `!important` 박혀있음 (예: `input, select, textarea { background: var(--panel) !important; }`) — 새로 추가 금지, 이미 박힌 건 살펴서 우회

### `src/types.ts`
- `ActiveView` (네비게이션 뷰 enum)
- `Task`, `Project`, `Client`, `Employee`, `MeetingMinute`, `Notice`, `OperationItem`, `WorkSchedule`, `WorkJournalEntry`, `JournalStatusDef`, `WeeklyContract` 등
- Handler 시그니처 타입 (`*SubmitHandler`, `*UpdateHandler` …)

### `src/supabaseClient.ts`
- `import.meta.env.VITE_SUPABASE_URL` 와 `VITE_SUPABASE_PUBLISHABLE_KEY` 둘 다 있으면 클라이언트 생성, 없으면 `null` 반환
- `supabase`가 null이면 앱은 프로토타입 모드(in-memory 시드)로 동작

## 디자인 시스템
- `design-samples/plander-design-system.md` — 디자인 토큰·간격·타이포 가이드
- `proposal-draft/`, `design-samples/figma-export/` — 디자인 레퍼런스

## 빌드 산출물

- `dist/` — `npm run build` 결과 (git ignored)
- `dist/build-meta.json` — `{ version, commit, builtAt }` — 운영 URL의 현재 배포 커밋 확인용
