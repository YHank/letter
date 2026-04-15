/**
 * NavigationManager 단위 테스트
 * Node.js 환경에서 실행: node test/navigation_manager_test.js
 *
 * 브라우저 DOM, fetch, history API를 최소한으로 모킹합니다.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// ─────────────────────────────────────────────
// DOM 모킹
// ─────────────────────────────────────────────
function makeElement(tag = 'div', attrs = {}) {
    const el = {
        _tag: tag,
        _attrs: { ...attrs },
        _children: [],
        _listeners: {},
        classList: {
            _classes: new Set((attrs.className || '').split(' ').filter(Boolean)),
            add(...cls) { cls.forEach(c => this._classes.add(c)); },
            remove(...cls) { cls.forEach(c => this._classes.delete(c)); },
            contains(c) { return this._classes.has(c); },
            toggle(c) {
                if (this._classes.has(c)) { this._classes.delete(c); return false; }
                this._classes.add(c); return true;
            }
        },
        get innerHTML() { return this._innerHTML || ''; },
        set innerHTML(v) { this._innerHTML = v; },
        get textContent() { return this._text || ''; },
        set textContent(v) { this._text = v; },
        getAttribute(name) { return this._attrs[name] !== undefined ? this._attrs[name] : null; },
        setAttribute(name, val) { this._attrs[name] = val; },
        removeAttribute(name) { delete this._attrs[name]; },
        appendChild(child) { this._children.push(child); return child; },
        addEventListener(evt, fn) {
            if (!this._listeners[evt]) this._listeners[evt] = [];
            this._listeners[evt].push(fn);
        },
        scrollIntoView() {},
        closest(sel) { return null; },
        matches(sel) { return false; },
        querySelector(sel) { return null; },
        querySelectorAll(sel) { return []; },
        get dataset() { return this._attrs; }
    };
    return el;
}

// 문서 레벨 이벤트 리스너 저장소
const docListeners = {};
const winListeners = {};

const mockDocument = {
    _title: 'Test',
    get title() { return this._title; },
    set title(v) { this._title = v; },
    querySelector(sel) {
        if (sel === 'main.container') return makeElement('main');
        if (sel === 'meta[name="description"]') return makeElement('meta', { name: 'description', content: '' });
        return null;
    },
    querySelectorAll(sel) { return []; },
    createElement(tag) {
        const el = makeElement(tag);
        if (tag === 'script') {
            // 스크립트 로드 시뮬레이션: 즉시 onload 호출
            Object.defineProperty(el, 'src', {
                set(v) { el._src = v; setTimeout(() => { if (el.onload) el.onload(); }, 0); },
                get() { return el._src; }
            });
        }
        return el;
    },
    head: { appendChild(el) { return el; } },
    addEventListener(evt, fn) {
        if (!docListeners[evt]) docListeners[evt] = [];
        docListeners[evt].push(fn);
    },
    dispatchEvent(evt) {
        const fns = docListeners[evt.type] || [];
        fns.forEach(fn => fn(evt));
    }
};

const mockHistory = {
    _states: [],
    pushState(state, title, url) { this._states.push({ state, title, url }); },
    replaceState(state, title, url) { this._states.push({ state, title, url }); }
};

const mockLocation = {
    href: 'http://localhost/',
    pathname: '/',
    search: '',
    toString() { return this.href; }
};

// URL 클래스 모킹
class MockURL {
    constructor(base) {
        // base가 객체(location)인 경우 href 문자열 추출
        const baseStr = (base && typeof base === 'object' && base.href)
            ? base.href
            : (base || 'http://localhost/');
        this.href = baseStr;
        this.pathname = '/';
        this._params = new Map();
        // 쿼리스트링 파싱
        const qIdx = this.href.indexOf('?');
        if (qIdx !== -1) {
            const qs = this.href.slice(qIdx + 1);
            qs.split('&').forEach(pair => {
                const [k, v] = pair.split('=');
                if (k) this._params.set(decodeURIComponent(k), decodeURIComponent(v || ''));
            });
        }
        this.searchParams = {
            set: (k, v) => { this._params.set(k, v); },
            get: (k) => this._params.get(k) || null,
            delete: (k) => { this._params.delete(k); },
            toString: () => {
                const parts = [];
                this._params.forEach((v, k) => parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(v)}`));
                return parts.join('&');
            }
        };
    }
    toString() { return this.href; }
}

// URLSearchParams 모킹
class MockURLSearchParams {
    constructor(search = '') {
        this._map = new Map();
        const s = search.replace(/^\?/, '');
        if (s) {
            s.split('&').forEach(pair => {
                const [k, v] = pair.split('=');
                if (k) this._map.set(decodeURIComponent(k), decodeURIComponent(v || ''));
            });
        }
    }
    get(key) { return this._map.has(key) ? this._map.get(key) : null; }
    set(key, val) { this._map.set(key, val); }
    delete(key) { this._map.delete(key); }
}

// fetch 모킹 (성공 케이스)
function makeFetchMock(responseHtml = '<div>page content</div>') {
    return async (url) => ({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => responseHtml
    });
}

// fetch 실패 모킹
function makeFetchFailMock() {
    return async (url) => ({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: async () => 'Not Found'
    });
}

// ─────────────────────────────────────────────
// NavigationManager 로드
// ─────────────────────────────────────────────
const scriptCode = fs.readFileSync(
    path.join(__dirname, '../js/navigation-manager.js'), 'utf8'
);

function createNavigationManager(fetchImpl = makeFetchMock()) {
    // 각 테스트마다 새 컨텍스트 생성
    // navigation-manager.js는 window.history, window[initFn] 형태로 접근하므로
    // window 객체에 history와 초기화 함수들을 포함시켜야 함
    const windowObj = {
        navigationManager: null,
        history: mockHistory,
        location: mockLocation
    };
    const ctx = vm.createContext({
        document: mockDocument,
        window: windowObj,
        history: mockHistory,
        location: mockLocation,
        URL: MockURL,
        URLSearchParams: MockURLSearchParams,
        fetch: fetchImpl,
        bootstrap: { Collapse: { getInstance: () => null } },
        ErrorHandler: null,
        console,
        Math, Date, setTimeout, clearTimeout, Promise, JSON,
        String, Number, Boolean, Array, Object, Set, Map,
        parseInt, parseFloat, isNaN
    });
    vm.runInContext(scriptCode, ctx);
    return { nm: ctx.window.navigationManager, ctx, windowObj };
}

// ─────────────────────────────────────────────
// 테스트 프레임워크
// ─────────────────────────────────────────────
let passCount = 0;
let failCount = 0;

function assertEquals(actual, expected, message) {
    const a = typeof actual === 'object' && actual !== null ? JSON.stringify(actual) : actual;
    const e = typeof expected === 'object' && expected !== null ? JSON.stringify(expected) : expected;
    if (a === e) {
        passCount++;
        console.log(`  PASS: ${message}`);
    } else {
        failCount++;
        console.error(`  FAIL: ${message}`);
        console.error(`       기대값: ${JSON.stringify(expected)}, 실제값: ${JSON.stringify(actual)}`);
    }
}

function describe(name, fn) {
    console.log(`\n[${name}]`);
    fn();
}

// 비동기 테스트 지원
const asyncTests = [];
function describeAsync(name, fn) {
    asyncTests.push({ name, fn });
}

// ─────────────────────────────────────────────
// 동기 테스트
// ─────────────────────────────────────────────

describe('생성자 초기 상태', () => {
    const { nm } = createNavigationManager();
    assertEquals(nm.currentPage, 'home', '초기 페이지는 home');
    assertEquals(nm.loadedScripts instanceof Set, true, 'loadedScripts는 Set');
    assertEquals(nm.pageCache instanceof Map, true, 'pageCache는 Map');
    assertEquals(nm.homeContent, null, '초기 homeContent는 null');
});

describe('scriptMap - 페이지별 스크립트 매핑 확인', () => {
    const { nm } = createNavigationManager();
    assertEquals(Array.isArray(nm.scriptMap['salary']), true, 'salary 스크립트 배열');
    assertEquals(Array.isArray(nm.scriptMap['insurance_calculator']), true, '보험 스크립트 배열');
    assertEquals(Array.isArray(nm.scriptMap['typing_practice']), true, '타자연습 스크립트 배열');
    assertEquals(nm.scriptMap['home'], undefined, 'home은 스크립트 없음');
});

describe('pageTitleMap / pageDescriptionMap - 페이지 메타 매핑', () => {
    const { nm } = createNavigationManager();
    const pages = ['home', 'spellcheck_simple', 'salary', 'typing_practice',
                   'insurance_calculator', 'severancepay', 'scientific_calculator'];

    pages.forEach(page => {
        assertEquals(typeof nm.pageTitleMap[page], 'string', `${page} 타이틀 문자열`);
        assertEquals(nm.pageTitleMap[page].length > 0, true, `${page} 타이틀 비어있지 않음`);
        assertEquals(typeof nm.pageDescriptionMap[page], 'string', `${page} 설명 문자열`);
    });
});

describe('getCurrentPage', () => {
    const { nm } = createNavigationManager();
    assertEquals(nm.getCurrentPage(), 'home', '초기 getCurrentPage() → home');
});

describe('clearCache', () => {
    const { nm } = createNavigationManager();
    nm.pageCache.set('salary', '<div>salary</div>');
    nm.loadedScripts.add('/js/salary_calculator.js');
    assertEquals(nm.pageCache.size, 1, '캐시에 1건');
    assertEquals(nm.loadedScripts.size, 1, '로드된 스크립트 1건');

    nm.clearCache();
    assertEquals(nm.pageCache.size, 0, 'clearCache 후 pageCache 비어있음');
    assertEquals(nm.loadedScripts.size, 0, 'clearCache 후 loadedScripts 비어있음');
});

describe('updatePageTitle - 타이틀 업데이트', () => {
    const { nm } = createNavigationManager();
    nm.updatePageTitle('salary');
    assertEquals(mockDocument.title, nm.pageTitleMap['salary'], 'salary 타이틀로 변경');

    nm.updatePageTitle('nonexistent');
    assertEquals(mockDocument.title, nm.pageTitleMap['home'], '없는 페이지 → home 타이틀 폴백');
});

describe('initializePageScript - 알려진/모르는 페이지 처리', () => {
    // navigation-manager.js는 window[initFunctionName]으로 초기화 함수를 조회하므로
    // windowObj에 함수를 등록해야 함
    const windowObj2 = {
        navigationManager: null,
        history: mockHistory,
        location: mockLocation,
        initializeSalaryPage: null  // 초기에는 함수 없음
    };
    const ctx2 = vm.createContext({
        document: mockDocument, window: windowObj2,
        history: mockHistory, location: mockLocation,
        URL: MockURL, URLSearchParams: MockURLSearchParams,
        fetch: makeFetchMock(),
        bootstrap: { Collapse: { getInstance: () => null } },
        ErrorHandler: null, console, Math, Date, setTimeout,
        clearTimeout, Promise, JSON, String, Number, Boolean,
        Array, Object, Set, Map, parseInt, parseFloat, isNaN
    });
    vm.runInContext(scriptCode, ctx2);
    const nm2 = ctx2.window.navigationManager;

    // 초기화 함수 없을 때 오류 없이 처리
    let threw = false;
    try { nm2.initializePageScript('salary'); } catch(e) { threw = true; }
    assertEquals(threw, false, '초기화 함수 없으면 오류 없이 처리');

    // 초기화 함수 window에 등록 후 호출됨 확인
    let called = false;
    windowObj2.initializeSalaryPage = () => { called = true; };
    nm2.initializePageScript('salary');
    assertEquals(called, true, '초기화 함수 있으면 호출됨');

    // 알 수 없는 페이지 → 아무것도 안 함
    let calledUnknown = false;
    try { nm2.initializePageScript('unknown_page'); } catch(e) { calledUnknown = true; }
    assertEquals(calledUnknown, false, '모르는 페이지 → 오류 없음');
});

// ─────────────────────────────────────────────
// 비동기 테스트
// ─────────────────────────────────────────────

describeAsync('loadPageHtml - 성공 케이스', async () => {
    console.log('\n[loadPageHtml - 성공 케이스]');
    const html = '<div>salary page</div>';
    const { nm } = createNavigationManager(makeFetchMock(html));

    const result = await nm.loadPageHtml('salary');
    assertEquals(result, html, 'fetch 성공 → HTML 반환');

    // 두 번째 호출 시 캐시에서 반환
    const cached = await nm.loadPageHtml('salary');
    assertEquals(cached, html, '두 번째 호출 → 캐시 반환');
    assertEquals(nm.pageCache.get('salary'), html, 'pageCache에 저장됨');
});

describeAsync('loadPageHtml - 실패 케이스', async () => {
    console.log('\n[loadPageHtml - 실패 케이스]');
    const { nm } = createNavigationManager(makeFetchFailMock());

    let errorThrown = false;
    try {
        await nm.loadPageHtml('nonexistent');
    } catch (e) {
        errorThrown = true;
        assertEquals(typeof e.message, 'string', '에러 메시지가 문자열');
    }
    assertEquals(errorThrown, true, 'fetch 실패 → 에러 throw');
});

describeAsync('loadPageScripts - 알려진 페이지', async () => {
    console.log('\n[loadPageScripts - 스크립트 로드]');
    const { nm } = createNavigationManager();

    // 스크립트 없는 페이지 → 즉시 완료
    await nm.loadPageScripts('home');
    assertEquals(nm.loadedScripts.size, 0, 'home 페이지 스크립트 없음');
});

describeAsync('navigateToPage - URL pushState 및 loadPage currentPage 업데이트', async () => {
    console.log('\n[navigateToPage - 네비게이션]');
    mockHistory._states.length = 0;
    const { nm, windowObj } = createNavigationManager(makeFetchMock('<div>salary</div>'));

    // navigateToPage는 내부적으로 loadPage를 fire-and-forget으로 호출하므로
    // pushState만 동기적으로 검증하고, currentPage는 loadPage를 직접 await해서 검증
    nm.navigateToPage('salary');

    // pushState는 동기적으로 호출됨
    const lastState = windowObj.history._states[windowObj.history._states.length - 1];
    assertEquals(lastState.state.page, 'salary', 'pushState에 page 기록됨');

    // loadPage를 직접 await하면 currentPage 업데이트 확인 가능
    await nm.loadPage('insurance_calculator', false);
    assertEquals(nm.currentPage, 'insurance_calculator', 'loadPage 완료 후 currentPage 업데이트');
});

// ─────────────────────────────────────────────
// 비동기 테스트 실행
// ─────────────────────────────────────────────
async function runAsyncTests() {
    for (const { name, fn } of asyncTests) {
        try {
            await fn();
        } catch (e) {
            failCount++;
            console.error(`  FAIL: ${name} → 예외 발생: ${e.message}`);
        }
    }

    console.log(`\n${'='.repeat(50)}`);
    console.log(`NavigationManager 테스트 결과: ${passCount}개 통과 / ${failCount}개 실패`);
    if (failCount === 0) {
        console.log('모든 테스트를 통과했습니다.');
    } else {
        console.error(`${failCount}개의 테스트가 실패했습니다.`);
        process.exitCode = 1;
    }
}

runAsyncTests();
