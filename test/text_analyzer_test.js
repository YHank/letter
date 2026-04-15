/**
 * TextAnalyzer 단위 테스트
 * Node.js 환경에서 실행: node test/text_analyzer_test.js
 */

// Node.js 환경에서 window 및 의존성 모킹
if (typeof window === 'undefined') {
    global.window = {
        i18nManager: null,
        textAnalyzer: null
    };
}

// TextAnalyzer 클래스 로드 (window 참조 제거 버전을 인라인 재정의)
class TextAnalyzer {
    constructor() {
        this.koreanReadingSpeed = 400;
        this.englishReadingSpeed = 225;
        this.japaneseReadingSpeed = 300;
        this.chineseReadingSpeed = 350;
        this.currentLanguage = 'ko';
    }

    countSentences(text) {
        if (!text || text.trim() === '') return 0;
        const sentences = text.match(/[^.!?。！？]+[.!?。！？]+/g) || [];
        return sentences.length;
    }

    countWords(text) {
        if (!text || text.trim() === '') return 0;
        const words = text.trim().split(/\s+/).filter(word => word.length > 0);
        return words.length;
    }

    countCharacters(text, includeSpaces = true) {
        if (!text) return 0;
        if (includeSpaces) return text.length;
        return text.replace(/\s/g, '').length;
    }

    countLines(text) {
        if (!text) return 0;
        const lines = text.split('\n').filter(line => line.trim().length > 0);
        return lines.length;
    }

    countParagraphs(text) {
        if (!text || text.trim() === '') return 0;
        const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
        return paragraphs.length;
    }

    calculateAverageWordLength(text) {
        const words = text.trim().split(/\s+/).filter(word => word.length > 0);
        if (words.length === 0) return 0;
        const totalLength = words.reduce((sum, word) => sum + word.length, 0);
        return parseFloat((totalLength / words.length).toFixed(1));
    }

    detectLanguage(text) {
        if (!text || text.trim() === '') return 'unknown';
        const koreanPattern = /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/;
        const englishPattern = /[a-zA-Z]/;
        const japanesePattern = /[\u3040-\u309F\u30A0-\u30FF]/;
        const chinesePattern = /[\u4E00-\u9FFF]/;
        const hasKorean = koreanPattern.test(text);
        const hasEnglish = englishPattern.test(text);
        const hasJapanese = japanesePattern.test(text);
        const hasChinese = chinesePattern.test(text);
        const languageCount = [hasKorean, hasEnglish, hasJapanese, hasChinese].filter(Boolean).length;
        if (languageCount > 1) return 'mixed';
        if (hasKorean) return 'korean';
        if (hasEnglish) return 'english';
        if (hasJapanese) return 'japanese';
        if (hasChinese) return 'chinese';
        return 'other';
    }

    analyzeText(text) {
        if (!text) {
            return {
                charactersWithSpaces: 0,
                charactersWithoutSpaces: 0,
                words: 0,
                sentences: 0,
                lines: 0,
                paragraphs: 0,
                averageWordLength: 0,
                language: 'unknown'
            };
        }
        return {
            charactersWithSpaces: this.countCharacters(text, true),
            charactersWithoutSpaces: this.countCharacters(text, false),
            words: this.countWords(text),
            sentences: this.countSentences(text),
            lines: this.countLines(text),
            paragraphs: this.countParagraphs(text),
            averageWordLength: this.calculateAverageWordLength(text),
            language: this.detectLanguage(text)
        };
    }
}

// ─────────────────────────────────────────────
// 테스트 프레임워크 (기존 salary_test_runner 패턴 준용)
// ─────────────────────────────────────────────
let passCount = 0;
let failCount = 0;

function assertEquals(actual, expected, message) {
    if (actual === expected) {
        passCount++;
        console.log(`  PASS: ${message}`);
    } else {
        failCount++;
        console.error(`  FAIL: ${message}`);
        console.error(`       기대값: ${JSON.stringify(expected)}, 실제값: ${JSON.stringify(actual)}`);
    }
}

