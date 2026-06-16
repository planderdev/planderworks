# 04 — 환경변수와 비밀키

> ⚠️ 이 문서는 **위치와 이름**만 적습니다. 실제 키 값은 별도 안전 채널(1Password / 비밀번호 매니저 / 직접 전달)로 받으세요.

## 프론트엔드 환경변수 (Vercel + `.env.local`)

| 변수명 | 용도 | 노출 안전 | 어디서 발급 |
|---|---|---|---|
| `VITE_SUPABASE_URL` | Supabase 프로젝트 URL | 공개 OK | Supabase Settings → API |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | anon/public key | 공개 OK | Supabase Settings → API |
| `VITE_VAPID_PUBLIC_KEY` | Web Push VAPID 공개키 | 공개 OK | 직접 생성 (web-push CLI) |
| `MARKETING_LEAD_ALLOWED_ORIGIN` | `api/marketing-lead.js` 가 허용하는 외부 폼 origin | 공개 OK | cafe24 등 외부 폼 도메인 |

**Vite는 빌드 시 `import.meta.env.VITE_*`를 번들에 인라인**한다. 즉 운영 번들 안에 평문으로 들어감 → public 키만 들어가도록 주의. service_role key 절대 금지.

### `.env.local` 예시
```env
VITE_SUPABASE_URL=https://abcdefghij.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOi...
VITE_VAPID_PUBLIC_KEY=BNw...
```

### Vercel 설정
1. Vercel 대시보드 → planderworks → Settings → Environment Variables
2. 위 3개 변수를 Production / Preview / Development 모두에 추가
3. 변수 변경 후 재배포해야 반영됨 (Vite 인라인 특성)

## Edge Functions 환경변수 (Supabase Project Settings → Edge Functions)

| 변수명 | 용도 | 노출 |
|---|---|---|
| `SUPABASE_URL` | 자기 자신 (자동 주입) | 자동 |
| `SUPABASE_SERVICE_ROLE_KEY` | DB 풀권한 (RLS 우회) | ⛔ 비밀 |
| `PLANDER_INTERNAL_SECRET` | Edge 함수 → 함수 간 호출 시 인증 | ⛔ 비밀 |
| `RESEND_API_KEY` / `SMTP_*` | 이메일 발송 (사용 중이면) | ⛔ 비밀 |
| `GOOGLE_OAUTH_*` | sync-google-calendar 함수가 쓰는 OAuth 자격 | ⛔ 비밀 |
| (푸시) `VAPID_PRIVATE_KEY` | Web Push 비밀키 | ⛔ 비밀 |

설정 확인:
```bash
supabase secrets list --project-ref <PROJECT_REF>
```

## VAPID 키 (Web Push)

```bash
npm i -g web-push
web-push generate-vapid-keys
# Public Key:  BNw...  → VITE_VAPID_PUBLIC_KEY
# Private Key: ...     → Supabase secret VAPID_PRIVATE_KEY
```

**키 회전 시**:
- 모든 기존 푸시 구독(`device_subscriptions`) 무효화됨 → 사용자 모두 재구독 필요
- 권장: 이전 키도 유지하고 새 키 추가 (코드 수정 필요), 또는 사용자 안내 후 회전

## API Keys (외부 통합용 — 녹음 앱 등)

`api_keys` 테이블에 저장. 앱 → 설정 → API 키 발급에서 관리.

| 컬럼 | 의미 |
|---|---|
| `id` | UUID |
| `name` | 사람이 알아볼 라벨 (예: "맥미니 회의록 봇") |
| `scope` | `personal_schedule` 또는 `meeting_minutes` |
| `key_hash` | SHA-256 해시 (평문은 발급 시 1회만 반환) |
| `active` | true/false |
| `created_by` | 발급 직원 ID |
| `last_used_at` | 마지막 호출 시각 |

발급 흐름:
1. 관리자 직원이 앱 → 설정 → "API 키 추가"
2. scope 선택 (personal_schedule / meeting_minutes)
3. 한 번 보여주는 평문 키 복사 → 안전한 곳 보관
4. 외부 앱(녹음 봇 등) HTTP 요청 헤더에 `x-plander-api-key: <키>` 로 전달

자세한 사용법은 [06 — 녹음 서버 이전](06-recording-servers-migration.md) 참고.

## 접근 권한 이관 체크리스트

| 항목 | 어디서 | 어떻게 |
|---|---|---|
| GitHub 저장소 | github.com/planderdev/planderworks | Settings → Collaborators 또는 Org Transfer |
| Vercel 프로젝트 | vercel.com/planderdevs-projects | Settings → General → Transfer Project |
| Supabase 프로젝트 | Supabase 대시보드 → Settings → General | "Transfer ownership" |
| 도메인 (있을 시) | 도메인 등록 업체 | 등록자 정보 변경 |
| Google Cloud (구글 캘린더 OAuth) | Google Cloud Console | IAM → 권한 이전 |

이관 전:
- ☐ 모든 비밀키 새 담당자에게 전달
- ☐ 모든 collaborator 권한 추가
- ☐ 운영 URL 한 번 더 동작 확인
- ☐ 마지막 커밋·배포 확인 (`/build-meta.json`)
- ☐ Mac mini 녹음 서버 키도 새 키로 회전 (이전 후) — [06 문서 참고](06-recording-servers-migration.md)
