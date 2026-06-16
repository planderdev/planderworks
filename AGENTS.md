# PlanderWorks Agent Guide

## WHAT
PlanderWorks is Plander's internal staff-only task, project, client, schedule, notification, and meeting-minute workspace.

Canonical repo: `/Users/ddt/Dev/planderworks`  
Production: `https://planderworks.vercel.app`

## WHY
Keep PlanderWorks stable for current staff operations. Prioritize visible UI/QA defects, safe task workflows, account control, push/notification reliability, and clean handoff records.

## HOW
- Default language: Korean. Keep reports short and practical.
- Use the PlanderWorks management harness for multi-step work: start with `.agents/skills/planderworks-orchestrator/SKILL.md`.
- Codex-native mirrors also exist under `.codex/skills/` for discovery.
- Do not change DB schema, RLS, production data, Supabase policies, deployment, dependencies, or broad architecture without explicit approval.
- Do not commit, push, open PRs, or deploy unless explicitly asked.
- Before edits: check `git status --short --branch` and preserve unrelated work.
- UI tuning: only the named screen/element. Do not propagate styles to similar screens unless requested.
- For dark mode: keep light-mode structure/spacing/typography and change color tokens only where possible.
- For task rows/cards: preserve subtle status tint/accent; avoid heavy outer borders/background blocks unless requested.
- For business/user-facing copy: use professional Plander-wide wording.

## Core commands
```bash
npm run typecheck
npm run build
npm run dev
```

## Important paths
- Main app: `src/main.tsx`
- Styles: `src/styles.css`
- Types: `src/types.ts`
- Supabase client: `src/supabaseClient.ts`
- Edge functions: `supabase/functions/`
- Migrations/schema: `supabase/migrations/`, `supabase/schema.sql`
- Design reference: `design-samples/plander-design-system.md`
- Harness spec: `docs/harness/planderworks/team-spec.md`

## Safety defaults
- If a request touches DB/RLS/production data, stop and ask for approval.
- If a request is visual-only, make the minimal local change and report changed files; browser/build QA is optional unless requested.
- If a request is unclear, ask one narrow question about the exact screen/element/scope.
