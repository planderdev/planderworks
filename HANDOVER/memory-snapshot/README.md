# 메모리 스냅샷

이전 담당자(Claude)의 영구 메모리 디렉터리 스냅샷입니다.

## 원본 위치
`~/.claude/projects/-Volumes-ddt-Dev-planderworks/memory/`

## 사용법

### 새 담당자도 Claude Code를 쓰는 경우
같은 머신의 같은 계정이면 자동 로드됨. 다른 머신/계정으로 옮길 때:
1. 새 머신에서 같은 경로 생성:
   ```bash
   mkdir -p ~/.claude/projects/-Volumes-ddt-Dev-planderworks/memory
   ```
   (저장소를 다른 경로에 두면 경로 prefix가 달라집니다 — Claude Code는 작업 폴더 경로를 dash-encoded로 사용)
2. 이 폴더의 모든 `.md` 파일을 그쪽으로 복사:
   ```bash
   cp HANDOVER/memory-snapshot/*.md \
      ~/.claude/projects/-Volumes-ddt-Dev-planderworks/memory/
   ```

### 다른 에이전트(Codex CLI, Cursor 등)를 쓰는 경우
이 파일들은 **이전 담당자의 컨텍스트 기록**으로만 활용. 새 에이전트가 자동 로드하진 않습니다.
대신 핵심 내용은 [09 — 편집 규칙](../09-rules-and-cautions.md)과 [AGENTS.md](../../AGENTS.md)에 반영해뒀습니다.

## 파일별 요약

| 파일 | 내용 |
|---|---|
| `MEMORY.md` | 인덱스 — 어떤 메모리들이 있는지 한 줄씩 |
| `project_planderworks.md` | 프로젝트 정체성, 협업 관계 |
| `feedback_safe_changes.md` | "기능·DB 불가침" 규칙, 빌드 byte-identical 증명 가능한 변경만 |
| `concept_design_system.md` | 디자인 시스템 토큰 / 컴포넌트 단계 적용 진행도 |
| `concept_meeting_minute_flow.md` | 회의록 외부 등록 흐름 (녹음 봇 → Edge Function → DB) |
| `task_ds_teardown_state.md` | DS 적용 작업 진행 상황 추적 |
