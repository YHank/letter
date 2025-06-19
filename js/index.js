// Global utility functions (ensure they are loaded: DOMUtils, StorageUtils, debounce, Toast, textHistory, countSentences etc.)

function escapeHtml(text) {
    if (typeof text !== 'string') return '';
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, m => map[m]);
}

function getSafeText(element) {
    if (element && typeof element.textContent === 'string') return element.textContent.trim();
    if (element && typeof element.innerText === 'string') return element.innerText.trim();
    return '';
}

// --- Main Application Logic ---

function autoSaveDraft(key, content, indicatorSelector = null) {
    try {
        if (typeof StorageUtils === 'undefined') { console.error("StorageUtils not available for autoSaveDraft"); return; }
        const saveData = { draft: content, time: new Date().toISOString() };
        StorageUtils.save(key, saveData);
        if (indicatorSelector && typeof DOMUtils !== 'undefined') {
            const saveIndicator = DOMUtils.getElement(indicatorSelector);
            if (saveIndicator) {
                saveIndicator.classList.remove('d-none');
                saveIndicator.classList.add('animate-fadeIn');
                setTimeout(() => saveIndicator.classList.add('d-none'), 2000);
            }
        }
    } catch (error) {
        console.error(`[autoSaveDraft] Error saving ${key}:`, error);
        // Toast might be too intrusive for a background save error.
    }
}

function restoreDraftContent(key, targetElementSelector, onRestoreCallback = null) {
    try {
        if (typeof StorageUtils === 'undefined' || typeof DOMUtils === 'undefined') {
            console.error("StorageUtils or DOMUtils not available for restoreDraftContent"); return;
        }
        const savedData = StorageUtils.load(key);
        if (savedData && typeof savedData.draft === 'string') { // Check type of draft
            const targetElement = DOMUtils.getElement(targetElementSelector);
            if (targetElement) {
                targetElement.innerText = savedData.draft;
                if (onRestoreCallback && typeof onRestoreCallback === 'function') {
                    onRestoreCallback(savedData.draft);
                }
            }
        }
    } catch (error) {
        console.error(`[restoreDraftContent] Error restoring ${key}:`, error);
        if (typeof Toast !== 'undefined' && Toast.show) {
            Toast.show("이전 작업 내용을 불러오는데 실패했습니다. 콘솔을 확인해주세요.", "warning");
        }
    }
}

function autoSave(text) {
    autoSaveDraft('letterCountData', text, '#save-indicator');
}

function restoreDraft() {
    restoreDraftContent('letterCountData', '#letter_count', updateStatistics);
}

function updateStatistics() {
    if (typeof DOMUtils === 'undefined') { console.error("DOMUtils not available for updateStatistics"); return; }
    try {
        const letterCountElement = DOMUtils.getElement('#letter_count');
        const text = letterCountElement ? letterCountElement.innerText : '';

        function updateStat(selector, value) {
            const element = DOMUtils.getElement(selector);
            if (element && element.textContent !== String(value)) {
                element.textContent = String(value);
            }
        }

        if (!text || text.trim() === '') {
            const fields = ['1', '2', '3', '4', 'sentences', 'avg-word-length', 'reading-time', 'paragraphs'];
            fields.forEach(f => updateStat(`[data-result="${f}"]`, '0'));
            autoSave(text); // Save even if empty
            return;
        }
        // Ensure text analysis functions are available
        const safeCountSentences = typeof countSentences === 'function' ? countSentences : () => 0;
        const safeCalcAvgWordLen = typeof calculateAverageWordLength === 'function' ? calculateAverageWordLength : () => 0;
        const safeCalcReadTime = typeof calculateReadingTime === 'function' ? calculateReadingTime : () => "N/A";
        const safeCountParagraphs = typeof countParagraphs === 'function' ? countParagraphs : () => 0;

        updateStat('[data-result="1"]', text.replace(/\s/g, '').length);
        updateStat('[data-result="2"]', text.length);
        updateStat('[data-result="3"]', text.trim().split(/\s+/).filter(w => w.length > 0).length);
        updateStat('[data-result="4"]', text.split('\n').length);
        updateStat('[data-result="sentences"]', safeCountSentences(text));
        updateStat('[data-result="avg-word-length"]', safeCalcAvgWordLen(text));
        updateStat('[data-result="reading-time"]', safeCalcReadTime(text));
        updateStat('[data-result="paragraphs"]', safeCountParagraphs(text));
        autoSave(text);
    } catch (error) {
        console.error('통계 업데이트 중 오류:', error);
        if (typeof Toast !== 'undefined' && Toast.show) {
            Toast.show("통계 업데이트 중 오류가 발생했습니다.", "danger");
        }
    }
}

