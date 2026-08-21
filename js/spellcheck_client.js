// 클라이언트 사이드 한글 맞춤법 검사 엔진
//
// 규칙 데이터는 js/spellcheck_rules.js가 갖고, 이 파일은 매칭만 담당한다.
// 규칙 추가는 데이터 파일만 고치면 되고 엔진은 손대지 않는다.
//
// 매칭 순서
//   1) always  사전 — 경계 없이 부분 문자열 검사 (어간 등록이라 활용형까지 잡힘)
//   2) words   사전 — 앞뒤 한글 경계를 확인한 뒤에만 오류로 인정
//   3) patterns 정규식 — 되/돼, 왠/웬, 의존명사 띄어쓰기
//   4) ambiguous — 교정하지 않고 "확인 필요"로만 안내
//
// 겹치는 매치는 긴 쪽을 남긴다. 교정문은 뒤에서부터 치환해 인덱스 밀림을 막는다.

const SpellCheckClient = {

    // ── 한글 판별 유틸 ────────────────────────────────────────────────
    isHangulChar: function (ch) {
        if (!ch) return false;
        const c = ch.charCodeAt(0);
        return (c >= 0xAC00 && c <= 0xD7A3) || (c >= 0x3131 && c <= 0x318E);
    },

    // 종성이 'ㄹ'인지 — 관형형 어미 판별에 쓴다 (할/볼/갈 …)
    hasRieulBatchim: function (ch) {
        if (!ch) return false;
        const c = ch.charCodeAt(0);
        if (c < 0xAC00 || c > 0xD7A3) return false;
        return (c - 0xAC00) % 28 === 8;
    },

    getRules: function () {
        if (typeof SpellCheckRules !== 'undefined') return SpellCheckRules;
        if (typeof window !== 'undefined' && window.SpellCheckRules) return window.SpellCheckRules;
        return null;
    },

    // ── 검사 ─────────────────────────────────────────────────────────
    check: function (text) {
        const rules = this.getRules();
        if (!rules) {
            return { original: text, corrected: text, errors: [], errorCount: 0, notices: [], ready: false };
        }

        const matches = [];

        // 1) always — 어디에 나타나도 오류
        for (const wrong in rules.always) {
            if (!Object.prototype.hasOwnProperty.call(rules.always, wrong)) continue;
            const right = rules.always[wrong];
            let from = 0, at;
            while ((at = text.indexOf(wrong, from)) !== -1) {
                matches.push({
                    start: at,
                    end: at + wrong.length,
                    original: wrong,
                    suggestion: right,
                    type: 'spelling',
                    message: '"' + wrong + '"은(는) "' + right + '"(으)로 씁니다.'
                });
                from = at + wrong.length;
            }
        }

        // 2) words — 독립 단어일 때만 오류
        for (const wrong in rules.words) {
            if (!Object.prototype.hasOwnProperty.call(rules.words, wrong)) continue;
            const right = rules.words[wrong];
            let from = 0, at;
            while ((at = text.indexOf(wrong, from)) !== -1) {
                const prev = at > 0 ? text.charAt(at - 1) : '';
                const next = text.charAt(at + wrong.length);
                if (!this.isHangulChar(prev) && !this.isHangulChar(next)) {
                    matches.push({
                        start: at,
                        end: at + wrong.length,
                        original: wrong,
                        suggestion: right,
                        type: 'spelling',
                        message: '"' + wrong + '"은(는) "' + right + '"(으)로 씁니다.'
                    });
                }
                from = at + wrong.length;
            }
        }

        // 3) patterns — 정규식 규칙
        const patterns = rules.patterns || [];
        for (let i = 0; i < patterns.length; i++) {
            const rule = patterns[i];
            const re = new RegExp(rule.re.source, 'g');
            let m;
            while ((m = re.exec(text)) !== null) {
                if (m[0].length === 0) { re.lastIndex++; continue; }

                // 관형형 어미(ㄹ 받침) 뒤에서만 적용하는 띄어쓰기 규칙
                if (rule.requireRieul && !this.hasRieulBatchim(m[1])) continue;

                // 붙여 쓰는 것이 표준인 합성어(별것·들것·실수 …)는 건드리지 않는다
                if (rule.skipStems && rule.skipStems.indexOf(m[1]) !== -1) continue;

                // '-ㄹ수록'처럼 어미로 굳어진 형태는 건드리지 않는다
                if (rules.spacingExceptions) {
                    const tail = text.substr(m.index, m[0].length + 2);
                    if (rules.spacingExceptions.test(tail)) continue;
                }

                const replacement = rule.build.apply(null, m);
                if (replacement === m[0]) continue;

                matches.push({
                    start: m.index,
                    end: m.index + m[0].length,
                    original: m[0],
                    suggestion: replacement,
                    type: rule.type,
                    message: rule.message
                });
            }
        }

        // 겹침 해소 — 시작 위치 오름차순, 같으면 긴 매치 우선
        matches.sort(function (a, b) {
            if (a.start !== b.start) return a.start - b.start;
            return (b.end - b.start) - (a.end - a.start);
        });

        const errors = [];
        let lastEnd = -1;
        for (let i = 0; i < matches.length; i++) {
            if (matches[i].start < lastEnd) continue;
            errors.push(matches[i]);
            lastEnd = matches[i].end;
        }

        // 교정문 — 뒤에서부터 치환해야 앞쪽 인덱스가 밀리지 않는다
        let corrected = text;
        for (let i = errors.length - 1; i >= 0; i--) {
            const e = errors[i];
            corrected = corrected.slice(0, e.start) + e.suggestion + corrected.slice(e.end);
        }

        // 4) ambiguous — 교정하지 않고 안내만
        const notices = [];
        const ambiguous = rules.ambiguous || [];
        for (let i = 0; i < ambiguous.length; i++) {
            const rule = ambiguous[i];
            const re = new RegExp(rule.re.source, 'g');
            let m;
            while ((m = re.exec(text)) !== null) {
                if (m[0].length === 0) { re.lastIndex++; continue; }
                if (rule.needsPrevBoundary) {
                    const prev = m.index > 0 ? text.charAt(m.index - 1) : '';
                    if (this.isHangulChar(prev)) continue;
                }
                notices.push({ original: m[0], position: m.index, message: rule.message });
            }
        }

        return {
            original: text,
            corrected: corrected,
            errors: errors,
            errorCount: errors.length,
            notices: notices,
            ready: true
        };
    },

    // ── 결과 렌더링 ───────────────────────────────────────────────────
    formatResults: function (results) {
        if (!results.ready) {
            return '<div class="alert alert-danger">맞춤법 규칙을 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.</div>';
        }

        let html = '';

        if (results.errorCount === 0) {
            html += '<div class="alert alert-success mb-3">'
                 + '검사 범위 안에서는 오류가 발견되지 않았습니다. ✅'
                 + '<div class="small mt-1">등록된 표현만 검사하므로 모든 맞춤법 오류를 잡지는 못합니다.</div>'
                 + '</div>';
        } else {
            const spellCount = results.errors.filter(function (e) { return e.type === 'spelling'; }).length;
            const spaceCount = results.errorCount - spellCount;

            html += '<div class="alert alert-warning mb-3"><strong>발견된 오류: '
                 + results.errorCount + '개</strong>'
                 + '<span class="small ms-2">맞춤법 ' + spellCount + ' · 띄어쓰기 ' + spaceCount + '</span>'
                 + '</div><div class="list-group mb-3">';

            for (let i = 0; i < results.errors.length; i++) {
                const e = results.errors[i];
                const label = e.type === 'spacing' ? '띄어쓰기' : '맞춤법';
                const badge = e.type === 'spacing' ? 'bg-info' : 'bg-warning text-dark';
                html += '<div class="list-group-item">'
                     + '<div><span class="badge ' + badge + ' me-2">' + label + '</span>'
                     + '<strong class="text-danger">' + this.escapeHtml(e.original) + '</strong>'
                     + '<span class="mx-2">→</span>'
                     + '<strong class="text-success">' + this.escapeHtml(e.suggestion) + '</strong></div>'
                     + '<small class="text-muted d-block mt-1">' + this.escapeHtml(e.message) + '</small>'
                     + '</div>';
            }
            html += '</div>';
        }

        if (results.notices && results.notices.length > 0) {
            const seen = {};
            let noticeHtml = '';
            for (let i = 0; i < results.notices.length; i++) {
                const n = results.notices[i];
                if (seen[n.message]) continue;
                seen[n.message] = true;
                noticeHtml += '<li><strong>' + this.escapeHtml(n.original) + '</strong> — '
                           + this.escapeHtml(n.message) + '</li>';
            }
            if (noticeHtml) {
                html += '<div class="alert alert-secondary">'
                     + '<strong>확인해 보세요</strong>'
                     + '<div class="small mb-2">문맥에 따라 달라지는 표현이라 자동으로 고치지 않습니다.</div>'
                     + '<ul class="small mb-0">' + noticeHtml + '</ul></div>';
            }
        }

        if (results.corrected !== results.original) {
            html += '<div class="mt-3"><h5>교정된 텍스트</h5>'
                 + '<div class="p-3 bg-light border rounded" style="white-space: pre-wrap;">'
                 + this.escapeHtml(results.corrected) + '</div></div>';
        }

        return html;
    },

    // DOM 없이도 동작하도록 문자열 치환으로 처리한다 (Node 테스트 겸용)
    escapeHtml: function (text) {
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
};

if (typeof window !== 'undefined') {
    window.SpellCheckClient = SpellCheckClient;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SpellCheckClient;
}
