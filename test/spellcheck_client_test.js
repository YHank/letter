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
        console.log(`\n--- SpellCheckClient Test Results ---`);
        console.log(`Total tests: ${testsRun}, Passed: ${testsPassed}, Failed: ${testsRun - testsPassed}`);
        testResults.forEach(result => {
            if (result.status === 'PASSED') {
                console.log(`✅ PASSED: ${result.description}`);
            } else {
                console.error(`❌ FAILED: ${result.description}`);
                console.error(`   Error: ${result.error}`);
            }
        });
        console.log("--- End SpellCheckClient Test Results ---\n");

        if (typeof document !== 'undefined' && document.getElementById) {
            const resultsContainer = document.getElementById('test-results-spellcheck-client');
            if (resultsContainer) {
                let html = `<h3>SpellCheckClient Test Results</h3><p>Total: ${testsRun}, Passed: ${testsPassed}, Failed: ${testsRun - testsPassed}</p><ul>`;
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
        if (actual !== expected) throw new Error(message || `Expected "${expected}", but got "${actual}"`);
    }
    function assertDeepEqual(actual, expected, message) {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
            throw new Error(message || `Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`);
        }
    }

    // --- Mocking & Setup ---
    // Mock document for escapeHtml if not in browser
    if (typeof document === 'undefined') {
        global.document = {
            createElement: function(tagName) {
                if (tagName.toLowerCase() === 'div') {
                    return {
                        _textContent: '',
                        set textContent(value) { this._textContent = value; },
                        get textContent() { return this._textContent; },
                        get innerHTML() { // Basic mock for escapeHtml
                            return this._textContent
                                .replace(/&/g, '&amp;')
                                .replace(/</g, '&lt;')
                                .replace(/>/g, '&gt;')
                                .replace(/"/g, '&quot;')
                                .replace(/'/g, '&#039;');
                        }
                    };
                }
                return {};
            }
        };
    }

    // Load SpellCheckClient
    let CurrentSpellCheckClient;
    if (typeof SpellCheckClient !== 'undefined') { // Loaded via script tag
        CurrentSpellCheckClient = SpellCheckClient;
    } else if (typeof require !== 'undefined') { // Node.js environment
        // This would require SpellCheckClient.js to have module.exports
        // For simplicity, let's assume it's made global or we manually include its code.
        // const clientModule = require('../js/spellcheck_client.js'); // If it were a module
        // CurrentSpellCheckClient = clientModule.SpellCheckClient;
        // Since it's not a module, we might need to load it differently or test in browser.
        // For this environment, we'll assume SpellCheckClient is globally available.
        // If this test were run by Node, we'd need to make SpellCheckClient exportable.
        // For now, we'll copy the object definition for isolated testing if not global.
        if (typeof SpellCheckClient === 'undefined') {
            console.warn("SpellCheckClient not found globally. Using an internal copy for testing.");
            // This is a fallback - ideally the script should be loaded.
            // The actual SpellCheckClient code would be pasted here for a truly isolated test if no other loading mechanism works.
            // For now, tests will fail if SpellCheckClient is not loaded by the test runner.
             CurrentSpellCheckClient = {
                dictionary: {},
                init: function() { this.dictionary = this.mockDictionary || {}; }, // Ensure init can take mock
                check: function() { return { original:'', corrected:'', errors:[], errorCount:0 }; },
                escapeHtml: function(text) {
                    const div = document.createElement('div');
                    div.textContent = text;
                    return div.innerHTML;
                },
                escapeRegExp: function(string) {
                    if (typeof string !== 'string') return '';
                    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                }
            };
        } else {
            CurrentSpellCheckClient = SpellCheckClient;
        }
    }
     if (!CurrentSpellCheckClient) {
        console.error("SpellCheckClient is not available. Tests cannot run.");
        return; // Stop tests if the client isn't loaded/mocked
    }


    // --- Test Cases ---

    runTest("escapeHtml: Basic HTML character escaping", () => {
        const input = '<script>alert("XSS & VULNERABILITY");</script>';
        const expected = '&lt;script&gt;alert("XSS &amp; VULNERABILITY");&lt;/script&gt;';
        assertEqual(CurrentSpellCheckClient.escapeHtml(input), expected);
    });

    runTest("escapeRegExp: Regular expression character escaping", () => {
        const input = "Example (with .*+?^${}()|[]\\ characters)";
        const expected = "Example \\(with \\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|[]\\\\ characters\\)";
        assertEqual(CurrentSpellCheckClient.escapeRegExp(input), expected);
    });

    runTest("check: Empty string input", () => {
        CurrentSpellCheckClient.dictionary = {}; // Ensure empty dict for this test
        CurrentSpellCheckClient.init(); // Initialize with empty
        const results = CurrentSpellCheckClient.check("");
        assertEqual(results.original, "");
        assertEqual(results.corrected, "");
        assertEqual(results.errorCount, 0);
        assertDeepEqual(results.errors, []);
    });

    runTest("check: Text with no errors (using mock dictionary)", () => {
        CurrentSpellCheckClient.dictionary = { "테스트용오류": "테스트용정답" };
        CurrentSpellCheckClient.init();
        const text = "이것은 올바른 문장입니다.";
        const results = CurrentSpellCheckClient.check(text);
        assertEqual(results.original, text);
        assertEqual(results.corrected, text, "Corrected text should be same as original for no errors");
        assertEqual(results.errorCount, 0, "Error count should be 0 for no errors");
    });

    runTest("check: Dictionary-based error: '안되' -> '안 돼'", () => {
        CurrentSpellCheckClient.dictionary = { "안되": "안 돼" };
        CurrentSpellCheckClient.init();
        const text = "이것은 안되요.";
        const results = CurrentSpellCheckClient.check(text);
        assertEqual(results.original, text);
        assertEqual(results.corrected, "이것은 안 돼요.", "Corrected text for '안되요'");
        assertEqual(results.errorCount, 1, "Error count for '안되요'");
        assert(results.errors.some(e => e.original === "안되" && e.suggestion === "안 돼"), "Error details for '안되'");
    });

    runTest("check: Dictionary-based error multiple occurrences: '할수있' -> '할 수 있'", () => {
        CurrentSpellCheckClient.dictionary = { "할수있": "할 수 있" };
        CurrentSpellCheckClient.init();
        const text = "나는 할수있다. 너도 할수있을까?";
        const results = CurrentSpellCheckClient.check(text);
        assertEqual(results.corrected, "나는 할 수 있다. 너도 할 수 있을까?");
        assertEqual(results.errorCount, 2); // Two occurrences
        assert(results.errors.filter(e => e.original === "할수있").length === 2, "Two '할수있' errors expected");
    });

    runTest("check: Pattern-based error: Josa spacing '사람이'", () => {
        CurrentSpellCheckClient.dictionary = {}; // No dictionary errors for this test
        CurrentSpellCheckClient.init();
        const text = "그 사람이 말했다.";
        const results = CurrentSpellCheckClient.check(text);
        // Current check function's correctedText only reflects dictionary changes.
        // Pattern errors are reported but not auto-corrected in `results.corrected` in the same way.
        // The test should check the `errors` array for pattern errors.
        // The `correctedText` reflects dictionary corrections first, then pattern corrections.
        assertEqual(results.corrected, "그 사람 이 말했다.", "Josa spacing correction"); // Based on current replace logic
        assert(results.errors.some(e => e.type === 'spacing' && e.original === "사람이 " && e.suggestion === "사람이"), "Josa spacing error for '사람이 '");
        assertEqual(results.errorCount, 1);
    });

    runTest("check: Pattern-based error: Repeated consonant 'ㅋㅋㅋ'", () => {
        CurrentSpellCheckClient.dictionary = {};
        CurrentSpellCheckClient.init();
        const text = "정말 웃겨ㅋㅋㅋ";
        const results = CurrentSpellCheckClient.check(text);
        assertEqual(results.corrected, "정말 웃겨ㅋ");
        assert(results.errors.some(e => e.type === 'typo' && e.original === "ㅋㅋㅋ" && e.suggestion === "ㅋ"), "Repeated consonant error");
        assertEqual(results.errorCount, 1);
    });

    runTest("check: Pattern-based error: Sentence end spacing '안녕.  '", () => {
        CurrentSpellCheckClient.dictionary = {};
        CurrentSpellCheckClient.init();
        const text = "안녕.  반가워.";
        const results = CurrentSpellCheckClient.check(text);
        assertEqual(results.corrected, "안녕. 반가워.");
        assert(results.errors.some(e => e.type === 'spacing' && e.original.includes(".  ") && e.suggestion.includes(". ")), "Sentence end spacing error");
        assertEqual(results.errorCount, 1);
    });

    runTest("check: Mix of dictionary and pattern errors", () => {
        CurrentSpellCheckClient.dictionary = { "어떻해": "어떻게" };
        CurrentSpellCheckClient.init();
        const text = "이거 어떻해 된거야? 참나ㅋㅋ"; // 어떻해 (dict), 된거야 (josa pattern), ㅋㅋ (repeat pattern)
        const results = CurrentSpellCheckClient.check(text);

        assertEqual(results.corrected, "이거 어떻게 된거야? 참나ㅋ");
        assertEqual(results.errorCount, 3, "Error count for mixed errors");

        assert(results.errors.some(e => e.original === "어떻해" && e.suggestion === "어떻게"), "Dictionary error '어떻해'");
        assert(results.errors.some(e => e.original === "된거야?" && e.suggestion === "된거야" && e.type === 'spacing'), "Josa pattern '된거야?' (original might include space due to regex)");
        assert(results.errors.some(e => e.original === "ㅋㅋ" && e.suggestion === "ㅋ" && e.type === 'typo'), "Repeat pattern 'ㅋㅋ'");
    });

    runTest("check: Dictionary not loaded (simulated)", () => {
        CurrentSpellCheckClient.dictionary = null; // Simulate not loaded
        // init() would normally try to load, but for test, we can set it to null.
        // The check function itself has a guard for this.
        const text = "테스트 문장입니다.";
        const results = CurrentSpellCheckClient.check(text);
        assertEqual(results.original, text);
        assertEqual(results.corrected, text);
        assertEqual(results.errorCount, 1);
        assert(results.errors.some(e => e.type === 'system' && e.message.includes("사전이 로드되지 않아")), "System error for unloaded dictionary");
    });

    // --- Display Results ---
    displayResults();

})();
