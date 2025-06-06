// 전역 변수를 함수 외부로 이동하여 중복 초기화 방지
let typingPracticeState = null;

// 연습 기록 저장/불러오기
const practiceRecords = {
    save: function(mode, wpm, accuracy) {
        const records = this.load();
        const record = {
            mode: mode,
            wpm: wpm,
            accuracy: accuracy,
            date: new Date().toISOString()
        };
        records.push(record);
        // 최근 100개만 저장
        if (records.length > 100) {
            records.shift();
        }
        localStorage.setItem('typingPracticeRecords', JSON.stringify(records));
    },
    
    load: function() {
        const saved = localStorage.getItem('typingPracticeRecords');
        return saved ? JSON.parse(saved) : [];
    },
    
    getBestWPM: function(mode) {
        const records = this.load();
        const modeRecords = records.filter(r => r.mode === mode);
        if (modeRecords.length === 0) return 0;
        return Math.max(...modeRecords.map(r => r.wpm));
    },
    
    getAverageWPM: function(mode) {
        const records = this.load();
        const modeRecords = records.filter(r => r.mode === mode);
        if (modeRecords.length === 0) return 0;
        const sum = modeRecords.reduce((acc, r) => acc + r.wpm, 0);
        return Math.round(sum / modeRecords.length);
    }
};

// 페이지 언로드 시 정리
function cleanupTypingPractice() {
    if (typingPracticeState) {
        // 타이머 정리
        if (typingPracticeState.timerInterval) {
            clearInterval(typingPracticeState.timerInterval);
            typingPracticeState.timerInterval = null;
        }
        
        // 이벤트 리스너 정리
        typingPracticeState.eventListeners.forEach((info) => {
            if (info.element && info.handler) {
                info.element.removeEventListener(info.event, info.handler);
            }
        });
        typingPracticeState.eventListeners.clear();
        
        // 상태 초기화
        typingPracticeState = null;
    }
}

