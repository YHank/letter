// 전역 에러 핸들러
class ErrorHandler {
    static init() {
        // JavaScript 에러 처리
        window.addEventListener('error', (event) => {
            console.error('JavaScript 에러:', event.error);
            Toast.show('예상치 못한 오류가 발생했습니다. 페이지를 새로고침 해주세요.', 'danger', 5000);
        });

        // Promise rejection 처리
        window.addEventListener('unhandledrejection', (event) => {
            console.error('처리되지 않은 Promise 거부:', event.reason);
            Toast.show('비동기 작업 중 오류가 발생했습니다.', 'warning', 4000);
        });

        // 네트워크 상태 감지
        window.addEventListener('online', () => {
            Toast.show('인터넷 연결이 복구되었습니다.', 'success');
        });

        window.addEventListener('offline', () => {
            Toast.show('인터넷 연결이 끊어졌습니다. 일부 기능이 제한될 수 있습니다.', 'warning', 5000);
        });
    }

    static handleAjaxError(xhr, status, error) {
        console.error('AJAX 에러:', { xhr, status, error });
        if (xhr.status === 0) {
            Toast.show('네트워크 연결을 확인해주세요.', 'danger');
        } else if (xhr.status === 404) {
            Toast.show('요청한 페이지를 찾을 수 없습니다.', 'warning');
        } else if (xhr.status >= 500) {
            Toast.show('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', 'danger');
        } else {
            Toast.show('요청 처리 중 오류가 발생했습니다.', 'warning');
        }
    }
}

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

// 텍스트 분석은 text-analyzer.js 모듈을 사용

// 자동 저장 (StorageManager 모듈 사용)
function autoSave(text) {
    window.storageManager.autoSaveText(text);
}

// 저장된 내용 복원 (StorageManager 모듈 사용)
function restoreDraft() {
    const savedData = window.storageManager.restoreText();
    
    if (savedData && savedData.draft) {
        const letterCountElement = DOMUtils.getElement('#letter_count');
        if (letterCountElement) {
            letterCountElement.innerText = savedData.draft;
            
            // 복원 후 통계 업데이트
            updateStatistics();
            
            // 복원 알림
            if (window.Toast) {
                Toast.show('이전 작업이 복원되었습니다.', 'info', 3000);
            }
        }
    }
}

