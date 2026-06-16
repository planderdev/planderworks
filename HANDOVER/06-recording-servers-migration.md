# 06 — 맥미니 녹음·요약 서버 이전 가이드

> 이 문서는 **Plander Works 저장소 바깥에 있는** 녹음/요약 서버를 새 운영 환경으로 옮길 때 보는 문서입니다. 본 저장소에는 **수신측**(Supabase Edge Function)만 들어있고, **송신측**(녹음 봇)은 별도 머신/스크립트로 존재합니다.

## 시스템 구성

```
┌──────────────────┐        HTTPS POST              ┌────────────────────────────┐
│  맥미니 녹음 봇   │ ─────────────────────────────▶ │ Supabase Edge Function      │
│  (저장소 바깥)    │   x-plander-api-key: <키>     │ create-meeting-minute       │
│                  │   JSON body                    │ create-personal-schedule    │
└──────────────────┘                                └──────────────┬─────────────┘
                                                                   │
                                                                   ▼
                                                          ┌────────────────────┐
                                                          │ Supabase Postgres  │
                                                          │ meeting_minutes /  │
                                                          │ work_schedules     │
                                                          └────────────────────┘
                                                                   │
                                                                   ▼
                                                          ┌────────────────────┐
                                                          │ 직원들에게 푸시 알림│
                                                          └────────────────────┘
```

## 송신측 — 맥미니 녹음 봇이 하는 일

(추정 기준 — 실제 구현은 송신측 코드 확인 필요)

1. 회의 녹음 (Audio Hijack / Quicktime / 자체 스크립트 등)
2. 음성 → 텍스트 (Whisper API 또는 로컬 모델)
3. 요약 생성 (GPT-4 / Claude API)
4. HTTPS POST → Plander Works Edge Function

### 송신측에서 필요한 정보 3가지
- **엔드포인트 URL**: `https://<SUPABASE_PROJECT_REF>.supabase.co/functions/v1/create-meeting-minute`
- **API 키**: Plander Works 앱 → 설정 → API 키 발급
- **JSON 페이로드 형식** (아래 스펙)

## API 스펙

### `create-meeting-minute`
```http
POST https://<ref>.supabase.co/functions/v1/create-meeting-minute
Headers:
  Content-Type: application/json
  x-plander-api-key: <발급받은 키>

Body (JSON):
{
  "category": "내부회의",                       // 필수, 카테고리명 (앱에 등록된 것)
  "title": "5월 콘텐츠 운영 점검",                // 필수
  "content": "원본 회의 내용 전체...",            // 옵션
  "summary": "디자인 리소스 집중 배분 ...",       // 옵션
  "decisions": "- 디자인팀장 주 3일 ...\n- ...",  // 옵션
  "actionItems": "- 인성이형: ...",              // 옵션
  "attendees": "인성이형, 대표, 디자인팀장",       // 옵션
  "projectId": "<UUID>",                        // 옵션, 프로젝트 매칭 시
  "heldAt": "2026-05-02T10:00:00+09:00",        // 옵션, 회의 일시
  "sourceApp": "macmini-recorder-v1",           // 옵션, 송신측 식별자
  "externalId": "rec-20260502-001",             // 옵션, 멱등성용 (중복 등록 방지)
  "authorEmail": "insung@plander.co.kr"         // 옵션, 작성자 매칭
}

Response 200:
{ "id": "<UUID>", "message": "Created" }

Response 401: { "error": "Missing API key" } / { "error": "Invalid API key" }
Response 403: { "error": "Wrong scope" }   // 키가 meeting_minutes scope이 아닐 때
Response 400: { "error": "Missing required field: ..." }
```

### `create-personal-schedule`
```http
POST https://<ref>.supabase.co/functions/v1/create-personal-schedule
Headers:
  Content-Type: application/json
  x-plander-api-key: <발급받은 키>  (scope=personal_schedule)

Body:
{
  "action": "create" | "update" | "delete",
  "email": "insung@plander.co.kr",            // 매칭용
  "userId": "<UUID>",                          // 또는 이메일 대신 직접
  "title": "치과 진료",
  "memo": "12시 예약",
  "startAt": "2026-05-15T03:00:00.000Z",
  "endAt":   "2026-05-15T04:00:00.000Z",
  "allDay": false,
  "externalId": "gcal-event-abc",              // 멱등성
  "externalSource": "google_calendar"
}
```

## 이전 절차 (신 담당자가 할 일)

