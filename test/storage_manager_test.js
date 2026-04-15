/**
 * StorageManager 단위 테스트
 * Node.js 환경에서 실행: node test/storage_manager_test.js
 *
 * localStorage를 Map 기반으로 모킹하여 브라우저 없이 테스트합니다.
 */

// ─────────────────────────────────────────────
// localStorage 모킹
// ─────────────────────────────────────────────
const localStorageStore = new Map();
const localStorageMock = {
    getItem(key) {
        return localStorageStore.has(key) ? localStorageStore.get(key) : null;
    },
    setItem(key, value) {
        localStorageStore.set(key, String(value));
    },
    removeItem(key) {
        localStorageStore.delete(key);
    },
    clear() {
        localStorageStore.clear();
    },
    get length() {
        return localStorageStore.size;
    },
    hasOwnProperty(key) {
        return localStorageStore.has(key);
    },
    [Symbol.iterator]() {
        return localStorageStore.keys();
    }
};

// for...in 순회를 위해 Proxy로 래핑
const localStorageProxy = new Proxy(localStorageMock, {
    ownKeys(target) {
        return [...localStorageStore.keys()];
    },
    getOwnPropertyDescriptor(target, key) {
        if (localStorageStore.has(key)) {
            return { enumerable: true, configurable: true, value: localStorageStore.get(key) };
        }
        return Object.getOwnPropertyDescriptor(target, key);
    },
    get(target, key) {
        if (key in target) return target[key];
        return localStorageStore.get(key);
    }
});

// ─────────────────────────────────────────────
// 브라우저 전역 모킹
// ─────────────────────────────────────────────
global.localStorage = localStorageProxy;
global.document = {
    getElementById: () => null,
    dispatchEvent: () => {}
};
global.CustomEvent = class CustomEvent {
    constructor(name, opts) { this.type = name; this.detail = opts && opts.detail; }
};
global.window = {
    textAnalyzer: null,
    Toast: null
};
global.console = console;

// StorageManager 클래스 로드
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const scriptCode = fs.readFileSync(
    path.join(__dirname, '../js/storage-manager.js'), 'utf8'
);
// window.storageManager = new StorageManager() 라인이 있으므로 context에 window 포함
const ctx = vm.createContext({ localStorage: localStorageProxy, document: global.document, CustomEvent: global.CustomEvent, window: global.window, console, Math, Date, setTimeout, clearTimeout, JSON, String, Number, Boolean, Array, Object });
vm.runInContext(scriptCode, ctx);
const StorageManager = ctx.StorageManager || (function() {
    // fallback: window.storageManager 인스턴스에서 생성자 추출
    return ctx.window.storageManager.constructor;
})();

// ─────────────────────────────────────────────
// 테스트 프레임워크
// ─────────────────────────────────────────────
let passCount = 0;
let failCount = 0;

function assertEquals(actual, expected, message) {
    // 객체 비교는 JSON 직렬화로
    const a = typeof actual === 'object' ? JSON.stringify(actual) : actual;
    const e = typeof expected === 'object' ? JSON.stringify(expected) : expected;
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
    // 각 describe 전에 저장소 초기화
    localStorageStore.clear();
    fn();
}

// ─────────────────────────────────────────────
// 테스트
// ─────────────────────────────────────────────

describe('save / load - 기본 저장 및 로드', () => {
    const sm = new StorageManager();

    // 문자열 저장
    sm.save('testKey', 'hello');
    assertEquals(sm.load('testKey'), 'hello', '문자열 저장 후 로드');

    // 숫자 저장
    sm.save('numKey', 42);
    assertEquals(sm.load('numKey'), 42, '숫자 저장 후 로드');

    // 객체 저장
    sm.save('objKey', { a: 1, b: 2 });
    assertEquals(sm.load('objKey'), { a: 1, b: 2 }, '객체 저장 후 로드');

    // 배열 저장
    sm.save('arrKey', [1, 2, 3]);
    assertEquals(sm.load('arrKey'), [1, 2, 3], '배열 저장 후 로드');

    // 없는 키 → 기본값 반환
    assertEquals(sm.load('nonExistent', 'default'), 'default', '없는 키 → 기본값');
    assertEquals(sm.load('nonExistent'), null, '없는 키, 기본값 미지정 → null');
});

