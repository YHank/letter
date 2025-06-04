# 글자수 세기 및 웹 유틸리티 모음 (Character Counter & Web Utilities)

## 프로젝트 설명 (Project Description)

이 프로젝트는 사용자 편의를 위한 다양한 웹 기반 유틸리티를 제공하는 웹사이트입니다. 주요 기능으로는 글자 수 계산, 맞춤법 검사, 연봉 계산, 퇴직금 계산, 그리고 구글 번역 연동 등이 있습니다. 사용자는 메인 페이지에서 필요한 기능을 선택하여 동적으로 해당 유틸리티를 불러와 사용할 수 있습니다.

(This project is a website that provides various web-based utilities for user convenience. Key features include character counting, spell checking, salary calculation, severance pay calculation, and Google Translate integration. Users can select the desired function on the main page to dynamically load and use the corresponding utility.)

## 주요 기능 (Key Features)

- **글자 수 계산 (Character Count):**
    - 공백 제외 글자 수 계산 (Character count excluding spaces)
    - 공백 포함 글자 수 계산 (Character count including spaces)
    - 단어 수 계산 (Word count)
    - 줄 수 계산 (Line count)
- **맞춤법 검사 (Spell Checker):** (`html/spellcheck.html`, `js/langchkg.js`)
    - 부산대학교 맞춤법 검사기 API를 직접 연동하여 맞춤법 검사 및 교정 제안 기능을 제공합니다. (Directly integrates with the Pusan National University (PNU) spell checker API to provide spell checking and correction suggestions.)
    - 사용자가 입력한 텍스트에 대해 실시간에 가까운 검사를 수행하고, 자체 UI를 통해 결과를 표시합니다. (Performs near real-time checks on user-input text and displays results through a custom UI.)
    - *주의: PNU 맞춤법 검사기 서비스는 개인 및 학생 사용자에 한해 무료로 제공됩니다.* (*Note: The PNU spell checker service is provided free of charge for individual and student users only.*)
- **연봉 계산기 (Salary Calculator):** (`html/salary.html`)
    - 연봉을 기준으로 실수령액을 계산 (Calculates actual take-home pay based on annual salary)
- **퇴직금 계산기 (Severance Pay Calculator):** (`html/severancepay.html`)
    - 퇴직금 예상 금액을 계산 (Calculates estimated severance pay)
- **Google 번역 (Google Translate):** (`html/googletranslation.html`)
    - Google 번역 API를 연동하여 텍스트 번역 기능 제공 (Provides text translation functionality using Google Translate API)

## 사용 방법 및 구조 (How to Use / Structure)

웹사이트 방문 시 `index.html`이 메인 페이지로 로드됩니다. 상단 네비게이션 바를 통해 '글자수/단어수', '맞춤법', '연봉실수령' 등의 기능을 선택할 수 있습니다. 선택된 기능의 내용은 동적으로 메인 콘텐츠 영역에 로드되어 표시됩니다. (`html/` 폴더 내의 해당 HTML 파일이 사용됩니다.)

(Upon visiting the website, `index.html` is loaded as the main page. Users can select functions such as 'Character/Word Count', 'Spell Check', or 'Salary Calculator' via the top navigation bar. The content for the selected function is dynamically loaded into the main content area, using the corresponding HTML files from the `html/` folder.)

## 기술 스택 (Technology Stack)

- HTML5
- CSS3 (`css/index.css`)
- JavaScript (ES6+) (`js/index.js`, `js/langchkg.js` - PNU 맞춤법 검사기 연동 로직 포함)
- Bootstrap 5
- jQuery
- Google Translate API
- PNU (Pusan National University) Spell Checker API

## 개선할 점 (TODO)

- **URL 구조 개선 및 웹 게시 전략 수립 (Improve URL structure and establish web publishing strategy):**
    - 현재 페이지 로딩 방식(`/?page=pagename`)을 보다 사용자 친화적이고 SEO에 유리한 URL 구조로 변경하는 것을 검토합니다. (Consider changing the current page loading method (`/?page=pagename`) to a more user-friendly and SEO-friendly URL structure.)
    - 정적 사이트 호스팅 옵션 (GitHub Pages, Netlify 등)을 활용한 효율적인 게시 및 배포 전략을 수립합니다. (Establish an efficient publishing and deployment strategy using static site hosting options like GitHub Pages, Netlify, etc.)
- **통합 인터넷 검색 기능 추가 (Add integrated internet search feature):**
    - 사용자가 웹사이트 내에서 직접 주요 검색 엔진(Google, Naver, Daum, Bing 등)을 통해 검색할 수 있는 기능을 추가합니다. (Add a feature allowing users to search major search engines (Google, Naver, Daum, Bing, etc.) directly within the website.)
