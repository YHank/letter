<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-07 | Updated: 2026-04-16 -->

# js/

## Purpose
애플리케이션의 비즈니스 로직과 UI 상호작용을 담당하는 JavaScript 모듈 모음. 빌드 도구 없는 순수 ES6+ 코드로 구성되며, 최근 리팩터링 이후 메인 편집기 기능이 여러 책임별 파일로 분리되어 있습니다.

## Key Files

| File | Description |
|------|-------------|
| `index.js` | 메인 글자수 세기 진입점, 통계 갱신, 자동 저장, 텍스트 변환, 단축키 연결 |
| `error-handler.js` | 전역 오류 처리와 사용자 친화적 오류 메시지 관리 |
| `toast.js` | 토스트 알림 UI 생성과 표시 관리 |
| `undo-redo.js` | 메인 편집기의 실행 취소/다시 실행 기록 관리 |
| `analysis-ui.js` | 글자수 세기 결과 영역과 분석 UI 보조 로직 |
| `keyboard-handler.js` | 메인 편집기와 타자 관련 키보드 상호작용 보조 처리 |
| `mobile-handler.js` | 모바일 환경 대응 UI 동작과 입력 보조 처리 |
| `navigation-manager.js` | SPA 라우터, 페이지 로드, 캐시, 스크립트 동적 주입, SEO 메타 갱신 |
| `darkmode.js` | 다크모드 토글, localStorage 저장, 시스템 테마 감지 |
| `i18n.js` | `I18nManager` 기반 다국어 로드와 적용 |
| `pwa.js` | Service Worker 등록, 설치 프롬프트, 업데이트 안내 |
| `ads-init.js` | Google AdSense 안전 초기화와 중복 실행 방지 |
| `storage-manager.js` | localStorage 추상화, 자동 저장과 복원 처리 |
| `utils.js` | `DOMUtils`, `NumberUtils` 등 공통 유틸리티 |
| `text-analyzer.js` | 글자수, 단어수, 줄 수, 읽기 시간 계산 |
| `advanced-analyzer.js` | 추가 통계와 고급 텍스트 분석 |
| `salary_calculator.js` | 연봉 실수령 계산, 2026년 세율과 보험료율 반영 |
| `insurance_calculator.js` | 4대보험료 계산, 2026년 요율과 사업장 규모 조건 반영 |
| `scientific_calculator.js` | 공학용 계산기 로직 |
| `severancepay.js` | 퇴직금 계산 로직 |
| `spellcheck_simple.js` | 맞춤법 검사 페이지 초기화 |
| `spellcheck_client.js` | 맞춤법 검사 관련 레거시 클라이언트 코드 |
| `typing_practice.js` | 타자 연습 핵심 로직, 사용자 정의 TXT 업로드와 기록 관리 포함 |
| `practice_data.js` | 타자 연습용 기본 문장과 데이터셋 |

## For AI Agents

### Working In This Directory
- **버전 관리 필수**: JS 파일 수정 시 `index.html` 또는 `navigation-manager.js`의 `?N` 버전을 함께 올릴 것
- **전역 초기화 패턴**: 페이지 초기화 함수는 `window.initialize{PageName}()` 형태로 노출됨
- **분리된 모듈 구조 존중**: 최근 리팩터링으로 오류 처리, 토스트, 실행 취소, 모바일 대응, 분석 UI가 별도 파일로 나뉘었으니 책임을 다시 섞지 말 것
- **레거시 보존 주의**: `spellcheck_client.js` 같은 보존 파일은 현재 사용 위치를 확인한 뒤 수정할 것
- 프로덕션 환경에서는 `console.log`, `console.info`, `console.debug`가 noop 처리됨

### Key Calculation Rules
- **연봉 계산** (`salary_calculator.js`)
  - 2026년 기준 국민연금, 건강보험, 장기요양보험, 고용보험 반영
  - 결과는 10원 단위 절사를 기본으로 유지
  - 비과세 월급과 부양가족 수를 함께 고려함
- **4대보험 계산** (`insurance_calculator.js`)
  - 2026년 기준 건강보험 3.595%, 장기요양보험 13.14%, 국민연금 4.5%, 고용보험 0.9% 반영
  - 사업장 규모에 따라 고용안정 부담률이 달라짐
  - 산재보험은 사업주 전액 부담이며 업종별 요율 입력을 받음

### Common Patterns
```js
window.initializeMyPage = function() {
    // 페이지 DOM이 준비된 뒤 호출됨
};

window.myManager = new MyManager();
window.myManager.init();
```

### Testing Requirements
- 계산 로직 변경 시 `node test/salary_calculator_test.js`, `node test/insurance_calculator_test.js` 실행
- 브라우저 검증이 필요한 경우 `html/salary_test_runner.html`, `html/test_runner.html` 확인
- 메인 편집기 상호작용 변경 시 실행 취소, 자동 저장, 토스트, 모바일 입력 흐름을 함께 점검할 것

## Dependencies

### Internal
- `navigation-manager.js`가 페이지별 JS 로드를 담당
- `index.js`는 `error-handler.js`, `toast.js`, `undo-redo.js`, `text-analyzer.js`, `storage-manager.js`, `utils.js`와 함께 동작
- `typing_practice.js`는 `practice_data.js`, `storage-manager.js`, `utils.js`에 의존

### External
- `jQuery 3.7.1`, 일부 레거시 코드에서 `$` 사용
- `Bootstrap 5`, 네비게이션, 드롭다운, 오프캔버스, 툴팁
- `Chart.js`, 타자 연습 통계 시각화
- `Google AdSense SDK`, 광고 초기화
- `Google Translate Element`, 번역 위젯 초기화

<!-- MANUAL: -->