// 통계 업데이트 함수 (TextAnalyzer 모듈 사용)
function updateStatistics() {
    try {
        const letterCountElement = DOMUtils.getElement('#letter_count');
        const text = letterCountElement ? letterCountElement.innerText : '';
        
        // TextAnalyzer 모듈로 모든 통계 분석
        const stats = window.textAnalyzer.analyzeText(text);
        
        // 통계 업데이트 함수 (애니메이션 효과 포함)
        function updateStatWithAnimation(selector, newValue) {
            const element = DOMUtils.getElement(selector);
            if (element && element.textContent !== newValue.toString()) {
                element.classList.add('changing');
                element.textContent = newValue;
                setTimeout(() => {
                    element.classList.remove('changing');
                }, 300);
            }
        }
        
        // 통계 업데이트
        updateStatWithAnimation('[data-result="1"]', stats.charactersWithoutSpaces);
        updateStatWithAnimation('[data-result="2"]', stats.charactersWithSpaces);
        updateStatWithAnimation('[data-result="3"]', stats.words);
        updateStatWithAnimation('[data-result="4"]', stats.lines);
        updateStatWithAnimation('[data-result="sentences"]', stats.sentences);
        updateStatWithAnimation('[data-result="avg-word-length"]', stats.averageWordLength);
        updateStatWithAnimation('[data-result="reading-time"]', stats.readingTime);
        updateStatWithAnimation('[data-result="paragraphs"]', stats.paragraphs);
        
        // 자동 저장
        autoSave(text);
    } catch (error) {
        console.error('통계 업데이트 중 오류:', error);
        // 오류 시 사용자에게 알림
        if (window.ErrorHandler) {
            ErrorHandler.handleAjaxError({ status: 500 }, 'error', error);
        }
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
// 텍스트 변환 처리 (TextAnalyzer 모듈 사용)
function handleTextTransform(transformType) {
    const letterCountElement = DOMUtils.getElement('#letter_count');
    const currentText = letterCountElement.innerText;
    
    // TextAnalyzer 모듈의 transform 객체 사용
    if (transformType in window.textAnalyzer.transform) {
        const transformedText = window.textAnalyzer.transform[transformType](currentText);
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
    
    // 저장된 내용 복원
    restoreDraft();
    
    // 저장된 텍스트 영역 높이 복원
    const savedHeight = window.storageManager.restoreTextAreaHeight();
    if (savedHeight) {
        const letterCountElement = DOMUtils.getElement('#letter_count');
        letterCountElement.style.height = savedHeight;
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
            window.storageManager.saveTextAreaHeight(newHeight);
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
            autoSave(letterCountElement.innerText);
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
    
    // NavigationManager 초기화
    window.navigationManager.init();
    
    // PWA 기능 초기화
    if (window.pwaManager) {
        window.pwaManager.init();
        window.pwaManager.setupNetworkMonitoring();
    }
    
    // i18n 국제화 기능 초기화
    if (window.i18nManager) {
        window.i18nManager.init().then(() => {
            console.log('다국어 지원 시스템 초기화 완료');
        }).catch(error => {
            console.error('i18n 초기화 실패:', error);
        });
    }
    
    // 고급 분석 기능 초기화
    setupAdvancedAnalysis();
    
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
    
    // 페이지 네비게이션은 NavigationManager에서 처리
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

// 네비게이션 관리는 NavigationManager 모듈에서 처리

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

// 모바일 터치 인터페이스 개선
class MobileTouchHandler {
    constructor() {
        this.textArea = null;
        this.dragIndicator = null;
        this.isDragging = false;
        this.startY = 0;
        this.startHeight = 0;
        this.minHeight = 150;
        this.maxHeight = 600;
    }

    init() {
        this.textArea = document.getElementById('letter_count');
        this.dragIndicator = document.querySelector('.mobile-drag-indicator');
        
        if (!this.textArea || !this.dragIndicator) return;

        // 모바일 감지
        const isMobile = window.innerWidth <= 768;
        if (!isMobile) return;

        this.setupTouchEvents();
    }

    setupTouchEvents() {
        // 드래그 인디케이터 터치 이벤트
        this.dragIndicator.addEventListener('touchstart', (e) => {
            this.isDragging = true;
            this.startY = e.touches[0].clientY;
            this.startHeight = parseInt(window.getComputedStyle(this.textArea).height);
            
            // 드래그 시작 피드백
            this.dragIndicator.style.background = 'var(--btn-primary-bg)';
            document.body.style.userSelect = 'none';
            
            e.preventDefault();
        });

        document.addEventListener('touchmove', (e) => {
            if (!this.isDragging) return;
            
            const currentY = e.touches[0].clientY;
            const deltaY = currentY - this.startY;
            const newHeight = Math.max(
                this.minHeight, 
                Math.min(this.maxHeight, this.startHeight + deltaY)
            );
            
            this.textArea.style.height = newHeight + 'px';
            e.preventDefault();
        });

        document.addEventListener('touchend', () => {
            if (!this.isDragging) return;
            
            this.isDragging = false;
            this.dragIndicator.style.background = 'var(--border-color)';
            document.body.style.userSelect = '';
            
            // 터치 종료 피드백
            this.dragIndicator.style.transform = 'scale(1.1)';
            setTimeout(() => {
                this.dragIndicator.style.transform = 'scale(1)';
            }, 150);
        });

        // 텍스트 영역 터치 최적화
        this.textArea.addEventListener('touchstart', () => {
            // 터치 시작 시 포커스 보장
            setTimeout(() => {
                this.textArea.focus();
            }, 100);
        });

        // 더블 탭으로 텍스트 영역 크기 토글
        let lastTap = 0;
        this.dragIndicator.addEventListener('touchend', (e) => {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            
            if (tapLength < 500 && tapLength > 0) {
                // 더블 탭 감지
                this.toggleTextAreaSize();
                e.preventDefault();
            }
            lastTap = currentTime;
        });
    }

    toggleTextAreaSize() {
        const currentHeight = parseInt(window.getComputedStyle(this.textArea).height);
        const isCompact = currentHeight <= 200;
        
        const newHeight = isCompact ? 400 : 150;
        this.textArea.style.height = newHeight + 'px';
        
        // 토글 피드백
        Toast.show(
            isCompact ? '텍스트 영역을 확장했습니다' : '텍스트 영역을 축소했습니다', 
            'info', 
            2000
        );
    }
}

// 키보드 접근성 핸들러
class KeyboardAccessibilityHandler {
    constructor() {
        this.lastFocused = null;
    }

    init() {
        this.setupKeyboardShortcuts();
        this.setupSkipLinks();
        this.setupFocusManagement();
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + / : 포커스를 텍스트 영역으로 이동
            if ((e.ctrlKey || e.metaKey) && e.key === '/') {
                e.preventDefault();
                const textArea = document.getElementById('letter_count');
                if (textArea) {
                    textArea.focus();
                    Toast.show('텍스트 입력 영역으로 포커스가 이동했습니다', 'info', 2000);
                }
            }

            // ESC: 모달이나 드롭다운 닫기
            if (e.key === 'Escape') {
                const openModals = document.querySelectorAll('.modal.show');
                const openDropdowns = document.querySelectorAll('.dropdown-menu.show');
                
                if (openModals.length > 0) {
                    openModals[0].querySelector('[data-bs-dismiss="modal"]')?.click();
                } else if (openDropdowns.length > 0) {
                    document.body.click(); // 드롭다운 닫기
                }
            }

            // Alt + 숫자: 빠른 버튼 접근
            if (e.altKey && !isNaN(e.key) && e.key !== '0') {
                e.preventDefault();
                const buttonIndex = parseInt(e.key) - 1;
                const buttons = document.querySelectorAll('[data-transform], [data-action]');
                if (buttons[buttonIndex]) {
                    buttons[buttonIndex].focus();
                    buttons[buttonIndex].click();
                }
            }
        });
    }

    setupSkipLinks() {
        // 스킵 링크 동작 개선
        const skipLinks = document.querySelectorAll('.skip-link');
        skipLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const target = document.getElementById(targetId);
                
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    
                    // 포커스 가능한 요소인지 확인 후 포커스
                    if (target.tabIndex >= 0 || target.tagName === 'INPUT' || 
                        target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
                        target.focus();
                    } else {
                        // 포커스할 수 없는 요소면 tabindex 임시 추가
                        target.tabIndex = -1;
                        target.focus();
                        target.addEventListener('blur', () => {
                            target.removeAttribute('tabindex');
                        }, { once: true });
                    }
                }
            });
        });
    }

    setupFocusManagement() {
        // 포커스 트랩 관리
        const focusableSelectors = [
            'a[href]',
            'button:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            '[contenteditable="true"]',
            '[tabindex]:not([tabindex="-1"])'
        ].join(',');

        // 페이지 로드 시 첫 번째 포커스 가능한 요소 찾기
        document.addEventListener('DOMContentLoaded', () => {
            const firstFocusable = document.querySelector(focusableSelectors);
            if (firstFocusable && !document.activeElement || document.activeElement === document.body) {
                // 자동 포커스는 사용자 상호작용 후에만
                setTimeout(() => {
                    if (!document.activeElement || document.activeElement === document.body) {
                        firstFocusable.focus();
                    }
                }, 100);
            }
        });

        // 모달이 열릴 때 포커스 관리
        document.addEventListener('shown.bs.modal', (e) => {
            const modal = e.target;
            const firstFocusable = modal.querySelector(focusableSelectors);
            if (firstFocusable) {
                firstFocusable.focus();
            }
        });

        // 탭 키 탐색 시 시각적 피드백
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
        });

        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-navigation');
        });
    }
}

