/**
 * 고급 텍스트 분석 모듈
 * 감정 분석, 키워드 추출, 가독성 점수, 문체 분석 등 고급 기능 제공
 */

class AdvancedTextAnalyzer {
    constructor() {
        // 감정 분석용 키워드 데이터베이스
        this.sentimentKeywords = {
            positive: {
                ko: [
                    // 기본 긍정 형용사
                    '좋다', '훌륭하다', '멋지다', '완벽하다', '행복하다', '기쁘다', '사랑', '감사', '성공', '우수하다',
                    '뛰어나다', '만족', '즐겁다', '편안하다', '안전하다', '아름답다',
                    // 감정/상태
                    '설레다', '신나다', '뿌듯하다', '자랑스럽다', '보람차다', '희망차다', '따뜻하다', '포근하다', '넉넉하다', '여유롭다',
                    '평화롭다', '행복', '기쁨', '웃음', '미소', '활기차다', '생기있다', '활발하다', '명랑하다', '유쾌하다',
                    // 품질/평가
                    '최고', '으뜸', '탁월하다', '훌륭', '매력적이다', '인상적이다', '놀랍다', '대단하다', '굉장하다', '엄청나다',
                    '강력하다', '효과적이다', '유익하다', '도움이되다', '가치있다', '소중하다', '귀하다', '특별하다', '독특하다', '신선하다',
                    // SNS/일상 표현
                    '최애', '꿀', '짱', '굿', '럭키', '성공적', '완벽', '대박', '소확행', '힐링',
                    '감동', '칭찬', '응원', '화이팅', '파이팅', '해냈다', '잘됐다', '다행이다', '반갑다', '친절하다'
                ],
                en: [
                    // 기본 긍정
                    'good', 'great', 'excellent', 'perfect', 'happy', 'love', 'amazing', 'wonderful', 'fantastic', 'awesome',
                    'brilliant', 'outstanding', 'magnificent', 'marvelous', 'superb',
                    // 감정/상태
                    'joyful', 'cheerful', 'delightful', 'grateful', 'thankful', 'blessed', 'excited', 'thrilled', 'elated', 'content',
                    'pleased', 'satisfied', 'glad', 'proud', 'hopeful', 'optimistic', 'peaceful', 'calm', 'relaxed', 'comfortable',
                    // 품질/평가
                    'beautiful', 'stunning', 'impressive', 'remarkable', 'extraordinary', 'exceptional', 'splendid', 'glorious', 'fabulous', 'terrific',
                    'helpful', 'useful', 'valuable', 'effective', 'efficient', 'powerful', 'innovative', 'creative', 'inspiring', 'motivating',
                    // 일상/SNS 표현
                    'nice', 'cool', 'sweet', 'kind', 'friendly', 'warm', 'caring', 'supportive', 'positive', 'succeed',
                    'win', 'victory', 'achievement', 'progress', 'improve', 'grow', 'thrive', 'enjoy', 'celebrate', 'recommend'
                ]
            },
            negative: {
                ko: [
                    // 기본 부정 형용사
                    '나쁘다', '싫다', '슬프다', '화나다', '짜증', '실망', '걱정', '힘들다', '어렵다',
                    '문제', '실패', '끔찍하다', '최악', '고통', '무섭다',
                    // 감정/상태
                    '우울하다', '불안하다', '두렵다', '외롭다', '지치다', '피곤하다', '괴롭다', '답답하다', '억울하다', '서럽다',
                    '후회하다', '부끄럽다', '창피하다', '수치스럽다', '당황스럽다', '혼란스럽다', '황당하다', '어이없다', '황망하다', '허탈하다',
                    // 품질/평가
                    '형편없다', '최저', '엉터리', '엉망', '망하다', '부족하다', '모자라다', '낙제', '불합격', '탈락',
                    '손해', '피해', '위험하다', '불안전하다', '불편하다', '불쾌하다', '역겹다', '구역질', '지저분하다', '더럽다',
                    // SNS/일상 표현
                    '최악', '쓰레기', '별로', '구리다', '실망', '당황', '황당', '기가막히다', '어처구니없다', '막막하다',
                    '속상하다', '화가나다', '짜증나다', '귀찮다', '싫증', '질리다', '포기', '절망', '비참하다', '처참하다'
                ],
                en: [
                    // 기본 부정
                    'bad', 'terrible', 'awful', 'horrible', 'sad', 'angry', 'hate', 'worst', 'fail', 'problem',
                    'difficult', 'pain', 'worry', 'fear', 'disappoint',
                    // 감정/상태
                    'depressed', 'anxious', 'stressed', 'frustrated', 'annoyed', 'irritated', 'upset', 'miserable', 'unhappy', 'lonely',
                    'tired', 'exhausted', 'overwhelmed', 'desperate', 'hopeless', 'helpless', 'regret', 'ashamed', 'embarrassed', 'confused',
                    // 품질/평가
                    'poor', 'weak', 'useless', 'worthless', 'broken', 'damaged', 'wrong', 'incorrect', 'mistake', 'error',
                    'dangerous', 'harmful', 'toxic', 'corrupt', 'fake', 'false', 'misleading', 'unfair', 'unjust', 'unacceptable',
                    // 일상/SNS 표현
                    'hate', 'dislike', 'boring', 'dull', 'ugly', 'disgusting', 'offensive', 'annoying', 'pathetic', 'ridiculous',
                    'stupid', 'nonsense', 'waste', 'loss', 'defeat', 'failure', 'disaster', 'crisis', 'threat', 'risk'
                ]
            }
        };

        // 키워드 정규화 후 남는 어근 기준 불용어
        this.stopWords = {
            ko: [
                '있', '없', '하', '되', '것', '수', '등', '및', '때', '점', '중', '데', '거',
                '통해', '위해', '대해', '관련', '경우', '때문', '정도', '자체', '이것', '그것', '저것',
                '그리고', '그러나', '하지만', '또한', '그런', '이런', '저런', '무엇', '어떤', '같은',
                '대한', '따라', '매우', '정말', '아주', '너무', '조금', '다시', '다른', '모든',
                '여러', '한편', '물론', '특히', '만약', '비록', '이러', '그러', '저러'
                // 정도부사(매우/조금/굉장히…)는 this.degreeAdverbs를 재사용해 걸러낸다
            ],
            en: [
                'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
                'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
                'this', 'that', 'these', 'those', 'it', 'its', 'as', 'from', 'not', 'can', 'will', 'would',
                'there', 'their', 'they', 'you', 'your', 'we', 'our', 'he', 'she', 'his', 'her'
            ]
        };

        // 한국어 서술형 어미 (긴 것부터 제거)
        this.koreanPredicateEndings = [
            '하였습니다', '되었습니다', '였습니다', '았습니다', '었습니다', '했습니다', '합니다', '입니다',
            '됩니다', '습니다', '닙니다', '립니다', '깁니다', '핍니다', '십니다', '읍니다',
            '하였다', '되었다', '하는', '하고', '하며', '하여', '해서', '했다', '한다', '하다', '하지', '하면',
            '되는', '되고', '되며', '되어', '되었', '된다', '되다', '이다', '이며', '이고', '였다'
        ];

        // 한국어 조사 (긴 것부터 제거). 1음절 조사는 명사 훼손을 막기 위해 잔여 길이를 더 엄격히 본다
        this.koreanParticlesLong = [
            '으로서', '으로써', '에서는', '에게는', '에서도', '으로는', '이라고', '라고는', '에서의',
            '에서', '에게', '한테', '으로', '부터', '까지', '처럼', '같이', '보다', '마다', '조차',
            '마저', '밖에', '만큼', '대로', '이나', '라도', '이란', '이라', '께서', '에는', '에도',
            '와의', '과의', '으로', '이야', '이며'
        ];
        this.koreanParticlesShort = ['은', '는', '이', '가', '을', '를', '에', '와', '과', '도', '만', '의', '로'];

        // 가독성 기준 (언어별). 한국어는 어절 수와 어절당 음절 수를 기준으로 삼는다
        this.readabilityStandards = {
            ko: {
                sentenceLength: { easy: 8, hard: 24 },       // 문장당 어절 수
                syllablesPerWord: { easy: 3.2, hard: 4.5 },  // 어절당 음절 수 (한국어 산문 평균 약 3.2)
                longWordRatio: { easy: 0.05, hard: 0.30 },   // 6음절 이상 어절 비율
                longWordSize: 6
            },
            en: {
                sentenceLength: { easy: 12, hard: 30 },
                syllablesPerWord: { easy: 1.4, hard: 2.2 },
                longWordRatio: { easy: 0.05, hard: 0.25 },
                longWordSize: 9
            }
        };

        // 한국어 피동 표현 패턴 (사전형이 아닌 실제 활용형을 인식)
        this.koreanPassivePatterns = [
            /[가-힣]되(?:다|었|는|어|며|고|지|면|겠|어서|어야)/g,
            /[가-힣]됩니(?:다|까)/g,
            /[가-힣]됐/g,
            /[가-힣]된[다\s]/g,
            /[가-힣][아어여]졌/g,
            /[가-힣][아어여]지(?:다|는|고|며)/g,
            /받(?:다|았|는|은|아|으며|고|을)/g
        ];

        // 1인칭 표현 (한국어는 어절 정확 일치, 영어는 단어 경계 매칭)
        this.firstPersonWords = {
            ko: ['나', '내', '내가', '나는', '나도', '나를', '나의', '제', '제가', '저는', '저도', '저를', '저의',
                 '우리', '우리는', '우리가', '우리를', '우리의', '저희', '저희는', '저희가', '저희를'],
            en: ['I', 'me', 'my', 'mine', 'myself', 'we', 'us', 'our', 'ours', 'ourselves']
        };

        // 문장 종결 형태로 격식 수준을 판정한다 (한국어 격식성의 1차 지표)
        this.speechLevelPatterns = {
            formal: /(?:니다|니까|십시오|ㅂ시다|나이다)$/,
            polite: /(?:요|죠|쥬)$/,
            informal: /(?:어|아|야|해|지|네|군|든|데|잖아|더라|구나|을까|ㄹ까)$/,
            written: /(?:다|음|함|임|것|중)$/
        };

        // 감정 방향을 단정하기 위한 최소 신뢰도. 감정어 1개(신뢰도 0.33)로는 판정하지 않는다
        this.SENTIMENT_MIN_CONFIDENCE = 0.35;

        // 정도부사 가중치. '매우 좋다'와 '조금 좋다'의 세기를 구분한다.
        // '별로', '그다지'는 그 자체가 부정 감정어이므로 넣지 않는다
        this.DEGREE_WEIGHT = { intensified: 1.5, plain: 1.0, weakened: 0.5 };
        this.degreeAdverbs = {
            ko: {
                intensifiers: new Set([
                    '매우', '정말', '정말로', '진짜', '진짜로', '너무', '너무나', '아주', '굉장히', '엄청',
                    '엄청나게', '완전', '무척', '몹시', '대단히', '되게', '훨씬', '한층', '극히', '지극히',
                    '심히', '상당히', '무지', '참으로', '아주아주', '너무너무'
                ]),
                weakeners: new Set([
                    '조금', '약간', '살짝', '다소', '좀', '비교적', '어느정도', '그런대로', '다소간', '얼마간'
                ])
            },
            en: {
                intensifiers: new Set([
                    'very', 'really', 'extremely', 'so', 'too', 'absolutely', 'totally', 'completely',
                    'incredibly', 'highly', 'deeply', 'truly', 'especially', 'particularly', 'quite'
                ]),
                weakeners: new Set([
                    'slightly', 'somewhat', 'rather', 'fairly', 'moderately', 'marginally', 'mildly'
                ])
            }
        };

        // 감정 사전을 어간 형태로 정규화해 활용형까지 인식한다
        this.sentimentStems = {
            positive: {
                ko: this.buildKoreanStems(this.sentimentKeywords.positive.ko),
                en: this.buildEnglishStems(this.sentimentKeywords.positive.en)
            },
            negative: {
                ko: this.buildKoreanStems(this.sentimentKeywords.negative.ko),
                en: this.buildEnglishStems(this.sentimentKeywords.negative.en)
            }
        };
    }

