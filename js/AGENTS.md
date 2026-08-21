<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-07 | Updated: 2026-08-21 -->

# js/

## Purpose
애플리케이션의 비즈니스 로직과 UI 상호작용을 담당하는 JavaScript 모듈 모음(24개 파일, 약 7,200줄). 빌드 도구·모듈 번들러 없는 순수 ES6+ 스크립트이며, 전역 스코프에 클래스/객체를 노출하는 방식으로 서로를 참조합니다. `index.js`에서 분리된 책임별 모듈(오류 처리, 토스트, 실행 취소, 모바일, 키보드, 분석 UI)과 페이지별 기능 모듈로 구성됩니다.

## Key Files

### 공통 인프라 (`index.html`에서 항상 로드)

| File | Description |
|------|-------------|
| `utils.js` | `DOMUtils`, `NumberUtils`, `TimeUtils`, `AnimationUtils`, `ValidationUtils` 공통 유틸리티 (318줄) |
| `index.js` | 메인 글자수 세기 진입점. 통계 갱신, 자동 저장, 텍스트 변환, 단축키, `googleTranslateElementInit()` (443줄) |
| `navigation-manager.js` | SPA 라우터. 페이지 로드/캐시, 스크립트 동적 주입, 초기화 함수 디스패치, SEO 메타 갱신 (465줄) |
| `storage-manager.js` | `StorageManager`, localStorage 추상화·자동 저장·복원 (416줄) |
| `text-analyzer.js` | `TextAnalyzer`, 글자수·단어수·줄수·문장수·읽기 시간 계산 (248줄) |
| `advanced-analyzer.js` | `AdvancedTextAnalyzer`, 감정 분석·키워드 추출·가독성 점수·문체 분석. 자모 분해 기반 불규칙 활용(ㅂ·ㅡ) 어간 확장, 부정 표현 극성 반전, 정도부사 가중치, 조사·어미 정규화로 한국어 교착어 특성을 처리 (1059줄) |
| `analysis-ui.js` | 고급 분석 섹션 표시/숨김 토글과 결과 렌더링 UI (218줄, IIFE) |
| `error-handler.js` | `ErrorHandler`, 전역 오류 처리와 사용자 친화적 메시지 (73줄) |
| `toast.js` | `Toast`, 토스트 알림 생성·표시 (68줄) |
| `undo-redo.js` | `UndoRedo`, 메인 편집기 실행 취소/다시 실행 기록 (57줄) |
| `keyboard-handler.js` | `KeyboardAccessibilityHandler`, 키보드 접근성과 단축키 처리 (126줄) |
| `mobile-handler.js` | `MobileTouchHandler`, 모바일 터치 대응과 입력 보조 (107줄) |
| `darkmode.js` | 다크모드 토글, `documentElement`에 `.dark` 클래스 적용, localStorage 저장, 시스템 테마 감지 (40줄) |
| `i18n.js` | `I18nManager`, 4개 언어(`ko`/`en`/`ja`/`zh`) 번역 로드와 `data-i18n` 치환, 언어 드롭다운 렌더링 (378줄) |
| `pwa.js` | `PWAManager`, Service Worker 등록·설치 프롬프트·업데이트 안내 (321줄) |
| `ads-init.js` | Google AdSense 안전 초기화와 중복 실행 방지 (46줄) |

### 페이지별 모듈 (`scriptMap`으로 지연 로드)

| File | Description |
|------|-------------|
| `salary_calculator.js` | 연봉 실수령 계산 + 실수령액→연봉 역산. 2026년 세율·보험료율을 상단 상수로 분리 (471줄) |
| `insurance_calculator.js` | 4대보험료 계산. 2026년 요율과 사업장 규모 조건 반영 (315줄) |
| `scientific_calculator.js` | 공학용 계산기 로직 (429줄) |
| `severancepay.js` | 퇴직금 계산 로직 (69줄) |
| `spellcheck_client.js` | **`SpellCheckClient` 맞춤법 검사 엔진 (현역).** 검사 실행·결과 HTML 포맷팅 담당 (142줄) |
| `spellcheck_simple.js` | 맞춤법 검사 페이지 초기화와 버튼 이벤트 바인딩 (84줄) |
| `typing_practice.js` | 타자 연습 핵심 로직. 5개 모드, 사용자 정의 TXT 업로드, 기록·업적 관리 (1,755줄, 최대 파일) |
| `practice_data.js` | 타자 연습 데이터 **로더**. `data/typing/manifest.json`을 읽어 언어×분류별 JSON을 병합해 `window.practiceTexts`에 채움 (`window.PracticeData.ready()`) |

## For AI Agents

