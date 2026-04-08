/**
 * 공통 유틸리티 함수 모듈
 * 여러 페이지에서 재사용되는 함수들을 모듈화
 */

// DOM 유틸리티
const DOMUtils = {
    /**
     * querySelector의 래퍼 함수 - 요소가 없을 때 에러 처리
     * @param {string} selector - CSS 선택자
     * @param {HTMLElement} container - 검색할 컨테이너 (기본값: document)
     * @returns {HTMLElement|null}
     */
    getElement(selector, container = document) {
        try {
            return container.querySelector(selector);
        } catch (error) {
            console.error(`요소를 찾을 수 없습니다: ${selector}`, error);
            return null;
        }
    },

    /**
     * querySelectorAll의 래퍼 함수
     * @param {string} selector - CSS 선택자
     * @param {HTMLElement} container - 검색할 컨테이너 (기본값: document)
     * @returns {NodeList}
     */
    getElements(selector, container = document) {
        try {
            return container.querySelectorAll(selector);
        } catch (error) {
            console.error(`요소들을 찾을 수 없습니다: ${selector}`, error);
            return [];
        }
    },

    /**
     * 이벤트 리스너 추가 (에러 처리 포함)
     * @param {HTMLElement|string} element - 요소 또는 선택자
     * @param {string} event - 이벤트 타입
     * @param {Function} handler - 이벤트 핸들러
     * @param {Object} options - 이벤트 옵션
     */
    addEvent(element, event, handler, options = {}) {
        const el = typeof element === 'string' ? this.getElement(element) : element;
        if (el) {
            el.addEventListener(event, handler, options);
        }
    },

    /**
     * 여러 요소에 이벤트 리스너 추가
     * @param {string} selector - CSS 선택자
     * @param {string} event - 이벤트 타입
     * @param {Function} handler - 이벤트 핸들러
     */
    addEventToAll(selector, event, handler) {
        this.getElements(selector).forEach(el => {
            el.addEventListener(event, handler);
        });
    }
};

// 숫자 포맷 유틸리티
const NumberUtils = {
    /**
     * 숫자에 천단위 콤마 추가
     * @param {number|string} num - 포맷할 숫자
     * @returns {string}
     */
    addCommas(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },

    /**
     * 퍼센트 계산
     * @param {number} value - 값
     * @param {number} total - 전체 값
     * @param {number} decimals - 소수점 자리수
     * @returns {string}
     */
    calculatePercent(value, total, decimals = 1) {
        if (total === 0) return '0';
        return ((value / total) * 100).toFixed(decimals);
    }
};

// 시간 유틸리티
const TimeUtils = {
    /**
     * 밀리초를 분:초 형식으로 변환
     * @param {number} ms - 밀리초
     * @returns {string}
     */
    msToMinSec(ms) {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    },

    /**
     * 현재 시간을 한국어 형식으로 반환
     * @returns {string}
     */
    getCurrentTimeKR() {
        return new Date().toLocaleString('ko-KR');
    }
};

// 애니메이션 유틸리티
const AnimationUtils = {
    /**
     * 요소에 페이드인 효과 적용
     * @param {HTMLElement} element - 대상 요소
     * @param {number} duration - 지속 시간(ms)
     */
    fadeIn(element, duration = 300) {
        element.style.opacity = '0';
        element.style.display = 'block';
        
        const start = performance.now();
        const animate = (time) => {
            const elapsed = time - start;
            const progress = Math.min(elapsed / duration, 1);
            element.style.opacity = progress;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    },

    /**
     * 요소에 페이드아웃 효과 적용
     * @param {HTMLElement} element - 대상 요소
     * @param {number} duration - 지속 시간(ms)
     */
    fadeOut(element, duration = 300) {
        const start = performance.now();
        const initialOpacity = parseFloat(window.getComputedStyle(element).opacity);
        
        const animate = (time) => {
            const elapsed = time - start;
            const progress = Math.min(elapsed / duration, 1);
            element.style.opacity = initialOpacity * (1 - progress);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.style.display = 'none';
            }
        };
        
        requestAnimationFrame(animate);
    }
};

// 검증 유틸리티
const ValidationUtils = {
    /**
     * 이메일 형식 검증
     * @param {string} email - 검증할 이메일
     * @returns {boolean}
     */
    isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    /**
     * 숫자만 포함되어 있는지 검증
     * @param {string} str - 검증할 문자열
     * @returns {boolean}
     */
    isNumeric(str) {
        return /^\d+$/.test(str);
    },

    /**
     * 한글 포함 여부 검증
     * @param {string} str - 검증할 문자열
     * @returns {boolean}
     */
    hasKorean(str) {
        return /[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(str);
    }
};

// 모듈 내보내기
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        DOMUtils,
        NumberUtils,
        TimeUtils,
        AnimationUtils,
        ValidationUtils
    };
}