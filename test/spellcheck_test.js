/**
 * 맞춤법 검사기 단위 테스트
 * Node.js 환경에서 실행: node test/spellcheck_test.js
 *
 * 오탐 테스트가 재현 테스트보다 중요하다.
 * 정상 문장을 오류로 잡는 순간 사용자의 멀쩡한 글이 망가지기 때문에,
 * 사전에 항목을 추가할 때마다 코퍼스 전체를 다시 돌려 검출 0을 확인한다.
 */

const fs = require('fs');
const path = require('path');

const SpellCheckRules = require('../js/spellcheck_rules.js');
const SpellCheckClient = require('../js/spellcheck_client.js');

// spellcheck_client.js가 전역 SpellCheckRules를 찾도록 연결
global.SpellCheckRules = SpellCheckRules;

let passCount = 0;
let failCount = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`  ✓ ${name}`);
        passCount++;
    } catch (e) {
        console.error(`  ✗ ${name}\n      ${e.message}`);
        failCount++;
    }
}

function assertEquals(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(`${message}\n      기댓값: ${JSON.stringify(expected)}\n      실젯값: ${JSON.stringify(actual)}`);
    }
}

function detect(text) {
    return SpellCheckClient.check(text);
}

// ─────────────────────────────────────────────
// 1. 오탐 테스트 — 정상 문장에서 검출 0
// ─────────────────────────────────────────────
console.log('\n[1] 오탐 테스트 (정상 문장 → 검출 0)');

const CLEAN_SENTENCES = [
    '오늘은 날씨가 매우 좋습니다.',
    '대한민국 국가 대표 선수가 회의 시작 전에 도착했다.',
    '나는 학교에 간다.',
    '이 물건의 저가 정책은 성공적이었다.',
    '연기가 자욱한 방 안에서 그를 찾았다.',
    '갖은 고생 끝에 목표를 이루었다.',
    '등살이 아파서 병원에 갔다.',
    '그는 우리 반의 똑똑이로 통한다.',
    '이것은 개이다.',
    '실수로 물수건을 떨어뜨렸다.',
    '문이 잠겨서 열쇠를 찾았다.',
    '눈이 소복이 쌓이다.',
    '나는 그를 스승으로 받들어 모셨다.',
    '책상 위에 책을 받치다.',
    '그는 조국에 목숨을 바치다.',
    '올해는 작년보다 사정이 낫다.',
    '고양이가 새끼를 낳다.',
    '선수층이 두껍다.',
    '두터운 신뢰를 쌓았다.',
    '공이 골대를 비껴갔다.',
    '자전거를 비켜갔다.',
    '그는 이미 훌륭한 학자가 되었다.',
    '내일이면 스무 살이 되어요.',
    '열심히 하면 될 수 있다.',
    '깍두기를 담갔다.',
    '그는 깍쟁이처럼 굴었다.',
    '지키다 보면 좋은 날이 온다.',
    '심부름을 시키다.',
    '키다리 아저씨를 읽었다.',
    '노력할수록 결과가 좋아진다.',
    '갈수록 태산이다.',
    '읍내에 다녀왔다.',
    '그때부터 열심히 공부했다.',
    '떳떳하게 살아야 한다.',
    '어제 사귄 친구와 만났다.',
    '시험을 치러 학교에 갔다.',
    '문을 잠가 두었다.',
    // 붙여 쓰는 것이 표준인 합성어 — 띄어쓰기 규칙이 건드리면 안 된다
    '별것도 아니다.',
    '들것을 준비했다.',
    '날것을 먹었다.',
    '탈것이 없다.',
    '실수없이 해냈다.',
    // 사전 항목이 합성어 내부에 매칭되면 안 된다
    '임마누엘 칸트를 읽었다.',
    '기회손실이 크다.',
    '정당체제 개편을 논의했다.',
    '사건내용을 확인했다.',
    '물건내역서를 출력했다.',
    '짓궂이 장난을 쳤다.',
    '어른께 문안하러 갔다.',
    '짐을 들어나르느라 힘들었다.'
];

test('직접 작성한 정상 문장 코퍼스', function () {
    const failures = [];
    for (const s of CLEAN_SENTENCES) {
        const r = detect(s);
        if (r.errorCount > 0) {
            failures.push(`"${s}" → ${r.errors.map(e => e.original + '→' + e.suggestion).join(', ')}`);
        }
    }
    assertEquals(failures.length, 0, `오탐 ${failures.length}건 발생:\n      ` + failures.join('\n      '));
});

