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
            testFn();
            testResults.push({ description, status: 'PASSED' });
            testsPassed++;
        } catch (e) {
            testResults.push({ description, status: 'FAILED', error: e.toString(), stack: e.stack });
        }
        currentTestName = "";
    }

    function displayResults() {
        console.log(`\n--- TypingStats Test Results ---`);
        console.log(`Total tests: ${testsRun}, Passed: ${testsPassed}, Failed: ${testsRun - testsPassed}`);
        testResults.forEach(result => {
            if (result.status === 'PASSED') {
                console.log(`✅ PASSED: ${result.description}`);
            } else {
                console.error(`❌ FAILED: ${result.description}`);
                console.error(`   Error: ${result.error}`);
            }
        });
        console.log("--- End TypingStats Test Results ---\n");
        if (typeof document !== 'undefined' && document.getElementById) {
            const resultsContainer = document.getElementById('test-results-typingstats');
            if (resultsContainer) {
                let html = `<h3>TypingStats Test Results</h3><p>Total: ${testsRun}, Passed: ${testsPassed}, Failed: ${testsRun - testsPassed}</p><ul>`;
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
    function assertEqual(actual, expected, message, tolerance = 1e-9) {
        if (typeof actual === 'number' && typeof expected === 'number') {
            if (Math.abs(actual - expected) > tolerance) {
                throw new Error(message || `Expected ${expected} (approx.), but got ${actual}`);
            }
        } else if (actual !== expected) {
            throw new Error(message || `Expected "${expected}", but got "${actual}"`);
        }
    }
    function assertDeepEqual(actual, expected, message) {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
            throw new Error(message || `Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`);
        }
    }

    // --- Mocking & Setup ---
    const mockLocalStorage = (() => {
        let store = {};
        return {
            getItem: key => store[key] || null,
            setItem: (key, value) => { store[key] = String(value); },
            removeItem: key => { delete store[key]; },
            clear: () => { store = {}; }
        };
    })();

    // Make StorageUtils use the mock
    global.StorageUtils = {
        save: (key, value) => { mockLocalStorage.setItem(key, JSON.stringify(value)); return true; },
        load: (key, defaultValue = null) => {
            const item = mockLocalStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        },
        remove: key => { mockLocalStorage.removeItem(key); return true; }
    };

    // Mock showAchievementNotification
    let lastNotification = null;
    global.showAchievementNotification = (achievement) => {
        lastNotification = achievement;
        // console.log("Mock Notification:", achievement);
    };


    // --- Load TypingStats ---
    let CurrentTypingStats;
    if (typeof TypingStats !== 'undefined') { CurrentTypingStats = TypingStats; }
    else if (typeof require !== 'undefined') { CurrentTypingStats = require('../js/typingStats.js').TypingStats; } // Assuming it might export object directly
    else {
        // Fallback if module loading is not straightforward in test env
        console.error("TypingStats module not directly found. Attempting to use a self-contained copy or ensure it's loaded globally.");
        // For this environment, we'll assume TypingStats is made available globally by the runner if not using require.
        // If it's not, these tests will fail to find CurrentTypingStats.
    }
     if (!CurrentTypingStats) {
        console.error("TypingStats is not available. Tests cannot run.");
        return;
    }


    // Mock config for TypingStats
    const mockTypingConfig = {
        levels: [
            { name: '초보자', minWPM: 0, color: 'secondary' },
            { name: '입문자', minWPM: 100, color: 'info' },
            { name: '중급자', minWPM: 200, color: 'primary' },
            { name: '전문가', minWPM: 400, color: 'danger' }
        ],
        achievements: [
            { id: 'first_practice', name: '첫 연습', desc: '첫 타자 연습 완료', icon: 'fa-baby-carriage' },
            { id: 'perfect_accuracy', name: '완벽주의자', desc: '100% 정확도 달성', icon: 'fa-bullseye' },
            { id: 'speed_demon', name: '스피드 데몬', desc: '400타/분 이상 달성', icon: 'fa-rocket' }
        ]
    };
    CurrentTypingStats.initialize(mockTypingConfig);


    // --- Test Cases ---

    runTest("calculateWPMAndAccuracy: Basic English WPM and Accuracy", () => {
        // 100 chars, 0 errors, 1 minute (60000 ms) -> English WPM = (100/5)/1 = 20 WPM, 100% acc
        let stats = CurrentTypingStats.calculateWPMAndAccuracy(100, 0, 60000, 'english');
        assertEqual(stats.wpm, 20, "English WPM basic");
        assertEqual(stats.accuracy, 100, "English Accuracy basic");

        // 100 chars, 10 errors, 0.5 minutes (30000 ms) -> English WPM = (100/5)/0.5 = 40 WPM
        // Accuracy = (100 / (100+10)) * 100 = (100/110)*100 = 90.90... -> 91%
        stats = CurrentTypingStats.calculateWPMAndAccuracy(100, 10, 30000, 'english');
        assertEqual(stats.wpm, 40, "English WPM with errors");
        assertEqual(stats.accuracy, 91, "English Accuracy with errors"); // Rounded
    });

    runTest("calculateWPMAndAccuracy: Basic Korean 타수 and Accuracy", () => {
        // 100 Hangul chars, 0 errors, 1 minute -> Korean 타수 = (100 * 2.5) / 1 = 250 타/분
        let stats = CurrentTypingStats.calculateWPMAndAccuracy(100, 0, 60000, 'korean');
        assertEqual(stats.wpm, 250, "Korean 타수 basic");
        assertEqual(stats.accuracy, 100, "Korean Accuracy basic");

        // 200 Hangul chars, 20 errors, 2 minutes (120000 ms) -> Korean 타수 = (200 * 2.5) / 2 = 250 타/분
        // Accuracy = (200 / (200+20)) * 100 = (200/220)*100 = 90.90... -> 91%
        stats = CurrentTypingStats.calculateWPMAndAccuracy(200, 20, 120000, 'korean');
        assertEqual(stats.wpm, 250, "Korean 타수 with errors");
        assertEqual(stats.accuracy, 91, "Korean Accuracy with errors");
    });

    runTest("calculateWPMAndAccuracy: Edge cases (zero time, zero chars)", () => {
        let stats = CurrentTypingStats.calculateWPMAndAccuracy(100, 0, 0, 'english'); // Zero time
        assertEqual(stats.wpm, 0, "WPM with zero time");
        assertEqual(stats.accuracy, 100, "Accuracy with zero time (no attempts beyond typed)");

        stats = CurrentTypingStats.calculateWPMAndAccuracy(0, 5, 60000, 'english'); // Zero chars typed, 5 errors
        assertEqual(stats.wpm, 0, "WPM with zero chars typed");
        assertEqual(stats.accuracy, 0, "Accuracy with zero chars typed and errors");

        stats = CurrentTypingStats.calculateWPMAndAccuracy(0, 0, 60000, 'english'); // Zero chars, zero errors
        assertEqual(stats.wpm, 0, "WPM with zero chars, zero errors");
        assertEqual(stats.accuracy, 100, "Accuracy with zero chars, zero errors (no attempts)");
    });

    runTest("practiceRecords: Save and Load", () => {
        mockLocalStorage.clear(); // Clear storage before test
        CurrentTypingStats.practiceRecords.save('free', 300, 95, 'korean');
        CurrentTypingStats.practiceRecords.save('words', 250, 98, 'english');
        const records = CurrentTypingStats.practiceRecords.load();
        assertEqual(records.length, 2, "Should have 2 records");
        assertEqual(records[0].wpm, 300, "First record WPM");
        assertEqual(records[1].lang, 'english', "Second record lang");
    });

    runTest("practiceRecords: getBestWPM and getAverageWPM", () => {
        mockLocalStorage.clear();
        CurrentTypingStats.practiceRecords.save('words', 100, 90, 'korean');
        CurrentTypingStats.practiceRecords.save('words', 150, 95, 'korean');
        CurrentTypingStats.practiceRecords.save('words', 120, 92, 'korean');
        CurrentTypingStats.practiceRecords.save('sentences', 200, 90, 'korean');
        CurrentTypingStats.practiceRecords.save('words', 50, 80, 'english');

        assertEqual(CurrentTypingStats.practiceRecords.getBestWPM('words', 'korean'), 150, "Best WPM for words/korean");
        assertEqual(CurrentTypingStats.practiceRecords.getAverageWPM('words', 'korean'), 123, "Average WPM for words/korean (100+150+120)/3=123.33"); // Rounded
        assertEqual(CurrentTypingStats.practiceRecords.getBestWPM('sentences', 'korean'), 200, "Best WPM for sentences/korean");
        assertEqual(CurrentTypingStats.practiceRecords.getAverageWPM('words', 'english'), 50, "Average WPM for words/english");
        assertEqual(CurrentTypingStats.practiceRecords.getBestWPM('nonexistent', 'korean'), 0, "Best WPM for non-existent mode");
    });

    runTest("practiceRecords: Max records limit (100)", () => {
        mockLocalStorage.clear();
        for(let i=0; i<105; i++) {
            CurrentTypingStats.practiceRecords.save('free', 100+i, 90, 'korean');
        }
        const records = CurrentTypingStats.practiceRecords.load();
        assertEqual(records.length, 100, "Should store max 100 records");
        assertEqual(records[0].wpm, 105, "Oldest record (WPM 100) should be shifted out, WPM 105 is first of remaining");
    });

    runTest("achievementSystem: Unlock and check achievements", () => {
        mockLocalStorage.clear(); // Clear achievements and records
        CurrentTypingStats.practiceRecords.save('free', 10, 90, 'korean'); // This is the first practice

        // Trigger checkAchievements after the first practice
        CurrentTypingStats.achievementSystem.checkAchievements(10, 90, 'free', 'korean');
        let unlocked = CurrentTypingStats.achievementSystem.getUnlocked();
        assert(unlocked.includes('first_practice'), "First practice achievement");

        CurrentTypingStats.practiceRecords.save('free', 20, 100, 'korean'); // Second practice, perfect accuracy
        CurrentTypingStats.achievementSystem.checkAchievements(20, 100, 'free', 'korean');
        unlocked = CurrentTypingStats.achievementSystem.getUnlocked();
        assert(unlocked.includes('perfect_accuracy'), "Perfect accuracy achievement");

        CurrentTypingStats.practiceRecords.save('free', 450, 95, 'korean'); // High WPM
        CurrentTypingStats.achievementSystem.checkAchievements(450, 95, 'free', 'korean');
        unlocked = CurrentTypingStats.achievementSystem.getUnlocked();
        assert(unlocked.includes('speed_demon'), "Speed demon achievement");

        // Test unlocking an already unlocked achievement
        assert(!CurrentTypingStats.achievementSystem.unlock('first_practice'), "Should return false for already unlocked");
    });

    runTest("getUserLevel: Determine user level based on WPM", () => {
        assertEqual(CurrentTypingStats.getUserLevel(50).name, '초보자', "Level for 50 WPM");
        assertEqual(CurrentTypingStats.getUserLevel(150).name, '입문자', "Level for 150 WPM");
        assertEqual(CurrentTypingStats.getUserLevel(250).name, '중급자', "Level for 250 WPM");
        assertEqual(CurrentTypingStats.getUserLevel(450).name, '전문가', "Level for 450 WPM");
    });

    runTest("TypingStats.initialize: Ensure config is set", () => {
        const tempConfig = { levels: [{ name: 'TestLevel', minWPM: 0 }], achievements: [] };
        CurrentTypingStats.initialize(tempConfig);
        assertDeepEqual(CurrentTypingStats.config.levels, tempConfig.levels, "Config levels should be set by initialize");
        // Reset to mockTypingConfig for other tests
        CurrentTypingStats.initialize(mockTypingConfig);
    });


    // --- Display Results ---
    displayResults();
})();
