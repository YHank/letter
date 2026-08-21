<!-- Generated: 2026-04-07 | Updated: 2026-08-21 -->

# letter (글자수세기)

## Purpose
한국 사용자를 위한 정적 웹 기반 유틸리티 모음 앱. 빌드 도구 없이 순수 HTML/CSS/JS로 구성된 SPA 구조이며, GitHub Pages(`letter.ymyhome.loan`)로 배포됩니다. 글자수 세기를 메인 기능으로 하고, 맞춤법 검사, 연봉/보험료/퇴직금 계산기, 타자 연습, 공학용 계산기 등 한국어 특화 도구를 제공합니다. Service Worker와 manifest를 갖춘 PWA이며, 한국어/영어/일본어/중국어 4개 언어 UI를 지원합니다.

## Key Files

| File | Description |
|------|-------------|
| `index.html` | 단일 진입점. Bootstrap 5 레이아웃, CSP·SEO 메타태그, 공통 스크립트/CSS 로드 (733줄) |
| `sw.js` | Service Worker. `letter-counter-v6` 캐시와 `STATIC_ASSETS` 목록으로 정적 자산 오프라인 캐싱 |
| `manifest.json` | PWA 메타데이터. 앱 이름, 아이콘, 바로가기(shortcuts) 4종 정의 |
| `robots.txt` | 검색엔진 크롤러 접근 정책, 악성 봇 차단 |
| `sitemap.xml` | 검색엔진 색인용 사이트맵 |
| `CNAME` | GitHub Pages 커스텀 도메인 설정 (`letter.ymyhome.loan`) |
| `README.md` | 사용자용 프로젝트 소개. **내용이 오래됨** (2023년 세법, 존재하지 않는 `googletranslation.html` 언급) |
| `CLAUDE.md` | AI 에이전트 작업 지침. **일부 내용이 오래됨** (아래 Known Documentation Drift 참고) |
| `update.md` | 개선 계획 및 변경 이력 메모 (체크리스트 형태) |
| `.eslintrc.json` | ESLint 설정. `es2020`, browser env, `no-unused-vars`/`eqeqeq` warn 수준 |
| `.gitignore` | 무시 규칙. **단, 아래 항목 상당수는 이미 추적 중이라 규칙이 무효** |
| `dummy.txt` | 타자 연습 사용자 정의 TXT 업로드 기능 테스트용 더미 파일 |
| `naver42a8964b0774d538e673f13dc19f47f5.html` | 네이버 사이트 소유 확인 파일 |
| `*.png` (12개) | UI/기능 검증 스크린샷 (`home-*` 2, `salary-*` 5, `typing-*` 5). 코드 의존성 없음 |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `css/` | 전역 스타일시트 (`css/AGENTS.md` 참고) |
| `html/` | SPA에서 동적으로 로드하는 페이지 조각 (`html/AGENTS.md` 참고) |
| `js/` | 핵심 비즈니스 로직과 UI 모듈 (`js/AGENTS.md` 참고) |
| `i18n/` | 다국어 번역 JSON 파일 (`i18n/AGENTS.md` 참고) |
| `img/` | 로고 및 이미지 에셋 (`img/AGENTS.md` 참고) |
| `test/` | Node.js 기반 단위 테스트 스크립트 (`test/AGENTS.md` 참고) |
| `.omc/` | oh-my-claudecode 런타임 상태. **문서화·수정 대상 아님** |

## For AI Agents

### Working In This Directory
- **빌드 도구 없음**: 정적 사이트라서 별도 빌드 과정 없이 파일 수정이 바로 반영됨
- **캐시 버스팅 필수**: JS 파일을 수정하면 버전 숫자(`?N`)를 함께 올릴 것
  - 공통 스크립트는 `index.html` 하단 `<script>` 태그의 `?N`
  - 페이지별 스크립트는 `js/navigation-manager.js`의 `scriptMap` 안에 있는 `?N`
  - **두 곳 중 어디에 등록된 파일인지 확인 후 해당 위치만 올릴 것**
