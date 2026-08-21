<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-07 | Updated: 2026-08-21 -->

# i18n/

## Purpose
다국어 번역 JSON 파일 모음. `I18nManager` (`js/i18n.js`)가 런타임에 이 파일들을 fetch해 `data-i18n` 속성을 가진 요소의 텍스트를 교체합니다. 지원 언어는 한국어, 영어, 일본어, 중국어 간체이며, 4개 파일 모두 현재 **114개 키**로 동일하게 유지되고 있습니다.

## Key Files

| File | Description |
|------|-------------|
| `ko.json` | 한국어 번역, 기본 언어(`defaultLanguage`)이자 기준 키 목록 |
| `en.json` | 영어 번역 |
| `ja.json` | 일본어 번역 |
| `zh.json` | 중국어 간체 번역 |

## For AI Agents

### Working In This Directory
- 새 번역 키를 추가할 때는 4개 언어 파일에 동시에 반영할 것
- 키 누락 시 기본 언어로 폴백되므로, 누락이 생기지 않도록 `ko.json`을 기준으로 비교할 것
- `I18nManager`는 초기화 시 `supportedLanguages` 4개 파일을 **모두 한 번에 프리로드**함. 파일 하나가 404면 해당 언어만 `ko` 번역으로 대체됨
- 선택 언어는 `StorageManager`의 사용자 설정(`preferences.language`)에 저장되며, 언어 변경 시 `window.textAnalyzer.currentLanguage`도 함께 동기화됨
- JSON 문법 오류가 나면 전체 번역 로드가 실패할 수 있으니 저장 전 구조를 확인할 것
- 네비게이션, 계산기, 타자 연습 같은 신규 UI 추가 시 번역 키 동기화를 먼저 고려할 것

### Common Patterns
```json
{
  "nav.home": "홈",
  "nav.salary": "연봉실수령",
  "counter.chars": "글자수"
}
```

## Dependencies

### Internal
- `js/i18n.js`, 번역 파일 로드와 `data-i18n` 요소 치환 담당

<!-- MANUAL: -->
