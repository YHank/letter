<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-07 | Updated: 2026-04-16 -->

# test/

## Purpose
Node.js 기반 테스트 스크립트 디렉토리. 브라우저 전역 객체를 필요한 만큼 모킹하거나, 계산 로직을 재현하는 방식으로 비즈니스 규칙을 독립적으로 검증합니다. 외부 테스트 프레임워크 없이 커스텀 assertion 함수로 동작합니다.

## Key Files

| File | Description |
|------|-------------|
| `salary_calculator_test.js` | 연봉 계산기 단위 테스트, 2026 세율과 보험료 계산 검증 |
| `insurance_calculator_test.js` | 4대보험료 계산기 단위 테스트, 2026 요율과 사업장 조건 검증 |
| `text_analyzer_test.js` | 텍스트 분석기 단위 테스트, 글자수와 단어수 계산 검증 |
| `storage_manager_test.js` | 스토리지 매니저 단위 테스트, localStorage 추상화 검증 |
| `navigation_manager_test.js` | 네비게이션 매니저 단위 테스트, SPA 라우팅과 상태 전환 검증 |

## For AI Agents

### Working In This Directory
- 실행 방법은 기본적으로 `node test/<파일명>.js`
- 테스트 프레임워크 대신 `assertEquals`, `assertAlmostEquals`, `assertRange` 같은 커스텀 함수를 사용함
- 브라우저 의존 로직은 파일 상단에서 `window`, `document`, `localStorage` 등을 모킹하거나 계산식 자체를 재현함
- 계산기 UI 변경 검증은 `html/salary_test_runner.html`과 `html/test_runner.html`을 함께 사용할 것

### Testing Requirements
- `salary_calculator.js` 수정 후 `node test/salary_calculator_test.js` 실행
- `insurance_calculator.js` 수정 후 `node test/insurance_calculator_test.js` 실행
- 텍스트 분석 로직 변경 시 `node test/text_analyzer_test.js` 실행
- 새 모듈에 테스트가 필요하면 동일한 명명 규칙의 `*_test.js` 파일을 추가할 것

## Dependencies

### Internal
- `js/salary_calculator.js`, `salary_calculator_test.js`의 대상
- `js/insurance_calculator.js`, `insurance_calculator_test.js`의 대상
- `js/text-analyzer.js`, `text_analyzer_test.js`의 대상
- `js/storage-manager.js`, `storage_manager_test.js`의 대상
- `js/navigation-manager.js`, `navigation_manager_test.js`의 대상

<!-- MANUAL: -->
