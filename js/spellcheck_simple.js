// 간단한 맞춤법 검사기 초기화 함수
function initializeSimpleSpellchecker() {
    console.log('간단한 맞춤법 검사기 초기화 중...');
    
    const inputArea = document.getElementById('simple_spellcheck_input');
    const checkBtn = document.getElementById('simple_check_btn');
    const clearBtn = document.getElementById('simple_clear_btn');
    const applyBtn = document.getElementById('simple_apply_btn');
    const resultsDiv = document.getElementById('simple_results');
    
    if (!inputArea || !checkBtn || !clearBtn) {
        console.error('필수 요소를 찾을 수 없습니다');
        return;
    }
    
    let lastResults = null;
    
    // 맞춤법 검사
    checkBtn.addEventListener('click', function() {
        const text = inputArea.value.trim();
        if (!text) {
            alert('검사할 텍스트를 입력해주세요.');
            return;
        }
        
        // 검사 실행
        if (typeof SpellCheckClient !== 'undefined') {
            lastResults = SpellCheckClient.check(text);
            
            // 결과 표시
            resultsDiv.innerHTML = SpellCheckClient.formatResults(lastResults);
            resultsDiv.style.display = 'block';
            
            // 교정 버튼 표시/숨김
            if (lastResults.errorCount > 0 && lastResults.corrected !== lastResults.original) {
                applyBtn.style.display = 'inline-block';
            } else {
                applyBtn.style.display = 'none';
            }
        } else {
            console.error('SpellCheckClient가 로드되지 않았습니다.');
            alert('맞춤법 검사 모듈을 로드하는 중 오류가 발생했습니다.');
        }
    });
    
    // 지우기
    clearBtn.addEventListener('click', function() {
        inputArea.value = '';
        resultsDiv.style.display = 'none';
        applyBtn.style.display = 'none';
        lastResults = null;
    });
    
    // 교정 적용
    applyBtn.addEventListener('click', function() {
        if (lastResults && lastResults.corrected) {
            inputArea.value = lastResults.corrected;
            
            // 피드백 메시지
            const alert = document.createElement('div');
            alert.className = 'alert alert-success alert-dismissible fade show mt-2';
            alert.innerHTML = `
                교정된 텍스트가 적용되었습니다!
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
            inputArea.parentElement.appendChild(alert);
            
            // 3초 후 자동 제거
            setTimeout(() => {
                alert.remove();
            }, 3000);
        }
    });
    
    // 엔터키로 검사 실행
    inputArea.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'Enter') {
            checkBtn.click();
        }
    });
}