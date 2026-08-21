/**
 * AdvancedTextAnalyzer 단위 테스트
 * Node.js 환경에서 실행: node test/advanced_analyzer_test.js
 *
 * 한국어 특성(교착어)에 맞춘 감정/키워드/가독성/문체 분석 회귀 테스트.
 * 기존 영어 기준 로직이 만들던 오탐을 재발 방지하는 것이 목적이다.
 */

// Node.js 환경에서 window 모킹 후 원본 로드
if (typeof window === 'undefined') {
    global.window = {};
}

require('../js/advanced-analyzer.js');
const analyzer = global.window.advancedAnalyzer;

// ─────────────────────────────────────────────
// 커스텀 assertion
// ─────────────────────────────────────────────
let passCount = 0;
let failCount = 0;
let currentSuite = '';

function test(name, fn) {
    currentSuite = name;
    console.log(`\n[${name}]`);
    try {
        fn();
    } catch (error) {
        failCount++;
        console.error(`  ✗ 예외 발생: ${error.message}`);
    }
}

function assertEquals(actual, expected, message) {
    if (actual === expected) {
        passCount++;
        console.log(`  ✓ ${message}`);
    } else {
        failCount++;
        console.error(`  ✗ ${message} (기댓값: ${expected}, 실제: ${actual})`);
    }
}

function assert(condition, message, detail) {
    if (condition) {
        passCount++;
        console.log(`  ✓ ${message}`);
    } else {
        failCount++;
        console.error(`  ✗ ${message}${detail !== undefined ? ` (실제: ${detail})` : ''}`);
    }
}

function assertRange(actual, min, max, message) {
    assert(actual >= min && actual <= max, message, actual);
}

// ─────────────────────────────────────────────
// 샘플 텍스트
// ─────────────────────────────────────────────
const SAMPLES = {
    fairyTale: '올빼미가 나무에 앉아 있습니다. 밤에는 소음을 내지 않습니다. 사냥꾼이 아닙니다. 깃털의 구조가 특별합니다.',
    academic: '본 연구는 확률적 경사하강법의 수렴 특성을 비볼록 최적화 환경에서 이론적으로 규명하고, 리프시츠 연속성 가정 하에서의 일반화 오차 상한을 유도하였으며, 이를 통해 과매개변수화된 심층신경망의 암묵적 정규화 현상에 대한 해석학적 근거를 제시하고자 하였다.',
    veryPositive: '정말 행복하고 기쁩니다. 최고입니다. 감사합니다. 훌륭한 성공입니다.',
    veryNegative: '너무 슬프고 화가 납니다. 최악입니다. 끔찍한 실패입니다. 정말 실망스럽습니다.',
    neutralKo: '이 문서는 구조가 있습니다. 소음을 줄이는 방법이 아닙니다. 자료를 정리한 것입니다.',
    neutralEn: 'The cat sat on the mat. It ran fast across the room.',
    passive: '문제가 해결되었습니다. 결과가 발표됩니다. 자료가 수집되었다. 의견이 받아들여졌다.',
    keywordDup: '구조가 중요합니다. 구조를 분석했습니다. 소음이 있습니다. 소음을 줄였습니다. 소음의 원인입니다.'
};

// ─────────────────────────────────────────────
// 감정 분석
// ─────────────────────────────────────────────
test('감정 분석 - 오탐 방지', () => {
    // 기존 버그: 양방향 includes 매칭으로 중립 영어 문장이 "부정적 93%"로 판정됨
    const en = analyzer.analyzeSentiment(SAMPLES.neutralEn);
    assertEquals(en.sentiment, 'neutral', '중립 영어 문장은 중성적으로 판정');
    assertEquals(en.details.positive, 0, '중립 영어 문장에서 긍정어 0개');
    assertEquals(en.details.negative, 0, '중립 영어 문장에서 부정어 0개');
    assertEquals(en.confidence, 0, '감정어가 없으면 신뢰도 0');

    // 기존 버그: 조사 '이'가 감정어 8개에 매칭됨
    const ko = analyzer.analyzeSentiment(SAMPLES.neutralKo);
    assertEquals(ko.sentiment, 'neutral', '중립 한국어 문장은 중성적으로 판정');
    assertEquals(ko.details.positive + ko.details.negative, 0, '조사/어미가 감정어로 오탐되지 않음');
});