// 새로운 타자 연습 시스템
function initializeTypingPracticeNew() {
    console.log('새로운 타자 연습 시스템 초기화 중...');
    
    // 이미 초기화되었으면 리턴
    if (typingPracticeState && typingPracticeState.initialized) {
        console.log('타자 연습 시스템이 이미 초기화되었습니다.');
        return;
    }
    
    // 기존 상태 정리
    cleanupTypingPractice();
    
    // 전역 상태 초기화
    typingPracticeState = {
        initialized: true,
        currentMode: null,
        currentText: '',
        currentIndex: 0,
        startTime: null,
        timerInterval: null,
        errorCount: 0,
        isTyping: false,
        eventListeners: new Map() // 이벤트 리스너 추적용
    };
    
    // DOM 요소들
    const versionSelector = document.getElementById('version-selector');
    const practiceArea = document.getElementById('practice-area');
    const backToMenuBtn = document.getElementById('back-to-menu');
    const statsArea = document.getElementById('stats-area');
    
    // 기존 이벤트 리스너 제거 함수
    function removeEventListener(element, event, handler) {
        if (element && handler) {
            element.removeEventListener(event, handler);
        }
    }
    
    // 안전한 이벤트 리스너 추가 함수
    function addEventListenerOnce(element, event, handler, key) {
        if (!element) return;
        
        // 기존 리스너가 있으면 제거
        const existingHandler = typingPracticeState.eventListeners.get(key);
        if (existingHandler) {
            removeEventListener(element, event, existingHandler.handler);
        }
        
        // 새 리스너 추가
        element.addEventListener(event, handler);
        typingPracticeState.eventListeners.set(key, { element, event, handler });
    }
    
    // 모드 선택
    document.querySelectorAll('.select-mode-btn').forEach((btn, index) => {
        const handler = function(e) {
            e.preventDefault();
            const modeCard = this.closest('.practice-mode-card');
            const mode = modeCard.dataset.practiceMode;
            selectMode(mode);
        };
        addEventListenerOnce(btn, 'click', handler, `mode-select-${index}`);
    });
    
    // 메뉴로 돌아가기
    if (backToMenuBtn) {
        const handler = function() {
            versionSelector.style.display = 'block';
            practiceArea.style.display = 'none';
            statsArea.style.display = 'none';
            resetAllPractices();
        };
        addEventListenerOnce(backToMenuBtn, 'click', handler, 'back-to-menu');
    }
    
    // 모드 선택 함수
    function selectMode(mode) {
        typingPracticeState.currentMode = mode;
        versionSelector.style.display = 'none';
        practiceArea.style.display = 'block';
        
        // 모든 연습 콘텐츠 숨기기
        document.querySelectorAll('.practice-content').forEach(content => {
            content.style.display = 'none';
        });
        
        // 선택한 모드 표시
        const modeElement = document.getElementById(`${mode}-practice`);
        if (modeElement) {
            modeElement.style.display = 'block';
        }
        
        // 모드별 초기화
        switch(mode) {
            case 'free':
                initializeFreePractice();
                break;
            case 'beginner':
                initializeBeginnerPractice();
                break;
            case 'special':
                initializeSpecialPractice();
                break;
            case 'standard':
                loadStandardPractice();
                break;
        }
    }
    
    // 자유 타자 연습
    function initializeFreePractice() {
        const freeTextInput = document.getElementById('free-text-input');
        const startBtn = document.getElementById('start-free-practice');
        const resetBtn = document.getElementById('reset-free-practice');
        const typingArea = document.getElementById('free-typing-area');
        const typingInput = document.getElementById('free-typing-input');
        const statsArea = document.getElementById('stats-area');
        
        // 요소 존재 확인
        if (!freeTextInput || !startBtn || !resetBtn || !typingArea || !typingInput) {
            console.error('자유 타자 연습 요소를 찾을 수 없습니다.');
            return;
        }
        
        const startHandler = function() {
            const text = freeTextInput.value.trim();
            if (text.length === 0) {
                alert('연습할 텍스트를 입력해주세요.');
                return;
            }
            
            typingPracticeState.currentText = text;
            typingPracticeState.currentIndex = 0;
            typingPracticeState.errorCount = 0;
            typingPracticeState.isTyping = true;
            typingPracticeState.startTime = Date.now();
            
            freeTextInput.disabled = true;
            startBtn.style.display = 'none';
            typingArea.style.display = 'block';
            if (statsArea) statsArea.style.display = 'flex';
            
            updateDisplay('free');
            typingInput.value = '';
            typingInput.focus();
            
            // 개인 기록 표시
            showPersonalRecords('free');
            
            // 기존 타이머 정리
            if (typingPracticeState.timerInterval) {
                clearInterval(typingPracticeState.timerInterval);
            }
            typingPracticeState.timerInterval = setInterval(updateTimer, 100);
        };
        
        addEventListenerOnce(startBtn, 'click', startHandler, 'free-start');
        
        const resetHandler = function() {
            resetPractice('free');
            freeTextInput.disabled = false;
            startBtn.style.display = 'inline-block';
            typingArea.style.display = 'none';
            if (statsArea) statsArea.style.display = 'none';
        };
        
        addEventListenerOnce(resetBtn, 'click', resetHandler, 'free-reset');
        
        const inputHandler = function() {
            handleTyping('free', this.value);
        };
        
        addEventListenerOnce(typingInput, 'input', inputHandler, 'free-input');
    }
    
    // 초보자 타자 연습
    function initializeBeginnerPractice() {
        let currentBeginnerType = 'home';
        const startBtn = document.getElementById('start-beginner-practice');
        const resetBtn = document.getElementById('reset-beginner-practice');
        const typingInput = document.getElementById('beginner-typing-input');
        
        // 타입 선택
        document.querySelectorAll('[data-beginner-type]').forEach((btn, index) => {
            const handler = function() {
                if (!typingPracticeState.isTyping) {
                    document.querySelectorAll('[data-beginner-type]').forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                    currentBeginnerType = this.dataset.beginnerType;
                }
            };
            addEventListenerOnce(btn, 'click', handler, `beginner-type-${index}`);
        });
        
        // 키보드 시각화 생성
        createKeyboardVisualization();
        
        const beginnerStartHandler = function() {
            const texts = practiceTexts.beginner[currentBeginnerType];
            typingPracticeState.currentText = texts[Math.floor(Math.random() * texts.length)];
            typingPracticeState.currentIndex = 0;
            typingPracticeState.errorCount = 0;
            typingPracticeState.isTyping = true;
            typingPracticeState.startTime = Date.now();
            
            startBtn.style.display = 'none';
            statsArea.style.display = 'flex';
            
            updateDisplay('beginner');
            typingInput.value = '';
            typingInput.disabled = false;
            typingInput.focus();
            
            // 현재 타이핑해야 할 키 강조
            highlightKey(typingPracticeState.currentText[0]);
            
            // 개인 기록 표시
            showPersonalRecords('beginner');
            
            // 기존 타이머 정리
            if (typingPracticeState.timerInterval) {
                clearInterval(typingPracticeState.timerInterval);
            }
            typingPracticeState.timerInterval = setInterval(updateTimer, 100);
        };
        
        addEventListenerOnce(startBtn, 'click', beginnerStartHandler, 'beginner-start');
        
        const beginnerResetHandler = function() {
            resetPractice('beginner');
            startBtn.style.display = 'inline-block';
            statsArea.style.display = 'none';
            clearKeyHighlight();
        };
        
        addEventListenerOnce(resetBtn, 'click', beginnerResetHandler, 'beginner-reset');
        
        const beginnerInputHandler = function() {
            handleTyping('beginner', this.value);
            if (typingPracticeState.currentIndex < typingPracticeState.currentText.length) {
                highlightKey(typingPracticeState.currentText[typingPracticeState.currentIndex]);
            } else {
                clearKeyHighlight();
            }
        };
        
        addEventListenerOnce(typingInput, 'input', beginnerInputHandler, 'beginner-input');
    }
    
    // 특수 타자 연습
    function initializeSpecialPractice() {
        let currentSpecialType = 'numbers';
        const startBtn = document.getElementById('start-special-practice');
        const resetBtn = document.getElementById('reset-special-practice');
        const typingInput = document.getElementById('special-typing-input');
        
        // 타입 선택
        document.querySelectorAll('[data-special-type]').forEach((btn, index) => {
            const handler = function() {
                if (!typingPracticeState.isTyping) {
                    document.querySelectorAll('[data-special-type]').forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                    currentSpecialType = this.dataset.specialType;
                }
            };
            addEventListenerOnce(btn, 'click', handler, `special-type-${index}`);
        });
        
        const specialStartHandler = function() {
            const texts = practiceTexts.special[currentSpecialType];
            typingPracticeState.currentText = texts[Math.floor(Math.random() * texts.length)];
            typingPracticeState.currentIndex = 0;
            typingPracticeState.errorCount = 0;
            typingPracticeState.isTyping = true;
            typingPracticeState.startTime = Date.now();
            
            startBtn.style.display = 'none';
            statsArea.style.display = 'flex';
            
            updateDisplay('special');
            typingInput.value = '';
            typingInput.disabled = false;
            typingInput.focus();
            
            // 개인 기록 표시
            showPersonalRecords('special');
            
            // 기존 타이머 정리
            if (typingPracticeState.timerInterval) {
                clearInterval(typingPracticeState.timerInterval);
            }
            typingPracticeState.timerInterval = setInterval(updateTimer, 100);
        };
        
        addEventListenerOnce(startBtn, 'click', specialStartHandler, 'special-start');
        
        const specialResetHandler = function() {
            resetPractice('special');
            startBtn.style.display = 'inline-block';
            statsArea.style.display = 'none';
        };
        
        addEventListenerOnce(resetBtn, 'click', specialResetHandler, 'special-reset');
        
        const specialInputHandler = function() {
            handleTyping('special', this.value);
        };
        
        addEventListenerOnce(typingInput, 'input', specialInputHandler, 'special-input');
    }
    
    // 표준 타자 연습 로드
    function loadStandardPractice() {
        let currentStandardMode = 'words';
        let currentStandardLevel = 'easy';
        
        // 모드 선택
        document.querySelectorAll('[data-standard-mode]').forEach((btn, index) => {
            const handler = function() {
                if (!typingPracticeState.isTyping) {
                    document.querySelectorAll('[data-standard-mode]').forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                    currentStandardMode = this.dataset.standardMode;
                    resetStandardPractice();
                }
            };
            addEventListenerOnce(btn, 'click', handler, `standard-mode-${index}`);
        });
        
        // 난이도 선택
        document.querySelectorAll('[data-standard-level]').forEach((btn, index) => {
            const handler = function() {
                if (!typingPracticeState.isTyping) {
                    document.querySelectorAll('[data-standard-level]').forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                    currentStandardLevel = this.dataset.standardLevel;
                    resetStandardPractice();
                }
            };
            addEventListenerOnce(btn, 'click', handler, `standard-level-${index}`);
        });
        
        // 버튼 이벤트
        const startBtn = document.getElementById('standard-start-btn');
        const resetBtn = document.getElementById('standard-reset-btn');
        const nextBtn = document.getElementById('standard-next-btn');
        const typingInput = document.getElementById('standard-typing-input');
        
        const standardStartHandler = function() {
            const texts = practiceTexts.standard[currentStandardMode][currentStandardLevel];
            if (Array.isArray(texts)) {
                typingPracticeState.currentText = texts[Math.floor(Math.random() * texts.length)];
            } else {
                typingPracticeState.currentText = texts;
            }
            
            typingPracticeState.currentIndex = 0;
            typingPracticeState.errorCount = 0;
            typingPracticeState.isTyping = true;
            typingPracticeState.startTime = Date.now();
            
            updateDisplay('standard');
            typingInput.value = '';
            typingInput.disabled = false;
            typingInput.focus();
            startBtn.style.display = 'none';
            statsArea.style.display = 'flex';
            
            // 개인 기록 표시
            showPersonalRecords('standard');
            
            // 기존 타이머 정리
            if (typingPracticeState.timerInterval) {
                clearInterval(typingPracticeState.timerInterval);
            }
            typingPracticeState.timerInterval = setInterval(updateTimer, 100);
        };
        
        addEventListenerOnce(startBtn, 'click', standardStartHandler, 'standard-start');
        
        const standardResetHandler = function() {
            resetStandardPractice();
        };
        
        addEventListenerOnce(resetBtn, 'click', standardResetHandler, 'standard-reset');
        
        const standardNextHandler = function() {
            nextBtn.style.display = 'none';
            // 직접 핸들러 호출하여 재귀 방지
            standardStartHandler();
        };
        
        addEventListenerOnce(nextBtn, 'click', standardNextHandler, 'standard-next');
        
        const standardInputHandler = function() {
            handleTyping('standard', this.value);
        };
        
        addEventListenerOnce(typingInput, 'input', standardInputHandler, 'standard-input');
        
        const standardKeydownHandler = function(e) {
            if (e.key === 'Enter' && !typingPracticeState.isTyping) {
                standardStartHandler();
            }
        };
        
        addEventListenerOnce(typingInput, 'keydown', standardKeydownHandler, 'standard-keydown');
        
        // 표준 연습 리셋
        function resetStandardPractice() {
            resetPractice('standard');
            document.getElementById('standard-start-btn').style.display = 'inline-block';
            document.getElementById('standard-next-btn').style.display = 'none';
            document.getElementById('standard-remaining-text').textContent = '시작 버튼을 눌러주세요';
        }
        
        // 초기화
        resetStandardPractice();
    }
    
    // 타이핑 처리
    function handleTyping(mode, typed) {
        if (!typingPracticeState.isTyping) return;
        
        const expected = typingPracticeState.currentText.substring(0, typed.length);
        
        if (typed === expected) {
            typingPracticeState.currentIndex = typed.length;
            updateDisplay(mode);
            updateStats();
            
            // 완료 체크
            if (typingPracticeState.currentIndex >= typingPracticeState.currentText.length) {
                completePractice();
                if (mode === 'standard') {
                    const input = document.getElementById('standard-typing-input');
                    const nextBtn = document.getElementById('standard-next-btn');
                    if (input) input.disabled = true;
                    if (nextBtn) nextBtn.style.display = 'inline-block';
                }
            }
        } else {
            // 오류 처리
            typingPracticeState.errorCount++;
            const input = document.getElementById(`${mode}-typing-input`);
            if (input) {
                input.classList.add('is-invalid');
                setTimeout(() => {
                    input.classList.remove('is-invalid');
                }, 200);
            }
        }
    }
    
    // 화면 업데이트
    function updateDisplay(mode) {
        const typedText = document.getElementById(`${mode}-typed-text`);
        const currentChar = document.getElementById(`${mode}-current-char`);
        const remainingText = document.getElementById(`${mode}-remaining-text`);
        
        if (typedText) typedText.textContent = typingPracticeState.currentText.substring(0, typingPracticeState.currentIndex);
        if (currentChar) currentChar.textContent = typingPracticeState.currentText[typingPracticeState.currentIndex] || '';
        if (remainingText) remainingText.textContent = typingPracticeState.currentText.substring(typingPracticeState.currentIndex + 1);
        
        // 진행률
        const progress = Math.round((typingPracticeState.currentIndex / typingPracticeState.currentText.length) * 100);
        const progressEl = document.getElementById('progress');
        if (progressEl) progressEl.textContent = progress + '%';
    }
    
    // 통계 업데이트
    function updateStats() {
        if (!typingPracticeState || !typingPracticeState.startTime) return;
        
        try {
            const elapsedMinutes = (Date.now() - typingPracticeState.startTime) / 60000;
            const charactersTyped = typingPracticeState.currentIndex;
            const wpm = elapsedMinutes > 0 ? Math.round(charactersTyped / elapsedMinutes) : 0;
            const totalAttempts = charactersTyped + typingPracticeState.errorCount;
            const accuracy = totalAttempts > 0 ? Math.round((charactersTyped / totalAttempts) * 100) : 100;
            
            const wpmEl = document.getElementById('wpm');
            const accuracyEl = document.getElementById('accuracy');
            if (wpmEl) wpmEl.textContent = wpm;
            if (accuracyEl) accuracyEl.textContent = accuracy + '%';
        } catch (error) {
            console.error('통계 업데이트 중 오류:', error);
        }
    }
    
    // 타이머 업데이트
    function updateTimer() {
        if (!typingPracticeState.startTime) return;
        
        const elapsed = Date.now() - typingPracticeState.startTime;
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        const timeEl = document.getElementById('time');
        if (timeEl) timeEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // 연습 완료
    function completePractice() {
        typingPracticeState.isTyping = false;
        if (typingPracticeState.timerInterval) {
            clearInterval(typingPracticeState.timerInterval);
            typingPracticeState.timerInterval = null;
        }
        
        // 최종 통계
        const elapsedMinutes = (Date.now() - typingPracticeState.startTime) / 60000;
        const finalWpm = Math.round(typingPracticeState.currentText.length / elapsedMinutes);
        const finalAccuracy = Math.round(((typingPracticeState.currentText.length - typingPracticeState.errorCount) / typingPracticeState.currentText.length) * 100);
        
        // 이전 최고 기록 확인
        const previousBest = practiceRecords.getBestWPM(typingPracticeState.currentMode);
        
        // 기록 저장
        practiceRecords.save(typingPracticeState.currentMode, finalWpm, finalAccuracy);
        
        // 결과 모달 표시
        const finalWpmEl = document.getElementById('final-wpm');
        const finalAccuracyEl = document.getElementById('final-accuracy');
        const resultMessageEl = document.getElementById('result-message');
        
        if (finalWpmEl) finalWpmEl.textContent = finalWpm;
        if (finalAccuracyEl) finalAccuracyEl.textContent = finalAccuracy + '%';
        
        let message = '';
        if (finalWpm >= 300) {
            message = '놀라운 속도입니다! 전문가 수준이시네요!';
        } else if (finalWpm >= 200) {
            message = '매우 훌륭합니다! 상위 수준의 타자 실력입니다!';
        } else if (finalWpm >= 150) {
            message = '좋습니다! 평균 이상의 실력입니다!';
        } else if (finalWpm >= 100) {
            message = '잘하고 있습니다! 조금만 더 연습하면 더 빨라질 거예요!';
        } else {
            message = '꾸준히 연습하면 실력이 향상될 거예요! 화이팅!';
        }
        
        // 신기록 달성 시 추가 메시지
        if (previousBest > 0 && finalWpm > previousBest) {
            message += '\n🎉 개인 신기록을 달성하셨습니다!';
        }
        
        if (resultMessageEl) resultMessageEl.textContent = message;
        
        try {
            const modalEl = document.getElementById('resultModal');
            if (modalEl && typeof bootstrap !== 'undefined') {
                const modal = new bootstrap.Modal(modalEl);
                modal.show();
                
                // 계속 연습 버튼 - 이벤트 리스너 관리
                const continueBtn = document.getElementById('continue-btn');
                if (continueBtn) {
                    // 기존 리스너 제거 후 새로 추가
                    const handler = function() {
                        continueCurrentPractice();
                    };
                    addEventListenerOnce(continueBtn, 'click', handler, 'continue-practice');
                }
            }
        } catch (error) {
            console.error('모달 표시 중 오류:', error);
            alert(`연습 완료! 타수: ${finalWpm} 타/분, 정확도: ${finalAccuracy}%`);
        }
    }
    
    // 현재 모드에서 계속 연습
    function continueCurrentPractice() {
        resetStats();
        
        switch(typingPracticeState.currentMode) {
            case 'free':
                const freeArea = document.getElementById('free-typing-area');
                const freeInput = document.getElementById('free-text-input');
                const freeStartBtn = document.getElementById('start-free-practice');
                
                if (freeArea) freeArea.style.display = 'none';
                if (freeInput) freeInput.disabled = false;
                if (freeStartBtn) freeStartBtn.style.display = 'inline-block';
                break;
                
            case 'beginner':
                const beginnerBtn = document.getElementById('start-beginner-practice');
                if (beginnerBtn) beginnerBtn.click();
                break;
                
            case 'special':
                const specialBtn = document.getElementById('start-special-practice');
                if (specialBtn) specialBtn.click();
                break;
                
            case 'standard':
                // 표준 모드는 이미 loadStandardPractice에서 처리됨
                // 다음 버튼 클릭으로 처리
                const nextBtn = document.getElementById('standard-next-btn');
                if (nextBtn) {
                    nextBtn.click();
                }
                break;
        }
    }
    
    // 리셋
    function resetPractice(mode) {
        typingPracticeState.isTyping = false;
        typingPracticeState.currentIndex = 0;
        typingPracticeState.errorCount = 0;
        if (typingPracticeState.timerInterval) {
            clearInterval(typingPracticeState.timerInterval);
            typingPracticeState.timerInterval = null;
        }
        
        const typingInput = document.getElementById(`${mode}-typing-input`);
        if (typingInput) {
            typingInput.value = '';
            typingInput.disabled = true;
        }
        
        updateDisplay(mode);
        resetStats();
    }
    
    // 통계 리셋
    function resetStats() {
        document.getElementById('wpm').textContent = '0';
        document.getElementById('accuracy').textContent = '100%';
        document.getElementById('time').textContent = '0:00';
        document.getElementById('progress').textContent = '0%';
    }
    
    // 개인 기록 표시
    function showPersonalRecords(mode) {
        const recordsArea = document.getElementById('personal-records');
        const bestWpmEl = document.getElementById('best-wpm');
        const avgWpmEl = document.getElementById('avg-wpm');
        
        if (recordsArea && bestWpmEl && avgWpmEl) {
            recordsArea.style.display = 'block';
            bestWpmEl.textContent = practiceRecords.getBestWPM(mode);
            avgWpmEl.textContent = practiceRecords.getAverageWPM(mode);
        }
    }
    
    // 모든 연습 리셋
    function resetAllPractices() {
        ['free', 'beginner', 'special', 'standard'].forEach(mode => {
            resetPractice(mode);
        });
        typingPracticeState.currentMode = null;
        resetStats();
        
        // 개인 기록 숨기기
        const recordsArea = document.getElementById('personal-records');
        if (recordsArea) recordsArea.style.display = 'none';
    }
    
    // 키보드 시각화 생성
    function createKeyboardVisualization() {
        const container = document.querySelector('.keyboard-container');
        if (!container) return;
        
        const koreanKeyboard = [
            ['ㅂ', 'ㅈ', 'ㄷ', 'ㄱ', 'ㅅ', 'ㅛ', 'ㅕ', 'ㅑ', 'ㅐ', 'ㅔ'],
            ['ㅁ', 'ㄴ', 'ㅇ', 'ㄹ', 'ㅎ', 'ㅗ', 'ㅓ', 'ㅏ', 'ㅣ'],
            ['ㅋ', 'ㅌ', 'ㅊ', 'ㅍ', 'ㅠ', 'ㅜ', 'ㅡ']
        ];
        
        container.innerHTML = '';
        
        koreanKeyboard.forEach((row, rowIndex) => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'keyboard-row';
            
            row.forEach(key => {
                const keyDiv = document.createElement('div');
                keyDiv.className = 'key';
                keyDiv.textContent = key;
                keyDiv.dataset.key = key;
                rowDiv.appendChild(keyDiv);
            });
            
            container.appendChild(rowDiv);
        });
        
        // 스페이스바 추가
        const spaceRow = document.createElement('div');
        spaceRow.className = 'keyboard-row';
        const spaceKey = document.createElement('div');
        spaceKey.className = 'key space';
        spaceKey.textContent = 'SPACE';
        spaceKey.dataset.key = ' ';
        spaceRow.appendChild(spaceKey);
        container.appendChild(spaceRow);
    }
    
    // 키 하이라이트
    function highlightKey(char) {
        clearKeyHighlight();
        const key = document.querySelector(`.key[data-key="${char}"]`);
        if (key) {
            key.classList.add('active');
        }
    }
    
    // 키 하이라이트 제거
    function clearKeyHighlight() {
        document.querySelectorAll('.key.active').forEach(key => {
            key.classList.remove('active');
        });
    }
}

