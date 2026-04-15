<!-- Generated: 2026-04-07 | Updated: 2026-04-16 -->

# letter (글자수세기)

## Purpose
한국 사용자를 위한 정적 웹 기반 유틸리티 모음 앱. 빌드 도구 없이 순수 HTML/CSS/JS로 구성된 SPA 구조이며, GitHub Pages(`letter.ymyhome.loan`)로 배포됩니다. 글자수 세기를 메인 기능으로 하고, 맞춤법 검사, 연봉/보험료/퇴직금 계산기, 타자 연습, 공학용 계산기 등 한국어 특화 도구를 제공합니다.

## Key Files

| File | Description |
|------|-------------|
| `index.html` | 단일 진입점. Bootstrap 5 기반 레이아웃, SEO 메타태그, 공통 스크립트/CSS 로드 |
| `sw.js` | Service Worker, 정적 자산 오프라인 캐싱 처리 |
| `manifest.json` | PWA 메타데이터, 앱 이름과 아이콘 정보 정의 |
| `robots.txt` | 검색엔진 크롤러 접근 정책 |
| `sitemap.xml` | 검색엔진 색인용 사이트맵 |
| `CNAME` | GitHub Pages 커스텀 도메인 설정 (`letter.ymyhome.loan`) |
| `README.md` | 사용자용 프로젝트 소개 및 기능 개요 |
| `CLAUDE.md` | AI 에이전트 작업 지침 |
| `naver42a8964b0774d538e673f13dc19f47f5.html` | 네이버 사이트 소유 확인 파일 |
| `update.md` | 배포 및 변경 이력 메모 |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `css/` | 전역 스타일시트 (`css/AGENTS.md` 참고) |
| `html/` | SPA에서 동적으로 로드하는 페이지 조각 (`html/AGENTS.md` 참고) |
| `js/` | 핵심 비즈니스 로직과 UI 모듈 (`js/AGENTS.md` 참고) |
| `i18n/` | 다국어 번역 JSON 파일 (`i18n/AGENTS.md` 참고) |
| `img/` | 로고 및 이미지 에셋 (`img/AGENTS.md` 참고) |
| `test/` | Node.js 및 브라우저 테스트 스크립트 (`test/AGENTS.md` 참고) |

## For AI Agents

### Working In This Directory
- **빌드 도구 없음**: 정적 사이트라서 별도 빌드 과정 없이 파일 수정이 바로 반영됨
- **캐시 버스팅 필수**: JS 파일을 수정하면 `index.html` 또는 `js/navigation-manager.js`의 `?버전숫자`를 함께 올릴 것
- **한국어 우선**: UI 문구, 주석, 문서 설명은 한국어를 기본으로 유지할 것
- **보안 헤더 확인**: `index.html`의 CSP를 벗어나는 외부 리소스 추가 시 허용 도메인부터 점검할 것
- **루트 파일 최소화**: 기능 구현은 `js/`, 페이지 마크업은 `html/`에 두고 루트에는 엔트리 파일만 유지할 것

### Deployment
- `git push origin main` 후 GitHub Pages에 자동 반영
- 서비스 주소: `https://letter.ymyhome.loan`

### Testing Requirements
- 연봉 계산기 단위 테스트: `node test/salary_calculator_test.js`
- 보험료 계산기 단위 테스트: `node test/insurance_calculator_test.js`
- 맞춤법 검사기 점검: `node test/langchkg_test.js`
- 브라우저 검증: `html/salary_test_runner.html`, `html/test_runner.html`
- 로컬 실행: `python -m http.server 8000`

### Common Patterns
- SPA 라우팅: URL 파라미터 `?page=pagename`으로 페이지 전환
- 페이지 로드: `NavigationManager`가 `html/{page}.html`을 fetch하고 필요한 JS를 동적 주입
- 페이지 초기화: 각 기능 페이지 로드 후 `initialize{PageName}()` 전역 함수 호출
- 다크모드: CSS 변수와 `localStorage('theme')`, 시스템 테마 감지를 함께 사용

## Dependencies

### External (CDN)
- `Bootstrap 5.3.2`, 레이아웃과 컴포넌트 UI
- `jQuery 3.7.1`, 일부 레거시 DOM 조작과 AJAX
- `Font Awesome 6.4.0`, 아이콘
- `Chart.js 4.4.0`, 타자 연습 통계 차트
- `Google AdSense`, 광고 슬롯 렌더링
- `Google Translate Element`, 번역 위젯
- `Google Fonts`, 웹 폰트

### Internal Architecture
- `NavigationManager` (`js/navigation-manager.js`), 페이지 전환과 스크립트 동적 로드 담당
- `I18nManager` (`js/i18n.js`), 다국어 번역 적용
- `PWAManager` (`js/pwa.js`), Service Worker 등록과 설치 프롬프트 처리
- `DarkMode` (`js/darkmode.js`), 테마 전환
- `ErrorHandler` / `Toast` / `textHistory`, 메인 편집기 오류 처리와 알림, 실행 취소 기록 관리

<!-- MANUAL: 수동으로 추가할 노트는 이 아래에 작성하면 재생성 시 보존됩니다 -->