    // ─────────────────────────────────────────────
    // 사전 전처리
    // ─────────────────────────────────────────────

    /**
     * 한국어 감정어를 어간으로 변환한다.
     * - 'X하다' → 'X'   (훌륭하다 → 훌륭. '훌륭한', '훌륭했다'까지 매칭됨)
     * - 'X다'   → 'X'   (좋다 → 좋, 슬프다 → 슬프)
     * - 종성이 없는 어간에는 ㅂ/ㄴ/ㄹ/ㅁ 결합형을 추가한다 (기쁘 → 기쁩, 기쁜, 기쁠, 기쁨)
     * @param {string[]} words - 사전형 감정어 목록
     * @returns {{exact: Set<string>, prefixes: string[]}}
     */
    buildKoreanStems(words) {
        const exact = new Set();
        const prefixes = new Set();

        words.forEach(word => {
            const isVerb = word.endsWith('다') && word.length > 1;
            let stem = word;

            if (word.endsWith('하다') && word.length > 2) {
                stem = word.slice(0, -2);
            } else if (isVerb) {
                stem = word.slice(0, -1);
            }

            if (stem.length === 0) return;

            // 명사·감탄사 1음절(꿀, 짱, 굿)은 오탐 위험이 커서 정확 일치만 허용한다
            if (stem.length === 1 && !isVerb) {
                exact.add(stem);
                return;
            }

            prefixes.add(stem);
            this.expandStemWithFinalConsonants(stem).forEach(v => prefixes.add(v));
            if (isVerb) {
                this.expandIrregularStems(stem).forEach(v => prefixes.add(v));
            }
        });

        return {
            exact,
            // 긴 어간을 먼저 검사해 '최악'이 '최'보다 우선 매칭되게 한다
            prefixes: Array.from(prefixes).sort((a, b) => b.length - a.length)
        };
    }

