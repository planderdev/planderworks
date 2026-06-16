---
name: planderworks-orchestrator
description: PlanderWorks 작업을 분류하고 UI, 업무흐름, Supabase, 알림, 릴리즈 QA 담당으로 라우팅하는 총괄 하네스.
---

# PlanderWorks Orchestrator

## When to use
Use for any non-trivial PlanderWorks work: implementation, review, UI tuning, Supabase/API inspection, notification issues, release checks, or multi-file changes.

Do not use for one-line factual answers or direct read-only questions unless coordination helps.

## Required inputs
- User request and exact screen/feature if available
- Current repo status
- Whether edits, review-only, or planning-only is expected
- Whether DB/RLS/deploy/commit/push are explicitly approved

## Routing
| Request | Primary skill | Required review |
|---|---|---|
| UI/screen/style/dark mode | `planderworks-ui-screen` | `planderworks-release-qa` when logic/build risk exists |
| Task/project/client workflow | `planderworks-task-workflow` | `planderworks-release-qa` |
| Supabase/Auth/RLS/Storage/API keys | `planderworks-supabase-guard` | approval before DB/RLS changes |
| Push/Google Calendar/Edge Functions | `planderworks-notification-integrations` | `planderworks-supabase-guard` if auth/data boundary changes |
| Pre-release or code review | `planderworks-release-qa` | none unless defects require specialist follow-up |

## Workflow
1. Check repo status and preserve unrelated work.
2. Classify the request and choose the smallest specialist set.
3. For implementation, identify canonical source files before editing.
4. Produce deterministic notes in `_workspace/` only for multi-step or review-heavy tasks.
5. Run only the verification appropriate to scope:
   - CSS-only micro tuning: diff review; user visually confirms.
   - Logic/API/type changes: `npm run typecheck` and/or `npm run build` where practical.
   - Supabase/Edge changes: static boundary review plus explicit approval before production-impacting actions.
6. Report: summary, changed files, verification, risks/approval needed.

## Non-negotiable constraints
- No DB schema/RLS/production data changes without approval.
- No deploy/commit/push/PR without approval.
- No broad UI propagation unless requested.
- No casual private address terms in user-facing business output.
- Preserve PlanderWorks as a staff-only internal app; broad staff visibility is intentional except raw recorder artifacts.

## Outputs
- Short Korean result report
- Optional `_workspace/{phase}_{role}_{artifact}.md` for multi-step tasks
- For reviews: pass/fail/unverified sections with file references