const debouncedUpdate = (typeof debounce === 'function') ? debounce(updateStatistics, 300) : updateStatistics;

if (typeof DOMUtils !== 'undefined') {
    DOMUtils.addEvent('#letter_count', 'input', function(e) {
        const text = e.target.innerText;
        debouncedUpdate();
        if (typeof debouncedAddHistory === 'function') debouncedAddHistory(text);
        setTimeout(() => {
            if (typeof updateUndoRedoButtons === 'function') updateUndoRedoButtons();
        }, 600);
    });
}

const textTransformations = { /* ... same as before ... */ };

function handleTextTransform(transformType) {
    try {
        if (typeof DOMUtils === 'undefined') { console.error("DOMUtils not available for handleTextTransform"); return; }
        const letterCountElement = DOMUtils.getElement('#letter_count');
        if (!letterCountElement) return;
        const currentText = letterCountElement.innerText;
        if (transformType in textTransformations) {
            const transformedText = textTransformations[transformType](currentText);
            letterCountElement.innerText = transformedText;
            updateStatistics();
            if (typeof textHistory !== 'undefined' && textHistory.addState) textHistory.addState(transformedText);
            if (typeof updateUndoRedoButtons === 'function') updateUndoRedoButtons();
            const transformNames = {'uppercase': '대문자 변환', 'lowercase': '소문자 변환', 'capitalize': '첫 글자 대문자', 'remove-special': '특수문자 제거', 'remove-spaces': '공백 제거', 'trim-lines': '공백 정리', 'clear': '텍스트 지우기'};
            if (typeof Toast !== 'undefined' && Toast.show) Toast.show(`${transformNames[transformType] || '텍스트 변환'} 완료`, 'success', 2000);
        }
    } catch (error) {
        console.error(`[handleTextTransform] Error during ${transformType}:`, error);
        if (typeof Toast !== 'undefined' && Toast.show) {
            Toast.show("텍스트 변환 중 오류가 발생했습니다.", "danger");
        }
    }
}

function updateUndoRedoButtons() { /* ... same as before ... */ }

DOMUtils.addEvent(document, 'DOMContentLoaded', function() {
    // ... (Tooltip, restoreDraft, ResizeObserver initialization - keep as is, assuming they have their own checks)
    // Add try-catch for restoreDraft and ResizeObserver if they are critical and might fail
    try {
        if (typeof bootstrap !== 'undefined' && typeof DOMUtils !== 'undefined') {
            const tooltipTriggerList = [].slice.call(DOMUtils.getElements('[data-bs-toggle="tooltip"]'));
            tooltipTriggerList.map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
        }
    } catch (e) { console.error("Bootstrap tooltip init error:", e); }

    try {
        restoreDraft();
    } catch (e) { console.error("Error in restoreDraft on DOMContentLoaded:", e); }

    const letterCountElementForResize = DOMUtils.getElement('#letter_count');
    if (letterCountElementForResize) {
        try {
            const savedHeight = StorageUtils.load('letterCountTextAreaHeight');
            if (savedHeight) letterCountElementForResize.style.height = savedHeight;
            if (typeof ResizeObserver !== 'undefined') {
                const resizeObserver = new ResizeObserver(entries => {
                    for (let entry of entries) StorageUtils.save('letterCountTextAreaHeight', entry.contentRect.height + 'px');
                });
                resizeObserver.observe(letterCountElementForResize);
            }
        } catch (e) { console.error("Error in ResizeObserver setup:", e); }
    }
    
    // Keyboard shortcuts - keep as is, they have internal checks

    if (typeof updateUndoRedoButtons === 'function') updateUndoRedoButtons();
    const initialPage = getCurrentPageFromURL();
    updateNavigationState(initialPage);
    if (initialPage !== 'home' && initialPage !== '/') {
        loadPageContent(initialPage, false);
    }

    // Consolidated Event Listener
    DOMUtils.addEvent(document.body, 'click', function(e) {
        // ... (event delegation logic - keep as is)
    });
});