### Working In This Directory
- **버전 관리 필수**: JS 파일 수정 시 `?N` 버전을 올릴 것. 공통 스크립트는 `index.html` 하단, 페이지별 스크립트는 `navigation-manager.js`의 `scriptMap`에 등록되어 있음
- **분리된 모듈 구조 존중**: 오류 처리, 토스트, 실행 취소, 모바일, 키보드, 분석 UI가 별도 파일로 나뉘어 있으니 책임을 다시 섞지 말 것
- **전역 네임스페이스 의존**: 모듈 시스템이 없으므로 `window.X` 노출과 `index.html`의 `<script>` 로드 순서가 곧 의존성 그래프임. 새 모듈 추가 시 로드 순서를 반드시 확인할 것
- 프로덕션 환경에서는 `console.log`, `console.info`, `console.debug`가 noop 처리됨

### 페이지 초기화 디스패치 (중요)
초기화는 이름 규칙이 아니라 `navigation-manager.js`의 `initializePageScript()` 안에 있는 **명시적 맵**으로 호출됩니다. 함수명이 페이지명과 일치하지 않는 경우가 있으니 맵을 직접 확인할 것.

| 페이지 | 호출되는 전역 함수 | 정의 위치 |
|--------|-------------------|-----------|
| `spellcheck_simple` | `initializeSimpleSpellchecker` | `spellcheck_simple.js` |
| `typing_practice` | `initializeTypingPractice` | `typing_practice.js:1751` (내부에서 `initializeTypingPracticeNew()` 위임) |
| `salary` | `initializeSalaryPage` | `salary_calculator.js:278` |
| `insurance_calculator` | `initializeInsuranceCalculator` | `insurance_calculator.js:2` (`window.initializeInsurancePage` 별칭 존재) |
| `scientific_calculator` | `initializeScientificCalculator` | `scientific_calculator.js` |
| `severancepay` | `initializeSeverancePay` | `severancepay.js` |

### 맞춤법 검사기 현재 상태 (주의)
`spellcheck_client.js`는 레거시가 아니라 **현재 맞춤법 검사 페이지가 실제로 사용하는 엔진**입니다. 다만 사전 기반 검사는 비활성 상태입니다.

- `corrections: {}` — 로컬 맞춤법 사전이 2026-04-08에 **의도적으로 비워짐**. 사유는 파일 상단 주석 참고 (`왠지→웬지` 등 표준어/비표준어 반전 오류로 사용자 텍스트를 오염시킴)
- 따라서 현재 동작하는 검사는 **패턴 기반 3종뿐**: 조사 띄어쓰기, 자음/모음 반복, 문장부호 뒤 중복 공백
- `html/spellcheck_simple.html`의 "약 100개 표현 검사" 안내 문구와 실제 동작이 불일치함
- 주석은 "다음 iframe 검사기를 주력으로 사용"이라 하지만 **현재 코드에 iframe은 없음.** 사전을 복원하든 iframe을 붙이든, 손대기 전에 이 이력을 먼저 확인할 것

### Key Calculation Rules
- **연봉 계산** (`salary_calculator.js`)
  - 국민연금 근로자 부담 **4.75%** (총 9.5%). 파일 상단 상수로 분리되어 있음
    - `NATIONAL_PENSION_RATE = 0.0475`
    - `NATIONAL_PENSION_MAX_MONTHLY_INCOME = 6590000` (기준소득월액 상한)
    - `NATIONAL_PENSION_MIN_MONTHLY_INCOME = 410000` (기준소득월액 하한)
    - 주석에 따르면 2025년 연금개혁으로 2026-01-01부터 9%→9.5% 인상, 기준소득월액은 2026-07~2027-06 적용분
  - 건강보험 근로자 3.595% (총 7.19%), 월 보험료 상한 4,591,740원 / 하한 10,080원
  - 장기요양보험 = 건강보험료 × 13.14%
  - 고용보험 0.9% (실업급여, 근로자 부담)
  - 소득세는 근로소득공제 → 과세표준 → 기본세율(6~45%) → 근로소득세액공제 순으로 산출, 부양가족 수 반영
    - 근로소득공제 한도 `INCOME_DEDUCTION_LIMIT = 20000000` (2,000만원) 적용
    - 세액공제 한도는 총급여 3,300만/7,000만/1억 2,000만원 구간으로 나뉘며 최저 20만원
  - 결과는 10원 단위 절사 유지
  - **양방향 계산 지원**
    - 정방향: `calculateNetMonthlyPay(연봉, 비과세월액, 부양가족수)`
    - 역방향: `calculateAnnualSalaryFromNetMonthly(목표실수령월액, 비과세월액, 부양가족수)` — 이분 탐색으로 연봉을 되찾으며, 탐색 상한은 `REVERSE_SEARCH_MAX_ANNUAL_SALARY`(100억원). 결과는 `roundAnnualSalaryToManwon()`으로 만원 단위 정리
  - **입력 단위 주의**: UI 입력값은 원 단위가 아님. `SALARY_INPUT_UNIT`(연봉 = 백만원), `NET_MONTHLY_INPUT_UNIT`(실수령 월급 = 만원)이며, `annualSalaryInputToWon()` / `netMonthlyInputToWon()`으로 변환한 뒤 계산 함수에 넘길 것
