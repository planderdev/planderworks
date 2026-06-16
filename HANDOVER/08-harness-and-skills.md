# 08 — Agent 하네스 / Codex 스킬

## 구조

이 저장소는 **Claude Code / Codex CLI 에이전트가 일관된 규칙으로 작업하도록** 하네스가 같이 들어있습니다.

```
AGENTS.md                            # 에이전트 진입 가이드 (한 페이지 요약)
docs/harness/planderworks/
  └── team-spec.md                   # 하네스 전체 사양
.agents/skills/                      # Claude Code용 SKILL.md 6종
  ├── planderworks-orchestrator/         # 라우팅·조율
  ├── planderworks-ui-screen/            # 화면별 UI·CSS·테마
  ├── planderworks-task-workflow/        # 업무·프로젝트·코멘트 흐름
  ├── planderworks-supabase-guard/       # Auth/RLS/Storage/Edge 안전 검토
  ├── planderworks-notification-integrations/  # 푸시·구글 캘린더·알림 함수
  └── planderworks-release-qa/           # 타입·빌드·통합 최종 검증
.codex/skills/                       # 동일 6종을 Codex CLI용으로 미러
```

## 핵심 규칙 (AGENTS.md 요약)

1. **DB 스키마 / RLS / 운영 데이터 / Supabase 정책 / 배포 / 의존성 / 광범위한 아키텍처** 변경은 **명시적 승인 없이는 금지**
2. **커밋·푸시·PR·배포**는 명시적 요청 시에만
3. 편집 전 `git status --short --branch` 로 무관한 작업 보존 확인
4. **UI 튜닝은 요청된 화면/요소만** — 비슷한 화면으로 스타일 전파 금지
5. 다크 모드는 라이트 모드 구조/간격/타이포 그대로 두고 **색상 토큰만** 바꿈
6. 업무 행/카드: 상태 틴트·악센트만, 두꺼운 외곽선·배경 블록 금지
7. 비즈니스/사용자 문구는 **Plander 사내 표준 톤**
8. 의문점은 **정확한 화면/요소/스코프 한 가지만** 좁혀 물어봄

## 라우팅 예시

| 요청 | 라우팅 |
|---|---|
| "설정 화면 카드 순서만 바꿔" | UI Screen |
| "업무 상태 저장이 이상해" | Task Workflow + Release QA |
| "관리자 권한 / RLS 확인" | Supabase Guard + Release QA |
| "푸시 알림 안 와" | Notification Integrations (+ Supabase Guard) |
| "배포 전 리뷰" | Release QA |

## 새 담당자가 알아둘 점

- 본인이 어떤 에이전트(Claude Code, Codex CLI, Cursor 등)를 쓰든, **AGENTS.md만 한 번 읽으면** 본 저장소의 작업 규칙은 파악 가능
- `.agents/skills/` 와 `.codex/skills/` 내용은 동일 (편의상 미러). 한쪽만 수정 시 다른 쪽도 같이 갱신 권장
- 새로운 스킬이 필요하면 `<skill-name>/SKILL.md` 추가하고 orchestrator의 라우팅 표 업데이트

## 권장 워크플로 (다중 단계 작업)

1. orchestrator가 요청 분류 + 어느 스페셜리스트가 필요한지 결정
2. 스페셜리스트가 변경 / 리뷰 노트 작성
3. 중요 변경이면 Release QA가 빌드/타입/통합 검증
4. Supabase Guard는 DB/RLS/운영 데이터 관련 작업에 거부권 가짐

작은 변경(`설정 화면 카드 순서만`)에는 굳이 multi-agent로 안 가도 됨.

## handoff 파일 (선택)

큰 작업은 `_workspace/` 디렉터리에 흔적 남길 수 있음:
- `_workspace/00_request.md`
- `_workspace/01_orchestrator_plan.md`
- `_workspace/02_{role}_notes.md`
- `_workspace/03_qa_report.md`
- `_workspace/04_final_summary.md`

작은 CSS 튜닝엔 만들지 않음. (다중 단계, 리뷰 무게가 있는 작업에만)
