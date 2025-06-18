// Debounce 함수 - 성능 최적화를 위해 입력 이벤트를 지연시킴
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

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

// 토스트 알림 시스템
const Toast = {
    container: null,
    
    init() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
            this.container.style.zIndex = '1050';
            document.body.appendChild(this.container);
        }
    },
    
    show(message, type = 'info', duration = 3000) {
        this.init();
        
        const toastId = 'toast-' + Date.now();
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type} border-0`;
        toast.id = toastId;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');
        
        const iconMap = {
            'success': 'fa-check-circle',
            'danger': 'fa-exclamation-circle',
            'warning': 'fa-exclamation-triangle',
            'info': 'fa-info-circle'
        };
        
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    <i class="fas ${iconMap[type] || iconMap.info} me-2"></i>${escapeHtml(message)}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        `;
        
        this.container.appendChild(toast);
        
        const bsToast = new bootstrap.Toast(toast, {
            autohide: true,
            delay: duration
        });
        
        bsToast.show();
        
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }
};

// 텍스트 분석 함수들
function countSentences(text) {
    // 한국어와 영어 문장 종결 부호를 모두 고려
    const sentences = text.match(/[^.!?。！？]+[.!?。！？]+/g) || [];
    return sentences.length;
}

function calculateAverageWordLength(text) {
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    if (words.length === 0) return 0;
    
    const totalLength = words.reduce((sum, word) => sum + word.length, 0);
    return (totalLength / words.length).toFixed(1);
}

function calculateReadingTime(text) {
    if (!text || text.trim() === '') return '0';
    
    // 한국어 평균 읽기 속도: 분당 300-500자 (평균 400자)
    // 영어 평균 읽기 속도: 분당 200-250단어
    const charCount = text.replace(/\s/g, '').length;
    if (charCount === 0) return '0';
    
    const minutes = charCount / 400;
    
    if (minutes < 1) {
        return "1분 미만";
    } else if (minutes < 60) {
        return `약 ${Math.ceil(minutes)}분`;
    } else {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = Math.ceil(minutes % 60);
        return `약 ${hours}시간 ${remainingMinutes}분`;
    }
}

function countParagraphs(text) {
    if (!text || text.trim() === '') return 0;
    
    // 두 개 이상의 연속된 줄바꿈을 단락 구분으로 간주
    const paragraphs = text.split(/\n\s*\n/).filter(para => para.trim().length > 0);
    return paragraphs.length || 1;
}

// 자동 저장 함수
function autoSave(text) {
    localStorage.setItem('letterCountDraft', text);
    localStorage.setItem('letterCountDraftTime', new Date().toISOString());
    
    // 저장 인디케이터 표시
    const saveIndicator = document.getElementById('save-indicator');
    if (saveIndicator) {
        saveIndicator.classList.remove('d-none');
        saveIndicator.classList.add('animate-fadeIn');
        
        // 2초 후 숨기기
        setTimeout(() => {
            saveIndicator.classList.add('d-none');
        }, 2000);
    }
}

// 저장된 내용 복원
function restoreDraft() {
    const draft = localStorage.getItem('letterCountDraft');
    const draftTime = localStorage.getItem('letterCountDraftTime');
    
    if (draft) {
        const letterCountElement = document.querySelector('#letter_count');
        letterCountElement.innerText = draft;
        
        // 복원 알림 표시 (선택사항)
        if (draftTime) {
            const savedDate = new Date(draftTime);
            const timeString = savedDate.toLocaleString('ko-KR');
            console.log(`자동 저장된 내용을 복원했습니다. (저장 시간: ${timeString})`);
        }
        
        // 복원 후 통계 업데이트
        updateStatistics();
    }
}

// 통계 업데이트 함수
function updateStatistics() {
    try {
        const letterCountElement = document.querySelector('#letter_count');
        const letter = letterCountElement.innerText;
        
        // 텍스트가 비어있는지 확인
        if (!letter || letter.trim() === '') {
            // 모든 통계를 0으로 초기화
            document.querySelector('[data-result="1"]').textContent = '0';
            document.querySelector('[data-result="2"]').textContent = '0';
            document.querySelector('[data-result="3"]').textContent = '0';
            document.querySelector('[data-result="4"]').textContent = '0';
            document.querySelector('[data-result="sentences"]').textContent = '0';
            document.querySelector('[data-result="avg-word-length"]').textContent = '0';
            document.querySelector('[data-result="reading-time"]').textContent = '0';
            document.querySelector('[data-result="paragraphs"]').textContent = '0';
            
            // 빈 텍스트도 저장
            autoSave(letter);
            return;
        }
    
    // 기본 통계
    let letter_count = letter.replace(/ /g, '').replace(/\n/g, '');
    let letter_count2 = letter.length;
    let word_count = letter.split(' ').length;
    let wrod_count2 = letter.split(/\n/).length;
    let line_count = letter.split('\n').length;
    
    // 빈 줄 처리
    let line_count2 = 0;
    letter.split('\n').forEach(function(enter){
        if(enter == ''){
            line_count2++;
        }
    })
    
    // 통계 업데이트 함수 (애니메이션 효과 포함)
    function updateStatWithAnimation(selector, newValue) {
        const element = document.querySelector(selector);
        if (element && element.textContent !== newValue.toString()) {
            element.classList.add('changing');
            element.textContent = newValue;
            setTimeout(() => {
                element.classList.remove('changing');
            }, 300);
        }
    }
    
    // 기본 통계 업데이트
    updateStatWithAnimation('[data-result="1"]', letter_count.length);
    updateStatWithAnimation('[data-result="2"]', letter_count2);
    updateStatWithAnimation('[data-result="3"]', word_count+wrod_count2-line_count2-1);
    updateStatWithAnimation('[data-result="4"]', line_count);
    
    // 텍스트 분석 통계 업데이트
    updateStatWithAnimation('[data-result="sentences"]', countSentences(letter));
    updateStatWithAnimation('[data-result="avg-word-length"]', calculateAverageWordLength(letter));
    updateStatWithAnimation('[data-result="reading-time"]', calculateReadingTime(letter));
    updateStatWithAnimation('[data-result="paragraphs"]', countParagraphs(letter));
    
        // 자동 저장
        autoSave(letter);
    } catch (error) {
        console.error('통계 업데이트 중 오류:', error);
    }
}

