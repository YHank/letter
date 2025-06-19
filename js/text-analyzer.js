/**
 * TextAnalyzer 모듈 - 텍스트 분석 및 통계 계산
 * 한국어와 영어를 모두 지원하는 텍스트 분석 유틸리티
 */
class TextAnalyzer {
    constructor() {
        this.koreanReadingSpeed = 400; // 분당 글자수
        this.englishReadingSpeed = 225; // 분당 단어수
        this.japaneseReadingSpeed = 300; // 분당 글자수
        this.chineseReadingSpeed = 350; // 분당 글자수
        this.currentLanguage = 'ko'; // 기본 언어
    }

    /**
     * 문장 수 계산
     * @param {string} text - 분석할 텍스트
     * @returns {number} 문장 수
     */
    countSentences(text) {
        if (!text || text.trim() === '') return 0;
        
        // 한국어와 영어 문장 종결 부호를 모두 고려
        const sentences = text.match(/[^.!?。！？]+[.!?。！？]+/g) || [];
        return sentences.length;
    }

    /**
     * 단어 수 계산 (한국어/영어 혼합 지원)
     * @param {string} text - 분석할 텍스트
     * @returns {number} 단어 수
     */
    countWords(text) {
        if (!text || text.trim() === '') return 0;

        // 공백과 줄바꿈으로 분리
        const words = text.trim().split(/\s+/).filter(word => word.length > 0);
        return words.length;
    }

    /**
     * 글자수 계산 (공백 포함/제외)
     * @param {string} text - 분석할 텍스트
     * @param {boolean} includeSpaces - 공백 포함 여부
     * @returns {number} 글자수
     */
    countCharacters(text, includeSpaces = true) {
        if (!text) return 0;
        
        if (includeSpaces) {
            return text.length;
        } else {
            return text.replace(/\s/g, '').length;
        }
    }

    /**
     * 라인 수 계산
     * @param {string} text - 분석할 텍스트
     * @returns {number} 라인 수
     */
    countLines(text) {
        if (!text) return 0;
        
        // 빈 줄 제외하고 계산
        const lines = text.split('\n').filter(line => line.trim().length > 0);
        return lines.length;
    }

    /**
     * 단락 수 계산
     * @param {string} text - 분석할 텍스트
     * @returns {number} 단락 수
     */
    countParagraphs(text) {
        if (!text || text.trim() === '') return 0;
        
        // 연속된 빈 줄로 구분된 단락 계산
        const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
        return paragraphs.length;
    }

    /**
     * 평균 단어 길이 계산
     * @param {string} text - 분석할 텍스트
     * @returns {number} 평균 단어 길이 (소수점 1자리)
     */
    calculateAverageWordLength(text) {
        const words = text.trim().split(/\s+/).filter(word => word.length > 0);
        if (words.length === 0) return 0;
        
        const totalLength = words.reduce((sum, word) => sum + word.length, 0);
        return parseFloat((totalLength / words.length).toFixed(1));
    }

    /**
     * 읽기 시간 계산 (다국어 지원)
     * @param {string} text - 분석할 텍스트
     * @returns {string} 읽기 시간 (예: "2분", "30초")
     */
    calculateReadingTime(text) {
        if (!text || text.trim() === '') {
            return this.getLocalizedTimeUnit(0, 'seconds');
        }
        
        const language = this.detectLanguage(text);
        let minutes = 0;
        
        // 언어별 읽기 속도 적용
        if (language === 'english') {
            const wordCount = this.countWords(text);
            minutes = wordCount / this.englishReadingSpeed;
        } else if (language === 'japanese') {
            const charCount = this.countCharacters(text, false);
            minutes = charCount / this.japaneseReadingSpeed;
        } else if (language === 'mixed') {
            // 혼합된 텍스트의 경우 평균 속도 사용
            const charCount = this.countCharacters(text, false);
            minutes = charCount / ((this.koreanReadingSpeed + this.englishReadingSpeed) / 2);
        } else {
            // 한국어, 중국어 등
            const charCount = this.countCharacters(text, false);
            const speed = language === 'chinese' ? this.chineseReadingSpeed : this.koreanReadingSpeed;
            minutes = charCount / speed;
        }
        
        return this.formatReadingTime(minutes);
    }

    /**
     * 읽기 시간 포맷팅
     */
    formatReadingTime(minutes) {
        if (minutes < 1) {
            const seconds = Math.ceil(minutes * 60);
            return this.getLocalizedTimeUnit(seconds, 'seconds');
        } else if (minutes < 60) {
            const roundedMinutes = Math.ceil(minutes);
            return this.getLocalizedTimeUnit(roundedMinutes, 'minutes');
        } else {
            const hours = Math.floor(minutes / 60);
            const remainingMinutes = Math.ceil(minutes % 60);
            if (remainingMinutes > 0) {
                return `${this.getLocalizedTimeUnit(hours, 'hours')} ${this.getLocalizedTimeUnit(remainingMinutes, 'minutes')}`;
            } else {
                return this.getLocalizedTimeUnit(hours, 'hours');
            }
        }
    }

    /**
     * 현지화된 시간 단위 반환
     */
    getLocalizedTimeUnit(value, unit) {
        if (window.i18nManager) {
            const unitText = window.i18nManager.t(`time_units.${unit}`, this.getDefaultTimeUnit(unit));
            return `${value}${unitText}`;
        }
        return `${value}${this.getDefaultTimeUnit(unit)}`;
    }

    /**
     * 기본 시간 단위 반환
     */
    getDefaultTimeUnit(unit) {
        const defaults = {
            'seconds': '초',
            'minutes': '분', 
            'hours': '시간'
        };
        return defaults[unit] || '';
    }

    /**
     * 텍스트 언어 감지 (다국어 지원)
     * @param {string} text - 분석할 텍스트
     * @returns {string} 언어 타입 ('korean', 'english', 'japanese', 'chinese', 'mixed', 'other')
     */
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

    /**
     * 모든 텍스트 통계를 한번에 계산
     * @param {string} text - 분석할 텍스트
     * @returns {Object} 전체 통계 객체
     */
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
                readingTime: '0초',
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
            readingTime: this.calculateReadingTime(text),
            language: this.detectLanguage(text)
        };
    }

    /**
     * 텍스트 변환 유틸리티들
     */
    transform = {
        uppercase: (text) => text.toUpperCase(),
        lowercase: (text) => text.toLowerCase(),
        capitalize: (text) => text.replace(/\b\w/g, l => l.toUpperCase()),
        removeSpecial: (text) => text.replace(/[^\w\sㄱ-ㅎㅏ-ㅣ가-힣]/g, ''),
        removeSpaces: (text) => text.replace(/\s/g, ''),
        trimLines: (text) => text.split('\n').map(line => line.trim()).join('\n'),
        clear: () => ''
    };
}

// 전역 인스턴스 생성
window.textAnalyzer = new TextAnalyzer();