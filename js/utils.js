/**
 * @file 공통 유틸리티 함수 모듈
 * @description 여러 페이지 및 모듈에서 재사용되는 다양한 헬퍼 함수들을 제공합니다.
 * 이 모듈은 DOM 조작, 로컬 저장소 관리, 숫자 포맷팅, 시간 계산,
 * 기본 애니메이션, 입력값 검증, 문자열 처리 등의 유틸리티를 포함합니다.
 */

// --- DOM 유틸리티 ---
/**
 * @namespace DOMUtils
 * @description DOM 조작과 관련된 유틸리티 함수 집합입니다.
 */
const DOMUtils = {
    /**
     * 지정된 CSS 선택자에 해당하는 첫 번째 요소를 반환합니다.
     * @memberof DOMUtils
     * @param {string} selector - CSS 선택자 문자열입니다.
     * @param {Document|Element} [container=document] - 검색을 시작할 컨테이너 요소입니다. 기본값은 document입니다.
     * @returns {HTMLElement|null} 찾은 요소를 반환하거나, 없으면 null을 반환합니다. 오류 발생 시 콘솔에 오류를 기록합니다.
     * @example const mainElement = DOMUtils.getElement('#main');
     */
    getElement(selector, container = document) {
        try {
            return container.querySelector(selector);
        } catch (error) {
            console.error(`[DOMUtils] 요소를 찾을 수 없습니다: ${selector}`, error);
            return null;
        }
    },

    /**
     * 지정된 CSS 선택자에 해당하는 모든 요소를 NodeList로 반환합니다.
     * @memberof DOMUtils
     * @param {string} selector - CSS 선택자 문자열입니다.
     * @param {Document|Element} [container=document] - 검색을 시작할 컨테이너 요소입니다. 기본값은 document입니다.
     * @returns {NodeListOf<Element>|Array<Element>} 찾은 요소들의 NodeList를 반환합니다. 오류 발생 시 빈 배열을 반환하고 콘솔에 오류를 기록합니다.
     * @example const buttons = DOMUtils.getElements('.btn');
     */
    getElements(selector, container = document) {
        try {
            return container.querySelectorAll(selector);
        } catch (error) {
            console.error(`[DOMUtils] 요소들을 찾을 수 없습니다: ${selector}`, error);
            return [];
        }
    },

    /**
     * 요소 또는 선택자에 해당하는 요소에 이벤트 리스너를 추가합니다.
     * @memberof DOMUtils
     * @param {HTMLElement|Window|Document|string} element - 이벤트를 추가할 HTMLElement, Window, Document 객체 또는 CSS 선택자입니다.
     * @param {string} event - 추가할 이벤트 타입입니다 (예: 'click', 'mouseover').
     * @param {Function} handler - 실행할 이벤트 핸들러 함수입니다.
     * @param {Object} [options={}] - 이벤트 리스너 옵션 객체입니다.
     * @example DOMUtils.addEvent('#myButton', 'click', () => console.log('Clicked!'));
     */
    addEvent(element, event, handler, options = {}) {
        const el = typeof element === 'string' ? this.getElement(element) : element;
        if (el) {
            el.addEventListener(event, handler, options);
        } else {
            // console.warn(`[DOMUtils] 이벤트 리스너를 추가할 요소를 찾지 못했습니다: ${element}`);
        }
    },

    /**
     * 지정된 CSS 선택자에 해당하는 모든 요소에 동일한 이벤트 리스너를 추가합니다.
     * @memberof DOMUtils
     * @param {string} selector - 이벤트를 추가할 요소들을 가리키는 CSS 선택자입니다.
     * @param {string} event - 추가할 이벤트 타입입니다.
     * @param {Function} handler - 실행할 이벤트 핸들러 함수입니다.
     * @example DOMUtils.addEventToAll('.item', 'click', function() { this.classList.toggle('active'); });
     */
    addEventToAll(selector, event, handler) {
        this.getElements(selector).forEach(el => {
            el.addEventListener(event, handler);
        });
    }
};

// --- 저장소 유틸리티 ---
/**
 * @namespace StorageUtils
 * @description localStorage와 관련된 유틸리티 함수 집합입니다. JSON 직렬화/역직렬화를 자동으로 처리합니다.
 */
