---
name: planderworks-notification-integrations
description: PlanderWorks 푸시알림, Google Calendar, Supabase Edge Functions, 외부 API 연동 전담.
---

# PlanderWorks Notification & Integrations Specialist

## When to use
Use for Web Push, service worker push subscriptions, task/comment/project/notice notifications, Google Calendar sync, API key management, and external integration failures.

## Rules
- Preserve existing user-facing notification settings and staff workflow expectations.
- Check frontend caller, Supabase function, payload shape, and stored preference fields together.
- Do not remove running automations or scheduled paths unless explicitly requested.
- Avoid exposing backend internals in user-facing settings.
- If auth/data boundary changes, involve `planderworks-supabase-guard`.

## Verification
- Inspect Edge Function and frontend call site together.
- Confirm payload fields match TypeScript expectations and database columns.
- For service worker changes, report cache/update risk and whether browser verification is needed.

## Output
- Integration affected
- Call path checked
- Verification result
- Risks / follow-up