// 타자 연습 데이터 = 검증된 정상 한국어 코퍼스
function collectStrings(node, out) {
    if (typeof node === 'string') { out.push(node); return out; }
    if (Array.isArray(node)) { node.forEach(n => collectStrings(n, out)); return out; }
    if (node && typeof node === 'object') { Object.values(node).forEach(n => collectStrings(n, out)); return out; }
    return out;
}

test('타자 연습 한국어 코퍼스', function () {
    const dir = path.join(__dirname, '..', 'data', 'typing', 'korean');
    if (!fs.existsSync(dir)) {
        console.log('      (코퍼스 디렉터리 없음 — 건너뜀)');
        return;
    }
    const texts = [];
    for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.json'))) {
        collectStrings(JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')), texts);
    }
    const korean = texts.filter(t => /[가-힣]/.test(t));
    const failures = [];
    for (const t of korean) {
        const r = detect(t);
        if (r.errorCount > 0) {
            failures.push(`"${t.slice(0, 40)}" → ${r.errors.map(e => e.original + '→' + e.suggestion).join(', ')}`);
        }
    }
    console.log(`      (검사 문장 ${korean.length}개)`);
    assertEquals(failures.length, 0, `오탐 ${failures.length}건 발생:\n      ` + failures.slice(0, 15).join('\n      '));
});

test('한국어 UI 문자열 코퍼스', function () {
    const file = path.join(__dirname, '..', 'i18n', 'ko.json');
    if (!fs.existsSync(file)) {
        console.log('      (i18n/ko.json 없음 — 건너뜀)');
        return;
    }
    const texts = collectStrings(JSON.parse(fs.readFileSync(file, 'utf8')), []);
    const korean = texts.filter(t => /[가-힣]/.test(t));
    const failures = [];
    for (const t of korean) {
        const r = detect(t);
        if (r.errorCount > 0) {
            failures.push(`"${t.slice(0, 40)}" → ${r.errors.map(e => e.original + '→' + e.suggestion).join(', ')}`);
        }
    }
    console.log(`      (검사 문장 ${korean.length}개)`);
    assertEquals(failures.length, 0, `오탐 ${failures.length}건 발생:\n      ` + failures.slice(0, 15).join('\n      '));
});

// ─────────────────────────────────────────────
// 2. 재현 테스트 — 오류를 실제로 잡는가
// ─────────────────────────────────────────────
console.log('\n[2] 재현 테스트 (오류 문장 → 검출)');

const ERROR_CASES = [
    ['됬다', '됐다'],
    ['일이 잘 됬어요', '일이 잘 됐어요'],
    ['넣어봤읍니다', '넣어봤습니다'],
    ['어떻해 이런일이', '어떡해 이런일이'],
    ['오랫만에 만났다', '오랜만에 만났다'],
    ['역활을 맡았다', '역할을 맡았다'],
    ['어짜피 늦었다', '어차피 늦었다'],
    ['희안한 일이다', '희한한 일이다'],
    ['닥달하지 마라', '닦달하지 마라'],
    ['설겆이를 했다', '설거지를 했다'],
    ['몇일 걸린다', '며칠 걸린다'],
    ['촛점이 맞다', '초점이 맞다'],
    ['눈쌀을 찌푸렸다', '눈살을 찌푸렸다'],
    ['곰곰히 생각했다', '곰곰이 생각했다'],
    ['잊혀진 계절', '잊힌 계절'],
    ['설레임이 가득하다', '설렘이 가득하다'],
    ['왠일로 왔니', '웬일로 왔니'],
    ['웬지 슬프다', '왠지 슬프다'],
    ['왠만하면 참아라', '웬만하면 참아라'],
    ['그러면 안되', '그러면 안 돼'],
    ['그렇게 하면 되요', '그렇게 하면 돼요'],
    ['할수있다', '할 수 있다'],
    ['갈수없다', '갈 수 없다'],
    ['먹을것이 많다', '먹을 것이 많다'],
    ['할줄알다', '할 줄 알다'],
    // 합성어 충돌을 피하려고 긴 형태·활용형으로 등록한 항목
    ['명예회손으로 고소했다', '명예훼손으로 고소했다'],
    ['서류를 건내주었다', '서류를 건네주었다'],
    ['사실이 들어났다', '사실이 드러났다'],
    ['궂이 그럴 필요는 없다', '굳이 그럴 필요는 없다']
];

