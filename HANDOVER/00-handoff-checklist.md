# 00 — 이양 체크리스트

양쪽이 같이 보면서 순서대로 처리합니다.
- **A** = 이전 담당자 (현 owner)
- **B** = 새 담당자 (incoming)

처음 한 줄부터 끝까지 순서대로. 각 단계가 끝나면 양쪽 모두 ☑ 체크.

---

## Phase 1. 계정 권한 (네트워크에서 끝남, 파일 안 옮김)

### GitHub
- ☐ **A**: github.com/planderdev/planderworks → Settings → Collaborators → **B** invite (admin 권한)
- ☐ **B**: 초대 수락 후 클론 권한 확인 (`git clone git@github.com:planderdev/planderworks.git`)
- ☐ (organization 자체 이양이면) **A**: Settings → Transfer ownership → **B** 의 GitHub 계정으로
- ☐ **A**: 자동배포가 **B** 의 GitHub 계정 push 에도 작동하는지 한 번 검증 (Vercel 자동 빌드)

### Vercel
- ☐ **A**: vercel.com/planderdevs-projects/planderworks → Settings → Team Members → **B** invite
- ☐ **B**: 초대 수락 + 대시보드 접근 확인
- ☐ (팀 자체 이양이면) Settings → Transfer Project → 새 팀으로
- ☐ Production 도메인 `planderworks.vercel.app` 변동 없는지 확인

### Supabase
- ☐ **A**: Supabase 대시보드 → Project Settings → Team → **B** invite (owner 또는 admin)
- ☐ **B**: 초대 수락 + 프로젝트 보임 확인
- ☐ (organization 이양이면) Settings → Transfer ownership
- ☐ **B**: SQL Editor / Table Editor / Edge Functions 다 열려보는지 확인

### (선택) 모바일 스토어
- ☐ Apple Developer 계정: **A** → **B** 로 transfer (회사 계정이면 Account Holder 변경)
- ☐ Google Play Console: **A** → **B** 로 transfer
- ☐ App Store Connect의 앱 자체 권한 (관리자 추가)

### (선택) 도메인
- ☐ 도메인 등록 업체 (가비아 / 카페24 / Namecheap 등) — 등록자 정보 변경
- ☐ DNS 레코드 그대로 보존 확인

---

## Phase 2. 비밀키 묶음 (1Password / Bitwarden 등 안전 채널)

> ⚠️ Slack/카카오/이메일 평문 금지. 무조건 비밀번호 매니저 공유 vault 또는 1회용 링크.

**A** 가 다음을 묶어서 **B** 에게 공유:

### 프론트엔드 (.env.local)
- ☐ `VITE_SUPABASE_URL`
- ☐ `VITE_SUPABASE_PUBLISHABLE_KEY` (= anon key)
- ☐ `VITE_VAPID_PUBLIC_KEY`
- ☐ `MARKETING_LEAD_ALLOWED_ORIGIN` (외부 폼 origin)

### Supabase Secrets (이미 Supabase에 저장돼 있으니 단순 확인)
- ☐ `SUPABASE_SERVICE_ROLE_KEY` (대시보드 → API → 확인만)
- ☐ `PLANDER_INTERNAL_SECRET`
- ☐ `VAPID_PRIVATE_KEY`
- ☐ Google OAuth credentials (sync-google-calendar 함수용)
- ☐ 이메일 발송 키 (Resend / SMTP 사용 중이면)

### 외부 통합용 (지금 발급된 평문 키들)
- ☐ 맥미니 회의록 봇용 `x-plander-api-key` (scope: `meeting_minutes`)
- ☐ 캘린더 동기화용 `x-plander-api-key` (scope: `personal_schedule`)
- ☐ 그 외 발급된 active key 목록 (Supabase `api_keys` 테이블에서 `select id, name, scope, active`)

### B 측 검증
- ☐ **B**: `.env.local` 로컬에 작성 후 `npm run dev` 로 운영 모드 동작 확인
- ☐ **B**: `npm run typecheck` 통과
- ☐ **B**: 운영 URL 로그인 한 번 해보기