- **4대보험 계산** (`insurance_calculator.js`)
  - `INSURANCE_RATES` 상수에 요율 집중: health `0.03595`, longTermCare `0.1314`, pension `0.045`, unemployment `0.009`
  - 고용안정 부담률은 사업장 규모별로 분기: 우선지원 `0.0025`, 일반 `0.0085`
  - 국민연금 기준소득 상한 6,370,000원(`pensionMax`) / 하한 400,000원(`pensionMin`)
  - 산재보험은 사업주 전액 부담, 업종별 요율을 입력받음
  - 계산 로직이 `initializeInsuranceCalculator()` 클로저 안에 캡슐화되어 있어 테스트는 동일 로직을 재현하는 방식임. **요율 변경 시 `test/insurance_calculator_test.js`도 함께 수정할 것**

> ### ⚠ 두 계산기의 국민연금 요율이 서로 다릅니다 (2026-08-21 현재)
>
> | 항목 | `salary_calculator.js` | `insurance_calculator.js` |
> |------|------------------------|---------------------------|
> | 근로자 부담률 | **4.75%** | **4.5%** |
> | 기준소득월액 상한 | **6,590,000원** | **6,370,000원** |
> | 기준소득월액 하한 | **410,000원** | **400,000원** |
>
> 연봉 계산기만 새 요율로 갱신되고 4대보험료 계산기는 이전 값에 남아 있어, 같은 월급을 넣어도 두 페이지의 국민연금 금액이 다르게 나옵니다. 국민연금 관련 코드를 수정할 때는 **`salary_calculator.js` / `insurance_calculator.js` / `test/insurance_calculator_test.js`(재현 로직) 3곳을 함께** 확인할 것.

### Common Patterns
```js
// 페이지 초기화 함수 (navigation-manager.js의 맵에 등록 필요)
function initializeMyPage() {
    const el = DOMUtils.getElement('#my-input');
    if (!el) return;              // DOM 조각이 아직 없을 수 있으므로 항상 가드
    DOMUtils.addEvent(el, 'input', handler);
}

// 클래스형 모듈은 전역 인스턴스로 노출
class MyManager { /* ... */ }
window.myManager = new MyManager();
```

전역 노출 목록: `ErrorHandler`, `Toast`, `UndoRedo`, `SpellCheckClient`, `MobileTouchHandler`, `KeyboardAccessibilityHandler`, `navigationManager`, `storageManager`, `textAnalyzer`, `textHistory`, `advancedAnalyzer`, `analysisUI`, `i18nManager`, `pwaManager`, `keyboardHandler`, `mobileHandler`, `practiceTexts`, `PracticeData`, `initializeAds`

### Testing Requirements
- 계산 로직 변경 시: `node test/salary_calculator_test.js`, `node test/insurance_calculator_test.js`
- 텍스트 분석 변경 시: `node test/text_analyzer_test.js`
- 고급 분석(감정·키워드·가독성·문체) 변경 시: `node test/advanced_analyzer_test.js`
- 라우팅/스크립트 로드 변경 시: `node test/navigation_manager_test.js`
- 스토리지 변경 시: `node test/storage_manager_test.js`
- 브라우저 검증: `html/salary_test_runner.html`, `html/test_runner.html`
- 메인 편집기 상호작용 변경 시 실행 취소, 자동 저장, 토스트, 모바일 입력 흐름을 함께 점검할 것

## Dependencies

### Internal
- `utils.js`가 사실상 모든 모듈의 기반 (`DOMUtils` 미로드 시 전부 실패). `index.html`에서 가장 먼저 로드됨
- `navigation-manager.js`가 페이지별 JS 로드와 초기화 함수 호출을 담당
- `index.js`는 `ErrorHandler`, `Toast`, `textHistory`, `textAnalyzer`, `storageManager`, `analysisUI`, `keyboardHandler`, `mobileHandler`, `navigationManager`, `pwaManager`에 의존
- `spellcheck_simple.js` → `spellcheck_client.js` (`SpellCheckClient.check` / `formatResults`)
- `typing_practice.js` → `practice_data.js`(`PracticeData.ready()` await), `storage-manager.js`, `utils.js`
- `practice_data.js` → `data/typing/manifest.json` + `data/typing/{언어}/{분류}.json` fetch
- `i18n.js` → `i18n/*.json` fetch, `text-analyzer.js`의 `currentLanguage` 동기화

### External
- `Bootstrap 5.3.2`, 네비게이션, 드롭다운, 오프캔버스, 툴팁 (bundle JS 사용)
- `Chart.js 4.4.0`, 타자 연습 통계 시각화
- `Google AdSense SDK`, 광고 초기화
- `Google Translate Element`, 번역 위젯 초기화 (`index.js`의 `googleTranslateElementInit`)

> jQuery 의존성은 제거되었습니다. `js/` 전체에 `$` 사용이 없습니다.

<!-- MANUAL: -->
