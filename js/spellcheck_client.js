// 클라이언트 사이드 한글 맞춤법 검사기
// 기본적인 맞춤법 규칙만 검사합니다.

const SpellCheckClient = {
    dictionary: null, // 로드된 사전이 저장될 객체
    dictionaryPath: 'spellcheck_dictionary.json', // 사전 파일 경로

    // 초기화 함수 (사전 로딩)
    // 실제 구현에서는 비동기 로직 (e.g., fetch) 후 콜백 또는 Promise를 사용해야 합니다.
    init: function(callback) {
        // 예시: fetch(this.dictionaryPath)
        //     .then(response => response.json())
        //     .then(data => {
        //         this.dictionary = data;
        //         console.log('맞춤법 사전 로드 완료.');
        //         if (callback) callback();
        //     })
        //     .catch(error => {
        //         console.error('맞춤법 사전 로드 실패:', error);
        //         // 로컬 사전을 폴백으로 사용하거나 오류 처리
        //         this.dictionary = {}; // 빈 사전으로 초기화 또는 기본값 사용
        //         if (callback) callback(error);
        //     });
        
        // 현재 환경에서는 동적 로딩 대신, dictionary가 이미 로드되었다고 가정하거나,
        // 테스트를 위해 수동으로 설정할 수 있도록 구조만 마련합니다.
        // 실제 사용 전에는 위의 비동기 로딩 로직을 활성화해야 합니다.
        if (!this.dictionary) {
            console.warn('사전이 로드되지 않았습니다. init()을 통해 사전을 로드하거나 수동으로 설정해주세요.');
            // 개발/테스트 목적으로 빈 객체로 초기화하여 오류 방지
            // 실제 서비스에서는 이 부분을 제거하거나, 적절한 기본 사전을 로드해야 합니다.
            this.dictionary = {};
        }
    },
    
    // 맞춤법 검사 실행
    check: function(text) {
        if (!this.dictionary || Object.keys(this.dictionary).length === 0) {
            // 사전이 비어있거나 로드되지 않은 경우, init 경고에 따라 빈 dictionary로 초기화 되었을 수 있음.
            console.warn('맞춤법 검사를 수행할 사전이 비어있거나 로드되지 않았습니다.');
            // 오류를 반환하거나, 원본 텍스트를 그대로 반환하는 등의 처리를 할 수 있습니다.
            // 여기서는 원본 텍스트와 함께 오류 메시지를 반환합니다.
            return {
                original: text,
                corrected: text,
                errors: [{type: 'system', original: '', suggestion: '', position: 0, message: '사전이 로드되지 않아 검사를 수행할 수 없습니다.'}],
                errorCount: 1
            };
        }

        const errors = [];
        
        // 1. 사전 기반 검사
        // 성능 최적화 제안:
        // - 대량의 텍스트의 경우, 전체 텍스트에 대해 각 사전 항목마다 RegExp를 반복 실행하는 것은 비효율적일 수 있습니다.
        // - RegExp 객체를 루프 내에서 매번 생성하는 것 (new RegExp)도 성능 저하 요인이 될 수 있습니다.
        //   사전이 고정되어 있다면, 정규식 객체를 미리 컴파일해둘 수 있습니다. (동적 로딩 시에는 어려움)
        // - 더 복잡하지만 효율적인 방법은 텍스트를 단어(토큰) 단위로 분리하고, 각 단어를 사전에 대해 검사하는 것입니다.
        //   또는 Aho-Corasick 같은 다중 문자열 검색 알고리즘을 사용하여 모든 사전 키를 한 번에 찾는 방법도 고려할 수 있습니다.
        // - String.prototype.replace를 반복 호출하면 많은 중간 문자열이 생성될 수 있습니다.
        //   변경 사항을 배열에 기록했다가 마지막에 한 번에 적용하는 것이 더 효율적일 수 있습니다.

        let currentTextFor 사전기반교정 = text; // 사전 기반 교정용 텍스트 복사본
        for (const [wrong, correct] of Object.entries(this.dictionary)) {
            const regex = new RegExp(this.escapeRegExp(wrong), 'g'); // 'gi' 대신 'g' 사용, 대소문자 구분은 한글에선 불필요
            
            let match;
            while((match = regex.exec(currentTextFor사전기반교정)) !== null) {
                 // 원본 텍스트 기준 위치 찾기 (주의: currentTextFor사전기반교정은 계속 변경되므로, 원본 text에서 위치를 찾아야하나, 여기서는 단순화)
                 // 정확한 오류 위치 보고를 위해서는 원본 텍스트를 기준으로 matchAll을 사용하고,
                 // 교정된 텍스트는 별도로 생성하는 것이 좋습니다.
                 // 여기서는 오류 위치가 교정 과정에서 다소 부정확해질 수 있음을 감안합니다.
                errors.push({
                    type: 'spelling',
                    original: match[0],
                    suggestion: correct,
                    position: match.index, // 이 위치는 currentTextFor사전기반교정 기준임
                    message: `"${match[0]}"은(는) "${correct}"(으)로 쓰는 것이 맞습니다.`
                });
            }
            // 교정된 텍스트 생성: 모든 오류를 찾은 후 또는 각 오류마다 적용할 수 있음.
            // 여기서는 각 규칙 적용 후 바로 텍스트를 업데이트합니다.
            currentTextFor사전기반교정 = currentTextFor사전기반교정.replace(regex, correct);
        }
        
        let correctedText = currentTextFor사전기반교정;

        // 2. 패턴 기반 검사 (사전 교정된 텍스트 기준 또는 원본 텍스트 기준)
        // 여기서는 사전 교정된 correctedText를 기준으로 추가 패턴 검사를 수행합니다.
        // 성능 최적화 제안:
        // - 패턴 기반 검사도 여러 정규식을 사용합니다. 가능하다면 하나의 정규식으로 결합하거나,
        //   텍스트를 한 번 순회하면서 여러 패턴을 동시에 검사하는 로직을 고려할 수 있습니다.

        let tempTextForPatternCorrection = correctedText;

        // 2-1. 조사 띄어쓰기 (의, 를, 을, 는, 은, 이, 가)
        const josaPattern = /([가-힣]+)(의|를|을|는|은|이|가)\s+/g;
        let patternMatch;
        while ((patternMatch = josaPattern.exec(tempTextForPatternCorrection)) !== null) {
            errors.push({
                type: 'spacing',
                original: patternMatch[0],
                suggestion: patternMatch[1] + patternMatch[2],
                position: patternMatch.index, // tempTextForPatternCorrection 기준 위치
                message: `조사 "${patternMatch[2]}"는 앞 단어에 붙여 써야 합니다.`
            });
        }
        // 패턴에 따른 correctedText 업데이트 (예시, 실제 적용시에는 더 정교한 로직 필요)
        correctedText = correctedText.replace(josaPattern, '$1$2');
        
        // 2-2. 반복되는 자음/모음
        const repeatPattern = /([ㄱ-ㅎㅏ-ㅣ])\1{2,}/g;
        while ((patternMatch = repeatPattern.exec(tempTextForPatternCorrection)) !== null) { // tempTextForPatternCorrection에서 검사
            errors.push({
                type: 'typo',
                original: patternMatch[0],
                suggestion: patternMatch[1],
                position: patternMatch.index,
                message: `불필요한 반복이 있습니다.`
            });
        }
        correctedText = correctedText.replace(repeatPattern, '$1');

        // 2-3. 문장 끝 띄어쓰기
        const endSpacePattern = /([.!?])\s{2,}/g;
        while ((patternMatch = endSpacePattern.exec(tempTextForPatternCorrection)) !== null) { // tempTextForPatternCorrection에서 검사
            errors.push({
                type: 'spacing',
                original: patternMatch[0],
                suggestion: patternMatch[1] + ' ',
                position: patternMatch.index,
                message: `문장 부호 뒤에는 한 칸만 띄어 쓰세요.`
            });
        }
        correctedText = correctedText.replace(endSpacePattern, '$1 ');
        
        // 오류 정렬 (위치 기준) - 원본 텍스트 기준 위치가 아니므로 정렬의 의미가 다소 퇴색될 수 있음.
        // 정확한 오류 리포팅 및 교정을 위해서는 모든 오류 위치를 원본 텍스트 기준으로 계산하고,
        // 교정은 그 위치 정보를 바탕으로 매우 신중하게 이루어져야 합니다.
        errors.sort((a, b) => a.position - b.position);

        return {
            original: text,
            corrected: correctedText,
            errors: errors,
            errorCount: errors.length
        };
    },
    
    // 결과를 HTML로 포맷팅
    formatResults: function(results) {
        if (results.errors.length === 0 || (results.errors.length === 1 && results.errors[0].type === 'system') ) {
             if (results.errors.length === 1 && results.errors[0].type === 'system') {
                return `<div class="alert alert-danger">${this.escapeHtml(results.errors[0].message)}</div>`;
             }
            return '<div class="alert alert-success">맞춤법 오류가 발견되지 않았습니다! ✅</div>';
        }
        
        let html = `
            <div class="alert alert-info">
                <strong>발견된 오류: ${results.errors.filter(e => e.type !== 'system').length}개</strong>
            </div>
            <div class="list-group">
        `;
        
        results.errors.forEach((error) => {
            if (error.type === 'system') return; // 시스템 메시지는 이미 위에서 처리했을 수 있음

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
                            <strong class="text-danger">${this.escapeHtml(error.original || '')}</strong>
                            <span class="mx-2">→</span>
                            <strong class="text-success">${this.escapeHtml(error.suggestion || '')}</strong>
                        </div>
                    </div>
                    <small class="text-muted d-block mt-1">${this.escapeHtml(error.message)}</small>
                </div>
            `;
        });
        
        html += '</div>';
        
        // correctedText가 원본과 다르고, 시스템 오류가 아닌 실제 교정 오류가 있었을 경우에만 교정된 텍스트 표시
        if (results.corrected !== results.original && results.errors.some(e => e.type !== 'system')) {
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
    },

    // 정규식 특수 문자 이스케이프 함수
    escapeRegExp: function(string) {
        if (typeof string !== 'string') return '';
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $&는 일치하는 전체 문자열을 의미
    }
};

// 초기화 호출 예시 (실제 사용 시에는 적절한 시점에 호출)
// SpellCheckClient.init(() => {
//     // 이 콜백은 사전 로딩이 완료된 후 실행됩니다.
//     console.log("SpellCheckClient is ready to use.");
//     // 예시 사용:
//     // const exampleText = "할수있습니다. 이것은 어떻해 된거죠? 반복되는자아아아암과 모오오오음 그리구 문장끝  띄어쓰기.";
//     // const results = SpellCheckClient.check(exampleText);
//     // console.log(results);
//     // document.getElementById('spellcheck-output').innerHTML = SpellCheckClient.formatResults(results);
// });

// 전역 함수로 노출 (기존 방식 유지)
window.SpellCheckClient = SpellCheckClient;

// 페이지 로드 시 자동 초기화 (선택 사항, 실제 환경에 맞게 조정)
// document.addEventListener('DOMContentLoaded', () => {
//     // SpellCheckClient.init(); // 자동 초기화가 필요하면 이 줄의 주석을 해제합니다.
//     // 데모 또는 테스트 목적: 즉시 사용할 수 있도록 빈 사전을 가진 채로 초기화
//     if (!SpellCheckClient.dictionary) { // 이미 초기화되지 않았다면
//          SpellCheckClient.dictionary = {}; // 테스트용 빈 사전
//          console.log("SpellCheckClient initialized with an empty dictionary for testing.");
//     }
// });
