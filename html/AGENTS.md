<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-07 | Updated: 2026-08-21 -->

# html/

## Purpose
SPA에서 동적으로 로드하는 페이지 HTML 조각 모음. `NavigationManager`가 `html/{page}.html`을 fetch해 `main.container`의 `innerHTML`로 삽입합니다. 페이지 조각 6개는 완전한 문서가 아니라 `<div class="container">`로 시작하는 콘텐츠 조각이며, 테스트 러너 2개만 독립 실행되는 완전한 HTML 문서입니다.

## Key Files

### 페이지 조각 (SPA로 삽입, `<html>`/`<head>`/`<body>` 없음)

| File | Description |
|------|-------------|
| `typing_practice.html` | 타자 연습 UI. 5개 모드 카드(`data-practice-mode`)와 키보드 시각화, 통계 영역 (604줄) |
| `scientific_calculator.html` | 공학용 계산기 UI. 삼각함수/로그/지수 키패드 (260줄) |
| `insurance_calculator.html` | 4대보험료 계산기 UI. 2026년 요율과 사업장 규모 조건 입력 (241줄) |
| `salary.html` | 연봉 실수령 계산기 UI. 계산 방향 선택(연봉→실수령 / 실수령→연봉) 라디오 그룹과 2026년 세법·4대보험 기준 안내 포함 (159줄) |
| `severancepay.html` | 퇴직금 계산기 UI. 근무기간과 평균임금 입력 (104줄) |
| `spellcheck_simple.html` | 맞춤법 검사 UI. textarea 입력 → 검사 결과 목록 → 교정 적용 버튼 (58줄) |

`typing_practice.html`의 모드는 `free`, `beginner`, `special`, `standard`, `custom` 5종입니다. `custom`은 사용자 TXT 업로드 모드입니다.

### 테스트 러너 (완전한 HTML 문서, 브라우저에서 직접 열기)

| File | Description |
|------|-------------|
| `test_runner.html` | 공용 테스트 러너. `../js/text-analyzer.js`, `../js/storage-manager.js` 로드 (371줄) |
| `salary_test_runner.html` | 연봉 계산기 전용 러너. `../js/utils.js`, `../js/salary_calculator.js` 로드 (270줄) |

## For AI Agents

### Working In This Directory
- 페이지 조각 6개는 `<html>`, `<head>`, `<body>` 없이 콘텐츠만 포함해야 함. `innerHTML`로 삽입되므로 `<script>` 태그를 넣어도 실행되지 않음 — 로직은 반드시 `js/`의 대응 모듈에 둘 것
- 테스트 러너 2개는 예외적으로 완전한 문서 구조를 가지며 상대 경로(`../js/`)로 스크립트를 로드함. 이 둘은 배포에 포함되지만 일반 사용자 페이지가 아닌 검증 도구임
- 접근성 속성(`aria-label`, `aria-live`, `aria-current`)을 제거하거나 약화하지 말 것
- 페이지 조각을 추가·삭제하면 `sw.js`의 `STATIC_ASSETS` 목록도 함께 갱신할 것

### Page Registration Pattern
새 페이지 `mypage` 추가 시 `js/navigation-manager.js`의 **5곳**을 모두 갱신해야 합니다. 한 곳이라도 빠지면 스크립트 미로드, 메뉴 미활성화, 초기화 미실행 중 하나가 조용히 발생합니다.

```js
// 1. scriptMap — 지연 로드할 스크립트 (캐시 버스팅 ?N 포함)
'mypage': ['/js/mypage.js?1'],

// 2. pageMenuMap — active 처리할 네비게이션 셀렉터
'mypage': 'a[data-move="mypage"]',

// 3. pageTitleMap — document.title
'mypage': '새 기능 - 설명',

// 4. pageDescriptionMap — meta description
'mypage': '새 기능 설명 메타디스크립션',

// 5. initializePageScript() 내부 initFunctions — 로드 후 호출할 전역 함수명
'mypage': 'initializeMyPage'
```

추가로 `index.html`의 네비게이션에 `data-move="mypage"` 링크를, `sw.js`의 `STATIC_ASSETS`에 `/html/mypage.html`과 `/js/mypage.js`를 등록할 것.

### 맞춤법 페이지 주의
`spellcheck_simple.html`은 **다음(Daum) iframe이 아니라 로컬 클라이언트 검사기 UI**입니다. `js/spellcheck_client.js`의 `SpellCheckClient`가 검사를 수행합니다.

현재 페이지 상단 안내 문구는 "약 100개의 자주 틀리는 표현을 실시간으로 검사"라고 표시하지만, `SpellCheckClient.corrections` 사전이 비워진 상태라 실제로는 패턴 기반 검사 3종(조사 띄어쓰기, 자음/모음 반복, 문장부호 뒤 중복 공백)만 동작합니다. 문구를 수정하거나 사전을 복원하기 전에 `js/AGENTS.md`의 이력을 먼저 확인할 것.

### Testing Requirements
- 계산기 마크업을 바꾸면 대응 러너(`salary_test_runner.html`, `test_runner.html`)를 브라우저에서 열어 확인할 것
- 러너는 로컬 서버 없이 `file://`로도 열리지만, fetch를 쓰는 기능은 `python -m http.server 8000` 실행 후 확인할 것
- 입력 id를 변경하면 `js/` 대응 모듈의 `DOMUtils.getElement()` 셀렉터를 함께 수정해야 함

## Dependencies

### Internal
- `js/navigation-manager.js`, 이 디렉토리 파일을 동적 로드하고 초기화 함수를 호출
- `js/spellcheck_simple.js` + `js/spellcheck_client.js` → `spellcheck_simple.html`
- `js/salary_calculator.js` → `salary.html`
- `js/insurance_calculator.js` → `insurance_calculator.html`
- `js/typing_practice.js` + `js/practice_data.js`(→ `data/typing/*.json`) → `typing_practice.html`
- `js/scientific_calculator.js` → `scientific_calculator.html`
- `js/severancepay.js` → `severancepay.html`
- `js/utils.js`의 `DOMUtils`, 모든 페이지 스크립트가 DOM 접근에 사용
- `sw.js`, 페이지 조각 6개를 정적 캐시에 포함

### External
- `Bootstrap 5.3.2` 클래스(`container`, `row`, `card`, `form-control` 등), `index.html`에서 로드된 것을 그대로 사용
- `Font Awesome 6.4.0` 아이콘 클래스
- `Chart.js 4.4.0`, `typing_practice.html`의 통계 차트 캔버스

> 외부 iframe 의존성은 없습니다. 이전 문서에 있던 `alldic.daum.net/grammar_checker.do`는 현재 코드에서 사용되지 않으며, `index.html`의 CSP `frame-src`에도 허용되어 있지 않습니다.

<!-- MANUAL: -->