test('감정 분석 - 활용형 인식', () => {
    const pos = analyzer.analyzeSentiment(SAMPLES.veryPositive);
    assertEquals(pos.sentiment, 'positive', '긍정 텍스트는 긍정적으로 판정');
    assert(pos.details.positive >= 4, '행복하고/기쁩니다/최고입니다/감사합니다/훌륭한 인식', pos.details.positive);
    assertEquals(pos.details.negative, 0, '긍정 텍스트에 부정어 오탐 없음');

    const neg = analyzer.analyzeSentiment(SAMPLES.veryNegative);
    assertEquals(neg.sentiment, 'negative', '부정 텍스트는 부정적으로 판정');
    // 기존 버그: '슬프고', '끔찍한' 같은 활용형을 놓쳐 3개만 잡힘
    assert(neg.details.negative >= 4, '슬프고/최악입니다/끔찍한/실망스럽습니다 인식', neg.details.negative);
    assertEquals(neg.details.positive, 0, '부정 텍스트에 긍정어 오탐 없음');

    assert(pos.confidence > 0.5, '감정이 뚜렷하면 신뢰도가 높음', pos.confidence);
});

test('감정 분석 - 근거가 부족하면 단정하지 않음', () => {
    // 설명문에 감정어 하나('특별한')만 있는 경우, 방향을 단정하면 오해를 부른다
    const weak = analyzer.analyzeSentiment('올빼미의 날개는 특별한 구조가 있습니다. 공기의 흐름을 잘게 쪼갭니다.');
    assertEquals(weak.details.positive, 1, "'특별한'을 긍정어로 인식");
    assertEquals(weak.sentiment, 'neutral', '감정어가 1개면 중성적으로 유지');
    assert(weak.confidence < 0.35, '감정어가 1개면 신뢰도가 낮음', weak.confidence);

    const formatted = analyzer.formatSentimentResult(weak);
    assert(formatted.description.includes('판단하기 어렵'), '근거 부족을 설명에 명시', formatted.description);

    // 감정어가 충분하면 정상적으로 방향을 판정한다
    const strong = analyzer.analyzeSentiment('행복하고 즐겁고 훌륭한 하루였습니다.');
    assertEquals(strong.sentiment, 'positive', '감정어가 3개면 긍정으로 판정');

    // 표본 부족과 감정 혼재는 다른 상황이므로 설명을 구분한다
    const mixed = analyzer.formatSentimentResult(
        analyzer.analyzeSentiment('음식은 훌륭했지만 서비스는 최악이었습니다. 분위기는 좋았습니다.')
    );
    assert(mixed.description.includes('섞여'), '감정 혼재는 혼재로 설명', mixed.description);
    assert(!mixed.description.includes('적어'), '감정어가 충분하면 표본 부족으로 설명하지 않음', mixed.description);
});