    /**
     * 한글 음절을 초성·중성·종성 인덱스로 분해한다. 한글이 아니면 null.
     */
    decomposeSyllable(ch) {
        const code = ch.charCodeAt(0);
        if (code < 0xAC00 || code > 0xD7A3) return null;
        const offset = code - 0xAC00;
        return {
            initial: Math.floor(offset / 588),
            medial: Math.floor((offset % 588) / 28),
            final: offset % 28
        };
    }

    /**
     * 초성·중성·종성 인덱스로 한글 음절을 조합한다.
     */
    composeSyllable(initial, medial, final = 0) {
        return String.fromCharCode(0xAC00 + initial * 588 + medial * 28 + final);
    }

    /**
     * 종성 없는 어간 끝 음절에 종성을 붙인 활용 변형을 만든다.
     * 예: 기쁘 → 기쁩(니다), 기쁜, 기쁠, 기쁨
     */
    expandStemWithFinalConsonants(stem) {
        const last = this.decomposeSyllable(stem.charAt(stem.length - 1));
        if (!last || last.final !== 0) return []; // 이미 종성이 있으면 변형 불필요

        // 종성 인덱스: ㄴ=4, ㄹ=8, ㅁ=16, ㅂ=17
        return [4, 8, 16, 17].map(final =>
            stem.slice(0, -1) + this.composeSyllable(last.initial, last.medial, final)
        );
    }

    /**
     * 용언 어간의 불규칙 활용형을 만든다. 한국어 감정어의 3분의 1이 여기 해당한다.
     * - ㅂ불규칙: 즐겁 → 즐거우/즐거워/즐거운/즐거웠
     * - ㅡ불규칙: 기쁘 → 기뻐/기뻤, 나쁘 → 나빠/나빴 (모음조화 적용)
     */
    expandIrregularStems(stem) {
        if (stem.length < 2) return [];
        const last = this.decomposeSyllable(stem.charAt(stem.length - 1));
        if (!last) return [];
        const head = stem.slice(0, -1);

        // ㅂ불규칙(종성 ㅂ=17). ㅂ만 떼면 '놀랍→놀라'처럼 다른 낱말과 겹치므로
        // 실제 어미까지 붙인 형태만 만든다
        if (last.final === 17) {
            const base = head + this.composeSyllable(last.initial, last.medial, 0);
            return ['우', '워', '운', '웠'].map(suffix => base + suffix);
        }

        // ㅡ불규칙(중성 ㅡ=18, 종성 없음). 앞 음절이 양성모음(ㅏ/ㅗ)이면 ㅏ, 아니면 ㅓ로 바뀐다
        if (last.final === 0 && last.medial === 18) {
            const previous = head.length > 0 ? this.decomposeSyllable(head.charAt(head.length - 1)) : null;
            const isBrightVowel = previous !== null && (previous.medial === 0 || previous.medial === 8);
            const medial = isBrightVowel ? 0 : 4; // ㅏ : ㅓ
            return [
                head + this.composeSyllable(last.initial, medial, 0),  // 기뻐
                head + this.composeSyllable(last.initial, medial, 20)  // 기뻤 (종성 ㅆ)
            ];
        }

        return [];
    }

