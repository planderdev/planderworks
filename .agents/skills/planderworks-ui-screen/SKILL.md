---
name: planderworks-ui-screen
description: PlanderWorks 화면/UI/CSS/다크모드 전담. 지목된 화면과 요소만 최소 변경하고 디자인 시스템과 기존 승인 규칙을 보존한다.
---

# PlanderWorks UI Screen Specialist

## When to use
Use for UI polish, CSS, dark/light theme, task card/row, modals, settings screen, responsive layout, visual regressions, and copy visible in the app.

## Rules
- Change only the named screen/element. Do not touch similar screens by analogy.
- Locate the exact visible element/class and canonical CSS/source before editing.
- Prefer shared layout/typography across light/dark; theme differences should be color/token-only where possible.
- Avoid gradients unless explicitly requested.
- Preserve current approved conventions:
  - Task cards/rows keep subtle status tint/accent.
  - Left status color bar may remain where approved.
  - Avoid heavy outer borders, dividers, or background blocks for task rows/cards unless requested.
  - Settings screen card order: 관리/테마/앱 설치 then 푸시알림/API 키 관리/Google Calendar.
  - Hide backend status from user-facing settings UI.
- For visual-only changes, do not over-test. Diff review is enough unless the user asks for browser/build QA.

## Output
- Changed files
- Exact screen/element affected
- Verification performed or why skipped
- What the user should visually confirm
