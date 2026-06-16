# Plander Works

플랜더 사내 직원용 업무관리 웹앱입니다. 업무 / 프로젝트 / 업체 / 회의록 / 공지 / 캘린더 / 구독·정산 / 주간업무일지를 한 곳에서 다룹니다.

운영 주소: **https://planderworks.vercel.app**

## 인수인계 받았다면 — 먼저 여기부터

> 새 담당자(인수자)는 다른 거 보지 말고 **[`HANDOVER/README.md`](HANDOVER/README.md)** 한 번 읽고 **[`HANDOVER/00-handoff-checklist.md`](HANDOVER/00-handoff-checklist.md)** 따라가면 됩니다.

요약하면:
1. **계정 권한 받기** — GitHub `planderdev/planderworks` · Vercel `planderdevs-projects/planderworks` · Supabase 프로젝트
2. **비밀키 받기** — `.env.local` 값 + Supabase service role / VAPID private / OAuth secret (이전 담당자가 1Password 등 안전 채널로 전달)
3. **로컬 띄우기**:
   ```bash
   git clone git@github.com:planderdev/planderworks.git
   cd planderworks
   cp .env.example .env.local   # 받은 키들로 값 채움
   npm install
   npm run dev                  # http://localhost:5173
   ```
4. **맥미니 녹음·요약 봇 이전** — 별도 머신, [`HANDOVER/06-recording-servers-migration.md`](HANDOVER/06-recording-servers-migration.md) 참고

## 한국어 운영 가이드

- 기본 UI / 문서 / 커밋 메시지는 한국어
- 코드 식별자는 영문, 사용자 노출 텍스트는 한국어
- 자세한 사내 규칙·편집 가이드: [`AGENTS.md`](AGENTS.md), [`HANDOVER/09-rules-and-cautions.md`](HANDOVER/09-rules-and-cautions.md)
- 자주 하는 작업의 90% 는 UI/CSS 미세 조정 — 작은 화면 하나씩 정확히 짚어서 요청 → 변경 → 빌드/커밋/푸시(자동배포)

## 자동배포

`main` 브랜치 push → Vercel 자동 빌드·배포 (30~60초). 배포 반영 확인:
```bash
curl https://planderworks.vercel.app/build-meta.json
# { "version": "<commit>-<timestamp>", "commit": "<commit>", ... }
```

`commit` 값이 방금 푸시한 커밋 SHA 면 라이브 반영 완료.

---

## Stack

- Vite
- React
- TypeScript
- Supabase Auth
- Supabase DB/Storage ready
- Vercel ready

## Local Development

```bash
npm install
npm run dev
```

## Environment Variables

Create `.env.local` locally and set these values:

```bash
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-or-anon-key
VITE_VAPID_PUBLIC_KEY=your-web-push-vapid-public-key
```

For Vercel, add the same variables in Project Settings > Environment Variables.

Do not expose Supabase `service_role` keys or database passwords in frontend code, GitHub, or Vercel client-side variables.

## Current MVP

- Email/password login through Supabase Auth
- Prototype preview mode before admin-created users exist
- Fixed black Plander sidebar
- Light, dark, and system theme modes for the main workspace
- Task dashboard mock data
- Supabase-backed tasks, clients, job types, and profiles
- Admin-only user creation through a Supabase Edge Function
- Device push subscription through a service worker
- Task assignment push delivery through a Supabase Edge Function
- Quick task handoff form
- Responsive mobile sidebar

## Next Build Steps

1. Create the first admin user in Supabase Auth and set the matching `profiles.role` to `admin`.
2. Add real employees through the app's employee admin page.
3. Enable push notifications per device from Settings.
4. Add Storage bucket uploads for task attachments.
5. Add task detail comments, status history, and file previews.
