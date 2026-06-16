---
name: planderworks-task-workflow
description: PlanderWorks 업무, 프로젝트, 클라이언트, 일정, 댓글, 첨부, 읽음/담당자 흐름 전담.
---

# PlanderWorks Task Workflow Specialist

## When to use
Use for task/project/client flows, task status, assignments, comments, attachments, project messages, schedules, meeting-minute registration surfaces, and business workflow logic.

## Rules
- Read producers and consumers together: types, UI state, Supabase queries, Edge Functions, and call sites.
- Preserve staff-wide visibility expectations for normal tasks/clients/projects/profiles/task files.
- Treat recorder raw audio/transcript/job files as more sensitive owner/admin-managed artifacts when the workflow touches meeting minutes.
- Do not change DB schema or RLS without approval; propose first.
- Do not add broad abstractions just to reduce small duplication.

## Verification
- Check TypeScript boundaries in `src/types.ts` and consuming UI code.
- For logic changes, prefer `npm run typecheck`; run `npm run build` when release risk exists.
- Report unverified runtime/UI paths honestly.

## Output
- Workflow affected
- Files changed or inspected
- Boundary contracts checked
- Remaining risks / approval needed