function assertAlmostEquals(actual, expected, tolerance, message) {
    if (Math.abs(actual - expected) <= tolerance) {
        passCount++;
        console.log(`  PASS: ${message}`);
    } else {
        failCount++;
        console.error(`  FAIL: ${message}`);
        console.error(`       기대값: ${expected} (±${tolerance}), 실제값: ${actual}`);
    }
}

function describe(name, fn) {
    console.log(`\n[${name}]`);
    fn();
}

// ─────────────────────────────────────────────
// 테스트 실행
// ─────────────────────────────────────────────
const analyzer = new TextAnalyzer();

describe('countCharacters - 글자수 계산', () => {
    assertEquals(analyzer.countCharacters(''), 0, '빈 문자열 → 0');
    assertEquals(analyzer.countCharacters(null), 0, 'null → 0');
    assertEquals(analyzer.countCharacters('안녕하세요'), 5, '한글 5자 (공백 포함)');
    assertEquals(analyzer.countCharacters('안녕 세계'), 5, '한글+공백 5글자 (공백 포함)');
    assertEquals(analyzer.countCharacters('안녕 세계', false), 4, '한글+공백 → 공백 제외 4자');
    assertEquals(analyzer.countCharacters('hello world'), 11, '영문+공백 11자 (공백 포함)');
    assertEquals(analyzer.countCharacters('hello world', false), 10, '영문+공백 → 공백 제외 10자');
    assertEquals(analyzer.countCharacters('  '), 2, '공백만 2개 (포함 모드)');
    assertEquals(analyzer.countCharacters('  ', false), 0, '공백만 → 공백 제외 0자');
});

describe('countWords - 단어수 계산', () => {
    assertEquals(analyzer.countWords(''), 0, '빈 문자열 → 0');
    assertEquals(analyzer.countWords('   '), 0, '공백만 → 0');
    assertEquals(analyzer.countWords(null), 0, 'null → 0');
    assertEquals(analyzer.countWords('hello'), 1, '단어 1개');
    assertEquals(analyzer.countWords('hello world'), 2, '단어 2개');
    assertEquals(analyzer.countWords('안녕 하세요 반갑습니다'), 3, '한글 단어 3개');
    assertEquals(analyzer.countWords('  hello   world  '), 2, '불규칙 공백 → 2단어');
    assertEquals(analyzer.countWords('hello\nworld'), 2, '줄바꿈으로 구분 → 2단어');
    assertEquals(analyzer.countWords('hello\n\nworld'), 2, '빈줄 포함 → 2단어');
});

describe('countSentences - 문장수 계산', () => {
    assertEquals(analyzer.countSentences(''), 0, '빈 문자열 → 0');
    assertEquals(analyzer.countSentences(null), 0, 'null → 0');
    assertEquals(analyzer.countSentences('안녕하세요.'), 1, '마침표 문장 1개');
    assertEquals(analyzer.countSentences('안녕하세요. 반갑습니다.'), 2, '마침표 문장 2개');
    assertEquals(analyzer.countSentences('Hello! How are you?'), 2, '느낌표+물음표 2문장');
    assertEquals(analyzer.countSentences('안녕！ 잘지내？'), 2, '전각 구두점 2문장');
    assertEquals(analyzer.countSentences('문장이 없는 텍스트'), 0, '구두점 없는 텍스트 → 0');
});

describe('countLines - 라인수 계산 (빈 줄 제외)', () => {
    assertEquals(analyzer.countLines(null), 0, 'null → 0');
    assertEquals(analyzer.countLines('한 줄'), 1, '단일 줄 → 1');
    assertEquals(analyzer.countLines('첫째 줄\n둘째 줄'), 2, '두 줄 → 2');
    assertEquals(analyzer.countLines('첫째 줄\n\n셋째 줄'), 2, '빈 줄 포함 → 빈 줄 제외 2');
    assertEquals(analyzer.countLines('\n\n\n'), 0, '빈 줄만 → 0');
    assertEquals(analyzer.countLines('가\n나\n다'), 3, '세 줄 → 3');
});

