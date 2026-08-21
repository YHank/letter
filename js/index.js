// 프로덕션 환경에서 console 메서드 재정의
if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    const noop = function() {};
    console.log = noop;
    console.info = noop;
    console.debug = noop;
    // console.warn과 console.error는 유지
}

// Debounce 함수 - 성능 최적화를 위해 입력 이벤트를 지연시킴
function debounce(func, wait) {
    let timeout;
    function executedFunction(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    }
    executedFunction.cancel = () => {
        clearTimeout(timeout);
        timeout = null;
    };
    return executedFunction;
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

const appErrorHandler = window.ErrorHandler;
const appToast = window.Toast;
const historyManager = window.textHistory;

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
                appToast.show('이전 작업이 복원되었습니다.', 'info', 3000);
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
            appErrorHandler.handleAjaxError({ status: 500 }, 'error', error);
        }
    }
}

// Debounce를 적용한 업데이트 함수
const debouncedUpdate = debounce(updateStatistics, 300);

// 히스토리에 상태 추가 (디바운스 적용)
const debouncedAddHistory = debounce(function(text) {
    historyManager.addState(text);
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

const transformNameKeys = {
    'normalize-hangul': 'buttons.normalize_hangul',
    'join-lines': 'buttons.join_lines',
    'join-lines-preserve-lists': 'buttons.join_lines_preserve_lists',
    'split-sentences': 'buttons.split_sentences',
    'remove-special': 'buttons.remove_special',
    'remove-spaces': 'buttons.remove_spaces',
    'trim-lines': 'buttons.trim_lines',
    'clear': 'buttons.clear'
};

const transformNameFallbacks = {
    'normalize-hangul': '한글 조합',
    'join-lines': '줄바꿈 연결',
    'join-lines-preserve-lists': '목록 유지 연결',
    'split-sentences': '문장별 줄바꿈',
    'remove-special': '특수문자 제거',
    'remove-spaces': '공백 제거',
    'trim-lines': '공백 정리',
    'clear': '텍스트 지우기'
};

function translate(key, fallback) {
    return window.i18nManager?.t(key, fallback) || fallback;
}

function formatMessage(template, values) {
    return Object.entries(values).reduce(
        (message, [key, value]) => message.split(`{${key}}`).join(value),
        template
    );
}

function updateUndoRedoButtons() {
    const undoBtn = DOMUtils.getElement('[data-action="undo"]');
    const redoBtn = DOMUtils.getElement('[data-action="redo"]');
    if (undoBtn) undoBtn.disabled = !historyManager.canUndo();
    if (redoBtn) redoBtn.disabled = !historyManager.canRedo();
}

function getEditorSelection(editor) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return null;

    const range = selection.getRangeAt(0);
    if (!editor.contains(range.startContainer) || !editor.contains(range.endContainer)) return null;
    return { selection, range, text: range.toString() };
}

function replaceEditorSelection(editorSelection, text) {
    const { selection, range } = editorSelection;
    range.deleteContents();

    const fragment = document.createDocumentFragment();
    const insertedNodes = [];
    text.split('\n').forEach((line, index) => {
        if (index > 0) {
            const breakElement = document.createElement('br');
            fragment.appendChild(breakElement);
            insertedNodes.push(breakElement);
        }
        if (line) {
            const textNode = document.createTextNode(line);
            fragment.appendChild(textNode);
            insertedNodes.push(textNode);
        }
    });

    if (insertedNodes.length === 0) {
        selection.removeAllRanges();
        selection.addRange(range);
        return;
    }

    range.insertNode(fragment);
    const transformedRange = document.createRange();
    transformedRange.setStartBefore(insertedNodes[0]);
    transformedRange.setEndAfter(insertedNodes[insertedNodes.length - 1]);
    selection.removeAllRanges();
    selection.addRange(transformedRange);
}

function countTransformChanges(transformType, before, after) {
    const countMatches = (text, pattern) => (text.match(pattern) || []).length;

    if (transformType === 'normalize-hangul') {
        return countMatches(after, /[가-힣]/g) - countMatches(before, /[가-힣]/g);
    }
    if (transformType === 'join-lines' || transformType === 'join-lines-preserve-lists') {
        return countMatches(before, /\n/g) - countMatches(after, /\n/g);
    }
    if (transformType === 'split-sentences') {
        return countMatches(after, /\n/g) - countMatches(before, /\n/g);
    }
    if (transformType === 'trim-lines') {
        const afterLines = after.split('\n');
        return before.split('\n').filter((line, index) => line !== afterLines[index]).length;
    }

    return Math.abs(Array.from(before).length - Array.from(after).length);
}

function updateTransformPreview(transformType) {
    const preview = DOMUtils.getElement('#transform-preview');
    const editor = DOMUtils.getElement('#letter_count');
    const transform = window.textAnalyzer.transform[transformType];
    if (!preview || !editor || !transform) return;

    const editorSelection = transformType === 'clear' ? null : getEditorSelection(editor);
    const sourceText = editorSelection?.text ?? editor.innerText;
    const transformedText = transform(sourceText);
    const name = translate(transformNameKeys[transformType], transformNameFallbacks[transformType]);

    if (sourceText === transformedText) {
        preview.textContent = formatMessage(
            translate('messages.transform_no_change', '{name}: 변경할 내용이 없습니다'),
            { name }
        );
        return;
    }

    const messageKey = editorSelection
        ? 'messages.transform_selection_preview'
        : 'messages.transform_preview';
    const fallback = editorSelection
        ? '{name}: 선택 영역 {count}곳 변경 예정'
        : '{name}: {count}곳 변경 예정';
    preview.textContent = formatMessage(translate(messageKey, fallback), {
        name,
        count: Math.max(1, countTransformChanges(transformType, sourceText, transformedText))
    });
}

function showTransformResult(transformType, changedCount, selected) {
    const name = translate(transformNameKeys[transformType], transformNameFallbacks[transformType]);
    const messageKey = selected ? 'messages.transform_selection_result' : 'messages.transform_result';
    const fallback = selected ? '{name}: 선택 영역 {count}곳 변경' : '{name}: {count}곳 변경';
    const message = formatMessage(translate(messageKey, fallback), {
        name,
        count: Math.max(1, changedCount)
    });
    appToast.show(message, 'success', 5000, {
        label: translate('buttons.undo', '실행 취소'),
        onClick: () => DOMUtils.getElement('[data-action="undo"]')?.click()
    });
}

function handleTextTransform(transformType) {
    const editor = DOMUtils.getElement('#letter_count');
    const currentText = editor.innerText;

    if (transformType === 'clear' &&
        !confirm(translate('messages.clear_confirm', '입력한 내용을 모두 지우시겠습니까?'))) {
        return;
    }

    const transform = window.textAnalyzer.transform[transformType];
    if (!transform) return;

    const editorSelection = transformType === 'clear' ? null : getEditorSelection(editor);
    const sourceText = editorSelection?.text ?? currentText;
    const transformedText = transform(sourceText);
    const transformName = translate(transformNameKeys[transformType], transformNameFallbacks[transformType]);

    if (sourceText === transformedText) {
        const noChangeTemplate = translate(
            'messages.transform_no_change',
            '{name}: 변경할 내용이 없습니다'
        );
        appToast.show(formatMessage(noChangeTemplate, { name: transformName }), 'info', 2500);
        return;
    }

    debouncedAddHistory.cancel();
    historyManager.addState(currentText);

    if (editorSelection) {
        replaceEditorSelection(editorSelection, transformedText);
        editor.focus();
    } else {
        editor.innerText = transformedText;
    }

    const updatedText = editor.innerText;
    historyManager.addState(updatedText);
    updateStatistics();
    updateUndoRedoButtons();
    showTransformResult(
        transformType,
        countTransformChanges(transformType, sourceText, transformedText),
        Boolean(editorSelection)
    );
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
            const prevText = historyManager.undo();
            if (prevText !== null) {
                letterCountElement.innerText = prevText;
                updateStatistics();
                updateUndoRedoButtons();
            }
        }
        
        // Ctrl+Y (Windows/Linux) 또는 Cmd+Shift+Z (Mac) - 다시 실행
        if ((e.ctrlKey && e.key === 'y') || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')) {
            e.preventDefault();
            const nextText = historyManager.redo();
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
            appToast.show('저장되었습니다', 'success', 2000);
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
    
    
    // 텍스트 변환 버튼 이벤트 리스너
    DOMUtils.addEventToAll('[data-transform]', 'click', function() {
        const transformType = this.dataset.transform;
        handleTextTransform(transformType);
    });
    DOMUtils.addEventToAll('[data-transform]', 'mouseenter', function() {
        updateTransformPreview(this.dataset.transform);
    });
    DOMUtils.addEventToAll('[data-transform]', 'focus', function() {
        updateTransformPreview(this.dataset.transform);
    });
    
    // 실행 취소/다시 실행 버튼 이벤트 리스너
    DOMUtils.addEventToAll('[data-action="undo"], [data-action="redo"]', 'click', function() {
            const action = this.dataset.action;
            if (action === 'undo') {
                const prevText = historyManager.undo();
                if (prevText !== null) {
                    letterCountElement.innerText = prevText;
                    updateStatistics();
                    updateUndoRedoButtons();
                }
            } else if (action === 'redo') {
                const nextText = historyManager.redo();
                if (nextText !== null) {
                    letterCountElement.innerText = nextText;
                    updateStatistics();
                    updateUndoRedoButtons();
                }
            }
    });
    
    // 초기 버튼 상태 업데이트
    updateUndoRedoButtons();
    
    // Bootstrap 드롭다운 초기화
    const dropdownElementList = document.querySelectorAll('.dropdown-toggle');
    const dropdownList = [...dropdownElementList].map(dropdownToggleEl => new bootstrap.Dropdown(dropdownToggleEl));
    
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
            // console.log('다국어 지원 시스템 초기화 완료');
        }).catch(error => {
            console.error('i18n 초기화 실패:', error);
        });
    }
    
    // 고급 분석 기능 초기화
    if (window.analysisUI) {
        window.analysisUI.init();
    }
    
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
        // Clipboard API가 지원되고 HTTPS 환경이면 사용, 아니면 Selection API 폴백
        function insertTextAtCursor(insertStr) {
            const selection = window.getSelection();
            if (selection.rangeCount) {
                const range = selection.getRangeAt(0);
                range.deleteContents();
                const textNode = document.createTextNode(insertStr);
                range.insertNode(textNode);
                range.selectNodeContents(textNode);
                range.collapse(false);
                selection.removeAllRanges();
                selection.addRange(range);
            }
        }
        insertTextAtCursor(text);
        
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
        appToast.show('통계를 CSV 파일로 내보냈습니다', 'success');
        
    } catch (error) {
        console.error('통계 내보내기 중 오류:', error);
        appToast.show('통계 내보내기 중 오류가 발생했습니다', 'danger');
    }
}

// 모바일 터치 핸들러 초기화
document.addEventListener('DOMContentLoaded', () => {
    window.mobileHandler = window.mobileHandler || new window.MobileTouchHandler();
    window.mobileHandler.init();
    
    window.keyboardHandler = window.keyboardHandler || new window.KeyboardAccessibilityHandler();
    window.keyboardHandler.init();
});
