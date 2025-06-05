// 맞춤법 검사기 초기화 함수
function initializeSpellchecker() {
    console.log('맞춤법 검사기 초기화 중...');
    
    const checkBtn = document.getElementById('check_spelling_btn');
    const clearBtn = document.getElementById('clear_text_btn');
    const applyBtn = document.getElementById('apply_corrections_btn');
    const inputArea = document.getElementById('spellcheck_input');
    const resultsDiv = document.getElementById('spellcheck_results');
    const correctedSection = document.getElementById('corrected_text_section');
    const correctedTextDiv = document.getElementById('corrected_text');
    
    let correctedFullText = '';
    
    if (checkBtn) {
        checkBtn.addEventListener('click', async () => {
            const text = inputArea.value.trim();
            if (!text) {
                showMessage('검사할 텍스트를 입력해주세요.', 'warning');
                return;
            }
            
            checkBtn.disabled = true;
            checkBtn.textContent = '검사 중...';
            
            try {
                await checkSpellingPNU(text);
            } finally {
                checkBtn.disabled = false;
                checkBtn.textContent = '맞춤법 검사';
            }
        });
    }
    
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            inputArea.value = '';
            resultsDiv.style.display = 'none';
            correctedSection.style.display = 'none';
            applyBtn.style.display = 'none';
        });
    }
    
    if (applyBtn) {
        applyBtn.addEventListener('click', () => {
            inputArea.value = correctedFullText;
            showMessage('교정된 텍스트가 적용되었습니다.', 'success');
        });
    }
    
    function showMessage(message, type = 'info') {
        resultsDiv.className = `alert alert-${type}`;
        resultsDiv.textContent = message;
        resultsDiv.style.display = 'block';
    }
    
    async function checkSpellingPNU(textToCheck) {
        // CORS 프록시를 통한 우회 시도
        const CORS_PROXY = 'https://corsproxy.io/?';
        const PNU_URL = 'https://nara-speller.co.kr/speller/spell_check.do';
        const PROXY_URL = CORS_PROXY + encodeURIComponent(PNU_URL);
        const PNU_MAX_WORDS = 200;
        
        resultsDiv.innerHTML = '<div class="spinner-border spinner-border-sm me-2" role="status"></div>검사 중...';
        resultsDiv.className = 'alert alert-info';
        resultsDiv.style.display = 'block';
        
        // 텍스트 전처리
        let processedText = textToCheck.replace(/<[^>]+>/g, ''); // HTML 태그 제거
        processedText = processedText.replace(/([^])\n/g, '$1\r\n') + '\r\n'; // 줄바꿈 정규화
        
        // 텍스트를 200단어씩 분할
        const textParts = splitTextByWordCount(processedText, PNU_MAX_WORDS);
        let allSuggestions = [];
        let correctedParts = [];
        
        try {
            for (let i = 0; i < textParts.length; i++) {
                const part = textParts[i];
                const formData = new FormData();
                formData.append('text1', part);
                
                try {
                    // 먼저 직접 호출 시도
                    let response;
                    try {
                        response = await fetch(PNU_URL, {
                            method: 'POST',
                            body: formData
                        });
                    } catch (directError) {
                        // CORS 오류 시 프록시 사용
                        console.log('직접 호출 실패, 프록시 시도...');
                        const params = new URLSearchParams();
                        params.append('text1', part);
                        
                        response = await fetch(PROXY_URL, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded',
                            },
                            body: params.toString()
                        });
                    }
                    
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    
                    const responseText = await response.text();
                    const results = parsePNUResponse(responseText);
                    
                    if (results && results.corrections) {
                        // 현재 파트에 교정 적용
                        let correctedPart = part;
                        results.corrections.forEach(correction => {
                            correctedPart = correctedPart.replace(correction.errorText, correction.correctedText);
                        });
                        correctedParts.push(correctedPart);
                        
                        // 교정 제안 수집
                        allSuggestions = allSuggestions.concat(results.corrections);
                    } else {
                        correctedParts.push(part);
                    }
                    
                } catch (error) {
                    console.error('파트 검사 중 오류:', error);
                    correctedParts.push(part); // 오류 시 원본 유지
                }
                
                // 진행 상황 업데이트
                if (textParts.length > 1) {
                    resultsDiv.innerHTML = `<div class="spinner-border spinner-border-sm me-2" role="status"></div>검사 중... (${i + 1}/${textParts.length})`;
                }
            }
            
            // 결과 표시
            displayResults(allSuggestions, correctedParts.join(' '));
            
        } catch (error) {
            console.error('맞춤법 검사 오류:', error);
            showMessage('맞춤법 검사 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', 'danger');
        }
    }
    
    function splitTextByWordCount(text, maxWords) {
        const words = text.split(/\s+/);
        const parts = [];
        let currentPart = [];
        
        for (const word of words) {
            currentPart.push(word);
            if (currentPart.length >= maxWords) {
                parts.push(currentPart.join(' '));
                currentPart = [];
            }
        }
        
        if (currentPart.length > 0) {
            parts.push(currentPart.join(' '));
        }
        
        return parts;
    }
    
    function parsePNUResponse(responseText) {
        try {
            // PNU API는 HTML 응답에 JavaScript 변수로 결과를 포함
            const match = responseText.match(/var\s+aResult\s*=\s*(\[[\s\S]*?\]);/);
            if (!match) return null;
            
            // JSON 파싱
            const jsonStr = match[1]
                .replace(/'/g, '"')
                .replace(/(\w+):/g, '"$1":')
                .replace(/,\s*}/g, '}');
            
            const results = JSON.parse(jsonStr);
            
            const corrections = results.map(item => ({
                errorText: item.errorText || item.str,
                correctedText: item.candWord || item.str,
                help: item.help || '맞춤법 오류',
                position: {
                    start: item.start || 0,
                    end: item.end || 0
                }
            }));
            
            return { corrections };
            
        } catch (error) {
            console.error('응답 파싱 오류:', error);
            return null;
        }
    }
    
    function displayResults(suggestions, correctedText) {
        correctedFullText = correctedText;
        
        if (!suggestions || suggestions.length === 0) {
            showMessage('맞춤법 오류가 발견되지 않았습니다! ✅', 'success');
            correctedSection.style.display = 'none';
            applyBtn.style.display = 'none';
            return;
        }
        
        // 결과 HTML 생성
        let resultsHTML = `
            <h5>발견된 맞춤법 오류: ${suggestions.length}개</h5>
            <div class="mt-3">
        `;
        
        suggestions.forEach((suggestion, index) => {
            resultsHTML += `
                <div class="mb-3 p-3 border rounded">
                    <div class="d-flex align-items-center">
                        <span class="badge bg-danger me-2">${index + 1}</span>
                        <strong class="text-danger">${escapeHtml(suggestion.errorText)}</strong>
                        <span class="mx-2">→</span>
                        <strong class="text-success">${escapeHtml(suggestion.correctedText)}</strong>
                    </div>
                    <small class="text-muted mt-1 d-block">${escapeHtml(suggestion.help)}</small>
                </div>
            `;
        });
        
        resultsHTML += '</div>';
        
        resultsDiv.innerHTML = resultsHTML;
        resultsDiv.className = 'alert alert-light border';
        resultsDiv.style.display = 'block';
        
        // 교정된 텍스트 표시
        correctedTextDiv.textContent = correctedText;
        correctedSection.style.display = 'block';
        applyBtn.style.display = 'inline-block';
    }
    
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// HTML 엔티티 디코딩 함수
function decodeHTMLEntities(text) {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
}