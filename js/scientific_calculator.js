// 공학용 계산기 로직
// 이 객체/클래스는 계산기의 상태와 핵심 연산 로직을 관리합니다.
// DOM 조작은 콜백이나 외부 함수를 통해 처리되도록 하여 테스트 용이성을 높입니다.

function createCalculatorLogic(onDisplayChangeCallback) {
    const calculator = {
        display: '0',
        expression: '',
        previousValue: null,
        operator: null,
        waitingForOperand: false,
        memory: 0,
        answer: 0,
        angleMode: 'DEG', // DEG, RAD, GRAD
        shiftMode: false,
        parenthesesCount: 0 // TODO: Parentheses logic not fully implemented in original code
    };

    // 외부에서 디스플레이 변경을 처리할 콜백
    const _updateDisplay = () => {
        if (typeof onDisplayChangeCallback === 'function') {
            onDisplayChangeCallback(calculator); // Pass the internal state
        }
    };

    function inputNumber(numStr) {
        const num = String(numStr); // Ensure it's a string
        if (calculator.display.startsWith('Error')) calculator.display = '0'; // Clear error on new number
        if (calculator.waitingForOperand) {
            calculator.display = num;
            calculator.waitingForOperand = false;
        } else {
            calculator.display = calculator.display === '0' ? num : calculator.display + num;
        }
        _updateDisplay();
    }

    function inputDecimal() {
        if (calculator.display.startsWith('Error')) calculator.display = '0.';
        if (calculator.waitingForOperand) {
            calculator.display = '0.';
            calculator.waitingForOperand = false;
        } else if (calculator.display.indexOf('.') === -1) {
            calculator.display += '.';
        }
        _updateDisplay();
    }

    function getOperatorSymbol(operator) {
        const symbols = {
            'add': '+', 'subtract': '−', 'multiply': '×', 'divide': '÷', 'power': '^'
        };
        return symbols[operator] || '';
    }

    function performCalculation() {
        let inputValue = parseFloat(calculator.display);
        // If waitingForOperand is true, it means an op was just pressed, and display is previousValue
        // So, the actual second operand should be previousValue itself (e.g. 5 * = -> 5*5)
        // However, if a number was pressed after op, display is already the new inputValue
        // This needs careful handling of waitingForOperand state.
        // Let's assume previousValue is always the first, and current display is the second.
        // If an operator was the last thing pressed, then display is the first operand,
        // and we might need to use previousValue as the second operand (e.g. 5 * =).
        // For now, the simple sequential logic is:
        if (calculator.previousValue === null) return inputValue;

        // Handle case where previousValue is valid but current display is an error
        if (isNaN(inputValue) && calculator.display.startsWith("Error")) {
             return calculator.previousValue; // Or propagate error, or clear. For now, return previous.
        }


        let result = calculator.previousValue;

        switch (calculator.operator) {
            case 'add': result += inputValue; break;
            case 'subtract': result -= inputValue; break;
            case 'multiply': result *= inputValue; break;
            case 'divide':
                if (inputValue === 0) return 'Error: Div by 0';
                result /= inputValue;
                break;
            case 'power': result = Math.pow(result, inputValue); break;
            default: return inputValue; // Should not happen if operator is set
        }
        return result;
    }

    function handleOperator(nextOperator) {
        const inputValue = parseFloat(calculator.display);

        if (calculator.display.startsWith('Error')) {
             calculator.previousValue = null;
             calculator.operator = null;
             calculator.expression = '';
             // _updateDisplay(); // Error is already on display
             return;
        }

        // If an operator is pressed and we are waiting for an operand,
        // it means we are changing the operator (e.g. 5 + - 2)
        if (calculator.waitingForOperand && calculator.operator) {
            // Update operator, keep previousValue
        } else if (calculator.operator && calculator.previousValue !== null && !calculator.waitingForOperand) {
            // We have previousValue, an operator, and a new operand (current display)
            const calcResult = performCalculation();
            if (typeof calcResult === 'string' && calcResult.startsWith('Error')) {
                calculator.display = calcResult;
                calculator.previousValue = null;
                calculator.operator = null;
                calculator.expression = '';
                _updateDisplay();
                return;
            }
            calculator.display = `${parseFloat(calcResult.toFixed(10))}`; // Show result before setting up next op
            calculator.previousValue = calcResult;
        } else {
            // No current operator, or no previous calculation to perform
            calculator.previousValue = inputValue;
        }

        calculator.waitingForOperand = true;
        calculator.operator = nextOperator;
        // Expression should reflect the state *before* this operation for clarity
        // or the value that will be used as the first operand for the *next* operation.
        calculator.expression = `${calculator.previousValue} ${getOperatorSymbol(nextOperator)} `;
        _updateDisplay();
    }

    function toRadians(valueInCurrentMode) {
        switch (calculator.angleMode) {
            case 'DEG': return valueInCurrentMode * Math.PI / 180;
            case 'RAD': return valueInCurrentMode;
            case 'GRAD': return valueInCurrentMode * Math.PI / 200;
            default: return valueInCurrentMode;
        }
    }

    function fromRadians(radians) {
        switch (calculator.angleMode) {
            case 'DEG': return radians * 180 / Math.PI;
            case 'RAD': return radians;
            case 'GRAD': return radians * 200 / Math.PI;
            default: return radians;
        }
    }

    function factorial(n) {
        n = parseFloat(n); // Ensure n is a number
        if (n < 0 || n !== Math.floor(n) || isNaN(n)) return NaN;
        if (n === 0 || n === 1) return 1;
        let result = 1;
        for (let i = 2; i <= n; i++) { result *= i; }
        return result;
    }

    function handleFunction(funcKey) {
        let value = parseFloat(calculator.display);
        if (calculator.display.startsWith('Error') && funcKey !== 'clearAll' && funcKey !== 'clearEntry') {
             return;
        }
        let result;

        switch (funcKey) {
            case 'reciprocal': result = (value === 0) ? 'Error: Div by 0' : 1 / value; break;
            case 'square': result = value * value; break;
            case 'cube': result = value * value * value; break;
            case 'sqrt': result = (value < 0) ? 'Error: Neg sqrt' : Math.sqrt(value); break;
            case 'cbrt': result = Math.cbrt(value); break;
            case 'percent':
                if (calculator.previousValue !== null && calculator.operator) {
                    // Percent of the previous value, e.g., 100 + 10% (of 100) = 110
                    result = calculator.previousValue * (value / 100);
                } else {
                    result = value / 100; // Simple percent
                }
                break;
            case 'factorial': result = factorial(value); break;
            case 'abs': result = Math.abs(value); break;
            case 'round': result = Math.round(value); break;
            case 'sign': result = -value; break;
            case 'sin': result = calculator.shiftMode ? fromRadians(Math.asin(value)) : Math.sin(toRadians(value)); break;
            case 'cos': result = calculator.shiftMode ? fromRadians(Math.acos(value)) : Math.cos(toRadians(value)); break;
            case 'tan': result = calculator.shiftMode ? fromRadians(Math.atan(value)) : Math.tan(toRadians(value)); break;
            case 'log': result = (value <= 0) ? 'Error: Log domain' : Math.log10(value); break;
            case 'ln': result = (value <= 0) ? 'Error: Log domain' : Math.log(value); break;
            case 'exp': result = Math.exp(value); break;
            case '10pow': result = Math.pow(10, value); break;
            case 'pi': result = Math.PI; calculator.waitingForOperand = false; break;
            case 'e': result = Math.E; calculator.waitingForOperand = false; break;
            case 'ans': result = calculator.answer; calculator.waitingForOperand = false; break;
            default: _updateDisplay(); return;
        }

        if (typeof result === 'string' && result.startsWith('Error')) {
            calculator.display = result;
        } else if (result !== undefined && !isNaN(result) && isFinite(result)) {
            calculator.display = String(parseFloat(result.toFixed(10)));
            if (funcKey !== 'pi' && funcKey !== 'e' && funcKey !== 'ans' && funcKey !== 'sign') {
                 calculator.waitingForOperand = true;
            }
        } else if (result !== undefined) { // NaN or Infinity from Math functions
            calculator.display = 'Error';
        }
        
        if (calculator.shiftMode && ['sin', 'cos', 'tan'].includes(funcKey)) {
            calculator.shiftMode = false;
        }
        // If a function results in a value (not error), it can be used as previousValue for next op
        // but an operator must be pressed next, so waitingForOperand should be true.
        // Constants like PI/E/ANS set waitingForOperand to false to allow number concatenation.
        // Sign change should not make it wait for new operand.
        if (!calculator.display.startsWith('Error') && funcKey !== 'pi' && funcKey !== 'e' && funcKey !== 'ans' && funcKey !== 'sign') {
             calculator.previousValue = parseFloat(calculator.display);
        }


        _updateDisplay();
    }

    function handleMemory(action) {
        let value = parseFloat(calculator.display);
        if (calculator.display.startsWith('Error') && action !== 'memory-clear' && action !== 'memory-recall') return;
        if (isNaN(value) && action !== 'memory-clear' && action !== 'memory-recall') return;


        switch (action) {
            case 'memory-plus': calculator.memory += value; break;
            case 'memory-minus': calculator.memory -= value; break;
            case 'memory-recall':
                calculator.display = String(calculator.memory);
                calculator.waitingForOperand = false;
                break;
            case 'memory-clear': calculator.memory = 0; break;
        }
        _updateDisplay();
    }

    function clearAll() {
        calculator.display = '0';
        calculator.expression = '';
        calculator.previousValue = null;
        calculator.operator = null;
        calculator.waitingForOperand = false;
        _updateDisplay();
    }

    function clearEntry() {
        calculator.display = '0';
        // If an operator was just pressed (e.g. 5 * CE), previousValue and operator should remain.
        // waitingForOperand should be true to indicate next input is the second operand.
        calculator.waitingForOperand = true;
        _updateDisplay();
    }

    function backspace() {
        if (calculator.waitingForOperand || calculator.display.startsWith('Error')) return;
        if (calculator.display === '0') return;


        if (calculator.display.length > 1) {
            calculator.display = calculator.display.slice(0, -1);
        } else {
            calculator.display = '0';
        }
        _updateDisplay();
    }

    function calculate() {
        if (calculator.operator && calculator.previousValue !== null) {
            // If waitingForOperand is true, it means an operator was just pressed,
            // and the display value is actually the first operand.
            // Use the display value as the second operand in this "repeat last operation" or "equals after operator" scenario.
            const secondOperand = calculator.waitingForOperand ? calculator.previousValue : parseFloat(calculator.display);

            // Temporarily set display for performCalculation if needed
            const originalDisplay = calculator.display;
            if(calculator.waitingForOperand) calculator.display = String(secondOperand);


            const calcResult = performCalculation(); // Uses calculator.previousValue and current calculator.display

            if(calculator.waitingForOperand) calculator.display = originalDisplay; // Restore display if it was temp changed


            if (typeof calcResult === 'string' && calcResult.startsWith('Error')) {
                calculator.display = calcResult;
                calculator.previousValue = null; // Clear previousValue on error
                calculator.operator = null;    // Clear operator on error
            } else {
                calculator.display = String(parseFloat(calcResult.toFixed(10)));
                calculator.answer = calcResult;
                calculator.previousValue = calcResult; // The result of '=' becomes the new previousValue for chained ops.
            }
        } else if (calculator.previousValue === null && !calculator.display.startsWith('Error')) {
            // If only a number is on display and '=' is pressed, save it as answer
            calculator.answer = parseFloat(calculator.display);
        }
        // After '=', we are ready for a new number or for the result to be used as first operand.
        calculator.waitingForOperand = true;
        calculator.expression = '';
        // calculator.operator = null; // Keep operator for potential chained operations with result? No, typically cleared.
        calculator.operator = null;
        _updateDisplay();
    }

    function changeAngleMode() {
        const modes = ['DEG', 'RAD', 'GRAD'];
        const currentIndex = modes.indexOf(calculator.angleMode);
        calculator.angleMode = modes[(currentIndex + 1) % modes.length];
        _updateDisplay();
    }

    function toggleShiftMode() {
        calculator.shiftMode = !calculator.shiftMode;
        _updateDisplay();
    }

    return {
        getState: () => JSON.parse(JSON.stringify(calculator)), // Deep copy for true state isolation
        inputNumber, inputDecimal, handleOperator, calculate, handleFunction,
        handleMemory, clearAll, clearEntry, backspace, changeAngleMode, toggleShiftMode,
        // Expose for testing or direct state manipulation if absolutely needed (use with caution)
        _setState_FOR_TESTING_ONLY: (newState) => {
            Object.assign(calculator, newState);
            _updateDisplay(); // Ensure UI reflects the new state if callback is provided
        }
    };
}

