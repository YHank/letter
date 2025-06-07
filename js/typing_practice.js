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
        if (!typingPracticeState.startTime) return;
        
        const now = Date.now();
        const elapsed = now - typingPracticeState.startTime;
        const remaining = typingPracticeState.endTime - now;
        
        // 남은 시간이 0 이하면 연습 종료
        if (remaining <= 0 && typingPracticeState.isTyping) {
            // 타이머가 종료되었을 때 입력 비활성화
            const currentMode = typingPracticeState.currentMode;
            if (currentMode) {
                const input = document.getElementById(`${currentMode}-typing-input`);
                if (input) input.disabled = true;
            }
            completePractice();
            return;
        }
        
        // 경과 시간 표시
        const elapsedMinutes = Math.floor(elapsed / 60000);
        const elapsedSeconds = Math.floor((elapsed % 60000) / 1000);
        const timeEl = document.getElementById('time');
        if (timeEl) timeEl.textContent = `${elapsedMinutes}:${elapsedSeconds.toString().padStart(2, '0')}`;
        
        // 남은 시간 표시
        const remainingMinutes = Math.floor(remaining / 60000);
        const remainingSeconds = Math.floor((remaining % 60000) / 1000);
        
        // 시간 진행률 계산 및 프로그레스 바 업데이트
        const totalDuration = typingConfig.defaultDuration;
        const progressPercentage = ((totalDuration - remaining) / totalDuration) * 100;
        const timeProgressBar = document.getElementById('time-progress-bar');
        if (timeProgressBar) {
            timeProgressBar.style.width = (100 - progressPercentage) + '%';
        }
        const remainingEl = document.getElementById('remaining-time');
        if (remainingEl) {
            remainingEl.textContent = `남은 시간: ${remainingMinutes}:${remainingSeconds.toString().padStart(2, '0')}`;
            // 1분 미만일 때 빨간색으로 표시
            if (remaining < 60000) {
                remainingEl.classList.add('text-danger');
            } else {
                remainingEl.classList.remove('text-danger');
            }
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
    // 새로운 시스템으로 리다이렉트
    initializeTypingPracticeNew();
}

