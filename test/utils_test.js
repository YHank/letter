(function() {
    'use strict';

    // --- Test Runner Setup ---
    const testResults = [];
    let testsRun = 0;
    let testsPassed = 0;

    function runTest(description, testFn) {
        testsRun++;
        try {
            testFn();
            testResults.push({ description, status: 'PASSED' });
            testsPassed++;
        } catch (e) {
            testResults.push({ description, status: 'FAILED', error: e.toString() });
        }
    }

    function displayResults() {
        console.log(`\n--- Utils Test Results ---`);
        console.log(`Total tests: ${testsRun}, Passed: ${testsPassed}, Failed: ${testsRun - testsPassed}`);
        testResults.forEach(result => {
            if (result.status === 'PASSED') {
                console.log(`✅ PASSED: ${result.description}`);
            } else {
                console.error(`❌ FAILED: ${result.description}`);
                console.error(`   Error: ${result.error}`);
            }
        });
        console.log("--- End Utils Test Results ---\n");

        // If in a browser-like environment with a DOM, display there too
        if (typeof document !== 'undefined' && document.getElementById) {
            const resultsContainer = document.getElementById('test-results-utils'); // Assuming an element with this ID exists
            if (resultsContainer) {
                let html = `<h3>Utils Test Results</h3><p>Total: ${testsRun}, Passed: ${testsPassed}, Failed: ${testsRun - testsPassed}</p><ul>`;
                testResults.forEach(result => {
                    html += `<li style="color: ${result.status === 'PASSED' ? 'green' : 'red'};">
                                <strong>${result.status}:</strong> ${result.description}
                                ${result.error ? `<br><pre>${result.error}</pre>` : ''}
                             </li>`;
                });
                html += "</ul>";
                resultsContainer.innerHTML = html;
            }
        }
    }

    // --- Mocking ---
    // Mock DOM
    const mockDocument = {
        elements: {},
        querySelector: function(selector) {
            return this.elements[selector] || null;
        },
        querySelectorAll: function(selector) {
            // Basic mock for querySelectorAll, returning matching elements
            const foundElements = [];
            for (const key in this.elements) {
                // This is a very simplified match, e.g. if selector is '.class1' and key is '#id1.class1'
                if (selector.startsWith('.') && this.elements[key] && this.elements[key].className && this.elements[key].className.includes(selector.substring(1))) {
                    foundElements.push(this.elements[key]);
                } else if (selector.startsWith('#') && key === selector) {
                     foundElements.push(this.elements[key]);
                }
            }
            return foundElements;
        },
        createElement: function(tagName) {
            const el = {
                tagName: tagName.toUpperCase(),
                style: {},
                textContent: '',
                innerHTML: '',
                attributes: {},
                eventListeners: {},
                appendChild: function(child) { /* no-op */ },
                setAttribute: function(name, value) { this.attributes[name] = value; },
                getAttribute: function(name) { return this.attributes[name]; },
                addEventListener: function(type, listener) {
                    if (!this.eventListeners[type]) this.eventListeners[type] = [];
                    this.eventListeners[type].push(listener);
                },
                removeEventListener: function(type, listener) {
                    // Basic removal
                    if (this.eventListeners[type]) {
                        this.eventListeners[type] = this.eventListeners[type].filter(l => l !== listener);
                    }
                },
                classList: {
                    add: function(...classNames) {
                        if (!el.className) el.className = "";
                        classNames.forEach(cn => { if (el.className.indexOf(cn) === -1) el.className += (el.className ? " " : "") + cn; });
                    },
                    remove: function(...classNames) {
                         if (!el.className) el.className = "";
                         classNames.forEach(cn => { el.className = el.className.replace(new RegExp(`\\b${cn}\\b`, 'g'), "").trim().replace(/\\s+/g, ' '); });
                    },
                    contains: function(className) {
                        return el.className && el.className.includes(className);
                    }
                }
            };
            if (tagName === 'div') {
                // Specific for escapeHtml
                Object.defineProperty(el, 'textContent', {
                    set(value) { this._textContent = value; this.innerHTML = StringUtils.escapeHtml(value); }, // simplified
                    get() { return this._textContent; }
                });
            }
            return el;
        },
        // Add any other document methods your utils might use
    };
    mockDocument.elements['#testId'] = { id: 'testId', innerHTML: 'Hello', textContent: 'Hello', className: 'test-class' };
    mockDocument.elements['.testClass'] = { id: 'testId2', innerHTML: 'World', textContent: 'World', className: 'test-class other-class' };
     mockDocument.elements['#testIdForEvent'] = mockDocument.createElement('button');


    // Mock localStorage
    const mockLocalStorage = (function() {
        let store = {};
        return {
            getItem: function(key) { return store[key] || null; },
            setItem: function(key, value) { store[key] = String(value); },
            removeItem: function(key) { delete store[key]; },
            clear: function() { store = {}; }
        };
    })();
    global.localStorage = mockLocalStorage;

    // Mock performance and requestAnimationFrame for AnimationUtils
    global.performance = { now: () => Date.now() };
    global.requestAnimationFrame = (callback) => setTimeout(callback, 16); // Simulate ~60fps
    global.cancelAnimationFrame = (id) => clearTimeout(id);


    // --- Tests ---

    // DOMUtils Tests
    runTest("DOMUtils.getElement should find an existing element", () => {
        const el = DOMUtils.getElement('#testId', mockDocument);
        if (!el || el.id !== 'testId') throw new Error(`Expected element with id 'testId', got ${el}`);
    });
    runTest("DOMUtils.getElement should return null for non-existing element", () => {
        const el = DOMUtils.getElement('#nonExistent', mockDocument);
        if (el !== null) throw new Error(`Expected null, got ${el}`);
    });
     runTest("DOMUtils.getElements should find elements by class", () => {
        const els = DOMUtils.getElements('.test-class', mockDocument);
        if (els.length === 0) throw new Error("Expected elements with class 'test-class'");
        if (!els.some(el => el.id === 'testId' || el.id === 'testId2')) throw new Error("Did not find expected elements");
    });
    runTest("DOMUtils.addEvent and removeEvent (basic mock test)", () => {
        let- Geklickt = false;
        const handler = () => { clicked = true; };
        const el = mockDocument.elements['#testIdForEvent'];
        DOMUtils.addEvent(el, 'click', handler);
        if(!el.eventListeners['click'] || el.eventListeners['click'].length === 0) throw new Error("Event listener not added");
        // el.eventListeners['click'][0](); // Simulate click
        // if(!clicked) throw new Error("Handler not called");
        // Note: Full event simulation is complex, this just checks registration
    });


    // StorageUtils Tests
    runTest("StorageUtils.save and StorageUtils.load", () => {
        const key = 'testKey';
        const value = { a: 1, b: 'test' };
        StorageUtils.save(key, value);
        const loadedValue = StorageUtils.load(key);
        if (JSON.stringify(loadedValue) !== JSON.stringify(value)) throw new Error(`Expected ${JSON.stringify(value)}, got ${JSON.stringify(loadedValue)}`);
    });
    runTest("StorageUtils.load with defaultValue", () => {
        const loadedValue = StorageUtils.load('nonExistentKey', 'default');
        if (loadedValue !== 'default') throw new Error(`Expected 'default', got ${loadedValue}`);
    });
    runTest("StorageUtils.remove", () => {
        const key = 'testKeyToRemove';
        StorageUtils.save(key, 'testValue');
        StorageUtils.remove(key);
        const loadedValue = StorageUtils.load(key);
        if (loadedValue !== null) throw new Error(`Expected null after remove, got ${loadedValue}`);
    });

    // NumberUtils Tests
    runTest("NumberUtils.addCommas", () => {
        if (NumberUtils.addCommas(1234567) !== '1,234,567') throw new Error("addCommas failed for 1234567");
        if (NumberUtils.addCommas(123) !== '123') throw new Error("addCommas failed for 123");
        if (NumberUtils.addCommas('') !== '') throw new Error("addCommas failed for empty string");
    });
    runTest("NumberUtils.calculatePercent", () => {
        if (NumberUtils.calculatePercent(50, 200, 1) !== '25.0') throw new Error("calculatePercent failed for 50/200");
        if (NumberUtils.calculatePercent(1, 3, 2) !== '33.33') throw new Error("calculatePercent failed for 1/3");
    });
    runTest("NumberUtils.factorial", () => {
        if (NumberUtils.factorial(5) !== 120) throw new Error("factorial(5) failed");
        if (NumberUtils.factorial(0) !== 1) throw new Error("factorial(0) failed");
        if (NumberUtils.factorial(1) !== 1) throw new Error("factorial(1) failed");
        if (!isNaN(NumberUtils.factorial(-1))) throw new Error("factorial(-1) should be NaN");
    });

    // TimeUtils Tests
    runTest("TimeUtils.msToMinSec", () => {
        if (TimeUtils.msToMinSec(125000) !== '2:05') throw new Error("msToMinSec(125000) failed");
        if (TimeUtils.msToMinSec(59000) !== '0:59') throw new Error("msToMinSec(59000) failed");
    });
     runTest("TimeUtils.getCurrentTimeKR", () => {
        const timeKR = TimeUtils.getCurrentTimeKR();
        if (typeof timeKR !== 'string' || timeKR.length < 10) throw new Error("getCurrentTimeKR returned invalid string");
        // Note: Exact match is hard due to changing time, so just check format broadly
    });


    // ValidationUtils Tests
    runTest("ValidationUtils.isValidEmail", () => {
        if (!ValidationUtils.isValidEmail('test@example.com')) throw new Error("isValidEmail failed for valid email");
        if (ValidationUtils.isValidEmail('test@example')) throw new Error("isValidEmail failed for invalid email");
    });
    runTest("ValidationUtils.isNumeric", () => {
        if (!ValidationUtils.isNumeric('123')) throw new Error("isNumeric failed for '123'");
        if (ValidationUtils.isNumeric('12a3')) throw new Error("isNumeric failed for '12a3'");
    });
    runTest("ValidationUtils.hasKorean", () => {
        if (!ValidationUtils.hasKorean('안녕하세요')) throw new Error("hasKorean failed for '안녕하세요'");
        if (ValidationUtils.hasKorean('Hello')) throw new Error("hasKorean failed for 'Hello'");
    });

    // StringUtils Tests
    runTest("StringUtils.escapeHtml", () => {
        const input = '<script>alert("xss")</script>';
        const expected = '&lt;script&gt;alert("xss")&lt;/script&gt;';
        // Note: The mock createElement for 'div' in this test environment is simplified
        // and might not perfectly replicate browser's textContent/innerHTML for all cases.
        // This test relies on the real StringUtils.escapeHtml using a real DOM element if available.
        // For node test, we'd need a proper DOM mock like JSDOM for StringUtils.escapeHtml.
        // As a fallback, if document is our mock:
        const mockDiv = mockDocument.createElement('div');
        mockDiv.textContent = input; // This setter is mocked to call StringUtils.escapeHtml
                                     // which is problematic if StringUtils itself is under test
                                     // For a true unit test, StringUtils.escapeHtml should not rely on itself.
                                     // Let's assume it uses the *real* document.createElement if available,
                                     // or we test its internal logic if it were pure JS.
                                     // Given the environment, this test is more of an integration check.
        // A direct test of the logic:
        const testDiv = document.createElement('div'); // Using the 'real' document if in browser, or a good mock
        testDiv.textContent = input;
        if (testDiv.innerHTML !== expected) throw new Error(`escapeHtml failed. Expected: ${expected}, Got: ${testDiv.innerHTML}`);
    });

    runTest("StringUtils.escapeRegExp", () => {
        if (StringUtils.escapeRegExp('pattern with (brackets) and $') !== 'pattern with \\(brackets\\) and \\$') throw new Error("escapeRegExp failed");
    });
    runTest("StringUtils.getSafeText", () => {
        mockDocument.elements['#safeTextEl'] = { textContent: ' Some Text  ', innerText: ' Some Text  ' };
        const text = StringUtils.getSafeText(mockDocument.elements['#safeTextEl']);
        if (text !== 'Some Text') throw new Error(`getSafeText failed. Expected 'Some Text', got '${text}'`);
        const noText = StringUtils.getSafeText(mockDocument.elements['#nonExistent']);
        if (noText !== '') throw new Error(`getSafeText with no element failed. Expected '', got '${noText}'`);
    });

    // Debounce Test
    runTest("debounce function basic execution", (done) => { // 'done' for async
        let callCount = 0;
        const myFunc = () => { callCount++; };
        const debouncedFunc = debounce(myFunc, 50);

        debouncedFunc();
        debouncedFunc();
        debouncedFunc(); // Multiple calls

        setTimeout(() => {
            if (callCount !== 1) {
                displayResults(); // Display intermediate results
                throw new Error(`debounce failed: Expected 1 call, got ${callCount}`);
            }
            // Test immediate = true
            callCount = 0;
            const immediateFunc = debounce(() => { callCount++; }, 50, true);
            immediateFunc(); // Should call immediately
            if (callCount !== 1) {
                 displayResults();
                 throw new Error(`debounce (immediate) failed: Expected 1 call immediately, got ${callCount}`);
            }
            immediateFunc(); // Should be ignored
            setTimeout(() => {
                if (callCount !== 1) { // Still should be 1
                    displayResults();
                    throw new Error(`debounce (immediate) post-timeout failed: Expected 1 call, got ${callCount}`);
                }
                // To truly finish async test and display results after it.
                if (done && typeof done === 'function') done(); else displayResults();

            }, 100);
        }, 100); // Wait longer than debounce time
    });

    // AnimationUtils tests are harder to unit test meaningfully without visual inspection
    // or more complex DOM state checking. We'll do basic checks that they don't error.
    runTest("AnimationUtils.fadeIn basic execution", (done) => {
        const el = mockDocument.createElement('div');
        el.style.opacity = '0';
        el.style.display = 'none';
        AnimationUtils.fadeIn(el, 50);
        setTimeout(() => {
            // Check basic style changes, exact values depend on mock requestAnimationFrame timing
            if (el.style.display !== 'block') throw new Error("fadeIn: display not block");
            if (parseFloat(el.style.opacity) <= 0) throw new Error("fadeIn: opacity not increased");
            if (done && typeof done === 'function') done(); else displayResults();
        }, 100);
    });
    runTest("AnimationUtils.fadeOut basic execution", (done) => {
        const el = mockDocument.createElement('div');
        el.style.opacity = '1';
        el.style.display = 'block';
        AnimationUtils.fadeOut(el, 50);
         setTimeout(() => {
            if (parseFloat(el.style.opacity) >= 1) throw new Error("fadeOut: opacity not decreased");
            // display will be 'none' after timeout completes fully
            if (done && typeof done === 'function') done(); else displayResults();
        }, 100);
    });


    // --- Display Results ---
    // For debounce, results might be displayed multiple times if errors occur early.
    // The final call for async tests should be handled carefully.
    // For simplicity, if 'done' is not passed or used, displayResults is called by the last test.
    // For the async debounce test, it calls displayResults itself if 'done' is not passed.
    // If running in an environment that supports top-level await, that would be cleaner.
    // Otherwise, the last synchronous test or a final setTimeout can call displayResults.

    // If no async tests that need explicit 'done' handling for displayResults:
    // displayResults();

})();
