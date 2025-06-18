// This module will contain functions related to text analysis.

/**
 * 문장의 개수를 계산합니다.
 * 한국어와 영어 문장 종결 부호('.', '!', '?', '。', '！', '？')를 기준으로 합니다.
 * @param {string} text - 분석할 텍스트입니다.
 * @returns {number} 감지된 문장의 수입니다.
 */
function countSentences(text) {
    if (typeof text !== 'string' || text.trim() === '') return 0;
    // 한국어와 영어 문장 종결 부호를 모두 고려
    const sentences = text.match(/[^.!?。！？\s]+(?:[.!?。！？]+["']?\s*|$)/g) || [];
    return sentences.length;
}

/**
 * 텍스트 내 단어들의 평균 길이를 계산합니다.
 * 단어는 공백으로 구분됩니다.
 * @param {string} text - 분석할 텍스트입니다.
 * @returns {number} 단어의 평균 길이 (소수점 첫째 자리까지). 단어가 없으면 0을 반환합니다.
 */
function calculateAverageWordLength(text) {
    if (typeof text !== 'string') return 0;
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    if (words.length === 0) return 0;

    const totalLength = words.reduce((sum, word) => sum + word.length, 0);
    // toFixed returns a string, so parseFloat to return a number
    return parseFloat((totalLength / words.length).toFixed(1));
}

/**
 * 텍스트를 읽는 데 걸리는 예상 시간을 계산합니다.
 * 현재는 한국어 기준(분당 약 400자)으로 단순 계산합니다.
 * @param {string} text - 분석할 텍스트입니다.
 * @returns {string} 예상 읽기 시간 문자열 (예: "1분 미만", "약 5분", "약 1시간 10분").
 */
function calculateReadingTime(text) {
    if (typeof text !== 'string' || text.trim() === '') return '0분'; // Changed default to '0분'

    const charCount = text.replace(/\s/g, '').length;
    if (charCount === 0) return '0분'; // Changed default to '0분'

    // 한국어 평균 읽기 속도: 분당 300-500자 (여기서는 평균 400자로 가정)
    // TODO: 영어 텍스트에 대한 분당 단어 수(WPM) 기반 계산 로직 추가 고려
    const minutes = charCount / 400;

    if (minutes < 1) {
        return "1분 미만";
    } else if (minutes < 60) {
        return `약 ${Math.ceil(minutes)}분`;
    } else {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = Math.ceil(minutes % 60);
        if (remainingMinutes === 0) {
            return `약 ${hours}시간`;
        }
        return `약 ${hours}시간 ${remainingMinutes}분`;
    }
}

/**
 * 텍스트 내 단락의 개수를 계산합니다.
 * 두 개 이상의 연속된 줄바꿈 문자를 단락 구분으로 간주합니다.
 * 텍스트가 있지만 명시적인 단락 구분이 없으면 1개 단락으로 봅니다.
 * @param {string} text - 분석할 텍스트입니다.
 * @returns {number} 감지된 단락의 수입니다.
 */
function countParagraphs(text) {
    if (typeof text !== 'string' || text.trim() === '') return 0;

    // 두 개 이상의 연속된 줄바꿈을 단락 구분으로 간주
    // 또한, 텍스트 시작/끝의 빈 줄은 무시
    const paragraphs = text.trim().split(/\n\s*\n+/);
    // 각 단락이 실제 내용을 가지고 있는지 확인 (공백만 있는 단락 제외)
    const validParagraphs = paragraphs.filter(para => para.trim().length > 0);

    return validParagraphs.length === 0 && text.trim().length > 0 ? 1 : validParagraphs.length;
}

// Node.js 환경에서 실행되는 테스트를 위해 export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        countSentences,
        calculateAverageWordLength,
        calculateReadingTime,
        countParagraphs
    };
}
// 브라우저 환경에서는 전역 함수로 사용됩니다.
// (또는 IIFE를 사용하여 네임스페이스를 만들고 그 안에 함수들을 넣을 수 있습니다.)
// 예: const TextAnalysisUtils = (() => { ... return { countSentences, ... } })();
// window.TextAnalysisUtils = TextAnalysisUtils;