test('감정 분석 - 불규칙 활용 인식', () => {
    // ㅂ불규칙: 즐겁다 → 즐거운/즐거웠, 어렵다 → 어려워, 외롭다 → 외로운
    const irregularB = [
        ['즐거운 하루였습니다', 'positive'],
        ['정말 즐거웠어요', 'positive'],
        ['너무 어려워서 포기했다', 'negative'],
        ['외로운 밤이었다', 'negative'],
        ['괴로운 시간이었다', 'negative'],
        ['반가운 소식입니다', 'positive'],
        ['자랑스러운 결과입니다', 'positive'],
        ['부끄러웠습니다', 'negative'],
        ['마음이 아름다워 보인다', 'positive']
    ];
    // ㅡ불규칙: 기쁘다 → 기뻐/기뻤, 슬프다 → 슬퍼, 나쁘다 → 나빠
    const irregularEu = [
        ['기뻐서 눈물이 났다', 'positive'],
        ['너무 슬퍼서 울었다', 'negative'],
        ['기분이 나빠졌다', 'negative']
    ];

    [...irregularB, ...irregularEu].forEach(([text, expected]) => {
        const r = analyzer.analyzeSentiment(text);
        const hit = expected === 'positive' ? r.details.positive : r.details.negative;
        assert(hit > 0, `"${text}" → ${expected === 'positive' ? '긍정어' : '부정어'} 인식`, `+${r.details.positive} -${r.details.negative}`);
    });
});

test('감정 분석 - ㅂ불규칙 어간 충돌 방지', () => {
    // '놀랍다'의 ㅂ을 그냥 떼면 '놀라'가 되어 중립어 '놀라다'까지 긍정으로 잡힌다
    const startled = analyzer.analyzeSentiment('갑자기 큰 소리에 놀라서 뒤를 돌아보았다.');
    assertEquals(startled.details.positive, 0, "'놀라서'(놀라다)를 긍정어로 오탐하지 않음");

    const amazing = analyzer.analyzeSentiment('정말 놀라운 성과였습니다.');
    assert(amazing.details.positive > 0, "'놀라운'(놀랍다)은 긍정어로 인식", amazing.details.positive);

    // '평화롭다'의 어간을 그냥 떼면 '평화로'가 되어 '평화로'(평화+조사)와 충돌한다
    const peace = analyzer.analyzeSentiment('평화로운 마을입니다.');
    assert(peace.details.positive > 0, "'평화로운'은 긍정어로 인식", peace.details.positive);
});

test('감정 분석 - 한국어 부정 표현 반전', () => {
    const cases = [
        ['좋지 않습니다', 0, 1, '후행 부정 보조용언(-지 않다)'],
        ['나쁘지 않습니다', 1, 0, '이중 부정으로 긍정 전환'],
        ['행복하지 않다', 0, 1, "'행복하지 않다'"],
        ['문제가 없습니다', 1, 0, "'없다'에 의한 부정"],
        ['안 좋은 결과입니다', 0, 1, "선행 부사 '안'"],
        ['좋지않다', 0, 1, '같은 어절 내 결합형']
    ];
    cases.forEach(([text, expPos, expNeg, label]) => {
        const r = analyzer.analyzeSentiment(text);
        assertEquals(r.details.positive, expPos, `${label}: 긍정어 ${expPos}개`);
        assertEquals(r.details.negative, expNeg, `${label}: 부정어 ${expNeg}개`);
    });
});

test('감정 분석 - 영어 부정 표현 반전', () => {
    const notGood = analyzer.analyzeSentiment('This is not good at all.');
    assertEquals(notGood.details.negative, 1, "'not good' → 부정어로 집계");
    assertEquals(notGood.details.positive, 0, "'not good'을 긍정으로 세지 않음");

    const neverFails = analyzer.analyzeSentiment('It never fails.');
    assertEquals(neverFails.details.positive, 1, "'never fails' → 긍정어로 집계");
});

test('감정 분석 - 부정어는 문장 경계를 넘지 않음', () => {
    // 앞 문장의 부정이 다음 문장 첫 단어에 영향을 주면 안 된다
    const r = analyzer.analyzeSentiment('결과가 좋지 않다. 훌륭한 대안을 찾았다.');
    assertEquals(r.details.negative, 1, "'좋지 않다'만 부정으로 집계");
    assertEquals(r.details.positive, 1, "다음 문장의 '훌륭한'은 긍정 유지");
});