// This function will be called by the main HTML page to set up the calculator UI
function initializeScientificCalculator() {
    // console.log('공학용 계산기 UI 초기화');
    const mainDisplayEl = typeof DOMUtils !== 'undefined' ? DOMUtils.getElement('#mainDisplay') : document.getElementById('mainDisplay');
    const expressionDisplayEl = typeof DOMUtils !== 'undefined' ? DOMUtils.getElement('#expressionDisplay') : document.getElementById('expressionDisplay');
    const angleModeDisplayEl = typeof DOMUtils !== 'undefined' ? DOMUtils.getElement('#angleMode') : document.getElementById('angleMode');
    const memoryIndicatorEl = typeof DOMUtils !== 'undefined' ? DOMUtils.getElement('#memoryIndicator') : document.getElementById('memoryIndicator');
    const calculatorElement = typeof DOMUtils !== 'undefined' ? DOMUtils.getElement('.calculator-modern') : document.querySelector('.calculator-modern');

    const displayChangeCallback = (calcState) => {
        if (mainDisplayEl) mainDisplayEl.textContent = calcState.display;
        if (expressionDisplayEl) expressionDisplayEl.textContent = calcState.expression;
        if (angleModeDisplayEl) angleModeDisplayEl.textContent = calcState.angleMode;
        if (memoryIndicatorEl) memoryIndicatorEl.style.display = calcState.memory !== 0 ? 'inline' : 'none';

        if (calculatorElement) {
            if (calcState.shiftMode) calculatorElement.classList.add('shift-mode');
            else calculatorElement.classList.remove('shift-mode');
        }
    };

    const calculatorInstance = createCalculatorLogic(displayChangeCallback);

    const DUtils = typeof DOMUtils !== 'undefined' ? DOMUtils : { getElements: (s) => document.querySelectorAll(s), addEvent: (el, ev, h) => el.addEventListener(ev,h) };

    DUtils.getElements('.btn-calc-modern').forEach(button => {
        DUtils.addEvent(button, 'click', () => {
            const action = button.dataset.action;
            const value = button.dataset.value;

            switch (action) {
                case 'number': calculatorInstance.inputNumber(value); break;
                case 'decimal': calculatorInstance.inputDecimal(); break;
                case 'add': case 'subtract': case 'multiply': case 'divide': case 'power':
                    calculatorInstance.handleOperator(action); break;
                case 'equals': calculatorInstance.calculate(); break;
                case 'clear': calculatorInstance.clearAll(); break;
                case 'clear-entry': calculatorInstance.clearEntry(); break;
                case 'backspace': calculatorInstance.backspace(); break;
                case 'shift': calculatorInstance.toggleShiftMode(); break;
                case 'mode': calculatorInstance.changeAngleMode(); break;
                case 'memory-plus': case 'memory-minus': case 'memory-recall': case 'memory-clear':
                    calculatorInstance.handleMemory(action); break;
                default:
                    calculatorInstance.handleFunction(action); break;
            }
        });
    });

    DUtils.addEvent(document, 'keydown', (e) => {
        if (!calculatorElement || !calculatorElement.offsetParent) return;
        let handled = true;
        if (e.key >= '0' && e.key <= '9') calculatorInstance.inputNumber(e.key);
        else if (e.key === '.') calculatorInstance.inputDecimal();
        else if (e.key === '+') calculatorInstance.handleOperator('add');
        else if (e.key === '-') calculatorInstance.handleOperator('subtract');
        else if (e.key === '*') calculatorInstance.handleOperator('multiply');
        else if (e.key === '/') { calculatorInstance.handleOperator('divide');}
        else if (e.key === '^') calculatorInstance.handleOperator('power');
        else if (e.key === 'Enter' || e.key === '=') { calculatorInstance.calculate(); }
        else if (e.key === 'Escape') calculatorInstance.clearAll();
        else if (e.key.toLowerCase() === 'c' && !e.ctrlKey && !e.metaKey) {
             if(!(document.activeElement && (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA"))) {
                calculatorInstance.clearAll();
             } else { handled = false; }
        }
        else if (e.key === 'Backspace') { calculatorInstance.backspace(); }
        else { handled = false; } // Not a calculator key
        if (handled) e.preventDefault();
    });

    // Initial display call
    displayChangeCallback(calculatorInstance.getState());
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { createCalculatorLogic, initializeScientificCalculator };
} else if (typeof window !== 'undefined') {
    window.initializeScientificCalculator = initializeScientificCalculator;
    window.createCalculatorLogic = createCalculatorLogic; // Expose for testing/console
}
