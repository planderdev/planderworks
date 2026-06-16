# 01 — 프로젝트 개요

## 무엇인가
**Plander Works** — Plander의 사내 직원용 업무관리 웹앱. 한국어 UI 기본. 외부 고객용이 아닌 직원 협업용.

## 주요 기능 (현재 라이브)
- **인증**: Supabase Auth (이메일/비밀번호), 프로토타입 모드(로그인 없이 시드 데이터 미리보기)
- **대시보드**: 받은/보낸 업무, 보고·제안 요약, KPI 카드, 팀 구성원
- **업무**: 받은업무 / 보낸업무 / 전체 업무보기, 코멘트·첨부, 상태/우선순위/마감일/계획 시작일
- **프로젝트**: 폴더 탭, 멤버 관리, 업무 묶음, 보관/삭제
- **업체관리**: 거래처 CRUD
- **회의록**: 게시판 형태, 외부 녹음·요약 앱에서 API 호출로 자동 등록 가능, PDF/XLS/HWP 내보내기
- **공지/전달사항**: 카테고리·고정·코멘트
- **보고·제안**: 업무 중 type=보고/제안 필터
- **캘린더**: 업무 + 개인 스케줄 + 구독·정산 일정 + Google Calendar 동기화
- **구독/정산관리**: 정기 결제, 도메인, SaaS 등 자동 알림
- **직원관리** (관리자): 직원 추가/수정, 권한 부여
- **알림**: 푸시(웹·iOS·Android), 토스트, 구독 관리
- **테마**: 라이트/다크/시스템
- **모바일**: Capacitor 기반 iOS/Android 빌드 가능
- **데스크탑**: Electron 기반 macOS/Windows 빌드 가능
- **주간업무일지** (최신): 자유 라벨 + 커스텀 팔레트 + 드래그 이동/복사, 직원 일지 읽기전용 보기

## 기술 스택

| 영역 | 기술 |
|---|---|
| 프론트엔드 | React 19, TypeScript 5.9, Vite 7 |
| UI | Single-file (`src/main.tsx`), CSS 토큰 (`src/styles.css`) |
| 아이콘 | lucide-react |
| 백엔드 | Supabase (Postgres, Storage, Auth, Edge Functions/Deno) |
| 호스팅 | Vercel (자동배포 from `main`) |
| 모바일 | Capacitor (iOS/Android) |
| 데스크탑 | Electron |
| 푸시 | Web Push (VAPID) + Capacitor Push |

## 주요 URL

| 항목 | URL |
|---|---|
| 운영 | https://planderworks.vercel.app |
| GitHub | https://github.com/planderdev/planderworks |
| Vercel | https://vercel.com/planderdevs-projects/planderworks |
| Supabase | (대시보드 — 04 문서에서 프로젝트 ID 확인) |
| 빌드 메타 | https://planderworks.vercel.app/build-meta.json (현재 배포된 커밋 확인용) |

## 사용자 규모
사내 소수 직원 (10명 이하). 외부 공개 없음.

## 한국어 우선 정책
- 모든 UI/문서/커밋 메시지는 한국어 기본
- 코드 식별자는 영문, 사용자 노출 텍스트는 한국어
