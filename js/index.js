// XSS 방지를 위한 HTML 이스케이프 함수
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// 안전한 텍스트 추출 함수
function getSafeText(element) {
    return element.textContent || element.innerText || '';
}

// 일반화된 자동 저장 함수
function autoSaveDraft(key, content, indicatorSelector = null) {
    const saveData = {
        draft: content,
        time: new Date().toISOString()
    };
    
    StorageUtils.save(key, saveData);
    
    if (indicatorSelector) {
        const saveIndicator = DOMUtils.getElement(indicatorSelector);
        if (saveIndicator) {
            saveIndicator.classList.remove('d-none');
            saveIndicator.classList.add('animate-fadeIn');

            setTimeout(() => {
                saveIndicator.classList.add('d-none');
            }, 2000);
        }
    }
}

// 일반화된 저장 내용 복원 함수
function restoreDraftContent(key, targetElementSelector, onRestoreCallback = null) {
    const savedData = StorageUtils.load(key);
    
    if (savedData && savedData.draft) {
        const targetElement = DOMUtils.getElement(targetElementSelector);
        if (targetElement) {
            targetElement.innerText = savedData.draft;
            
            if (onRestoreCallback && typeof onRestoreCallback === 'function') {
                onRestoreCallback(savedData.draft);
            }
        }
    }
}

// 기존 autoSave 및 restoreDraft 호출 부분을 새 함수로 대체
function autoSave(text) {
    autoSaveDraft('letterCountData', text, '#save-indicator');
}

function restoreDraft() {
    // restoreDraftContent('#letter_count', updateStatistics); // 이전 버전
    restoreDraftContent('letterCountData', '#letter_count', updateStatistics); // 수정된 버전
}


// 통계 업데이트 함수
function updateStatistics() {
    try {
        const letterCountElement = DOMUtils.getElement('#letter_count');
        const text = letterCountElement.innerText;

        // 통계 업데이트 함수 (애니메이션 효과 포함)
        function updateStatWithAnimation(selector, newValue) {
            const element = DOMUtils.getElement(selector);
            if (element) {
                const currentValue = element.textContent;
                // newValue를 문자열로 변환하여 비교 (숫자 0과 문자열 "0"이 다르게 취급되는 것 방지)
                const newValueStr = String(newValue);
                if (currentValue !== newValueStr) {
                    element.classList.add('changing');
                    element.textContent = newValueStr;
                    setTimeout(() => {
                        element.classList.remove('changing');
                    }, 300);
                }
            }
        }

        if (!text || text.trim() === '') {
            const statsToReset = {
                '[data-result="1"]': '0', // 공백제외 글자수
                '[data-result="2"]': '0', // 공백포함 글자수
                '[data-result="3"]': '0', // 단어수
                '[data-result="4"]': '0', // 라인수
                '[data-result="sentences"]': '0', // 문장수
                '[data-result="avg-word-length"]': '0', // 평균 단어 길이
                '[data-result="reading-time"]': '0', // 읽기 시간
                '[data-result="paragraphs"]': '0'  // 단락수
            };
            for (const selector in statsToReset) {
                updateStatWithAnimation(selector, statsToReset[selector]);
            }
            autoSave(text); // 빈 텍스트도 저장
            return;
        }

        // 기본 통계 계산
        const charsNoSpaces = text.replace(/\s/g, '').length;
        const charsWithSpaces = text.length;

        // 단어수 계산 수정: 비어있는 문자열이나 공백만 있는 문자열을 단어로 카운트하지 않도록 수정
        const words = text.trim().split(/\s+/).filter(word => word.length > 0).length;

        const lines = text.split('\n').length;

        // 통계 데이터 객체
        const statsData = {
            '[data-result="1"]': charsNoSpaces,
            '[data-result="2"]': charsWithSpaces,
            '[data-result="3"]': words,
            '[data-result="4"]': lines,
            '[data-result="sentences"]': countSentences(text), // textAnalysis.js 함수 사용
            '[data-result="avg-word-length"]': calculateAverageWordLength(text), // textAnalysis.js 함수 사용
            '[data-result="reading-time"]': calculateReadingTime(text), // textAnalysis.js 함수 사용
            '[data-result="paragraphs"]': countParagraphs(text) // textAnalysis.js 함수 사용
        };

        // 통계 업데이트
        for (const selector in statsData) {
            updateStatWithAnimation(selector, statsData[selector]);
        }

        autoSave(text); // 자동 저장
    } catch (error) {
        console.error('통계 업데이트 중 오류:', error);
        // 사용자에게 오류 알림 (옵션)
        // Toast.show('통계 업데이트 중 오류가 발생했습니다.', 'danger');
    }
}

