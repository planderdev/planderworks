# 05 — Supabase 백엔드

## 프로젝트 구성
- **DB**: Postgres (RLS 활성)
- **Auth**: 이메일/비밀번호
- **Storage**: 업무 첨부파일 (`task-files` 버킷), 직원 아바타 (`avatars` 버킷)
- **Edge Functions**: Deno 런타임, `supabase/functions/` 폴더 자동 배포

## 마이그레이션
- 위치: `supabase/migrations/` (시간 prefix 33개 파일)
- 시간순으로 적용 (최신: `20260528000000_tasks_start_at.sql`)
- 스냅샷: `supabase/schema.sql` — 한 파일로 전체 스키마 (참고용, 마이그레이션과 따로 관리)

### 새 마이그레이션 추가
```bash
# 파일명 형식: YYYYMMDDHHMMSS_descriptive_name.sql
touch supabase/migrations/$(date +%Y%m%d%H%M%S)_<name>.sql
# SQL 작성 후
supabase db push --project-ref <PROJECT_REF>
```

### 적용 전 검증
- 운영에 바로 push하지 말고 먼저 `supabase db reset --linked` 로컬에서 검증 권장
- Supabase Dashboard → SQL Editor에서 수동 실행도 가능

## 핵심 테이블

| 테이블 | 용도 |
|---|---|
| `app_users` / `profiles` | 직원 프로필 (auth.users 확장) |
| `tasks` | 업무 |
| `task_comments` | 업무 코멘트 |
| `task_files` | 업무 첨부파일 메타 (실파일은 Storage) |
| `clients` | 거래처 |
| `projects` | 프로젝트 (clients 와 N:M 가능) |
| `project_members` | 프로젝트 멤버 매핑 |
| `project_messages` | 프로젝트 채팅 |
| `meeting_minutes` | 회의록 |
| `notices` | 공지/전달사항 |
| `notice_comments` | 공지 댓글 |
| `operations` | 구독/정산 (반복일정) |
| `work_schedules` | 개인 일정 |
| `api_keys` | 외부 통합용 API 키 (sha256 해시 저장) |
| `device_subscriptions` | 웹 푸시 구독 (endpoint + keys) |
| `push_preferences` | 직원별 알림 선호 |
| `journal_entries` | 주간업무일지 항목 (최신 추가) |
| `journal_status_palette` | 일지 상태 팔레트 (커스터마이징 가능) |
| `journal_kinds` | 일지 종류 팔레트 |
| `weekly_contracts` | 일지 이번주 진행중 계약·할일 |
| `google_calendar_settings` | 직원별 캘린더 동기화 설정 |

> ⚠️ 마이그레이션 이름과 실제 테이블 이름이 다를 수 있음. `supabase/schema.sql` 또는 Supabase 대시보드에서 최종 확인.

## RLS 정책
- 거의 모든 테이블에 RLS 활성
- 기본 정책: "본인 데이터만 select/insert/update/delete"
- 관리자(`account_role='admin'`) 직원은 전사 데이터 접근 가능
- 정책 SQL은 마이그레이션 파일에서 `create policy ...` 검색

## Edge Functions

### 외부 통합용 (API key 인증)
| 함수 | 용도 | 호출 헤더 |
|---|---|---|
| `create-meeting-minute` | 외부 녹음·요약 앱 → 회의록 등록 | `x-plander-api-key` |
| `create-personal-schedule` | 외부 캘린더 → 개인 일정 등록/수정/삭제 | `x-plander-api-key` |

### 관리자 작업 (service_role 사용)
| 함수 | 용도 |
|---|---|
| `create-user` | Auth user + 프로필 동시 생성 |
| `update-user` | 직원 정보 수정 (비밀번호 포함) |
| `delete-task` | 업무 영구 삭제 (RLS 우회) |

### 알림
| 함수 | 트리거 |
|---|---|
| `send-task-notification` | 업무 배정·상태 변경 |
| `send-comment-notification` | 업무 코멘트 등록 |
| `send-meeting-minute-notification` | 회의록 등록 |
| `send-notice-notification` | 공지 등록 |
| `send-project-message-notification` | 프로젝트 채팅 |

### 외부 동기화
| 함수 | 용도 |
|---|---|
| `sync-google-calendar` | 직원별 구글 캘린더 ↔ work_schedules |

### Function 로컬 테스트
```bash
supabase functions serve <function-name> --env-file ./supabase/.env.local
curl -X POST http://localhost:54321/functions/v1/create-meeting-minute \
  -H "x-plander-api-key: <test-key>" \
  -H "Content-Type: application/json" \
  -d '{ "title": "테스트", "summary": "...", "category": "내부회의" }'
```

### Function 배포
```bash
supabase functions deploy <function-name> --project-ref <PROJECT_REF>
# 또는 전체
supabase functions deploy --project-ref <PROJECT_REF>
```

## 데이터 백업
- Supabase 대시보드 → Project Settings → Database → Backups (자동 일일)
- 큰 변경 전엔 SQL Editor 에서 `pg_dump`나 테이블 export 권장