// 연습 데이터 관리 (코드 중복 제거를 위해 외부로 분리)
const practiceTexts = {
    korean: {
        free: [
            '오늘 하루도 열심히 타자 연습을 하며 실력을 향상시켜 보세요.',
            '꾸준한 연습이 타자 실력 향상의 지름길입니다.',
            '정확한 자세와 손가락 위치가 빠른 타자의 기본입니다.',
            '매일 조금씩 연습하면 놀라운 발전을 경험할 수 있습니다.',
            '타자 연습은 집중력과 인내심을 기르는 좋은 방법입니다.',
            '빠르고 정확한 타자 실력은 현대 사회의 필수 능력입니다.',
            '처음에는 천천히, 정확하게 입력하는 것이 중요합니다.',
            '실수를 두려워하지 말고 꾸준히 연습하세요.',
            '타자 속도보다 정확도를 먼저 높이는 것이 좋습니다.',
            '편안한 자세로 연습하면 더 오래 집중할 수 있습니다.',
            '키보드를 보지 않고 타이핑하는 것이 목표입니다.',
            '각 손가락이 담당하는 키를 정확히 익히세요.',
            '타자 연습을 통해 업무 효율성을 높일 수 있습니다.',
            '규칙적인 연습 시간을 정해두면 더 효과적입니다.',
            '다양한 문장을 연습하면 실전에 도움이 됩니다.',
            '타자 연습은 두뇌 활동을 활발하게 만들어줍니다.',
            '목표를 설정하고 달성하는 기쁨을 느껴보세요.',
            '친구나 가족과 함께 타자 실력을 겨뤄보는 것도 재미있습니다.',
            '타자 연습을 게임처럼 즐기면 더욱 재미있게 할 수 있습니다.',
            '매일 5분씩만 투자해도 큰 변화를 만들 수 있습니다.',
            '한글 타자와 영문 타자를 균형있게 연습하세요.',
            '특수문자와 숫자 입력도 중요한 타자 실력입니다.',
            '타자 연습은 평생 유용한 기술을 익히는 과정입니다.',
            '실수할 때마다 배우고 성장하는 기회로 삼으세요.',
            '타자 속도가 늘면 생각의 속도도 따라 빨라집니다.',
            '정확한 타이핑은 의사소통의 품질을 높여줍니다.',
            '타자 연습을 통해 디지털 문해력을 향상시킬 수 있습니다.',
            '손목과 손가락 스트레칭으로 부상을 예방하세요.',
            '타자 연습 후에는 충분한 휴식을 취하는 것이 중요합니다.',
            '개인 최고 기록을 갱신할 때마다 성취감을 느낄 수 있습니다.',
            // 세계 명언
            '천 리 길도 한 걸음부터 시작된다.',
            '실패는 성공의 어머니이다.',
            '오늘 할 일을 내일로 미루지 마라.',
            '시작이 반이다.',
            '뿌린 대로 거둔다.',
            '고생 끝에 낙이 온다.',
            '백지장도 맞들면 낫다.',
            '가는 말이 고와야 오는 말이 곱다.',
            '금강산도 식후경이다.',
            '우물 안 개구리는 바다를 모른다.',
            '낮말은 새가 듣고 밤말은 쥐가 듣는다.',
            '세 살 버릇 여든까지 간다.',
            '호랑이도 제 말하면 온다.',
            '누워서 침 뱉기다.',
            '소 잃고 외양간 고친다.',
            '등잔 밑이 어둡다.',
            '빈 수레가 요란하다.',
            '바늘 도둑이 소 도둑 된다.',
            '개천에서 용 난다.',
            '구슬이 서 말이라도 꿰어야 보배다.',
            '꿩 먹고 알 먹는다.',
            '남의 떡이 커 보인다.',
            '될성부른 나무는 떡잎부터 알아본다.',
            '돌다리도 두들겨보고 건너라.',
            '마른 하늘에 날벼락이다.',
            '물은 위에서 아래로 흐른다.',
            '믿는 도끼에 발등 찍힌다.',
            '밑 빠진 독에 물 붓기다.',
            '발 없는 말이 천 리 간다.',
            '백문이 불여일견이다.',
            '벼는 익을수록 고개를 숙인다.',
            '비 온 뒤에 땅이 굳어진다.',
            '사공이 많으면 배가 산으로 간다.',
            '새 발의 피다.',
            '서당 개 삼 년이면 풍월을 읊는다.',
            '세 치 혀가 사람을 살리기도 하고 죽이기도 한다.',
            '시간은 금이다.',
            '십 년이면 강산도 변한다.',
            '아니 땐 굴뚝에 연기 날까.',
            '암탉이 울면 집안이 망한다.',
            '약방에 감초다.',
            '언 발에 오줌 누기다.',
            '열 번 찍어 안 넘어가는 나무 없다.',
            '오르지 못할 나무는 쳐다보지도 마라.',
            '옷이 날개다.',
            '원숭이도 나무에서 떨어진다.',
            '윗물이 맑아야 아랫물이 맑다.',
            '이왕이면 다홍치마다.',
            '작은 고추가 맵다.',
            '재주는 곰이 넘고 돈은 주인이 번다.',
            '쥐구멍에도 볕들 날이 있다.',
            '지렁이도 밟으면 꿈틀한다.',
            '짚신도 짝이 있다.',
            '참을 인 자 세 번이면 살인도 면한다.',
            '천 리 길도 한 걸음부터다.',
            '콩 심은 데 콩 나고 팥 심은 데 팥 난다.',
            '티끌 모아 태산이다.',
            '하늘이 무너져도 솟아날 구멍이 있다.',
            '한 우물만 파라.',
            '호미로 막을 것을 가래로 막는다.',
            '황소 뒷걸음질 치다가 쥐 잡는다.',
            // 서양 명언
            '아는 것이 힘이다. - 프랜시스 베이컨',
            '나는 생각한다, 고로 존재한다. - 데카르트',
            '인생은 짧고 예술은 길다. - 히포크라테스',
            '그대 자신을 알라. - 소크라테스',
            '행복은 습관이다. 그것을 몸에 지니라. - 허버드',
            '삶이 있는 한 희망은 있다. - 키케로',
            '말은 쉽고 행동은 어렵다. - 독일 속담',
            '시간은 돈이다. - 벤저민 프랭클린',
            '지식은 힘이다. - 프랜시스 베이컨',
            '건강한 신체에 건강한 정신이 깃든다. - 유베날리스',
            '로마는 하루아침에 이루어지지 않았다. - 영국 속담',
            '연습이 완벽을 만든다. - 영국 속담',
            '일찍 일어나는 새가 벌레를 잡는다. - 영국 속담',
            '웃음은 최고의 명약이다. - 영국 속담',
            '행동은 말보다 더 크게 말한다. - 영국 속담',
            '필요는 발명의 어머니다. - 플라톤',
            '친구는 제2의 자신이다. - 아리스토텔레스',
            '인내는 쓰지만 그 열매는 달다. - 아리스토텔레스',
            '젊음은 다시 돌아오지 않는다. - 서양 속담',
            '기회는 준비된 자에게 온다. - 파스퇴르',
            '천재는 1%의 영감과 99%의 노력이다. - 에디슨',
            '실패는 성공으로 가는 길이다. - 에디슨',
            '꿈을 꾸고 있다면 그것을 이룰 수도 있다. - 월트 디즈니',
            '미래는 꿈의 아름다움을 믿는 자의 것이다. - 루스벨트',
            '위대한 일을 이루려면 행동하는 것뿐만 아니라 꿈꾸는 것도 필요하다. - 아나톨 프랑스',
            '인생에서 가장 큰 영광은 넘어지지 않는 것이 아니라 넘어질 때마다 일어서는 것이다. - 넬슨 만델라',
            '성공은 열정을 잃지 않고 실패를 거듭할 수 있는 능력이다. - 처칠',
            '어제는 역사, 내일은 미스터리, 오늘은 선물이다. - 엘리너 루스벨트',
            '변화는 삶의 법칙이다. - 케네디',
            '용기는 두려움이 없는 것이 아니라 두려움을 극복하는 것이다. - 넬슨 만델라',
            '상상력은 지식보다 중요하다. - 아인슈타인',
            '인생은 자전거를 타는 것과 같다. 균형을 잡으려면 계속 움직여야 한다. - 아인슈타인',
            '가장 어려운 일은 행동하기로 결정하는 것이다. - 아멜리아 에어하트',
            '성공의 비결은 목적을 향해 꾸준히 나아가는 것이다. - 디즈레일리',
            '할 수 있다고 믿는 사람은 결국 그렇게 된다. - 버질',
            '오늘 할 수 있는 일을 내일로 미루지 마라. - 벤저민 프랭클린',
            '작은 일에도 최선을 다하라. 작은 일이 모여 큰 일을 이룬다. - 달라이 라마',
            '행복은 이미 만들어진 것이 아니라 당신의 행동에서 나온다. - 달라이 라마',
            '성공은 최종적인 것이 아니며, 실패는 치명적인 것이 아니다. - 처칠',
            '당신이 원하는 변화가 되어라. - 간디',
            '평화는 힘으로 유지될 수 없다. 오직 이해를 통해서만 가능하다. - 아인슈타인',
            '교육은 인생을 위한 준비가 아니라 인생 그 자체다. - 존 듀이',
            '가장 큰 위험은 아무런 위험도 감수하지 않는 것이다. - 마크 저커버그',
            '시작하기 위해 위대해질 필요는 없다. 그러나 위대해지려면 시작해야 한다. - 지그 지글러',
            '모든 성취의 출발점은 열망이다. - 나폴레온 힐',
            '당신의 시간은 한정되어 있다. 다른 사람의 삶을 사느라 낭비하지 마라. - 스티브 잡스',
            '혁신은 리더와 추종자를 구분하는 것이다. - 스티브 잡스',
            '품질은 우연이 아니다. 언제나 지적인 노력의 결과다. - 존 러스킨',
            '성공은 준비와 기회가 만나는 지점이다. - 보비 언서',
            '미래를 예측하는 최선의 방법은 그것을 창조하는 것이다. - 피터 드러커',
            '리더십은 지위가 아니라 행동이다. - 도널드 맥개넌',
            '실수하는 것을 두려워하지 마라. 그것은 성장의 일부다. - 마이클 조던',
            '목표를 세우고 그것을 이루기 위해 노력하라. - 짐 론',
            '성공은 노력의 결과이며, 노력은 태도의 결과다. - 월터 스콧',
            '인생은 10%가 당신에게 일어나는 일이고 90%는 그것에 어떻게 반응하느냐다. - 찰스 스윈돌',
            '위대한 일을 하는 유일한 방법은 당신이 하는 일을 사랑하는 것이다. - 스티브 잡스',
            '실패를 받아들일 수는 있지만 시도하지 않는 것은 받아들일 수 없다. - 마이클 조던',
            '당신이 할 수 있다고 생각하든 할 수 없다고 생각하든 당신이 옳다. - 헨리 포드',
            '성공한 사람이 되려고 하지 말고 가치 있는 사람이 되려고 하라. - 아인슈타인',
            '인생의 목적은 행복이 아니라 의미 있는 삶을 사는 것이다. - 헬렌 켈러',
            '가장 중요한 것은 포기하지 않는 것이다. - 스티븐 호킹',
            '어둠은 어둠을 몰아낼 수 없다. 오직 빛만이 그것을 할 수 있다. - 마틴 루터 킹',
            '우리가 두려워해야 할 유일한 것은 두려움 그 자체다. - 루스벨트',
            '행복은 목적지가 아니라 여행하는 방법이다. - 마거릿 리 런베크',
            '성공은 종종 실패가 불가피하다는 것을 모르는 사람들에 의해 달성된다. - 코코 샤넬',
            '당신의 믿음이 당신의 생각이 되고, 생각은 말이 되고, 말은 행동이 되고, 행동은 습관이 되고, 습관은 운명이 된다. - 간디',
            '가장 현명한 사람은 자신이 아무것도 모른다는 것을 아는 사람이다. - 소크라테스',
            '인생은 당신이 다른 계획을 세우느라 바쁠 때 일어나는 일이다. - 존 레논',
            '진정한 지식은 자신이 무지하다는 것을 아는 것이다. - 소크라테스',
            '행복해지기로 결심하는 순간 행복해진다. - 링컨'
        ]
    },
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
            'var x = 10;', 'const PI = 3.14;', 'function add(a, b) { return a + b; }', 'if (x > 0) { console.log(x); }', 'for (let i = 0; i < 10; i++)']
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
                '대한민국', '컴퓨터', '인터넷', '스마트폰', '프로그래밍', '코딩테스트', '알고리즘', '데이터베이스', '네트워크', '클라우드',
                '소프트웨어', '하드웨어', '운영체제', '애플리케이션', '웹브라우저', '검색엔진', '소셜미디어', '전자상거래', '온라인쇼핑', '디지털콘텐츠',
                '인공지능', '기계학습', '딥러닝', '자연어처리', '컴퓨터비전', '로봇공학', '자율주행', '가상현실', '증강현실', '메타버스',
                '블록체인', '암호화폐', '비트코인', '이더리움', 'NFT', '스마트계약', '탈중앙화', '분산원장', '디지털자산', '핀테크',
                '사물인터넷', '스마트홈', '웨어러블', '센서네트워크', '빅데이터', '데이터분석', '데이터과학', '통계학습', '예측모델', '시각화',
                '클라우드컴퓨팅', '서버리스', '마이크로서비스', '컨테이너', '도커', '쿠버네티스', 'DevOps', 'CI/CD', '인프라', '가상화',
                '사이버보안', '해킹방어', '침입탐지', '방화벽', '암호화', '인증시스템', '접근제어', '보안정책', '취약점분석', '펜테스팅',
                '모바일앱', '반응형웹', '프론트엔드', '백엔드', '풀스택', 'API', 'REST', 'GraphQL', '마이크로프론트엔드', '서버사이드렌더링',
                '자바스크립트', '파이썬', '자바', 'C++', '러스트', '고언어', '타입스크립트', '스위프트', '코틀린', 'PHP',
                '리액트', '뷰', '앵귤러', '스벨트', '넥스트', '익스프레스', '장고', '스프링', '플라스크', '레일즈'
            ],
            hard: [
                '정보통신기술', '인공지능', '머신러닝', '블록체인', '사물인터넷', '빅데이터분석', '클라우드컴퓨팅', '사이버보안', '디지털트랜스포메이션', '메타버스',
                '양자컴퓨팅', '신경망알고리즘', '유전자알고리즘', '강화학습', '전이학습', '연합학습', '적대적생성신경망', '변이형오토인코더', '트랜스포머모델', '어텐션메커니즘',
                '엣지컴퓨팅', '포그컴퓨팅', '서버리스아키텍처', '마이크로서비스아키텍처', '이벤트드리븐아키텍처', '도메인주도설계', '헥사고날아키텍처', '클린아키텍처', 'CQRS패턴', '이벤트소싱',
                'DevSecOps', '제로트러스트보안', '다중요소인증', '생체인증시스템', '블록체인기반인증', '동형암호', '양자암호통신', '차등프라이버시', '연합학습보안', '안전한다자간계산',
                '자연어이해', '음성인식기술', '컴퓨터비전처리', '감정인식AI', '추천시스템알고리즘', '이상탐지시스템', '예측유지보수', '디지털트윈기술', '로보틱프로세스자동화', '하이퍼오토메이션',
                '5G네트워크', '6G차세대통신', '소프트웨어정의네트워크', '네트워크기능가상화', '네트워크슬라이싱', '초저지연통신', '대규모MIMO', '테라헤르츠통신', '위성인터넷', '양자인터넷',
                '스마트시티인프라', '자율주행자동차', '드론배송시스템', '스마트팩토리', '디지털헬스케어', '원격의료시스템', '정밀의료', '바이오인포매틱스', '합성생물학', '나노기술',
                '지속가능한IT', '그린컴퓨팅', '탄소중립데이터센터', '재생에너지활용', '순환경제모델', 'ESG경영전략', '디지털윤리', 'AI윤리가이드라인', '데이터주권', '디지털포용성',
                '크로스플랫폼개발', '하이브리드앱개발', '프로그레시브웹앱', '웹어셈블리', '웹컴포넌트', '마이크로프론트엔드', 'JAMstack아키텍처', '정적사이트생성기', '헤드리스CMS', '엣지사이드렌더링',
                '쿠버네티스오케스트레이션', '서비스메시아키텍처', 'GitOps워크플로우', '인프라스트럭처애즈코드', '컨테이너보안', '클라우드네이티브', '멀티클라우드전략', '하이브리드클라우드', '클라우드마이그레이션', 'FinOps최적화'
            ]
        },
        sentences: {
            easy: [
                '오늘은 날씨가 정말 좋습니다.',
                '맛있는 음식을 먹고 싶어요.',
                '주말에 친구들과 만날 예정입니다.',
                '새로운 책을 읽기 시작했습니다.',
                '운동을 열심히 하고 있습니다.',
                '아침에 일찍 일어났어요.',
                '커피 한 잔 마시고 싶네요.',
                '오늘 하루도 화이팅입니다.',
                '집에서 쉬고 싶은 날이에요.',
                '가족과 함께 시간을 보냈어요.',
                '친구에게 선물을 준비했어요.',
                '맛있는 케이크를 먹었습니다.',
                '영화를 보러 가고 싶어요.',
                '음악을 들으며 산책했어요.',
                '새로운 취미를 시작했습니다.',
                '요리하는 것이 즐거워요.',
                '꽃이 예쁘게 피었네요.',
                '바다를 보고 싶습니다.',
                '산에 등산을 가고 싶어요.',
                '별을 보며 소원을 빌었어요.',
                '일기를 쓰는 습관이 있어요.',
                '사진을 찍는 것을 좋아해요.',
                '그림을 그리고 있습니다.',
                '피아노를 배우고 싶어요.',
                '외국어 공부를 시작했어요.',
                '여행 계획을 세우고 있어요.',
                '새로운 친구를 만났습니다.',
                '좋은 꿈을 꾸었어요.',
                '행복한 하루였습니다.',
                '내일은 더 좋은 날이 될 거예요.'
            ],
            medium: [
                '프로그래밍을 배우는 것은 매우 유익한 일입니다.',
                '인터넷의 발달로 세상이 하나로 연결되었습니다.',
                '건강한 생활습관을 유지하는 것이 중요합니다.',
                '새로운 기술을 배우는 것은 항상 즐겁습니다.',
                '꾸준한 노력이 성공의 열쇠입니다.',
                '디지털 시대에는 정보 활용 능력이 중요합니다.',
                '온라인 교육이 점점 더 활성화되고 있습니다.',
                '스마트폰은 현대인의 필수품이 되었습니다.',
                '소셜 미디어를 통해 전 세계 사람들과 소통할 수 있습니다.',
                '클라우드 서비스로 언제 어디서나 파일에 접근할 수 있습니다.',
                '인공지능이 우리의 일상생활을 편리하게 만들고 있습니다.',
                '환경 보호를 위한 개인의 노력이 필요합니다.',
                '재활용과 분리수거는 지구를 지키는 작은 실천입니다.',
                '대중교통 이용은 환경 보호에 도움이 됩니다.',
                '에너지 절약은 모두가 실천해야 할 과제입니다.',
                '독서는 지식을 넓히고 사고력을 기르는 좋은 방법입니다.',
                '규칙적인 운동은 신체와 정신 건강에 도움이 됩니다.',
                '균형 잡힌 식단은 건강한 삶의 기본입니다.',
                '충분한 수면은 일상생활의 활력을 유지하는 데 중요합니다.',
                '스트레스 관리는 현대인에게 필수적인 능력입니다.',
                '긍정적인 사고는 삶의 질을 향상시킵니다.',
                '목표를 설정하고 계획을 세우는 것이 성공의 첫걸음입니다.',
                '실패를 두려워하지 말고 도전하는 자세가 중요합니다.',
                '다양한 경험을 통해 시야를 넓힐 수 있습니다.',
                '타인을 배려하고 존중하는 마음이 필요합니다.',
                '의사소통 능력은 사회생활의 기본 역량입니다.',
                '창의적인 사고는 문제 해결의 열쇠가 됩니다.',
                '지속적인 학습은 변화하는 시대에 적응하는 방법입니다.',
                '협력과 팀워크는 더 큰 성과를 만들어냅니다.',
                '시간 관리는 효율적인 삶을 위한 필수 기술입니다.'
            ],
            hard: [
                '인공지능 기술의 발전은 우리의 일상생활을 크게 변화시키고 있습니다.',
                '지속가능한 발전을 위해서는 환경보호가 필수적입니다.',
                '디지털 시대에 필요한 역량을 갖추기 위해 노력해야 합니다.',
                '글로벌 경제의 불확실성이 증가하고 있는 상황입니다.',
                '혁신적인 아이디어가 세상을 변화시킬 수 있습니다.',
                '4차 산업혁명은 전통적인 산업 구조를 근본적으로 변화시키고 있으며, 새로운 비즈니스 모델이 등장하고 있습니다.',
                '블록체인 기술은 금융 분야뿐만 아니라 다양한 산업에서 신뢰성과 투명성을 제공하는 혁신적인 솔루션으로 주목받고 있습니다.',
                '기후 변화에 대응하기 위한 국제적인 협력이 그 어느 때보다 중요해지고 있으며, 각국의 적극적인 참여가 요구됩니다.',
                '빅데이터 분석을 통해 소비자의 행동 패턴을 예측하고, 맞춤형 서비스를 제공하는 것이 기업 경쟁력의 핵심이 되고 있습니다.',
                '사물인터넷 기술의 발달로 스마트 시티 구현이 가속화되고 있으며, 도시 인프라의 효율성이 크게 향상되고 있습니다.',
                '양자 컴퓨팅의 상용화는 현재의 컴퓨팅 한계를 뛰어넘어 복잡한 문제를 해결할 수 있는 새로운 가능성을 열어주고 있습니다.',
                '생명공학 기술의 발전은 질병 치료와 예방에 혁명적인 변화를 가져오고 있으며, 맞춤형 의료 시대가 열리고 있습니다.',
                '자율주행 자동차의 상용화는 교통 시스템의 패러다임을 변화시킬 것으로 예상되며, 안전성과 효율성이 크게 개선될 것입니다.',
                '재생 에너지 기술의 발전과 보급 확대는 화석 연료 의존도를 줄이고 지속가능한 에너지 시스템 구축에 기여하고 있습니다.',
                '증강현실과 가상현실 기술은 교육, 의료, 엔터테인먼트 등 다양한 분야에서 혁신적인 경험을 제공하고 있습니다.',
                '나노 기술의 응용 범위가 확대되면서 의료, 전자, 소재 분야에서 획기적인 성능 향상이 이루어지고 있습니다.',
                '사이버 보안의 중요성이 날로 증가하고 있으며, 개인정보 보호와 디지털 자산 보호를 위한 기술 개발이 활발히 진행되고 있습니다.',
                '우주 탐사 기술의 발전으로 인류의 활동 영역이 지구 밖으로 확장되고 있으며, 새로운 자원 개발의 가능성이 열리고 있습니다.',
                '로봇 기술과 자동화 시스템의 발달은 제조업의 생산성을 혁신적으로 향상시키고 있으며, 노동 시장에도 큰 변화를 가져오고 있습니다.',
                '5G 네트워크의 상용화는 초고속, 초저지연 통신을 가능하게 하여 다양한 혁신적인 서비스의 기반이 되고 있습니다.',
                '디지털 트윈 기술은 물리적 세계와 디지털 세계를 연결하여 효율적인 시뮬레이션과 최적화를 가능하게 합니다.',
                '엣지 컴퓨팅의 발달로 데이터 처리가 사용자에게 더 가까운 곳에서 이루어져 응답 속도가 크게 향상되고 있습니다.',
                '합성 생물학의 발전은 새로운 물질과 연료를 생산하는 혁신적인 방법을 제공하며, 지속가능한 산업 발전에 기여하고 있습니다.',
                '디지털 화폐와 중앙은행 디지털 화폐(CBDC)의 도입은 금융 시스템의 효율성과 포용성을 크게 향상시킬 것으로 기대됩니다.',
                '메타버스 플랫폼의 발전은 가상 세계에서의 경제 활동과 사회적 상호작용을 가능하게 하며, 새로운 비즈니스 기회를 창출하고 있습니다.',
                '정밀 의료의 발달로 개인의 유전적 특성에 맞춘 맞춤형 치료가 가능해지고 있으며, 치료 효과가 크게 향상되고 있습니다.',
                '스마트 그리드 기술은 전력 시스템의 효율성을 높이고 재생 에너지의 통합을 용이하게 하여 지속가능한 에너지 시스템 구축에 기여합니다.',
                '하이퍼루프와 같은 차세대 교통 시스템은 도시 간 이동 시간을 획기적으로 단축시킬 것으로 예상되며, 교통 혁명을 예고하고 있습니다.',
                '뇌-컴퓨터 인터페이스 기술의 발전은 마비 환자의 재활과 인간의 인지 능력 향상에 새로운 가능성을 제시하고 있습니다.',
                '순환 경제 모델의 도입은 자원의 효율적 사용과 폐기물 감소를 통해 지속가능한 경제 성장을 가능하게 합니다.',
                '디지털 휴먼 기술의 발달로 가상 인플루언서와 디지털 아바타가 다양한 분야에서 활용되며 새로운 커뮤니케이션 방식을 제공하고 있습니다.',
                '수소 경제의 구축은 청정 에너지원으로서의 수소 활용을 통해 탄소 중립 목표 달성에 중요한 역할을 할 것으로 기대됩니다.',
                '스마트 팩토리의 구현은 제조업의 디지털 전환을 가속화하고 있으며, 생산 효율성과 품질 관리 수준을 크게 향상시키고 있습니다.',
                '바이오 프린팅 기술의 발전은 인공 장기 제작을 가능하게 하여 장기 이식 대기 문제 해결에 희망을 주고 있습니다.'
            ]
        },
        paragraph: {
            easy: '봄이 왔습니다. 따뜻한 햇살이 내리쫄고 있습니다. 꽃들이 피어나기 시작했습니다. 사람들의 옷차림도 가벼워졌습니다. 공원에는 산책하는 사람들이 많습니다.',
            medium: '코딩을 배우는 것은 쉽지 않습니다. 하지만 꾸준히 연습하면 실력이 향상됩니다. 매일 조금씩 공부하는 것이 중요합니다. 다양한 프로젝트를 만들어보세요. 실전 경험이 가장 좋은 스승입니다.',
            hard: '현대 사회는 급속도로 변화하고 있습니다. 기술의 발전은 우리의 생활 방식을 완전히 바꾸어 놓았습니다. 인공지능과 로봇 기술의 발달로 많은 직업이 사라질 위기에 처해 있습니다. 하지만 동시에 새로운 기회도 생겨나고 있습니다. 우리는 이러한 변화에 적응하고 준비해야 합니다.'
        }
    },
    english: {
        free: [
            'The only way to do great work is to love what you do.',
            'Innovation distinguishes between a leader and a follower.',
            'Stay hungry, stay foolish.',
            'Your time is limited, don\'t waste it living someone else\'s life.',
            'Design is not just what it looks like and feels like. Design is how it works.',
            'Being the richest man in the cemetery doesn\'t matter to me.',
            'Have the courage to follow your heart and intuition.',
            'Quality is more important than quantity.',
            'The people who are crazy enough to think they can change the world are the ones who do.',
            'Remembering that you are going to die is the best way I know to avoid the trap of thinking you have something to lose.',
            'Life is what happens to you while you\'re busy making other plans.',
            'The future belongs to those who believe in the beauty of their dreams.',
            'It is during our darkest moments that we must focus to see the light.',
            'The way to get started is to quit talking and begin doing.',
            'Don\'t let yesterday take up too much of today.',
            'You learn more from failure than from success.',
            'If you are working on something that you really care about, you don\'t have to be pushed.',
            'Whether you think you can or think you can\'t, you\'re right.',
            'The only limit to our realization of tomorrow is our doubts of today.',
            'Creativity is intelligence having fun.',
            'What you lack in talent can be made up with desire, hustle and giving 110% all the time.',
            'Do what you can with all you have, wherever you are.',
            'You are never too old to set another goal or to dream a new dream.',
            'The secret of getting ahead is getting started.',
            'It\'s hard to beat a person who never gives up.',
            'Everything you\'ve ever wanted is on the other side of fear.',
            'Believe you can and you\'re halfway there.',
            'Life is 10% what happens to you and 90% how you react to it.',
            'Act as if what you do makes a difference. It does.',
            'Success is not final, failure is not fatal: it is the courage to continue that counts.',
            'Never bend your head. Always hold it high. Look the world straight in the eye.',
            'What lies behind us and what lies before us are tiny matters compared to what lies within us.',
            'When you reach the end of your rope, tie a knot in it and hang on.',
            'The best time to plant a tree was 20 years ago. The second best time is now.',
            'Tell me and I forget. Teach me and I remember. Involve me and I learn.',
            'Not everything that is faced can be changed, but nothing can be changed until it is faced.',
            'When we strive to become better than we are, everything around us becomes better too.',
            'Setting goals is the first step in turning the invisible into the visible.',
            'Skill is the unified force of experience, intellect and passion in their operation.',
            'With the new day comes new strength and new thoughts.',
            'There are no secrets to success. It is the result of preparation, hard work, and learning from failure.',
            'The successful warrior is the average man, with laser-like focus.',
            'Happiness is not something ready made. It comes from your own actions.',
            'The mind is everything. What you think you become.',
            'The best way to find yourself is to lose yourself in the service of others.',
            'In a gentle way, you can shake the world.',
            'A man is but the product of his thoughts. What he thinks, he becomes.',
            'Be the change that you wish to see in the world.',
            'The weak can never forgive. Forgiveness is the attribute of the strong.',
            'Live as if you were to die tomorrow. Learn as if you were to live forever.',
            'An eye for an eye only ends up making the whole world blind.',
            'First they ignore you, then they laugh at you, then they fight you, then you win.',
            'You must be the change you wish to see in the world.',
            'The future depends on what you do today.',
            'To give pleasure to a single heart by a single act is better than a thousand heads bowing in prayer.',
            'The best way to find yourself is to lose yourself in the service of others.',
            'In a gentle way, you can shake the world.',
            'Strength does not come from physical capacity. It comes from an indomitable will.',
            'The difference between what we do and what we are capable of doing would suffice to solve most of the world\'s problems.',
            'You can\'t cross the sea merely by standing and staring at the water.',
            'Take up one idea. Make that one idea your life - think of it, dream of it, live on that idea.',
            'Arise, awake and stop not till the goal is reached.',
            'All the power is within you. You can do anything and everything.',
            'Talk to yourself once in a day, otherwise you may miss meeting an excellent person in this world.',
            'The greatest religion is to be true to your own nature. Have faith in yourselves.',
            'You cannot believe in God until you believe in yourself.',
            'The fire that warms us can also consume us; it is not the fault of the fire.',
            'Where can we go to find God if we cannot see Him in our own hearts and in every living being.',
            'The more we come out and do good to others, the more our hearts will be purified.',
            'They alone live, who live for others.',
            'Neither seek nor avoid, take what comes.',
            'The greatest help to spiritual life is meditation.',
            'Do one thing at a time, and while doing it put your whole soul into it to the exclusion of all else.',
            'The mind is but the subtle part of the body. You must retain great strength in your mind and words.',
            'Knowledge can only be got in one way, the way of experience; there is no other way to know.',
            'If money help a man to do good to others, it is of some value; but if not, it is simply a mass of evil.',
            'As different streams having different sources all mingle their waters in the sea.',
            'We are what our thoughts have made us; so take care about what you think.',
            'Success is not the key to happiness. Happiness is the key to success.',
            'The only impossible journey is the one you never begin.',
            'In the middle of difficulty lies opportunity.',
            'A person who never made a mistake never tried anything new.',
            'Life is like riding a bicycle. To keep your balance, you must keep moving.',
            'Try not to become a man of success but rather try to become a man of value.',
            'Logic will get you from A to B. Imagination will take you everywhere.',
            'The important thing is not to stop questioning. Curiosity has its own reason for existing.',
            'Anyone who has never made a mistake has never tried anything new.',
            'I have not failed. I\'ve just found 10,000 ways that won\'t work.',
            'Our greatest weakness lies in giving up. The most certain way to succeed is always to try just one more time.',
            'The best and most beautiful things in the world cannot be seen or even touched - they must be felt with the heart.',
            'Keep your face always toward the sunshine - and shadows will fall behind you.',
            'It is during our darkest moments that we must focus to see the light.',
            'Never regret your past. Rather, embrace it as the teacher that it is.',
            'The only way to do great work is to love what you do.',
            'If life were predictable it would cease to be life, and be without flavor.',
            'In the end, it\'s not the years in your life that count. It\'s the life in your years.',
            'Life is either a daring adventure or nothing at all.',
            'Many of life\'s failures are people who did not realize how close they were to success when they gave up.',
            'The secret of success is to do the common thing uncommonly well.',
            'I find that the harder I work, the more luck I seem to have.',
            'Don\'t be distracted by criticism. Remember - the only taste of success some people get is to take a bite out of you.'
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