    /**
     * 영어 감정어를 소문자 집합으로 만든다. 매칭은 정확 일치 + 어미 정규화로 처리한다.
     */
    buildEnglishStems(words) {
        return new Set(words.map(w => w.toLowerCase()));
    }

    // ─────────────────────────────────────────────
    // 감정 분석
    // ─────────────────────────────────────────────

    /**
     * 감정 분석 수행
     * @param {string} text - 분석할 텍스트
     * @returns {Object} 감정 분석 결과
     */
    analyzeSentiment(text) {
        if (!text || text.trim() === '') {
            return {
                sentiment: 'neutral',
                score: 0,
                confidence: 0,
                details: { positive: 0, negative: 0, neutral: 0 }
            };
        }

        const language = this.detectPrimaryLanguage(text);

        let positiveCount = 0;
        let negativeCount = 0;
        let positiveWeight = 0;
        let negativeWeight = 0;
        let totalWords = 0;

        // 부정어 탐색이 문장 경계를 넘지 않도록 문장 단위로 처리한다
        this.splitIntoSentences(text).forEach(sentence => {
            const words = this.extractWords(sentence, language);
            totalWords += words.length;

            words.forEach((word, index) => {
                // 정도부사는 그 자체가 감정 표현이 아니라 뒤따르는 감정어의 세기를 조절한다.
                // ('굉장히'가 '굉장하다'의 활용형으로 잡혀 긍정어로 세지는 것을 막는다)
                if (this.isDegreeAdverb(word, language)) return;

                const polarity = this.classifySentiment(word, language);
                if (!polarity) return;

                const flipped = this.isNegated(words, index, language);
                const resolved = flipped
                    ? (polarity === 'positive' ? 'negative' : 'positive')
                    : polarity;

                // 가중치는 부정 반전이 끝난 극성에 적용한다 ('정말 좋지 않다' → 강한 부정)
                const weight = this.degreeWeight(words, index, language);

                if (resolved === 'positive') {
                    positiveCount++;
                    positiveWeight += weight;
                } else {
                    negativeCount++;
                    negativeWeight += weight;
                }
            });
        });

        const totalEmotionalWords = positiveCount + negativeCount;

        if (totalEmotionalWords === 0) {
            return {
                sentiment: 'neutral',
                score: 0,
                confidence: 0,
                intensity: 0.5,
                details: { positive: 0, negative: 0, neutral: totalWords }
            };
        }

        // 점수는 감정어 안에서의 편향(-1 ~ 1)이며, 정도부사 가중치를 반영한다.
        // '매우 훌륭하지만 조금 실망'처럼 개수만으로는 팽팽한 글의 방향을 가른다
        const totalWeight = positiveWeight + negativeWeight;
        const score = (positiveWeight - negativeWeight) / totalWeight;

        // 감정 강도(0~1). 부사가 없으면 중립값 0.5가 되어 기존 판정을 바꾸지 않는다
        const intensity = (totalWeight / totalEmotionalWords) - this.DEGREE_WEIGHT.weakened;

        // 신뢰도 = 편향의 뚜렷함 × 표본 충분도. 표본은 가중치가 아닌 개수로 센다
        const bias = Math.abs(score);
        const sampleFactor = Math.min(1, totalEmotionalWords / 3);
        const confidence = bias * sampleFactor;

        // 감정어가 1개뿐이거나 편향이 약하면 방향을 단정하지 않는다
        let sentiment = 'neutral';
        if (confidence >= this.SENTIMENT_MIN_CONFIDENCE) {
            if (score > 0.2) sentiment = 'positive';
            else if (score < -0.2) sentiment = 'negative';
        }

        return {
            sentiment,
            score: Math.round(score * 100) / 100,
            confidence: Math.round(confidence * 100) / 100,
            intensity: Math.round(intensity * 100) / 100,
            details: {
                positive: positiveCount,
                negative: negativeCount,
                neutral: totalWords - totalEmotionalWords
            }
        };
    }

    /**
     * 어절이 정도부사인지 판단한다.
     */
    isDegreeAdverb(word, language) {
        const table = this.degreeAdverbs[language] || this.degreeAdverbs.en;
        const candidate = language === 'ko' ? word : word.toLowerCase();
        return table.intensifiers.has(candidate) || table.weakeners.has(candidate);
    }

    /**
     * 감정어 앞에 놓인 정도부사를 찾아 가중치를 정한다.
     * 부사는 감정어에 인접하므로 앞 2어절까지만, 가까운 쪽을 먼저 본다.
     */
    degreeWeight(words, index, language) {
        const table = this.degreeAdverbs[language] || this.degreeAdverbs.en;

        for (let i = index - 1; i >= Math.max(0, index - 2); i--) {
            const candidate = language === 'ko' ? words[i] : words[i].toLowerCase();
            if (table.intensifiers.has(candidate)) return this.DEGREE_WEIGHT.intensified;
            if (table.weakeners.has(candidate)) return this.DEGREE_WEIGHT.weakened;
        }

        return this.DEGREE_WEIGHT.plain;
    }

    /**
     * 한 어절의 감정 극성을 하나로 확정한다.
     * 긍정·부정 사전에 모두 걸리면 더 긴(구체적인) 어간이 이긴다.
     * @returns {'positive'|'negative'|null}
     */
    classifySentiment(word, language) {
        const positive = this.matchStrength(word, 'positive', language);
        const negative = this.matchStrength(word, 'negative', language);
        if (positive === 0 && negative === 0) return null;
        return positive >= negative ? 'positive' : 'negative';
    }

