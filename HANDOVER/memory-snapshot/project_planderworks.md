---
name: project-planderworks
description: "Planderworks 프로젝트의 정체성과 인수 맥락 — 무슨 앱이고, 누가 어떻게 만들었으며, Claude의 역할은 무엇인지"
metadata: 
  node_type: memory
  type: project
  originSessionId: 0e3b7e17-5460-4836-85e3-23fb1b19fe2e
---

Planderworks는 사용자 회사의 **사내 업무관리(task workflow) 앱**이다. 원래 **Codex(OpenAI)로 제작**되었고, 사용자가 Claude에게 인수를 맡겼다.

**Why:** 사용자가 "너가좀 맡아야될거같아서"라고 직접 인수를 요청함. 즉 Claude가 이 코드베이스의 지속적 유지보수/개발 담당이 된다.

**How to apply:** 코드베이스 전반의 구조·관례를 능동적으로 파악하고 유지할 책임이 있다. Codex가 만든 코드라 Claude의 평소 관례와 다를 수 있으니, 기존 패턴을 존중하되 개선점은 짚는다. 프로덕션은 https://planderworks.vercel.app (Vercel 배포). 스택: Vite + React + TypeScript + Supabase(Auth/DB/Storage) + Capacitor(iOS/Android) + Electron. 웹푸시(VAPID/service worker) 사용.
