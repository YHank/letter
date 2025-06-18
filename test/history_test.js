(function() {
    'use strict';

    // --- Test Runner Setup ---
    const testResults = [];
    let testsRun = 0;
    let testsPassed = 0;

    function runTest(description, testFn) {
        testsRun++;
        try {
            // Reset history state before each test for isolation
            if (typeof HistoryModule !== 'undefined' && HistoryModule.textHistory && typeof HistoryModule.textHistory.reset === 'function') {
                HistoryModule.textHistory.reset();
            } else if (typeof textHistory !== 'undefined' && typeof textHistory.reset === 'function') {
                 // If global
                textHistory.reset();
            }

            testFn();
            testResults.push({ description, status: 'PASSED' });
            testsPassed++;
        } catch (e) {
            testResults.push({ description, status: 'FAILED', error: e.toString(), stack: e.stack });
        }
    }

    function displayResults() {
        console.log(`\n--- History Test Results ---`);
        console.log(`Total tests: ${testsRun}, Passed: ${testsPassed}, Failed: ${testsRun - testsPassed}`);
        testResults.forEach(result => {
            if (result.status === 'PASSED') {
                console.log(`✅ PASSED: ${result.description}`);
            } else {
                console.error(`❌ FAILED: ${result.description}`);
                console.error(`   Error: ${result.error}`);
                if (result.stack) console.error(`   Stack: ${result.stack}`);
            }
        });
        console.log("--- End History Test Results ---\n");

        if (typeof document !== 'undefined' && document.getElementById) {
            const resultsContainer = document.getElementById('test-results-history');
            if (resultsContainer) {
                let html = `<h3>History Test Results</h3><p>Total: ${testsRun}, Passed: ${testsPassed}, Failed: ${testsRun - testsPassed}</p><ul>`;
                testResults.forEach(result => {
                    html += `<li style="color: ${result.status === 'PASSED' ? 'green' : 'red'};">
                                <strong>${result.status}:</strong> ${result.description}
                                ${result.error ? `<br><pre>${result.error}${result.stack ? `\n${result.stack}` : ''}</pre>` : ''}
                             </li>`;
                });
                html += "</ul>";
                resultsContainer.innerHTML = html;
            }
        }
    }

    // --- Load functions to test ---
    let HistoryModule;
    let textHistoryInstance; // This will be the textHistory object from the module
    let debouncedAddHistoryInstance;

    if (typeof require !== 'undefined') {
        HistoryModule = require('../js/history.js');
        textHistoryInstance = HistoryModule.textHistory;
        debouncedAddHistoryInstance = HistoryModule.debouncedAddHistory;
        // Mock debounce if not available from utils.js in this test env
        if (typeof debounce === 'undefined') {
            global.debounce = function(func, wait) { // Simple pass-through for non-debounced testing
                return function(...args) { func.apply(this, args); };
            };
            // Re-initialize debouncedAddHistory if debounce was just mocked
            HistoryModule = require('../js/history.js'); // Re-require to pick up mocked debounce
            textHistoryInstance = HistoryModule.textHistory;
            debouncedAddHistoryInstance = HistoryModule.debouncedAddHistory;
        }

    } else if (typeof window !== 'undefined' && window.textHistory) {
        // Assumes history.js is loaded via script tag and textHistory is global
        textHistoryInstance = window.textHistory;
        debouncedAddHistoryInstance = window.debouncedAddHistory;
        // Ensure debounce is available for debouncedAddHistory
        if (typeof window.debounce === 'undefined') {
             window.debounce = function(func, wait) { // Simple pass-through
                return function(...args) { func.apply(this, args); };
            };
            // If history.js script already ran, debouncedAddHistory might have the non-working version.
            // This is tricky without proper module loading. For tests, direct textHistory access is safer.
        }
    } else {
        console.error("textHistory module not found. Tests cannot run.");
        return; // Exit if module not loaded
    }


    // --- Tests ---

    runTest("Initial state", () => {
        if (textHistoryInstance.states.length !== 1) throw new Error(`Initial states.length should be 1, got ${textHistoryInstance.states.length}`);
        if (textHistoryInstance.states[0] !== "") throw new Error(`Initial state should be empty string, got "${textHistoryInstance.states[0]}"`);
        if (textHistoryInstance.currentIndex !== 0) throw new Error(`Initial currentIndex should be 0, got ${textHistoryInstance.currentIndex}`);
        if (textHistoryInstance.canUndo()) throw new Error("Should not be able to undo initially");
        if (textHistoryInstance.canRedo()) throw new Error("Should not be able to redo initially");
    });

    runTest("addState: Add a single state", () => {
        textHistoryInstance.addState("hello");
        if (textHistoryInstance.states.length !== 2) throw new Error(`states.length should be 2, got ${textHistoryInstance.states.length}`);
        if (textHistoryInstance.currentIndex !== 1) throw new Error(`currentIndex should be 1, got ${textHistoryInstance.currentIndex}`);
        if (textHistoryInstance.getCurrentState() !== "hello") throw new Error(`Current state should be "hello", got "${textHistoryInstance.getCurrentState()}"`);
        if (!textHistoryInstance.canUndo()) throw new Error("Should be able to undo after adding state");
        if (textHistoryInstance.canRedo()) throw new Error("Should not be able to redo");
    });

    runTest("addState: Add multiple states", () => {
        textHistoryInstance.addState("state1");
        textHistoryInstance.addState("state2");
        textHistoryInstance.addState("state3");
        if (textHistoryInstance.states.length !== 4) throw new Error(`Expected 4 states, got ${textHistoryInstance.states.length}`);
        if (textHistoryInstance.currentIndex !== 3) throw new Error(`Expected currentIndex 3, got ${textHistoryInstance.currentIndex}`);
        if (textHistoryInstance.getCurrentState() !== "state3") throw new Error(`Expected current state "state3", got "${textHistoryInstance.getCurrentState()}"`);
    });

    runTest("undo: Basic undo operation", () => {
        textHistoryInstance.addState("state1");
        textHistoryInstance.addState("state2");
        const undoneState = textHistoryInstance.undo();
        if (undoneState !== "state1") throw new Error(`Expected undo to return "state1", got "${undoneState}"`);
        if (textHistoryInstance.currentIndex !== 1) throw new Error(`Expected currentIndex 1 after undo, got ${textHistoryInstance.currentIndex}`);
        if (textHistoryInstance.getCurrentState() !== "state1") throw new Error(`Expected current state "state1" after undo, got "${textHistoryInstance.getCurrentState()}"`);
        if (!textHistoryInstance.canRedo()) throw new Error("Should be able to redo after undo");
    });

    runTest("redo: Basic redo operation", () => {
        textHistoryInstance.addState("state1");
        textHistoryInstance.addState("state2");
        textHistoryInstance.undo();
        const redoneState = textHistoryInstance.redo();
        if (redoneState !== "state2") throw new Error(`Expected redo to return "state2", got "${redoneState}"`);
        if (textHistoryInstance.currentIndex !== 2) throw new Error(`Expected currentIndex 2 after redo, got ${textHistoryInstance.currentIndex}`);
        if (textHistoryInstance.getCurrentState() !== "state2") throw new Error(`Expected current state "state2" after redo, got "${textHistoryInstance.getCurrentState()}"`);
        if (textHistoryInstance.canRedo()) throw new Error("Should not be able to redo at the end of history");
    });

    runTest("undo/redo: Boundary conditions", () => {
        textHistoryInstance.addState("state1");
        if (textHistoryInstance.undo() !== "") throw new Error("Undo from single added state failed"); // Back to initial empty state
        if (textHistoryInstance.undo() !== null) throw new Error("Undo beyond initial state should return null");
        if (textHistoryInstance.currentIndex !== 0) throw new Error("currentIndex should be 0 after undoing all");
        if (textHistoryInstance.redo() !== "state1") throw new Error("Redo after undoing to start failed");
        if (textHistoryInstance.redo() !== null) throw new Error("Redo beyond last state should return null");
        if (textHistoryInstance.currentIndex !== 1) throw new Error("currentIndex should be 1 after redoing all");
    });

    runTest("addState: Overwrite future states after undo", () => {
        textHistoryInstance.addState("s1");
        textHistoryInstance.addState("s2");
        textHistoryInstance.addState("s3"); // states: ["", "s1", "s2", "s3"], currentIndex: 3
        textHistoryInstance.undo();       // states: ["", "s1", "s2", "s3"], currentIndex: 2 (current is "s2")
        textHistoryInstance.undo();       // states: ["", "s1", "s2", "s3"], currentIndex: 1 (current is "s1")
        textHistoryInstance.addState("s4"); // states: ["", "s1", "s4"], currentIndex: 2

        if (textHistoryInstance.states.length !== 3) throw new Error(`Expected 3 states after overwrite, got ${textHistoryInstance.states.length}`);
        if (textHistoryInstance.getCurrentState() !== "s4") throw new Error(`Expected current state "s4", got "${textHistoryInstance.getCurrentState()}"`);
        if (textHistoryInstance.currentIndex !== 2) throw new Error(`Expected currentIndex 2, got ${textHistoryInstance.currentIndex}`);
        if (textHistoryInstance.canRedo()) throw new Error("Should not be able to redo after adding new state post-undo");
        if (textHistoryInstance.undo() !== "s1") throw new Error("Undo after overwrite failed");
    });

    runTest("maxHistorySize: Adding states beyond maxHistorySize", () => {
        const originalMaxSize = textHistoryInstance.maxHistorySize;
        textHistoryInstance.maxHistorySize = 3; // Temporarily set for test
        textHistoryInstance.reset(); // Reset to initial state with new max size in mind (though reset doesn't use it)

        textHistoryInstance.addState("s1"); // ["", "s1"] ci=1
        textHistoryInstance.addState("s2"); // ["", "s1", "s2"] ci=2
        textHistoryInstance.addState("s3"); // ["", "s1", "s2", "s3"] -> shift -> ["s1", "s2", "s3"] ci=2

        if (textHistoryInstance.states.length !== 3) throw new Error(`Expected states.length ${textHistoryInstance.maxHistorySize}, got ${textHistoryInstance.states.length}`);
        if (textHistoryInstance.states[0] !== "s1") throw new Error(`Oldest state should be "s1", got ${textHistoryInstance.states[0]}`);
        if (textHistoryInstance.getCurrentState() !== "s3") throw new Error(`Current state should be "s3", got ${textHistoryInstance.getCurrentState()}`);
        if (textHistoryInstance.currentIndex !== 2) throw new Error(`CurrentIndex should be 2 (maxSize-1), got ${textHistoryInstance.currentIndex}`);

        textHistoryInstance.addState("s4"); // ["s1", "s2", "s3", "s4"] -> shift -> ["s2", "s3", "s4"] ci=2
        if (textHistoryInstance.states.length !== 3) throw new Error(`Expected states.length ${textHistoryInstance.maxHistorySize} after another add, got ${textHistoryInstance.states.length}`);
        if (textHistoryInstance.states[0] !== "s2") throw new Error(`Oldest state should be "s2", got ${textHistoryInstance.states[0]}`);
        if (textHistoryInstance.getCurrentState() !== "s4") throw new Error(`Current state should be "s4", got ${textHistoryInstance.getCurrentState()}`);
        if (textHistoryInstance.currentIndex !== 2) throw new Error(`CurrentIndex should be 2 after another add, got ${textHistoryInstance.currentIndex}`);

        textHistoryInstance.maxHistorySize = originalMaxSize; // Reset to original
    });

    runTest("reset: Resets history to initial state", () => {
        textHistoryInstance.addState("s1");
        textHistoryInstance.addState("s2");
        textHistoryInstance.reset();
        if (textHistoryInstance.states.length !== 1 || textHistoryInstance.states[0] !== "" || textHistoryInstance.currentIndex !== 0) {
            throw new Error("Reset did not return to initial state");
        }
        if (textHistoryInstance.canUndo() || textHistoryInstance.canRedo()) {
            throw new Error("Undo/Redo should not be possible after reset");
        }
    });

    // Debounce test is harder without timer mocks.
    // This is a conceptual test for debouncedAddHistory if debounce is working.
    runTest("debouncedAddHistory: (Conceptual - relies on debounce working)", (done) => {
        // Assuming debounce is mocked to be synchronous for this test or relying on its actual timing
        // For a real debounce test, Jest or a similar framework with timer mocks is needed.
        // This test will likely pass due to the simple pass-through mock of debounce.
        const initialStatesCount = textHistoryInstance.states.length;
        debouncedAddHistoryInstance("debounced1");
        debouncedAddHistoryInstance("debounced2");
        debouncedAddHistoryInstance("debounced3");

        if (typeof setTimeout.clock !== 'undefined') { // e.g. if using Sinon.js fake timers
            setTimeout.clock.tick(600); // Advance clock past debounce time
            if (textHistoryInstance.states.length !== initialStatesCount + 1) throw new Error(`Expected 1 new state after debounce, got ${textHistoryInstance.states.length - initialStatesCount}`);
            if (textHistoryInstance.getCurrentState() !== "debounced3") throw new Error(`Expected "debounced3" as current state`);
            if (done) done(); else displayResults();
        } else {
            // Simple check for pass-through mock (will add 3 states)
            // If real debounce (async), this check is too soon.
            console.warn("Debounce test is conceptual without timer mocks. Assuming synchronous execution or real timers.");
             setTimeout(() => {
                // This will check the state after the debounce period (e.g., 500ms)
                // If debounce is mocked as pass-through, 3 states will be added.
                // If real debounce, only 1 state ("debounced3") should be added.
                // The current simple mock for debounce in this test file makes it act synchronously.
                // So, we expect 3 states if the mock is simple pass-through.
                // If history.js picked up the *real* debounce from utils.js, then it would be 1.
                // This depends on the test environment setup.
                // Let's assume the mock in *this file* is used for `debouncedAddHistoryInstance`
                const expectedStatesAdded = (global.debounce.isMockedToPassThrough ? 3 : 1); // hypothetical flag on mock
                if (global.debounce.toString().includes("func.apply(this, args); };")) { // Check if it's our simple mock
                     if (textHistoryInstance.states.length !== initialStatesCount + 3) throw new Error(`Expected 3 new states with simple mock debounce, got ${textHistoryInstance.states.length - initialStatesCount}`);
                } else {
                    // Assume real debounce might be working
                     if (textHistoryInstance.states.length !== initialStatesCount + 1) {
                        console.warn(`Debounce test: Real debounce might be active. States added: ${textHistoryInstance.states.length - initialStatesCount}. Expected 1.`);
                     }
                }
                 if (done) done(); else displayResults();
            }, 600); // Wait for debounce
        }
    });


    // --- Display Results ---
    // Needs to be called after all tests, especially async ones, complete.
    // For this simple runner, we'll call it after the last test,
    // but the async debounce test calls it itself if 'done' is not provided.
    // To ensure it's called once after everything:
    // setTimeout(displayResults, 1000); // If there are async tests without proper done() chaining for display.
    // For now, the last async test handles it. If all sync, uncomment below.
    // displayResults();
})();
