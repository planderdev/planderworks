# 09 — 편집 규칙과 주의사항

## 절대 건드리지 말 것 (명시적 승인 없이)

- ⛔ **운영 DB 데이터** — `app_users`, `tasks`, `clients`, `projects`, `meeting_minutes` 등 데이터 직접 수정·삭제 금지
- ⛔ **RLS 정책** — `create policy` / `alter policy` 변경은 사전 검토 후만
- ⛔ **`service_role` 키 노출** — 클라이언트 코드 / Vercel `VITE_*` 변수 / 깃 어디에도 금지
- ⛔ **마이그레이션 재작성** — 적용된 마이그레이션은 새 마이그레이션으로만 변경. 기존 파일 수정 금지.
- ⛔ **`!important` 신규 추가** — 디자인 시스템 정리 중. 기존 `!important`는 점진적 제거 대상이라 추가하지 말 것 (이미 들어간 일부는 우회 패턴으로 처리)
- ⛔ **광범위한 UI 스타일 전파** — 한 화면 요청에 비슷한 화면들까지 같이 손대지 말 것
- ⛔ **빌드 byte-identical 가능 변경만 안전** — 사용자가 "동작 보존을 증명할 수 있는 변경만" 요청한 경우, 빌드 결과가 동일해야 함

## 사용자(이전 담당자) 정착 규칙 (메모리 기반)

이전 담당자(`1986desire@gmail.com`)가 작업 중 자주 강조했던 점:

1. **오버라이드 절대 금지** — 새 `!important` 룰 박지 말고, 특이성 올리거나 구조를 바꿔서 해결
2. **기능·DB 불가침** — 동작 보존 증명 가능한 변경만 (빌드 byte-identical)
3. **수정 끝나면 커밋만 하고 로컬서버 열어서 보여줘** — 배포는 명시적 요청 시에만 진행
4. **다크 모드 흰 글자 → #CCC**, **회색 배경 → 투명** 선호
5. **상태 컬러 의미**: 미팅완료=초록, 진행중=파랑, 예정=회색, 협업=노랑 (자세한 phase 매핑은 [07 문서](07-recent-features.md))
6. **사이드바 빨간 새글 배지** (이전엔 노란색이었음)

## 안전 작업 체크리스트

편집 전:
- ☐ `git status --short --branch` — 무관한 변경 보존
- ☐ `git pull` — 다른 세션 변경분 가져오기
- ☐ 요청 스코프 확인 — "이 화면의 이 요소만"인지

편집 중:
- ☐ 요청한 화면/요소만 손대기
- ☐ 비슷한 화면으로 스타일 전파 안 함
- ☐ DB·RLS·운영 데이터 접근하지 않음

편집 후:
- ☐ `npm run typecheck` — 타입 검증
- ☐ `npm run build` — 빌드 통과 확인 (필요 시)
- ☐ 변경된 파일 보고
- ☐ 커밋·푸시는 명시적 요청 시에만

## 자주 보는 함정

### Vite + 환경변수
- `VITE_*` 변수는 **빌드 시 인라인**됨 — 변경 후 재배포 필요
- 비밀 키는 `VITE_*`로 절대 노출 금지 (운영 번들에 평문 포함됨)

### Service Worker (sw.js)
- 캐시 정책 변경 시 사용자 디바이스에 stuck 됨 가능
- `vercel.json`에서 `Cache-Control: no-store` 강제
- 새 sw 배포해도 기존 사용자에겐 다음 페이지 로드 시점에 활성

### CSS 글로벌 `!important`
- `input, select, textarea { background: var(--panel) !important; }` 같은 룰이 일부 있음
- 새 컴포넌트가 `select`를 컬러 칩으로 쓸 때 충돌 — 우회 패턴 필요 (예: native select 대신 button + 팝오버)
- 자세한 우회 예시는 `JournalStatusEditor` 참고 (`src/main.tsx`)

### Supabase 클라이언트 = null 시
- 환경변수 비어있으면 `supabaseClient.ts`가 `null` 반환
- 모든 핸들러는 `if (supabase && !currentUser.isPrototype) { ... } else { ... }` 패턴
- 프로토타입 모드는 in-memory 시드 데이터 → 새로고침하면 사라짐 (정상)

### 다중 세션 충돌
- SMB로 다른 머신이 같은 파일 동시 편집 가능
- `File has been modified since read` 에러 → `git pull` 후 재시도
- 큰 작업 시 통신해서 안 겹치게

### iOS Capacitor 빌드
- Xcode 프로젝트는 `ios/App/`에 있음
- `npm run cap:sync` 후 Xcode 열어서 직접 빌드 (TestFlight / App Store)
- 인증서·프로비저닝 프로필은 별도 관리

## 코드 스타일

- 컴포넌트별 분리 없음 — `src/main.tsx` 단일 파일 (의도된 선택)
- 함수 컴포넌트 + hooks
- 클래스명: BEM-ish (예: `journal-entry-row`, `journal-status-badge`)
- 데이터 속성: `data-active`, `data-phase`, `data-bold` 등으로 상태 표현

## 커뮤니케이션 (사용자 ↔ 에이전트)

이전 담당자의 톤:
- 짧고 직설적인 한국어
- 영문 잘 안 씀
- "ㅇㅋ", "응", "ㅇㅇ" 같은 단답 OK 신호
- 의문 있으면 "왜 ~?" 단답으로 물음
- 작업 끝나면 "이대로 오케이!" 또는 "좋다" 같은 승인