// Debounce를 적용한 업데이트 함수
const debouncedUpdate = debounce(updateStatistics, 300);

// 메인 입력 이벤트 리스너
DOMUtils.addEvent('#letter_count', 'input', function(e) {
    const text = e.target.innerText;
    debouncedUpdate();
    debouncedAddHistory(text);
    
    // 입력 시 버튼 상태 업데이트 (디바운스 적용)
    setTimeout(() => {
        if (typeof updateUndoRedoButtons === 'function') {
            updateUndoRedoButtons();
        }
    }, 600);
});

// 텍스트 변환 함수들
const textTransformations = {
    uppercase: (text) => text.toUpperCase(),
    lowercase: (text) => text.toLowerCase(),
    capitalize: (text) => {
        return text.replace(/\b\w/g, char => char.toUpperCase());
    },
    'remove-special': (text) => {
        // 한글, 영어, 숫자, 공백, 줄바꿈만 남기고 제거
        return text.replace(/[^가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9\s\n]/g, '');
    },
    'remove-spaces': (text) => {
        // 줄바꿈은 유지하고 공백만 제거
        return text.replace(/ /g, '');
    },
    'trim-lines': (text) => {
        // 각 줄의 앞뒤 공백 제거
        return text.split('\n').map(line => line.trim()).join('\n');
    },
    clear: () => ''
};

// 텍스트 변환 처리
function handleTextTransform(transformType) {
    const letterCountElement = DOMUtils.getElement('#letter_count');
    const currentText = letterCountElement.innerText;
    
    if (transformType in textTransformations) {
        const transformedText = textTransformations[transformType](currentText);
        letterCountElement.innerText = transformedText;
        
        // 변환 후 통계 업데이트
        updateStatistics();
        
        // 히스토리에 추가
        textHistory.addState(transformedText);
        
        // 버튼 상태 업데이트
        if (typeof updateUndoRedoButtons === 'function') {
            updateUndoRedoButtons();
        }
        
        // 토스트 알림 표시
        const transformNames = {
            'uppercase': '대문자 변환',
            'lowercase': '소문자 변환',
            'capitalize': '첫 글자 대문자 변환',
            'remove-special': '특수문자 제거',
            'remove-spaces': '공백 제거',
            'trim-lines': '공백 정리',
            'clear': '텍스트 지우기'
        };
        
        Toast.show(`${transformNames[transformType] || '텍스트 변환'} 완료`, 'success', 2000);
    }
}

