(function() {
    'use strict';

    // --- Test Runner Setup ---
    const testResults = [];
    let testsRun = 0;
    let testsPassed = 0;
    let currentTestName = "";

    function runTest(description, testFn) {
        currentTestName = description;
        testsRun++;
        try {
            // Reset/Re-initialize GameLogic state before each test for isolation
            if (typeof GameLogic !== 'undefined' && typeof GameLogic.init === 'function') {
                 // Mock parts of TypingStats and TypingUI that GameLogic might call during init or later
                global.TypingStats = MockTypingStats;
                global.TypingUI = MockTypingUI; // Assuming TypingUI might be called by GameLogic
                GameLogic.init(); // This re-initializes state and loads mock texts
            }
            testFn();
            testResults.push({ description, status: 'PASSED' });
            testsPassed++;
        } catch (e) {
            testResults.push({ description, status: 'FAILED', error: e.toString(), stack: e.stack });
        }
        currentTestName = "";
    }

    function displayResults() {
        console.log(`\n--- GameLogic Test Results ---`);
        console.log(`Total tests: ${testsRun}, Passed: ${testsPassed}, Failed: ${testsRun - testsPassed}`);
        testResults.forEach(result => {
            if (result.status === 'PASSED') {
                console.log(`✅ PASSED: ${result.description}`);
            } else {
                console.error(`❌ FAILED: ${result.description}`);
                console.error(`   Error: ${result.error}`);
            }
        });
        console.log("--- End GameLogic Test Results ---\n");
        if (typeof document !== 'undefined' && document.getElementById) {
            const resultsContainer = document.getElementById('test-results-gamelogic');
            if (resultsContainer) {
                let html = `<h3>GameLogic Test Results</h3><p>Total: ${testsRun}, Passed: ${testsPassed}, Failed: ${testsRun - testsPassed}</p><ul>`;
                testResults.forEach(result => {
                    html += `<li style="color: ${result.status === 'PASSED' ? 'green' : 'red'};"><strong>${result.status}:</strong> ${result.description}${result.error ? `<br><pre>${result.error}</pre>` : ''}</li>`;
                });
                html += "</ul>";
                resultsContainer.innerHTML = html;
            }
        }
    }

    function assert(condition, message) {
        if (!condition) throw new Error(message || "Assertion failed in test: " + currentTestName);
    }
    function assertEqual(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(message || `Expected "${expected}", but got "${actual}"`);
        }
    }
    function assertDeepEqual(actual, expected, message) {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
            throw new Error(message || `Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`);
        }
    }

    // --- Mocks ---
    const MockTypingStats = {
        initialize: function(config) { this.config = config; },
        calculateWPMAndAccuracy: function(chars, errors, timeMs, lang) {
            const minutes = timeMs / 60000;
            let wpm = 0;
            if (minutes > 0) {
                wpm = lang === 'korean' ? Math.round((chars * 2.5) / minutes) : Math.round((chars / 5) / minutes);
            }
            const accuracy = (chars + errors) > 0 ? Math.round((chars / (chars + errors)) * 100) : 100;
            return { wpm, accuracy };
        },
        practiceRecords: { save: () => {}, load: () => [], getBestWPM: () => 0, getAverageWPM: () => 0 },
        achievementSystem: { checkAchievements: () => {}, unlock: () => {} },
        getUserLevel: () => ({ name: '테스트용레벨', minWPM: 0 })
    };

    const MockTypingUI = {
        init: function() {},
        showError: function(message) { console.log("MockTypingUI.showError:", message); },
        // Add other methods GameLogic might call if they affect its state or flow directly
        // For pure state tests of GameLogic, most UI calls don't need complex mocks
    };

    // Timer mocks for testing intervals (basic)
    let mockIntervalId = 1;
    let mockIntervals = {};
    global.setInterval = (fn, delay) => {
        const id = mockIntervalId++;
        mockIntervals[id] = { fn, delay, running: true };
        // console.log(`Mock setInterval: id=${id}, delay=${delay}`);
        return id;
    };
    global.clearInterval = (id) => {
        if (mockIntervals[id]) {
            mockIntervals[id].running = false;
            // console.log(`Mock clearInterval: id=${id}`);
        }
    };
    function advanceMockTimeouts(duration) { // Basic way to simulate time passing for intervals
        for(const id in mockIntervals) {
            if(mockIntervals[id].running) {
                // This is a simplification; real timer mocks are more complex
                // For now, just call the function if we "advance" time past its delay
                 if (duration >= mockIntervals[id].delay) mockIntervals[id].fn();
            }
        }
    }
    function resetMockIntervals() {
        mockIntervals = {};
        mockIntervalId = 1;
    }


    // --- Load GameLogic ---
    // Assuming GameLogic is made global by its script, or use require if in Node
    if (typeof GameLogic === 'undefined') {
        if (typeof require !== 'undefined') {
            // This assumes gameLogic.js exports the GameLogic object
            // For this test, ensure GameLogic.js has `module.exports = GameLogic;` if run by Node
            // const logicModule = require('../js/gameLogic.js');
            // GameLogic = logicModule.GameLogic; // If it's wrapped
            console.error("GameLogic require not set up for this test file structure, ensure it's global or adjust loader.");
            return;
        } else {
            console.error("GameLogic not found globally. Tests cannot run.");
            return;
        }
    }

    // Provide mock texts directly to GameLogic's config for testing
    GameLogic.config.practiceTexts = {
        korean: {
            free: ["안녕하세요", "반갑습니다"],
            beginner: { home: ["ㅁㄴㅇㄹ", "ㅏㅓㅗㅜ"], consonant: ["ㄱㄴㄷㄹ"], vowel: ["ㅏㅑㅓㅕ"] },
            special: { numbers: ["12345", "09876"], symbols: ["!@#", "$%^"] },
            standard: {
                words: { easy: ["단어하나", "쉬운단어"], medium: ["중간단어"], hard: ["어려운단어"] },
                sentences: { easy: ["쉬운 문장입니다.", "네 그렇습니다."], medium: ["중간 난이도 문장."], hard: ["꽤 어려운 문장입니다."] }
            }
        },
        english: {
            free: ["Hello", "Welcome"],
            beginner: { home: ["asdf", "jkl;"], consonant: ["qwrt"], vowel: ["aeio"] },
            special: { numbers: ["123", "789"], symbols: ["!@#", "$%^"] },
            standard: {
                words: { easy: ["easyword", "another"], medium: ["mediumtext"], hard: ["difficulttext"] },
                sentences: { easy: ["This is easy.", "Yes it is."], medium: ["Medium sentence here."], hard: ["A very hard sentence."] }
            }
        }
    };
    // Initialize TypingStats with GameLogic's config (which now contains achievements, levels)
    MockTypingStats.initialize(GameLogic.config);


    // --- Test Cases ---
    runTest("initializeState: Should set initial values", () => {
        // GameLogic.init() is called in runTest setup
        assert(GameLogic.state !== null, "State should be initialized");
        assertEqual(GameLogic.state.currentLang, 'korean', "Default language");
        assertEqual(GameLogic.state.isTyping, false, "Initially not typing");
        assertEqual(GameLogic.state.currentText, '', "Initial text is empty");
    });

    runTest("selectMode: Should update mode and reset state", () => {
        GameLogic.selectMode('free');
        assertEqual(GameLogic.state.currentMode, 'free', "Mode should be 'free'");
        assertEqual(GameLogic.state.isTyping, false, "isTyping should be false after mode select");
        // preparePracticeText is called within selectMode indirectly via resetPracticeState -> preparePracticeText (if lang changes or text needed)
        // For this test, let's assume preparePracticeText is called after selectMode by UI/orchestrator
    });

    runTest("preparePracticeText: Should load text for 'free' mode, 'korean'", () => {
        GameLogic.changeLanguage('korean');
        GameLogic.selectMode('free');
        GameLogic.preparePracticeText();
        assert(GameLogic.config.practiceTexts.korean.free.includes(GameLogic.state.currentText), "Text should be from korean.free");
    });

    runTest("preparePracticeText: Should load text for 'beginner' 'home' mode, 'english'", () => {
        GameLogic.changeLanguage('english');
        GameLogic.selectMode('beginner', 'home');
        GameLogic.preparePracticeText();
        assert(GameLogic.config.practiceTexts.english.beginner.home.includes(GameLogic.state.currentText), "Text for english.beginner.home");
    });

    runTest("preparePracticeText: Should handle unknown mode gracefully", () => {
        GameLogic.selectMode('unknown_mode');
        GameLogic.preparePracticeText();
        assert(GameLogic.state.currentText.startsWith("오류:"), "Error message for unknown mode");
    });

    runTest("changeLanguage: Should update language and reload text if mode is set", () => {
        GameLogic.selectMode('free');
        GameLogic.preparePracticeText(); // Load Korean text first
        const textBefore = GameLogic.state.currentText;

        GameLogic.changeLanguage('english');
        // preparePracticeText is called inside changeLanguage if mode is set
        assertNotEqual(GameLogic.state.currentText, textBefore, "Text should change after language change");
        assert(GameLogic.config.practiceTexts.english.free.includes(GameLogic.state.currentText), "Text should be from english.free");
        assertEqual(GameLogic.state.currentLang, 'english');
    });

    function assertNotEqual(actual, unexpected, message) {
        if (actual === unexpected) {
            throw new Error(message || `Expected actual ("${actual}") not to equal unexpected ("${unexpected}")`);
        }
    }


    runTest("startPractice: Should set typing state and timers", () => {
        GameLogic.selectMode('free');
        GameLogic.preparePracticeText();
        assert(GameLogic.state.currentText.length > 0, "currentText should be loaded");
        GameLogic.startPractice();

        assertEqual(GameLogic.state.isTyping, true, "isTyping should be true");
        assert(GameLogic.state.startTime !== null, "startTime should be set");
        assert(GameLogic.state.endTime !== null, "endTime should be set");
        assert(GameLogic.state.timerInterval !== null, "timerInterval should be set");

        clearInterval(GameLogic.state.timerInterval); // Clean up timer
        GameLogic.state.timerInterval = null;
    });

    runTest("handleCharacterTyped: Correct character", () => {
        GameLogic.selectMode('free');
        GameLogic.state.currentText = "abc"; // Override for predictable test
        GameLogic.startPractice();

        GameLogic.handleCharacterTyped('a');
        assertEqual(GameLogic.state.currentIndex, 1, "currentIndex after 'a'");
        assertEqual(GameLogic.state.errorCount, 0, "errorCount after 'a'");
        assert(GameLogic.state.lastCharCorrect, "lastCharCorrect after 'a'");

        GameLogic.handleCharacterTyped('b');
        assertEqual(GameLogic.state.currentIndex, 2, "currentIndex after 'b'");

        clearInterval(GameLogic.state.timerInterval);
    });

    runTest("handleCharacterTyped: Incorrect character", () => {
        GameLogic.selectMode('free');
        GameLogic.state.currentText = "abc";
        GameLogic.startPractice();

        GameLogic.handleCharacterTyped('x');
        assertEqual(GameLogic.state.currentIndex, 0, "currentIndex after 'x' (incorrect)");
        assertEqual(GameLogic.state.errorCount, 1, "errorCount after 'x'");
        assert(!GameLogic.state.lastCharCorrect, "lastCharCorrect after 'x'");

        clearInterval(GameLogic.state.timerInterval);
    });

    runTest("handleCharacterTyped: Completing text", () => {
        GameLogic.selectMode('free');
        GameLogic.state.currentText = "hi";
        GameLogic.startPractice();
        const oldText = GameLogic.state.currentText;

        GameLogic.handleCharacterTyped('h');
        GameLogic.handleCharacterTyped('i');

        assertEqual(GameLogic.state.currentIndex, 2, "currentIndex after 'hi'");
        assertEqual(GameLogic.state.isTyping, false, "isTyping should be false after text completion (before timeout for next)");
        // preparePracticeText is called, so text should change
        assertNotEqual(GameLogic.state.currentText, oldText, "New text should be prepared after completion");

        clearInterval(GameLogic.state.timerInterval);
    });

    runTest("handleLineTyped: Correct line", () => {
        GameLogic.selectMode('free');
        GameLogic.state.currentText = "hello world";
        GameLogic.startPractice();

        GameLogic.handleLineTyped("hello world");
        assertEqual(GameLogic.state.currentIndex, 11, "currentIndex after correct line");
        assertEqual(GameLogic.state.errorCount, 0, "errorCount after correct line");
        assertEqual(GameLogic.state.isTyping, false, "isTyping false after correct line completion");
        clearInterval(GameLogic.state.timerInterval);
    });

    runTest("handleLineTyped: Incorrect line", () => {
        GameLogic.selectMode('free');
        GameLogic.state.currentText = "hello world";
        GameLogic.startPractice();

        GameLogic.handleLineTyped("hello wirld"); // 1 error at 'i'
        assertEqual(GameLogic.state.currentIndex, 11, "currentIndex after incorrect line (length of typed)");
        assertEqual(GameLogic.state.errorCount, 1, "errorCount after incorrect line");
        assertEqual(GameLogic.state.isTyping, true, "isTyping should still be true if line not fully matched or completed");

        clearInterval(GameLogic.state.timerInterval);
    });


    runTest("completePractice: Should stop typing and clear timer", () => {
        GameLogic.selectMode('free');
        GameLogic.preparePracticeText();
        GameLogic.startPractice(); // This starts an interval
        assert(GameLogic.state.timerInterval !== null, "Timer should be active before complete");

        GameLogic.completePractice();
        assertEqual(GameLogic.state.isTyping, false, "isTyping should be false after completePractice");
        assert(GameLogic.state.timerInterval === null, "timerInterval should be null after completePractice");
    });

    runTest("Timer Logic: completePractice should be called when time runs out", (done) => {
        resetMockIntervals();
        GameLogic.config.defaultDuration = 100; // Short duration for test
        GameLogic.selectMode('free');
        GameLogic.preparePracticeText();
        GameLogic.startPractice();

        let completeCalled = false;
        const originalCompletePractice = GameLogic.completePractice;
        GameLogic.completePractice = () => {
            completeCalled = true;
            originalCompletePractice.call(GameLogic); // Call original to clear interval etc.
        };

        setTimeout(() => {
            advanceMockTimeouts(100); // Simulate the interval firing after time is up
            assert(completeCalled, "completePractice should have been called by the timer");
            GameLogic.completePractice = originalCompletePractice; // Restore
            GameLogic.config.defaultDuration = 5 * 60 * 1000; // Restore original duration
            resetMockIntervals();
            if(done) done(); else displayResults();
        }, 150);
    });


    // --- Display Results ---
    // displayResults(); // Called by the async test 'Timer Logic' when it's done.
})();