// 고급 텍스트 분석 기능 설정
function setupAdvancedAnalysis() {
    // 고급 분석 표시/숨기기 버튼
    DOMUtils.addEvent('#show-advanced-analysis', 'click', function() {
        const section = DOMUtils.getElement('#advanced-analysis-section');
        const btnContainer = DOMUtils.getElement('#show-advanced-analysis-btn');
        if (section && btnContainer) {
            section.style.display = 'block';
            btnContainer.style.display = 'none';
            
            // 자동으로 분석 실행 (텍스트가 있는 경우)
            const letterCountElement = DOMUtils.getElement('#letter_count');
            if (letterCountElement && letterCountElement.innerText.trim()) {
                performAdvancedAnalysis();
            }
        }
    });
    
    // 고급 분석 숨기기 버튼
    DOMUtils.addEvent('#toggle-advanced-analysis', 'click', function() {
        const section = DOMUtils.getElement('#advanced-analysis-section');
        const btnContainer = DOMUtils.getElement('#show-advanced-analysis-btn');
        if (section && btnContainer) {
            section.style.display = 'none';
            btnContainer.style.display = 'block';
        }
    });
    
    // 상세 분석 실행 버튼
    DOMUtils.addEvent('#perform-advanced-analysis', 'click', function() {
        performAdvancedAnalysis();
    });
    
    // 텍스트 입력 시 고급 분석 버튼 활성화
    DOMUtils.addEvent('#letter_count', 'input', debounce(function() {
        const button = DOMUtils.getElement('#perform-advanced-analysis');
        const text = this.innerText.trim();
        
        if (button) {
            button.disabled = text.length < 10; // 최소 10글자 이상
            
            // 고급 분석이 표시된 상태이고 충분한 텍스트가 있으면 자동 분석
            const section = DOMUtils.getElement('#advanced-analysis-section');
            if (section && section.style.display !== 'none' && text.length > 50) {
                performAdvancedAnalysis();
            }
        }
    }, 1000));
}