// DOMContentLoaded 이벤트
DOMUtils.addEvent(document, 'DOMContentLoaded', function(){
    // Bootstrap 툴팁 초기화
    var tooltipTriggerList = [].slice.call(DOMUtils.getElements('[data-bs-toggle="tooltip"]'))
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
    })
    
    // 저장된 내용 복원 (일반화된 함수 사용)
    // restoreDraftContent('letterCountData', '#letter_count', updateStatistics);
    // DOMContentLoaded 시점에는 restoreDraft()를 직접 호출하도록 유지하고,
    // restoreDraft 내부에서 일반화된 함수를 호출하도록 수정합니다.
    restoreDraft();
    
    // 저장된 텍스트 영역 높이 복원 (이 부분은 유지)
    const savedHeight = StorageUtils.load('letterCountTextAreaHeight');
    if (savedHeight) {
        const letterCountElement = DOMUtils.getElement('#letter_count');
        if (letterCountElement) { // 요소 존재 확인 추가
            letterCountElement.style.height = savedHeight;
        }
    }
    
    // 텍스트 영역 크기 조절 이벤트 처리
    const letterCountElement = DOMUtils.getElement('#letter_count');
    let isResizing = false;
    let startY = 0;
    let startHeight = 0;
    
    // ResizeObserver를 사용하여 크기 변경 감지
    const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
            const newHeight = entry.contentRect.height + 'px';
            StorageUtils.save('letterCountTextAreaHeight', newHeight);
        }
    });
    
    resizeObserver.observe(letterCountElement);
    
    // 키보드 단축키 처리
    DOMUtils.addEvent(document, 'keydown', function(e) {
        // Ctrl+Z (Windows/Linux) 또는 Cmd+Z (Mac) - 실행 취소
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            const prevText = textHistory.undo();
            if (prevText !== null) {
                letterCountElement.innerText = prevText;
                updateStatistics();
                updateUndoRedoButtons();
            }
        }
        
        // Ctrl+Y (Windows/Linux) 또는 Cmd+Shift+Z (Mac) - 다시 실행
        if ((e.ctrlKey && e.key === 'y') || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')) {
            e.preventDefault();
            const nextText = textHistory.redo();
            if (nextText !== null) {
                letterCountElement.innerText = nextText;
                updateStatistics();
                updateUndoRedoButtons();
            }
        }
        
        // Ctrl+S (Windows/Linux) 또는 Cmd+S (Mac) - 저장 (자동 저장이지만 명시적 저장 피드백)
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            // autoSave(letterCountElement.innerText); // 기존 호출
            autoSaveDraft('letterCountData', letterCountElement.innerText, '#save-indicator'); // 일반화된 함수 사용
            Toast.show('저장되었습니다', 'success', 2000);
        }
        
        // Ctrl+A (Windows/Linux) 또는 Cmd+A (Mac) - 전체 선택
        if ((e.ctrlKey || e.metaKey) && e.key === 'a' && document.activeElement === letterCountElement) {
            e.preventDefault();
            const range = document.createRange();
            range.selectNodeContents(letterCountElement);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        }
        
        // Tab 키 - 접근성을 위한 포커스 이동
        if (e.key === 'Tab' && !e.shiftKey && document.activeElement === letterCountElement) {
            // 다음 포커스 가능한 요소로 이동
            const focusableElements = DOMUtils.getElements('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            const currentIndex = Array.from(focusableElements).indexOf(document.activeElement);
            if (currentIndex < focusableElements.length - 1) {
                e.preventDefault();
                focusableElements[currentIndex + 1].focus();
            }
        }
    });
    
    // 실행 취소/다시 실행 버튼 상태 업데이트
    function updateUndoRedoButtons() {
        const undoBtn = DOMUtils.getElement('[data-action="undo"]');
        const redoBtn = DOMUtils.getElement('[data-action="redo"]');
        
        if (undoBtn) {
            undoBtn.disabled = !textHistory.canUndo();
        }
        if (redoBtn) {
            redoBtn.disabled = !textHistory.canRedo();
        }
    }
    
    // 텍스트 변환 버튼 이벤트 리스너
    DOMUtils.addEventToAll('[data-transform]', 'click', function() {
        const transformType = this.dataset.transform;
        handleTextTransform(transformType);
    });
    
    // 실행 취소/다시 실행 버튼 이벤트 리스너
    DOMUtils.addEventToAll('[data-action="undo"], [data-action="redo"]', 'click', function() {
            const action = this.dataset.action;
            if (action === 'undo') {
                const prevText = textHistory.undo();
                if (prevText !== null) {
                    letterCountElement.innerText = prevText;
                    updateStatistics();
                    updateUndoRedoButtons();
                }
            } else if (action === 'redo') {
                const nextText = textHistory.redo();
                if (nextText !== null) {
                    letterCountElement.innerText = nextText;
                    updateStatistics();
                    updateUndoRedoButtons();
                }
            }
    });
    
    // 초기 버튼 상태 업데이트
    updateUndoRedoButtons();
    
    // 초기 네비게이션 상태 설정
    const currentPage = getCurrentPageFromURL();
    updateNavigationState(currentPage);
    
    // 홈 버튼 클릭 처리 (로고와 '글자수 / 단어수' 메뉴)
    DOMUtils.addEventToAll('.navbar-brand, .navbar-nav a[href="/"]', 'click', function(e) {
        e.preventDefault();
        updateNavigationState('home');
        updateURLState('home');
        
        // 메인 콘텐츠를 홈페이지로 복원
        const mainElement = $('main');
        mainElement.fadeOut(200, function() {
            // 홈페이지 콘텐츠 로드 (현재 index.html의 기본 콘텐츠)
            location.reload(); // 간단하게 페이지 새로고침으로 홈으로 돌아가기
        });
    });
    
    // 브라우저 뒤로가기/앞으로가기 처리
    window.addEventListener('popstate', function(e) {
        const page = e.state?.page || getCurrentPageFromURL();
        updateNavigationState(page);
        
        if (page === 'home') {
            location.reload();
        } else {
            // 해당 페이지 로드
            const mainElement = $('main');
            mainElement.load('/html/'+page+'.html', function(response, status, xhr) {
                if (status === "success") {
                    loadPageScript(page).then(() => {
                        // 페이지별 초기화 함수 호출
                        // (기존 switch 문과 동일한 로직)
                    });
                }
            });
        }
    });
    
    // 통계 내보내기 버튼 이벤트 리스너
    DOMUtils.addEvent('#export-stats', 'click', function() {
        exportStatistics();
    });
    
    // 붙여넣기 이벤트 처리 (보안 강화)
    DOMUtils.addEvent(letterCountElement, 'paste', function(e) {
        e.preventDefault();
        
        // 클립보드에서 순수 텍스트만 가져오기
        let text = '';
        if (e.clipboardData || e.originalEvent.clipboardData) {
            text = (e.clipboardData || e.originalEvent.clipboardData).getData('text/plain');
        } else if (window.clipboardData) {
            text = window.clipboardData.getData('Text');
        }
        
        // 텍스트만 삽입 (HTML 태그 제거)
        if (document.queryCommandSupported('insertText')) {
            document.execCommand('insertText', false, text);
        } else {
            // 폴백: 현재 위치에 텍스트 삽입
            const selection = window.getSelection();
            if (selection.rangeCount) {
                const range = selection.getRangeAt(0);
                range.deleteContents();
                const textNode = document.createTextNode(text);
                range.insertNode(textNode);
                range.selectNodeContents(textNode);
                range.collapse(false);
                selection.removeAllRanges();
                selection.addRange(range);
            }
        }
        
        // 통계 업데이트
        updateStatistics();
    });
    
    // 페이지 네비게이션 처리
    DOMUtils.addEventToAll('[data-move]', 'click', function(e){
            const page = this.dataset.move;
            e.preventDefault();
            
            // 네비게이션 상태 업데이트
            updateNavigationState(page);
            
            // URL 상태 업데이트
            updateURLState(page);
            
            // 로딩 상태 표시
            const mainElement = $('main');
            mainElement.html('<div class="text-center py-5"><div class="loading mx-auto mb-3"></div><p class="text-muted">페이지를 불러오는 중...</p></div>');
            
            // 페이드 아웃 효과
            mainElement.fadeOut(200, function() {
                // 페이지 로드
                mainElement.load('/html/'+page+'.html', function(response, status, xhr) {
                    if (status === "success") {
                        // 페이드 인 효과
                        mainElement.fadeIn(300);
                        
                        // 동적 스크립트 로딩
                        loadPageScript(page).then(() => {
                            // 페이지별 초기화 함수 호출
                            switch(page) {
                                case 'spellcheck_simple':
                                    if (typeof initializeSimpleSpellchecker === 'function') {
                                        setTimeout(initializeSimpleSpellchecker, 100);
                                    }
                                    break;
                                case 'typing_practice':
                                    if (typeof initializeTypingPracticeNew === 'function') {
                                        setTimeout(initializeTypingPracticeNew, 100);
                                    } else if (typeof initializeTypingPractice === 'function') {
                                        setTimeout(initializeTypingPractice, 100);
                                    }
                                    break;
                                case 'salary':
                                    if (typeof initializeSalaryPage === 'function') {
                                        setTimeout(initializeSalaryPage, 100);
                                    }
                                    break;
                                case 'insurance_calculator':
                                    if (typeof initializeInsuranceCalculator === 'function') {
                                        setTimeout(initializeInsuranceCalculator, 100);
                                    }
                                    break;
                                case 'scientific_calculator':
                                    if (typeof initializeScientificCalculator === 'function') {
                                        setTimeout(initializeScientificCalculator, 100);
                                    }
                                    break;
                            }
                        });
                    } else if (status === "error") {
                        console.error("Error loading page: " + xhr.status + " " + xhr.statusText);
                        mainElement.html('<div class="alert alert-danger m-4"><i class="fas fa-exclamation-triangle me-2"></i>페이지를 불러올 수 없습니다. 다시 시도해주세요.</div>').fadeIn(300);
                    }
                });
            });
    });
});

