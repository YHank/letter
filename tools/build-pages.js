#!/usr/bin/env node
/**
 * 클린 URL 정적 페이지 생성기
 *
 * index.html을 셸로 삼고 html/{조각}.html을 본문으로 합쳐
 * /{경로}/index.html 형태의 완전한 독립 페이지를 만든다.
 *
 * 실행: node tools/build-pages.js
 *
 * index.html의 nav/footer/head 공통 리소스를 매번 다시 읽으므로
 * 셸이 바뀌면 이 스크립트를 다시 돌리면 된다.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ORIGIN = 'https://letter.ymyhome.loan';

/**
 * 페이지 정의: 조각 이름 → 클린 경로 + JSON-LD용 앱 이름.
 *
 * title / description / 전용 스크립트는 여기에 적지 않는다.
 * js/navigation-manager.js의 pageTitleMap·pageDescriptionMap·scriptMap을
 * 단일 원본(SSOT)으로 삼아 파싱해 온다. 하드코딩하면 그쪽에서 스크립트 버전이
 * 올라갔을 때 조용히 어긋난다 (실제로 spellcheck_rules.js 누락 사고가 있었다).
 */
const PAGES = [
    { fragment: 'spellcheck_simple', route: 'spellcheck', init: 'initializeSimpleSpellchecker', appName: '한글 맞춤법 검사기' },
    { fragment: 'salary', route: 'salary', init: 'initializeSalaryPage', appName: '연봉 실수령액 계산기' },
    { fragment: 'typing_practice', route: 'typing-practice', init: 'initializeTypingPractice', appName: '타자 연습' },
    { fragment: 'insurance_calculator', route: 'insurance-calculator', init: 'initializeInsuranceCalculator', appName: '4대보험료 계산기' },
    { fragment: 'severancepay', route: 'severance-pay', init: 'initializeSeverancePay', appName: '퇴직금 계산기' },
    { fragment: 'scientific_calculator', route: 'scientific-calculator', init: 'initializeScientificCalculator', appName: '공학용 계산기' }
];

