---
name: planderworks-release-qa
description: PlanderWorks 릴리즈 전 코드리뷰, 타입/빌드, 경계면 정합성, 회귀 리스크 검증 전담.
---

# PlanderWorks Release QA Reviewer

## When to use
Use after implementation, before release, for review-only requests, or whenever a change crosses UI/API/Supabase/type boundaries.

## Review priorities
1. Integration correctness: producer and consumer contract match.
2. User-impacting regressions: visible UI, task flow, auth access, notification delivery.
3. Security/data visibility: auth, RLS, secrets, service_role, sensitive artifacts.
4. Build/type health.
5. Maintainability and dead code.

## Verification levels
- Visual CSS-only: inspect diff and identify exact user confirmation target.
- Type/logic change: run `npm run typecheck` when practical.
- Release-risk change: run `npm run build` when practical.
- Supabase/Edge change: static boundary review; do not apply remote changes without approval.

## Report format
```markdown
판정: PASS / NEEDS ATTENTION / HIGH RISK

필수 수정:
- ...

주의/권장:
- ...

검증:
- 실행: ...
- 미검증: ...

변경/검토 파일:
- ...
```
