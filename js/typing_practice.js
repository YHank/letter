// 전역 변수를 함수 외부로 이동하여 중복 초기화 방지
var typingPracticeState = typingPracticeState || null;

// 타자 연습 설정
var typingConfig = typingConfig || {
    defaultDuration: 5 * 60 * 1000, // 5분 (밀리초)
    showTimer: true,
    
    // 레벨 시스템
    levels: [
        { name: '초보자', minWPM: 0, color: 'secondary' },
        { name: '입문자', minWPM: 100, color: 'info' },
        { name: '중급자', minWPM: 200, color: 'primary' },
        { name: '숙련자', minWPM: 300, color: 'success' },
        { name: '전문가', minWPM: 400, color: 'warning' },
        { name: '마스터', minWPM: 500, color: 'danger' }
    ],
    
    // 업적 시스템
    achievements: [
        { id: 'first_practice', name: '첫 연습', desc: '첫 타자 연습 완료', icon: 'fa-baby-carriage' },
        { id: 'perfect_accuracy', name: '완벽주의자', desc: '100% 정확도 달성', icon: 'fa-bullseye' },
        { id: 'speed_demon', name: '스피드 데몬', desc: '400타/분 이상 달성', icon: 'fa-rocket' },
        { id: 'consistent_player', name: '꾸준한 연습', desc: '10회 연습 완료', icon: 'fa-calendar-check' },
        { id: 'marathon_runner', name: '마라토너', desc: '50회 연습 완료', icon: 'fa-running' },
        { id: 'improvement', name: '성장하는 실력', desc: '최고 기록 10% 향상', icon: 'fa-chart-line' }
    ]
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
        window.storageManager.save('typingPracticeRecords', records, false);
    },

    load: function() {
        return window.storageManager.load('typingPracticeRecords', [], false);
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
    },
    
    getTotalCount: function() {
        return this.load().length;
    }
};

// 업적 시스템
const achievementSystem = {
    getUnlocked: function() {
        return window.storageManager.load('typingAchievements', [], false);
    },

    unlock: function(achievementId) {
        const unlocked = this.getUnlocked();
        if (!unlocked.includes(achievementId)) {
            unlocked.push(achievementId);
            window.storageManager.save('typingAchievements', unlocked, false);
            
            // 업적 획득 알림
            const achievement = typingConfig.achievements.find(a => a.id === achievementId);
            if (achievement && typeof showAchievementNotification === 'function') {
                showAchievementNotification(achievement);
            }
            return true;
        }
        return false;
    },
    
    checkAchievements: function(wpm, accuracy, mode) {
        const records = practiceRecords.load();
        const totalCount = records.length;
        
        // 첫 연습
        if (totalCount === 1) {
            this.unlock('first_practice');
        }
        
        // 완벽한 정확도
        if (accuracy === 100) {
            this.unlock('perfect_accuracy');
        }
        
        // 스피드 데몬
        if (wpm >= 400) {
            this.unlock('speed_demon');
        }
        
        // 꾸준한 연습
        if (totalCount >= 10) {
            this.unlock('consistent_player');
        }
        
        // 마라토너
        if (totalCount >= 50) {
            this.unlock('marathon_runner');
        }
        
        // 성장하는 실력 (이전 최고 기록보다 10% 향상)
        const bestWPM = practiceRecords.getBestWPM(mode);
        if (records.length > 1 && wpm > bestWPM * 1.1) {
            this.unlock('improvement');
        }
    }
};

// 레벨 계산
function getUserLevel(wpm) {
    const levels = typingConfig.levels;
    for (let i = levels.length - 1; i >= 0; i--) {
        if (wpm >= levels[i].minWPM) {
            return levels[i];
        }
    }
    return levels[0];
}

// 페이지 언로드 시 정리
function cleanupTypingPractice() {
    if (typingPracticeState) {
        // 타이머 정리
        if (typingPracticeState.timerInterval) {
            clearInterval(typingPracticeState.timerInterval);
            typingPracticeState.timerInterval = null;
        }
        
        // 이벤트 리스너 정리
        if (typingPracticeState.eventListeners) {
            typingPracticeState.eventListeners.forEach((info) => {
                if (info.element && info.handler) {
                    info.element.removeEventListener(info.event, info.handler);
                }
            });
            typingPracticeState.eventListeners.clear();
        }
        
        // 모든 버튼의 이벤트 리스너를 강제로 제거 (클론으로)
        DOMUtils.getElements('.select-mode-btn').forEach(btn => {
            const newBtn = btn.cloneNode(true);
            if (btn.parentNode) {
                btn.parentNode.replaceChild(newBtn, btn);
            }
        });
        
        // 상태 초기화
        typingPracticeState = null;
    }
}

