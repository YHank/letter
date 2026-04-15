<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-07 | Updated: 2026-04-16 -->

# css/

## Purpose
전역 CSS 스타일시트 디렉토리. Bootstrap 5 위에 커스텀 테마 변수, 다크모드, 카드형 통계 UI, 오프캔버스 네비게이션, 계산기 페이지 스타일을 덧씌웁니다.

## Key Files

| File | Description |
|------|-------------|
| `index.css` | 전역 스타일, CSS 변수, 다크모드, 반응형 레이아웃, 컴포넌트 오버라이드 |

## For AI Agents

### Working In This Directory
- 색상은 `:root`와 `html.dark`의 CSS 변수로 관리하므로 값을 하드코딩하지 말 것
- Bootstrap 기본 클래스와 충돌하지 않도록 커스텀 클래스와 선택자 범위를 우선 사용할 것
- 메인 화면, 계산기 카드, 타자 연습, 오프캔버스 메뉴가 모두 이 파일의 영향을 받으므로 변경 범위를 넓게 확인할 것
- CSS는 별도 버전 파라미터를 올리지 않지만, 캐시 영향이 큰 경우 `index.html` 링크를 함께 점검할 것

### Common Patterns
```css
:root {
    --primary-color: #0d6efd;
    --bg-color: #ffffff;
}

html.dark {
    --primary-color: #6ea8fe;
    --bg-color: #121212;
}
```

## Dependencies

### Internal
- `js/darkmode.js`, `html` 요소의 `.dark` 클래스를 토글해 다크모드 적용

### External
- `Bootstrap 5.3.2`, 기본 레이아웃과 컴포넌트 스타일의 기반

<!-- MANUAL: -->
