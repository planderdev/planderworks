# PlanderWorks Management Harness

## Purpose
Create a Codex-first management team for PlanderWorks so implementation, UI tuning, Supabase safety, notification work, and release QA follow stable rules.

## Architecture
Pattern: Expert Pool + Producer-Reviewer.

- The orchestrator selects the smallest relevant specialist set.
- Implementation specialists produce changes or review notes.
- Release QA reviews boundary correctness when changes are non-trivial.
- Supabase Guard has veto power for DB/RLS/production-impacting work until explicit approval.

## Roles
| Role | Skill | Responsibility |
|---|---|---|
| Orchestrator | `planderworks-orchestrator` | Classify request, route work, preserve scope, report outcome |
| UI Screen Specialist | `planderworks-ui-screen` | Screen-level UI/CSS/theme work |
| Task Workflow Specialist | `planderworks-task-workflow` | Task/project/client/schedule/comment/attachment flows |
| Supabase Guard | `planderworks-supabase-guard` | Auth/RLS/Storage/Edge/security boundary review |
| Notification Integrations | `planderworks-notification-integrations` | Push, service worker, Google Calendar, notification functions |
| Release QA | `planderworks-release-qa` | Final review, type/build checks, integration contract validation |

## Handoff files
Use `_workspace/` only when the task is multi-step, review-heavy, or needs durable evidence.

Recommended names:
- `_workspace/00_request.md`
- `_workspace/01_orchestrator_plan.md`
- `_workspace/02_{role}_notes.md`
- `_workspace/03_qa_report.md`
- `_workspace/04_final_summary.md`

Do not create `_workspace/` for tiny CSS tweaks unless a written trace is useful.

## Default routing examples
- "설정 화면 카드 순서만 바꿔" → UI Screen Specialist only.
- "업무 상태 저장이 이상해" → Task Workflow Specialist + Release QA.
- "관리자 권한/RLS 확인" → Supabase Guard + Release QA.
- "푸시 알림 안 옴" → Notification Integrations + Supabase Guard if auth/data boundary appears.
- "배포 전 리뷰" → Release QA, then relevant specialist if blockers are found.

## Safety policy
- DB schema/RLS/production data changes require explicit approval.
- Deploy/commit/push/PR require explicit approval.
- Broad UI propagation requires explicit approval.
- Preserve unrelated work; never use destructive git reset/restore without explicit request.

## Completion criteria
A task is complete only when:
- Requested scope is addressed.
- Changed files are reported.
- Verification is run or explicitly marked as skipped/unverified.
- Any approval-needed items are listed.
- No unrelated files are modified.