test('감정 분석 - 어절당 하나의 극성만 집계', () => {
    // 긍정/부정 사전에 동시에 걸리는 어절은 더 긴 어간 쪽으로 확정한다
    const r = analyzer.analyzeSentiment('최악의 상황이었다.');
    assertEquals(r.details.positive + r.details.negative, 1, "'최악의'는 한 번만 집계");
    assertEquals(r.details.negative, 1, "'최악'은 부정으로 확정");
});

test('감정 분석 - 정도부사 가중치', () => {
    // 부사가 없으면 강도는 중립값 0.5이고 기존 판정이 그대로 유지된다
    const plain = analyzer.analyzeSentiment('훌륭한 결과이고 만족스럽습니다.');
    assertEquals(plain.intensity, 0.5, '정도부사가 없으면 강도 0.5');

    const strong = analyzer.analyzeSentiment('매우 훌륭하고 정말 만족스럽습니다.');
    assertEquals(strong.intensity, 1, '강조 부사만 있으면 강도 1');
    assertEquals(strong.sentiment, 'positive', '강조된 긍정은 긍정으로 판정');

    const weak = analyzer.analyzeSentiment('조금 좋고 약간 만족스럽습니다.');
    assertEquals(weak.intensity, 0, '완화 부사만 있으면 강도 0');
    assertEquals(weak.sentiment, 'positive', '완화되어도 방향은 긍정');

    // 개수는 정수로 유지되어야 한다 (UI 계약)
    assert(Number.isInteger(strong.details.positive), 'details.positive는 정수', strong.details.positive);
    assert(Number.isInteger(weak.details.negative), 'details.negative는 정수', weak.details.negative);
});

test('감정 분석 - 정도부사는 감정어로 세지 않음', () => {
    // '굉장하다'/'대단하다'가 사전에 있어 부사 '굉장히'/'대단히'가 긍정어로 잡히면 안 된다
    const r = analyzer.analyzeSentiment('굉장히 불편했습니다. 대단히 실망스럽습니다.');
    assertEquals(r.details.positive, 0, "'굉장히'/'대단히'를 긍정어로 세지 않음");
    assertEquals(r.details.negative, 2, '부정어 2개만 집계');
    assertEquals(r.score, -1, '전부 부정이므로 점수 -1');

    // 감정어로서의 '굉장한'/'대단한'은 그대로 인식된다
    const praise = analyzer.analyzeSentiment('굉장한 성과이고 대단한 발전입니다.');
    assertEquals(praise.details.positive, 2, "'굉장한'/'대단한'은 긍정어로 인식");
});

test('감정 분석 - 강조 부사가 설명 강도에 반영', () => {
    // 감정어가 2개면 신뢰도가 67%라 원래는 '약간'이지만, 강조 부사가 있으면 '매우'로 인정한다
    const emphasized = analyzer.formatSentimentResult(analyzer.analyzeSentiment('매우 훌륭하고 정말 만족스럽습니다.'));
    assert(emphasized.description.includes('매우'), '강조된 긍정은 "매우"로 설명', emphasized.description);

    // 같은 문장에서 부사만 빼면 기존대로 '약간'을 유지한다
    const plain = analyzer.formatSentimentResult(analyzer.analyzeSentiment('훌륭하고 만족스럽습니다.'));
    assert(plain.description.includes('약간'), '부사 없는 경우 기존 판정 유지', plain.description);
});

test('감정 분석 - 정도부사가 혼재 판정을 가른다', () => {
    // 개수만 세면 2:1이라 편향이 약해 중성이 되지만, 강도를 반영하면 긍정이 뚜렷해진다
    const text = '매우 훌륭하고 정말 감사하지만 조금 실망했습니다.';
    const r = analyzer.analyzeSentiment(text);

    assertEquals(r.details.positive, 2, '긍정어 2개');
    assertEquals(r.details.negative, 1, '부정어 1개');
    assertEquals(r.sentiment, 'positive', '강조된 긍정 2 vs 완화된 부정 1 → 긍정');
    assert(r.score > 0.6, '가중 점수가 0.6 초과', r.score);
});