describe('save / load - 접두사(prefix) 처리', () => {
    const sm = new StorageManager();

    // prefixed=true (기본값): 'letterCount_' 접두사 붙음
    sm.save('myKey', 'prefixed', true);
    assertEquals(sm.load('myKey', null, true), 'prefixed', 'prefixed=true 저장/로드');

    // prefixed=false: 접두사 없이 저장
    sm.save('rawKey', 'raw', false);
    assertEquals(sm.load('rawKey', null, false), 'raw', 'prefixed=false 저장/로드');

    // 접두사 불일치: prefixed=true로 저장한 것을 false로 로드 → null
    assertEquals(sm.load('myKey', null, false), null, '접두사 불일치 → null');
});

describe('remove - 데이터 삭제', () => {
    const sm = new StorageManager();

    sm.save('delKey', 'toDelete');
    assertEquals(sm.load('delKey'), 'toDelete', '삭제 전 로드 성공');

    sm.remove('delKey');
    assertEquals(sm.load('delKey'), null, '삭제 후 로드 → null');

    // 없는 키 삭제는 오류 없이 처리
    let threw = false;
    try { sm.remove('noSuchKey'); } catch(e) { threw = true; }
    assertEquals(threw, false, '없는 키 삭제 → 오류 없음');
});

describe('checkStorageAvailable - 저장소 사용 가능 여부', () => {
    const sm = new StorageManager();
    assertEquals(sm.checkStorageAvailable(), true, 'localStorage 사용 가능');
});

describe('saveUserPreferences / loadUserPreferences - 사용자 설정', () => {
    const sm = new StorageManager();

    // 기본값 확인
    const defaults = sm.loadUserPreferences();
    assertEquals(defaults.theme, 'auto', '기본 테마 auto');
    assertEquals(defaults.autoSave, true, '기본 autoSave true');
    assertEquals(defaults.language, 'ko', '기본 언어 ko');

    // 일부 설정 저장 (머지 방식: 현재 저장값 + 신규값)
    sm.saveUserPreferences({ theme: 'dark' });
    const updated = sm.loadUserPreferences();
    assertEquals(updated.theme, 'dark', '테마 dark으로 업데이트');
    // loadUserPreferences는 저장된 객체를 그대로 반환 (기본값과 머지 안 함)
    // saveUserPreferences는 load({}) + {theme:'dark'} = {theme:'dark'}를 저장
    // 따라서 autoSave는 저장 객체에 없으므로 undefined
    assertEquals(updated.autoSave, undefined, '저장 안 된 키는 undefined');

    // 추가 설정 저장
    sm.saveUserPreferences({ language: 'en', fontSize: 'large' });
    const updated2 = sm.loadUserPreferences();
    assertEquals(updated2.language, 'en', '언어 en으로 업데이트');
    assertEquals(updated2.fontSize, 'large', 'fontSize 업데이트');
    assertEquals(updated2.theme, 'dark', '이전 설정 유지');
});

describe('saveCalculationHistory / loadCalculationHistory - 계산 기록', () => {
    const sm = new StorageManager();

    // 초기 상태 → 빈 배열
    assertEquals(sm.loadCalculationHistory('salary'), [], '초기 기록 → 빈 배열');

    // 기록 저장
    sm.saveCalculationHistory('salary', { annualSalary: 40000000, netMonthly: 2800000 });
    const records = sm.loadCalculationHistory('salary');
    assertEquals(records.length, 1, '저장 후 기록 1건');
    assertEquals(records[0].annualSalary, 40000000, '저장된 연봉 확인');
    assertEquals(typeof records[0].timestamp, 'number', 'timestamp 자동 추가');
    assertEquals(typeof records[0].date, 'string', 'date 자동 추가');

    // 추가 저장 → 최신이 앞에 위치 (unshift)
    sm.saveCalculationHistory('salary', { annualSalary: 50000000, netMonthly: 3200000 });
    const records2 = sm.loadCalculationHistory('salary');
    assertEquals(records2.length, 2, '2건 저장');
    assertEquals(records2[0].annualSalary, 50000000, '최신 기록이 앞에 위치');

    // 타입별 독립 저장
    sm.saveCalculationHistory('insurance', { monthlySalary: 3000000 });
    assertEquals(sm.loadCalculationHistory('insurance').length, 1, '보험 기록 독립 저장');
    assertEquals(sm.loadCalculationHistory('salary').length, 2, '연봉 기록 유지');
});