    /**
     * 어절과 매칭된 감정 어간의 길이를 반환한다 (0이면 미매칭).
     * 기존의 양방향 includes 매칭(조사 '이'가 감정어 8개에 걸리던 원인)을 대체한다.
     */
    matchStrength(word, polarity, language) {
        const stems = this.sentimentStems[polarity][language] || this.sentimentStems[polarity].en;

        if (language === 'ko') {
            if (stems.exact.has(word)) return word.length;
            // prefixes는 길이 내림차순으로 정렬돼 있어 첫 매칭이 곧 최장 매칭이다
            const matched = stems.prefixes.find(stem => word.startsWith(stem));
            return matched ? matched.length : 0;
        }

        const lower = word.toLowerCase();
        if (stems.has(lower)) return lower.length;

        // 영어는 굴절 어미를 떼고 한 번 더 확인한다 (loved → love, amazingly → amazing)
        const suffixes = ['ly', 'ing', 'ed', 'es', 's'];
        for (const suffix of suffixes) {
            if (!lower.endsWith(suffix) || lower.length - suffix.length < 3) continue;
            const base = lower.slice(0, -suffix.length);
            if (stems.has(base) || stems.has(base + 'e')) return base.length;
        }
        return 0;
    }

    /**
     * 감정어가 부정되고 있는지 판단한다. '좋지 않다'를 긍정으로,
     * '나쁘지 않다'를 부정으로 세던 문제를 바로잡는다.
     *
     * 한국어 - 같은 어절 결합('좋지않다'), 후행 보조용언('-지 않다/못하다/아니다/없다'),
     *          선행 부정 부사('안 좋다', '못 하다')
     * 영어   - 앞 2토큰 이내의 not/no/never 계열
     */
    isNegated(words, index, language) {
        if (language === 'ko') {
            const word = words[index];
            if (word.includes('않') || word.includes('못하')) return true;

            const next = words[index + 1];
            if (next && /^(?:않|못하|아니|없)/.test(next)) return true;

            const previous = words[index - 1];
            return previous === '안' || previous === '못';
        }

        const negators = new Set(['not', 'no', 'never', 'nor', 'neither', 'without', 't']);
        for (let i = Math.max(0, index - 2); i < index; i++) {
            if (negators.has(words[i].toLowerCase())) return true;
        }
        return false;
    }

    // ─────────────────────────────────────────────
    // 키워드 추출
    // ─────────────────────────────────────────────

    /**
     * 키워드 추출 및 빈도 분석
     * @param {string} text - 분석할 텍스트
     * @param {number} maxKeywords - 최대 키워드 수
     * @returns {Array} 키워드 배열 (빈도순 정렬)
     */
    extractKeywords(text, maxKeywords = 10) {
        if (!text || text.trim() === '') return [];

        const language = this.detectPrimaryLanguage(text);
        const words = this.extractWords(text, language);
        const stopWords = this.stopWords[language] || this.stopWords.en;

        const wordFreq = {};
        let countedWords = 0;

        words.forEach(word => {
            const normalized = language === 'ko'
                ? this.normalizeKoreanWord(word)
                : word.toLowerCase().replace(/[^a-z]/g, '');

            // 조사·어미를 떼고 나면 2음절 이상이어야 의미 있는 키워드로 본다
            if (normalized.length < 2) return;
            if (stopWords.includes(normalized)) return;
            // 정도부사는 글의 주제를 드러내지 않는다
            if (this.isDegreeAdverb(word, language) || this.isDegreeAdverb(normalized, language)) return;

            wordFreq[normalized] = (wordFreq[normalized] || 0) + 1;
            countedWords++;
        });

        if (countedWords === 0) return [];

        return Object.entries(wordFreq)
            .sort(([, a], [, b]) => b - a)
            .slice(0, maxKeywords)
            .map(([word, frequency]) => ({
                word,
                frequency,
                percentage: Math.round((frequency / countedWords) * 100 * 100) / 100
            }));
    }

    /**
     * 한국어 어절에서 서술형 어미와 조사를 제거해 어근을 얻는다.
     * '구조가'와 '구조를'이 같은 키워드로 집계되도록 하는 것이 목적이다.
     */
    normalizeKoreanWord(word) {
        let result = word;

        // 0) 계사('이다') 결합에서는 앞의 명사만 남긴다 (엉망이었어요 → 엉망)
        const copula = result.match(/^(.+?)(?:이었|이며|이고|이라|이야|이란|입니)/);
        if (copula && copula[1].length >= 2) {
            return copula[1];
        }

        // 0-1) 용언 활용형은 키워드로 부적합하다. 다만 파생 접미사가 붙은 말은 명사를 복원한다
        const derived = result.replace(/(?:스럽|스러|스러운|롭|로운|로우)(?:다|습니다|게|고|며|지)?$/, '');
        if (derived !== result && derived.length >= 2) {
            result = derived;
        } else if (this.isKoreanPredicate(result)) {
            return '';
        }

        // 1) 서술형 어미 제거 (중요합니다 → 중요, 분석했습니다 → 분석)
        for (const ending of this.koreanPredicateEndings) {
            if (result.length > ending.length && result.endsWith(ending)) {
                result = result.slice(0, -ending.length);
                break;
            }
        }

        // 2) 어미 목록으로 처리되지 않은 서술형 종결('기쁩니다', '납니다')은 키워드로 부적합하다
        if (result.endsWith('니다') || result.endsWith('습니다')) return '';

        // 3) 관형형 '-한/-된' 정규화 (훌륭한 → 훌륭, 오염된 → 오염).
        //    '-고', '-서' 같은 연결어미까지 떼면 '사고 → 사'처럼 명사가 깨지므로 다루지 않는다
        if (/[한된]$/.test(result) && result.length - 1 >= 2) {
            result = result.slice(0, -1);
        }

        // 4) 2음절 이상 조사 제거 (밤에는 → 밤). 명사로 오인될 위험이 낮다
        for (const particle of this.koreanParticlesLong) {
            if (result.length > particle.length && result.endsWith(particle)) {
                result = result.slice(0, -particle.length);
                return result;
            }
        }

        // 5) 1음절 조사는 잔여가 2음절 이상일 때만 제거 ('평가'의 '가'를 지키기 위함)
        for (const particle of this.koreanParticlesShort) {
            if (result.endsWith(particle) && result.length - particle.length >= 2) {
                return result.slice(0, -particle.length);
            }
        }

        return result;
    }

