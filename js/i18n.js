/**
 * 국제화(i18n) 모듈 - 다국어 지원 시스템
 * 한국어, 영어, 일본어, 중국어 지원
 */

class I18nManager {
    constructor() {
        this.currentLanguage = 'ko';
        this.defaultLanguage = 'ko';
        this.supportedLanguages = ['ko', 'en', 'ja', 'zh'];
        this.translations = {};
        this.ready = false;
        
        // 브라우저 언어 감지
        this.detectBrowserLanguage();
        
        // 저장된 언어 설정 로드
        this.loadSavedLanguage();
    }

    /**
     * i18n 시스템 초기화
     */
    async init() {
        await this.loadTranslations();
        this.createLanguageSelector();
        this.applyDocumentLanguage();
        this.applyTranslations();
        this.setupLanguageEvents();
        
        return this;
    }

    /**
     * <html lang> 속성을 현재 언어로 동기화
     */
    applyDocumentLanguage() {
        document.documentElement.setAttribute('lang', this.currentLanguage);
    }

    /**
     * 번역 파일들 로드
     */
    async loadTranslations() {
        const loadPromises = this.supportedLanguages.map(lang => 
            this.loadLanguageFile(lang)
        );
        
        await Promise.all(loadPromises);
        this.ready = true;
        // console.log('모든 번역 파일 로드 완료');
    }

    /**
     * 개별 언어 파일 로드
     */
    async loadLanguageFile(language) {
        try {
            const response = await fetch(`/i18n/${language}.json`);
            if (response.ok) {
                this.translations[language] = await response.json();
                // console.log(`${language} 번역 파일 로드 완료`);
            } else {
                console.warn(`${language} 번역 파일을 찾을 수 없음`);
                // 기본 번역으로 폴백
                if (language !== this.defaultLanguage) {
                    this.translations[language] = this.translations[this.defaultLanguage] || {};
                }
            }
        } catch (error) {
            console.error(`${language} 번역 파일 로드 실패:`, error);
            this.translations[language] = {};
        }
    }

    /**
     * 브라우저 언어 감지
     */
    detectBrowserLanguage() {
        const browserLang = navigator.language || navigator.userLanguage;
        const langCode = browserLang.split('-')[0];
        
        if (this.supportedLanguages.includes(langCode)) {
            this.currentLanguage = langCode;
        }
    }

    /**
     * 저장된 언어 설정 로드
     */
    loadSavedLanguage() {
        if (window.storageManager) {
            const preferences = window.storageManager.loadUserPreferences();
            if (preferences.language && this.supportedLanguages.includes(preferences.language)) {
                this.currentLanguage = preferences.language;
            }
        }
    }

    /**
     * 언어 선택기 생성
     */
    createLanguageSelector() {
        const languageNames = {
            'ko': '한국어',
            'en': 'English',
            'ja': '日本語',
            'zh': '中文'
        };

        const navbar = document.querySelector('.navbar-nav');
        if (!navbar) return;

        const languageDropdown = document.createElement('li');
        languageDropdown.className = 'nav-item dropdown';
        languageDropdown.innerHTML = `
            <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                <i class="fas fa-globe me-1"></i>
                <span id="current-language">${languageNames[this.currentLanguage]}</span>
            </a>
            <ul class="dropdown-menu">
                ${this.supportedLanguages.map(lang => `
                    <li>
                        <a class="dropdown-item ${lang === this.currentLanguage ? 'active' : ''}" 
                           href="#" data-language="${lang}">
                            <i class="fas fa-${lang === this.currentLanguage ? 'check' : 'language'} me-2"></i>
                            ${languageNames[lang]}
                        </a>
                    </li>
                `).join('')}
            </ul>
        `;

        navbar.appendChild(languageDropdown);

        // Bootstrap 드롭다운 수동 초기화 (초기화 타이밍 문제 방지, 중복 인스턴스 방지)
        const dropdownToggle = languageDropdown.querySelector('.dropdown-toggle');
        if (dropdownToggle && typeof bootstrap !== 'undefined' && !bootstrap.Dropdown.getInstance(dropdownToggle)) {
            new bootstrap.Dropdown(dropdownToggle);
        }
    }

    /**
     * 언어 변경 이벤트 설정
     */
    setupLanguageEvents() {
        document.addEventListener('click', (e) => {
            const languageLink = e.target.closest('[data-language]');
            if (languageLink) {
                e.preventDefault();
                const newLanguage = languageLink.dataset.language;
                this.changeLanguage(newLanguage);
            }
        });
    }

