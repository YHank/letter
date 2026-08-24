#!/usr/bin/env node
/**
 * 클린 URL 페이지 전수 검증
 *
 * 생성 페이지가 원본(index.html, navigation-manager.js)과 어긋나지 않았는지,
 * 캐시 버스터 버전이 파일마다 엇갈리지 않는지, 참조가 전부 실재하는지 검사한다.
 *
 * 실행: node tools/verify-pages.js
 * 종료 코드: 문제 0건이면 0, 있으면 1
 */

const fs = require('fs');
const path = require('path');
const { PAGES, ROUTE_MAP, HOME_ONLY_SCRIPTS, parseMaps, readCommonScripts } = require('./build-pages.js');

const ROOT = path.resolve(__dirname, '..');
const problems = [];
const notes = [];

function fail(area, msg) { problems.push(`[${area}] ${msg}`); }
function note(area, msg) { notes.push(`[${area}] ${msg}`); }
function read(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }
function exists(rel) { return fs.existsSync(path.join(ROOT, rel.replace(/^\//, ''))); }

const shell = read('index.html');
const generated = PAGES.map((p) => ({ page: p, rel: `${p.route}/index.html`, html: read(`${p.route}/index.html`) }));
const allHtml = [{ rel: 'index.html', html: shell }].concat(generated.map((g) => ({ rel: g.rel, html: g.html })));

// ── 1. 캐시 버스터 일관성: 같은 파일을 서로 다른 버전으로 참조하는 곳 ──────────
const versions = new Map(); // 파일경로 → Map(버전 → [출처])
function recordRefs(sourceLabel, text) {
    const re = /(?:src|href)="(\/(?:js|css)\/[^"]+\.(?:js|css))(\?[^"]*)?"/g;
    let m;
    while ((m = re.exec(text)) !== null) {
        const file = m[1];
        const ver = m[2] ? m[2].slice(1) : '(없음)';
        if (!versions.has(file)) versions.set(file, new Map());
        const byVer = versions.get(file);
        if (!byVer.has(ver)) byVer.set(ver, []);
        byVer.get(ver).push(sourceLabel);
    }
}
allHtml.forEach((h) => recordRefs(h.rel, h.html));
recordRefs('js/navigation-manager.js (scriptMap)', read('js/navigation-manager.js'));
recordRefs('sw.js (STATIC_ASSETS)', read('sw.js').replace(/'([^']+)'/g, 'src="$1"'));

const swUnversioned = [];
for (const [file, byVer] of versions) {
    if (byVer.size > 1) {
        const detail = [...byVer.entries()]
            .map(([v, srcs]) => `${v} ← ${[...new Set(srcs)].join(', ')}`)
            .join('  |  ');
        // sw.js가 버전 없이 캐시하는 건 별도 항목으로 다룬다
        const onlySwDiffers = [...byVer.entries()].every(
            ([v, srcs]) => v === '(없음)' ? srcs.every((s) => s.startsWith('sw.js')) : true
        ) && byVer.has('(없음)');
        if (onlySwDiffers) swUnversioned.push(file);
        else fail('캐시버스터', `${file} 버전 불일치 — ${detail}`);
    }
}

if (swUnversioned.length) {
    note('캐시버스터', `sw.js STATIC_ASSETS ${swUnversioned.length}개가 버전 쿼리 없이 등록됨 — `
        + `첫 요청에 프리캐시 미스가 나지만 곧 정확한 URL로 다시 캐시되므로 무해. `
        + `ignoreSearch로 맞추려 하면 캐시 버스팅이 무력화되니 쓰지 말 것`);
}

// ── 2. 참조 파일 실재 여부 ────────────────────────────────────────────────
allHtml.forEach(({ rel, html }) => {
    const re = /(?:src|href)="(\/[^"]+)"/g;
    let m;
    while ((m = re.exec(html)) !== null) {
        const url = m[1].replace(/\?.*$/, '');
        if (/^\/(js|css|img|i18n|data)\//.test(url) && !exists(url)) fail('참조', `${rel} → ${url} 없음`);
    }
});

// ── 3. 생성 페이지 ↔ navigation-manager 맵 일치 ──────────────────────────
const maps = parseMaps();
generated.forEach(({ page, rel, html }) => {
    const want = maps.scriptMap[page.fragment] || [];
    want.forEach((src) => {
        if (!html.includes(`src="${src}"`)) fail('scriptMap', `${rel}에 ${src} 없음`);
    });
    const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1];
    if (title !== maps.titleMap[page.fragment]) fail('title', `${rel}: "${title}" ≠ 맵 "${maps.titleMap[page.fragment]}"`);
    const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1];
    if (desc !== maps.descriptionMap[page.fragment]) fail('description', `${rel} 맵과 불일치`);
});

// ── 4. 생성 페이지 ↔ index.html 공통 스크립트 일치 ───────────────────────
const common = readCommonScripts(shell);
generated.forEach(({ rel, html }) => {
    common.forEach((src) => {
        if (!html.includes(`src="${src}"`)) fail('공통스크립트', `${rel}에 ${src} 없음`);
    });
    HOME_ONLY_SCRIPTS.forEach((file) => {
        if (new RegExp(`src="/js/${file.replace('.', '\\.')}[?"]`).test(html)) {
            fail('홈전용유출', `${rel}이 홈 전용 ${file}을 로드함`);
        }
    });
});

// ── 5. 초기화 함수 실재 여부 ──────────────────────────────────────────────
generated.forEach(({ page, rel, html }) => {
    if (!html.includes(`window.${page.init}`)) fail('초기화', `${rel}에 ${page.init} 호출 없음`);
    const owner = (maps.scriptMap[page.fragment] || [])
        .map((s) => 'js/' + s.replace(/^\/js\//, '').replace(/\?.*$/, ''))
        .find((f) => exists('/' + f) && new RegExp(`(function\\s+${page.init}\\b|window\\.${page.init}\\s*=)`).test(read(f)));
    if (!owner) fail('초기화', `${page.init} 정의를 ${page.fragment}의 스크립트에서 찾지 못함`);
});

// ── 6. 모든 js의 fetch가 절대경로인가 (하위 디렉토리에서 404 방지) ────────
fs.readdirSync(path.join(ROOT, 'js')).filter((f) => f.endsWith('.js')).forEach((f) => {
    const src = read(`js/${f}`);
    const re = /fetch\(\s*([`'"])([^`'"]*)\1/g;
    let m;
    while ((m = re.exec(src)) !== null) {
        const url = m[2];
        if (url && !/^(\/|https?:|\/\/)/.test(url) && !url.startsWith('${')) {
            fail('fetch경로', `js/${f}: 상대경로 fetch("${url}") — 서브페이지에서 404`);
        }
    }
});

// ── 7. 메타 고유성 (canonical / title 중복 없음) ─────────────────────────
const canons = new Map();
allHtml.forEach(({ rel, html }) => {
    const c = (html.match(/<link rel="canonical" href="([^"]*)"/) || [])[1];
    if (!c) return fail('canonical', `${rel}에 canonical 없음`);
    if (canons.has(c)) fail('canonical', `중복: ${rel} 와 ${canons.get(c)} 가 같은 ${c}`);
    canons.set(c, rel);
    if (!c.endsWith('/')) fail('canonical', `${rel}: trailing slash 없음 (${c})`);
});

// ── 8. sitemap ↔ 실제 파일 ───────────────────────────────────────────────
const sitemapUrls = [...read('sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
sitemapUrls.forEach((u) => {
    const p = u.replace(/^https:\/\/letter\.ymyhome\.loan/, '');
    const file = p === '/' ? 'index.html' : p.replace(/^\//, '') + 'index.html';
    if (!exists('/' + file)) fail('sitemap', `${u} → ${file} 없음`);
    if (!canons.has(u)) fail('sitemap', `${u}를 canonical로 선언한 페이지가 없음`);
});
canons.forEach((rel, c) => {
    if (!sitemapUrls.includes(c)) fail('sitemap', `${rel}의 canonical ${c}가 sitemap에 없음`);
});

// ── 9. sw.js STATIC_ASSETS 실재 여부 ─────────────────────────────────────
const swAssets = [...read('sw.js').matchAll(/^\s*'(\/[^']*)',?\s*$/gm)].map((m) => m[1]);
swAssets.forEach((a) => {
    const file = a.endsWith('/') ? a + 'index.html' : a;
    if (!exists(file)) fail('sw.js', `STATIC_ASSETS의 ${a} 없음`);
});

// ── 10. 링크 무결성 + 구조 잔재 ──────────────────────────────────────────
allHtml.forEach(({ rel, html }) => {
    if (/data-move=/.test(html)) fail('잔재', `${rel}에 data-move 남음`);
    if (/hreflang=/.test(html)) fail('잔재', `${rel}에 hreflang 남음`);
    if (/href="\/\?page=/.test(html)) fail('잔재', `${rel}에 ?page= 링크 남음`);
    Object.values(ROUTE_MAP).forEach((route) => {
        if (html.includes(`href="${route}"`) && !exists(route + 'index.html')) {
            fail('링크', `${rel} → ${route} 대상 없음`);
        }
    });
    const opens = (html.match(/<div\b/g) || []).length;
    const closes = (html.match(/<\/div>/g) || []).length;
    if (opens !== closes) fail('구조', `${rel}: <div> ${opens}개 vs </div> ${closes}개`);
});

// ── 11. 조각의 <script src>가 scriptMap과 충돌하지 않는가 ────────────────
// 생성 시 조각의 script 태그를 제거하므로, 조각에 다른 버전이 적혀 있으면
// 조용히 사라져 눈치채기 어렵다. 불일치를 여기서 잡는다.
PAGES.forEach((page) => {
    const frag = read(`html/${page.fragment}.html`);
    const want = maps.scriptMap[page.fragment] || [];
    [...frag.matchAll(/<script\s+src="([^"]+)"/g)].forEach((m) => {
        const src = m[1];
        if (!want.includes(src)) {
            const file = src.replace(/\?.*$/, '');
            const sameFile = want.find((w) => w.replace(/\?.*$/, '') === file);
            if (sameFile) fail('조각스크립트', `html/${page.fragment}.html의 ${src} ≠ scriptMap의 ${sameFile}`);
            else fail('조각스크립트', `html/${page.fragment}.html의 ${src}가 scriptMap에 없음 — 생성 시 유실됨`);
        }
    });
});

// ── 결과 ─────────────────────────────────────────────────────────────────
console.log(`검사 대상: ${allHtml.length}개 HTML, ${versions.size}개 정적 자원\n`);
if (notes.length) {
    console.log('참고 사항:');
    notes.forEach((n) => console.log('  · ' + n));
    console.log('');
}
if (problems.length === 0) {
    console.log('문제 0건 — 전체 통과');
    process.exit(0);
}
console.log(`문제 ${problems.length}건:`);
problems.forEach((p) => console.log('  ✗ ' + p));
process.exit(1);
