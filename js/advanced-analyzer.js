/**
 * 고급 텍스트 분석 모듈
 * 감정 분석, 키워드 추출, 가독성 점수, 문체 분석 등 고급 기능 제공
 */

class AdvancedTextAnalyzer {
    constructor() {
        // 감정 분석용 키워드 데이터베이스
        this.sentimentKeywords = {
            positive: {
                ko: ['좋다', '훌륭하다', '멋지다', '완벽하다', '행복하다', '기쁘다', '사랑', '감사', '성공', '우수하다', '뛰어나다', '만족', '즐겁다', '편안하다', '안전하다'],
                en: ['good', 'great', 'excellent', 'perfect', 'happy', 'love', 'amazing', 'wonderful', 'fantastic', 'awesome', 'brilliant', 'outstanding', 'magnificent', 'marvelous', 'superb']
            },
            negative: {
                ko: ['나쁘다', '싫다', '슬프다', '화나다', '짜증', '실망', '걱정', '무서워', '힘들다', '어렵다', '문제', '실패', '끔찍하다', '최악', '고통'],
                en: ['bad', 'terrible', 'awful', 'horrible', 'sad', 'angry', 'hate', 'worst', 'fail', 'problem', 'difficult', 'pain', 'worry', 'fear', 'disappoint']
            }
        };

        // 불용어 (분석에서 제외할 단어들)
        this.stopWords = {
            ko: ['이', '그', '저', '것', '의', '가', '을', '를', '에', '에서', '로', '으로', '와', '과', '도', '만', '께서', '에게', '한테', '부터', '까지', '처럼', '같이'],
            en: ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did']
        };

        // 가독성 분석 기준
        this.readabilityStandards = {
            sentenceLength: { easy: 15, medium: 25, hard: 35 },
            wordLength: { easy: 4, medium: 6, hard: 8 },
            syllableCount: { easy: 2, medium: 3, hard: 4 }
        };
    }

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
        const words = this.extractWords(text, language);
        
        let positiveCount = 0;
        let negativeCount = 0;
        
        const positiveWords = this.sentimentKeywords.positive[language] || this.sentimentKeywords.positive.en;
        const negativeWords = this.sentimentKeywords.negative[language] || this.sentimentKeywords.negative.en;

        words.forEach(word => {
            const lowerWord = word.toLowerCase();
            if (positiveWords.some(pw => lowerWord.includes(pw) || pw.includes(lowerWord))) {
                positiveCount++;
            }
            if (negativeWords.some(nw => lowerWord.includes(nw) || nw.includes(lowerWord))) {
                negativeCount++;
            }
        });

        const totalEmotionalWords = positiveCount + negativeCount;
        const totalWords = words.length;
        
        let sentiment = 'neutral';
        let score = 0;
        let confidence = 0;

        if (totalEmotionalWords > 0) {
            score = (positiveCount - negativeCount) / totalWords;
            confidence = totalEmotionalWords / totalWords;
            
            if (score > 0.05) sentiment = 'positive';
            else if (score < -0.05) sentiment = 'negative';
        }

