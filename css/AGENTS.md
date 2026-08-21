<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-07 | Updated: 2026-08-21 -->

# css/

## Purpose
전역 CSS 스타일시트 디렉토리. Bootstrap 5 위에 커스텀 테마 변수, 다크모드, 카드형 통계 UI, 오프캔버스 네비게이션, 계산기 페이지 스타일을 덧씌웁니다.

## Key Files

| File | Description |
|------|-------------|
| `index.css` | 전역 스타일, CSS 변수, 다크모드, 반응형 레이아웃, 컴포넌트 오버라이드 (1,267줄) |

주요 섹션은 파일 상단부터 CSS 변수 정의 → 다크 모드 색상 → 다크모드 토글 버튼 → contenteditable 편집기 → Google Translate 위젯 → 광고 컨테이너 → Bootstrap 컴포넌트 오버라이드 → 페이지별 스타일 순으로 배치되어 있으며, `/* ... */` 주석으로 구분됩니다.

## For AI Agents

### Working In This Directory
- 색상은 `:root`와 `.dark`의 CSS 변수로 관리하므로 값을 하드코딩하지 말 것
  - 다크모드는 `js/darkmode.js`가 `document.documentElement`(즉 `<html>`)에 `.dark` 클래스를 붙이는 방식이며, CSS 셀렉터는 `html.dark`가 아니라 `.dark`로 작성되어 있음
- Bootstrap 기본 클래스와 충돌하지 않도록 커스텀 클래스와 선택자 범위를 우선 사용할 것
- 메인 화면, 계산기 카드, 타자 연습, 오프캔버스 메뉴가 모두 이 파일의 영향을 받으므로 변경 범위를 넓게 확인할 것
- CSS는 별도 버전 파라미터를 올리지 않지만, 캐시 영향이 큰 경우 `index.html` 링크를 함께 점검할 것

### Common Patterns
```css
:root {
    --bg-color: #ffffff;
    --text-color: #212529;
    --card-bg: #ffffff;
    --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.dark {
    --bg-color: #1a1a1a;
    --text-color: #e9ecef;
    --card-bg: #212529;
}
```

그라디언트(`--primary-gradient` 등)와 그림자(`--shadow-sm` ~ `--shadow-xl`)도 변수로 정의되어 있으니 새 컴포넌트에서 재사용할 것.

## Dependencies

### Internal
- `js/darkmode.js`, `html` 요소의 `.dark` 클래스를 토글해 다크모드 적용

### External
- `Bootstrap 5.3.2`, 기본 레이아웃과 컴포넌트 스타일의 기반

<!-- MANUAL: -->