// 고급 분석 실행
function performAdvancedAnalysis() {
    const letterCountElement = DOMUtils.getElement('#letter_count');
    const text = letterCountElement ? letterCountElement.innerText.trim() : '';
    
    if (text.length < 10) {
        if (window.Toast) {
            Toast.show('분석하려면 최소 10글자 이상 입력해주세요', 'warning', 3000);
        }
        return;
    }
    
    if (!window.advancedAnalyzer) {
        console.error('고급 분석 모듈이 로드되지 않았습니다');
        return;
    }
    
    try {
        // 로딩 상태 표시
        showAnalysisLoading();
        
        // 분석 실행 (약간의 지연으로 로딩 효과)
        setTimeout(() => {
            const analysis = window.advancedAnalyzer.performAdvancedAnalysis(text);
            const formatted = window.advancedAnalyzer.formatAnalysisResults(analysis);
            
            // 결과 표시
            displaySentimentResult(formatted.sentiment);
            displayReadabilityResult(formatted.readability);
            displayWritingStyleResult(formatted.writingStyle);
            displayKeywordsResult(formatted.keywords);
            
            console.log('고급 분석 완료:', analysis);
            
            if (window.Toast) {
                Toast.show('고급 텍스트 분석이 완료되었습니다', 'success', 3000);
            }
        }, 500);
        
    } catch (error) {
        console.error('고급 분석 중 오류:', error);
        if (window.Toast) {
            Toast.show('분석 중 오류가 발생했습니다', 'danger', 3000);
        }
    }
}

