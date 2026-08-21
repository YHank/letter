<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-07 | Updated: 2026-08-21 -->

# test/

## Purpose
Node.js 기반 테스트 스크립트 디렉토리. 브라우저 전역 객체를 필요한 만큼 모킹하거나, 계산 로직을 재현하는 방식으로 비즈니스 규칙을 독립적으로 검증합니다. 외부 테스트 프레임워크·의존성 없이 커스텀 assertion 함수로 동작하며, 실패 시 종료 코드가 아니라 콘솔 요약으로 결과를 보고합니다.

## Key Files

| File | Description | 검증 방식 |
|------|-------------|-----------|
| `salary_calculator_test.js` | 연봉 계산기. 2026 세율·보험료, 정방향 계산과 역산 검증 | `vm` 모듈로 원본 JS 로드 |
| `text_analyzer_test.js` | 텍스트 분석기. 글자수·단어수·문장수 계산 검증 | `window` 모킹 후 로드 |
| `advanced_analyzer_test.js` | 고급 분석기. 한국어 감정·키워드·가독성·문체 회귀 검증 | `window` 모킹 후 로드 |
| `navigation_manager_test.js` | 네비게이션 매니저. SPA 라우팅과 상태 전환 검증 | `vm` + DOM/fetch/history 최소 모킹 |
| `storage_manager_test.js` | 스토리지 매니저. localStorage 추상화 검증 | `Map` 기반 localStorage 모킹 |
| `insurance_calculator_test.js` | 4대보험료 계산기. 2026 요율과 사업장 조건 검증 | **로직 재현** (원본 미로드) |

케이스 수는 기능 추가에 따라 계속 늘어나므로 이 문서에 고정하지 않습니다. 각 파일을 실행하면 마지막 줄에 `N개 통과 / M개 실패` 요약이 출력됩니다.

## For AI Agents

### Working In This Directory
- 실행 방법은 기본적으로 `node test/<파일명>.js`
- 테스트 프레임워크 대신 `assertEquals`, `assertAlmostEquals`, `assertRange` 커스텀 함수를 사용함
- 브라우저 의존 로직은 파일 상단에서 `window`, `document`, `localStorage`, `fetch`, `history`를 모킹하거나 `vm` 모듈로 원본 스크립트를 샌드박스에 로드함
- **`insurance_calculator_test.js`는 이중 관리 대상**: `insurance_calculator.js`의 계산 로직이 `initializeInsuranceCalculator()` 클로저 안에 캡슐화되어 직접 접근이 불가능해, 동일한 요율과 계산식을 테스트 파일 안에서 재현하고 있습니다. **요율을 바꾸면 두 파일을 모두 수정해야 하며, 그렇지 않으면 테스트가 통과해도 실제 동작과 어긋납니다.**
- 계산기 UI 변경 검증은 `html/salary_test_runner.html`과 `html/test_runner.html`을 함께 사용할 것
- `.gitignore`에 `**/test/**`가 있으나 이 디렉토리는 이미 git에 추적 중이라 규칙이 적용되지 않음. 새 테스트 파일을 추가하면 무시되므로 `git add -f`가 필요할 수 있음

### Testing Requirements
- `salary_calculator.js` 수정 후 `node test/salary_calculator_test.js` 실행
- `insurance_calculator.js` 수정 후 `node test/insurance_calculator_test.js` 실행
- 텍스트 분석 로직 변경 시 `node test/text_analyzer_test.js` 실행
- `advanced-analyzer.js` 수정 후 `node test/advanced_analyzer_test.js` 실행. 이 테스트는 과거 버그(양방향 `includes` 감정 오탐, 영어 기준 가독성 임계값, 조사·어미가 키워드로 집계되던 문제, 사전형만 검색하던 피동 카운트, ㅂ·ㅡ 불규칙 활용 미인식, `좋지 않다`를 긍정으로 세던 부정 표현 누락, 부사 `굉장히`가 `굉장하다`로 오탐되던 문제)의 재발을 막는 회귀 스위트임
- 새 모듈에 테스트가 필요하면 동일한 명명 규칙의 `*_test.js` 파일을 추가할 것

## Dependencies

### Internal
- `js/salary_calculator.js`, `salary_calculator_test.js`의 대상
- `js/insurance_calculator.js`, `insurance_calculator_test.js`의 대상
- `js/text-analyzer.js`, `text_analyzer_test.js`의 대상
- `js/storage-manager.js`, `storage_manager_test.js`의 대상
- `js/navigation-manager.js`, `navigation_manager_test.js`의 대상

<!-- MANUAL: -->