const StorageUtils = {
    /**
     * localStorage에 데이터를 저장합니다. 값은 JSON 문자열로 변환됩니다.
     * @memberof StorageUtils
     * @param {string} key - 데이터를 저장할 키입니다.
     * @param {*} value - 저장할 값입니다. 모든 타입이 가능하며, JSON으로 직렬화됩니다.
     * @returns {boolean} 저장 성공 시 true, 실패 시 false를 반환합니다.
     * @example StorageUtils.save('userSettings', { theme: 'dark', notifications: true });
     */
    save(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`[StorageUtils] 저장 실패 (key: ${key}):`, error);
            return false;
        }
    },

    /**
     * localStorage에서 데이터를 로드합니다. JSON 문자열은 자동으로 객체로 파싱됩니다.
     * @memberof StorageUtils
     * @param {string} key - 데이터를 로드할 키입니다.
     * @param {*} [defaultValue=null] - 키에 해당하는 데이터가 없을 경우 반환할 기본값입니다.
     * @returns {*} 로드한 데이터 또는 기본값을 반환합니다. 파싱 실패 시 기본값을 반환하고 오류를 기록합니다.
     * @example const settings = StorageUtils.load('userSettings', { theme: 'light' });
     */
    load(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error(`[StorageUtils] 로드 실패 (key: ${key}):`, error);
            return defaultValue;
        }
    },

    /**
     * localStorage에서 지정된 키의 데이터를 삭제합니다.
     * @memberof StorageUtils
     * @param {string} key - 삭제할 데이터의 키입니다.
     * @returns {boolean} 삭제 성공 시 true, 실패 시 false를 반환합니다.
     * @example StorageUtils.remove('temporaryData');
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`[StorageUtils] 삭제 실패 (key: ${key}):`, error);
            return false;
        }
    }
};

// --- 숫자 포맷 및 계산 유틸리티 ---
/**
 * @namespace NumberUtils
 * @description 숫자 포맷팅 및 계산과 관련된 유틸리티 함수 집합입니다.
 */
const NumberUtils = {
    /**
     * 숫자에 천 단위 콤마를 추가하여 문자열로 반환합니다.
     * @memberof NumberUtils
     * @param {number|string} num - 포맷할 숫자 또는 숫자 형태의 문자열입니다.
     * @returns {string} 천 단위 콤마가 추가된 문자열을 반환합니다.
     * @example NumberUtils.addCommas(1234567); // "1,234,567"
     */
    addCommas(num) {
        if (num === null || num === undefined || num === '') return ''; // Handle empty string as well
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },

    /**
     * 전체 값에 대한 특정 값의 백분율을 계산합니다.
     * @memberof NumberUtils
     * @param {number} value - 백분율을 계산할 특정 값입니다.
     * @param {number} total - 전체 값입니다.
     * @param {number} [decimals=1] - 결과값의 소수점 자리수입니다.
     * @returns {string} 계산된 백분율을 문자열 형태로 반환합니다. total이 0이면 "0"을 반환합니다.
     * @example NumberUtils.calculatePercent(50, 200, 1); // "25.0"
     */
    calculatePercent(value, total, decimals = 1) {
        if (total === 0) return '0';
        return ((Number(value) / Number(total)) * 100).toFixed(decimals);
    },

    /**
     * 주어진 숫자의 계승(factorial) 값을 계산합니다.
     * @memberof NumberUtils
     * @param {number} n - 계승을 계산할 음이 아닌 정수입니다.
     * @returns {number|NaN} n의 계승 값을 반환합니다. n이 음수이거나 정수가 아니면 NaN을 반환합니다.
     * @example NumberUtils.factorial(5); // 120
     */
    factorial(n) {
        n = Number(n);
        if (n < 0 || n !== Math.floor(n) || isNaN(n)) return NaN;
        if (n === 0 || n === 1) return 1;
        let result = 1;
        for (let i = 2; i <= n; i++) {
            result *= i;
        }
        return result;
    }
};

// --- 시간 유틸리티 ---
/**
 * @namespace TimeUtils
 * @description 시간 및 날짜와 관련된 유틸리티 함수 집합입니다.
 */
const TimeUtils = {
    /**
     * 밀리초(ms)를 "분:초" 형식의 문자열로 변환합니다.
     * @memberof TimeUtils
     * @param {number} ms - 변환할 밀리초 값입니다.
     * @returns {string} "분:초" 형식의 문자열 (예: "2:05", "12:30").
     * @example TimeUtils.msToMinSec(125000); // "2:05"
     */
    msToMinSec(ms) {
        ms = Number(ms);
        if (isNaN(ms)) return "0:00";
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    },

    /**
     * 현재 시간을 한국 로케일(ko-KR)의 날짜 및 시간 문자열로 반환합니다.
     * @memberof TimeUtils
     * @returns {string} 현재 날짜 및 시간을 나타내는 현지화된 문자열입니다.
     * @example TimeUtils.getCurrentTimeKR(); // "2023. 10. 27. 오후 3:45:00" (형식은 실행 환경에 따라 다를 수 있음)
     */
    getCurrentTimeKR() {
        return new Date().toLocaleString('ko-KR');
    }
};