test('감정 분석 - 정도부사 설명 반영', () => {
    // 완화 부사가 있으면 '매우'로 단정하지 않는다
    const weak = analyzer.formatSentimentResult(analyzer.analyzeSentiment('조금 좋고 약간 만족스럽습니다.'));
    assert(weak.description.includes('약간'), '완화된 긍정은 "약간"으로 설명', weak.description);

    // 부사가 없던 기존 동작은 그대로 유지된다
    const plain = analyzer.formatSentimentResult(analyzer.analyzeSentiment('훌륭하고 행복하고 감사한 하루였습니다.'));
    assert(plain.description.includes('매우'), '부사 없는 강한 긍정은 "매우" 유지', plain.description);
});

test('감정 분석 - 정도부사와 부정 표현의 결합', () => {
    // 가중치는 부정 반전이 끝난 극성에 적용된다
    const negated = analyzer.analyzeSentiment('정말 좋지 않습니다.');
    assertEquals(negated.details.negative, 1, "'정말 좋지 않습니다' → 부정어 1개");
    assertEquals(negated.intensity, 1, '강조 부사가 부정 쪽에 반영');

    // '안' 앞에 놓인 부사도 2어절 안에 있으므로 인식된다
    const adverbBeforeNegator = analyzer.analyzeSentiment('정말 안 좋습니다.');
    assertEquals(adverbBeforeNegator.details.negative, 1, "'정말 안 좋습니다' → 부정어 1개");

    // '별로'는 정도부사가 아니라 부정 감정어로 남는다
    const byeolo = analyzer.analyzeSentiment('별로 좋지 않아요.');
    assertEquals(byeolo.details.negative, 2, "'별로'(부정어) + '좋지 않아요'(반전) → 부정어 2개");
    assertEquals(byeolo.details.positive, 0, '긍정어 없음');
});

test('감정 분석 - 영어 정도부사', () => {
    const strong = analyzer.analyzeSentiment('This is very good and really wonderful.');
    assertEquals(strong.intensity, 1, '영어 강조 부사 인식');

    const weak = analyzer.analyzeSentiment('This is slightly good and somewhat useful.');
    assertEquals(weak.intensity, 0, '영어 완화 부사 인식');
});

test('키워드 추출 - 정도부사는 키워드가 아님', () => {
    const words = analyzer.extractKeywords(
        '굉장히 중요한 발표입니다. 엄청 중요한 자리이고 상당히 긴장됩니다. 살짝 걱정되고 다소 비교적 무척 부담됩니다.'
    ).map(k => k.word);
    ['굉장히', '엄청', '상당히', '살짝', '다소', '비교적', '무척'].forEach(adverb => {
        assert(!words.includes(adverb), `정도부사 '${adverb}'는 키워드에서 제외`, words.join(','));
    });
    assert(words.includes('중요'), "'중요'는 키워드로 유지", words.join(','));
});

