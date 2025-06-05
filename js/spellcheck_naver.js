// 네이버 맞춤법 검사기 초기화 함수
function initializeNaverSpellchecker() {
    console.log('네이버 맞춤법 검사기 초기화 중...');
    
    const inputArea = document.getElementById('spellcheck_input_naver');
    const charCountSpan = document.getElementById('char_count');
    const checkBtn = document.getElementById('check_spelling_naver_btn');
    const clearBtn = document.getElementById('clear_text_naver_btn');
    const copyBtn = document.getElementById('copy_result_btn');
    const resultsDiv = document.getElementById('spellcheck_results_naver');
    
    // 요소 존재 확인
    if (!inputArea || !checkBtn || !clearBtn) {
        console.error('필수 요소를 찾을 수 없습니다:', {
            inputArea: !!inputArea,
            checkBtn: !!checkBtn,
            clearBtn: !!clearBtn
        });
        return;
    }
    
    // 글자수 카운트
    if (inputArea && charCountSpan) {
        inputArea.addEventListener('input', function() {
            const count = this.value.length;
            charCountSpan.textContent = count;
            
            if (count > 500) {
                this.value = this.value.substring(0, 500);
                charCountSpan.textContent = 500;
            }
        });
    }
    
    // 맞춤법 검사
    if (checkBtn && resultsDiv) {
        checkBtn.addEventListener('click', function() {
            const text = inputArea.value.trim();
            if (!text) {
                alert('검사할 텍스트를 입력해주세요.');
                return;
            }
            
            // 네이버 맞춤법 검사기 페이지로 이동
            const naverUrl = 'https://search.naver.com/search.naver?where=nexearch&sm=top_hty&fbm=0&ie=utf8&query=' + encodeURIComponent('맞춤법 검사 ' + text);
            
            resultsDiv.innerHTML = `
                <div class="alert alert-warning">
                    <h5>네이버 맞춤법 검사기 사용 방법</h5>
                    <ol>
                        <li>아래 버튼을 클릭하면 네이버 맞춤법 검사 페이지가 새 창으로 열립니다.</li>
                        <li>검사 결과를 확인하고 수정된 텍스트를 복사하세요.</li>
                        <li>이 페이지로 돌아와서 수정된 텍스트를 붙여넣기 하세요.</li>
                    </ol>
                    <a href="${naverUrl}" target="_blank" class="btn btn-success mt-2">네이버에서 맞춤법 검사하기</a>
                </div>
            `;
            resultsDiv.style.display = 'block';
        });
    }
    
    // 지우기
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            inputArea.value = '';
            if (charCountSpan) charCountSpan.textContent = '0';
            if (resultsDiv) resultsDiv.style.display = 'none';
            if (copyBtn) copyBtn.style.display = 'none';
        });
    }
    
    // 복사
    if (copyBtn) {
        copyBtn.addEventListener('click', function() {
            inputArea.select();
            document.execCommand('copy');
            
            const originalText = this.textContent;
            this.textContent = '복사됨!';
            setTimeout(() => {
                this.textContent = originalText;
            }, 2000);
        });
    }
}