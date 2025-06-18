// This file will contain core game mechanics, mode selection,
// text loading logic, timing, and state management
// for the actual typing process.
// console.log("gameLogic.js loaded");

// Assumes TypingStats and TypingUI objects/modules will be available globally or imported.

const GameLogic = {
    state: null, // Will hold the dynamic state of the typing practice
    config: {
        defaultDuration: 5 * 60 * 1000, // 5분 (밀리초)
        showTimer: true,
        textSourcePath: 'typing_texts.json', // Path to the JSON file
        practiceTexts: null, // To store loaded texts

        levels: [
            { name: '초보자', minWPM: 0, color: 'secondary' },
            { name: '입문자', minWPM: 100, color: 'info' }, // Korean WPM (타수) 기준
            { name: '중급자', minWPM: 200, color: 'primary' },
            { name: '숙련자', minWPM: 300, color: 'success' },
            { name: '전문가', minWPM: 400, color: 'warning' },
            { name: '마스터', minWPM: 500, color: 'danger' }
            // TODO: English WPM levels might need different thresholds if WPM calculation differs significantly.
        ],

        achievements: [
            { id: 'first_practice', name: '첫 연습', desc: '첫 타자 연습 완료', icon: 'fa-baby-carriage' },
            { id: 'perfect_accuracy', name: '완벽주의자', desc: '100% 정확도 달성', icon: 'fa-bullseye' },
            { id: 'speed_demon', name: '스피드 데몬', desc: '400타/분 이상 달성', icon: 'fa-rocket' }, // Consider language for threshold
            { id: 'consistent_player', name: '꾸준한 연습', desc: '10회 연습 완료', icon: 'fa-calendar-check' },
            { id: 'marathon_runner', name: '마라토너', desc: '50회 연습 완료', icon: 'fa-running' },
            { id: 'improvement', name: '성장하는 실력', desc: '최고 기록 10% 향상', icon: 'fa-chart-line' }
        ]
    },

    initializeState: function() {
        this.state = {
            initialized: true,
            currentMode: null, // 'free', 'beginner', 'special', 'standard'
            currentSubMode: null, // e.g., 'home', 'consonant' for beginner; 'numbers' for special; 'words' for standard
            currentLevel: null, // e.g., 'easy' for standard
            currentText: '',
            currentIndex: 0,
            startTime: null,
            timerInterval: null,
            errorCount: 0,
            isTyping: false,
            endTime: null,
            currentLang: 'korean', // 'korean' or 'english'
            typedHistory: '', // For more complex analysis if needed
            lastCharCorrect: true,
            eventListeners: new Map() // To keep track of listeners if needed by gameLogic
        };
        // console.log("GameLogic state initialized");
    },

    // Placeholder for loading texts from JSON
    loadPracticeTexts: function(callback) {
        if (this.config.practiceTexts) {
            // console.log("Practice texts already loaded.");
            if (callback) callback();
            return;
        }
        // In a real scenario, use fetch API:
        // fetch(this.config.textSourcePath)
        //   .then(response => response.json())
        //   .then(data => {
        //     this.config.practiceTexts = data;
        //     console.log('Practice texts loaded successfully.');
        //     if (callback) callback();
        //   })
        //   .catch(error => {
        //     console.error('Error loading practice texts:', error);
        //     this.config.practiceTexts = { korean: { free: ["사전 로딩 실패!"] }, english: { free: ["Failed to load texts!"] } }; // Fallback
        //     if (callback) callback(error);
        //   });

        // For now, using a fallback or assuming it's pre-loaded for testing in this environment
        console.warn(`Simulating text loading. In production, ensure ${this.config.textSourcePath} is fetched.`);
        this.config.practiceTexts = { /* Paste structure from typing_texts.json here for fallback/testing if needed, or ensure it's loaded by the main script */
            korean: { free: ["(임시) 안녕하세요", "(임시) 반갑습니다"], beginner: {home: ["ㅁㄴㅇㄹ"]}, special: {numbers: ["12345"]}, standard: {words:{easy:["(임시) 표준단어"]}} },
            english: { free: ["(Test) Hello", "(Test) Welcome"], beginner: {home: ["asdf"]}, special: {numbers: ["12345"]}, standard: {words:{easy:["(Test) word"]}} }
        };
        if (callback) callback();
    },

    selectMode: function(mode, subMode = null, level = null) {
        if (!this.state) this.initializeState();
        this.state.currentMode = mode;
        this.state.currentSubMode = subMode; // e.g., 'home' for beginner, 'numbers' for special
        this.state.currentLevel = level;   // e.g., 'easy' for standard
        this.resetPracticeState();
        // console.log(`Mode selected: ${mode}, SubMode: ${subMode}, Level: ${level}, Lang: ${this.state.currentLang}`);

        // UI should be updated by TypingUI.selectModeDisplay(mode, subMode, level)
        // GameLogic will then call startPractice or similar to load text etc.
    },

    changeLanguage: function(lang) {
        if (this.state.isTyping) {
            // console.log("Cannot change language while typing.");
            return false; // Or show a message to the user
        }
        this.state.currentLang = lang;
        // console.log(`Language changed to: ${lang}`);
        // Potentially reload text or update UI elements via TypingUI
        // If a practice is active but not started, new text should be fetched for the new lang.
        if (this.state.currentMode && !this.state.isTyping) {
            this.preparePracticeText(); // Reload text for the new language
        }
        return true;
    },

    startPractice: function() {
        if (!this.state.currentText) {
            // console.error("No text loaded to start practice.");
            // Try to load text again, or show error via UI
            this.preparePracticeText();
            if (!this.state.currentText) {
                 TypingUI.showError("연습할 텍스트를 불러올 수 없습니다."); // Assuming TypingUI.showError exists
                 return;
            }
        }
        this.state.isTyping = true;
        this.state.startTime = Date.now();
        this.state.endTime = Date.now() + this.config.defaultDuration;
        this.state.currentIndex = 0;
        this.state.errorCount = 0;
        this.state.typedHistory = "";

        // TypingUI should handle UI changes like disabling inputs, focusing, showing text etc.
        // TypingUI.startPracticeUI(this.state.currentText);

        // Start timer (could be handled by TypingUI or here)
        if (this.state.timerInterval) clearInterval(this.state.timerInterval);
        this.state.timerInterval = setInterval(() => {
            const stats = TypingStats.calculateWPMAndAccuracy(this.state.currentIndex, this.state.errorCount, Date.now() - this.state.startTime, this.state.currentLang);
            const timeElapsed = Date.now() - this.state.startTime;
            const timeLeft = this.state.endTime - Date.now();

            // TypingUI.updateStatsDisplay(stats.wpm, stats.accuracy, timeElapsed, timeLeft);

            if (timeLeft <= 0) {
                this.completePractice();
            }
        }, 100);
        // console.log("Practice started");
    },

    resetPracticeState: function() {
        this.state.isTyping = false;
        if (this.state.timerInterval) {
            clearInterval(this.state.timerInterval);
            this.state.timerInterval = null;
        }
        this.state.currentText = '';
        this.state.currentIndex = 0;
        this.state.errorCount = 0;
        this.state.startTime = null;
        this.state.endTime = null;
        this.state.typedHistory = "";
        // console.log("Practice state reset");
        // UI should be reset by TypingUI.resetPracticeUI();
    },

    preparePracticeText: function() {
        if (!this.config.practiceTexts) {
            // console.error("Practice texts not loaded.");
            this.state.currentText = "오류: 연습 텍스트를 불러오지 못했습니다.";
            return;
        }
        const langTexts = this.config.practiceTexts[this.state.currentLang];
        if (!langTexts) {
            this.state.currentText = `오류: '${this.state.currentLang}' 언어 텍스트가 없습니다.`;
            return;
        }

        let textsArray;
        switch (this.state.currentMode) {
            case 'free':
                textsArray = langTexts.free;
                break;
            case 'beginner':
                textsArray = langTexts.beginner && langTexts.beginner[this.state.currentSubMode || 'home'];
                break;
            case 'special':
                textsArray = langTexts.special && langTexts.special[this.state.currentSubMode || 'numbers'];
                break;
            case 'standard':
                textsArray = langTexts.standard &&
                             langTexts.standard[this.state.currentSubMode || 'words'] &&
                             langTexts.standard[this.state.currentSubMode || 'words'][this.state.currentLevel || 'easy'];
                break;
            default:
                textsArray = ["오류: 알 수 없는 연습 모드입니다."];
        }

        if (textsArray && textsArray.length > 0) {
            this.state.currentText = textsArray[Math.floor(Math.random() * textsArray.length)];
        } else {
            this.state.currentText = `오류: '${this.state.currentMode}/${this.state.currentSubMode}/${this.state.currentLevel}'에 대한 텍스트가 없습니다.`;
            console.warn(`No texts found for ${this.state.currentLang} -> ${this.state.currentMode} -> ${this.state.currentSubMode} -> ${this.state.currentLevel}`);
        }
        // TypingUI.displayText(this.state.currentText, 0); // Initial display
    },

    handleCharacterTyped: function(typedChar) {
        if (!this.state.isTyping || !this.state.currentText) return;

        const expectedChar = this.state.currentText[this.state.currentIndex];
        this.state.typedHistory += typedChar;

        if (typedChar === expectedChar) {
            this.state.currentIndex++;
            this.state.lastCharCorrect = true;
            // TypingUI.updateTypedDisplay(this.state.currentText, this.state.currentIndex, true);
        } else {
            this.state.errorCount++;
            this.state.lastCharCorrect = false;
            // TypingUI.updateTypedDisplay(this.state.currentText, this.state.currentIndex, false);
            // TypingUI.signalError(); // e.g., shake input or change color
        }

        const stats = TypingStats.calculateWPMAndAccuracy(this.state.currentIndex, this.state.errorCount, Date.now() - this.state.startTime, this.state.currentLang);
        // TypingUI.updateStatsDisplay(stats.wpm, stats.accuracy, Date.now() - this.state.startTime, this.state.endTime - Date.now());


        if (this.state.currentIndex === this.state.currentText.length) {
            // Text completed
            // Option 1: Auto-load next text (current behavior in some modes)
            // Option 2: Wait for user to click "next" or similar
            // Option 3: End practice for this segment
            // console.log("Text completed. Current WPM:", stats.wpm, "Accuracy:", stats.accuracy);
            this.state.isTyping = false; // Pause typing until next text or action
            // TypingUI.textCompletedUI();
            this.preparePracticeText(); // Prepare next text
            // To auto-start next text:
            // setTimeout(() => { this.startPractice(); TypingUI.focusInput(); }, 1000); // Delay before starting next
        }
    },

    // Simplified input handler for modes that take full input line
    handleLineTyped: function(typedLine) {
        if (!this.state.isTyping || !this.state.currentText) return;

        let errorsInLine = 0;
        for (let i = 0; i < typedLine.length; i++) {
            if (i < this.state.currentText.length && typedLine[i] !== this.state.currentText[i]) {
                errorsInLine++;
            }
        }
        // If typed line is longer than current text, count extra chars as errors
        if (typedLine.length > this.state.currentText.length) {
            errorsInLine += (typedLine.length - this.state.currentText.length);
        }

        this.state.errorCount += errorsInLine;
        this.state.currentIndex = Math.min(typedLine.length, this.state.currentText.length); // Number of matched/attempted chars
        this.state.typedHistory += typedLine + "\\n";

        // TypingUI.updateFullLineDisplay(this.state.currentText, typedLine, errorsInLine > 0);

        const stats = TypingStats.calculateWPMAndAccuracy(this.state.currentIndex, this.state.errorCount, Date.now() - this.state.startTime, this.state.currentLang);
        // TypingUI.updateStatsDisplay(stats.wpm, stats.accuracy, Date.now() - this.state.startTime, this.state.endTime - Date.now());

        if (typedLine.trim() === this.state.currentText.trim()) { // Or more precise check
             // console.log("Line completed. Current WPM:", stats.wpm, "Accuracy:", stats.accuracy);
            this.state.isTyping = false;
            // TypingUI.textCompletedUI();
            this.preparePracticeText();
        }
    },

    completePractice: function() {
        if (this.state.timerInterval) {
            clearInterval(this.state.timerInterval);
            this.state.timerInterval = null;
        }
        this.state.isTyping = false;

        const finalStats = TypingStats.calculateWPMAndAccuracy(this.state.currentIndex, this.state.errorCount, this.state.endTime - this.state.startTime, this.state.currentLang);

        // TypingStats.practiceRecords.save(this.state.currentMode, finalStats.wpm, finalStats.accuracy, this.state.currentLang);
        // TypingStats.achievementSystem.checkAchievements(finalStats.wpm, finalStats.accuracy, this.state.currentMode, this.state.currentLang);

        // TypingUI.showResultsModal(finalStats.wpm, finalStats.accuracy, this.state.currentLang);
        // console.log("Practice completed. Final WPM:", finalStats.wpm, "Accuracy:", finalStats.accuracy);
    },

    // Main initialization for the entire typing practice system
    init: function() {
        this.initializeState();
        TypingStats.initialize(this.config); // Pass config to TypingStats
        this.loadPracticeTexts(() => {
            // console.log("GameLogic initialized and texts (simulated) loaded.");
            // TypingUI.init(this); // Pass GameLogic instance to UI for callbacks
        });
    }
};

// Example of how it might be initialized:
// GameLogic.init();
// window.GameLogic = GameLogic; // If needed globally