// ─────────────────────────────────────────────
// 키워드 추출
// ─────────────────────────────────────────────
test('키워드 추출 - 조사/어미 정규화', () => {
    const keywords = analyzer.extractKeywords(SAMPLES.keywordDup);
    const map = Object.fromEntries(keywords.map(k => [k.word, k.frequency]));

    // 기존 버그: '구조가'와 '구조를'이 별개 키워드로 집계됨
    assertEquals(map['구조'], 2, "'구조가'+'구조를' → 구조(2)로 병합");
    assertEquals(map['소음'], 3, "'소음이'+'소음을'+'소음의' → 소음(3)으로 병합");
    assert(!('구조가' in map), "조사가 붙은 '구조가'는 키워드에 없음");

    // 기존 버그: 불용어 필터가 3글자 이상만 통과시켜 어미가 키워드로 올라옴
    const words = keywords.map(k => k.word);
    assert(!words.includes('있습니다'), "'있습니다'는 키워드에서 제외");
    assert(!words.includes('중요합니다'), "'중요합니다'는 어간으로 정규화되어 원형이 남지 않음");
    assert(words.includes('중요'), "'중요합니다'의 어근 '중요'는 키워드로 남음", words.join(','));

    // 어미 목록에 없는 결합형 서술어도 키워드에서 빠져야 한다
    const predicate = analyzer.extractKeywords('정말 기쁩니다. 화가 납니다. 분석 결과가 중요합니다.').map(k => k.word);
    assert(!predicate.includes('기쁩니다'), "'기쁩니다'는 키워드에서 제외", predicate.join(','));
    assert(!predicate.includes('납니다'), "'납니다'는 키워드에서 제외", predicate.join(','));
    assert(predicate.includes('결과'), "명사 '결과'는 키워드로 유지", predicate.join(','));
});

test('키워드 추출 - 관형형 정규화', () => {
    const words = analyzer.extractKeywords('훌륭한 성과입니다. 훌륭한 발표였습니다. 오염된 물을 정화합니다.').map(k => k.word);
    assert(words.includes('훌륭'), "'훌륭한' → '훌륭'으로 정규화", words.join(','));
    assert(words.includes('오염'), "'오염된' → '오염'으로 정규화", words.join(','));
    assert(!words.includes('훌륭한'), "관형형 원형은 남지 않음", words.join(','));

    // 잔여가 1음절이 되는 경우에는 자르지 않는다
    const keep = analyzer.normalizeKoreanWord('대한');
    assertEquals(keep, '대한', "'대한'은 '대'로 잘리지 않음");
});

test('키워드 추출 - 용언 활용형 제외와 명사 복원', () => {
    // 계사('이다') 결합에서는 앞의 명사를 살려야 한다
    assertEquals(analyzer.normalizeKoreanWord('엉망이었어요'), '엉망', "'엉망이었어요' → '엉망'");
    assertEquals(analyzer.normalizeKoreanWord('경험이었고'), '경험', "'경험이었고' → '경험'");

    // 파생 접미사를 떼면 명사가 드러난다
    assertEquals(analyzer.normalizeKoreanWord('만족스럽습니다'), '만족', "'만족스럽습니다' → '만족'");
    assertEquals(analyzer.normalizeKoreanWord('평화로운'), '평화', "'평화로운' → '평화'");

    // 과거형·관형형 용언은 키워드에서 빠진다
    assertEquals(analyzer.normalizeKoreanWord('기대했던'), '', "'기대했던'은 용언으로 제외");
    assertEquals(analyzer.normalizeKoreanWord('친절했어요'), '', "'친절했어요'는 용언으로 제외");
    assertEquals(analyzer.normalizeKoreanWord('즐거운'), '', "'즐거운'은 용언 관형형으로 제외");
    assertEquals(analyzer.normalizeKoreanWord('아름다운'), '', "'아름다운'은 용언 관형형으로 제외");

    // 계사 패턴이 낱말 안에 우연히 들어 있어도 명사를 자르면 안 된다
    assertEquals(analyzer.normalizeKoreanWord('이야기입니다'), '이야기', "'이야기입니다' → '이야기' (어두 '이야'에 걸리지 않음)");
    assertEquals(analyzer.normalizeKoreanWord('이야기가'), '이야기', "'이야기가' → '이야기'");
    assertEquals(analyzer.normalizeKoreanWord('산티아고에서'), '산티아고', "'산티아고에서' → '산티아고'");
    assertEquals(analyzer.normalizeKoreanWord('시카고의'), '시카고', "'시카고의' → '시카고'");
    assertEquals(analyzer.normalizeKoreanWord('고구려의'), '고구려', "'고구려의' → '고구려'");

    // 받침이 있는 '운' 끝 명사는 지켜야 한다
    assertEquals(analyzer.normalizeKoreanWord('행운'), '행운', "'행운'은 명사로 유지");
    assertEquals(analyzer.normalizeKoreanWord('이미지'), '이미지', "'이미지'는 명사로 유지");
    assertEquals(analyzer.normalizeKoreanWord('메시지를'), '메시지', "'메시지를' → '메시지'");

    const words = analyzer.extractKeywords('정말 만족스럽습니다. 즐거운 경험이었고 직원분들도 친절했어요. 아름다운 공간에서 편안하게 쉬었습니다.').map(k => k.word);
    assert(words.includes('만족'), "'만족'이 키워드에 포함", words.join(','));
    assert(words.includes('경험'), "'경험'이 키워드에 포함", words.join(','));
    assert(!words.some(w => ['즐거운', '친절했어요', '아름다운'].includes(w)), '용언 활용형이 키워드에 없음', words.join(','));
});