    /**
     * 어절이 용언 활용형인지 판단한다.
     * 키워드는 "무엇에 대한 글인가"를 보여줘야 하므로 명사 중심으로 뽑고 용언은 제외한다.
     */
    isKoreanPredicate(word) {
        // 부정 보조용언은 명사에 나타나지 않는다 (않아요, 못합니다)
        if (/않|못하/.test(word)) return true;

        // 과거 선어말 어미는 종성 ㅆ으로 축약된다 (했, 었, 았, 였, 렸, 왔)
        for (const ch of word) {
            const syllable = this.decomposeSyllable(ch);
            if (syllable && syllable.final === 20) return true;
        }

        // ㅂ불규칙 관형형 (즐거운, 아름다운, 어려운). 앞 음절에 종성이 있는
        // '행운', '기운' 같은 명사는 걸리지 않는다
        if (word.endsWith('운') && word.length >= 3) {
            const before = this.decomposeSyllable(word.charAt(word.length - 2));
            if (before && before.final === 0) return true;
        }

        return /(?:하지|되지|하며|하면|해서|던)$/.test(word);
    }

    // ─────────────────────────────────────────────
    // 가독성
    // ─────────────────────────────────────────────

    /**
     * 가독성 점수 계산
     * @param {string} text - 분석할 텍스트
     * @returns {Object} 가독성 분석 결과
     */
    calculateReadability(text) {
        if (!text || text.trim() === '') {
            return { score: 0, level: 'unknown', details: {} };
        }

        const language = this.detectPrimaryLanguage(text);
        const sentences = this.splitIntoSentences(text);
        const words = this.extractWords(text, language);
        const syllables = this.countTotalSyllables(text);

        if (sentences.length === 0 || words.length === 0) {
            return { score: 0, level: 'unknown', details: {} };
        }

        const standards = this.readabilityStandards[language] || this.readabilityStandards.en;

        const avgSentenceLength = words.length / sentences.length;
        const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
        const avgSyllablesPerWord = syllables / words.length;
        const longWordRatio = words.filter(w => w.length >= standards.longWordSize).length / words.length;

        // 계단식 감점 대신 연속 감점을 쓴다. 임계값 근처에서 점수가 튀지 않고 난이도 변별이 살아난다
        const score = Math.max(0, Math.min(100, 100
            - this.gradedPenalty(avgSentenceLength, standards.sentenceLength, 40)
            - this.gradedPenalty(avgSyllablesPerWord, standards.syllablesPerWord, 25)
            - this.gradedPenalty(longWordRatio, standards.longWordRatio, 30)
        ));

        let level = 'unknown';
        if (score >= 80) level = 'very_easy';
        else if (score >= 60) level = 'easy';
        else if (score >= 40) level = 'medium';
        else if (score >= 20) level = 'hard';
        else level = 'very_hard';

        return {
            score: Math.round(score),
            level,
            details: {
                language,
                avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
                avgWordLength: Math.round(avgWordLength * 10) / 10,
                avgSyllablesPerWord: Math.round(avgSyllablesPerWord * 10) / 10,
                longWordRatio: Math.round(longWordRatio * 100) / 100,
                totalSentences: sentences.length,
                totalWords: words.length,
                totalSyllables: syllables
            }
        };
    }

    /**
     * easy 이하는 감점 없음, hard 이상은 최대 감점, 그 사이는 선형 보간한다.
     */
    gradedPenalty(value, threshold, maxPenalty) {
        if (value <= threshold.easy) return 0;
        const ratio = Math.min(1, (value - threshold.easy) / (threshold.hard - threshold.easy));
        return ratio * maxPenalty;
    }

    // ─────────────────────────────────────────────
    // 문체 분석
    // ─────────────────────────────────────────────

    /**
     * 문체 분석
     * @param {string} text - 분석할 텍스트
     * @returns {Object} 문체 분석 결과
     */
    analyzeWritingStyle(text) {
        if (!text || text.trim() === '') {
            return { formality: 'unknown', tone: 'unknown', features: {} };
        }

        const sentences = this.splitIntoSentences(text);
        const words = this.extractWords(text);

        const features = {
            questionCount: (text.match(/[?？]/g) || []).length,
            exclamationCount: (text.match(/[!！]/g) || []).length,
            declarativeCount: Math.max(0, sentences.length - ((text.match(/[?？!！]/g) || []).length)),
            firstPersonCount: this.countFirstPersonPronouns(text),
            passiveVoiceCount: this.countPassiveVoice(text),
            complexSentenceCount: sentences.filter(s => s.split(/[,，;；]/).length > 2).length
        };

        let formality = 'neutral';
        const formalityScore = this.calculateFormalityScore(text, features);
        if (formalityScore > 0.6) formality = 'formal';
        else if (formalityScore < 0.4) formality = 'informal';

        // 어조는 우선순위가 높은 신호부터 판정한다
        let tone = 'neutral';
        const sentenceCount = Math.max(1, sentences.length);
        if (features.questionCount > sentenceCount * 0.3) tone = 'questioning';
        else if (features.exclamationCount > sentenceCount * 0.2) tone = 'excited';
        else if (features.passiveVoiceCount >= sentenceCount * 0.4) tone = 'objective';
        else if (features.firstPersonCount >= sentenceCount * 0.3) tone = 'personal';

        return {
            formality,
            tone,
            features: {
                ...features,
                avgSentenceComplexity: Math.round((features.complexSentenceCount / sentenceCount) * 100) / 100,
                punctuationDiversity: this.calculatePunctuationDiversity(text)
            }
        };
    }