// 기존 함수와 호환성을 위해
function initializeTypingPractice() {
    // 새로운 시스템으로 리다이렉트
    initializeTypingPracticeNew();
}

// 연습 데이터 관리 (코드 중복 제거를 위해 외부로 분리)
const practiceTexts = {
    beginner: {
        home: ['ㅁㄴㅇㄹ', 'ㅎㅗㅓㅏ', 'ㅂㅈㄷㄱ', 'ㅅㅛㅕㅑ', 'ㅋㅌㅊㅍ'],
        consonant: ['ㄱㄴㄷㄹ', 'ㅁㅂㅅㅇ', 'ㅈㅊㅋㅌ', 'ㅍㅎㄲㄸ', 'ㅃㅆㅉ'],
        vowel: ['ㅏㅑㅓㅕ', 'ㅗㅛㅜㅠ', 'ㅡㅣㅐㅔ', 'ㅒㅖㅘㅙ', 'ㅚㅝㅞㅟ'],
        words: ['가나다', '마바사', '아자차', '카타파', '하가나', '다라마']
    },
    special: {
        numbers: ['1234567890', '2024년 1월 1일', '전화번호: 010-1234-5678', '주민번호: 000000-0000000', '우편번호: 12345'],
        symbols: ['!@#$%^&*()', '[]{}()<>', '+-*/=', '.,;:\'"', '?!~`|\\'],
        mixed: ['abc123!@#', '2024-01-01', 'email@test.com', 'http://www.example.com', 'password123!'],
        chunjiin: ['ㅣ.ㅡ', 'ㅣ..', '...', 'ㅡ.ㅣ', 'ㅣ.ㅣ']
    },
    standard: {
        words: {
            easy: ['안녕하세요', '감사합니다', '사랑합니다', '행복하세요', '좋은하루', '반갑습니다', '축하합니다', '고맙습니다', '미안합니다', '괜찮습니다'],
            medium: ['대한민국', '컴퓨터', '인터넷', '스마트폰', '프로그래밍', '코딩테스트', '알고리즘', '데이터베이스', '네트워크', '클라우드'],
            hard: ['정보통신기술', '인공지능', '머신러닝', '블록체인', '사물인터넷', '빅데이터분석', '클라우드컴퓨팅', '사이버보안', '디지털트랜스포메이션', '메타버스']
        },
        sentences: {
            easy: [
                '오늘은 날씨가 정말 좋습니다.',
                '맛있는 음식을 먹고 싶어요.',
                '주말에 친구들과 만날 예정입니다.',
                '새로운 책을 읽기 시작했습니다.',
                '운동을 열심히 하고 있습니다.'
            ],
            medium: [
                '프로그래밍을 배우는 것은 매우 유익한 일입니다.',
                '인터넷의 발달로 세상이 하나로 연결되었습니다.',
                '건강한 생활습관을 유지하는 것이 중요합니다.',
                '새로운 기술을 배우는 것은 항상 즐겁습니다.',
                '꾸준한 노력이 성공의 열쇠입니다.'
            ],
            hard: [
                '인공지능 기술의 발전은 우리의 일상생활을 크게 변화시키고 있습니다.',
                '지속가능한 발전을 위해서는 환경보호가 필수적입니다.',
                '디지털 시대에 필요한 역량을 갖추기 위해 노력해야 합니다.',
                '글로벌 경제의 불확실성이 증가하고 있는 상황입니다.',
                '혁신적인 아이디어가 세상을 변화시킬 수 있습니다.'
            ]
        },
        paragraph: {
            easy: '봄이 왔습니다. 따뜻한 햇살이 내리쫄고 있습니다. 꽃들이 피어나기 시작했습니다. 사람들의 옷차림도 가벼워졌습니다. 공원에는 산책하는 사람들이 많습니다.',
            medium: '코딩을 배우는 것은 쉽지 않습니다. 하지만 꾸준히 연습하면 실력이 향상됩니다. 매일 조금씩 공부하는 것이 중요합니다. 다양한 프로젝트를 만들어보세요. 실전 경험이 가장 좋은 스승입니다.',
            hard: '현대 사회는 급속도로 변화하고 있습니다. 기술의 발전은 우리의 생활 방식을 완전히 바꾸어 놓았습니다. 인공지능과 로봇 기술의 발달로 많은 직업이 사라질 위기에 처해 있습니다. 하지만 동시에 새로운 기회도 생겨나고 있습니다. 우리는 이러한 변화에 적응하고 준비해야 합니다.'
        }
    }
};