---

## Phase 3. 맥미니 녹음·요약 봇

**자세한 절차는 [06 — 녹음 서버 이전 가이드](06-recording-servers-migration.md) 참고.** 여기엔 체크박스만.

- ☐ **A**: 맥미니 SSH/화면 공유 정보를 **B** 에게 전달
- ☐ **B**: 봇 코드/스크립트 위치 확인 (`~/recording-bot/` 또는 launchd plist)
- ☐ **B**: 봇 코드 통째 백업 + 새 머신으로 이전 (rsync 권장)
- ☐ **B**: 의존성 확인 (ffmpeg / whisper / Python venv / API 라이브러리)
- ☐ **A**: Plander Works 앱에서 **새 API 키** 발급 → **B** 에게 평문 전달
- ☐ **B**: 봇 설정에 새 키 주입 + 검증 curl 한 번
- ☐ **B**: 새 환경에서 자동화 재가동 (launchd / cron 등록)
- ☐ **B**: 실제 회의 한 건으로 end-to-end 동작 확인
- ☐ **A**: 이전 키 비활성 (앱 → 설정 → API 키 → toggle off)
- ☐ **A**: 이전 머신의 launchd unload

---

## Phase 4. 모바일 서명키 (모바일 빌드 계속할 거면)

### iOS
- ☐ **A**: Keychain Access → "iPhone Distribution" 인증서 + 개인 키 export → `*.p12` (비밀번호 설정)
- ☐ **A**: Apple Developer 사이트의 Provisioning Profile (`*.mobileprovision`) 다운로드
- ☐ **A**: APNs 키 (`AuthKey_*.p8`) 도 전달
- ☐ **B**: 받은 `.p12` 를 Keychain에 import + Xcode 에 Provisioning Profile 등록
- ☐ **B**: TestFlight 빌드 한 번 올려서 검증

### Android
- ☐ **A**: 키스토어 파일 (`*.jks`) + 비밀번호 전달
- ☐ **A**: Google Play Console 의 App Signing 키 정보
- ☐ **B**: 받은 키스토어로 release 빌드 + Play Console 업로드 검증

---

## Phase 5. 선택적 자료 (없어도 돌아감)

- ☐ `design-samples/` zip (피그마 export, 디자인 가이드 PDF)
- ☐ `proposal-draft/` zip (사업 제안서 초안, 마케팅 자료)
- ☐ 회의록 / 기획문서가 외부 도구(노션·구글닥)에 있다면 권한 공유
- ☐ Slack/카카오 등 사내 채널 — 직원들에게 인수 안내 + **B** 추가
- ☐ (이전 담당자 PC의) `.hermes-backups/` — 보통 무시 OK

---

## Phase 6. 마무리

- ☐ **B**: 한 번 의도적으로 작은 변경 (예: HANDOVER 오타 수정) → 커밋 → 푸시 → 자동배포까지 끝까지 확인
- ☐ **B**: 사내 직원들에게 새 담당자 안내 (Slack/카카오)
- ☐ **A**: 본인 계정에서 collaborator 권한 해제 (원할 때)
- ☐ **A**: 본인 머신 `.env.local`, `.claude/projects/.../memory/` 등 로컬 파일 삭제 (원할 때)
- ☐ 양쪽 모두: 이양 완료 일자 기록

이양 완료 일자: ___________

---

## 응급 롤백

이양 중 운영에 이상 생기면:
1. **A** 가 아직 권한 보유 중인 단계에서: 직접 Vercel rollback (이전 배포로) + Supabase 데이터 손상 시 백업에서 복원
2. **A** 권한 이미 회수했으면: **B** 가 같은 작업, **A** 는 가이드만
3. 도메인 단계까지 갔는데 문제 생기면: DNS TTL 짧게 잡고 임시로 이전 환경 가리키도록

이런 사고 안 나도록 **Phase 1~3 까지는 양쪽 권한 공존 상태로 유지** 권장. Phase 4~6 가서야 **A** 권한 회수.