function loadPageContent(page, addToHistory = true) {
    if (typeof DOMUtils === 'undefined' || typeof jQuery === 'undefined') {
        console.error("DOMUtils or jQuery not available for loadPageContent");
        const mainEl = document.querySelector('main'); // Vanilla JS fallback
        if(mainEl) mainEl.innerHTML = '<div class="alert alert-danger m-4">페이지 로딩 오류: 필수 라이브러리 누락.</div>';
        if (typeof Toast !== 'undefined' && Toast.show) Toast.show("페이지 로딩 구성요소 오류", "danger");
        return;
    }

    updateNavigationState(page);
    if (addToHistory) updateURLState(page);

    const mainElement = jQuery('main');
    mainElement.html('<div class="text-center py-5"><div class="loading mx-auto mb-3"></div><p class="text-muted">페이지를 불러오는 중...</p></div>').fadeIn(100);

    mainElement.fadeOut(200, function() {
        jQuery(this).load(`/html/${page}.html`, function(response, status, xhr) {
            if (status === "success") {
                jQuery(this).fadeIn(300);
                loadPageScript(page)
                    .then(() => console.log(`Successfully loaded and initialized script for ${page}`))
                    .catch(err => {
                         console.error(`Error in script for ${page}: ${err.message}`, err);
                         jQuery(this).html('<div class="alert alert-warning m-4">페이지 스크립트 실행 중 오류가 발생했습니다. 자세한 내용은 콘솔을 확인하세요.</div>').fadeIn(300);
                         if (typeof Toast !== 'undefined' && Toast.show) Toast.show(`${page} 페이지 스크립트 로딩 실패`, "danger", 4000);
                    });
            } else if (status === "error") {
                const errorMsg = `페이지를 불러올 수 없습니다. (오류: ${xhr.status} ${xhr.statusText})`;
                console.error(`Error loading page /html/${page}.html: ${xhr.status} ${xhr.statusText}`);
                jQuery(this).html(`<div class="alert alert-danger m-4">${errorMsg}</div>`).fadeIn(300);
                if (typeof Toast !== 'undefined' && Toast.show) Toast.show(errorMsg, "danger", 4000);
            }
        });
    });
}

window.addEventListener('popstate', function(e) { /* ... same as before ... */ });

const loadedScripts = new Set();
function loadScript(src) { // src already includes cache busting from loadPageScript
    return new Promise((resolve, reject) => {
        if (loadedScripts.has(src)) { resolve(); return; } // Check full src with version
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => { loadedScripts.add(src); resolve(); };
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`)); // This error will be caught by loadPageScript's .catch
        document.body.appendChild(script);
    });
}

function loadPageScript(page) {
    const scriptMap = { /* ... same as before ... */ };
    const scriptsToLoad = scriptMap[page] || [];
    let promiseChain = Promise.resolve();
    scriptsToLoad.forEach(src => {
        promiseChain = promiseChain.then(() => loadScript(src + `?v=${new Date().getTime()}`));
    });
    return promiseChain.then(() => { /* ... page init calls ... */ });
}

function updateNavigationState(currentPage = 'home') { /* ... same as before ... */ }
function getCurrentPageFromURL() { /* ... same as before ... */ }
function updateURLState(page) { /* ... same as before ... */ }

function exportStatistics() {
    try {
        if (typeof DOMUtils === 'undefined' || typeof TimeUtils === 'undefined' || typeof Toast === 'undefined') {
            console.error("Required utilities not available for exportStatistics");
            if (typeof Toast !== 'undefined' && Toast.show) Toast.show("내보내기 기능 오류", "danger");
            return;
        }
        // ... (rest of the function)
        const letterCountElement = DOMUtils.getElement('#letter_count');
        if (!letterCountElement) { if (typeof Toast !== 'undefined' && Toast.show) Toast.show("텍스트 영역을 찾을 수 없습니다.", "warning"); return; }
        // ... (CSV generation)
        if (typeof Toast !== 'undefined' && Toast.show) Toast.show('통계를 CSV 파일로 내보냈습니다', 'success');

    } catch (error) {
        console.error('통계 내보내기 중 오류:', error);
        if (typeof Toast !== 'undefined' && Toast.show) Toast.show('통계 내보내기 중 오류가 발생했습니다.', 'danger');
    }
}

console.log("Main index.js script loaded and event listeners configured.");
updateStatistics();
if(typeof updateUndoRedoButtons === 'function') updateUndoRedoButtons();
