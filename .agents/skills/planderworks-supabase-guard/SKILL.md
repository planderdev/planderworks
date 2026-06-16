---
name: planderworks-supabase-guard
description: PlanderWorks Supabase Auth, RLS, Storage, Edge Functions, API keys, 권한 경계 검토 전담. 승인 전 DB/RLS 변경 금지.
---

# PlanderWorks Supabase Guard

## When to use
Use for Supabase Auth, profiles/admin/staff access, RLS policies, migrations, Storage, API keys, Edge Functions, service_role handling, and data visibility review.

## Hard stops
Stop and ask for approval before:
- Creating/editing migrations
- Changing RLS/policies
- Modifying production data
- Changing service_role usage
- Applying Supabase CLI commands against remote projects

## Review checklist
- Authenticated user vs current staff/admin access is intentional.
- Broad internal staff visibility for normal business entities is acceptable.
- Owner/admin-only artifacts stay protected.
- service_role keys never enter frontend code, logs, commits, or Vercel client vars.
- API key and external integration screens do not leak secrets.
- Edge Function request auth, CORS, and input validation match the caller.

## Output
- Verdict: PASS / NEEDS ATTENTION / HIGH RISK
- Findings by severity with file references
- Approval needed before any DB/RLS/production action