test('오류 문장을 모두 검출', function () {
    const misses = [];
    for (const [input] of ERROR_CASES) {
        if (detect(input).errorCount === 0) misses.push(input);
    }
    assertEquals(misses.length, 0, `미검출 ${misses.length}건: ` + misses.join(', '));
});

test('교정문이 기댓값과 일치', function () {
    const wrong = [];
    for (const [input, expected] of ERROR_CASES) {
        const got = detect(input).corrected;
        if (got !== expected) wrong.push(`"${input}" → "${got}" (기대: "${expected}")`);
    }
    assertEquals(wrong.length, 0, `불일치 ${wrong.length}건:\n      ` + wrong.join('\n      '));
});

// ─────────────────────────────────────────────
// 3. 엔진 동작 테스트
// ─────────────────────────────────────────────
console.log('\n[3] 엔진 동작');

test('빈 문자열은 오류 0', function () {
    assertEquals(detect('').errorCount, 0, '빈 문자열');
});

test('어간 등록으로 활용형까지 검출', function () {
    assertEquals(detect('닥달했다').corrected, '닦달했다', '닥달했다');
    assertEquals(detect('닥달하는').corrected, '닦달하는', '닥달하는');
    assertEquals(detect('닥달하지').corrected, '닦달하지', '닥달하지');
});

test('words 사전은 앞뒤 경계를 지킨다', function () {
    assertEquals(detect('깍다').errorCount, 1, '깍다는 검출');
    assertEquals(detect('깍두기').errorCount, 0, '깍두기는 미검출');
});

test('한 문장에 여러 오류가 있어도 모두 교정', function () {
    const r = detect('됬다 그리고 몇일 후에 역활을 맡았다');
    assertEquals(r.errorCount, 3, '오류 3건');
    assertEquals(r.corrected, '됐다 그리고 며칠 후에 역할을 맡았다', '전부 교정');
});

test('문맥 의존 표현은 안내만 하고 교정하지 않는다', function () {
    const r = detect('학생으로서 최선을 다했다');
    assertEquals(r.errorCount, 0, '교정 대상 아님');
    assertEquals(r.notices.length > 0, true, '안내는 존재');
    assertEquals(r.corrected, '학생으로서 최선을 다했다', '원문 유지');
});

test('문장 부호 뒤 이중 공백 정리', function () {
    assertEquals(detect('안녕.  반가워').corrected, '안녕. 반가워', '이중 공백');
});

test('HTML 이스케이프', function () {
    assertEquals(SpellCheckClient.escapeHtml('<script>'), '&lt;script&gt;', '태그 이스케이프');
});

test('규칙 데이터가 자기 자신으로 교정하지 않는다', function () {
    const bad = [];
    for (const k in SpellCheckRules.always) if (SpellCheckRules.always[k] === k) bad.push(k);
    for (const k in SpellCheckRules.words) if (SpellCheckRules.words[k] === k) bad.push(k);
    assertEquals(bad.length, 0, '자기 자신 교정 항목: ' + bad.join(', '));
});

test('교정 결과를 다시 검사해도 오류가 없다 (수렴)', function () {
    const notConverged = [];
    for (const [input] of ERROR_CASES) {
        const once = detect(input).corrected;
        const twice = detect(once);
        if (twice.errorCount > 0) {
            notConverged.push(`"${input}" → "${once}" → ${twice.errors.map(e => e.original).join(',')}`);
        }
    }
    assertEquals(notConverged.length, 0, `미수렴 ${notConverged.length}건:\n      ` + notConverged.join('\n      '));
});

// ─────────────────────────────────────────────
// 결과 출력
// ─────────────────────────────────────────────
const dictSize = Object.keys(SpellCheckRules.always).length + Object.keys(SpellCheckRules.words).length;
console.log(`\n${'='.repeat(50)}`);
console.log(`사전 항목 ${dictSize}개 · 정규식 규칙 ${SpellCheckRules.patterns.length}개 · 안내 규칙 ${SpellCheckRules.ambiguous.length}개`);
console.log(`맞춤법 검사기 테스트 결과: ${passCount}개 통과 / ${failCount}개 실패`);
if (failCount === 0) {
    console.log('모든 테스트를 통과했습니다.');
} else {
    console.error(`${failCount}개의 테스트가 실패했습니다.`);
    process.exitCode = 1;
}