### 1단계: 송신측(맥미니) 코드/스크립트 확보
- 맥미니에 SSH 접속 또는 화면 공유
- 어디에 녹음 봇이 있는지 확인 (보통 `~/recording-bot/` 또는 launchd plist):
  ```bash
  ls ~/ | grep -i record
  launchctl list | grep -i plander
  ls ~/Library/LaunchAgents/ | grep -i plander
  cat ~/Library/LaunchAgents/com.plander.recorder.plist  # 있다면
  ```
- 발견된 디렉터리/스크립트 통째로 새 머신으로 옮김 (rsync 권장)
- 의존성 확인 (Python venv, Node, ffmpeg, whisper.cpp 등)

### 2단계: 새 API 키 발급
1. Plander Works 앱(planderworks.vercel.app) 로그인
2. 설정 → API 키 → "추가"
3. scope: `meeting_minutes`, name: "맥미니 회의록 봇 (신규)"
4. **한 번만 보이는** 평문 키 복사 → 안전한 곳 저장
5. 같은 방식으로 `personal_schedule` scope 키도 (필요 시) 발급
6. 이전 키는 활성 유지하다가 새 키 검증 후 비활성/삭제

### 3단계: 송신측에 새 키 주입
송신측 코드에서 키가 어디 들어있는지 찾고 교체:
- 환경변수: `.env` / `.envrc` / launchd plist
- 설정 파일: `config.json` / `settings.yaml` 등
- 코드 안 하드코딩: ⛔ — 발견 시 환경변수로 외부화 필요
- macOS Keychain: `security find-generic-password -s "plander-api-key"` 등

### 4단계: 송신측 검증
```bash
curl -X POST https://<ref>.supabase.co/functions/v1/create-meeting-minute \
  -H "x-plander-api-key: <새 키>" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "테스트",
    "title": "이전 검증 핑",
    "summary": "key migration test"
  }'
```
- 200 응답 + Plander Works 앱 회의록 메뉴에 등록 확인
- 실패 시: Supabase Edge Function 로그 (대시보드 → Edge Functions → Logs) 에서 정확한 에러 확인

### 5단계: 자동화 재가동
- 새 머신/위치에서 launchd / cron / 백그라운드 프로세스 다시 등록
- 한 번 실제 회의로 동작 확인 (실제 녹음 한 건 흘려보기)

### 6단계: 정리
- 이전 머신에서 launchd 비활성: `launchctl unload ~/Library/LaunchAgents/com.plander.recorder.plist`
- Plander Works 앱에서 이전 API 키 비활성 / 삭제
- 송신측 코드 백업 (git repo 또는 외장 스토리지)

## 자주 빠지는 함정

1. **타임존**: `heldAt`, `startAt`, `endAt` 은 ISO8601 권장. `+09:00` 명시하거나 `Z` (UTC)로 보내기. 안 그러면 Edge Function이 다르게 해석할 수 있음.
2. **externalId 멱등성**: 같은 `externalId` 로 두 번 POST하면 두 번 등록됨 — 송신측에서 중복 방지 로직이 있어야 안전. (Edge function이 자동으로 dedupe 하는지는 현재 보장 안 됨, 코드 확인 필요)
3. **카테고리 / projectId 매칭**: 앱에 등록되지 않은 카테고리/프로젝트 이름을 보내면 회의록은 등록되지만 카테고리는 fallback. 송신측에서 미리 알고 있어야 함.
4. **API 키 회전 시 다운타임**: 이전 키 즉시 비활성화하면 그동안 큐에 쌓여있던 녹음 봇 요청이 401로 다 떨어짐 → 새 키 동작 확인 후 비활성.
5. **VPN/방화벽**: 새 머신이 outbound HTTPS 막혀있으면 Supabase 도메인 화이트리스트 필요.

## 알려진 의존성/도구 (확인 필요)
이전 운영 환경 기준 추정이며, 새 담당자가 실측 후 정정 권장:
- `ffmpeg` (오디오 변환)
- `whisper.cpp` 또는 OpenAI Whisper API (STT)
- ChatGPT / Claude API (요약)
- `curl` 또는 `httpie` (POST 송신)
- macOS launchd (스케줄링)

## 응급 연락
- 송신측 동작 안 함 → Plander Works 직원이 직접 회의록 메뉴 → "회의록 작성"으로 수동 입력 가능 (앱 정상 동작에 영향 없음)
- 송신측이 잘못된 데이터를 쏟아붓는 중 → 앱 → 설정 → API 키 → 해당 키 비활성으로 즉시 차단
