# Plander Works — 인수인계

## 짧게 요약

코드와 문서는 전부 GitHub에 있습니다. 새 담당자는 **`git clone`** 한 줄이면 코드·문서·하네스·메모리까지 다 받습니다.

따로 손으로 넘겨야 할 것은 단 4가지뿐:
1. **계정 권한** (GitHub / Vercel / Supabase / 모바일 스토어)
2. **비밀키** (`.env.local` 값들 + Supabase service role / VAPID private / OAuth secret)
3. **맥미니 녹음·요약 봇** (본 저장소 바깥, 별도 머신)
4. **모바일 서명키** (iOS 인증서 / Android 키스토어) — 모바일 빌드 계속할 때만

## 새 담당자 — 첫날 30분 가이드

```bash
# 1. 클론
git clone git@github.com:planderdev/planderworks.git
cd planderworks

# 2. .env.local 작성 (이전 담당자로부터 비밀키 묶음 받아서 채움)
cp .env.example .env.local
$EDITOR .env.local

# 3. 의존성 + 로컬 실행
npm install
npm run dev          # http://localhost:5173

# 4. 운영 동작 확인
curl https://planderworks.vercel.app/build-meta.json
```

이게 끝. 그 다음엔 `HANDOVER/01-overview.md` 부터 차례로 읽으면 됩니다.

## 이양 절차

**진행 흐름은 → [00-handoff-checklist.md](00-handoff-checklist.md)** 한 페이지에 정리해놨습니다. 양쪽 다 그 체크리스트만 따라가면 누락 없음.

## 참고 문서

| # | 파일 | 내용 |
|---|---|---|
| 00 | [handoff-checklist](00-handoff-checklist.md) | **양쪽 모두 따라할 이양 체크리스트** |
| 01 | [overview](01-overview.md) | 프로젝트·기술스택·주요 URL |
| 02 | [codebase-map](02-codebase-map.md) | 파일·디렉터리 지도 |
| 03 | [dev-and-deploy](03-dev-and-deploy.md) | 로컬·빌드·자동배포·트러블슈팅 |
| 04 | [environment-and-secrets](04-environment-and-secrets.md) | env 변수 / 비밀키 목록 |
| 05 | [supabase](05-supabase.md) | DB / Edge Functions / RLS |
| 06 | [recording-servers-migration](06-recording-servers-migration.md) | **맥미니 녹음 봇 이전 가이드** |
| 07 | [recent-features](07-recent-features.md) | 최근 추가된 기능 정리 |
| 08 | [harness-and-skills](08-harness-and-skills.md) | Agent 하네스 / Codex 스킬 |
| 09 | [rules-and-cautions](09-rules-and-cautions.md) | 편집 규칙 / 절대 건드릴 것 |
| 10 | [pending-and-known-issues](10-pending-and-known-issues.md) | 미완 작업 / 알려진 이슈 |
| — | [memory-snapshot/](memory-snapshot/) | 이전 담당자 영구 메모리 백업 |

## 깃에 들어있는 것 / 들어있지 않은 것

### ✅ Git에 들어있음 (clone 한 번에 받음)
- 모든 소스 (`src/`)
- DB 마이그레이션 / 스키마 / Edge Functions (`supabase/`)
- 핸드오버 문서 (`HANDOVER/`)
- 에이전트 하네스 (`AGENTS.md` / `.agents/` / `.codex/` / `docs/harness/`)
- 이전 담당자 메모리 스냅샷 (`HANDOVER/memory-snapshot/`)
- 빌드 / 배포 / 모바일·데스크탑 설정 (`vite.config.ts` / `vercel.json` / `capacitor.config.ts` / `electron/`)

### ❌ Git에 없음 (별도 전달 필요)
- `.env.local` — 비밀키 (placeholder는 `.env.example` 참고)
- Supabase service role / VAPID private / Google OAuth secret — Supabase 대시보드 secrets 또는 1Password
- 맥미니 녹음·요약 봇 — 별도 머신, rsync 또는 zip
- iOS `*.p12` 인증서 / 프로비저닝 프로필 — 키체인 export 또는 Apple Developer 계정 이양
- Android 키스토어 (`*.jks`) — 안전 파일 전달
- 디자인 레퍼런스 (`design-samples/`, `proposal-draft/`) — 필요 시 zip (gitignored)
- 로컬 백업 (`.hermes-backups/`) — 필요 없으면 무시
