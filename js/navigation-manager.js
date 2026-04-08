/**
 * NavigationManager 모듈 - 페이지 네비게이션 및 라우팅 관리
 * SPA(Single Page Application) 형태의 페이지 로딩과 네비게이션 상태 관리
 */
class NavigationManager {
    constructor() {
        this.currentPage = 'home';
        this.loadedScripts = new Set();
        this.pageCache = new Map();
        this.homeContent = null; // 홈 콘텐츠 캐시
        this.sessionTs = Date.now(); // 세션별 캐시 버스터
        
        // 페이지별 스크립트 매핑
        this.scriptMap = {
            'spellcheck_simple': ['/js/spellcheck_simple.js?4'],
            'typing_practice': ['/js/practice_data.js?2', '/js/typing_practice.js?15'],
            'salary': ['/js/salary_calculator.js?4'],
            'insurance_calculator': ['/js/insurance_calculator.js?3'],
            'scientific_calculator': ['/js/scientific_calculator.js?3'],
            'severancepay': ['/js/severancepay.js?1']
        };
        
        // 페이지별 메뉴 매핑
        this.pageMenuMap = {
            'home': '.navbar-nav a[href="/"]',
            'spellcheck_simple': 'a[data-move="spellcheck_simple"]',
            'salary': 'a[data-move="salary"]',
            'typing_practice': 'a[data-move="typing_practice"]',
            'insurance_calculator': 'a[data-move="insurance_calculator"]',
            'severancepay': 'a[data-move="severancepay"]',
            'scientific_calculator': 'a[data-move="scientific_calculator"]'
        };
        
        // 페이지별 타이틀 매핑
        this.pageTitleMap = {
            'home': '글자수 세기 - 한글 글자수, 단어수, 문장수 계산기',
            'spellcheck_simple': '맞춤법 검사 - 한글 맞춤법 검사기',
            'salary': '연봉실수령 계산기 - 세금 공제 실수령 금액',
            'typing_practice': '타자연습 - 한글/영어 타자 속도 연습',
            'insurance_calculator': '4대보험료 계산기 - 국민연금, 건강보험, 고용보험',
            'severancepay': '퇴직금 계산기 - 통상임금 기준 퇴직금',
            'scientific_calculator': '공학용 계산기 - 고급 수학 계산기'
        };

        // 페이지별 meta description 매핑
        this.pageDescriptionMap = {
            'home': '무료 온라인 글자수 세기 도구. 한글과 영어의 글자수, 단어수, 문장수, 읽기 시간을 실시간으로 계산합니다.',
            'spellcheck_simple': '무료 한글 맞춤법 검사기. 다음 맞춤법 검사기로 정확한 맞춤법을 확인하세요.',
            'salary': '2025년 기준 연봉 실수령액 계산기. 세금, 4대보험 공제 후 실수령액을 정확하게 계산합니다.',
            'typing_practice': '한글/영어 타자 연습. WPM 속도 측정, 정확도 분석, 레벨 시스템으로 타자 실력을 향상하세요.',
            'insurance_calculator': '2025년 기준 4대보험료 계산기. 국민연금, 건강보험, 고용보험, 장기요양보험을 계산합니다.',
            'severancepay': '근로기준법 기준 퇴직금 계산기. 근무기간과 월 평균임금으로 예상 퇴직금을 계산하세요.',
            'scientific_calculator': '공학용 계산기. 삼각함수, 로그, 지수 등 고급 수학 계산을 지원합니다.'
        };
    }

    /**
     * NavigationManager 초기화
     */
    init() {
        // 이중 초기화 방지
        if (this.initialized) return this;
        this.initialized = true;

        // 홈 콘텐츠를 초기화 시점에 캐시
        const container = document.querySelector('main.container');
        if (container) {
            this.homeContent = container.innerHTML;
        }
        this.setupEventListeners();
        this.handleInitialRoute();
        return this;
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 네비게이션 링크 클릭 이벤트
        document.addEventListener('click', (e) => {
            const moveElement = e.target.closest('[data-move]');
            if (moveElement) {
                e.preventDefault();
                const page = moveElement.dataset.move;
                this.navigateToPage(page);
                
                // 드롭다운 메뉴 닫기
                const dropdown = moveElement.closest('.dropdown');
                if (dropdown) {
                    const dropdownToggle = dropdown.querySelector('.dropdown-toggle');
                    const dropdownMenu = dropdown.querySelector('.dropdown-menu');
                    if (dropdownToggle && dropdownMenu) {
                        dropdownToggle.classList.remove('show');
                        dropdownMenu.classList.remove('show');
                        dropdownToggle.setAttribute('aria-expanded', 'false');
                    }
                }
                
                // 모바일 메뉴 닫기
                const navbarCollapse = document.querySelector('.navbar-collapse');
                if (navbarCollapse && navbarCollapse.classList.contains('show')) {
                    const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse);
                    if (bsCollapse) {
                        bsCollapse.hide();
                    }
                }
            }
        });

