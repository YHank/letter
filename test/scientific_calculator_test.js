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
        console.log(`\n--- Scientific Calculator Test Results ---`);
        console.log(`Total tests: ${testsRun}, Passed: ${testsPassed}, Failed: ${testsRun - testsPassed}`);
        testResults.forEach(result => {
            if (result.status === 'PASSED') {
                console.log(`✅ PASSED: ${result.description}`);
            } else {
                console.error(`❌ FAILED: ${result.description}`);
                console.error(`   Error: ${result.error}`);
                if (result.stack) console.error(`   Stack: ${result.stack.split('\\n').slice(0, 5).join('\\n')}`); // Limit stack trace length for console
            }
        });
        console.log("--- End Scientific Calculator Test Results ---\n");

        if (typeof document !== 'undefined' && document.getElementById) {
            const resultsContainer = document.getElementById('test-results-scientific-calculator');
            if (resultsContainer) {
                let html = `<h3>Scientific Calculator Test Results</h3><p>Total: ${testsRun}, Passed: ${testsPassed}, Failed: ${testsRun - testsPassed}</p><ul>`;
                testResults.forEach(result => {
                    html += `<li style="color: ${result.status === 'PASSED' ? 'green' : 'red'};">
                                <strong>${result.status}:</strong> ${result.description}
                                ${result.error ? `<br><pre>${result.error}${result.stack ? `\\n${result.stack}` : ''}</pre>` : ''}
                             </li>`;
                });
                html += "</ul>";
                resultsContainer.innerHTML = html;
            }
        }
    }

    function assert(condition, message) {
        if (!condition) {
            throw new Error(message || "Assertion failed in test: " + currentTestName);
        }
    }

    function assertEqual(actual, expected, message) {
        // Using parseFloat for comparing display strings to numbers, with tolerance
        const numActual = parseFloat(actual);
        const numExpected = parseFloat(expected);
        const tolerance = 1e-9; // Adjust tolerance as needed

        if (typeof actual === 'string' && actual.startsWith('Error')) {
            if (actual !== expected) {
                 throw new Error(message || `Expected error "${expected}", but got error "${actual}"`);
            }
        } else if (isNaN(numActual) && isNaN(numExpected)) {
            // Both are NaN, consider them equal for testing purposes (e.g. factorial of negative)
            return;
        } else if (Math.abs(numActual - numExpected) > tolerance) {
            throw new Error(message || `Expected ${expected}, but got ${actual}`);
        }
    }


    // --- Load Calculator Logic ---
    let calcLogic;
    let mockDisplayState = {}; // To capture display updates

    function mockDisplayCallback(newState) {
        mockDisplayState = { ...newState };
    }

    // This assumes js/scientific_calculator.js has been loaded and createCalculatorLogic is global
    // or it's a Node.js environment.
    if (typeof createCalculatorLogic === 'function') { // Browser context
        calcLogic = createCalculatorLogic(mockDisplayCallback);
    } else if (typeof require !== 'undefined') { // Node.js context for testing
        const { createCalculatorLogic: createCalc } = require('../js/scientific_calculator.js');
        calcLogic = createCalc(mockDisplayCallback);
    } else {
        console.error("Cannot load createCalculatorLogic. Tests will not run.");
        return;
    }

    // Helper to reset calculator state before each logical group of tests
    function resetCalc() {
        calcLogic.clearAll(); // Assuming clearAll resets the state fully
        // Or, if more direct state reset is needed for tests:
        // calcLogic._setState_FOR_TESTING_ONLY({ ...initialCalculatorState });
    }

    // --- Tests ---

    runTest("Initial State: Display should be '0'", () => {
        resetCalc();
        assertEqual(calcLogic.getState().display, '0');
    });

    runTest("Number Input: Basic number entry", () => {
        resetCalc();
        calcLogic.inputNumber('5');
        assertEqual(calcLogic.getState().display, '5');
        calcLogic.inputNumber('3');
        assertEqual(calcLogic.getState().display, '53');
    });

    runTest("Number Input: Decimal point", () => {
        resetCalc();
        calcLogic.inputNumber('1');
        calcLogic.inputDecimal();
        calcLogic.inputNumber('2');
        assertEqual(calcLogic.getState().display, '1.2');
        calcLogic.inputDecimal(); // Second decimal should be ignored
        assertEqual(calcLogic.getState().display, '1.2');
    });

    runTest("Simple Arithmetic: Addition", () => {
        resetCalc();
        calcLogic.inputNumber('5');
        calcLogic.handleOperator('add');
        calcLogic.inputNumber('3');
        calcLogic.calculate();
        assertEqual(calcLogic.getState().display, '8');
    });

    runTest("Simple Arithmetic: Subtraction", () => {
        resetCalc();
        calcLogic.inputNumber('10');
        calcLogic.handleOperator('subtract');
        calcLogic.inputNumber('4');
        calcLogic.calculate();
        assertEqual(calcLogic.getState().display, '6');
    });

    runTest("Simple Arithmetic: Multiplication", () => {
        resetCalc();
        calcLogic.inputNumber('7');
        calcLogic.handleOperator('multiply');
        calcLogic.inputNumber('6');
        calcLogic.calculate();
        assertEqual(calcLogic.getState().display, '42');
    });

    runTest("Simple Arithmetic: Division", () => {
        resetCalc();
        calcLogic.inputNumber('20');
        calcLogic.handleOperator('divide');
        calcLogic.inputNumber('4');
        calcLogic.calculate();
        assertEqual(calcLogic.getState().display, '5');
    });

    runTest("Chained Operations: 5 + 3 * 2 = 16 (sequential)", () => {
        resetCalc();
        calcLogic.inputNumber('5');
        calcLogic.handleOperator('add'); // previousValue = 5, operator = add
        calcLogic.inputNumber('3');  // display = 3
        calcLogic.handleOperator('multiply'); // performCalc(5+3)=8, previousValue=8, operator=multiply
        assertEqual(calcLogic.getState().display, '8', "Display should be 8 after 5+3 and pressing *");
        assertEqual(calcLogic.getState().previousValue, 8, "previousValue should be 8");
        calcLogic.inputNumber('2'); // display = 2
        calcLogic.calculate(); // performCalc(8*2)=16
        assertEqual(calcLogic.getState().display, '16');
    });

    runTest("Order of Operations: Sequential behavior (10 - 2 * 3 = 24)", () => {
        resetCalc();
        calcLogic.inputNumber('10');
        calcLogic.handleOperator('subtract'); // prev = 10, op = sub
        calcLogic.inputNumber('2');  // display = 2
        calcLogic.handleOperator('multiply'); // calc (10-2)=8. prev=8, op=mult
        assertEqual(mockDisplayState.display, '8', "Display after 10-2 and * press");
        calcLogic.inputNumber('3'); // display = 3
        calcLogic.calculate(); // calc (8*3) = 24
        assertEqual(calcLogic.getState().display, '24');
    });

    runTest("Division by Zero: Should display error", () => {
        resetCalc();
        calcLogic.inputNumber('5');
        calcLogic.handleOperator('divide');
        calcLogic.inputNumber('0');
        calcLogic.calculate(); // This will call performCalculation
        assertEqual(calcLogic.getState().display, 'Error: Div by 0');
        // Check if state is reset after error for next operation
        calcLogic.inputNumber('7'); // Should clear error and start new number
        assertEqual(calcLogic.getState().display, '7');
    });

    // --- Trigonometric Functions ---
    runTest("Trigonometry: sin(30 DEG) = 0.5", () => {
        resetCalc();
        calcLogic._setState_FOR_TESTING_ONLY({ angleMode: 'DEG' });
        calcLogic.inputNumber('30');
        calcLogic.handleFunction('sin');
        assertEqual(calcLogic.getState().display, '0.5');
    });
    runTest("Trigonometry: cos(PI RAD) = -1", () => {
        resetCalc();
        calcLogic._setState_FOR_TESTING_ONLY({ angleMode: 'RAD' });
        calcLogic.inputNumber(Math.PI.toString());
        calcLogic.handleFunction('cos');
        assertEqual(calcLogic.getState().display, '-1');
    });
    runTest("Trigonometry: tan(100 GRAD) = undefined (approaches infinity, expect Error or large number)", () => {
        resetCalc();
        calcLogic._setState_FOR_TESTING_ONLY({ angleMode: 'GRAD' });
        calcLogic.inputNumber('100'); // tan(90 deg) is undefined
        calcLogic.handleFunction('tan');
        // tan(100 GRAD) = tan(90 DEG) which is Infinity.
        // Depending on implementation, could be 'Error' or a very large number.
        // The current Math.tan might return a large number, then toFixed may handle it.
        // Let's check for 'Error' if that's the expected output for Infinity.
        // If it's a large number, that's also fine. The test will show what it is.
        // For now, let's assume it's not an 'Error' string but a large number or Infinity that becomes 'Error'
        if (calcLogic.getState().display !== 'Error' && Math.abs(parseFloat(calcLogic.getState().display)) < 1e9) {
             // If it's not 'Error' and not a huge number, it's likely wrong.
             // Note: Math.tan(Math.PI/2) in JS gives a very large number, not Infinity.
             // parseFloat((large_num).toFixed(10)) could be string "Infinity" or a large number string.
             // The internal logic sets display to "Error" for NaN/Infinity results from Math functions.
            assert(calcLogic.getState().display.toLowerCase().includes('error') || Math.abs(parseFloat(calcLogic.getState().display)) > 1e9, "tan(100 GRAD) should be undefined/Error or very large");
        }
    });
    runTest("Trigonometry: asin(0.5) in DEG mode (Shift + sin)", () => {
        resetCalc();
        calcLogic._setState_FOR_TESTING_ONLY({ angleMode: 'DEG', shiftMode: true });
        calcLogic.inputNumber('0.5');
        calcLogic.handleFunction('sin'); // This should trigger asin
        assertEqual(calcLogic.getState().display, '30');
        assert(!calcLogic.getState().shiftMode, "Shift mode should be false after asin");
    });

    // --- Logarithmic and Exponential ---
    runTest("Logarithms: log10(100) = 2", () => {
        resetCalc();
        calcLogic.inputNumber('100');
        calcLogic.handleFunction('log');
        assertEqual(calcLogic.getState().display, '2');
    });
    runTest("Logarithms: ln(e) = 1", () => {
        resetCalc();
        calcLogic.inputNumber(Math.E.toString());
        calcLogic.handleFunction('ln');
        assertEqual(calcLogic.getState().display, '1');
    });
    runTest("Exponential: e^1 = E", () => {
        resetCalc();
        calcLogic.inputNumber('1');
        calcLogic.handleFunction('exp');
        assertEqual(calcLogic.getState().display, Math.E.toFixed(10)); // toFixed(10) is used internally
    });
    runTest("Exponential: 10^3 = 1000", () => {
        resetCalc();
        calcLogic.inputNumber('3');
        calcLogic.handleFunction('10pow');
        assertEqual(calcLogic.getState().display, '1000');
    });

    // --- Other Math Functions ---
    runTest("Factorial: 5! = 120", () => {
        resetCalc();
        calcLogic.inputNumber('5');
        calcLogic.handleFunction('factorial');
        assertEqual(calcLogic.getState().display, '120');
    });
    runTest("Factorial: 0! = 1", () => {
        resetCalc();
        calcLogic.inputNumber('0');
        calcLogic.handleFunction('factorial');
        assertEqual(calcLogic.getState().display, '1');
    });
     runTest("Factorial: negative input = Error/NaN", () => {
        resetCalc();
        calcLogic.inputNumber('-5');
        calcLogic.handleFunction('factorial');
        assert(calcLogic.getState().display === 'Error' || isNaN(parseFloat(calcLogic.getState().display)), "Factorial of negative should be Error or NaN");
    });
    runTest("Square Root: sqrt(16) = 4", () => {
        resetCalc();
        calcLogic.inputNumber('16');
        calcLogic.handleFunction('sqrt');
        assertEqual(calcLogic.getState().display, '4');
    });
    runTest("Square Root: sqrt(-1) = Error", () => {
        resetCalc();
        calcLogic.inputNumber('-1');
        calcLogic.handleFunction('sqrt');
        assertEqual(calcLogic.getState().display, 'Error: Neg sqrt');
    });
    runTest("Power: 2^3 = 8", () => {
        resetCalc();
        calcLogic.inputNumber('2');
        calcLogic.handleOperator('power');
        calcLogic.inputNumber('3');
        calcLogic.calculate();
        assertEqual(calcLogic.getState().display, '8');
    });
    runTest("Reciprocal: 1/4 = 0.25", () => {
        resetCalc();
        calcLogic.inputNumber('4');
        calcLogic.handleFunction('reciprocal');
        assertEqual(calcLogic.getState().display, '0.25');
    });
     runTest("Reciprocal: 1/0 = Error", () => {
        resetCalc();
        calcLogic.inputNumber('0');
        calcLogic.handleFunction('reciprocal');
        assertEqual(calcLogic.getState().display, 'Error: Div by 0');
    });


    // --- Memory Functions ---
    runTest("Memory: M+, MR, MC", () => {
        resetCalc();
        calcLogic.inputNumber('10');
        calcLogic.handleMemory('memory-plus'); // memory = 10
        calcLogic.inputNumber('5'); // display = 5
        calcLogic.handleMemory('memory-plus'); // memory = 10 + 5 = 15
        calcLogic.handleMemory('memory-recall'); // display = 15
        assertEqual(calcLogic.getState().display, '15');
        assertEqual(calcLogic.getState().memory, 15);
        calcLogic.handleMemory('memory-clear'); // memory = 0
        assertEqual(calcLogic.getState().memory, 0);
        calcLogic.handleMemory('memory-recall'); // display = 0
        assertEqual(calcLogic.getState().display, '0');
    });
    runTest("Memory: M-", () => {
        resetCalc();
        calcLogic.inputNumber('20');
        calcLogic.handleMemory('memory-plus'); // memory = 20
        calcLogic.inputNumber('5');
        calcLogic.handleMemory('memory-minus'); // memory = 20 - 5 = 15
        assertEqual(calcLogic.getState().memory, 15);
    });

    // --- Clear Functions ---
    runTest("Clear: C (clearAll)", () => {
        resetCalc();
        calcLogic.inputNumber('123');
        calcLogic.handleOperator('add');
        calcLogic.inputNumber('456');
        calcLogic.clearAll();
        assertEqual(calcLogic.getState().display, '0');
        assertEqual(calcLogic.getState().expression, '');
        assert(calcLogic.getState().previousValue === null, "previousValue should be null after C");
        assert(calcLogic.getState().operator === null, "operator should be null after C");
        assert(!calcLogic.getState().waitingForOperand, "waitingForOperand should be false after C");
    });
    runTest("Clear: CE (clearEntry)", () => {
        resetCalc();
        calcLogic.inputNumber('123');
        calcLogic.handleOperator('add'); // expression "123 + ", prevVal 123, op 'add', waiting true
        calcLogic.inputNumber('456'); // display "456", waiting false
        calcLogic.clearEntry(); // display "0", waiting true
        assertEqual(calcLogic.getState().display, '0', "Display after CE should be 0");
        assert(calcLogic.getState().waitingForOperand, "waitingForOperand should be true after CE");
        assertEqual(calcLogic.getState().previousValue, 123, "previousValue should persist after CE");
        assertEqual(calcLogic.getState().operator, 'add', "operator should persist after CE");
        calcLogic.inputNumber('789'); // display "789"
        calcLogic.calculate(); // 123 + 789 = 912
        assertEqual(calcLogic.getState().display, '912');
    });

    // --- Equals behavior ---
    runTest("Equals: Repeated equals (5 + 3 = =)", () => {
        resetCalc();
        calcLogic.inputNumber('5');
        calcLogic.handleOperator('add');
        calcLogic.inputNumber('3');
        calcLogic.calculate(); // 5+3 = 8. prevVal=8, display=8, ans=8, op=null, waiting=true
        assertEqual(calcLogic.getState().display, '8');
        // Standard behavior: pressing '=' again might repeat the last operation with the last operand (3 in this case)
        // So, 8 + 3 = 11. For this, calculator needs to store last operand and op for '='.
        // Current refactored logic: previousValue becomes the result (8).
        // If calculate is pressed again, and operator is null, it does nothing to display '8'.
        // Let's test the implemented behavior:
        calcLogic.calculate();
        assertEqual(calcLogic.getState().display, '8', "Repeated equals should ideally keep result or repeat op; current does nothing if op is null");
        // To implement "repeat last operation":
        // after first calc: display=8, previousValue=8, operator=null, lastOperator='add', lastOperand=3
        // on second calc: if operator is null, use lastOperator and lastOperand with current display (which is prev result)
        // This is an advanced feature not explicitly in the original code's direct logic.
    });

     runTest("Equals: Operator then equals (5 * = )", () => {
        resetCalc();
        calcLogic.inputNumber('5');
        calcLogic.handleOperator('multiply'); // prevVal=5, op=mult, waiting=true, display=5 (implicitly)
        calcLogic.calculate(); // Should use 5 as second operand: 5 * 5 = 25
        assertEqual(calcLogic.getState().display, '25');
        assertEqual(calcLogic.getState().answer, 25);
        // And then if equals is pressed again, it should do 25 * 5 = 125
        calcLogic.calculate();
        assertEqual(calcLogic.getState().display, '125');
    });

    runTest("Constants: PI and E", () => {
        resetCalc();
        calcLogic.handleFunction('pi');
        assertEqual(calcLogic.getState().display, Math.PI.toFixed(10));
        assert(!calcLogic.getState().waitingForOperand, "waitingForOperand false after PI");
        calcLogic.handleOperator('multiply');
        calcLogic.inputNumber('2');
        calcLogic.calculate();
        assertEqual(calcLogic.getState().display, (Math.PI * 2).toFixed(10));

        resetCalc();
        calcLogic.handleFunction('e');
        assertEqual(calcLogic.getState().display, Math.E.toFixed(10));
        assert(!calcLogic.getState().waitingForOperand, "waitingForOperand false after E");
    });

    runTest("ANS button", () => {
        resetCalc();
        calcLogic.inputNumber('5');
        calcLogic.handleOperator('add');
        calcLogic.inputNumber('3');
        calcLogic.calculate(); // display = 8, answer = 8
        assertEqual(calcLogic.getState().answer, 8);

        calcLogic.clearAll();
        calcLogic.handleFunction('ans'); // display = 8
        assertEqual(calcLogic.getState().display, '8');
        assert(!calcLogic.getState().waitingForOperand, "waitingForOperand false after ANS");
        calcLogic.handleOperator('multiply');
        calcLogic.inputNumber('2');
        calcLogic.calculate(); // 8 * 2 = 16
        assertEqual(calcLogic.getState().display, '16');
        assertEqual(calcLogic.getState().answer, 16);
    });

    runTest("Backspace function", () => {
        resetCalc();
        calcLogic.inputNumber('1');
        calcLogic.inputNumber('2');
        calcLogic.inputNumber('3'); // display is "123"
        calcLogic.backspace();      // display is "12"
        assertEqual(calcLogic.getState().display, '12');
        calcLogic.backspace();      // display is "1"
        assertEqual(calcLogic.getState().display, '1');
        calcLogic.backspace();      // display is "0"
        assertEqual(calcLogic.getState().display, '0');
        calcLogic.backspace();      // display is still "0"
        assertEqual(calcLogic.getState().display, '0');
    });

    runTest("Sign toggle function", () => {
        resetCalc();
        calcLogic.inputNumber('5');
        calcLogic.handleFunction('sign'); // display is "-5"
        assertEqual(calcLogic.getState().display, '-5');
        calcLogic.handleFunction('sign'); // display is "5"
        assertEqual(calcLogic.getState().display, '5');
        calcLogic.inputNumber('0'); // display is "50"
        calcLogic.handleFunction('sign'); // display is "-50"
        assertEqual(calcLogic.getState().display, '-50');
        // Check after an operation
        calcLogic.handleOperator('add');
        calcLogic.inputNumber('10');
        calcLogic.calculate(); // -50 + 10 = -40
        calcLogic.handleFunction('sign'); // display is "40"
        assertEqual(calcLogic.getState().display, '40');
    });


    // --- Display Results ---
    displayResults();
})();
