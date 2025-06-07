// 전역 변수를 함수 외부로 이동하여 중복 초기화 방지
let typingPracticeState = null;

// 타자 연습 설정
const typingConfig = {
    defaultDuration: 5 * 60 * 1000, // 5분 (밀리초)
    showTimer: true
};

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
        eventListeners: new Map(), // 이벤트 리스너 추적용
        endTime: null, // 5분 타이머를 위한 종료 시간
        countdownInterval: null, // 카운트다운 인터벌
        currentLang: 'korean' // 현재 선택된 언어
    };
    
    // DOM 요소들
    const versionSelector = document.getElementById('version-selector');
    const practiceArea = document.getElementById('practice-area');
    const backToMenuBtn = document.getElementById('back-to-menu');
    const statsArea = document.getElementById('stats-area');
    const langKoreanBtn = document.getElementById('lang-korean');
    const langEnglishBtn = document.getElementById('lang-english');
    
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
            
            // \ub0a8\uc740 \uc2dc\uac04 \ud45c\uc2dc \uc601\uc5ed \uc228\uae30\uae30
            const remainingTimeRow = document.querySelector('#remaining-time')?.closest('.row');
            if (remainingTimeRow) {
                remainingTimeRow.style.display = 'none';
            }
        };
        addEventListenerOnce(backToMenuBtn, 'click', handler, 'back-to-menu');
    }
    
    // 언어 선택 버튼
    if (langKoreanBtn && langEnglishBtn) {
        const koreanHandler = function() {
            if (!typingPracticeState.isTyping) {
                typingPracticeState.currentLang = 'korean';
                langKoreanBtn.classList.add('active');
                langEnglishBtn.classList.remove('active');
                // 키보드 재생성 (초보자 모드인 경우)
                if (typingPracticeState.currentMode === 'beginner') {
                    createKeyboardVisualization();
                }
            }
        };
        
        const englishHandler = function() {
            if (!typingPracticeState.isTyping) {
                typingPracticeState.currentLang = 'english';
                langEnglishBtn.classList.add('active');
                langKoreanBtn.classList.remove('active');
                // 키보드 재생성 (초보자 모드인 경우)
                if (typingPracticeState.currentMode === 'beginner') {
                    createKeyboardVisualization();
                }
            }
        };
        
        addEventListenerOnce(langKoreanBtn, 'click', koreanHandler, 'lang-korean');
        addEventListenerOnce(langEnglishBtn, 'click', englishHandler, 'lang-english');
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
        
        // 남은 시간 표시 영역 표시
        const remainingTimeRow = document.querySelector('#remaining-time')?.closest('.row');
        if (remainingTimeRow) {
            remainingTimeRow.style.display = 'block';
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
        const startBtn = document.getElementById('start-free-practice');
        const resetBtn = document.getElementById('reset-free-practice');
        const typingArea = document.getElementById('free-typing-area');
        const typingInput = document.getElementById('free-typing-input');
        const statsArea = document.getElementById('stats-area');
        
        // 요소 존재 확인
        if (!startBtn || !resetBtn || !typingArea || !typingInput) {
            console.error('자유 타자 연습 요소를 찾을 수 없습니다.');
            return;
        }
        
        const startHandler = function() {
            // 언어에 따라 랜덤으로 문장 선택
            const lang = typingPracticeState.currentLang;
            const freeTexts = practiceTexts[lang].free;
            const text = freeTexts[Math.floor(Math.random() * freeTexts.length)];
            
            typingPracticeState.currentText = text;
            typingPracticeState.currentIndex = 0;
            typingPracticeState.errorCount = 0;
            typingPracticeState.isTyping = true;
            typingPracticeState.startTime = Date.now();
            typingPracticeState.endTime = Date.now() + typingConfig.defaultDuration;
            
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
            const lang = typingPracticeState.currentLang;
            const texts = practiceTexts[lang].beginner[currentBeginnerType];
            typingPracticeState.currentText = texts[Math.floor(Math.random() * texts.length)];
            typingPracticeState.currentIndex = 0;
            typingPracticeState.errorCount = 0;
            typingPracticeState.isTyping = true;
            typingPracticeState.startTime = Date.now();
            typingPracticeState.endTime = Date.now() + typingConfig.defaultDuration;
            
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
            const lang = typingPracticeState.currentLang;
            const texts = practiceTexts[lang].special[currentSpecialType];
            typingPracticeState.currentText = texts[Math.floor(Math.random() * texts.length)];
            typingPracticeState.currentIndex = 0;
            typingPracticeState.errorCount = 0;
            typingPracticeState.isTyping = true;
            typingPracticeState.startTime = Date.now();
            typingPracticeState.endTime = Date.now() + typingConfig.defaultDuration;
            
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
            const lang = typingPracticeState.currentLang;
            const texts = practiceTexts[lang].standard[currentStandardMode][currentStandardLevel];
            if (Array.isArray(texts)) {
                typingPracticeState.currentText = texts[Math.floor(Math.random() * texts.length)];
            } else {
                typingPracticeState.currentText = texts;
            }
            
            typingPracticeState.currentIndex = 0;
            typingPracticeState.errorCount = 0;
            typingPracticeState.isTyping = true;
            typingPracticeState.startTime = Date.now();
            typingPracticeState.endTime = Date.now() + typingConfig.defaultDuration;
            
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
        } else if (typed.length <= expected.length) {
            // 잘못 입력한 경우에만 에러로 처리
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
            
            // 언어별 타수 계산 로직 개선
            let wpm = 0;
            if (elapsedMinutes > 0) {
                if (typingPracticeState.currentLang === 'korean') {
                    // 한글 타수 계산: 완성된 글자 수 * 2.5 (표준 한글 타수 계산법)
                    wpm = Math.round((charactersTyped * 2.5) / elapsedMinutes);
                } else {
                    // 영어 타수 계산: CPM / 5 (표준 영어 타수 계산법)
                    wpm = Math.round(charactersTyped / elapsedMinutes);
                }
            }
            
            const totalAttempts = charactersTyped + typingPracticeState.errorCount;
            const accuracy = totalAttempts > 0 ? Math.round((charactersTyped / totalAttempts) * 100) : 100;
            
            const wpmEl = document.getElementById('wpm');
            const accuracyEl = document.getElementById('accuracy');
            const wpmUnitEl = document.getElementById('wpm-unit');
            
            if (wpmEl) wpmEl.textContent = wpm;
            if (accuracyEl) accuracyEl.textContent = accuracy + '%';
            
            // 언어별 단위 표시
            if (wpmUnitEl) {
                wpmUnitEl.textContent = typingPracticeState.currentLang === 'korean' ? '타/분' : 'WPM';
            }
        } catch (error) {
            console.error('통계 업데이트 중 오류:', error);
        }
    }
    
    // 타이머 업데이트
    function updateTimer() {
        if (!typingPracticeState || !typingPracticeState.endTime) return;
        
        const now = Date.now();
        const remaining = typingPracticeState.endTime - now;
        
        if (remaining <= 0) {
            completePractice();
            return;
        }
        
        const remainingMinutes = Math.floor(remaining / 60000);
        const remainingSeconds = Math.floor((remaining % 60000) / 1000);
        
        const remainingEl = document.getElementById('remaining-time');
        const progressBar = document.getElementById('time-progress-bar');
        
        if (remainingEl) {
            remainingEl.textContent = `남은 시간: ${remainingMinutes}:${remainingSeconds.toString().padStart(2, '0')}`;
            // 1분 미만일 때 빨간색으로 표시
            if (remaining < 60000) {
                remainingEl.classList.add('text-danger');
            } else {
                remainingEl.classList.remove('text-danger');
            }
        }
        
        if (progressBar) {
            const progress = (remaining / typingConfig.defaultDuration) * 100;
            progressBar.style.width = `${progress}%`;
        }
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
        const charactersTyped = typingPracticeState.currentIndex;
        const finalWpm = elapsedMinutes > 0 ? Math.round(charactersTyped / elapsedMinutes) : 0;
        const totalCharacters = charactersTyped + typingPracticeState.errorCount;
        const finalAccuracy = totalCharacters > 0 ? Math.round((charactersTyped / totalCharacters) * 100) : 100;
        
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
        // 언어별 타수 기준 조정
        if (typingPracticeState.currentLang === 'korean') {
            // 한글 타수 기준 (일반적으로 더 높음)
            if (finalWpm >= 500) {
                message = '놀라운 속도입니다! 최상위 전문가 수준이시네요!';
            } else if (finalWpm >= 400) {
                message = '매우 훌륭합니다! 전문가 수준의 타자 실력입니다!';
            } else if (finalWpm >= 300) {
                message = '우수합니다! 상위 수준의 실력을 보유하고 계십니다!';
            } else if (finalWpm >= 200) {
                message = '좋습니다! 평균 이상의 실력입니다!';
            } else if (finalWpm >= 150) {
                message = '잘하고 있습니다! 조금만 더 연습하면 더 빨라질 거예요!';
            } else {
                message = '꾸준히 연습하면 실력이 향상될 거예요! 화이팅!';
            }
        } else {
            // 영어 타수 기준
            if (finalWpm >= 100) {
                message = 'Amazing speed! You are at expert level!';
            } else if (finalWpm >= 80) {
                message = 'Excellent! Professional typing skills!';
            } else if (finalWpm >= 60) {
                message = 'Great job! Above average performance!';
            } else if (finalWpm >= 40) {
                message = 'Good work! Keep practicing to improve!';
            } else if (finalWpm >= 20) {
                message = 'Nice start! Your skills will improve with practice!';
            } else {
                message = 'Keep practicing! You will get better!';
            }
        }
        
        // 5분 완주 메시지 추가
        const totalElapsedMinutes = (Date.now() - typingPracticeState.startTime) / 60000;
        if (totalElapsedMinutes >= 4.9) { // 약 5분
            message += '\n\n🎯 5분 동안 집중해서 연습하셨네요! 수고하셨습니다!';
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
        typingPracticeState.endTime = null;
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
        const remainingEl = document.getElementById('remaining-time');
        if (remainingEl) remainingEl.textContent = '남은 시간: 5:00';
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
        
        const lang = typingPracticeState.currentLang;
        
        const keyboards = {
            korean: [
                ['ㅂ', 'ㅈ', 'ㄷ', 'ㄱ', 'ㅅ', 'ㅛ', 'ㅕ', 'ㅑ', 'ㅐ', 'ㅔ'],
                ['ㅁ', 'ㄴ', 'ㅇ', 'ㄹ', 'ㅎ', 'ㅗ', 'ㅓ', 'ㅏ', 'ㅣ'],
                ['ㅋ', 'ㅌ', 'ㅊ', 'ㅍ', 'ㅠ', 'ㅜ', 'ㅡ']
            ],
            english: [
                ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
                ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
                ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
            ]
        };
        
        const keyboard = keyboards[lang];
        
        container.innerHTML = '';
        
        keyboard.forEach((row, rowIndex) => {
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
    // 기존 초기화 함수 호출
    initializeTypingPracticeNew();
}

// 연습 데이터 관리 (코드 중복 제거를 위해 외부로 분리)
const practiceTexts = {
    korean: {
        free: [
            '안녕하세요',
            '반갑습니다',
            '오늘도 좋은 하루 되세요',
            '즐거운 하루 보내세요',
            '행복한 하루 되세요'
        ],
        beginner: {
            home: [
                'ㅁㄴㅇㄹ', 'ㅎㅗㅓㅏ', 'ㅂㅈㄷㄱ', 'ㅅㅛㅕㅑ', 'ㅋㅌㅊㅍ',
                'ㅠㅜㅡㅣ', 'ㅐㅔㅒㅖ', 'ㅘㅙㅚㅝ', 'ㅞㅟㅢ', 'ㅁㄴㅇㅎ',
                'ㅂㅈㄷㅅ', 'ㅋㅌㅊㅍ', 'ㅏㅓㅗㅜ', 'ㅑㅕㅛㅠ', 'ㅡㅣㅐㅔ'
            ],
            consonant: [
                'ㄱㄴㄷㄹ', 'ㅁㅂㅅㅇ', 'ㅈㅊㅋㅌ', 'ㅍㅎㄲㄸ', 'ㅃㅆㅉ',
                'ㄱㄱㄴㄴ', 'ㄷㄷㄹㄹ', 'ㅁㅁㅂㅂ', 'ㅅㅅㅇㅇ', 'ㅈㅈㅊㅊ',
                'ㅋㅋㅌㅌ', 'ㅍㅍㅎㅎ', 'ㄲㄲㄸㄸ', 'ㅃㅃㅆㅆ', 'ㅉㅉㄱㄴ',
                'ㄷㄹㅁㅂ', 'ㅅㅇㅈㅊ', 'ㅋㅌㅍㅎ', 'ㄱㄷㅂㅈ', 'ㅅㅁㄴㅇ'
            ],
            vowel: [
                'ㅏㅑㅓㅕ', 'ㅗㅛㅜㅠ', 'ㅡㅣㅐㅔ', 'ㅒㅖㅘㅙ', 'ㅚㅝㅞㅟ',
                'ㅏㅏㅓㅓ', 'ㅗㅗㅜㅜ', 'ㅡㅡㅣㅣ', 'ㅐㅐㅔㅔ', 'ㅑㅑㅕㅕ',
                'ㅛㅛㅠㅠ', 'ㅒㅒㅖㅖ', 'ㅘㅘㅙㅙ', 'ㅚㅚㅝㅝ', 'ㅞㅞㅟㅟ',
                'ㅢㅢㅏㅑ', 'ㅓㅕㅗㅛ', 'ㅜㅠㅡㅣ', 'ㅐㅔㅒㅖ', 'ㅘㅙㅚㅝ'
            ],
            words: [
                '가나다', '마바사', '아자차', '카타파', '하가나', '다라마',
                '바나나', '사과', '포도', '수박', '딸기', '참외',
                '토마토', '감자', '고구마', '당근', '양파', '마늘',
                '배추', '무', '오이', '호박', '가지', '파프리카',
                '브로콜리', '양배추', '시금치', '상추', '깻잎', '부추'
            ]
        },
        special: {
            numbers: [
                '1234567890', '2024년 1월 1일', '전화번호: 010-1234-5678', '주민번호: 000000-0000000', '우편번호: 12345',
                '2025년 1월 6일', '2023년 12월 31일', '1999년 9월 9일', '2000년 1월 1일', '2030년 3월 3일',
                '123-456-789', '987-654-321', '111-222-333', '444-555-666', '777-888-999',
                '100,000원', '250,000원', '1,000,000원', '50,000원', '750,000원',
                '3.14159', '2.71828', '1.41421', '1.61803', '0.57721',
                '02-1234-5678', '031-987-6543', '032-111-2222', '033-444-5555', '051-777-8888'
            ],
            symbols: [
                '!@#$%^&*()', '[]{}()<>', '+-*/=', '.,;:\'"', '?!~`|\\',
                '!!!@@@###', '$$$%%%^^^', '&&&***(((', ')))___+++', '===---...',
                '<html></html>', '[array]', '{object}', '(function)', '/*comment*/',
                'a->b', 'x=>y', 'p<q', 'm>n', 'i<=j', 'k>=l',
                'A&&B', 'C||D', '!E', '~F', 'G!=H', 'I==J',
                '...', '---', '___', '***', '+++', '///', '\\\\\\', '|||'
            ],
            mixed: [
                'abc123!@#', '2024-01-01', 'email@test.com', 'http://www.example.com', 'password123!',
                'user@domain.co.kr', 'admin@company.net', 'info@service.org', 'support@help.io', 'contact@business.com',
                'https://www.google.com', 'http://localhost:3000', 'ftp://files.server.net', 'ssh://user@192.168.1.1', 'git@github.com:user/repo.git',
                'P@ssw0rd!', 'Str0ng#Pass', 'S3cur3*Key', 'C0mpl3x&Pwd', 'H@rd2Gu3ss',
                'file_name_01.txt', 'document-v2.pdf', 'image.2024.jpg', 'data_backup_20250106.zip', 'report_final_v3.docx',
                'var x = 10;', 'const PI = 3.14;', 'function add(a, b) { return a + b; }', 'if (x > 0) { console.log(x); }', 'for (let i = 0; i < 10; i++)'
            ],
            chunjiin: [
                'ㅣ.ㅡ', 'ㅣ..', '...', 'ㅡ.ㅣ', 'ㅣ.ㅣ',
                '..ㅡ', 'ㅡ..', 'ㅣㅡ.', '.ㅣㅡ', 'ㅡㅣ.',
                'ㅣㅣ.', '..ㅣ', 'ㅡㅡ.', '...ㅣ', 'ㅣ...',
                '.ㅡ.', 'ㅣ.ㅡㅣ', 'ㅡ.ㅣ.', '..ㅡㅣ', 'ㅣㅡ..'
            ]
        },
        standard: {
            words: {
                easy: [
                    '안녕하세요', '감사합니다', '사랑합니다', '행복하세요', '좋은하루', '반갑습니다', '축하합니다', '고맙습니다', '미안합니다', '괜찮습니다',
                    '안녕히계세요', '안녕히가세요', '잘가요', '또만나요', '다음에봐요', '내일봐요', '주말잘보내세요', '수고하세요', '화이팅', '힘내세요',
                    '좋아요', '싫어요', '맞아요', '틀려요', '알겠어요', '몰라요', '그래요', '아니에요', '네', '아니요',
                    '어서오세요', '환영합니다', '들어오세요', '앉으세요', '기다려주세요', '잠시만요', '실례합니다', '죄송합니다', '괜찮아요', '천만에요',
                    '맛있어요', '배고파요', '목말라요', '졸려요', '피곤해요', '아파요', '기뻐요', '슬퍼요', '화나요', '무서워요',
                    '더워요', '추워요', '시원해요', '따뜻해요', '좋은날씨네요', '비가와요', '눈이와요', '바람불어요', '햇빛이좋아요', '구름이많아요',
                    '월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일', '주말', '평일', '휴일',
                    '아침', '점심', '저녁', '밤', '새벽', '오전', '오후', '낮', '밤늦게', '일찍',
                    '학교', '회사', '집', '가게', '시장', '병원', '은행', '우체국', '도서관', '공원',
                    '엄마', '아빠', '형', '누나', '동생', '할머니', '할아버지', '친구', '선생님', '학생'
                ],
                medium: [
                    'computer', 'internet', 'smartphone', 'programming', 'algorithm', 'database', 'network', 'cloud', 'software', 'hardware',
                    'operating system', 'application', 'browser', 'search engine', 'social media', 'e-commerce', 'online shopping', 'digital content', 'cybersecurity', 'encryption',
                    'artificial intelligence', 'machine learning', 'deep learning', 'natural language', 'computer vision', 'robotics', 'automation', 'virtual reality', 'augmented reality', 'metaverse',
                    'blockchain', 'cryptocurrency', 'bitcoin', 'ethereum', 'smart contract', 'decentralization', 'distributed ledger', 'digital asset', 'fintech', 'innovation',
                    'internet of things', 'smart home', 'wearable device', 'sensor network', 'big data', 'data analysis', 'data science', 'statistics', 'prediction model', 'visualization',
                    'cloud computing', 'serverless', 'microservices', 'container', 'docker', 'kubernetes', 'infrastructure', 'virtualization', 'scalability', 'reliability',
                    'information security', 'firewall', 'authentication', 'authorization', 'access control', 'vulnerability', 'penetration testing', 'incident response', 'compliance', 'privacy',
                    'mobile app', 'responsive web', 'frontend', 'backend', 'full stack', 'API', 'REST', 'GraphQL', 'web service', 'deployment',
                    'javascript', 'python', 'java', 'typescript', 'swift', 'kotlin', 'rust', 'golang', 'ruby', 'PHP',
                    'react', 'angular', 'vue', 'svelte', 'next', 'express', 'django', 'spring', 'flask', 'rails'
                ],
                hard: [
                    'information technology infrastructure', 'artificial intelligence ethics', 'machine learning algorithms', 'blockchain technology applications', 'internet of things ecosystem',
                    'quantum computing principles', 'neural network architectures', 'genetic algorithm optimization', 'reinforcement learning strategies', 'transfer learning techniques',
                    'edge computing paradigm', 'fog computing infrastructure', 'serverless architecture patterns', 'microservices communication', 'event-driven architecture',
                    'zero trust security model', 'multi-factor authentication systems', 'biometric authentication methods', 'homomorphic encryption', 'quantum cryptography',
                    'natural language understanding', 'speech recognition technology', 'computer vision processing', 'emotion recognition systems', 'recommendation algorithms',
                    'fifth generation networks', 'software defined networking', 'network function virtualization', 'network slicing technology', 'ultra-low latency communication',
                    'smart city infrastructure', 'autonomous vehicle systems', 'drone delivery services', 'digital healthcare platforms', 'telemedicine applications',
                    'sustainable information technology', 'green computing initiatives', 'carbon neutral datacenters', 'renewable energy integration', 'circular economy models',
                    'cross-platform development frameworks', 'progressive web applications', 'webassembly performance optimization', 'jamstack architecture benefits', 'headless content management',
                    'kubernetes orchestration platforms', 'service mesh architectures', 'gitops workflow automation', 'infrastructure as code practices', 'cloud native applications'
                ]
            },
            sentences: {
                easy: [
                    'The weather is really nice today.',
                    'I want to eat something delicious.',
                    'I will meet my friends this weekend.',
                    'I started reading a new book.',
                    'I am exercising regularly these days.',
                    'I woke up early this morning.',
                    'I would like a cup of coffee.',
                    'Have a great day today.',
                    'I want to rest at home today.',
                    'I spent time with my family.',
                    'I prepared a gift for my friend.',
                    'I ate a delicious cake.',
                    'I want to go watch a movie.',
                    'I took a walk while listening to music.',
                    'I started a new hobby.',
                    'Cooking is really fun.',
                    'The flowers bloomed beautifully.',
                    'I want to see the ocean.',
                    'I want to go hiking in the mountains.',
                    'I made a wish while looking at the stars.',
                    'I have a habit of writing in my diary.',
                    'I like taking photographs.',
                    'I am drawing a picture.',
                    'I want to learn to play the piano.',
                    'I started studying a foreign language.',
                    'I am planning a trip.',
                    'I made a new friend.',
                    'I had a good dream.',
                    'It was a happy day.',
                    'Tomorrow will be a better day.'
                ],
                medium: [
                    'Learning programming is a very beneficial endeavor for personal growth.',
                    'The development of the internet has connected the world as one global village.',
                    'Maintaining healthy lifestyle habits is crucial for long-term well-being.',
                    'Learning new technologies is always an exciting and rewarding experience.',
                    'Consistent effort and dedication are the keys to achieving success.',
                    'Information literacy is essential in the digital age we live in.',
                    'Online education is becoming increasingly popular and accessible worldwide.',
                    'Smartphones have become an indispensable part of modern life.',
                    'Social media enables us to communicate with people all around the world.',
                    'Cloud services allow us to access our files from anywhere at any time.',
                    'Artificial intelligence is making our daily lives more convenient and efficient.',
                    'Individual efforts for environmental protection are necessary for our planet.',
                    'Recycling and proper waste separation are small practices that help save the Earth.',
                    'Using public transportation contributes to environmental protection efforts.',
                    'Energy conservation is a task that everyone should practice daily.',
                    'Reading is an excellent way to expand knowledge and develop critical thinking.',
                    'Regular exercise benefits both physical and mental health significantly.',
                    'A balanced diet is fundamental to maintaining a healthy lifestyle.',
                    'Getting enough sleep is important for maintaining vitality in daily life.',
                    'Stress management is an essential skill for modern people to master.',
                    'Positive thinking improves the overall quality of life substantially.',
                    'Setting goals and making plans is the first step toward success.',
                    'Having the courage to challenge yourself without fearing failure is important.',
                    'Various experiences help broaden your perspective on life.',
                    'Having consideration and respect for others is necessary in society.',
                    'Communication skills are fundamental competencies for social life.',
                    'Creative thinking becomes the key to effective problem-solving.',
                    'Continuous learning is the way to adapt to changing times.',
                    'Cooperation and teamwork create greater achievements together.',
                    'Time management is an essential skill for living an efficient life.'
                ],
                hard: [
                    'The rapid advancement of artificial intelligence technology is fundamentally transforming our daily lives in unprecedented ways.',
                    'Sustainable development requires a delicate balance between economic growth and environmental protection.',
                    'The digital revolution has created both opportunities and challenges that require new skills and adaptabilities.',
                    'Global economic uncertainty continues to influence international trade and investment decisions worldwide.',
                    'Innovative ideas have the potential to change the world when combined with determination and resources.',
                    'The fourth industrial revolution is fundamentally transforming traditional industry structures and creating entirely new business models.',
                    'Blockchain technology is gaining attention as an innovative solution providing reliability and transparency across various industries.',
                    'International cooperation to address climate change has become more important than ever, requiring active participation from all nations.',
                    'Big data analytics enables businesses to predict consumer behavior patterns and provide customized services effectively.',
                    'The development of Internet of Things technology is accelerating smart city implementation and significantly improving urban infrastructure efficiency.',
                    'The commercialization of quantum computing opens new possibilities for solving complex problems beyond current computational limits.',
                    'Advances in biotechnology are bringing revolutionary changes to disease treatment and prevention, ushering in an era of personalized medicine.',
                    'The commercialization of autonomous vehicles is expected to paradigm shift transportation systems, greatly improving safety and efficiency.',
                    'The advancement and widespread adoption of renewable energy technologies contribute to reducing fossil fuel dependence and building sustainable energy systems.',
                    'Augmented and virtual reality technologies are providing innovative experiences across various fields including education, healthcare, and entertainment.',
                    'The expanding application of nanotechnology is achieving breakthrough performance improvements in medical, electronic, and materials fields.',
                    'The importance of cybersecurity is increasing daily, with active technology development for protecting personal information and digital assets.',
                    'Space exploration technology advancement is expanding humanitys activity beyond Earth, opening possibilities for new resource development.',
                    'Robot technology and automation system development are revolutionizing manufacturing productivity while bringing significant changes to labor markets.',
                    'The commercialization of 5G networks enables ultra-high-speed, ultra-low-latency communication, forming the foundation for various innovative services.',
                    'Digital twin technology connects the physical and digital worlds, enabling efficient simulation and optimization processes.',
                    'Edge computing development allows data processing closer to users, significantly improving response times.',
                    'Synthetic biology advances provide innovative methods for producing new materials and fuels, contributing to sustainable industrial development.',
                    'The introduction of digital currencies and central bank digital currencies is expected to greatly improve financial system efficiency and inclusivity.',
                    'Metaverse platform development enables economic activities and social interactions in virtual worlds, creating new business opportunities.',
                    'Precision medicine advancement enables personalized treatments based on individual genetic characteristics, greatly improving treatment effectiveness.',
                    'Smart grid technology increases power system efficiency and facilitates renewable energy integration for sustainable energy systems.',
                    'Next-generation transportation systems like hyperloop are expected to dramatically reduce inter-city travel times, heralding a transportation revolution.',
                    'Brain-computer interface technology development presents new possibilities for paralyzed patient rehabilitation and human cognitive enhancement.',
                    'The introduction of circular economy models enables sustainable economic growth through efficient resource use and waste reduction.'
                ]
            },
            paragraph: {
                easy: 'Spring has arrived. The warm sunshine is shining down. Flowers are beginning to bloom. People are wearing lighter clothes. Many people are walking in the park.',
                medium: 'Learning to code is not easy. However, your skills will improve with consistent practice. It is important to study a little every day. Try creating various projects. Real experience is the best teacher.',
                hard: 'Modern society is changing rapidly. Technological advancement has completely transformed our way of life. The development of artificial intelligence and robotics threatens many jobs with extinction. However, new opportunities are emerging at the same time. We must adapt to and prepare for these changes.'
            }
        }
    },
    english: {
        free: [
            'Hello',
            'Welcome',
            'Have a nice day',
            'Enjoy your day',
            'Have a great day'
        ],
        beginner: {
            home: [
                'asdf', 'jkl;', 'asdf jkl;', 'fdsa ;lkj', 'asjk',
                'fdsl', 'jfdk', 'slak', 'djfk', 'alsk',
                'fjdk', 'sldk', 'ajdk', 'flsk', 'djsk'
            ],
            consonant: [
                'qwert', 'yuiop', 'asdfg', 'hjkl;', 'zxcvb',
                'nm,./[', 'qaz', 'wsx', 'edc', 'rfv',
                'tgb', 'yhn', 'ujm', 'ik,', 'ol.',
                'p;/', 'aqw', 'sde', 'fr', 'gt'
            ],
            vowel: [
                'aeiou', 'aaa', 'eee', 'iii', 'ooo',
                'uuu', 'ae', 'ei', 'io', 'ou',
                'ua', 'ea', 'ie', 'oi', 'ue',
                'ai', 'eo', 'iu', 'oa', 'eu'
            ],
            words: [
                'cat', 'dog', 'run', 'jump', 'happy', 'smile',
                'tree', 'bird', 'sun', 'moon', 'star', 'cloud',
                'book', 'read', 'write', 'learn', 'teach', 'study',
                'home', 'work', 'play', 'rest', 'sleep', 'wake',
                'food', 'eat', 'drink', 'water', 'bread', 'fruit'
            ]
        },
        special: {
            numbers: [
                '1234567890', '2024-01-01', 'Phone: 555-1234', 'ID: ABC-123-XYZ', 'ZIP: 12345',
                '2025/01/06', '12/31/2023', '09/09/1999', '01/01/2000', '03/03/2030',
                '123-456-789', '987-654-321', '111-222-333', '444-555-666', '777-888-999',
                '$100,000', '$250,000', '$1,000,000', '$50,000', '$750,000',
                '3.14159', '2.71828', '1.41421', '1.61803', '0.57721',
                '(555) 123-4567', '(555) 987-6543', '(555) 111-2222', '(555) 444-5555', '(555) 777-8888'
            ],
            symbols: [
                '!@#$%^&*()', '[]{}()<>', '+-*/=', '.,;:\'"', '?!~`|\\',
                '!!!@@@###', '$$$%%%^^^', '&&&***(((', ')))___+++', '===---...',
                '<html></html>', '[array]', '{object}', '(function)', '/*comment*/',
                'a->b', 'x=>y', 'p<q', 'm>n', 'i<=j', 'k>=l',
                'A&&B', 'C||D', '!E', '~F', 'G!=H', 'I==J',
                '...', '---', '___', '***', '+++', '///', '\\\\\\', '|||'
            ],
            mixed: [
                'abc123!@#', '2024-01-01', 'email@test.com', 'http://www.example.com', 'password123!',
                'user@domain.com', 'admin@company.net', 'info@service.org', 'support@help.io', 'contact@business.com',
                'https://www.google.com', 'http://localhost:3000', 'ftp://files.server.net', 'ssh://user@192.168.1.1', 'git@github.com:user/repo.git',
                'P@ssw0rd!', 'Str0ng#Pass', 'S3cur3*Key', 'C0mpl3x&Pwd', 'H@rd2Gu3ss',
                'file_name_01.txt', 'document-v2.pdf', 'image.2024.jpg', 'data_backup_20250106.zip', 'report_final_v3.docx',
                'var x = 10;', 'const PI = 3.14;', 'function add(a, b) { return a + b; }', 'if (x > 0) { console.log(x); }', 'for (let i = 0; i < 10; i++)'
            ],
            chunjiin: [
                'abc', 'def', 'ghi', 'jkl', 'mno',
                'pqrs', 'tuv', 'wxyz', '123', '456',
                '789', '0', 'quick', 'brown', 'fox',
                'jumps', 'over', 'lazy', 'dog', 'type'
            ]
        },
        standard: {
            words: {
                easy: [
                    'hello', 'thank', 'love', 'happy', 'good', 'nice', 'great', 'beautiful', 'sorry', 'okay',
                    'goodbye', 'welcome', 'please', 'thanks', 'morning', 'evening', 'night', 'today', 'tomorrow', 'yesterday',
                    'like', 'hate', 'right', 'wrong', 'know', 'think', 'yes', 'no', 'maybe', 'sure',
                    'come', 'go', 'sit', 'stand', 'wait', 'excuse', 'pardon', 'fine', 'well', 'better',
                    'hungry', 'thirsty', 'tired', 'sick', 'happy', 'sad', 'angry', 'scared', 'excited', 'bored',
                    'hot', 'cold', 'warm', 'cool', 'sunny', 'rainy', 'snowy', 'windy', 'cloudy', 'clear',
                    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'weekend', 'weekday', 'holiday',
                    'morning', 'afternoon', 'evening', 'night', 'dawn', 'noon', 'midnight', 'early', 'late', 'time',
                    'school', 'office', 'home', 'store', 'market', 'hospital', 'bank', 'library', 'park', 'station',
                    'mother', 'father', 'brother', 'sister', 'family', 'friend', 'teacher', 'student', 'doctor', 'person'
                ],
                medium: [
                    'computer', 'internet', 'smartphone', 'programming', 'algorithm', 'database', 'network', 'cloud', 'software', 'hardware',
                    'operating system', 'application', 'browser', 'search engine', 'social media', 'e-commerce', 'online shopping', 'digital content', 'cybersecurity', 'encryption',
                    'artificial intelligence', 'machine learning', 'deep learning', 'natural language', 'computer vision', 'robotics', 'automation', 'virtual reality', 'augmented reality', 'metaverse',
                    'blockchain', 'cryptocurrency', 'bitcoin', 'ethereum', 'smart contract', 'decentralization', 'distributed ledger', 'digital asset', 'fintech', 'innovation',
                    'internet of things', 'smart home', 'wearable device', 'sensor network', 'big data', 'data analysis', 'data science', 'statistics', 'prediction model', 'visualization',
                    'cloud computing', 'serverless', 'microservices', 'container', 'docker', 'kubernetes', 'infrastructure', 'virtualization', 'scalability', 'reliability',
                    'information security', 'firewall', 'authentication', 'authorization', 'access control', 'vulnerability', 'penetration testing', 'incident response', 'compliance', 'privacy',
                    'mobile app', 'responsive web', 'frontend', 'backend', 'full stack', 'API', 'REST', 'GraphQL', 'web service', 'deployment',
                    'javascript', 'python', 'java', 'typescript', 'swift', 'kotlin', 'rust', 'golang', 'ruby', 'PHP',
                    'react', 'angular', 'vue', 'svelte', 'next', 'express', 'django', 'spring', 'flask', 'rails'
                ],
                hard: [
                    'information technology infrastructure', 'artificial intelligence ethics', 'machine learning algorithms', 'blockchain technology applications', 'internet of things ecosystem',
                    'quantum computing principles', 'neural network architectures', 'genetic algorithm optimization', 'reinforcement learning strategies', 'transfer learning techniques',
                    'edge computing paradigm', 'fog computing infrastructure', 'serverless architecture patterns', 'microservices communication', 'event-driven architecture',
                    'zero trust security model', 'multi-factor authentication systems', 'biometric authentication methods', 'homomorphic encryption', 'quantum cryptography',
                    'natural language understanding', 'speech recognition technology', 'computer vision processing', 'emotion recognition systems', 'recommendation algorithms',
                    'fifth generation networks', 'software defined networking', 'network function virtualization', 'network slicing technology', 'ultra-low latency communication',
                    'smart city infrastructure', 'autonomous vehicle systems', 'drone delivery services', 'digital healthcare platforms', 'telemedicine applications',
                    'sustainable information technology', 'green computing initiatives', 'carbon neutral datacenters', 'renewable energy integration', 'circular economy models',
                    'cross-platform development frameworks', 'progressive web applications', 'webassembly performance optimization', 'jamstack architecture benefits', 'headless content management',
                    'kubernetes orchestration platforms', 'service mesh architectures', 'gitops workflow automation', 'infrastructure as code practices', 'cloud native applications'
                ]
            },
            sentences: {
                easy: [
                    'The weather is really nice today.',
                    'I want to eat something delicious.',
                    'I will meet my friends this weekend.',
                    'I started reading a new book.',
                    'I am exercising regularly these days.',
                    'I woke up early this morning.',
                    'I would like a cup of coffee.',
                    'Have a great day today.',
                    'I want to rest at home today.',
                    'I spent time with my family.',
                    'I prepared a gift for my friend.',
                    'I ate a delicious cake.',
                    'I want to go watch a movie.',
                    'I took a walk while listening to music.',
                    'I started a new hobby.',
                    'Cooking is really fun.',
                    'The flowers bloomed beautifully.',
                    'I want to see the ocean.',
                    'I want to go hiking in the mountains.',
                    'I made a wish while looking at the stars.',
                    'I have a habit of writing in my diary.',
                    'I like taking photographs.',
                    'I am drawing a picture.',
                    'I want to learn to play the piano.',
                    'I started studying a foreign language.',
                    'I am planning a trip.',
                    'I made a new friend.',
                    'I had a good dream.',
                    'It was a happy day.',
                    'Tomorrow will be a better day.'
                ],
                medium: [
                    'Learning programming is a very beneficial endeavor for personal growth.',
                    'The development of the internet has connected the world as one global village.',
                    'Maintaining healthy lifestyle habits is crucial for long-term well-being.',
                    'Learning new technologies is always an exciting and rewarding experience.',
                    'Consistent effort and dedication are the keys to achieving success.',
                    'Information literacy is essential in the digital age we live in.',
                    'Online education is becoming increasingly popular and accessible worldwide.',
                    'Smartphones have become an indispensable part of modern life.',
                    'Social media enables us to communicate with people all around the world.',
                    'Cloud services allow us to access our files from anywhere at any time.',
                    'Artificial intelligence is making our daily lives more convenient and efficient.',
                    'Individual efforts for environmental protection are necessary for our planet.',
                    'Recycling and proper waste separation are small practices that help save the Earth.',
                    'Using public transportation contributes to environmental protection efforts.',
                    'Energy conservation is a task that everyone should practice daily.',
                    'Reading is an excellent way to expand knowledge and develop critical thinking.',
                    'Regular exercise benefits both physical and mental health significantly.',
                    'A balanced diet is fundamental to maintaining a healthy lifestyle.',
                    'Getting enough sleep is important for maintaining vitality in daily life.',
                    'Stress management is an essential skill for modern people to master.',
                    'Positive thinking improves the overall quality of life substantially.',
                    'Setting goals and making plans is the first step toward success.',
                    'Having the courage to challenge yourself without fearing failure is important.',
                    'Various experiences help broaden your perspective on life.',
                    'Having consideration and respect for others is necessary in society.',
                    'Communication skills are fundamental competencies for social life.',
                    'Creative thinking becomes the key to effective problem-solving.',
                    'Continuous learning is the way to adapt to changing times.',
                    'Cooperation and teamwork create greater achievements together.',
                    'Time management is an essential skill for living an efficient life.'
                ],
                hard: [
                    'The rapid advancement of artificial intelligence technology is fundamentally transforming our daily lives in unprecedented ways.',
                    'Sustainable development requires a delicate balance between economic growth and environmental protection.',
                    'The digital revolution has created both opportunities and challenges that require new skills and adaptabilities.',
                    'Global economic uncertainty continues to influence international trade and investment decisions worldwide.',
                    'Innovative ideas have the potential to change the world when combined with determination and resources.',
                    'The fourth industrial revolution is fundamentally transforming traditional industry structures and creating entirely new business models.',
                    'Blockchain technology is gaining attention as an innovative solution providing reliability and transparency across various industries.',
                    'International cooperation to address climate change has become more important than ever, requiring active participation from all nations.',
                    'Big data analytics enables businesses to predict consumer behavior patterns and provide customized services effectively.',
                    'The development of Internet of Things technology is accelerating smart city implementation and significantly improving urban infrastructure efficiency.',
                    'The commercialization of quantum computing opens new possibilities for solving complex problems beyond current computational limits.',
                    'Advances in biotechnology are bringing revolutionary changes to disease treatment and prevention, ushering in an era of personalized medicine.',
                    'The commercialization of autonomous vehicles is expected to paradigm shift transportation systems, greatly improving safety and efficiency.',
                    'The advancement and widespread adoption of renewable energy technologies contribute to reducing fossil fuel dependence and building sustainable energy systems.',
                    'Augmented and virtual reality technologies are providing innovative experiences across various fields including education, healthcare, and entertainment.',
                    'The expanding application of nanotechnology is achieving breakthrough performance improvements in medical, electronic, and materials fields.',
                    'The importance of cybersecurity is increasing daily, with active technology development for protecting personal information and digital assets.',
                    'Space exploration technology advancement is expanding humanitys activity beyond Earth, opening possibilities for new resource development.',
                    'Robot technology and automation system development are revolutionizing manufacturing productivity while bringing significant changes to labor markets.',
                    'The commercialization of 5G networks enables ultra-high-speed, ultra-low-latency communication, forming the foundation for various innovative services.',
                    'Digital twin technology connects the physical and digital worlds, enabling efficient simulation and optimization processes.',
                    'Edge computing development allows data processing closer to users, significantly improving response times.',
                    'Synthetic biology advances provide innovative methods for producing new materials and fuels, contributing to sustainable industrial development.',
                    'The introduction of digital currencies and central bank digital currencies is expected to greatly improve financial system efficiency and inclusivity.',
                    'Metaverse platform development enables economic activities and social interactions in virtual worlds, creating new business opportunities.',
                    'Precision medicine advancement enables personalized treatments based on individual genetic characteristics, greatly improving treatment effectiveness.',
                    'Smart grid technology increases power system efficiency and facilitates renewable energy integration for sustainable energy systems.',
                    'Next-generation transportation systems like hyperloop are expected to dramatically reduce inter-city travel times, heralding a transportation revolution.',
                    'Brain-computer interface technology development presents new possibilities for paralyzed patient rehabilitation and human cognitive enhancement.',
                    'The introduction of circular economy models enables sustainable economic growth through efficient resource use and waste reduction.'
                ]
            },
            paragraph: {
                easy: 'Spring has arrived. The warm sunshine is shining down. Flowers are beginning to bloom. People are wearing lighter clothes. Many people are walking in the park.',
                medium: 'Learning to code is not easy. However, your skills will improve with consistent practice. It is important to study a little every day. Try creating various projects. Real experience is the best teacher.',
                hard: 'Modern society is changing rapidly. Technological advancement has completely transformed our way of life. The development of artificial intelligence and robotics threatens many jobs with extinction. However, new opportunities are emerging at the same time. We must adapt to and prepare for these changes.'
            }
        }
    }
};