describe('countParagraphs - 단락수 계산', () => {
    assertEquals(analyzer.countParagraphs(''), 0, '빈 문자열 → 0');
    assertEquals(analyzer.countParagraphs(null), 0, 'null → 0');
    assertEquals(analyzer.countParagraphs('단락 하나'), 1, '단락 1개');
    assertEquals(analyzer.countParagraphs('단락 하나\n\n단락 둘'), 2, '두 단락 → 2');
    assertEquals(analyzer.countParagraphs('단락 하나\n\n\n단락 둘'), 2, '여러 빈줄 → 2단락');
    assertEquals(analyzer.countParagraphs('\n\n'), 0, '빈 줄만 → 0');
});

describe('detectLanguage - 언어 감지', () => {
    assertEquals(analyzer.detectLanguage(''), 'unknown', '빈 문자열 → unknown');
    assertEquals(analyzer.detectLanguage(null), 'unknown', 'null → unknown');
    assertEquals(analyzer.detectLanguage('안녕하세요'), 'korean', '한글 → korean');
    assertEquals(analyzer.detectLanguage('Hello World'), 'english', '영문 → english');
    assertEquals(analyzer.detectLanguage('こんにちは'), 'japanese', '히라가나 → japanese');
    assertEquals(analyzer.detectLanguage('你好世界'), 'chinese', '중국어 → chinese');
    assertEquals(analyzer.detectLanguage('안녕 Hello'), 'mixed', '한글+영문 → mixed');
    assertEquals(analyzer.detectLanguage('123456'), 'other', '숫자만 → other');
    assertEquals(analyzer.detectLanguage('!@#$%'), 'other', '특수문자만 → other');
});

describe('calculateAverageWordLength - 평균 단어 길이', () => {
    assertEquals(analyzer.calculateAverageWordLength('hi'), 2.0, '단어 1개 길이 2 → 2.0');
    // "hi"=2, "bye"=3 → (2+3)/2 = 2.5
    assertAlmostEquals(analyzer.calculateAverageWordLength('hi bye'), 2.5, 0.05, '"hi bye" → 2.5');
    assertEquals(analyzer.calculateAverageWordLength('hello'), 5.0, '단어 1개 길이 5 → 5.0');
});

describe('analyzeText - 통합 분석', () => {
    const result = analyzer.analyzeText(null);
    assertEquals(result.charactersWithSpaces, 0, 'null 분석 → 글자수 0');
    assertEquals(result.words, 0, 'null 분석 → 단어수 0');
    assertEquals(result.language, 'unknown', 'null 분석 → 언어 unknown');

    const ko = analyzer.analyzeText('안녕하세요. 반갑습니다.');
    assertEquals(ko.language, 'korean', '한글 텍스트 → korean');
    assertEquals(ko.sentences, 2, '마침표 2개 → 2문장');
    assertEquals(ko.charactersWithSpaces, 13, '공백 포함 13글자');
    assertEquals(ko.charactersWithoutSpaces, 12, '공백 제외 12글자');

    const en = analyzer.analyzeText('Hello world. How are you?');
    assertEquals(en.language, 'english', '영문 텍스트 → english');
    assertEquals(en.words, 5, '영문 5단어');
    assertEquals(en.sentences, 2, '영문 2문장');
});

// ─────────────────────────────────────────────
// 결과 출력
// ─────────────────────────────────────────────
console.log(`\n${'='.repeat(50)}`);
console.log(`TextAnalyzer 테스트 결과: ${passCount}개 통과 / ${failCount}개 실패`);
if (failCount === 0) {
    console.log('모든 테스트를 통과했습니다.');
} else {
    console.error(`${failCount}개의 테스트가 실패했습니다.`);
    process.exitCode = 1;
}