test('키워드 추출 - 2음절 명사 보존', () => {
    const keywords = analyzer.extractKeywords(SAMPLES.fairyTale);
    const words = keywords.map(k => k.word);
    assert(words.includes('구조'), "2음절 명사 '구조'가 살아남음", words.join(','));
    assert(words.includes('소음'), "2음절 명사 '소음'이 살아남음", words.join(','));
    assert(!words.includes('있습니다'), "'있습니다'는 불용어로 제외");
    assert(!words.includes('아닙니다'), "'아닙니다'는 불용어로 제외");
});

// ─────────────────────────────────────────────
// 가독성
// ─────────────────────────────────────────────
test('가독성 - 난이도 변별', () => {
    const easy = analyzer.calculateReadability(SAMPLES.fairyTale);
    const hard = analyzer.calculateReadability(SAMPLES.academic);

    assert(easy.score >= 80, '짧은 동화체는 80점 이상', easy.score);
    // 기존 버그: 31어절짜리 학술 문장도 77점 "쉬움"으로 판정됨
    assert(hard.score <= 60, '긴 학술 문장은 60점 이하', hard.score);
    assert(easy.score - hard.score >= 25, '쉬운 글과 어려운 글의 점수 차가 25점 이상', easy.score - hard.score);
    assert(['medium', 'hard', 'very_hard'].includes(hard.level), '학술 문장은 보통 이하 등급', hard.level);
});

test('가독성 - 한국어 지표 산출', () => {
    const r = analyzer.calculateReadability(SAMPLES.academic);
    assertEquals(r.details.language, 'ko', '한국어로 판정');
    assert(r.details.avgSentenceLength > 25, '학술 문장의 어절 수가 25 초과', r.details.avgSentenceLength);
    assert(r.details.longWordRatio > 0, '긴 어절 비율이 0보다 큼', r.details.longWordRatio);
    assertRange(r.score, 0, 100, '점수는 0~100 범위');
});

// ─────────────────────────────────────────────
// 문체 분석
// ─────────────────────────────────────────────
test('문체 분석 - 피동 표현 인식', () => {
    // 기존 버그: 사전형 '되다'만 검색해 '됩니다'/'되었다'를 놓쳐 항상 0
    const style = analyzer.analyzeWritingStyle(SAMPLES.passive);
    assert(style.features.passiveVoiceCount >= 3, '해결되었습니다/발표됩니다/수집되었다 인식', style.features.passiveVoiceCount);
    assertEquals(style.tone, 'objective', '피동이 많으면 객관적 어조');
});

test('문체 분석 - 1인칭 오탐 방지', () => {
    // 기존 버그: 영어 'I'를 \b 없이 /I/gi로 검색해 'It', 'sit', 'time'에 매칭됨
    assertEquals(analyzer.countFirstPersonPronouns('It is time to sit.'), 0, "'It/time/sit'을 1인칭으로 오탐하지 않음");
    assertEquals(analyzer.countFirstPersonPronouns('I think we should go.'), 2, "'I'와 'we'를 정확히 카운트");
    assertEquals(analyzer.countFirstPersonPronouns('나는 갔다. 우리가 함께 왔다.'), 2, "'나는'과 '우리가'를 카운트");
    assertEquals(analyzer.countFirstPersonPronouns('저 나무는 크다.'), 0, "지시사 '저'를 1인칭으로 오탐하지 않음");
});