        return {
            sentiment,
            score: Math.round(score * 100) / 100,
            confidence: Math.round(confidence * 100) / 100,
            details: {
                positive: positiveCount,
                negative: negativeCount,
                neutral: totalWords - totalEmotionalWords
            }
        };
    }

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
        
        // 불용어 제거 및 빈도 계산
        const wordFreq = {};
        words.forEach(word => {
            const cleanWord = word.toLowerCase().replace(/[^\w가-힣]/g, '');
            if (cleanWord.length > 2 && !stopWords.includes(cleanWord)) {
                wordFreq[cleanWord] = (wordFreq[cleanWord] || 0) + 1;
            }
        });

        // 빈도순으로 정렬
        const sortedKeywords = Object.entries(wordFreq)
            .sort(([,a], [,b]) => b - a)
            .slice(0, maxKeywords)
            .map(([word, frequency]) => ({
                word,
                frequency,
                percentage: Math.round((frequency / words.length) * 100 * 100) / 100
            }));

        return sortedKeywords;
    }

    /**
     * 가독성 점수 계산
     * @param {string} text - 분석할 텍스트
     * @returns {Object} 가독성 분석 결과
     */
    calculateReadability(text) {
        if (!text || text.trim() === '') {
            return {
                score: 0,
                level: 'unknown',
                details: {}
            };
        }

        const sentences = this.splitIntoSentences(text);
        const words = this.extractWords(text);
        const syllables = this.countTotalSyllables(text);

        if (sentences.length === 0 || words.length === 0) {
            return {
                score: 0,
                level: 'unknown',
                details: {}
            };
        }

        // 기본 지표 계산
        const avgSentenceLength = words.length / sentences.length;
        const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
        const avgSyllablesPerWord = syllables / words.length;

        // 가독성 점수 계산 (0-100, 높을수록 읽기 쉬움)
        let score = 100;
        
        // 문장 길이 패널티
        if (avgSentenceLength > this.readabilityStandards.sentenceLength.hard) {
            score -= 30;
        } else if (avgSentenceLength > this.readabilityStandards.sentenceLength.medium) {
            score -= 15;
        }

        // 단어 길이 패널티
        if (avgWordLength > this.readabilityStandards.wordLength.hard) {
            score -= 20;
        } else if (avgWordLength > this.readabilityStandards.wordLength.medium) {
            score -= 10;
        }

        // 음절 복잡도 패널티
        if (avgSyllablesPerWord > this.readabilityStandards.syllableCount.hard) {
            score -= 15;
        } else if (avgSyllablesPerWord > this.readabilityStandards.syllableCount.medium) {
            score -= 8;
        }

        score = Math.max(0, Math.min(100, score));

        // 가독성 수준 결정
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
                avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
                avgWordLength: Math.round(avgWordLength * 10) / 10,
                avgSyllablesPerWord: Math.round(avgSyllablesPerWord * 10) / 10,
                totalSentences: sentences.length,
                totalWords: words.length,
                totalSyllables: syllables
            }
        };
    }

    /**
     * 문체 분석
     * @param {string} text - 분석할 텍스트
     * @returns {Object} 문체 분석 결과
     */
    analyzeWritingStyle(text) {
        if (!text || text.trim() === '') {
            return {
                formality: 'unknown',
                tone: 'unknown',
                features: {}
            };
        }

        const sentences = this.splitIntoSentences(text);
        const words = this.extractWords(text);
        
        // 문체 특징 분석
        const features = {
            questionCount: (text.match(/[?？]/g) || []).length,
            exclamationCount: (text.match(/[!！]/g) || []).length,
            declarativeCount: sentences.length - ((text.match(/[?？!！]/g) || []).length),
            firstPersonCount: this.countFirstPersonPronouns(text),
            passiveVoiceCount: this.countPassiveVoice(text),
            complexSentenceCount: sentences.filter(s => s.split(/[,，;；]/).length > 2).length
        };

        // 격식성 판단
        let formality = 'neutral';
        const formalityScore = this.calculateFormalityScore(text, features);
        if (formalityScore > 0.6) formality = 'formal';
        else if (formalityScore < 0.4) formality = 'informal';

        // 어조 판단
        let tone = 'neutral';
        if (features.questionCount > sentences.length * 0.3) tone = 'questioning';
        else if (features.exclamationCount > sentences.length * 0.2) tone = 'excited';
        else if (features.firstPersonCount > words.length * 0.05) tone = 'personal';
        else if (features.passiveVoiceCount > sentences.length * 0.4) tone = 'objective';

        return {
            formality,
            tone,
            features: {
                ...features,
                avgSentenceComplexity: Math.round((features.complexSentenceCount / sentences.length) * 100) / 100,
                punctuationDiversity: this.calculatePunctuationDiversity(text)
            }
        };
    }

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
        const uniqueWords = new Set(words.map(w => w.toLowerCase())).size;
        
        return {
            vocabularyRichness: Math.round((uniqueWords / words.length) * 100) / 100,
            averageSentenceLength: Math.round((words.length / sentences.length) * 10) / 10,
            longestWord: words.reduce((longest, word) => word.length > longest.length ? word : longest, ''),
            mostFrequentWord: this.getMostFrequentWord(words),
            textDensity: this.calculateTextDensity(text)
        };
    }

    // 유틸리티 메서드들

    detectPrimaryLanguage(text) {
        const koreanChars = (text.match(/[\uAC00-\uD7AF]/g) || []).length;
        const englishChars = (text.match(/[a-zA-Z]/g) || []).length;
        return koreanChars > englishChars ? 'ko' : 'en';
    }

    extractWords(text, language = null) {
        if (!language) language = this.detectPrimaryLanguage(text);
        
        if (language === 'ko') {
            return text.match(/[\uAC00-\uD7AF]+|[a-zA-Z]+/g) || [];
        } else {
            return text.match(/[a-zA-Z]+/g) || [];
        }
    }

    splitIntoSentences(text) {
        return text.split(/[.!?。！？]+/).filter(s => s.trim().length > 0);
    }

    countTotalSyllables(text) {
        const koreanChars = (text.match(/[\uAC00-\uD7AF]/g) || []).length;
        const englishWords = (text.match(/[a-zA-Z]+/g) || []);
        const englishSyllables = englishWords.reduce((count, word) => {
            return count + Math.max(1, word.match(/[aeiouAEIOU]/g)?.length || 1);
        }, 0);
        
        return koreanChars + englishSyllables;
    }

    countFirstPersonPronouns(text) {
        const pronouns = {
            ko: ['나는', '내가', '나도', '제가', '저는', '저도'],
            en: ['I', 'me', 'my', 'myself', 'we', 'us', 'our']
        };
        
        const language = this.detectPrimaryLanguage(text);
        const targetPronouns = pronouns[language] || pronouns.en;
        
        return targetPronouns.reduce((count, pronoun) => {
            const regex = new RegExp(pronoun, 'gi');
            return count + (text.match(regex) || []).length;
        }, 0);
    }

    countPassiveVoice(text) {
        const passiveMarkers = {
            ko: ['되다', '어지다', '아지다', '받다'],
            en: ['was', 'were', 'been', 'being']
        };
        
        const language = this.detectPrimaryLanguage(text);
        const markers = passiveMarkers[language] || passiveMarkers.en;
        
        return markers.reduce((count, marker) => {
            const regex = new RegExp(marker, 'gi');
            return count + (text.match(regex) || []).length;
        }, 0);
    }

    calculateFormalityScore(text, features) {
        let score = 0.5; // 중성값
        
        // 복잡한 문장 구조는 격식성을 높임
        if (features.complexSentenceCount > 0) {
            score += (features.complexSentenceCount / this.splitIntoSentences(text).length) * 0.3;
        }
        
        // 1인칭 대명사는 격식성을 낮춤
        if (features.firstPersonCount > 0) {
            score -= (features.firstPersonCount / this.extractWords(text).length) * 0.4;
        }
        
        // 느낌표는 격식성을 낮춤
        if (features.exclamationCount > 0) {
            score -= (features.exclamationCount / this.splitIntoSentences(text).length) * 0.2;
        }
        
        return Math.max(0, Math.min(1, score));
    }

    calculatePunctuationDiversity(text) {
        const punctuations = text.match(/[.,!?;:()'"]/g) || [];
        const uniquePunctuations = new Set(punctuations);
        return uniquePunctuations.size;
    }

    getMostFrequentWord(words) {
        const frequency = {};
        words.forEach(word => {
            const cleanWord = word.toLowerCase();
            frequency[cleanWord] = (frequency[cleanWord] || 0) + 1;
        });
        
        return Object.entries(frequency)
            .sort(([,a], [,b]) => b - a)[0]?.[0] || '';
    }

    calculateTextDensity(text) {
        const totalChars = text.length;
        const meaningfulChars = text.replace(/\s/g, '').length;
        return Math.round((meaningfulChars / totalChars) * 100) / 100;
    }

    /**
     * 분석 결과를 사용자 친화적 형태로 포맷팅
     */
    formatAnalysisResults(analysis) {
        const formatted = {
            sentiment: this.formatSentimentResult(analysis.sentiment),
            keywords: this.formatKeywordsResult(analysis.keywords),
            readability: this.formatReadabilityResult(analysis.readability),
            writingStyle: this.formatWritingStyleResult(analysis.writingStyle)
        };

        return formatted;
    }

    formatSentimentResult(sentiment) {
        const sentimentLabels = {
            positive: '긍정적',
            negative: '부정적', 
            neutral: '중성적'
        };

        return {
            label: sentimentLabels[sentiment.sentiment] || '알 수 없음',
            score: sentiment.score,
            confidence: `${Math.round(sentiment.confidence * 100)}%`,
            description: this.getSentimentDescription(sentiment.sentiment, sentiment.score)
        };
    }

    formatKeywordsResult(keywords) {
        return keywords.map(keyword => ({
            ...keyword,
            bar: Math.round((keyword.frequency / keywords[0].frequency) * 100)
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

    getSentimentDescription(sentiment, score) {
        if (sentiment === 'positive') {
            return score > 0.1 ? '매우 긍정적인 내용입니다' : '약간 긍정적인 내용입니다';
        } else if (sentiment === 'negative') {
            return score < -0.1 ? '매우 부정적인 내용입니다' : '약간 부정적인 내용입니다';
        }
        return '감정적 색채가 뚜렷하지 않은 중성적인 내용입니다';
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