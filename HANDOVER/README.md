# Plander Works — 인수인계 패키지

플랜더웍스(직원용 업무관리 웹앱)의 인수인계 문서입니다. 새 담당자가 콜드 스타트로 작업을 이어갈 수 있도록, 운영·개발·배포·통합·복원까지 모든 맥락을 한곳에 정리했습니다.

## 시작하기 (5분)

1. **저장소**: GitHub `planderdev/planderworks` (https://github.com/planderdev/planderworks)
2. **운영 URL**: https://planderworks.vercel.app
3. **호스팅**: Vercel (자동배포: `main` 브랜치 푸시 시 자동 빌드·배포)
4. **백엔드**: Supabase (Auth + DB + Storage + Edge Functions)
5. **개발 환경**:
   ```bash
   git clone git@github.com:planderdev/planderworks.git
   cd planderworks
   npm install
   cp .env.example .env.local   # 없다면 04 문서 참고해서 직접 작성
   npm run dev                  # http://localhost:5173
   npm run typecheck            # 타입 검증
   npm run build                # 프로덕션 빌드
   ```

## 문서 인덱스

| 파일 | 용도 |
|---|---|
| [01-overview.md](01-overview.md) | 프로젝트 개요, 기술 스택, 주요 URL |
| [02-codebase-map.md](02-codebase-map.md) | 핵심 파일 위치, 디렉토리 구조 |
| [03-dev-and-deploy.md](03-dev-and-deploy.md) | 로컬 개발, 빌드, 배포 흐름 |
| [04-environment-and-secrets.md](04-environment-and-secrets.md) | 환경변수, Vercel/Supabase/GitHub 접근 |
| [05-supabase.md](05-supabase.md) | DB 스키마, 마이그레이션, Edge Functions, RLS |
| [06-recording-servers-migration.md](06-recording-servers-migration.md) | **맥미니 녹음·요약 서버 이전 가이드** |
| [07-recent-features.md](07-recent-features.md) | 최근 추가된 기능들 (주간업무일지, 드래그 등) |
| [08-harness-and-skills.md](08-harness-and-skills.md) | Agent 하네스 / Codex 스킬 구조 |
| [09-rules-and-cautions.md](09-rules-and-cautions.md) | 편집 규칙, 절대 건드리지 말 것 |
| [10-pending-and-known-issues.md](10-pending-and-known-issues.md) | 진행중·예정 작업, 알려진 이슈 |

## 인수자가 먼저 확보해야 할 것

1. **GitHub** `planderdev/planderworks` 저장소 collaborator 권한 (또는 organization 이관)
2. **Vercel** `planderdevs-projects/planderworks` 프로젝트 접근 권한 (또는 팀 이관)
3. **Supabase** 프로젝트 owner 권한 (또는 organization 이관) — DB·Storage·Edge Functions·Auth 전부 여기에
4. **도메인** `planderworks.vercel.app` — Vercel 프로젝트에 자동 alias 되므로 별도 작업 없음
5. **VAPID 키** (웹 푸시) — 기존 키 사용 시 그대로 보존, 재발급 시 모바일·데스크탑 구독 다시 받아야 함
6. **맥미니 녹음 서버** — 별도 머신/스크립트. [06 문서](06-recording-servers-migration.md) 참고
