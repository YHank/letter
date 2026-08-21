# 글자수 세기 및 웹 유틸리티 모음 (Character Counter & Web Utilities)

## 프로젝트 설명 (Project Description)

이 프로젝트는 사용자 편의를 위한 다양한 웹 기반 유틸리티를 제공하는 웹사이트입니다. 주요 기능으로는 글자 수 계산, 맞춤법 검사, 연봉 계산, 퇴직금 계산, 타자 연습, 그리고 구글 번역 연동 등이 있습니다. 사용자는 메인 페이지에서 필요한 기능을 선택하여 동적으로 해당 유틸리티를 불러와 사용할 수 있습니다.

(This project is a website that provides various web-based utilities for user convenience. Key features include character counting, spell checking, salary calculation, severance pay calculation, typing practice, and Google Translate integration. Users can select the desired function on the main page to dynamically load and use the corresponding utility.)

## 주요 기능 (Key Features)

### 1. **글자 수 계산 (Character Count)**
- 공백 제외 글자 수 계산 (Character count excluding spaces)
- 공백 포함 글자 수 계산 (Character count including spaces)
- 단어 수 계산 (Word count)
- 줄 수 계산 (Line count)
- 문장 수, 평균 단어 길이, 예상 읽기 시간, 단락 수 분석
- 텍스트 변환 기능 (대소문자 변환, 공백 제거)

### 2. **맞춤법 검사 (Spell Checker)** (`html/spellcheck_simple.html`)
- 다음 맞춤법 검사기를 iframe으로 통합
- 간편한 한국어 맞춤법 검사 및 교정

### 3. **연봉 계산기 (Salary Calculator)** (`html/salary.html`)
- 2023년 한국 세법 기준 연봉 실수령액 계산
- 4대 보험료 자동 계산 (국민연금, 건강보험, 고용보험, 장기요양보험)
- 부양가족 수에 따른 세금 공제 반영
- 월별/연간 실수령액 상세 분석

### 4. **퇴직금 계산기 (Severance Pay Calculator)** (`html/severancepay.html`)
- 근속연수와 평균임금 기반 퇴직금 계산
- 법정 퇴직금 및 예상 세후 퇴직금 제공

### 5. **타자 연습 (Typing Practice)** (`html/typing_practice.html`)
- **4가지 연습 모드**:
  - 자유 타자: 원하는 텍스트로 연습
  - 초보자: 홈 포지션, 자음/모음, 단어 연습 (키보드 시각화 포함)
  - 특수 타자: 숫자, 특수문자, 혼합, 천지인 연습
  - 표준 타자: 난이도별 단어/문장/문단 연습
- **실시간 통계**: 타수(WPM), 정확도, 경과 시간, 진행률
- **5분 타이머**: 남은 시간 표시 (1분 미만 시 빨간색 경고)
- **개인 기록 관리**: 최고 타수, 평균 타수 저장
- **100개 이상의 연습 문장**: 각 모드별 다양한 연습 콘텐츠

### 6. **Google 번역 (Google Translate)** (`html/googletranslation.html`)
- Google 번역 위젯 통합
- 다국어 번역 지원

### 7. **다크모드 지원 (Dark Mode)**
- 시스템 테마 자동 감지
- 수동 토글 가능 (달/해 아이콘)
- 모든 페이지에서 일관된 다크모드 지원

## 사용 방법 (How to Use)

1. 웹사이트 방문: `https://letter.ymyhome.loan`
2. 상단 네비게이션 바에서 원하는 기능 선택
3. 선택한 기능이 동적으로 로드되어 즉시 사용 가능

## 기술 스택 (Technology Stack)

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Framework/Library**: Bootstrap 5.3.2, jQuery 3.7.1
- **External APIs**: 
  - Google Translate API
  - 다음 맞춤법 검사기
- **Hosting**: GitHub Pages
- **Domain**: letter.ymyhome.loan (CNAME 설정)

## 프로젝트 구조 (Project Structure)

```
letter/
├── index.html              # 메인 페이지
├── CLAUDE.md              # Claude AI 개발 가이드
├── css/
│   └── index.css          # 메인 스타일시트 (다크모드 포함)
├── js/
│   ├── index.js           # 메인 스크립트 (글자수 계산)
│   ├── darkmode.js        # 다크모드 토글
│   ├── typing_practice.js # 타자 연습 시스템
│   ├── practice_data.js   # 타자 연습 데이터 로더 (data/typing/*.json)
│   ├── salary_calculator.js # 연봉 계산 로직
│   └── ...                # 기타 기능별 스크립트
├── data/
│   └── typing/
│       ├── manifest.json      # 언어/분류별 데이터 파일 목록
│       ├── korean/            # 한글 연습 데이터 (분류별 JSON)
│       └── english/           # 영어 연습 데이터 (분류별 JSON)
├── html/
│   ├── typing_practice.html    # 타자 연습
│   ├── salary.html            # 연봉 계산기
│   ├── severancepay.html      # 퇴직금 계산기
│   ├── spellcheck_simple.html # 맞춤법 검사
│   └── ...                    # 기타 페이지
├── test/
│   ├── langchkg_test.js       # 맞춤법 검사 테스트
│   └── salary_test_runner.html # 연봉 계산기 테스트
└── img/
    └── logo.webp              # 로고 이미지
```

## 개발 환경 설정 (Development Setup)

```bash
# 저장소 클론
git clone https://github.com/[username]/letter.git
cd letter

# 로컬 서버 실행 (Python)
python -m http.server 8000

# 또는 VS Code Live Server 확장 사용
```

## 테스트 (Testing)

- **연봉 계산기 테스트**: 브라우저에서 `html/salary_test_runner.html` 열기
- **맞춤법 검사 테스트**: `node test/langchkg_test.js` 실행

## 향후 계획 (Future Plans)

- [ ] PWA(Progressive Web App) 지원 추가
- [ ] 오프라인 모드 지원
- [ ] 타자 연습 통계 시각화 (차트)
- [ ] 더 많은 언어 지원
- [ ] 단위 변환기 추가
- [ ] 날짜/시간 계산기 추가
- [ ] API 서버 구축 (Node.js/Express)

## 기여하기 (Contributing)

프로젝트 개선에 기여하고 싶으시다면:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 라이선스 (License)

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 문의사항 (Contact)

프로젝트에 대한 문의사항이나 버그 리포트는 [Issues](https://github.com/[username]/letter/issues) 페이지를 이용해주세요.

---

**Live Demo**: [https://letter.ymyhome.loan](https://letter.ymyhome.loan)