- **Google AdSense 연동 및 광고 최적화 (Integrate Google AdSense and optimize ads):**
    - Google AdSense를 연동하여 광고를 게재하고, 사용자 경험을 해치지 않는 선에서 광고 배치를 최적화합니다. (Integrate Google AdSense to display ads and optimize ad placement without harming the user experience.)
- **신규 유틸리티 기능 아이디어 구상 및 추가 (Brainstorm and add new utility features):**
    - 사용자에게 유용한 새로운 웹 기반 도구 (예: 단위 변환기, 날짜 계산기, 로또 번호 생성기 등) 아이디어를 발굴하고 구현합니다. (Discover and implement ideas for new useful web-based tools (e.g., unit converter, date calculator, lottery number generator, etc.).)
- **타자 연습 기능 개발 검토 (Consider developing a typing practice feature):**
    - 한글 및 영문 타자 연습 기능을 추가하여 사용자의 타자 능력을 향상시킬 수 있도록 지원합니다. (Support users in improving their typing skills by adding Korean and English typing practice features.)
- **최신 웹 기술(Node.js, React 등) 도입 검토 (Consider adopting modern web technologies like Node.js or React):**
    - 프로젝트의 유지보수성, 확장성, 성능 향상을 위해 Node.js, React, Vue.js 등 최신 웹 프레임워크 또는 라이브러리 도입을 장기적으로 검토합니다. (Consider adopting modern web frameworks or libraries such as Node.js, React, Vue.js in the long term to improve project maintainability, scalability, and performance.)
- **GitHub 저장소 관리 및 문서화 개선 (Improve GitHub repository management and documentation):**
    - 커밋 컨벤션, 브랜치 전략 등 체계적인 Git 워크플로우를 도입합니다. (Introduce a systematic Git workflow, including commit conventions and branch strategies.)
    - 코드 주석을 추가하고, 각 기능에 대한 상세 설명을 `README.md` 또는 별도의 문서에 작성하여 유지보수성을 높입니다. (Improve maintainability by adding code comments and writing detailed descriptions for each feature in `README.md` or separate documents.)
- **다국어 지원 기능 확장 (Expand multilingual support - UI and content translation):**
    - 현재 Google 번역 API를 통한 텍스트 번역 외에, 웹사이트 자체의 UI (버튼, 메뉴 등) 및 기본 안내 문구에 대한 다국어 지원을 검토합니다. (In addition to text translation via the Google Translate API, consider multilingual support for the website's UI (buttons, menus, etc.) and basic informational text.)
- **연봉 계산기 기능 고도화 (Enhance salary calculator):**
    - 현재 연봉 계산기에 세금, 4대 보험, 부양가족 수 등 다양한 변수를 추가하여 보다 정확한 실수령액을 계산할 수 있도록 기능을 개선합니다. (Improve the current salary calculator by adding various variables such as taxes, social insurance, and number of dependents to calculate a more accurate take-home pay.)
- **맞춤법 검사기 기능 개선 및 안정화 (Enhance and Stabilize Spell Checker Functionality):**
    - [완료] 부산대학교 맞춤법 검사기 API 연동 및 기본 UI 구현 (Completed: Integrated PNU spell checker API and implemented basic UI.)
    - **TDD(테스트 주도 개발)를 통한 테스트 코드 작성 및 기능 안정화:** `js/langchkg.js`의 맞춤법 검사 로직(API 연동, 결과 파싱, UI 업데이트 등)에 대한 단위 테스트 및 통합 테스트 코드를 작성하여 안정성을 확보합니다. (Write unit and integration test codes for the spell checking logic in `js/langchkg.js` (API integration, result parsing, UI updates, etc.) through TDD to ensure stability.)
    - **사용자 피드백 기반 추가 개선:** 사용자 테스트 및 피드백을 통해 발견되는 오류 수정 및 사용성 개선 사항을 반영합니다. (Reflect error corrections and usability improvements found through user testing and feedback.)
    - **오류 처리 고도화:** 네트워크 오류, API 응답 오류 등 다양한 예외 상황에 대한 사용자 친화적인 오류 메시지 및 처리 로직을 개선합니다. (Improve user-friendly error messages and handling logic for various exceptional situations such as network errors and API response errors.)
- **UI/UX 개선 (Improve UI/UX):**
    - 전체적인 웹사이트 디자인 및 사용자 인터페이스를 개선하여 사용성을 향상시킵니다. (Enhance usability by improving the overall website design and user interface.)
    - 모바일 반응형 디자인을 점검하고 최적화합니다. (Review and optimize the mobile responsive design.)
```
