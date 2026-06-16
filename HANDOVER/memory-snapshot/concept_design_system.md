---
name: concept-design-system
description: Planderworks 디자인시스템의 단일 진실 공급원(SoT) — 어디서 가져오고 토큰/폰트가 무엇인지
metadata: 
  node_type: memory
  type: concept
  originSessionId: 0e3b7e17-5460-4836-85e3-23fb1b19fe2e
---

Planderworks 디자인시스템의 **기준(SoT)은 라이브 페이지**:
- 토큰+컴포넌트 docs: `https://plandertest2.mycafe24.com/design-system/plander/tds.html` ("PLANDER — Docs", 외부 `plander-tokens.css`를 링크하나 그 파일은 404 → 토큰은 tds.html 인라인 `<style>`의 BRAND CONSTANTS/THEME 섹션에 있음). 컴포넌트 docs 섹션: FIELDS/CHECK·RADIO·SWITCH/TABS/TABLE/CARDS/ALERT/MODAL/BADGE/CHARTS/BREADCRUMB·PAGINATION/AVATAR·PROGRESS/CRM dashboard pattern 등.
- 쇼케이스: `https://plandertest2.mycafe24.com/design-system/plander/` ("Design System / Pro"). 두 페이지의 색 토큰 값은 동일.

토큰 값 검증됨: 앱 styles.css 상단에 깐 foundation 토큰이 tds.html 토큰과 **값이 일치**(다크 --bg#000/--surface#101010/--border#292929/--text#CCCCCC, 라이트 --bg#FFF/--text#0A0A0A, status·iri·g-polish 동일).

**주의:** 로컬 `design-samples/`의 슬라이드(plander-meeting-brief 등)는 **디자인시스템이 아니다**(사용자가 "저 슬라이드 아니야"라고 명확히 함). 기준은 위 URL.

**토큰 체계 (앱과 동일하게 `data-theme` 속성 기반 — 이식 쉬움):**
- 폰트: `--f-display` Montserrat, `--f-body` JetBrains Mono(라틴)+Pretendard(한글), `--f-kr` Pretendard, `--f-mono` JetBrains Mono
- 스페이싱(4px 베이스): `--s-xxs`4 `--s-xs`8 `--s-sm`12 `--s-md`16 `--s-lg`24 `--s-xl`40 `--s-xxl`72 `--s-section`120
- radius: `--r-none`0 `--r-subtle`2 `--r-pill`9999; 치수: `--nav-h`60 `--sidebar-w`264 `--maxw`1240
- density `[data-density]`: comfortable(`--ctrl-h`44 `--ctrl-px`18 `--row-py`14 `--card-pad`24) / compact(36/14/9/16)
- 색 토큰은 `[data-theme="dark"]`/`[data-theme="light"]` 블록에 둘 다 정의(둘 다 디자인시스템 적용 대상): `--bg --bg-subtle --surface --surface-raised --overlay --border-subtle --border --border-strong --text --text-secondary --text-muted --text-disabled --accent --accent-fg --accent-hover --steel --chrome --iri-* --g-polish(홀로그래픽 그라데이션) --success/-bg/-bd --warning --danger --info --focus-ring --shadow`
- 미학: 순흑/순백 베이스, 헤어라인 보더, Montserrat 대문자 헤드라인(.08em), JetBrains Mono 대문자 라벨(.16~.18em), radius 거의 0(최대 subtle 2px), 카드보다 풀블리드 그리드.

**작업 맥락:** 사용자가 이 DS 기준으로 앱 styles.css(9.5k행)를 **라이트+다크 둘 다, 대규모 재작성**하기로 함. 시각 변경이라 byte-identical 불가 → 앱 띄워(프리뷰 :5173, `.claude/launch.json`의 "dev") 스크린샷으로 검증하며 진행. (이 시각 재작성은 [[feedback-safe-changes]]의 byte-identical 규칙 예외 — 사용자가 명시 요청한 의도적 외형 변경.)
DS CSS 추출본은 작업 중 /tmp/plander-ds.css 에 둠(세션 한정).