// Google 번역 초기화 함수
function googleTranslateElementInit() {
    new google.translate.TranslateElement({
        pageLanguage: 'ko',
        includedLanguages: 'en,ja,zh-CN,fr,de',
        layout: google.translate.TranslateElement.InlineLayout.SIMPLE
    }, 'google_translate_element');
}

// 동적 스크립트 로딩 함수
const loadedScripts = new Set();

function loadScript(src) {
    return new Promise((resolve, reject) => {
        // 이미 로드된 스크립트는 스킵
        if (loadedScripts.has(src)) {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => {
            loadedScripts.add(src);
            resolve();
        };
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        document.body.appendChild(script);
    });
}

// 페이지별 필요한 스크립트 로딩
function loadPageScript(page) {
    const scriptMap = {
        'spellcheck_simple': ['/js/spellcheck_simple.js?3'],
        'typing_practice': ['/js/practice_data.js', '/js/typing_practice.js?13'],
        'salary': ['/js/salary_calculator.js?3'],
        'insurance_calculator': ['/js/insurance_calculator.js?2'],
        'scientific_calculator': ['/js/scientific_calculator.js?3']
    };
    
    const scripts = scriptMap[page] || [];
    return Promise.all(scripts.map(src => loadScript(src)));
}

// 네비게이션 상태 관리 함수들
function updateNavigationState(currentPage = 'home') {
    console.log('네비게이션 상태 업데이트:', currentPage);
    
    // 모든 네비게이션 링크에서 active 클래스 제거
    document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
        link.classList.remove('active');
        link.removeAttribute('aria-current');
    });
    
    // 드롭다운 아이템에서도 active 클래스 제거
    document.querySelectorAll('.dropdown-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // 현재 페이지에 맞는 메뉴 활성화
    const pageMenuMap = {
        'home': '.navbar-nav a[href="/"]',
        'spellcheck_simple': 'a[data-move="spellcheck_simple"]',
        'salary': 'a[data-move="salary"]',
        'typing_practice': 'a[data-move="typing_practice"]',
        'insurance_calculator': 'a[data-move="insurance_calculator"]',
        'severancepay': 'a[data-move="severancepay"]',
        'scientific_calculator': 'a[data-move="scientific_calculator"]'
    };
    
    const selector = pageMenuMap[currentPage];
    console.log('선택자:', selector);
    
    if (selector) {
        const activeLink = document.querySelector(selector);
        console.log('찾은 링크:', activeLink);
        
        if (activeLink) {
            activeLink.classList.add('active');
            console.log('active 클래스 추가됨');
            
            // 홈페이지인 경우 aria-current 추가
            if (currentPage === 'home') {
                activeLink.setAttribute('aria-current', 'page');
                console.log('aria-current 속성 추가됨');
            }
            
            // 드롭다운 메뉴인 경우 부모 드롭다운도 활성화
            const dropdownParent = activeLink.closest('.dropdown');
            if (dropdownParent) {
                const dropdownToggle = dropdownParent.querySelector('.dropdown-toggle');
                if (dropdownToggle) {
                    dropdownToggle.classList.add('active');
                    console.log('드롭다운 토글 활성화됨');
                }
            }
        } else {
            console.log('링크를 찾지 못했습니다');
        }
    } else {
        console.log('페이지 매핑을 찾지 못했습니다');
    }
}

function getCurrentPageFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const page = urlParams.get('page');
    return page || 'home';
}

function updateURLState(page) {
    if (page === 'home') {
        // 홈페이지인 경우 URL을 루트로 설정
        window.history.pushState({page: 'home'}, '', '/');
    } else {
        // 다른 페이지인 경우 쿼리 파라미터 추가
        window.history.pushState({page: page}, '', `/?page=${page}`);
    }
}

// 통계 내보내기 함수
function exportStatistics() {
    try {
        const letterCountElement = DOMUtils.getElement('#letter_count');
        const text = letterCountElement.innerText;
        
        // 현재 통계 수집
        const stats = {
            '작성일시': TimeUtils.getCurrentTimeKR(),
            '공백제외_글자수': DOMUtils.getElement('[data-result="1"]').textContent,
            '공백포함_글자수': DOMUtils.getElement('[data-result="2"]').textContent,
            '단어수': DOMUtils.getElement('[data-result="3"]').textContent,
            '라인수': DOMUtils.getElement('[data-result="4"]').textContent,
            '문장수': DOMUtils.getElement('[data-result="sentences"]').textContent,
            '평균단어길이': DOMUtils.getElement('[data-result="avg-word-length"]').textContent,
            '읽기시간': DOMUtils.getElement('[data-result="reading-time"]').textContent,
            '단락수': DOMUtils.getElement('[data-result="paragraphs"]').textContent,
            '텍스트길이': text.length,
            '텍스트_미리보기': text.substring(0, 100) + (text.length > 100 ? '...' : '')
        };
        
        // CSV 형식으로 변환
        const headers = Object.keys(stats);
        const values = Object.values(stats);
        
        let csv = '\uFEFF'; // UTF-8 BOM 추가 (한글 깨짐 방지)
        csv += headers.join(',') + '\n';
        csv += values.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
        
        // Blob 생성 및 다운로드
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `글자수통계_${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // 토스트 알림
        Toast.show('통계를 CSV 파일로 내보냈습니다', 'success');
        
    } catch (error) {
        console.error('통계 내보내기 중 오류:', error);
        Toast.show('통계 내보내기 중 오류가 발생했습니다', 'danger');
    }
}