        // 브라우저 뒤로/앞으로 가기 이벤트
        window.addEventListener('popstate', (e) => {
            const state = e.state;
            if (state && state.page) {
                this.loadPage(state.page, false);
            } else {
                this.handleInitialRoute();
            }
        });

        // 홈 로고 클릭 이벤트
        document.addEventListener('click', (e) => {
            if (e.target.matches('.navbar-brand') || e.target.closest('.navbar-brand')) {
                e.preventDefault();
                this.navigateToHome();
            }
        });
    }

    /**
     * 초기 라우트 처리
     */
    handleInitialRoute() {
        const urlParams = new URLSearchParams(window.location.search);
        const page = urlParams.get('page');
        
        if (page) {
            this.loadPage(page, false);
        } else {
            this.updateNavigationState('home');
        }
    }

    /**
     * 페이지 네비게이션
     * @param {string} page - 이동할 페이지 이름
     */
    navigateToPage(page) {
        // URL 업데이트
        const url = new URL(window.location);
        url.searchParams.set('page', page);
        window.history.pushState({ page }, '', url);
        
        // 페이지 로드
        this.loadPage(page, true);
    }

    /**
     * 홈으로 이동
     */
    navigateToHome() {
        // URL에서 page 파라미터 제거
        const url = new URL(window.location);
        url.searchParams.delete('page');
        window.history.pushState({ page: 'home' }, '', url.pathname);
        
        // 메인 콘텐츠 표시
        this.showMainContent();
        this.updateNavigationState('home');
        this.updatePageTitle('home');
        this.updatePageDescription('home');
        this.currentPage = 'home';
    }

    /**
     * 페이지 로드
     * @param {string} page - 로드할 페이지
     * @param {boolean} updateHistory - 히스토리 업데이트 여부
     */
    async loadPage(page, updateHistory = true) {
        try {
            // 로딩 상태 표시
            this.showLoadingState();
            
            // 페이지 HTML 로드
            const pageHtml = await this.loadPageHtml(page);
            
            // 페이지별 스크립트 로드
            await this.loadPageScripts(page);
            
            // 콘텐츠 업데이트
            this.updatePageContent(pageHtml);
            
            // 네비게이션 상태 및 타이틀 업데이트
            this.updateNavigationState(page);
            this.updatePageTitle(page);
            this.updatePageDescription(page);

            // 페이지별 초기화 함수 호출
            this.initializePageScript(page);
            
            this.currentPage = page;
            
            // Google 애드센스는 SPA에서 자동으로 처리하도록 남겨둠
            // 광고 새로고침 로직 제거 - 오류 발생 방지
            
        } catch (error) {
            console.error(`페이지 로드 실패: ${page}`, error);
            this.showErrorState(page);
            
            // 에러 핸들러가 있으면 사용
            if (window.ErrorHandler) {
                ErrorHandler.handleAjaxError({ status: 404 }, 'error', error);
            }
        }
    }

    /**
     * 페이지 HTML 로드
     * @param {string} page - 페이지 이름
     * @returns {Promise<string>} 페이지 HTML
     */
    async loadPageHtml(page) {
        // 캐시 확인
        if (this.pageCache.has(page)) {
            return this.pageCache.get(page);
        }

        try {
            const response = await fetch(`/html/${page}.html?_t=${this.sessionTs}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const html = await response.text();
            this.pageCache.set(page, html);
            return html;
        } catch (error) {
            throw new Error(`페이지 HTML 로드 실패: ${error.message}`);
        }
    }

    /**
     * 페이지별 스크립트 로드
     * @param {string} page - 페이지 이름
     * @returns {Promise} 스크립트 로드 Promise
     */
    async loadPageScripts(page) {
        const scripts = this.scriptMap[page] || [];
        const loadPromises = scripts
            .filter(src => !this.loadedScripts.has(src))
            .map(src => this.loadScript(src));
        
        return Promise.all(loadPromises);
    }

    /**
     * 개별 스크립트 로드
     * @param {string} src - 스크립트 소스 URL
     * @returns {Promise} 로드 Promise
     */
    loadScript(src) {
        return new Promise((resolve, reject) => {
            if (this.loadedScripts.has(src)) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.defer = true;
            
            script.onload = () => {
                this.loadedScripts.add(src);
                resolve();
            };
            
            script.onerror = () => {
                reject(new Error(`스크립트 로드 실패: ${src}`));
            };
            
            document.head.appendChild(script);
        });
    }

    /**
     * 페이지 콘텐츠 업데이트
     * @param {string} html - 페이지 HTML
     */
    updatePageContent(html) {
        const container = document.querySelector('main.container');
        if (container) {
            container.innerHTML = html;
        }
    }

    /**
     * 네비게이션 상태 업데이트
     * @param {string} currentPage - 현재 페이지
     */
    updateNavigationState(currentPage = 'home') {
        // 모든 네비게이션 링크에서 active 클래스 제거
        document.querySelectorAll('.navbar-nav .nav-link, .dropdown-item').forEach(link => {
            link.classList.remove('active');
            link.removeAttribute('aria-current');
        });
        
        // 현재 페이지에 맞는 메뉴 활성화
        const selector = this.pageMenuMap[currentPage];
        if (selector) {
            const activeLink = document.querySelector(selector);
            if (activeLink) {
                activeLink.classList.add('active');
                activeLink.setAttribute('aria-current', 'page');
                
                // 드롭다운 내부 아이템인 경우 드롭다운 토글도 활성화
                const dropdownToggle = activeLink.closest('.dropdown')?.querySelector('.dropdown-toggle');
                if (dropdownToggle) {
                    dropdownToggle.classList.add('active');
                }
            }
        }
    }

    /**
     * 페이지 타이틀 업데이트
     * @param {string} page - 페이지 이름
     */
    updatePageTitle(page) {
        const title = this.pageTitleMap[page] || this.pageTitleMap['home'];
        document.title = title;
    }

    /**
     * meta description 동적 업데이트 (SEO 및 접근성 개선)
     * @param {string} page - 페이지 이름
     */
    updatePageDescription(page) {
        const description = this.pageDescriptionMap[page] || this.pageDescriptionMap['home'];
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute('content', description);
    }

    /**
     * 페이지별 초기화 함수 호출
     * @param {string} page - 페이지 이름
     */
    initializePageScript(page) {
        const initFunctions = {
            'spellcheck_simple': 'initializeSimpleSpellchecker',
            'typing_practice': 'initializeTypingPractice',
            'salary': 'initializeSalaryPage',
            'insurance_calculator': 'initializeInsuranceCalculator',
            'scientific_calculator': 'initializeScientificCalculator',
            'severancepay': 'initializeSeverancePay'
        };

        const initFunctionName = initFunctions[page];
        if (initFunctionName && typeof window[initFunctionName] === 'function') {
            try {
                window[initFunctionName]();
            } catch (error) {
                console.error(`페이지 초기화 실패: ${page}`, error);
            }
        }
    }

    /**
     * 로딩 상태 표시
     */
    showLoadingState() {
        const container = document.querySelector('main.container');
        if (container) {
            container.innerHTML = `
                <div class="d-flex justify-content-center align-items-center" style="min-height: 300px;">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">로딩 중...</span>
                    </div>
                    <span class="ms-3">페이지를 불러오는 중...</span>
                </div>
            `;
        }
    }

    /**
     * 에러 상태 표시
     * @param {string} page - 페이지 이름
     */
    showErrorState(page) {
        const container = document.querySelector('main.container');
        if (container) {
            container.innerHTML = `
                <div class="alert alert-danger" role="alert">
                    <h4 class="alert-heading">페이지 로드 오류</h4>
                    <p>요청하신 페이지를 불러오는데 실패했습니다.</p>
                    <hr>
                    <p class="mb-0">
                        <button class="btn btn-outline-danger" onclick="window.navigationManager.navigateToHome()">
                            홈으로 돌아가기
                        </button>
                    </p>
                </div>
            `;
        }
    }

    /**
     * 메인 콘텐츠 표시
     */
    showMainContent() {
        const container = document.querySelector('main.container');
        if (container && this.homeContent) {
            container.innerHTML = this.homeContent;
        }
    }

    /**
     * 현재 페이지 반환
     * @returns {string} 현재 페이지
     */
    getCurrentPage() {
        return this.currentPage;
    }

    /**
     * 페이지 캐시 클리어
     */
    clearCache() {
        this.pageCache.clear();
        this.loadedScripts.clear();
    }
}

// 전역 인스턴스 생성
window.navigationManager = new NavigationManager();