- **한국어 우선**: UI 문구, 주석, 문서 설명은 한국어를 기본으로 유지할 것
- **CSP 확인**: `index.html`의 `Content-Security-Policy`를 벗어나는 외부 리소스 추가 시 허용 도메인부터 갱신할 것 (`frame-src`는 현재 google 계열만 허용)
- **루트 파일 최소화**: 기능 구현은 `js/`, 페이지 마크업은 `html/`에 두고 루트에는 엔트리 파일만 유지할 것

### Git 추적 상태 주의
`.gitignore`에 아래 항목이 적혀 있으나 **이미 git에 추적 중이라 무시 규칙이 적용되지 않습니다**. 즉 이 파일들은 커밋 대상이며 GitHub Pages에도 배포됩니다.

| .gitignore 항목 | 실제 상태 |
|-----------------|-----------|
| `**/AGENTS.md` | 추적 중 (7개 파일 모두 커밋됨) |
| `**/test/**` | 추적 중 (테스트 5개 파일 커밋됨) |
| `html/test_runner.html` | 추적 중 |
| `.eslintrc.json` | 추적 중 |

새 파일을 추가할 때만 위 규칙이 동작하므로, 무시되기를 기대하고 파일을 만들거나 반대로 커밋되기를 기대하고 만들 때 모두 `git status`로 실제 상태를 확인할 것.

### Deployment
- `git push origin main` 후 GitHub Pages에 자동 반영
- 서비스 주소: `https://letter.ymyhome.loan`
- 배포 후 오프라인 캐시가 갱신되지 않으면 `sw.js`의 캐시 버전 3종(`CACHE_NAME`, `STATIC_CACHE_NAME`, `DYNAMIC_CACHE_NAME` — 현재 `v6`)을 함께 올릴 것

### Testing Requirements
Node.js 단위 테스트 (프레임워크·의존성 없음, 전부 `node <파일>`로 실행):

```bash
node test/salary_calculator_test.js
node test/insurance_calculator_test.js
node test/text_analyzer_test.js
node test/navigation_manager_test.js
node test/storage_manager_test.js
```

**테스트 실패는 종료 코드로 전달되지 않고 콘솔 요약으로만 표시됩니다.** 마지막 줄의 `N개 통과 / M개 실패`를 반드시 눈으로 확인할 것. `&&` 체이닝이나 CI 게이트로 성공 여부를 판단하면 실패를 놓칩니다.

브라우저 검증 러너:
- `html/salary_test_runner.html` — 연봉 계산기 전용
- `html/test_runner.html` — `text-analyzer.js` + `storage-manager.js` 공용

로컬 실행: `python -m http.server 8000` 후 `http://localhost:8000`

### Common Patterns
- 클린 URL: 각 메뉴는 `/{경로}/index.html` 독립 정적 페이지 (`/salary/`, `/typing-practice/` 등). SPA 라우팅은 2026-08-21 폐지
- 페이지 생성: `node tools/build-pages.js`가 `index.html` 셸 + `html/{조각}.html`을 합쳐 생성. **생성된 페이지를 직접 수정하지 말 것** — 조각이나 셸을 고치고 재생성
- 구 URL 호환: `index.html` head의 shim이 `?page=xxx`를 새 경로로 리다이렉트
- 페이지 초기화: 각 생성 페이지 하단 인라인 스크립트가 공통 매니저(Toast·ErrorHandler·PWA·i18n·MobileTouchHandler) + 페이지별 `initializeXxx()`를 호출
- 서브페이지 제외 대상: `js/index.js`, `js/navigation-manager.js`, Google 번역 위젯 (모두 홈 전용 DOM/콜백 의존)
- 다크모드: `document.documentElement`에 `.dark` 클래스 토글 + CSS 변수 + `localStorage('theme')` + 시스템 테마 감지

