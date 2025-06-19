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
        this.applyTranslations();
        this.setupLanguageEvents();
        
        return this;
    }

    /**
     * 번역 파일들 로드
     */
    async loadTranslations() {
        const loadPromises = this.supportedLanguages.map(lang => 
            this.loadLanguageFile(lang)
        );
        
        await Promise.all(loadPromises);
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
            const message = this.t('language_changed', `언어가 ${this.getLanguageName(language)}(으)로 변경되었습니다`);
            Toast.show(message, 'success', 3000);
        }

        // console.log(`언어가 ${language}로 변경됨`);
    }

    /**
     * 번역 적용
     */
    applyTranslations() {
        // data-i18n 속성을 가진 모든 요소 번역
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.dataset.i18n;
            const translation = this.t(key);
            
            if (translation) {
                if (element.tagName === 'INPUT' && element.type === 'text') {
                    element.placeholder = translation;
                } else if (element.hasAttribute('title')) {
                    element.title = translation;
                } else if (element.hasAttribute('aria-label')) {
                    element.setAttribute('aria-label', translation);
                } else {
                    element.textContent = translation;
                }
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