// Debounce를 적용한 업데이트 함수
const debouncedUpdate = debounce(updateStatistics, 300);

// 실행 취소/다시 실행을 위한 히스토리 관리
const textHistory = {
    states: [''],
    currentIndex: 0,
    maxHistorySize: 50,
    
    // 상태 추가
    addState: function(text) {
        // 현재 인덱스 이후의 상태들은 제거 (새로운 분기 생성)
        this.states = this.states.slice(0, this.currentIndex + 1);
        
        // 새로운 상태 추가
        this.states.push(text);
        
        // 최대 크기 제한
        if (this.states.length > this.maxHistorySize) {
            this.states.shift();
        } else {
            this.currentIndex++;
        }
    },
    
    // 실행 취소
    undo: function() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            return this.states[this.currentIndex];
        }
        return null;
    },
    
    // 다시 실행
    redo: function() {
        if (this.currentIndex < this.states.length - 1) {
            this.currentIndex++;
            return this.states[this.currentIndex];
        }
        return null;
    },
    
    // 실행 취소 가능 여부
    canUndo: function() {
        return this.currentIndex > 0;
    },
    
    // 다시 실행 가능 여부
    canRedo: function() {
        return this.currentIndex < this.states.length - 1;
    }
};

// 히스토리에 상태 추가 (디바운스 적용)
const debouncedAddHistory = debounce(function(text) {
    textHistory.addState(text);
}, 500);

// 메인 입력 이벤트 리스너
document.querySelector('#letter_count').addEventListener('input', function(e) {
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
    const letterCountElement = document.querySelector('#letter_count');
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
document.addEventListener('DOMContentLoaded', function(){
    // Bootstrap 툴팁 초기화
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
    })
    
    // 저장된 내용 복원
    restoreDraft();
    
    // 저장된 텍스트 영역 높이 복원
    const savedHeight = localStorage.getItem('letterCountTextAreaHeight');
    if (savedHeight) {
        const letterCountElement = document.querySelector('#letter_count');
        letterCountElement.style.height = savedHeight;
    }
    
    // 텍스트 영역 크기 조절 이벤트 처리
    const letterCountElement = document.querySelector('#letter_count');
    let isResizing = false;
    let startY = 0;
    let startHeight = 0;
    
    // ResizeObserver를 사용하여 크기 변경 감지
    const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
            const newHeight = entry.contentRect.height + 'px';
            localStorage.setItem('letterCountTextAreaHeight', newHeight);
        }
    });
    
    resizeObserver.observe(letterCountElement);
    
    // 키보드 단축키 처리
    document.addEventListener('keydown', function(e) {
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
    });
    
    // 실행 취소/다시 실행 버튼 상태 업데이트
    function updateUndoRedoButtons() {
        const undoBtn = document.querySelector('[data-action="undo"]');
        const redoBtn = document.querySelector('[data-action="redo"]');
        
        if (undoBtn) {
            undoBtn.disabled = !textHistory.canUndo();
        }
        if (redoBtn) {
            redoBtn.disabled = !textHistory.canRedo();
        }
    }
    
    // 텍스트 변환 버튼 이벤트 리스너
    document.querySelectorAll('[data-transform]').forEach(button => {
        button.addEventListener('click', function() {
            const transformType = this.dataset.transform;
            handleTextTransform(transformType);
        });
    });
    
    // 실행 취소/다시 실행 버튼 이벤트 리스너
    document.querySelectorAll('[data-action="undo"], [data-action="redo"]').forEach(button => {
        button.addEventListener('click', function() {
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
    });
    
    // 초기 버튼 상태 업데이트
    updateUndoRedoButtons();
    
    // 붙여넣기 이벤트 처리 (보안 강화)
    letterCountElement.addEventListener('paste', function(e) {
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
    document.querySelectorAll('[data-move]').forEach(function(link){
        link.addEventListener('click', function(e){
            const page = this.dataset.move;
            e.preventDefault();
            
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
        'scientific_calculator': ['/js/scientific_calculator.js?2']
    };
    
    const scripts = scriptMap[page] || [];
    return Promise.all(scripts.map(src => loadScript(src)));
}