// --- 애니메이션 유틸리티 ---
/**
 * @namespace AnimationUtils
 * @description 기본적인 CSS 애니메이션 효과를 위한 유틸리티 함수 집합입니다.
 * 참고: 복잡한 애니메이션 요구사항에는 전문 라이브러리(예: GSAP, Anime.js) 사용을 고려하는 것이 좋습니다.
 * 이 유틸리티들은 간단한 UI 효과에 적합합니다.
 */
const AnimationUtils = {
    /**
     * 지정된 요소에 페이드인(fade-in) 효과를 적용합니다.
     * `display` 속성을 'block'으로 변경하고 `opacity`를 0에서 1로 점진적으로 증가시킵니다.
     * @memberof AnimationUtils
     * @param {HTMLElement} element - 페이드인 효과를 적용할 HTML 요소입니다.
     * @param {number} [duration=300] - 애니메이션 지속 시간(밀리초)입니다.
     * @example AnimationUtils.fadeIn(myElement, 500);
     */
    fadeIn(element, duration = 300) {
        if (!(element instanceof HTMLElement)) return;
        element.style.opacity = '0';
        // 요소의 원래 display 스타일에 따라 다를 수 있으므로, 'block'이 항상 적절하지 않을 수 있습니다.
        // data attribute나 class를 통해 원래 display 값을 기억해두는 방법도 고려할 수 있습니다.
        // 여기서는 일단 'block'으로 설정합니다.
        element.style.display = 'block';
        
        let start = null;
        const animate = (timestamp) => {
            if (!start) start = timestamp;
            const elapsed = timestamp - start;
            const progress = Math.min(elapsed / duration, 1);
            element.style.opacity = progress.toString();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        requestAnimationFrame(animate);
    },

    /**
     * 지정된 요소에 페이드아웃(fade-out) 효과를 적용합니다.
     * `opacity`를 현재 값에서 0으로 점진적으로 감소시킨 후 `display` 속성을 'none'으로 변경합니다.
     * @memberof AnimationUtils
     * @param {HTMLElement} element - 페이드아웃 효과를 적용할 HTML 요소입니다.
     * @param {number} [duration=300] - 애니메이션 지속 시간(밀리초)입니다.
     * @example AnimationUtils.fadeOut(myElement, 500);
     */
    fadeOut(element, duration = 300) {
        if (!(element instanceof HTMLElement)) return;
        const initialOpacity = parseFloat(window.getComputedStyle(element).opacity);
        if (isNaN(initialOpacity)) return; // Cannot fade if opacity is not a number

        let start = null;
        const animate = (timestamp) => {
            if (!start) start = timestamp;
            const elapsed = timestamp - start;
            const progress = Math.min(elapsed / duration, 1);
            element.style.opacity = (initialOpacity * (1 - progress)).toString();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.style.display = 'none';
                element.style.opacity = initialOpacity.toString(); // Restore opacity for potential future fadeIn
            }
        };
        requestAnimationFrame(animate);
    }
};

// --- 검증 유틸리티 ---
/**
 * @namespace ValidationUtils
 * @description 다양한 데이터 검증을 위한 유틸리티 함수 집합입니다.
 */
const ValidationUtils = {
    /**
     * 주어진 문자열이 유효한 이메일 형식인지 검증합니다.
     * @memberof ValidationUtils
     * @param {string} email - 검증할 이메일 문자열입니다.
     * @returns {boolean} 유효한 이메일 형식이면 true, 아니면 false를 반환합니다.
     * @example ValidationUtils.isValidEmail('test@example.com'); // true
     */
    isValidEmail(email) {
        if (typeof email !== 'string') return false;
        // Basic email regex, consider using a more robust one for production
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    },

    /**
     * 주어진 문자열이 숫자만으로 구성되어 있는지 검증합니다.
     * @memberof ValidationUtils
     * @param {string} str - 검증할 문자열입니다.
     * @returns {boolean} 문자열이 숫자만 포함하면 true, 아니면 false를 반환합니다.
     * @example ValidationUtils.isNumeric('12345'); // true
     * @example ValidationUtils.isNumeric('123a5'); // false
     */
    isNumeric(str) {
        if (typeof str !== 'string' && typeof str !== 'number') return false;
        return /^\d+$/.test(String(str));
    },

    /**
     * 주어진 문자열에 한글이 포함되어 있는지 검증합니다.
     * @memberof ValidationUtils
     * @param {string} str - 검증할 문자열입니다.
     * @returns {boolean} 문자열에 한글이 하나라도 포함되어 있으면 true, 아니면 false를 반환합니다.
     * @example ValidationUtils.hasKorean('안녕하세요'); // true
     * @example ValidationUtils.hasKorean('Hello'); // false
     */
    hasKorean(str) {
        if (typeof str !== 'string') return false;
        return /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(str); // 초성, 중성, 종성 및 완성형 한글 포함
    }
};