describe('saveCalculationHistory - 최대 50건 제한', () => {
    const sm = new StorageManager();

    for (let i = 0; i < 55; i++) {
        sm.saveCalculationHistory('test', { index: i });
    }
    const records = sm.loadCalculationHistory('test');
    assertEquals(records.length, 50, '50건 초과 시 50건으로 제한');
    // 가장 최신(index=54)이 앞에 있어야 함
    assertEquals(records[0].index, 54, '최신 기록이 맨 앞');
});

describe('saveTypingRecord / loadTypingRecords - 타자 기록', () => {
    const sm = new StorageManager();

    assertEquals(sm.loadTypingRecords().length, 0, '초기 타자 기록 빈 배열');

    sm.saveTypingRecord({ wpm: 200, accuracy: 98.5, mode: 'korean' });
    const records = sm.loadTypingRecords();
    assertEquals(records.length, 1, '타자 기록 1건 저장');
    assertEquals(records[0].wpm, 200, 'WPM 저장 확인');
    assertEquals(records[0].accuracy, 98.5, '정확도 저장 확인');
    assertEquals(typeof records[0].timestamp, 'number', 'timestamp 자동 추가');
});

describe('saveTypingRecord - 최대 100건 제한', () => {
    const sm = new StorageManager();

    for (let i = 0; i < 105; i++) {
        sm.saveTypingRecord({ wpm: i, accuracy: 100 });
    }
    const records = sm.loadTypingRecords();
    assertEquals(records.length, 100, '100건 초과 시 100건으로 제한');
});

describe('save 반환값 - 성공/실패', () => {
    const sm = new StorageManager();
    const result = sm.save('retKey', 'value');
    assertEquals(result, true, '저장 성공 → true 반환');
});

describe('exportAllData - 전체 데이터 내보내기', () => {
    const sm = new StorageManager();
    sm.save('exportTest', { x: 1 });

    const exported = sm.exportAllData();
    assertEquals(typeof exported.exported, 'string', '내보내기 날짜 포함');
    assertEquals(exported.version, '1.0', '버전 1.0');
    assertEquals(typeof exported.data, 'object', '데이터 객체 포함');

    // 접두사가 붙은 키만 포함되어야 함
    const keys = Object.keys(exported.data);
    const allPrefixed = keys.every(k => k.startsWith(sm.storagePrefix));
    assertEquals(allPrefixed, true, '내보낸 키는 모두 접두사 포함');
});

describe('importData - 데이터 가져오기', () => {
    const sm = new StorageManager();

    const importPayload = {
        exported: new Date().toISOString(),
        version: '1.0',
        data: {
            [`${sm.storagePrefix}importedKey`]: { value: 'imported' }
        }
    };

    const result = sm.importData(importPayload);
    assertEquals(result, true, '가져오기 성공 → true');

    // 가져온 데이터 확인 (접두사 없이 로드)
    const raw = localStorage.getItem(`${sm.storagePrefix}importedKey`);
    assertEquals(raw !== null, true, '가져온 데이터가 저장됨');

    // 잘못된 형식 → false
    const badResult = sm.importData({ noData: true });
    assertEquals(badResult, false, '잘못된 형식 → false');
});

// ─────────────────────────────────────────────
// 결과 출력
// ─────────────────────────────────────────────
console.log(`\n${'='.repeat(50)}`);
console.log(`StorageManager 테스트 결과: ${passCount}개 통과 / ${failCount}개 실패`);
if (failCount === 0) {
    console.log('모든 테스트를 통과했습니다.');
} else {
    console.error(`${failCount}개의 테스트가 실패했습니다.`);
    process.exitCode = 1;
}
