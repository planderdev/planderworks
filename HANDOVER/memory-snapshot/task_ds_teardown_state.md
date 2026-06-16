---
name: task-ds-teardown-state
description: Planderworks DS 테마 마이그레이션 teardown의 진행 상태와 styles.css 패치 레이어 지도 — 다음 세션이 이어서 할 때 참조
metadata: 
  node_type: memory
  type: task
  originSessionId: 0e3b7e17-5460-4836-85e3-23fb1b19fe2e
---

DS 정렬(라이트/다크 둘 다, tds.html 기준) 작업의 teardown 진행 상태. 전체 맥락은 [[concept-design-system]], 안전원칙은 [[feedback-safe-changes]].

**커밋된 체크포인트(로컬 main, 미푸시 — origin/main 대비 ahead 6):**
- `4e831c2` DS 토큰 기반 + 라이트/다크 통일(상단 토큰층 교체, "flat KPI redesign" 충돌블록 제거)
- `32b3958` 죽은 컬러테마 CSS 579줄 제거(colorTheme 항상 'default'라 `[data-color-theme=...]`는 죽은코드)
- `3055d92` 중복 "eye-comfort #CCCCCC" 다크 패치 제거(126줄)
- `86eddcb` task-card 상태 틴트를 DS status 토큰(--info/warning/danger/success-bg)으로
- `3fc777c` **다크 @media(min-width:1080px) 사이드바 오버라이드 블록 738줄 제거**(admin-console+rollback) + active-contrast 패치 제거 → 다크 사이드바가 토큰 구동(라이트와 통일). 빌드 검증·다크 대시보드/전체업무 검증됨.
- `(d7d2c7 토큰화 커밋)` 다크 meta색 #d7d2c7 → var(--text-secondary)

**현재 메트릭:** `!important` 710 → **368**, styles.css 9565 → **8092줄**. 빌드 통과. 앱은 라이트/다크 DS 정상.
**사용자가 "마무리됨"으로 이번 라운드 종료.** (2026-05-24)
**미검증:** 프로토타입에 프로젝트 데이터가 없어 다크 프로젝트모드 folder-tab 화면 확인은 못 함(단, korean-glyph 수정본은 7276 부근에 보존돼 있음).

**이미 토큰 기반으로 제대로 전환된 것:** 토큰 foundation, 폰트, 사이드바 base(6893 클러스터), 버튼 base(.primary-action/.secondary-action/.create-split-button/.icon-button), 입력필드(.form-grid/.form-stack + focus ring), 전역 체크박스/라디오(accent-color), 상태 틴트.

**검증:** 프리뷰 :5173(`.claude/launch.json` "dev"), 프로토타입 진입(로그인서 "프로토타입 보기" 클릭) 후 `document.documentElement.dataset.theme`='light'/'dark' 토글 + 스크린샷. 대시보드/전체업무/구독정산/캘린더/회의록(보드+모달)/주간보고 = 양 테마 DS 정상 확인.

**남은 핵심 작업 = styles.css(현재 ~8845줄)의 패치 레이어 정리.** 7000행 이후가 ~27개 시간순 패치(주석 헤더로 구분, `!important` ~675개). 핵심 구조:
- **다크 `@media (min-width:1080px)` 블록(약 7123-7860, 738줄)**: "ADMIN editorial dark console" → 바로 아래 "Sidebar rollback"이 되돌림(상쇄). admin-console는 rollback에 의해 사실상 죽음. BUT rollback이 다크 사이드바를 하드코딩(`#eef1f5`, rgba 오버레이, mono)으로 `!important` 재주입 → 다크 사이드바가 토큰이 아닌 이 패치로 그려짐(coincidentally 맞음). 같은 블록에 korean-glyph 클리핑 수정·project active 상태 등 **load-bearing 규칙 혼재** → 통째 제거 시 다크 프로젝트모드/폴더탭 깨질 수 있음. 신중히 분해 필요.
- 패치 색 하드코딩은 대부분 DS 다크 토큰 값과 동일(#cccccc=text, #292929=border, #101010=surface, #4a4a4a=border-strong) → 다수가 중복.
- base에 하드코딩 색 ~373개(상당수 원래 다크용 `rgba(255,255,255,.x)` 오버레이) → 토큰화하면 다크 `!important` 패치들이 일괄 중복이 되어 제거 가능해짐. **순서: base 토큰화 → 다크 패치 제거.**
- `#d8d4ca`는 앱의 의도적 라이트 보더 톤(`--works-light-border`), DS `--border`(#E1E1E1)와 미세차이만.

**방법론(검증된):** 패치 블록 하나씩 → (가리키는 base 규칙 토큰화 → 패치 제거 또는 토큰치환) → 빌드 + 라이트/다크 스크린샷 검증 → 위험구간 전 로컬 커밋 체크포인트. eye-comfort 패치는 이 방식으로 안전 제거됨(완전 중복이었음).
