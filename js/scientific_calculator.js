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
        parenthesesCount: 0
    };

    const _updateDisplay = () => {
        if (typeof onDisplayChangeCallback === 'function') {
            onDisplayChangeCallback(calculator);
        }
    };

    function inputNumber(numStr) {
        const num = String(numStr);
        if (calculator.display.startsWith('Error')) calculator.display = '0';
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
        if (calculator.previousValue === null) return inputValue;
        if (isNaN(inputValue) && calculator.display.startsWith("Error")) {
             return calculator.previousValue;
        }
        let result = calculator.previousValue;
        switch (calculator.operator) {
            case 'add': result += inputValue; break;
            case 'subtract': result -= inputValue; break;
            case 'multiply': result *= inputValue; break;
            case 'divide':
                if (inputValue === 0) {
                    if (typeof Toast !== 'undefined' && Toast.show) Toast.show("0으로 나눌 수 없습니다.", "danger");
                    return 'Error: Div by 0';
                }
                result /= inputValue;
                break;
            case 'power': result = Math.pow(result, inputValue); break;
            default: return inputValue;
        }
        if (!isFinite(result)) { // Catch Infinity or -Infinity from calculation
            if (typeof Toast !== 'undefined' && Toast.show) Toast.show("결과값이 너무 크거나 작습니다 (무한대).", "danger");
            return 'Error: Overflow';
        }
        return result;
    }

    function handleOperator(nextOperator) {
        const inputValue = parseFloat(calculator.display);
        if (calculator.display.startsWith('Error')) {
             calculator.previousValue = null;
             calculator.operator = null;
             calculator.expression = '';
             return;
        }
        if (calculator.waitingForOperand && calculator.operator) {
            // Only change operator
        } else if (calculator.operator && calculator.previousValue !== null && !calculator.waitingForOperand) {
            const calcResult = performCalculation();
            if (typeof calcResult === 'string' && calcResult.startsWith('Error')) {
                calculator.display = calcResult; // Error message already shown by performCalculation
                calculator.previousValue = null;
                calculator.operator = null;
                calculator.expression = '';
                _updateDisplay();
                return;
            }
            calculator.display = `${parseFloat(calcResult.toFixed(10))}`;
            calculator.previousValue = calcResult;
        } else {
            calculator.previousValue = inputValue;
        }
        calculator.waitingForOperand = true;
        calculator.operator = nextOperator;
        calculator.expression = `${calculator.previousValue} ${getOperatorSymbol(nextOperator)} `;
        _updateDisplay();
    }

    function toRadians(valueInCurrentMode) { /* ... same ... */ }
    function fromRadians(radians) { /* ... same ... */ }
    function factorial(n) { /* ... same ... */ }

    function handleFunction(funcKey) {
        let value = parseFloat(calculator.display);
        if (calculator.display.startsWith('Error') && funcKey !== 'clearAll' && funcKey !== 'clearEntry') {
             return;
        }
        let result;
        let errorMsg = "잘못된 입력 또는 연산입니다."; // Default error for functions

        switch (funcKey) {
            case 'reciprocal':
                if (value === 0) { result = 'Error: Div by 0'; errorMsg = "0으로 나눌 수 없습니다."; }
                else result = 1 / value;
                break;
            case 'sqrt':
                if (value < 0) { result = 'Error: Neg sqrt'; errorMsg = "음수의 제곱근은 계산할 수 없습니다."; }
                else result = Math.sqrt(value);
                break;
            case 'log':
                if (value <= 0) { result = 'Error: Log domain'; errorMsg = "로그 함수의 진수는 양수여야 합니다."; }
                else result = Math.log10(value);
                break;
            case 'ln':
                if (value <= 0) { result = 'Error: Log domain'; errorMsg = "로그 함수의 진수는 양수여야 합니다."; }
                else result = Math.log(value);
                break;
            // Other cases from before...
            case 'square': result = value * value; break;
            case 'cube': result = value * value * value; break;
            case 'cbrt': result = Math.cbrt(value); break;
            case 'percent':
                if (calculator.previousValue !== null && calculator.operator) {
                    result = calculator.previousValue * (value / 100);
                } else { result = value / 100; }
                break;
            case 'factorial': result = factorial(value); if(isNaN(result)) errorMsg="팩토리얼은 음이 아닌 정수만 가능합니다."; break;
            case 'abs': result = Math.abs(value); break;
            case 'round': result = Math.round(value); break;
            case 'sign': result = -value; break;
            case 'sin': result = calculator.shiftMode ? fromRadians(Math.asin(value)) : Math.sin(toRadians(value)); break;
            case 'cos': result = calculator.shiftMode ? fromRadians(Math.acos(value)) : Math.cos(toRadians(value)); break;
            case 'tan': result = calculator.shiftMode ? fromRadians(Math.atan(value)) : Math.tan(toRadians(value)); break;
            case 'exp': result = Math.exp(value); break;
            case '10pow': result = Math.pow(10, value); break;
            case 'pi': result = Math.PI; calculator.waitingForOperand = false; break;
            case 'e': result = Math.E; calculator.waitingForOperand = false; break;
            case 'ans': result = calculator.answer; calculator.waitingForOperand = false; break;
            default: _updateDisplay(); return;
        }

        if (typeof result === 'string' && result.startsWith('Error')) {
            calculator.display = result;
            if (typeof Toast !== 'undefined' && Toast.show) Toast.show(errorMsg, "danger");
        } else if (result !== undefined && !isNaN(result) && isFinite(result)) {
            calculator.display = String(parseFloat(result.toFixed(10)));
            if (funcKey !== 'pi' && funcKey !== 'e' && funcKey !== 'ans' && funcKey !== 'sign') {
                 calculator.waitingForOperand = true;
            }
        } else if (result !== undefined) { // NaN or Infinity from Math functions
            calculator.display = 'Error';
            if (typeof Toast !== 'undefined' && Toast.show) Toast.show(errorMsg, "danger");
        }
        
        if (calculator.shiftMode && ['sin', 'cos', 'tan'].includes(funcKey)) {
            calculator.shiftMode = false;
        }
        if (!calculator.display.startsWith('Error') && funcKey !== 'pi' && funcKey !== 'e' && funcKey !== 'ans' && funcKey !== 'sign') {
             calculator.previousValue = parseFloat(calculator.display);
        }
        _updateDisplay();
    }

    function handleMemory(action) { /* ... same, no specific error toasts needed here ... */ }
    function clearAll() { /* ... same ... */ }
    function clearEntry() { /* ... same ... */ }
    function backspace() { /* ... same ... */ }
    function calculate() { /* ... same, performCalculation handles error display/toast ... */ }
    function changeAngleMode() { /* ... same ... */ }
    function toggleShiftMode() { /* ... same ... */ }

    // Re-pasting full functions that were shortened with /* ... same ... */
    toRadians = function(valueInCurrentMode) {
        switch (calculator.angleMode) {
            case 'DEG': return valueInCurrentMode * Math.PI / 180;
            case 'RAD': return valueInCurrentMode;
            case 'GRAD': return valueInCurrentMode * Math.PI / 200;
            default: return valueInCurrentMode;
        }
    };
    fromRadians = function(radians) {
        switch (calculator.angleMode) {
            case 'DEG': return radians * 180 / Math.PI;
            case 'RAD': return radians;
            case 'GRAD': return radians * 200 / Math.PI;
            default: return radians;
        }
    };
    factorial = function(n) {
        n = parseFloat(n);
        if (n < 0 || n !== Math.floor(n) || isNaN(n)) return NaN;
        if (n === 0 || n === 1) return 1;
        let result = 1;
        for (let i = 2; i <= n; i++) { result *= i; }
        return result;
    };
    handleMemory = function(action) {
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
    };
    clearAll = function() {
        calculator.display = '0'; calculator.expression = ''; calculator.previousValue = null;
        calculator.operator = null; calculator.waitingForOperand = false; _updateDisplay();
    };
    clearEntry = function() {
        calculator.display = '0'; calculator.waitingForOperand = true; _updateDisplay();
    };
    backspace = function() {
        if (calculator.waitingForOperand || calculator.display.startsWith('Error') || calculator.display === '0') return;
        calculator.display = (calculator.display.length > 1) ? calculator.display.slice(0, -1) : '0';
        _updateDisplay();
    };
    calculate = function() {
        if (calculator.operator && calculator.previousValue !== null) {
            const calcResult = performCalculation();
            if (typeof calcResult === 'string' && calcResult.startsWith('Error')) {
                calculator.display = calcResult; // Error already toasted by performCalculation or handleFunction
                calculator.previousValue = null; calculator.operator = null;
            } else {
                calculator.display = String(parseFloat(calcResult.toFixed(10)));
                calculator.answer = calcResult;
                calculator.previousValue = calcResult;
            }
        } else if (calculator.previousValue === null && !calculator.display.startsWith('Error')) {
            calculator.answer = parseFloat(calculator.display);
        }
        calculator.waitingForOperand = true; calculator.expression = ''; calculator.operator = null;
        _updateDisplay();
    };
    changeAngleMode = function() {
        const modes = ['DEG', 'RAD', 'GRAD'];
        const currentIndex = modes.indexOf(calculator.angleMode);
        calculator.angleMode = modes[(currentIndex + 1) % modes.length];
        _updateDisplay();
    };
    toggleShiftMode = function() {
        calculator.shiftMode = !calculator.shiftMode;
        _updateDisplay();
    };
    // End of re-pasted functions

    return {
        getState: () => JSON.parse(JSON.stringify(calculator)),
        inputNumber, inputDecimal, handleOperator, calculate, handleFunction,
        handleMemory, clearAll, clearEntry, backspace, changeAngleMode, toggleShiftMode,
        _setState_FOR_TESTING_ONLY: (newState) => {
            Object.assign(calculator, newState);
            _updateDisplay();
        }
    };
}

function initializeScientificCalculator() { /* ... same as before, no changes to this UI part ... */ }

// Re-paste initializeScientificCalculator for completeness, assuming no functional change needed for this step
initializeScientificCalculator = function() {
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
                default: calculatorInstance.handleFunction(action); break;
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
        else { handled = false; }
        if (handled) e.preventDefault();
    });
    displayChangeCallback(calculatorInstance.getState());
};


if (typeof module !== 'undefined' && module.exports) {
    module.exports = { createCalculatorLogic, initializeScientificCalculator };
} else if (typeof window !== 'undefined') {
    window.initializeScientificCalculator = initializeScientificCalculator;
    window.createCalculatorLogic = createCalculatorLogic;
}
