// 클라이언트 사이드 한글 맞춤법 검사기
// 기본적인 맞춤법 규칙만 검사합니다.

const SpellCheckClient = {
    // 자주 틀리는 맞춤법 사전
    corrections: {
        // 띄어쓰기
        '할수있': '할 수 있',
        '할수없': '할 수 없',
        '될수있': '될 수 있',
        '될수없': '될 수 없',
        '할수도': '할 수도',
        '그렇치만': '그렇지만',
        '어떻해': '어떻게',
        '됬': '됐',
        '됀': '된',
        '왠지': '웬지',
        '웬일': '왠일',
        '어떻게': '어떻게',
        '어떡해': '어떡해',
        '돼요': '돼요',
        '되요': '돼요',
        '됩니다': '됩니다',
        '됍니다': '됩니다',
        '안되': '안 돼',
        '안돼': '안 돼',
        '그래도': '그래도',
        '그레도': '그래도',
        '뭐에요': '뭐예요',
        '뭐예요': '뭐예요',
        '거에요': '거예요',
        '거예요': '거예요',
        '봬요': '뵙어요',
        '뵈요': '뵙어요',
        '알맞는': '알맞은',
        '어맞는': '어울리는',
        '했읍니다': '했습니다',
        '됬읍니다': '됐습니다',
        '하셨읍니다': '하셨습니다',
        '되욌': '되었',
        '됬어': '됐어',
        '됬는': '됐는',
        '틀렸': '틀렸',
        '틀렸어': '틀렸어',
        '맞췄': '맞췄',
        '맞추': '맞추',
        '맞히': '맞히',
        '늘이': '늘이',
        '늘리': '늘리',
        '부치': '부치',
        '붙이': '붙이',
        '부쳐': '부쳐',
        '붙여': '붙여',
        '띄여': '띄어',
        '띄워': '띄워',
        '메꾸': '메우',
        '메꿔': '메워',
        '채꾸': '채우',
        '채꿔': '채워',
        '바꾸': '바꾸',
        '바꿔': '바꿔',
        '갈께': '갈게',
        '할께': '할게',
        '될께': '될게',
        '먹을께': '먹을게',
        '했네': '했네',
        '했나': '했나',
        '왠만': '웬만',
        '웬만': '웬만',
        '어떻': '어떻',
        '어떡': '어떡',
        '며칠': '며칠',
        '몇일': '며칠',
        '몇칠': '며칠',
        '예전': '예전',
        '옛전': '예전',
        '예날': '옛날',
        '옛날': '옛날',
        '어따': '얻다',
        '얻따': '얻다',
        '잃따': '잃다',
        '잃어': '잃어',
        '읽으': '읽으',
        '읽어': '읽어',
        '없애': '없애',
        '없에': '없애',
        '했습니다': '했습니다',
        '했읍니다': '했습니다',
        '합니다': '합니다',
        '함니다': '합니다',
        '됩니다': '됩니다',
        '됨니다': '됩니다',
        '있습니다': '있습니다',
        '있읍니다': '있습니다',
        '없습니다': '없습니다',
        '없읍니다': '없습니다'
    },
    
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