    /**
     * 언어 변경
     */
    async changeLanguage(language) {
        if (!this.supportedLanguages.includes(language)) {
            console.error('지원하지 않는 언어:', language);
            return;
        }

        const oldLanguage = this.currentLanguage;
        this.currentLanguage = language;

        // 문서 언어 속성 갱신 (스크린리더 / 검색엔진용)
        this.applyDocumentLanguage();

        // 번역 적용
        this.applyTranslations();

        // 언어 선택기 업데이트
        this.updateLanguageSelector();

        // 언어 설정 저장
        this.saveLanguagePreference();

        // TextAnalyzer 언어 설정 업데이트
        if (window.textAnalyzer) {
            window.textAnalyzer.currentLanguage = language;
        }

        // 언어 변경 이벤트 발생
        this.dispatchLanguageChangeEvent(oldLanguage, language);

        // 토스트 알림
        if (window.Toast) {
            const message = this.t('messages.language_changed', `언어가 ${this.getLanguageName(language)}(으)로 변경되었습니다`);
            Toast.show(message, 'success', 3000);
        }

        // console.log(`언어가 ${language}로 변경됨`);
    }

    /**
     * 번역 적용
     */
    applyTranslations(root = document) {
        // 번역 파일 로드 전에는 아무것도 건드리지 않는다 (원문 유지)
        if (!this.ready) return;

        // data-i18n 속성을 가진 모든 요소의 텍스트 번역
        root.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.dataset.i18n;
            const translation = this.translate(key);
            if (!translation) return;

            const tag = element.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA') {
                // 입력 요소는 placeholder가 유일한 표시 텍스트
                element.placeholder = translation;
            } else {
                // 아이콘 등 자식 요소를 보존하기 위해 텍스트 노드만 교체
                this.setElementText(element, translation);
            }
        });

        // 속성 전용 번역 (텍스트와 독립적으로 동작)
        root.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const translation = this.translate(element.dataset.i18nPlaceholder);
            if (!translation) return;

            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = translation;
            } else {
                // contenteditable 요소는 CSS의 attr(data-placeholder)로 표시
                element.setAttribute('data-placeholder', translation);
            }
        });

        root.querySelectorAll('[data-i18n-title]').forEach(element => {
            const translation = this.translate(element.dataset.i18nTitle);
            if (translation) {
                element.title = translation;
                this.updateTooltipContent(element, translation);
            }
        });

        root.querySelectorAll('[data-i18n-aria]').forEach(element => {
            const translation = this.translate(element.dataset.i18nAria);
            if (translation) {
                element.setAttribute('aria-label', translation);
            }
        });

        // 페이지 타이틀 변경
        const titleKey = document.querySelector('meta[name="i18n-title"]')?.content;
        if (titleKey) {
            document.title = this.t(titleKey, document.title);
        }

        // 메타 설명 변경
        const descMeta = document.querySelector('meta[name="description"]');
        const descKey = descMeta?.dataset?.i18n;
        if (descKey && descMeta) {
            descMeta.content = this.t(descKey, descMeta.content);
        }
    }

    /**
     * 번역 텍스트 가져오기
     */
    t(key, fallback = null) {
        const currentTranslations = this.translations[this.currentLanguage] || {};
        const defaultTranslations = this.translations[this.defaultLanguage] || {};
        
        // 현재 언어에서 찾기
        if (currentTranslations[key]) {
            return currentTranslations[key];
        }
        
        // 기본 언어에서 찾기
        if (defaultTranslations[key]) {
            return defaultTranslations[key];
        }
        
        // 중첩된 키 지원 (예: "buttons.save")
        const nestedValue = this.getNestedValue(currentTranslations, key) || 
                           this.getNestedValue(defaultTranslations, key);
        
        if (nestedValue) {
            return nestedValue;
        }
        
        // 폴백 텍스트 또는 키 반환
        return fallback || key;
    }

    /**
     * 이미 초기화된 Bootstrap 툴팁의 내용도 함께 갱신
     * (툴팁은 초기화 시점의 title을 내부에 보관하므로 속성 변경만으로는 반영되지 않음)
     */
    updateTooltipContent(element, text) {
        if (typeof bootstrap === 'undefined' || !bootstrap.Tooltip) return;

        try {
            const instance = bootstrap.Tooltip.getInstance(element);
            if (!instance) return;

            element.setAttribute('data-bs-original-title', text);
            instance.setContent({ '.tooltip-inner': text });
        } catch (error) {
            // 툴팁 갱신 실패는 title 속성 번역까지 되돌릴 이유가 없다
            console.warn('툴팁 내용 갱신 실패:', error);
        }
    }

    /**
     * 실제 번역이 있을 때만 값을 반환 (없으면 null → 마크업 원문 유지)
     */
    translate(key) {
        if (!key) return null;
        const value = this.t(key);
        return (value && value !== key) ? value : null;
    }

    /**
     * 요소의 텍스트만 교체 (아이콘 등 자식 요소는 보존)
     */
    setElementText(element, text) {
        const textNodes = Array.from(element.childNodes)
            .filter(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== '');

        if (textNodes.length > 0) {
            textNodes[0].textContent = text;
            // 남은 텍스트 노드는 비워서 중복 표시 방지
            textNodes.slice(1).forEach(node => { node.textContent = ''; });
        } else if (element.children.length > 0) {
            element.appendChild(document.createTextNode(text));
        } else {
            element.textContent = text;
        }
    }

    /**
     * 번역문의 {name} 자리에 값을 채워 반환
     * (언어마다 어순이 달라도 한 문장을 그대로 유지할 수 있게 해준다)
     */
    format(key, params = {}, fallback = null) {
        const text = this.t(key, fallback);
        if (typeof text !== 'string') return text;

        return text.replace(/\{(\w+)\}/g, (match, name) => (
            Object.prototype.hasOwnProperty.call(params, name) ? params[name] : match
        ));
    }

    /**
     * 중첩된 객체에서 값 가져오기
     */
    getNestedValue(obj, key) {
        return key.split('.').reduce((o, k) => (o || {})[k], obj);
    }

    /**
     * 언어 선택기 업데이트
     */
    updateLanguageSelector() {
        const currentLanguageSpan = document.getElementById('current-language');
        const languageLinks = document.querySelectorAll('[data-language]');
        
        if (currentLanguageSpan) {
            currentLanguageSpan.textContent = this.getLanguageName(this.currentLanguage);
        }

        languageLinks.forEach(link => {
            const isActive = link.dataset.language === this.currentLanguage;
            link.classList.toggle('active', isActive);
            
            const icon = link.querySelector('i');
            if (icon) {
                icon.className = `fas fa-${isActive ? 'check' : 'language'} me-2`;
            }
        });
    }

    /**
     * 언어 이름 가져오기
     */
    getLanguageName(language) {
        const names = {
            'ko': '한국어',
            'en': 'English', 
            'ja': '日本語',
            'zh': '中文'
        };
        return names[language] || language;
    }

    /**
     * 언어 설정 저장
     */
    saveLanguagePreference() {
        if (window.storageManager) {
            window.storageManager.saveUserPreferences({
                language: this.currentLanguage
            });
        }
    }

    /**
     * 언어 변경 이벤트 발생
     */
    dispatchLanguageChangeEvent(oldLanguage, newLanguage) {
        const event = new CustomEvent('languageChanged', {
            detail: { oldLanguage, newLanguage }
        });
        document.dispatchEvent(event);
    }

    /**
     * 현재 언어 반환
     */
    getCurrentLanguage() {
        return this.currentLanguage;
    }

    /**
     * 지원 언어 목록 반환
     */
    getSupportedLanguages() {
        return [...this.supportedLanguages];
    }

    /**
     * 텍스트 방향성 반환 (RTL 언어 지원용)
     */
    getTextDirection() {
        const rtlLanguages = ['ar', 'he', 'fa'];
        return rtlLanguages.includes(this.currentLanguage) ? 'rtl' : 'ltr';
    }

    /**
     * 날짜 형식 반환
     */
    getDateFormat() {
        const formats = {
            'ko': 'YYYY년 MM월 DD일',
            'en': 'MM/DD/YYYY',
            'ja': 'YYYY年MM月DD日',
            'zh': 'YYYY年MM月DD日'
        };
        return formats[this.currentLanguage] || formats['en'];
    }

    /**
     * 숫자 형식 반환
     */
    formatNumber(number) {
        try {
            const locale = {
                'ko': 'ko-KR',
                'en': 'en-US',
                'ja': 'ja-JP',
                'zh': 'zh-CN'
            }[this.currentLanguage] || 'en-US';
            
            return new Intl.NumberFormat(locale).format(number);
        } catch (error) {
            return number.toString();
        }
    }

    /**
     * 복수형 처리 (영어 등)
     */
    plural(count, singular, plural) {
        if (this.currentLanguage === 'en') {
            return count === 1 ? singular : plural;
        }
        // 한국어, 일본어, 중국어는 복수형 구분 없음
        return singular;
    }
}

// 전역 인스턴스 생성
window.i18nManager = new I18nManager();