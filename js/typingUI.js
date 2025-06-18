// This file will handle DOM manipulations, UI updates
// (displaying text, stats, keyboard visualization),
// and event listeners directly related to UI elements.
// console.log("typingUI.js loaded");

// Assumes DOMUtils is globally available (from utils.js)
// Assumes GameLogic and TypingStats objects are available for callbacks or data

const TypingUI = {
    elements: {
        // Main layout
        versionSelector: null,
        practiceArea: null,
        statsArea: null,
        backToMenuBtn: null,

        // Language selection
        langKoreanBtn: null,
        langEnglishBtn: null,

        // Mode-specific areas
        freePracticeMode: null,
        beginnerPracticeMode: null,
        specialPracticeMode: null,
        standardPracticeMode: null,

        // Text display (generic parts, specific ones might be per mode)
        typedText: null, // Generic selector, will need to be mode-specific
        currentChar: null,
        remainingText: null,

        // Inputs (generic parts)
        typingInput: null, // Generic selector

        // Stats display
        wpmEl: null,
        accuracyEl: null,
        timeEl: null,
        progressEl: null,
        remainingTimeEl: null,
        timeProgressBar: null,
        wpmUnitEl: null,

        // Keyboards
        beginnerKeyboardContainer: null,
        specialKeyboardContainer: null,

        // Buttons
        // (Start/reset buttons for each mode will be referenced specifically)

        // Results Modal
        resultModal: null,
        finalWpmEl: null,
        finalAccuracyEl: null,
        resultMessageEl: null,
        continueBtn: null,

        // Personal Records
        personalRecordsArea: null,
        bestWpmEl: null,
        avgWpmEl: null,

        // Other UI elements
        angleModeDisplay: null, // If scientific calculator elements are mixed in some HTML
        memoryIndicator: null,
        calculatorElement: null, // If needed for shift mode visuals

        // Typing practice specific (new)
        practiceTitle: null, // To show current mode/title
    },

    gameLogicHandler: null, // To call GameLogic methods

    init: function(gameLogic) {
        this.gameLogicHandler = gameLogic; // Store reference to GameLogic
        this.cacheDOMElements();
        this.setupGlobalEventListeners(); // Listeners that are part of the main UI shell
        // console.log("TypingUI initialized");
    },

    cacheDOMElements: function() {
        this.elements.versionSelector = DOMUtils.getElement('#version-selector');
        this.elements.practiceArea = DOMUtils.getElement('#practice-area');
        this.elements.statsArea = DOMUtils.getElement('#stats-area');
        this.elements.backToMenuBtn = DOMUtils.getElement('#back-to-menu');
        this.elements.langKoreanBtn = DOMUtils.getElement('#lang-korean');
        this.elements.langEnglishBtn = DOMUtils.getElement('#lang-english');

        this.elements.freePracticeMode = DOMUtils.getElement('#free-practice');
        this.elements.beginnerPracticeMode = DOMUtils.getElement('#beginner-practice');
        this.elements.specialPracticeMode = DOMUtils.getElement('#special-practice');
        this.elements.standardPracticeMode = DOMUtils.getElement('#standard-practice');

        this.elements.wpmEl = DOMUtils.getElement('#wpm');
        this.elements.accuracyEl = DOMUtils.getElement('#accuracy');
        this.elements.timeEl = DOMUtils.getElement('#time');
        this.elements.progressEl = DOMUtils.getElement('#progress');
        this.elements.remainingTimeEl = DOMUtils.getElement('#remaining-time');
        this.elements.timeProgressBar = DOMUtils.getElement('#time-progress-bar');
        this.elements.wpmUnitEl = DOMUtils.getElement('#wpm-unit');

        this.elements.beginnerKeyboardContainer = DOMUtils.getElement('#beginner-practice .keyboard-container');
        this.elements.specialKeyboardContainer = DOMUtils.getElement('#special-practice .special-keyboard-container');

        this.elements.resultModal = DOMUtils.getElement('#resultModal');
        this.elements.finalWpmEl = DOMUtils.getElement('#final-wpm');
        this.elements.finalAccuracyEl = DOMUtils.getElement('#final-accuracy');
        this.elements.resultMessageEl = DOMUtils.getElement('#result-message');
        this.elements.continueBtn = DOMUtils.getElement('#continue-btn');

        this.elements.personalRecordsArea = DOMUtils.getElement('#personal-records');
        this.elements.bestWpmEl = DOMUtils.getElement('#best-wpm');
        this.elements.avgWpmEl = DOMUtils.getElement('#avg-wpm');
        this.elements.practiceTitle = DOMUtils.getElement('#practice-title'); // Example
    },

    setupGlobalEventListeners: function() {
        if (this.elements.backToMenuBtn) {
            // This listener might need to be managed carefully if it's added multiple times
            this.elements.backToMenuBtn.addEventListener('click', () => this.showMainMenu());
        }

        if (this.elements.langKoreanBtn && this.elements.langEnglishBtn) {
            this.elements.langKoreanBtn.addEventListener('click', () => this.changeLanguage('korean'));
            this.elements.langEnglishBtn.addEventListener('click', () => this.changeLanguage('english'));
        }

        // Mode selection via event delegation on versionSelector
        if (this.elements.versionSelector) {
            this.elements.versionSelector.addEventListener('click', (e) => {
                const btn = e.target.closest('.select-mode-btn');
                if (btn) {
                    e.preventDefault();
                    e.stopPropagation();
                    const modeCard = btn.closest('.practice-mode-card');
                    const mode = modeCard.dataset.practiceMode;
                    if (this.gameLogicHandler) {
                        this.gameLogicHandler.selectMode(mode); // Notify GameLogic
                        this.displayPracticeArea(mode); // Update UI
                        this.updatePracticeTitle(mode);
                    }
                }
            });
        }
    },

    updatePracticeTitle: function(mode) {
        if (this.elements.practiceTitle) {
            let title = "타자 연습"; // Default
            if (mode === "free") title = "자유 타자 연습";
            else if (mode === "beginner") title = "초보자 자리 연습";
            else if (mode === "special") title = "특수키 연습";
            else if (mode === "standard") title = "표준 타자 연습";
            this.elements.practiceTitle.textContent = title;
        }
    },

    changeLanguage: function(lang) {
        if (this.gameLogicHandler && this.gameLogicHandler.changeLanguage(lang)) {
            if (lang === 'korean') {
                this.elements.langKoreanBtn.classList.add('active');
                this.elements.langEnglishBtn.classList.remove('active');
            } else {
                this.elements.langEnglishBtn.classList.add('active');
                this.elements.langKoreanBtn.classList.remove('active');
            }
            // If in beginner or special mode, refresh keyboard
            const currentMode = this.gameLogicHandler.state.currentMode;
            if (currentMode === 'beginner' && this.elements.beginnerKeyboardContainer) {
                this.createKeyboardVisualization(this.gameLogicHandler.state.currentSubMode || 'home', lang);
            } else if (currentMode === 'special' && this.elements.specialKeyboardContainer) {
                 this.createSpecialKeyboardVisualization(this.gameLogicHandler.state.currentSubMode || 'numbers');
            }
             // Update WPM unit display
            if (this.elements.wpmUnitEl) {
                this.elements.wpmUnitEl.textContent = lang === 'korean' ? '타/분' : 'WPM';
            }
        }
    },

    showMainMenu: function() {
        if (this.elements.versionSelector) this.elements.versionSelector.style.display = 'block';
        if (this.elements.practiceArea) this.elements.practiceArea.style.display = 'none';
        if (this.elements.statsArea) this.elements.statsArea.style.display = 'none';
        if (this.gameLogicHandler) this.gameLogicHandler.resetAllPractices(); // Assuming resetAllPractices exists in GameLogic

        const remainingTimeRow = DOMUtils.getElement('#remaining-time')?.closest('.row');
        if (remainingTimeRow) remainingTimeRow.style.display = 'none';
        if (this.elements.practiceTitle) this.elements.practiceTitle.textContent = "타자 연습 모드 선택";
    },

    displayPracticeArea: function(mode) {
        if (this.elements.versionSelector) this.elements.versionSelector.style.display = 'none';
        if (this.elements.practiceArea) this.elements.practiceArea.style.display = 'block';
        if (this.elements.statsArea) this.elements.statsArea.style.display = 'flex'; // Show stats area by default

        document.querySelectorAll('.practice-content').forEach(content => {
            content.style.display = 'none';
        });

        const modeElement = DOMUtils.getElement(`#${mode}-practice`);
        if (modeElement) {
            modeElement.style.display = 'block';
        }

        const remainingTimeRow = DOMUtils.getElement('#remaining-time')?.closest('.row');
        if (remainingTimeRow) remainingTimeRow.style.display = 'block';

        // Focus the input for the selected mode
        const inputEl = DOMUtils.getElement(`#${mode}-typing-input`);
        if (inputEl) {
            inputEl.disabled = false; // Ensure it's enabled if previously disabled by reset
            inputEl.focus();
        }
    },

    // Mode-specific UI initializers (called by GameLogic after mode selection)
    initFreePracticeUI: function() {
        this.clearAllDisplayTexts('free');
        const startBtn = DOMUtils.getElement('#start-free-practice');
        const typingArea = DOMUtils.getElement('#free-typing-area'); // This is the text display area
        const typingInput = DOMUtils.getElement('#free-typing-input');

        if (startBtn) startBtn.style.display = 'inline-block'; // Show start button initially
        if (typingArea) typingArea.style.display = 'none'; // Hide text display area
        if (typingInput) {
            typingInput.value = '';
            typingInput.disabled = true; // Disabled until start
        }
        this.showPersonalRecords('free', this.gameLogicHandler.state.currentLang);
    },

    initBeginnerPracticeUI: function() {
        this.clearAllDisplayTexts('beginner');
        const startBtn = DOMUtils.getElement('#start-beginner-practice');
        const typingInput = DOMUtils.getElement('#beginner-typing-input');

        if (startBtn) startBtn.style.display = 'inline-block';
        if (typingInput) {
            typingInput.value = '';
            typingInput.disabled = true;
        }
        this.createKeyboardVisualization(this.gameLogicHandler.state.currentSubMode || 'home', this.gameLogicHandler.state.currentLang);
        this.showPersonalRecords('beginner', this.gameLogicHandler.state.currentLang);
    },

    initSpecialPracticeUI: function() {
        this.clearAllDisplayTexts('special');
        const startBtn = DOMUtils.getElement('#start-special-practice');
         const typingInput = DOMUtils.getElement('#special-typing-input');

        if (startBtn) startBtn.style.display = 'inline-block';
        if (typingInput) {
            typingInput.value = '';
            typingInput.disabled = true;
        }
        this.createSpecialKeyboardVisualization(this.gameLogicHandler.state.currentSubMode || 'numbers');
        this.showPersonalRecords('special', this.gameLogicHandler.state.currentLang);
    },

    initStandardPracticeUI: function() {
        this.clearAllDisplayTexts('standard');
        DOMUtils.getElement('#standard-start-btn').style.display = 'inline-block';
        DOMUtils.getElement('#standard-next-btn').style.display = 'none';
        const remainingTextEl = DOMUtils.getElement('#standard-remaining-text');
        if(remainingTextEl) remainingTextEl.textContent = '시작 버튼을 눌러주세요';
        const typingInput = DOMUtils.getElement('#standard-typing-input');
        if (typingInput) {
            typingInput.value = '';
            typingInput.disabled = true;
        }
        this.showPersonalRecords('standard', this.gameLogicHandler.state.currentLang);
    },

    // Called when GameLogic.startPractice is invoked
    startPracticeUI: function(mode, currentText) {
        const startBtn = DOMUtils.getElement(`#${mode}-start-btn`) || DOMUtils.getElement(`#start-${mode}-practice`);
        const typingInput = DOMUtils.getElement(`#${mode}-typing-input`);

        if (startBtn) startBtn.style.display = 'none';
        if (this.elements.statsArea) this.elements.statsArea.style.display = 'flex';

        const textDisplayArea = DOMUtils.getElement(`#${mode}-practice .typing-text-display`); // Generalize
        if (textDisplayArea) textDisplayArea.style.display = 'block';


        if (typingInput) {
            typingInput.value = '';
            typingInput.disabled = false;
            typingInput.focus();
        }
        this.updateTextDisplay(mode, currentText, 0);

        if (mode === 'beginner') this.updateKeyboardForCurrentText(currentText);
        if (mode === 'beginner' || mode === 'special') this.highlightCurrentKey(mode, currentText[0]);
    },

    // Generic text display update
    updateTextDisplay: function(mode, fullText, currentIndex) {
        const typedTextEl = DOMUtils.getElement(`#${mode}-typed-text`);
        const currentCharEl = DOMUtils.getElement(`#${mode}-current-char`);
        const remainingTextEl = DOMUtils.getElement(`#${mode}-remaining-text`);

        if (typedTextEl) typedTextEl.textContent = fullText.substring(0, currentIndex);
        if (currentCharEl) currentCharEl.textContent = fullText[currentIndex] || '';
        if (remainingTextEl) remainingTextEl.textContent = fullText.substring(currentIndex + 1);

        const progress = (currentIndex / fullText.length) * 100;
        this.updateProgressDisplay(isNaN(progress) ? 0 : progress);

        if (mode === 'beginner' || mode === 'special') {
            this.highlightCurrentKey(mode, fullText[currentIndex]);
        }
    },

    handleCorrectChar: function(mode, fullText, currentIndex) {
        this.updateTextDisplay(mode, fullText, currentIndex);
        const inputEl = DOMUtils.getElement(`#${mode}-typing-input`);
        if (inputEl && inputEl.classList.contains('is-invalid')) {
            inputEl.classList.remove('is-invalid');
        }
    },

    handleIncorrectChar: function(mode) {
        const inputEl = DOMUtils.getElement(`#${mode}-typing-input`);
        if (inputEl) {
            inputEl.classList.add('is-invalid');
            // For beginner mode, don't clear input, let user try again or it's char by char
            if (mode !== 'beginner') {
                 setTimeout(() => {
                    if(inputEl.classList.contains('is-invalid')) { // Check if still invalid
                        inputEl.classList.remove('is-invalid');
                    }
                }, 200);
            }
        }
    },

    // For beginner mode, clear input after each char
    clearBeginnerInput: function() {
        const inputEl = DOMUtils.getElement('#beginner-typing-input');
        if (inputEl) inputEl.value = '';
    },

    updateStatsDisplay: function(wpm, accuracy, elapsedTimeMs, remainingTimeMs) {
        if (this.elements.wpmEl) this.elements.wpmEl.textContent = wpm;
        if (this.elements.accuracyEl) this.elements.accuracyEl.textContent = accuracy + '%';

        const elapsedSeconds = Math.floor(elapsedTimeMs / 1000);
        const minutes = Math.floor(elapsedSeconds / 60);
        const seconds = elapsedSeconds % 60;
        if (this.elements.timeEl) {
            this.elements.timeEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }

        if (this.elements.remainingTimeEl && this.gameLogicHandler && this.gameLogicHandler.config) {
            if (remainingTimeMs <=0) {
                 this.elements.remainingTimeEl.textContent = `남은 시간: 0:00`;
                 if (this.elements.timeProgressBar) this.elements.timeProgressBar.style.width = `0%`;
                 this.elements.remainingTimeEl.classList.add('text-danger');
                 return;
            }
            const remMinutes = Math.floor(remainingTimeMs / 60000);
            const remSeconds = Math.floor((remainingTimeMs % 60000) / 1000);
            this.elements.remainingTimeEl.textContent = `남은 시간: ${remMinutes}:${remSeconds.toString().padStart(2, '0')}`;
            if (remainingTimeMs < 60000) {
                this.elements.remainingTimeEl.classList.add('text-danger');
            } else {
                this.elements.remainingTimeEl.classList.remove('text-danger');
            }
            if (this.elements.timeProgressBar) {
                const progress = (remainingTimeMs / this.gameLogicHandler.config.defaultDuration) * 100;
                this.elements.timeProgressBar.style.width = `${Math.max(0, progress)}%`;
            }
        }
    },

    updateProgressDisplay(progressPercentage) {
        if (this.elements.progressEl) this.elements.progressEl.textContent = Math.round(progressPercentage) + '%';
    },

    showResultsModal: function(wpm, accuracy, lang, mode) {
        // This function now depends on TypingStats for level and message generation
        const level = TypingStats.getUserLevel(wpm); // Assuming TypingStats is globally available or passed
        let message = '';
         // WPM thresholds could be language-dependent
        const wpmThresholds = lang === 'korean' ?
            { expert: 500, pro: 400, excellent: 300, good: 200, average: 150 } :
            { expert: 100, pro: 80, excellent: 60, good: 40, average: 20 };

        if (wpm >= wpmThresholds.expert) message = lang === 'korean' ? '놀라운 속도입니다! 최상위 전문가 수준이시네요!' : 'Amazing speed! You are at expert level!';
        else if (wpm >= wpmThresholds.pro) message = lang === 'korean' ? '매우 훌륭합니다! 전문가 수준의 타자 실력입니다!' : 'Excellent! Professional typing skills!';
        // ... other messages
        else message = lang === 'korean' ? '꾸준히 연습하면 실력이 향상될 거예요! 화이팅!' : 'Keep practicing! You will get better!';

        const totalElapsedMinutes = (this.gameLogicHandler.state.endTime - this.gameLogicHandler.state.startTime) / 60000;
        if (totalElapsedMinutes >= (this.gameLogicHandler.config.defaultDuration / 60000) * 0.98) { // Approx 5 mins
            message += '\n\n🎯 제한 시간 동안 집중해서 연습하셨네요! 수고하셨습니다!';
        }

        // Check for new best WPM for this mode and language
        const previousBest = TypingStats.practiceRecords.getBestWPM(mode, lang);
        if (wpm > previousBest && TypingStats.practiceRecords.load().filter(r=>r.mode===mode && r.lang === lang).length > 1) {
             message += '\n🎉 개인 신기록을 달성하셨습니다!';
        }


        if (this.elements.finalWpmEl) this.elements.finalWpmEl.textContent = wpm;
        if (this.elements.finalAccuracyEl) this.elements.finalAccuracyEl.textContent = accuracy + '%';
        if (this.elements.resultMessageEl) this.elements.resultMessageEl.textContent = message;

        if (this.elements.resultModal && typeof bootstrap !== 'undefined') {
            const modal = new bootstrap.Modal(this.elements.resultModal);
            modal.show();
        } else {
            alert(`연습 완료! 타수: ${wpm}, 정확도: ${accuracy}%`);
        }
    },

    resetPracticeUI: function(mode) {
        const inputEl = DOMUtils.getElement(`#${mode}-typing-input`);
        if (inputEl) {
            inputEl.value = '';
            inputEl.disabled = true;
            inputEl.classList.remove('is-invalid');
        }
        this.clearAllDisplayTexts(mode);
        this.resetStatsDisplay();

        const startBtn = DOMUtils.getElement(`#${mode}-start-btn`) || DOMUtils.getElement(`#start-${mode}-practice`);
        if(startBtn) startBtn.style.display = 'inline-block';

        if (mode === 'standard') {
            const nextBtn = DOMUtils.getElement('#standard-next-btn');
            if(nextBtn) nextBtn.style.display = 'none';
            const remainingTextEl = DOMUtils.getElement('#standard-remaining-text');
            if(remainingTextEl) remainingTextEl.textContent = '시작 버튼을 눌러주세요';
        }
        if (mode === 'beginner') this.clearKeyHighlight();
        if (mode === 'special') this.clearSpecialKeyHighlight();
    },

    resetStatsDisplay: function() {
        if(this.elements.wpmEl) this.elements.wpmEl.textContent = '0';
        if(this.elements.accuracyEl) this.elements.accuracyEl.textContent = '100%';
        if(this.elements.timeEl) this.elements.timeEl.textContent = '0:00';
        if(this.elements.progressEl) this.elements.progressEl.textContent = '0%';
        if(this.elements.remainingTimeEl) {
            const initialMinutes = Math.floor((this.gameLogicHandler ? this.gameLogicHandler.config.defaultDuration : 300000) / 60000);
            this.elements.remainingTimeEl.textContent = `남은 시간: ${initialMinutes}:00`;
            this.elements.remainingTimeEl.classList.remove('text-danger');
        }
        if(this.elements.timeProgressBar) this.elements.timeProgressBar.style.width = '100%';
    },

    clearAllDisplayTexts: function(mode) {
        const modesToClear = mode ? [mode] : ['free', 'beginner', 'special', 'standard'];
        modesToClear.forEach(m => {
            const typedTextEl = DOMUtils.getElement(`#${m}-typed-text`);
            const currentCharEl = DOMUtils.getElement(`#${m}-current-char`);
            const remainingTextEl = DOMUtils.getElement(`#${m}-remaining-text`);
            if (typedTextEl) typedTextEl.textContent = '';
            if (currentCharEl) currentCharEl.textContent = '';
            if (remainingTextEl) remainingTextEl.textContent = (m === 'standard') ? '시작 버튼을 눌러주세요' : '';
        });
    },

    showPersonalRecords: function(mode, lang) {
        if (this.elements.personalRecordsArea && this.elements.bestWpmEl && this.elements.avgWpmEl && TypingStats) {
            this.elements.personalRecordsArea.style.display = 'block';
            this.elements.bestWpmEl.textContent = TypingStats.practiceRecords.getBestWPM(mode, lang);
            this.elements.avgWpmEl.textContent = TypingStats.practiceRecords.getAverageWPM(mode, lang);
        }
    },

    // --- Keyboard Visualization ---
    // (Moved from original typing_practice.js, slightly adapted)
    createKeyboardVisualization: function(beginnerType = 'home', lang = 'korean') {
        const container = this.elements.beginnerKeyboardContainer;
        if (!container) return;

        const keyboards = {
            korean: { /* ... KBD DATA ... */ },
            english: { /* ... KBD DATA ... */ }
        };
        // For brevity, assuming keyboards data is filled in as in original file
        keyboards.korean = {
            home: [ ['ㅂ', 'ㅈ', 'ㄷ', 'ㄱ', 'ㅅ', 'ㅛ', 'ㅕ', 'ㅑ', 'ㅐ', 'ㅔ'], ['ㅁ', 'ㄴ', 'ㅇ', 'ㄹ', 'ㅎ', 'ㅗ', 'ㅓ', 'ㅏ', 'ㅣ'], ['ㅋ', 'ㅌ', 'ㅊ', 'ㅍ', 'ㅠ', 'ㅜ', 'ㅡ'] ],
            consonant: [ ['ㅂ', 'ㅈ', 'ㄷ', 'ㄱ', 'ㅅ'], ['ㅁ', 'ㄴ', 'ㅇ', 'ㄹ', 'ㅎ'], ['ㅋ', 'ㅌ', 'ㅊ', 'ㅍ'], ['ㄲ', 'ㄸ', 'ㅃ', 'ㅆ', 'ㅉ'] ],
            vowel: [ ['ㅛ', 'ㅕ', 'ㅑ', 'ㅐ', 'ㅔ'], ['ㅗ', 'ㅓ', 'ㅏ', 'ㅣ'], ['ㅠ', 'ㅜ', 'ㅡ'] ]
        };
        keyboards.english = {
            home: [ ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'], ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'], ['Z', 'X', 'C', 'V', 'B', 'N', 'M'] ],
            consonant: [ ['Q', 'W', 'R', 'T', 'Y', 'P'], ['S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'], ['Z', 'X', 'C', 'V', 'B', 'N', 'M'] ],
            vowel: [ ['A', 'E', 'I', 'O', 'U'] ]
        };

        const keyboardLayout = (keyboards[lang] && keyboards[lang][beginnerType]) || keyboards[lang]['home'];
        container.innerHTML = '';
        keyboardLayout.forEach(row => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'keyboard-row';
            row.forEach(key => {
                const keyDiv = document.createElement('div');
                keyDiv.className = 'key';
                keyDiv.textContent = key;
                keyDiv.dataset.key = key;
                keyDiv.dataset.originalKey = key;
                rowDiv.appendChild(keyDiv);
            });
            container.appendChild(rowDiv);
        });
        if (beginnerType === 'home') { /* Add spacebar */
            const spaceRow = document.createElement('div'); spaceRow.className = 'keyboard-row';
            const spaceKey = document.createElement('div'); spaceKey.className = 'key space';
            spaceKey.textContent = 'SPACE'; spaceKey.dataset.key = ' ';
            spaceRow.appendChild(spaceKey); container.appendChild(spaceRow);
        }
        this.updateKeyboardForCurrentText(this.gameLogicHandler ? this.gameLogicHandler.state.currentText : "");
    },

    updateKeyboardForCurrentText: function(currentText) {
        if (!this.elements.beginnerKeyboardContainer) return;
        this.elements.beginnerKeyboardContainer.querySelectorAll('.key[data-original-key]').forEach(keyDiv => {
            const originalKey = keyDiv.dataset.originalKey;
            keyDiv.textContent = originalKey;
            keyDiv.dataset.key = originalKey;
        });
        const charMapping = { 'ㅒ': 'ㅐ', 'ㅖ': 'ㅔ' };
        for (let char of (currentText || "")) {
            if (charMapping[char]) {
                const targetKey = this.elements.beginnerKeyboardContainer.querySelector(`.key[data-original-key="${charMapping[char]}"]`);
                if (targetKey) {
                    targetKey.textContent = char;
                    targetKey.dataset.key = char;
                }
            }
        }
    },

    createSpecialKeyboardVisualization: function(type = 'numbers') {
        const container = this.elements.specialKeyboardContainer;
        if (!container) return;
        const specialKeyboards = { /* ... KBD DATA ... */ };
        // For brevity
        specialKeyboards.numbers = [ ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'], ['-', '=', '[', ']', '\\', ';', "'", ',', '.', '/'] ];
        specialKeyboards.symbols = [ ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')'], ['_', '+', '{', '}', '|', ':', '"', '<', '>', '?'], ['~', '`'] ];
        specialKeyboards.mixed = [ /* ... */ ]; // Assume filled

        const keyboardLayout = specialKeyboards[type] || specialKeyboards.numbers;
        container.innerHTML = '';
        keyboardLayout.forEach(row => {
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
         if (type === 'mixed') { /* Add spacebar */ }
    },

    highlightCurrentKey: function(mode, char) {
        this.clearKeyHighlight(mode);
        const selector = mode === 'beginner' ?
            `.key[data-key="${char}"]` :
            `.special-key[data-key="${char}"]`;
        const container = mode === 'beginner' ? this.elements.beginnerKeyboardContainer : this.elements.specialKeyboardContainer;
        if (container) {
            const keyEl = container.querySelector(selector);
            if (keyEl) keyEl.classList.add('active');
        }
    },

    clearKeyHighlight: function(mode) {
        const selector = mode === 'beginner' ? '.key.active' : '.special-key.active';
        const container = mode === 'beginner' ? this.elements.beginnerKeyboardContainer : this.elements.specialKeyboardContainer;
        if (container) {
            container.querySelectorAll(selector).forEach(key => key.classList.remove('active'));
        }
    },

    showErrorOnInput: function(mode) { // To be called by GameLogic or main script
        const inputEl = DOMUtils.getElement(`#${mode}-typing-input`);
        if (inputEl) {
            inputEl.classList.add('is-invalid');
            setTimeout(() => {
                if(inputEl.classList.contains('is-invalid')) {
                    inputEl.classList.remove('is-invalid');
                }
            }, 200);
        }
    },

    focusInputElement: function(mode) {
        const inputEl = DOMUtils.getElement(`#${mode}-typing-input`);
        if (inputEl) inputEl.focus();
    },

    disablePracticeInputs: function(mode) {
        const inputEl = DOMUtils.getElement(`#${mode}-typing-input`);
        if (inputEl) inputEl.disabled = true;
    },

    // This would be called from the main script after GameLogic and TypingUI are defined.
    // TypingUI.init(GameLogic);
};

// window.TypingUI = TypingUI; // If needed globally