test('문체 분석 - 격식성 판정', () => {
    const formal = analyzer.analyzeWritingStyle('본 보고서는 다음과 같은 결과를 제시합니다. 분석 방법은 아래와 같습니다.');
    assertEquals(formal.formality, 'formal', '합쇼체(-습니다)는 격식적으로 판정');

    const informal = analyzer.analyzeWritingStyle('나 오늘 진짜 힘들었어. 완전 피곤해! 그냥 쉬고 싶어!');
    assertEquals(informal.formality, 'informal', '해체(-어/-야)는 비격식적으로 판정');
});

// ─────────────────────────────────────────────
// 출력 형식 호환성 (analysis-ui.js가 의존하는 키)
// ─────────────────────────────────────────────
test('출력 형식 - UI 계약 유지', () => {
    const analysis = analyzer.performAdvancedAnalysis(SAMPLES.fairyTale);
    const f = analyzer.formatAnalysisResults(analysis);

    assert(typeof f.sentiment.label === 'string', 'sentiment.label 존재');
    assert(typeof f.sentiment.confidence === 'string' && f.sentiment.confidence.endsWith('%'), 'sentiment.confidence는 % 문자열');
    assert(typeof f.sentiment.description === 'string', 'sentiment.description 존재');
    assert(typeof f.sentiment.intensity === 'number', 'sentiment.intensity 존재');
    assert(typeof f.readability.score === 'number', 'readability.score 존재');
    assert(typeof f.readability.level === 'string', 'readability.level 존재');
    assert(typeof f.writingStyle.formality === 'string', 'writingStyle.formality 존재');
    assert(typeof f.writingStyle.tone === 'string', 'writingStyle.tone 존재');
    assert(typeof f.writingStyle.features.questionCount === 'number', 'features.questionCount 존재');
    assert(typeof f.writingStyle.features.avgSentenceComplexity === 'number', 'features.avgSentenceComplexity 존재');
    assert(Array.isArray(f.keywords), 'keywords 배열');
    if (f.keywords.length > 0) {
        assert(typeof f.keywords[0].word === 'string', 'keywords[].word 존재');
        assert(typeof f.keywords[0].frequency === 'number', 'keywords[].frequency 존재');
        assert(typeof f.keywords[0].bar === 'number', 'keywords[].bar 존재');
    }
});

test('경계값 - 빈 입력/짧은 입력', () => {
    assertEquals(analyzer.analyzeSentiment('').sentiment, 'neutral', '빈 문자열 감정 분석');
    assertEquals(analyzer.calculateReadability('').score, 0, '빈 문자열 가독성 0점');
    assertEquals(analyzer.extractKeywords('').length, 0, '빈 문자열 키워드 없음');
    assertEquals(analyzer.formatKeywordsResult([]).length, 0, '빈 키워드 배열 포맷팅 시 예외 없음');
    const short = analyzer.performAdvancedAnalysis('가나다');
    assert(short !== null && typeof short === 'object', '짧은 입력도 예외 없이 처리');
});

// ─────────────────────────────────────────────
// 결과 출력
// ─────────────────────────────────────────────
console.log(`\n${'='.repeat(50)}`);
console.log(`AdvancedTextAnalyzer 테스트 결과: ${passCount}개 통과 / ${failCount}개 실패`);
if (failCount === 0) {
    console.log('모든 테스트를 통과했습니다.');
} else {
    console.error(`${failCount}개의 테스트가 실패했습니다.`);
    process.exitCode = 1;
}