/** navigation-manager.js에서 맵 리터럴을 파싱한다 (브라우저용 클래스라 require 불가) */
function parseMaps() {
    const src = fs.readFileSync(path.join(ROOT, 'js', 'navigation-manager.js'), 'utf8');

    function block(name) {
        const m = src.match(new RegExp('this\\.' + name + '\\s*=\\s*\\{([\\s\\S]*?)\\n\\s*\\};'));
        if (!m) throw new Error(`navigation-manager.js에서 ${name}을 찾지 못했습니다`);
        return m[1];
    }

    const scriptMap = {};
    const scriptRe = /'([^']+)'\s*:\s*\[([^\]]*)\]/g;
    let m;
    const scriptBlock = block('scriptMap');
    while ((m = scriptRe.exec(scriptBlock)) !== null) {
        scriptMap[m[1]] = (m[2].match(/'[^']+'/g) || []).map((x) => x.slice(1, -1));
    }

    function stringMap(name) {
        const out = {};
        const re = /'([^']+)'\s*:\s*'((?:[^'\\]|\\.)*)'/g;
        const blk = block(name);
        let e;
        while ((e = re.exec(blk)) !== null) out[e[1]] = e[2].replace(/\\'/g, "'");
        return out;
    }

    return {
        scriptMap,
        titleMap: stringMap('pageTitleMap'),
        descriptionMap: stringMap('pageDescriptionMap')
    };
}

/**
 * 홈 전용 스크립트 — 서브페이지에서 제외한다.
 *
 * index.js와 navigation-manager.js는 홈 DOM(#letter_count 등)에 의존하고,
 * 나머지는 홈 에디터 전용 기능이다. Google 번역 위젯도 제외한다 —
 * 콜백 googleTranslateElementInit이 index.js에만 있고 컨테이너
 * #google_translate_element도 홈에만 있어 콜백 미정의 오류만 난다.
 * 다국어는 i18n.js가 4개 언어로 처리한다.
 */
const HOME_ONLY_SCRIPTS = [
    'index.js',
    'navigation-manager.js',
    'text-analyzer.js',
    'advanced-analyzer.js',
    'analysis-ui.js',
    'storage-manager.js',
    'undo-redo.js',
    'keyboard-handler.js'
];

/**
 * 서브페이지 공통 스크립트를 index.html에서 읽어온다.
 * 하드코딩하면 index.html에서 캐시 버스터 버전이 올라갔을 때 조용히 어긋난다.
 */
function readCommonScripts(shell) {
    const all = (shell.match(/<script\s+src="(\/js\/[^"]+)"/g) || [])
        .map((tag) => tag.match(/src="([^"]+)"/)[1]);

    const common = all.filter((src) => {
        const file = src.replace(/^\/js\//, '').replace(/\?.*$/, '');
        return !HOME_ONLY_SCRIPTS.includes(file);
    });

    if (common.length === 0) throw new Error('index.html에서 공통 스크립트를 찾지 못했습니다');
    return common;
}

/** 조각 이름 → 클린 경로 (nav/footer 링크 치환 및 리다이렉트 shim 생성에 공용) */
const ROUTE_MAP = PAGES.reduce((acc, p) => {
    acc[p.fragment] = '/' + p.route + '/';
    return acc;
}, {});

function readShell() {
    return fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
}

/** index.html <head>에서 페이지 고유 메타를 걷어내고 공통 리소스만 남긴다 */
function extractCommonHead(shell) {
    const headMatch = shell.match(/<head>([\s\S]*?)<\/head>/);
    if (!headMatch) throw new Error('index.html에서 <head>를 찾지 못했습니다');
    let head = headMatch[1];

    const strip = [
        /[ \t]*<title>[\s\S]*?<\/title>\r?\n?/g,
        /[ \t]*<meta\s+name="description"[^>]*>\r?\n?/g,
        /[ \t]*<meta\s+name="keywords"[^>]*>\r?\n?/g,
        /[ \t]*<link\s+rel="canonical"[^>]*>\r?\n?/g,
        /[ \t]*<link\s+rel="alternate"\s+hreflang[^>]*>\r?\n?/g,
        /[ \t]*<meta\s+property="og:[^>]*>\r?\n?/g,
        /[ \t]*<meta\s+property="article:[^>]*>\r?\n?/g,
        /[ \t]*<meta\s+name="twitter:[^>]*>\r?\n?/g,
        /[ \t]*<script\s+type="application\/ld\+json">[\s\S]*?<\/script>\r?\n?/g
    ];
    strip.forEach((re) => { head = head.replace(re, ''); });

    // 주석만 남은 빈 줄 정리
    head = head.replace(/\r?\n[ \t]*<!--[^>]*-->[ \t]*(?=\r?\n[ \t]*<!--)/g, '');
    head = head.replace(/(\r?\n[ \t]*){3,}/g, '\n\n');
    return head.trim();
}

function extractBlock(shell, startRe, endTag, label) {
    const start = shell.search(startRe);
    if (start === -1) throw new Error(`index.html에서 ${label} 시작을 찾지 못했습니다`);
    const end = shell.indexOf(endTag, start);
    if (end === -1) throw new Error(`index.html에서 ${label} 끝을 찾지 못했습니다`);
    return shell.slice(start, end + endTag.length);
}

/** nav/footer의 data-move 링크를 실제 경로로 바꾸고 현재 페이지를 활성 표시 */
function rewriteLinks(html, currentFragment) {
    let out = html;

    // <a ... data-move="salary" ... href="#" ...> 형태 (속성 순서 무관)
    out = out.replace(/<a\b[^>]*>/g, (tag) => {
        const moveMatch = tag.match(/\sdata-move="([^"]+)"/);
        if (!moveMatch) return tag;
        const route = ROUTE_MAP[moveMatch[1]];
        if (!route) return tag;

        let next = tag.replace(/\sdata-move="[^"]*"/, '');
        next = next.replace(/\shref="[^"]*"/, ` href="${route}"`);
        if (!/\shref="/.test(next)) {
            next = next.replace(/^<a/, `<a href="${route}"`);
        }
        if (moveMatch[1] === currentFragment && /class="[^"]*nav-link/.test(next)) {
            next = next.replace(/class="([^"]*)"/, 'class="$1 active"');
            next = next.replace(/^<a/, '<a aria-current="page"');
        }
        return next;
    });

    // 홈 링크는 서브페이지에서 활성 해제
    out = out.replace(
        /<a class="nav-link active" aria-current="page" href="\/"/,
        '<a class="nav-link" href="/"'
    );
    return out;
}

/** 조각에서 전용 스크립트 태그를 떼어낸다 (셸이 직접 로드하므로 중복 방지) */
function stripFragmentScripts(fragmentHtml) {
    return fragmentHtml.replace(/[ \t]*<script\s+src="[^"]*"[^>]*><\/script>\r?\n?/g, '').trimEnd();
}

function buildJsonLd(page) {
    return JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: page.appName,
        url: `${ORIGIN}/${page.route}/`,
        description: page.description,
        applicationCategory: 'UtilityApplication',
        operatingSystem: 'All',
        inLanguage: 'ko',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'KRW' },
        isPartOf: { '@type': 'WebSite', name: '글자수세기', url: `${ORIGIN}/` }
    }, null, 4).split('\n').map((l, i) => (i === 0 ? l : '        ' + l)).join('\n');
}

