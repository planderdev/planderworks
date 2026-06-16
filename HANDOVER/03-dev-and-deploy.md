# 03 — 개발·배포 워크플로

## 로컬 개발

```bash
git clone git@github.com:planderdev/planderworks.git
cd planderworks
npm install
# .env.local 작성 (04 문서 참고, 없으면 프로토타입 모드로 동작)
npm run dev          # Vite 개발 서버, http://localhost:5173
```

### 자주 쓰는 명령
```bash
npm run dev          # 개발 서버
npm run build        # 프로덕션 빌드 → dist/
npm run preview      # 빌드 결과 로컬 프리뷰
npm run typecheck    # 타입 검증 (tsc --noEmit)
```

### 데스크탑/모바일
```bash
npm run desktop:dev      # Electron 실행
npm run desktop:mac      # macOS .app 빌드
npm run cap:sync         # Capacitor → ios/android 폴더 동기화
npm run cap:open:ios     # Xcode 열기
npm run cap:open:android # Android Studio 열기
```

## 배포 흐름

### 자동배포 (현재 활성)
- `main` 브랜치에 푸시 → Vercel이 자동으로 빌드·배포·alias
- 배포 시간: 평균 ~30초 (빌드 16~20초 + alias)
- 운영 URL `planderworks.vercel.app` 가 자동으로 최신 배포에 alias

### 수동 배포 (필요 시)
```bash
vercel --prod
```
- `vercel` CLI 필요 (`npm i -g vercel`), 첫 사용 시 `vercel login` 후 프로젝트 link
- 빌드 후 production 환경으로 즉시 배포
- 푸시 없이도 로컬 working tree로 배포 가능

### 배포 확인
```bash
curl -s https://planderworks.vercel.app/build-meta.json
# { "version": "<commit>-<timestamp>", "commit": "<commit>", "builtAt": "..." }
```

`commit` 값이 최신 푸시한 커밋 SHA와 일치하면 배포 반영 완료.

## Git 컨벤션

### 커밋 메시지 형식
- 한국어 기본
- prefix: `feat`, `fix`, `style`, `chore`, `refactor`, `docs`
- scope: `journal`, `calendar`, `task`, `nav`, `ui` 등
- 예시:
  - `feat(journal): 직원 일지 읽기전용 보기 + 컬럼 정리`
  - `fix(swipe): 글자 선택 중일 때만 스와이프 차단`
  - `style(nav): 주간업무일지 메뉴 캘린더 아래로 이동 + 볼드 강조`

### 브랜치
- 보통 `main`에서 직접 작업 (소규모 사내 앱)
- PR 사용 시 GitHub `gh` CLI 권장: `gh pr create --title ...`

### 주의
- `git push --force` 절대 금지 (특히 main)
- 커밋 훅(`--no-verify`) 우회 금지
- 다른 세션과 동시 작업 시 충돌 가능 → `git status`, `git fetch` 자주 확인
- 한 컴퓨터에서 푸시했는데 다른 컴퓨터에 stash 있으면 pull 전에 처리

## 다중 세션 작업
프로젝트는 SMB 공유 폴더로 여러 머신(맥북, 맥미니, 폰)에서 동시 편집되어 옴.
- 같은 파일을 두 머신에서 동시 수정하면 마지막 저장이 이김 → 작업 전 항상 `git pull`
- 다른 세션이 커밋한 변경분 알아채려면 `git log --oneline -5` 자주 확인

## 환경별 동작
- **운영 (Vercel)**: env 변수 모두 설정됨 → Supabase 풀스택 동작
- **로컬 (env 있음)**: 운영과 동일하게 Supabase 연결
- **로컬 (env 없음)**: `supabase` 클라이언트가 `null` → 프로토타입 모드 (시드 데이터, in-memory)

## 트러블슈팅

### "디비 다 날라갔다" 같은 증상
- 보통 운영 URL이 Supabase와 연결이 끊어진 것처럼 보이는 케이스
- 체크 순서:
  1. Vercel env 변수 (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`) 그대로인지
  2. Supabase 프로젝트의 anon key가 회전되었는지 (`curl -H "apikey: $KEY" $URL/rest/v1/`)
  3. 최근 마이그레이션이 적용됐는데 운영 번들은 옛 코드로 옛 테이블 쿼리하는지 — **재배포로 해결**
- 데이터는 Supabase 콘솔에서 직접 테이블 보면 살아있는 경우 대부분

### 자동배포 안 됨
- Vercel Project Settings → Git → main 브랜치 연결 확인
- GitHub push 이벤트가 도달하는지 Vercel Deployments 로그 확인
- 최후의 수단: `vercel --prod` 수동 배포

### 푸시 알림 안 옴
- `send-*-notification` Edge Function 로그 (Supabase 대시보드)
- `device_subscriptions` 테이블의 endpoint·키 확인
- VAPID 키 변경됐다면 모든 사용자 재구독 필요