## Dependencies

### External (CDN)
- `Bootstrap 5.3.2` (jsDelivr), 레이아웃과 컴포넌트 UI + `bootstrap.bundle.min.js`
- `Font Awesome 6.4.0` (cdnjs), 아이콘
- `Chart.js 4.4.0` (jsDelivr), 타자 연습 통계 차트
- `Google AdSense` (`ca-pub-1009706165028289`), 광고 슬롯 렌더링
- `Google Translate Element`, 번역 위젯
- `Google Fonts`, 웹 폰트

> **jQuery는 더 이상 사용하지 않습니다.** `index.html`과 `js/` 전체에 jQuery 로드나 `$` 사용이 없으며, DOM 조작은 `js/utils.js`의 `DOMUtils`로 통일되어 있습니다. (CSP와 `preconnect`에는 `ajax.googleapis.com`이 남아 있으나 실제 로드는 없음)

### Internal Architecture
- `NavigationManager` (`js/navigation-manager.js`), 페이지 전환, 페이지/스크립트 캐시, SEO 메타 갱신
- `I18nManager` (`js/i18n.js`), 4개 언어 번역 로드와 `data-i18n` 치환
- `PWAManager` (`js/pwa.js`), Service Worker 등록과 설치 프롬프트 처리
- `darkmode.js`, 테마 전환 (클래스 기반, 전역 객체 없음)
- `ErrorHandler` / `Toast` / `UndoRedo` / `StorageManager` / `TextAnalyzer`, 메인 편집기 공통 인프라

## Known Documentation Drift
아래는 **코드가 아니라 문서/문자열이 오래된 부분**입니다. deepinit은 문서만 갱신하므로 코드 수정은 별도 작업으로 진행할 것.

| 위치 | 내용 |
|------|------|
| `js/insurance_calculator.js:9,16,17` | **국민연금 요율이 연봉 계산기와 어긋남.** `salary_calculator.js`는 4.75% / 상한 659만 / 하한 41만으로 갱신됐으나, 4대보험료 계산기는 4.5% / 637만 / 40만에 남아 있어 같은 월급에 다른 결과를 냅니다. 수정 시 `test/insurance_calculator_test.js`의 재현 로직까지 함께 고쳐야 합니다 |
| `CLAUDE.md:33,65-68` | 맞춤법 검사기를 "다음 iframe / 부산대 API" 기반으로 설명하나 현재는 로컬 클라이언트 검사기임. `js/langchkg.js`(66줄), `test/langchkg_test.js`(46줄)를 언급하나 두 파일 모두 존재하지 않음 |
| `CLAUDE.md:54,76,121` | 페이지 로딩을 "jQuery `.load()`"로 설명하고 의존성에 jQuery 3.7.1을 기재하나, jQuery는 제거되었고 `NavigationManager`의 `fetch`로 대체됨 |
| `CLAUDE.md:34,126` | 연봉 계산기를 2023년 기준, 4대보험료 계산기를 2025년 기준으로 기재 (연봉 계산 상세 항목은 2026년으로 갱신됨) |
| `README.md` | 2023년 세법 기준으로 기재. 맞춤법 검사기를 다음 iframe으로 설명. `html/googletranslation.html` 언급하나 파일 없음 |
| `js/navigation-manager.js:51` | `pageDescriptionMap`의 `insurance_calculator` 설명이 "2025년 기준"으로 남아 있음 (코드는 2026년 요율) |
| `html/spellcheck_simple.html` | "약 100개의 자주 틀리는 표현을 검사"라고 안내하나 `SpellCheckClient.corrections`가 비어 있어 사전 기반 검사는 동작하지 않음 (`js/AGENTS.md` 참고) |

<!-- MANUAL: 수동으로 추가할 노트는 이 아래에 작성하면 재생성 시 보존됩니다 -->
