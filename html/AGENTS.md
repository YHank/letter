<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-07 | Updated: 2026-04-16 -->

# html/

## Purpose
SPA에서 동적으로 로드하는 페이지 HTML 조각 모음. `NavigationManager`가 `html/{page}.html`을 가져와 `main.container`에 삽입하며, 각 파일은 완전한 문서가 아니라 콘텐츠 조각만 포함합니다.

## Key Files

| File | Description |
|------|-------------|
| `spellcheck_simple.html` | 다음 맞춤법 검사기 iframe 기반 UI |
| `salary.html` | 연봉 실수령 계산기 UI, 2026년 세법과 4대보험 기준 안내 포함 |
| `salary_test_runner.html` | 연봉 계산 로직 2026 검증용 브라우저 테스트 러너 |
| `insurance_calculator.html` | 4대보험료 계산기 UI, 2026년 보험료율과 사업장 조건 입력 지원 |
| `severancepay.html` | 퇴직금 계산기 UI |
| `scientific_calculator.html` | 공학용 계산기 UI |
| `typing_practice.html` | 타자 연습 UI, 표준/초보/특수/자유 모드와 사용자 TXT 업로드 모드 제공 |
| `test_runner.html` | 브라우저 기반 공용 테스트 러너 |

## For AI Agents

### Working In This Directory
- 각 HTML 파일은 `<html>`, `<head>`, `<body>` 없이 콘텐츠만 포함해야 함
- 새 페이지를 추가하면 `js/navigation-manager.js`의 `scriptMap`, `pageMenuMap`, `pageTitleMap`, `pageDescriptionMap`을 함께 갱신할 것
- 페이지 로드 후 초기화가 필요하면 대응 JS 파일에서 `window.initialize{PageName}` 전역 함수를 노출할 것
- `salary_test_runner.html`과 `test_runner.html`은 배포 대상이지만 일반 사용자 페이지가 아닌 검증 도구임

### Page Registration Pattern
새 페이지 `mypage` 추가 시 `navigation-manager.js`에 아래 항목들을 추가:
```js
'mypage': ['/js/mypage.js?1'],
'mypage': 'a[data-move="mypage"]',
'mypage': '새 기능 - 설명',
'mypage': '새 기능 설명 메타디스크립션'
```

### Testing Requirements
- 계산기 마크업을 바꾸면 `html/salary_test_runner.html` 또는 `html/test_runner.html`에서 동작을 확인할 것
- 접근성 속성(`aria-label`, `aria-live`)을 제거하거나 약화하지 말 것

## Dependencies

### Internal
- `js/navigation-manager.js`, 이 디렉토리 파일을 동적 로드
- `js/salary_calculator.js`, `salary.html` 초기화
- `js/insurance_calculator.js`, `insurance_calculator.html` 초기화
- `js/typing_practice.js` + `js/practice_data.js`, `typing_practice.html` 초기화
- `js/scientific_calculator.js`, `scientific_calculator.html` 초기화
- `js/spellcheck_simple.js`, `spellcheck_simple.html` 초기화

### External
- `https://alldic.daum.net/grammar_checker.do`, 맞춤법 검사 iframe 소스

<!-- MANUAL: -->