    /**
     * 문장 종결 형태를 세어 한국어 격식 수준을 판정한다.
     * @returns {{formal: number, polite: number, informal: number, total: number}}
     */
    countSpeechLevels(text) {
        const counts = { formal: 0, polite: 0, informal: 0, total: 0 };

        this.splitIntoSentences(text).forEach(sentence => {
            const trimmed = sentence.trim().replace(/["'”’)\]】]+$/, '');
            if (!trimmed) return;

            if (this.speechLevelPatterns.formal.test(trimmed)) counts.formal++;
            else if (this.speechLevelPatterns.polite.test(trimmed)) counts.polite++;
            else if (this.speechLevelPatterns.informal.test(trimmed)) counts.informal++;
            else if (this.speechLevelPatterns.written.test(trimmed)) counts.formal++;
            else return;

            counts.total++;
        });

        return counts;
    }

    calculateFormalityScore(text, features) {
        const language = this.detectPrimaryLanguage(text);
        const sentenceCount = Math.max(1, this.splitIntoSentences(text).length);
        let score = 0.5;

        if (language === 'ko') {
            const levels = this.countSpeechLevels(text);
            if (levels.total > 0) {
                // 합쇼체/문어체 1.0, 해요체 0.5, 해체 0.0으로 가중 평균
                score = (levels.formal * 1.0 + levels.polite * 0.5) / levels.total;
            }
        }

        // 복잡한 문장 구조는 격식성을 높인다
        if (features.complexSentenceCount > 0) {
            score += (features.complexSentenceCount / sentenceCount) * 0.2;
        }

        // 1인칭과 느낌표는 격식성을 낮춘다
        if (features.firstPersonCount > 0) {
            score -= Math.min(0.2, (features.firstPersonCount / sentenceCount) * 0.2);
        }
        if (features.exclamationCount > 0) {
            score -= Math.min(0.15, (features.exclamationCount / sentenceCount) * 0.15);
        }

        return Math.max(0, Math.min(1, score));
    }

    // ─────────────────────────────────────────────
    // 종합 분석
    // ─────────────────────────────────────────────

    /**
     * 종합 고급 분석 수행
     * @param {string} text - 분석할 텍스트
     * @returns {Object} 모든 고급 분석 결과
     */
    performAdvancedAnalysis(text) {
        return {
            sentiment: this.analyzeSentiment(text),
            keywords: this.extractKeywords(text),
            readability: this.calculateReadability(text),
            writingStyle: this.analyzeWritingStyle(text),
            textStats: this.getAdvancedTextStats(text)
        };
    }

    /**
     * 고급 텍스트 통계
     */
    getAdvancedTextStats(text) {
        if (!text || text.trim() === '') return {};

        const words = this.extractWords(text);
        const sentences = this.splitIntoSentences(text);
        if (words.length === 0 || sentences.length === 0) return {};

        const uniqueWords = new Set(words.map(w => w.toLowerCase())).size;

        return {
            vocabularyRichness: Math.round((uniqueWords / words.length) * 100) / 100,
            averageSentenceLength: Math.round((words.length / sentences.length) * 10) / 10,
            longestWord: words.reduce((longest, word) => word.length > longest.length ? word : longest, ''),
            mostFrequentWord: this.getMostFrequentWord(words),
            textDensity: this.calculateTextDensity(text)
        };
    }

    // ─────────────────────────────────────────────
    // 유틸리티
    // ─────────────────────────────────────────────

    detectPrimaryLanguage(text) {
        const koreanChars = (text.match(/[가-힯]/g) || []).length;
        const englishChars = (text.match(/[a-zA-Z]/g) || []).length;
        return koreanChars > englishChars ? 'ko' : 'en';
    }

    extractWords(text, language = null) {
        if (!language) language = this.detectPrimaryLanguage(text);

        if (language === 'ko') {
            return text.match(/[가-힯]+|[a-zA-Z]+/g) || [];
        }
        return text.match(/[a-zA-Z]+/g) || [];
    }

    splitIntoSentences(text) {
        return text.split(/[.!?。！？\n]+/).filter(s => s.trim().length > 0);
    }

    countTotalSyllables(text) {
        const koreanChars = (text.match(/[가-힯]/g) || []).length;
        const englishWords = (text.match(/[a-zA-Z]+/g) || []);
        const englishSyllables = englishWords.reduce((count, word) => {
            return count + Math.max(1, word.match(/[aeiouAEIOU]/g)?.length || 1);
        }, 0);

        return koreanChars + englishSyllables;
    }

    /**
     * 1인칭 표현 개수.
     * 한국어는 어절 정확 일치, 영어는 단어 경계 매칭으로 'It'/'sit'/'time' 오탐을 막는다.
     */
    countFirstPersonPronouns(text) {
        const language = this.detectPrimaryLanguage(text);

        if (language === 'ko') {
            const targets = new Set(this.firstPersonWords.ko);
            return this.extractWords(text, 'ko').filter(word => targets.has(word)).length;
        }

        return this.firstPersonWords.en.reduce((count, pronoun) => {
            // 'I'만 대소문자를 구분한다. 소문자 i는 대부분 1인칭이 아니다
            const flags = pronoun === 'I' ? 'g' : 'gi';
            const regex = new RegExp(`\\b${pronoun}\\b`, flags);
            return count + (text.match(regex) || []).length;
        }, 0);
    }

    /**
     * 피동 표현 개수. 사전형('되다')이 아니라 실제 활용형('됩니다', '되었다')을 인식한다.
     */
    countPassiveVoice(text) {
        const language = this.detectPrimaryLanguage(text);

        if (language === 'ko') {
            return this.koreanPassivePatterns.reduce((count, pattern) => {
                return count + (text.match(pattern) || []).length;
            }, 0);
        }

        // 영어는 be동사 + 과거분사 형태를 근사한다
        const matches = text.match(/\b(?:was|were|been|being|is|are)\s+\w+(?:ed|en)\b/gi) || [];
        return matches.length;
    }

    calculatePunctuationDiversity(text) {
        const punctuations = text.match(/[.,!?;:()'"]/g) || [];
        return new Set(punctuations).size;
    }

    getMostFrequentWord(words) {
        const frequency = {};
        words.forEach(word => {
            const cleanWord = word.toLowerCase();
            frequency[cleanWord] = (frequency[cleanWord] || 0) + 1;
        });

        return Object.entries(frequency)
            .sort(([, a], [, b]) => b - a)[0]?.[0] || '';
    }

    calculateTextDensity(text) {
        const totalChars = text.length;
        if (totalChars === 0) return 0;
        const meaningfulChars = text.replace(/\s/g, '').length;
        return Math.round((meaningfulChars / totalChars) * 100) / 100;
    }

    // ─────────────────────────────────────────────
    // 결과 포맷팅 (analysis-ui.js가 사용하는 출력 계약)
    // ─────────────────────────────────────────────

    /**
     * 분석 결과를 사용자 친화적 형태로 포맷팅
     */
    formatAnalysisResults(analysis) {
        return {
            sentiment: this.formatSentimentResult(analysis.sentiment),
            keywords: this.formatKeywordsResult(analysis.keywords),
            readability: this.formatReadabilityResult(analysis.readability),
            writingStyle: this.formatWritingStyleResult(analysis.writingStyle)
        };
    }

    formatSentimentResult(sentiment) {
        const sentimentLabels = {
            positive: '긍정적',
            negative: '부정적',
            neutral: '중성적'
        };

        const emotionalWords = sentiment.details.positive + sentiment.details.negative;

        return {
            label: sentimentLabels[sentiment.sentiment] || '알 수 없음',
            score: sentiment.score,
            intensity: sentiment.intensity !== undefined ? sentiment.intensity : 0.5,
            confidence: `${Math.round(sentiment.confidence * 100)}%`,
            description: this.getSentimentDescription(
                sentiment.sentiment, sentiment.score, emotionalWords, sentiment.confidence, sentiment.intensity
            )
        };
    }

    formatKeywordsResult(keywords) {
        if (!keywords || keywords.length === 0) return [];
        const topFrequency = keywords[0].frequency || 1;

        return keywords.map(keyword => ({
            ...keyword,
            bar: Math.round((keyword.frequency / topFrequency) * 100)
        }));
    }

    formatReadabilityResult(readability) {
        const levelLabels = {
            very_easy: '매우 쉬움',
            easy: '쉬움',
            medium: '보통',
            hard: '어려움',
            very_hard: '매우 어려움'
        };

        return {
            score: readability.score,
            level: levelLabels[readability.level] || '알 수 없음',
            description: this.getReadabilityDescription(readability.level),
            ...readability.details
        };
    }

    formatWritingStyleResult(style) {
        const formalityLabels = {
            formal: '격식적',
            informal: '비격식적',
            neutral: '중성적'
        };

        const toneLabels = {
            questioning: '의문적',
            excited: '흥미진진한',
            personal: '개인적',
            objective: '객관적',
            neutral: '중성적'
        };

        return {
            formality: formalityLabels[style.formality] || '알 수 없음',
            tone: toneLabels[style.tone] || '알 수 없음',
            features: style.features
        };
    }

    getSentimentDescription(sentiment, score, emotionalWords = 1, confidence = 1, intensity = 0.5) {
        if (!emotionalWords) {
            return '감정을 나타내는 표현이 발견되지 않았습니다';
        }
        // 완화 부사가 쓰였으면(강도 0.5 미만) '매우'로 단정하지 않는다.
        // 부사가 없으면 강도가 정확히 0.5이므로 기존 판정이 그대로 유지된다
        // 강조 부사가 쓰였다면 감정어가 조금 적어도 강한 표현으로 인정한다
        const confidenceFloor = intensity > 0.5 ? 0.6 : 0.7;
        const emphatic = score !== 0 && confidence > confidenceFloor && intensity >= 0.5;
        if (sentiment === 'positive') {
            return (emphatic && score > 0.6) ? '매우 긍정적인 내용입니다' : '약간 긍정적인 내용입니다';
        }
        if (sentiment === 'negative') {
            return (emphatic && score < -0.6) ? '매우 부정적인 내용입니다' : '약간 부정적인 내용입니다';
        }
        if (confidence < this.SENTIMENT_MIN_CONFIDENCE) {
            // 표본이 부족한 경우와 양쪽이 팽팽한 경우를 구분해 알린다
            return emotionalWords < 3
                ? '감정 표현이 적어 뚜렷한 경향을 판단하기 어렵습니다'
                : '긍정과 부정 표현이 섞여 있어 한쪽으로 단정하기 어렵습니다';
        }
        return '긍정과 부정 표현이 비슷하게 섞여 있습니다';
    }

    getReadabilityDescription(level) {
        const descriptions = {
            very_easy: '초등학생도 쉽게 읽을 수 있는 수준입니다',
            easy: '일반인이 읽기 쉬운 수준입니다',
            medium: '평균적인 읽기 난이도입니다',
            hard: '전문적인 내용으로 읽기가 다소 어렵습니다',
            very_hard: '매우 복잡하고 전문적인 내용입니다'
        };
        return descriptions[level] || '읽기 난이도를 판단할 수 없습니다';
    }
}

// 전역 인스턴스 생성
window.advancedAnalyzer = new AdvancedTextAnalyzer();
