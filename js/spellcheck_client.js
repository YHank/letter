// 클라이언트 사이드 한글 맞춤법 검사기
// 기본적인 맞춤법 규칙만 검사합니다.

const SpellCheckClient = {
    // 로컬 맞춤법 사전 비활성화 (2026-04-08)
    // 사유: 왠지→웬지, 웬일→왠일 등 표준어/비표준어 반전 오류가 있어
    // 사용자 텍스트를 오염시킬 수 있음. 다음 iframe 맞춤법 검사기를 주력으로 사용.
    corrections: {},
    
    // 맞춤법 검사 실행
    check: function(text) {
        const errors = [];
        let correctedText = text;
        
        // 1. 사전 기반 검사
        for (const [wrong, correct] of Object.entries(this.corrections)) {
            const regex = new RegExp(wrong, 'gi');
            const matches = text.matchAll(regex);
            
            for (const match of matches) {
                errors.push({
                    type: 'spelling',
                    original: match[0],
                    suggestion: correct,
                    position: match.index,
                    message: `"${match[0]}"은(는) "${correct}"(으)로 쓰는 것이 맞습니다.`
                });
                
                correctedText = correctedText.replace(regex, correct);
            }
        }
        
        // 2. 패턴 기반 검사
        // 2-1. 조사 띄어쓰기 (의, 를, 을, 는, 은, 이, 가)
        const josaPattern = /([가-힣]+)(의|를|을|는|은|이|가)\s+/g;
        const josaMatches = text.matchAll(josaPattern);
        
        for (const match of josaMatches) {
            errors.push({
                type: 'spacing',
                original: match[0],
                suggestion: match[1] + match[2],
                position: match.index,
                message: `조사 "${match[2]}"는 앞 단어에 붙여 써야 합니다.`
            });
        }
        
        // 2-2. 반복되는 자음/모음
        const repeatPattern = /([ㄱ-ㅎㅏ-ㅣ])\1{2,}/g;
        const repeatMatches = text.matchAll(repeatPattern);
        
        for (const match of repeatMatches) {
            errors.push({
                type: 'typo',
                original: match[0],
                suggestion: match[1],
                position: match.index,
                message: `불필요한 반복이 있습니다.`
            });
        }
        
        // 2-3. 문장 끝 띄어쓰기
        const endSpacePattern = /([.!?])\s{2,}/g;
        const endSpaceMatches = text.matchAll(endSpacePattern);
        
        for (const match of endSpaceMatches) {
            errors.push({
                type: 'spacing',
                original: match[0],
                suggestion: match[1] + ' ',
                position: match.index,
                message: `문장 부호 뒤에는 한 칸만 띄어 쓰세요.`
            });
        }
        
        return {
            original: text,
            corrected: correctedText,
            errors: errors,
            errorCount: errors.length
        };
    },
    
    // 결과를 HTML로 포맷팅
    formatResults: function(results) {
        if (results.errorCount === 0) {
            return '<div class="alert alert-success">맞춤법 오류가 발견되지 않았습니다! ✅</div>';
        }
        
        let html = `
            <div class="alert alert-info">
                <strong>발견된 오류: ${results.errorCount}개</strong>
            </div>
            <div class="list-group">
        `;
        
        results.errors.forEach((error, index) => {
            const typeLabel = {
                'spelling': '맞춤법',
                'spacing': '띄어쓰기',
                'typo': '오타'
            }[error.type] || '기타';
            
            html += `
                <div class="list-group-item">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <span class="badge bg-warning text-dark me-2">${typeLabel}</span>
                            <strong class="text-danger">${this.escapeHtml(error.original)}</strong>
                            <span class="mx-2">→</span>
                            <strong class="text-success">${this.escapeHtml(error.suggestion)}</strong>
                        </div>
                    </div>
                    <small class="text-muted d-block mt-1">${this.escapeHtml(error.message)}</small>
                </div>
            `;
        });
        
        html += '</div>';
        
        if (results.corrected !== results.original) {
            html += `
                <div class="mt-3">
                    <h5>교정된 텍스트:</h5>
                    <div class="p-3 bg-light border rounded">
                        ${this.escapeHtml(results.corrected)}
                    </div>
                </div>
            `;
        }
        
        return html;
    },
    
    escapeHtml: function(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// 전역 함수로 노출
window.SpellCheckClient = SpellCheckClient;