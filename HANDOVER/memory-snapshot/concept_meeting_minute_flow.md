---
name: concept-meeting-minute-flow
description: Planderworks 회의록(meeting minutes)이 실제로 어떻게 생성·사용되는지 — 외부 인젝트 파이프라인 구조
metadata: 
  node_type: memory
  type: concept
  originSessionId: 0e3b7e17-5460-4836-85e3-23fb1b19fe2e
---

Planderworks 회의록은 주로 **외부 파이프라인으로 자동 주입**된다 (사용자가 직접 앱에서 타이핑하는 게 아님):

**플로우:** 플랜더REC 앱(회의 녹음·전사) → 에르메스(Hermes, 회의록 요약 생성) → Planderworks로 인젝트.

**기술 경로:**
- 인젝트는 API키 기반 Edge Function `supabase/functions/create-meeting-minute`(scope `meeting_minutes`, `x-plander-api-key` 헤더)로 들어와 `meeting_minutes` 테이블에 저장된다.
- 앱에서는 전용 회의록 컴포넌트(회의록 폼/보드, main.tsx 7575 부근)와 회의록 게시판이 이를 렌더링한다.
- 알림은 `send-meeting-minute-notification`.
- 루트의 `.hermes-backups/` 디렉터리가 이 Hermes 연동과 관련됨.

**Why it matters:** 회의록 인젝트 경로는 외부 앱들과 계약(API)된 핵심 기능이라 **절대 깨면 안 된다**(불가침: [[feedback-safe-changes]]). `meeting_minutes` 테이블 스키마, `create-meeting-minute` Edge Function의 입력 형식/필드(category, title, content, summary, decisions, actionItems, attendees, heldAt 등), API키 검증 로직을 바꾸면 외부 연동이 깨진다.

**주의:** 과거 Codex가 회의록 로직(category/decisions/actionItems/attendees + changeCategory)을 업무 수정 폼 `TaskEditModal`에도 복붙해 둔 적 있는데, 그건 미사용 죽은 코드였고 인젝트 경로와 무관해 제거함. 진짜 회의록 폼(7575 부근)은 별개다.