// --- 문자열 유틸리티 ---
/**
 * @namespace StringUtils
 * @description 문자열 처리와 관련된 유틸리티 함수 집합입니다.
 */
const StringUtils = {
    /**
     * HTML 특수 문자를 이스케이프 처리하여 XSS 공격을 방지합니다.
     * 이 함수는 DOM을 사용하여 텍스트를 안전하게 변환합니다. (spellcheck_client.js에서 가져옴)
     * @memberof StringUtils
     * @param {string} text - 이스케이프 처리할 원본 문자열입니다.
     * @returns {string} HTML이 이스케이프된 안전한 문자열을 반환합니다.
     * @example StringUtils.escapeHtml('<script>alert("xss")</script>'); // "&lt;script&gt;alert("xss")&lt;/script&gt;"
     */
    escapeHtml(text) {
        if (typeof text !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * 정규식에 사용될 문자열 내의 특수 문자를 이스케이프 처리합니다. (spellcheck_client.js에서 가져옴)
     * @memberof StringUtils
     * @param {string} str - 정규식 패턴으로 사용될 원본 문자열입니다.
     * @returns {string} 정규식 특수 문자가 이스케이프된 문자열을 반환합니다.
     * @example StringUtils.escapeRegExp('pattern with (brackets) and $');
     */
    escapeRegExp(str) {
        if (typeof str !== 'string') return '';
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $&는 일치하는 전체 문자열을 의미
    },

    /**
     * HTML 요소의 텍스트 콘텐츠를 안전하게 가져옵니다. (index.js의 getSafeText와 유사)
     * `textContent` 또는 `innerText`를 사용하며, 요소가 없거나 텍스트가 없으면 빈 문자열을 반환합니다.
     * @memberof StringUtils
     * @param {Element} element - 텍스트를 추출할 HTML 요소입니다.
     * @returns {string} 추출된 텍스트 또는 빈 문자열을 반환합니다.
     * @example const text = StringUtils.getSafeText(document.getElementById('myElement'));
     */
    getSafeText(element) {
        if (element && typeof element.textContent === 'string') return element.textContent.trim();
        if (element && typeof element.innerText === 'string') return element.innerText.trim(); // Trim added
        return '';
    }
};

// --- 일반 유틸리티 ---

/**
 * @description 지정된 함수 호출을 지연시키는 디바운스 함수입니다.
 * 이벤트가 연속적으로 발생할 때, 마지막 이벤트 이후 지정된 대기 시간 동안 추가 이벤트가 없으면 함수를 실행합니다.
 * @param {Function} func - 디바운싱할 함수입니다.
 * @param {number} wait - 함수 실행 전 대기할 시간(밀리초)입니다.
 * @param {boolean} [immediate=false] - true로 설정하면, wait 시간 동안 이벤트가 없으면 호출되는 대신, 이벤트 발생 즉시 func를 호출하고 이후 wait 시간 동안은 호출하지 않습니다.
 * @returns {Function} 디바운싱이 적용된 새로운 함수를 반환합니다.
 * @example const debouncedSave = debounce(saveInput, 500);
 * @example window.addEventListener('resize', debounce(handleResize, 200));
 */
function debounce(func, wait, immediate = false) {
    let timeout;
    return function executedFunction(...args) {
        const context = this; // 올바른 'this' 컨텍스트 유지를 위해
        const later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
}

// 모듈화 환경을 위한 내보내기 (예: Node.js, Webpack)
// 브라우저 환경에서는 전역 객체(DOMUtils, StorageUtils 등)로 사용됩니다.
// 또는 각 프로젝트에서 필요한 부분만 가져와 사용할 수 있도록 IIFE 등으로 감싸고 명시적으로 window 객체에 할당할 수 있습니다.
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        DOMUtils,
        StorageUtils,
        NumberUtils,
        TimeUtils,
        AnimationUtils,
        ValidationUtils,
        StringUtils,
        debounce
    };
}
// 브라우저 환경에서 전역으로 사용하려면 아래와 같이 명시적으로 할당:
// (단, 이 방식은 전역 스코프를 오염시킬 수 있으므로 프로젝트 정책에 따라 결정)
/*
if (typeof window !== 'undefined') {
    window.DOMUtils = DOMUtils;
    window.StorageUtils = StorageUtils;
    window.NumberUtils = NumberUtils;
    window.TimeUtils = TimeUtils;
    window.AnimationUtils = AnimationUtils;
    window.ValidationUtils = ValidationUtils;
    window.StringUtils = StringUtils;
    window.debounce = debounce;
}
*/