function buildPageMeta(page) {
    const url = `${ORIGIN}/${page.route}/`;
    return `        <title>${page.title}</title>
        <meta name="description" content="${page.description}">
        <link rel="canonical" href="${url}">
        <meta property="og:locale" content="ko_KR">
        <meta property="og:type" content="website">
        <meta property="og:title" content="${page.title}">
        <meta property="og:description" content="${page.description}">
        <meta property="og:url" content="${url}">
        <meta property="og:site_name" content="글자수세기">
        <meta property="og:image" content="${ORIGIN}/img/logo.webp">
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="${page.title}">
        <meta name="twitter:description" content="${page.description}">
        <meta name="twitter:image" content="${ORIGIN}/img/logo.webp">

        <script type="application/ld+json">
        ${buildJsonLd(page)}
        </script>`;
}

function buildInitScript(page) {
    return `        <script>
            document.addEventListener('DOMContentLoaded', function () {
                if (window.Toast) window.Toast.init();
                if (window.ErrorHandler) window.ErrorHandler.init();

                if (window.pwaManager) {
                    window.pwaManager.init();
                    window.pwaManager.setupNetworkMonitoring();
                }

                if (window.MobileTouchHandler) {
                    window.mobileHandler = window.mobileHandler || new window.MobileTouchHandler();
                    window.mobileHandler.init();
                }

                if (window.bootstrap) {
                    document.querySelectorAll('.dropdown-toggle').forEach(function (el) {
                        new window.bootstrap.Dropdown(el);
                    });
                }

                if (typeof window.${page.init} === 'function') {
                    try {
                        window.${page.init}();
                    } catch (error) {
                        console.error('페이지 초기화 실패: ${page.route}', error);
                    }
                }

                if (window.i18nManager) {
                    window.i18nManager.init().catch(function (error) {
                        console.error('다국어 초기화 실패', error);
                    });
                }
            });
        </script>`;
}

function buildPage(page, parts) {
    const fragmentPath = path.join(ROOT, 'html', `${page.fragment}.html`);
    const fragment = stripFragmentScripts(fs.readFileSync(fragmentPath, 'utf8'));

    const scripts = parts.commonScripts.concat(page.scripts)
        .map((src) => `        <script src="${src}" defer></script>`)
        .join('\n');

    return `<!DOCTYPE html>
<html lang="ko">
    <head>
${parts.commonHead.split('\n').map((l) => (l.trim() ? '        ' + l.trim() : l)).join('\n')}

${buildPageMeta(page)}
    </head>
    <body>
        <script>
            // HTTPS 강제 적용
            if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
                location.replace('https:' + window.location.href.substring(window.location.protocol.length));
            }
        </script>
${rewriteLinks(parts.nav, page.fragment)}
${parts.topAd}
        <main class="container" role="main" id="main-content">
${fragment}
        </main>
${rewriteLinks(parts.footer, page.fragment)}

${scripts}
${buildInitScript(page)}
    </body>
</html>
`;
}

function main() {
    // navigation-manager.js의 맵을 원본으로 삼아 각 페이지에 주입한다
    const maps = parseMaps();
    PAGES.forEach((page) => {
        page.title = maps.titleMap[page.fragment];
        page.description = maps.descriptionMap[page.fragment];
        page.scripts = maps.scriptMap[page.fragment] || [];

        if (!page.title || !page.description) {
            throw new Error(`navigation-manager.js에 ${page.fragment}의 title/description이 없습니다`);
        }
        if (page.scripts.length === 0) {
            throw new Error(`navigation-manager.js의 scriptMap에 ${page.fragment} 항목이 없습니다`);
        }
    });

    const shell = readShell();
    const parts = {
        commonHead: extractCommonHead(shell),
        nav: extractBlock(shell, /<nav class="navbar/, '</nav>', 'nav'),
        topAd: extractBlock(shell, /<div class="container">\s*\r?\n\s*<div class="row px-0 mx-0 justify-content-center mt-4 d-none d-lg-flex">/, '</div>\n        </div>', '상단 광고'),
        footer: extractBlock(shell, /<footer class="mt-5"/, '</footer>', 'footer'),
        commonScripts: readCommonScripts(shell)
    };

    PAGES.forEach((page) => {
        const dir = path.join(ROOT, page.route);
        fs.mkdirSync(dir, { recursive: true });
        const html = buildPage(page, parts);
        fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8');
        console.log(`생성: /${page.route}/index.html  (${html.length.toLocaleString()} bytes)`);
        console.log(`      전용 스크립트: ${page.scripts.join(', ')}`);
    });

    console.log(`\n총 ${PAGES.length}개 페이지 생성 완료`);
}

if (require.main === module) main();

module.exports = { PAGES, ROUTE_MAP, HOME_ONLY_SCRIPTS, parseMaps, readCommonScripts };