// 분석 로딩 상태 표시
function showAnalysisLoading() {
    const containers = ['#sentiment-result', '#readability-result', '#writing-style-result', '#keywords-result'];
    
    containers.forEach(selector => {
        const container = DOMUtils.getElement(selector);
        if (container) {
            container.innerHTML = `
                <div class="text-center">
                    <div class="spinner-border spinner-border-sm text-primary mb-2" role="status">
                        <span class="visually-hidden">분석 중...</span>
                    </div>
                    <p class="small text-muted mb-0">분석 중...</p>
                </div>
            `;
        }
    });
}

// 감정 분석 결과 표시
function displaySentimentResult(sentiment) {
    const container = DOMUtils.getElement('#sentiment-result');
    if (!container) return;
    
    const emotionIcon = sentiment.label === '긍정적' ? 'fa-smile text-success' : 
                       sentiment.label === '부정적' ? 'fa-frown text-danger' : 
                       'fa-meh text-secondary';
    
    container.innerHTML = `
        <div class="text-center">
            <i class="fas ${emotionIcon} fa-2x mb-2"></i>
            <h5 class="h6 mb-1">${sentiment.label}</h5>
            <p class="small text-muted mb-2">${sentiment.description}</p>
            <div class="small">
                <strong>신뢰도:</strong> ${sentiment.confidence}
            </div>
        </div>
    `;
}

// 가독성 분석 결과 표시
function displayReadabilityResult(readability) {
    const container = DOMUtils.getElement('#readability-result');
    if (!container) return;
    
    const scoreColor = readability.score >= 80 ? 'success' : 
                      readability.score >= 60 ? 'warning' : 
                      'danger';
    
    container.innerHTML = `
        <div class="text-center">
            <div class="progress mb-3" style="height: 8px;">
                <div class="progress-bar bg-${scoreColor}" style="width: ${readability.score}%"></div>
            </div>
            <h5 class="h6 mb-1">${readability.level}</h5>
            <p class="small text-muted mb-2">${readability.description}</p>
            <div class="small">
                <strong>점수:</strong> ${readability.score}/100
            </div>
        </div>
    `;
}

// 문체 분석 결과 표시
function displayWritingStyleResult(style) {
    const container = DOMUtils.getElement('#writing-style-result');
    if (!container) return;
    
    container.innerHTML = `
        <div>
            <div class="mb-2">
                <span class="badge bg-primary">${style.formality}</span>
            </div>
            <div class="mb-2">
                <span class="badge bg-info">${style.tone}</span>
            </div>
            <div class="small text-muted">
                <div>질문: ${style.features.questionCount}개</div>
                <div>감탄: ${style.features.exclamationCount}개</div>
                <div>복합문: ${Math.round(style.features.avgSentenceComplexity * 100)}%</div>
            </div>
        </div>
    `;
}

// 키워드 분석 결과 표시
function displayKeywordsResult(keywords) {
    const container = DOMUtils.getElement('#keywords-result');
    if (!container) return;
    
    if (keywords.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted">
                <i class="fas fa-info-circle mb-2"></i>
                <p class="small">키워드를 찾을 수 없습니다</p>
            </div>
        `;
        return;
    }
    
    const keywordList = keywords.slice(0, 5).map((keyword, index) => `
        <div class="d-flex justify-content-between align-items-center mb-1">
            <span class="small">${keyword.word}</span>
            <span class="badge bg-secondary">${keyword.frequency}</span>
        </div>
    `).join('');
    
    container.innerHTML = `
        <div class="keywords-list">
            ${keywordList}
            ${keywords.length > 5 ? `<div class="small text-muted text-center mt-2">+${keywords.length - 5}개 더</div>` : ''}
        </div>
    `;
}

// 모바일 터치 핸들러 초기화
document.addEventListener('DOMContentLoaded', () => {
    const mobileHandler = new MobileTouchHandler();
    mobileHandler.init();
    
    const keyboardHandler = new KeyboardAccessibilityHandler();
    keyboardHandler.init();
});