// 새로운 타자 연습 시스템
function initializeTypingPracticeNew() {
    // console.log('새로운 타자 연습 시스템 초기화 중...');
    
    // 이미 초기화되었으면 기존 상태 정리 후 재초기화
    if (typingPracticeState && typingPracticeState.initialized) {
        // console.log('타자 연습 시스템 재초기화 중...');
        cleanupTypingPractice();
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
    const versionSelector = DOMUtils.getElement('#version-selector');
    const practiceArea = DOMUtils.getElement('#practice-area');
    const backToMenuBtn = DOMUtils.getElement('#back-to-menu');
    const statsArea = DOMUtils.getElement('#stats-area');
    const langKoreanBtn = DOMUtils.getElement('#lang-korean');
    const langEnglishBtn = DOMUtils.getElement('#lang-english');
    
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
        if (typingPracticeState.eventListeners.has(key)) {
            const existingHandler = typingPracticeState.eventListeners.get(key);
            if (existingHandler && existingHandler.element && existingHandler.handler) {
                existingHandler.element.removeEventListener(existingHandler.event, existingHandler.handler);
            }
            typingPracticeState.eventListeners.delete(key);
        }
        
        // 새 리스너 추가
        element.addEventListener(event, handler);
        typingPracticeState.eventListeners.set(key, { element, event, handler });
    }
    
    // 모드 선택 - 이벤트 위임 방식으로 변경 (강화된 버전)
    const versionSelectorElement = DOMUtils.getElement('#version-selector');
    if (versionSelectorElement) {
        // 모든 기존 클릭 이벤트 리스너 강제 제거
        const clonedElement = versionSelectorElement.cloneNode(true);
        versionSelectorElement.parentNode.replaceChild(clonedElement, versionSelectorElement);
        
        const delegationHandler = function(e) {
            const btn = e.target.closest('.select-mode-btn');
            if (btn) {
                e.preventDefault();
                e.stopPropagation();
                const modeCard = btn.closest('.practice-mode-card');
                const mode = modeCard.dataset.practiceMode;
                // console.log('모드 선택:', mode); // 디버그용
                selectMode(mode);
            }
        };
        
        // 새로 교체된 요소에 이벤트 리스너 추가
        clonedElement.addEventListener('click', delegationHandler);
        typingPracticeState.eventListeners.set('mode-select-delegation', { 
            element: clonedElement, 
            event: 'click', 
            handler: delegationHandler 
        });
    }
    
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
        
        // 텍스트 표시 영역 초기화
        clearAllDisplayTexts();
        
        // 필수 요소만 확인 (start 버튼은 없을 수 있음)
        if (!resetBtn || !typingArea || !typingInput) {
            console.error('자유 타자 연습 요소를 찾을 수 없습니다.');
            return;
        }
        
        // 자유 타자 연습에서는 바로 입력 가능하도록 초기화
        typingInput.disabled = false;
        typingInput.focus();
        
        const startHandler = function() {
            // 언어에 따라 랜덤으로 문장 선택
            const lang = typingPracticeState.currentLang;
            const freeTexts = window.practiceTexts[lang].free;
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
            typingPracticeState.timerInterval = setInterval(function() {
                updateTimer();
                updateStats();
            }, 100);
        };
        
        addEventListenerOnce(startBtn, 'click', startHandler, 'free-start');
        
        const resetHandler = function() {
            resetPractice('free');
            if (startBtn) startBtn.style.display = 'inline-block';
            typingArea.style.display = 'none';
            if (statsArea) statsArea.style.display = 'none';
            
            // 자유 타자 연습에서는 리셋 후에도 입력 가능해야 함
            if (typingInput) {
                typingInput.value = '';
                typingInput.disabled = false;
                typingInput.focus();
            }
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
        
        // 텍스트 표시 영역 초기화
        clearAllDisplayTexts();
        
        // 타입 선택
        document.querySelectorAll('[data-beginner-type]').forEach((btn, index) => {
            const handler = function() {
                if (!typingPracticeState.isTyping) {
                    document.querySelectorAll('[data-beginner-type]').forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                    currentBeginnerType = this.dataset.beginnerType;
                    // 타입 변경 시 키보드 재생성
                    createKeyboardVisualization();
                }
            };
            addEventListenerOnce(btn, 'click', handler, `beginner-type-${index}`);
        });
        
        // 키보드 시각화 생성
        createKeyboardVisualization();
        
        const beginnerStartHandler = function() {
            const lang = typingPracticeState.currentLang;
            const texts = window.practiceTexts[lang].beginner[currentBeginnerType];
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
            
            // 키보드 업데이트 및 현재 타이핑해야 할 키 강조
            updateKeyboardForCurrentText();
            highlightKey(typingPracticeState.currentText[0]);
            
            // 개인 기록 표시
            showPersonalRecords('beginner');
            
            // 기존 타이머 정리
            if (typingPracticeState.timerInterval) {
                clearInterval(typingPracticeState.timerInterval);
            }
            typingPracticeState.timerInterval = setInterval(function() {
                updateTimer();
                updateStats();
            }, 100);
        };
        
        addEventListenerOnce(startBtn, 'click', beginnerStartHandler, 'beginner-start');
        
        const beginnerResetHandler = function() {
            resetPractice('beginner');
            startBtn.style.display = 'inline-block';
            statsArea.style.display = 'none';
            clearKeyHighlight();
            typingInput.value = '';
            typingInput.disabled = true;
        };
        
        addEventListenerOnce(resetBtn, 'click', beginnerResetHandler, 'beginner-reset');
        
        // 입력 처리 (한 글자씩)
        const beginnerInputHandler = function(e) {
            if (!typingPracticeState.isTyping) return;
            
            const inputValue = this.value;
            const currentChar = typingPracticeState.currentText[typingPracticeState.currentIndex];
            
            // 입력된 마지막 문자만 확인
            if (inputValue.length > 0) {
                const lastChar = inputValue.slice(-1);
                
                if (lastChar === currentChar) {
                    // 올바른 입력
                    typingPracticeState.currentIndex++;
                    updateDisplay('beginner');
                    updateStats();
                    
                    // 입력창 비우기
                    this.value = '';
                    
                    if (typingPracticeState.currentIndex < typingPracticeState.currentText.length) {
                        highlightKey(typingPracticeState.currentText[typingPracticeState.currentIndex]);
                    } else {
                        // 문장 완료 - 다음 문장으로
                        clearKeyHighlight();
                        const beginnerType = document.querySelector('[data-beginner-type].active')?.dataset.beginnerType || 'home';
                        const lang = typingPracticeState.currentLang;
                        const beginnerTexts = window.practiceTexts[lang].beginner[beginnerType];
                        const nextText = beginnerTexts[Math.floor(Math.random() * beginnerTexts.length)];
                        
                        typingPracticeState.currentText = nextText;
                        typingPracticeState.currentIndex = 0;
                        updateDisplay('beginner');
                        updateKeyboardForCurrentText(); // 키보드 업데이트
                        highlightKey(typingPracticeState.currentText[0]);
                    }
                } else {
                    // 잘못된 입력
                    typingPracticeState.errorCount++;
                    this.classList.add('is-invalid');
                    this.value = '';
                    setTimeout(() => {
                        this.classList.remove('is-invalid');
                    }, 200);
                }
            }
        };
        
        addEventListenerOnce(typingInput, 'input', beginnerInputHandler, 'beginner-input');
        
        // 키 다운 이벤트로 특수키 처리
        const beginnerKeydownHandler = function(e) {
            if (!typingPracticeState.isTyping) return;
            
            // 백스페이스, 엔터, 탭 등 특수키 방지
            if (['Backspace', 'Enter', 'Tab', 'Delete'].includes(e.key)) {
                e.preventDefault();
            }
        };
        
        addEventListenerOnce(typingInput, 'keydown', beginnerKeydownHandler, 'beginner-keydown');
    }
    
    // 특수 타자 연습
    function initializeSpecialPractice() {
        let currentSpecialType = 'numbers';
        const startBtn = document.getElementById('start-special-practice');
        const resetBtn = document.getElementById('reset-special-practice');
        const typingInput = document.getElementById('special-typing-input');
        
        // 텍스트 표시 영역 초기화
        clearAllDisplayTexts();
        
        // 타입 선택
        document.querySelectorAll('[data-special-type]').forEach((btn, index) => {
            const handler = function() {
                if (!typingPracticeState.isTyping) {
                    document.querySelectorAll('[data-special-type]').forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                    currentSpecialType = this.dataset.specialType;
                    // 타입 변경 시 키보드 재생성
                    createSpecialKeyboardVisualization(currentSpecialType);
                }
            };
            addEventListenerOnce(btn, 'click', handler, `special-type-${index}`);
        });
        
        // 특수 키보드 시각화 생성
        createSpecialKeyboardVisualization(currentSpecialType);
        
        const specialStartHandler = function() {
            const lang = typingPracticeState.currentLang;
            const texts = window.practiceTexts[lang].special[currentSpecialType];
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
            
            // 현재 타이핑해야 할 키 강조
            highlightSpecialKey(typingPracticeState.currentText[0]);
            
            // 개인 기록 표시
            showPersonalRecords('special');
            
            // 기존 타이머 정리
            if (typingPracticeState.timerInterval) {
                clearInterval(typingPracticeState.timerInterval);
            }
            typingPracticeState.timerInterval = setInterval(function() {
                updateTimer();
                updateStats();
            }, 100);
        };
        
        addEventListenerOnce(startBtn, 'click', specialStartHandler, 'special-start');
        
        const specialResetHandler = function() {
            resetPractice('special');
            startBtn.style.display = 'inline-block';
            statsArea.style.display = 'none';
            clearSpecialKeyHighlight();
        };
        
        addEventListenerOnce(resetBtn, 'click', specialResetHandler, 'special-reset');
        
        const specialInputHandler = function() {
            handleTyping('special', this.value);
            if (typingPracticeState.currentIndex < typingPracticeState.currentText.length) {
                highlightSpecialKey(typingPracticeState.currentText[typingPracticeState.currentIndex]);
            } else {
                clearSpecialKeyHighlight();
            }
        };
        
        addEventListenerOnce(typingInput, 'input', specialInputHandler, 'special-input');
    }
    
    // 표준 타자 연습 로드
    function loadStandardPractice() {
        let currentStandardMode = 'words';
        let currentStandardLevel = 'easy';
        
        // 텍스트 표시 영역 초기화
        clearAllDisplayTexts();
        
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
            typingPracticeState.timerInterval = setInterval(function() {
                updateTimer();
                updateStats();
            }, 100);
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
            
            // 완료 체크 - 문장이 완료되면 통계 일시 정지하고 다음 문장 준비
            if (typingPracticeState.currentIndex >= typingPracticeState.currentText.length) {
                // 문장 완료 시 타이핑 상태를 일시 정지로 설정
                typingPracticeState.isTyping = false;
                
                // 현재 통계를 보존하고 사용자가 확인할 수 있도록 3초 대기
                setTimeout(() => {
                    // 다음 문장 준비
                    const lang = typingPracticeState.currentLang;
                    let nextText;
                    
                    switch(mode) {
                        case 'free':
                            const freeTexts = window.practiceTexts[lang].free;
                            nextText = freeTexts[Math.floor(Math.random() * freeTexts.length)];
                            break;
                        case 'beginner':
                            const beginnerType = document.querySelector('[data-beginner-type].active')?.dataset.beginnerType || 'home';
                            const beginnerTexts = practiceTexts[lang].beginner[beginnerType];
                            nextText = beginnerTexts[Math.floor(Math.random() * beginnerTexts.length)];
                            break;
                        case 'special':
                            const specialType = document.querySelector('[data-special-type].active')?.dataset.specialType || 'numbers';
                            const specialTexts = practiceTexts[lang].special[specialType];
                            nextText = specialTexts[Math.floor(Math.random() * specialTexts.length)];
                            break;
                        case 'standard':
                            const standardMode = document.querySelector('[data-standard-mode].active')?.dataset.standardMode || 'words';
                            const standardLevel = document.querySelector('[data-standard-level].active')?.dataset.standardLevel || 'easy';
                            const standardTexts = practiceTexts[lang].standard[standardMode][standardLevel];
                            if (Array.isArray(standardTexts)) {
                                nextText = standardTexts[Math.floor(Math.random() * standardTexts.length)];
                            } else {
                                nextText = standardTexts;
                            }
                            break;
                    }
                    
                    if (nextText) {
                        // 다음 문장으로 전환하고 타이핑 재개
                        typingPracticeState.currentText = nextText;
                        typingPracticeState.currentIndex = 0;
                        typingPracticeState.isTyping = true;
                        
                        // 새 문장 시작 시간 갱신 (이전 통계는 누적됨)
                        typingPracticeState.startTime = Date.now();
                        typingPracticeState.errorCount = 0; // 에러 카운트는 리셋
                        
                        const input = document.getElementById(`${mode}-typing-input`);
                        if (input) {
                            input.value = '';
                            input.focus();
                        }
                        updateDisplay(mode);
                    }
                }, 3000); // 3초 대기
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
            const elapsedTime = Date.now() - typingPracticeState.startTime;
            const elapsedMinutes = elapsedTime / 60000;
            const charactersTyped = typingPracticeState.currentIndex;
            
            // 경과 시간 업데이트
            const elapsedSeconds = Math.floor(elapsedTime / 1000);
            const minutes = Math.floor(elapsedSeconds / 60);
            const seconds = elapsedSeconds % 60;
            
            const timeEl = document.getElementById('time');
            if (timeEl) {
                timeEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            }
            
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
        clearAllDisplayTexts();
        
        // 개인 기록 숨기기
        const recordsArea = document.getElementById('personal-records');
        if (recordsArea) recordsArea.style.display = 'none';
    }
    
    // 모든 텍스트 표시 영역 초기화
    function clearAllDisplayTexts() {
        const modes = ['free', 'beginner', 'special', 'standard'];
        modes.forEach(mode => {
            const typedText = document.getElementById(`${mode}-typed-text`);
            const currentChar = document.getElementById(`${mode}-current-char`);
            const remainingText = document.getElementById(`${mode}-remaining-text`);
            
            if (typedText) typedText.textContent = '';
            if (currentChar) currentChar.textContent = '';
            if (remainingText) remainingText.textContent = '';
        });
    }
    
    // contenteditable 입력창 초기화
    function clearContentEditableInput(element) {
        if (element) {
            element.textContent = '';
            element.innerHTML = '';
        }
    }
    
    // contenteditable에서 커서를 끝으로 이동
    function setCaretToEnd(element) {
        const range = document.createRange();
        const selection = window.getSelection();
        range.selectNodeContents(element);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
    }
    
        // 키보드 시각화 생성
    function createKeyboardVisualization() {
        const container = document.querySelector('.keyboard-container');
        if (!container) return;
        
        const lang = typingPracticeState.currentLang;
        const beginnerType = document.querySelector('[data-beginner-type].active')?.dataset.beginnerType || 'home';
        
        const keyboards = {
            korean: {
                home: [
                    ['ㅂ', 'ㅈ', 'ㄷ', 'ㄱ', 'ㅅ', 'ㅛ', 'ㅕ', 'ㅑ', 'ㅐ', 'ㅔ'],
                    ['ㅁ', 'ㄴ', 'ㅇ', 'ㄹ', 'ㅎ', 'ㅗ', 'ㅓ', 'ㅏ', 'ㅣ'],
                    ['ㅋ', 'ㅌ', 'ㅊ', 'ㅍ', 'ㅠ', 'ㅜ', 'ㅡ']
                ],
                consonant: [
                    ['ㅂ', 'ㅈ', 'ㄷ', 'ㄱ', 'ㅅ'],
                    ['ㅁ', 'ㄴ', 'ㅇ', 'ㄹ', 'ㅎ'],
                    ['ㅋ', 'ㅌ', 'ㅊ', 'ㅍ'],
                    ['ㄲ', 'ㄸ', 'ㅃ', 'ㅆ', 'ㅉ']
                ],
                vowel: [
                    ['ㅛ', 'ㅕ', 'ㅑ', 'ㅐ', 'ㅔ'],
                    ['ㅗ', 'ㅓ', 'ㅏ', 'ㅣ'],
                    ['ㅠ', 'ㅜ', 'ㅡ']
                ]
            },
            english: {
                home: [
                    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
                    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
                    ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
                ],
                consonant: [
                    ['Q', 'W', 'R', 'T', 'Y', 'P'],
                    ['S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
                    ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
                ],
                vowel: [
                    ['A', 'E', 'I', 'O', 'U']
                ]
            }
        };
        
        const keyboard = keyboards[lang][beginnerType] || keyboards[lang]['home'];
        
        container.innerHTML = '';
        
        keyboard.forEach((row, rowIndex) => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'keyboard-row';
            
            row.forEach(key => {
                const keyDiv = document.createElement('div');
                keyDiv.className = 'key';
                keyDiv.textContent = key;
                keyDiv.dataset.key = key;
                keyDiv.dataset.originalKey = key; // 원본 키 저장
                rowDiv.appendChild(keyDiv);
            });
            
            container.appendChild(rowDiv);
        });
        
        // 스페이스바 추가 (home 타입일 때만)
        if (beginnerType === 'home') {
            const spaceRow = document.createElement('div');
            spaceRow.className = 'keyboard-row';
            const spaceKey = document.createElement('div');
            spaceKey.className = 'key space';
            spaceKey.textContent = 'SPACE';
            spaceKey.dataset.key = ' ';
            spaceRow.appendChild(spaceKey);
            container.appendChild(spaceRow);
        }
        
        // 현재 연습 텍스트에 따라 키보드 업데이트
        updateKeyboardForCurrentText();
    }
    
    // 현재 연습 텍스트에 따라 키보드 업데이트
    function updateKeyboardForCurrentText() {
        if (!typingPracticeState || !typingPracticeState.currentText) return;
        
        const currentText = typingPracticeState.currentText;
        
        // 키보드의 모든 키를 원래 상태로 복원
        document.querySelectorAll('.key[data-original-key]').forEach(keyDiv => {
            const originalKey = keyDiv.dataset.originalKey;
            keyDiv.textContent = originalKey;
            keyDiv.dataset.key = originalKey;
        });
        
        // ㅒ, ㅖ가 포함된 경우 키보드 업데이트
        const charMapping = {
            'ㅒ': 'ㅐ',  // ㅒ가 나오면 ㅐ 위치에 ㅒ 표시
            'ㅖ': 'ㅔ'   // ㅖ가 나오면 ㅔ 위치에 ㅖ 표시
        };
        
        for (let char of currentText) {
            if (charMapping[char]) {
                const targetPosition = charMapping[char];
                const targetKey = document.querySelector(`.key[data-original-key="${targetPosition}"]`);
                if (targetKey) {
                    targetKey.textContent = char;
                    targetKey.dataset.key = char;
                }
            }
        }
    }
    
    // 특수 키보드 시각화 생성
    function createSpecialKeyboardVisualization(type = 'numbers') {
        const container = document.querySelector('.special-keyboard-container');
        if (!container) return;
        
        const specialKeyboards = {
            numbers: [
                ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
                ['-', '=', '[', ']', '\\', ';', "'", ',', '.', '/']
            ],
            symbols: [
                ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')'],
                ['_', '+', '{', '}', '|', ':', '"', '<', '>', '?'],
                ['~', '`']
            ],
            mixed: [
                ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
                ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')'],
                ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
                ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
                ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
            ],
            chunjiin: [
                ['ㅣ', '.', 'ㅡ'],
                ['조합 연습']
            ]
        };
        
        const keyboard = specialKeyboards[type] || specialKeyboards.numbers;
        
        container.innerHTML = '';
        
        keyboard.forEach((row, rowIndex) => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'keyboard-row';
            
            row.forEach(key => {
                const keyDiv = document.createElement('div');
                keyDiv.className = 'key special-key';
                keyDiv.textContent = key;
                keyDiv.dataset.key = key;
                rowDiv.appendChild(keyDiv);
            });
            
            container.appendChild(rowDiv);
        });
        
        // 스페이스바 추가 (mixed 타입일 때만)
        if (type === 'mixed') {
            const spaceRow = document.createElement('div');
            spaceRow.className = 'keyboard-row';
            const spaceKey = document.createElement('div');
            spaceKey.className = 'key special-key space';
            spaceKey.textContent = 'SPACE';
            spaceKey.dataset.key = ' ';
            spaceRow.appendChild(spaceKey);
            container.appendChild(spaceRow);
        }
    }
    
    // 키 하이라이트
    function highlightKey(char) {
        clearKeyHighlight();
        const key = document.querySelector(`.key[data-key="${char}"]`);
        if (key) {
            key.classList.add('active');
        }
    }
    
    // 특수 키 하이라이트
    function highlightSpecialKey(char) {
        clearSpecialKeyHighlight();
        const key = document.querySelector(`.special-key[data-key="${char}"]`);
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
    
    // 특수 키 하이라이트 제거
    function clearSpecialKeyHighlight() {
        document.querySelectorAll('.special-key.active').forEach(key => {
            key.classList.remove('active');
        });
    }
}

// 기존 함수와 호환성을 위해
function initializeTypingPractice() {
    // 기존 초기화 함수 호출
    initializeTypingPracticeNew();
}

// 연습 데이터는 practice_data.js에서 관리됩니다.