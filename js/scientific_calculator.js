// 공학용 계산기 초기화 함수
function initializeScientificCalculator() {
    // console.log('공학용 계산기 초기화');
    
    // 계산기 상태 관리
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

    // DOM 요소 참조
    const mainDisplay = document.getElementById('mainDisplay');
    const expressionDisplay = document.getElementById('expressionDisplay');
    const angleModeDisplay = document.getElementById('angleMode');
    const memoryIndicator = document.getElementById('memoryIndicator');
    const calculatorElement = document.querySelector('.calculator-modern');

    // 디스플레이 업데이트
    function updateDisplay() {
        mainDisplay.textContent = calculator.display;
        expressionDisplay.textContent = calculator.expression;
        angleModeDisplay.textContent = calculator.angleMode;
        memoryIndicator.style.display = calculator.memory !== 0 ? 'inline' : 'none';
        
        if (calculator.shiftMode) {
            calculatorElement.classList.add('shift-mode');
        } else {
            calculatorElement.classList.remove('shift-mode');
        }
    }

    // 숫자 입력
    function inputNumber(num) {
        if (calculator.waitingForOperand) {
            calculator.display = String(num);
            calculator.waitingForOperand = false;
        } else {
            calculator.display = calculator.display === '0' ? String(num) : calculator.display + num;
        }
        updateDisplay();
    }

    // 소수점 입력
    function inputDecimal() {
        if (calculator.waitingForOperand) {
            calculator.display = '0.';
            calculator.waitingForOperand = false;
        } else if (calculator.display.indexOf('.') === -1) {
            calculator.display += '.';
        }
        updateDisplay();
    }

    // 기본 연산자 처리
    function handleOperator(nextOperator) {
        const inputValue = parseFloat(calculator.display);

        if (calculator.previousValue === null) {
            calculator.previousValue = inputValue;
        } else if (calculator.operator) {
            const result = performCalculation();
            calculator.display = `${parseFloat(result.toFixed(10))}`;
            calculator.previousValue = result;
        }

        calculator.waitingForOperand = true;
        calculator.operator = nextOperator;
        
        // 수식 표시 업데이트
        if (calculator.expression === '' || calculator.waitingForOperand) {
            calculator.expression = `${calculator.display} ${getOperatorSymbol(nextOperator)} `;
        } else {
            calculator.expression += `${calculator.display} ${getOperatorSymbol(nextOperator)} `;
        }
        
        updateDisplay();
    }

    // 연산 수행
    function performCalculation() {
        const inputValue = parseFloat(calculator.display);
        let result = calculator.previousValue;

        switch (calculator.operator) {
            case 'add':
                result += inputValue;
                break;
            case 'subtract':
                result -= inputValue;
                break;
            case 'multiply':
                result *= inputValue;
                break;
            case 'divide':
                result /= inputValue;
                break;
            case 'power':
                result = Math.pow(result, inputValue);
                break;
            default:
                return inputValue;
        }

        return result;
    }

    // 연산자 기호 변환
    function getOperatorSymbol(operator) {
        const symbols = {
            'add': '+',
            'subtract': '−',
            'multiply': '×',
            'divide': '÷',
            'power': '^'
        };
        return symbols[operator] || '';
    }

    // 각도 변환 함수
    function toRadians(degrees) {
        switch (calculator.angleMode) {
            case 'DEG':
                return degrees * Math.PI / 180;
            case 'RAD':
                return degrees;
            case 'GRAD':
                return degrees * Math.PI / 200;
            default:
                return degrees;
        }
    }

    function fromRadians(radians) {
        switch (calculator.angleMode) {
            case 'DEG':
                return radians * 180 / Math.PI;
            case 'RAD':
                return radians;
            case 'GRAD':
                return radians * 200 / Math.PI;
            default:
                return radians;
        }
    }

    // 공학 함수 처리
    function handleFunction(func) {
        let value = parseFloat(calculator.display);
        let result;

        switch (func) {
            // 기본 함수
            case 'reciprocal':
                result = 1 / value;
                break;
            case 'square':
                result = value * value;
                break;
            case 'cube':
                result = value * value * value;
                break;
            case 'sqrt':
                result = Math.sqrt(value);
                break;
            case 'cbrt':
                result = Math.cbrt(value);
                break;
            case 'percent':
                result = value / 100;
                break;
            case 'factorial':
                result = factorial(value);
                break;
            case 'abs':
                result = Math.abs(value);
                break;
            case 'round':
                result = Math.round(value);
                break;
            case 'sign':
                result = -value;
                break;
                
            // 삼각함수
            case 'sin':
                result = calculator.shiftMode ? 
                    fromRadians(Math.asin(value)) : 
                    Math.sin(toRadians(value));
                break;
            case 'cos':
                result = calculator.shiftMode ? 
                    fromRadians(Math.acos(value)) : 
                    Math.cos(toRadians(value));
                break;
            case 'tan':
                result = calculator.shiftMode ? 
                    fromRadians(Math.atan(value)) : 
                    Math.tan(toRadians(value));
                break;
            case 'asin':
                result = fromRadians(Math.asin(value));
                break;
            case 'acos':
                result = fromRadians(Math.acos(value));
                break;
            case 'atan':
                result = fromRadians(Math.atan(value));
                break;
                
            // 로그 및 지수
            case 'log':
                result = Math.log10(value);
                break;
            case 'ln':
                result = Math.log(value);
                break;
            case 'exp':
                result = Math.exp(value);
                break;
            case '10pow':
                result = Math.pow(10, value);
                break;
                
            // 상수
            case 'pi':
                result = Math.PI;
                break;
            case 'e':
                result = Math.E;
                break;
            case 'ans':
                result = calculator.answer;
                break;
                
            default:
                return;
        }

        if (!isNaN(result) && isFinite(result)) {
            calculator.display = String(result);
            calculator.waitingForOperand = true;
            
            // shift 모드 해제
            if (calculator.shiftMode && ['sin', 'cos', 'tan'].includes(func)) {
                calculator.shiftMode = false;
            }
        } else {
            calculator.display = 'Error';
        }
        
        updateDisplay();
    }

    // 팩토리얼 계산
    function factorial(n) {
        if (n < 0 || n !== Math.floor(n)) return NaN;
        if (n === 0 || n === 1) return 1;
        let result = 1;
        for (let i = 2; i <= n; i++) {
            result *= i;
        }
        return result;
    }

    // 메모리 기능
    function handleMemory(action) {
        const value = parseFloat(calculator.display);
        
        switch (action) {
            case 'memory-plus':
                calculator.memory += value;
                break;
            case 'memory-minus':
                calculator.memory -= value;
                break;
            case 'memory-recall':
                calculator.display = String(calculator.memory);
                calculator.waitingForOperand = true;
                break;
            case 'memory-clear':
                calculator.memory = 0;
                break;
        }
        
        updateDisplay();
    }

    // 클리어 기능
    function clear() {
        calculator.display = '0';
        calculator.expression = '';
        calculator.previousValue = null;
        calculator.operator = null;
        calculator.waitingForOperand = false;
        calculator.parenthesesCount = 0;
        updateDisplay();
    }

    function clearEntry() {
        calculator.display = '0';
        calculator.waitingForOperand = true;
        updateDisplay();
    }

    function backspace() {
        if (calculator.display.length > 1) {
            calculator.display = calculator.display.slice(0, -1);
        } else {
            calculator.display = '0';
        }
        updateDisplay();
    }

    // 등호 처리
    function calculate() {
        if (calculator.operator && calculator.previousValue !== null) {
            const result = performCalculation();
            calculator.display = String(result);
            calculator.expression = '';
            calculator.previousValue = null;
            calculator.operator = null;
            calculator.waitingForOperand = true;
            calculator.answer = result; // ANS 저장
        }
        updateDisplay();
    }

    // 모드 변경
    function changeMode() {
        const modes = ['DEG', 'RAD', 'GRAD'];
        const currentIndex = modes.indexOf(calculator.angleMode);
        calculator.angleMode = modes[(currentIndex + 1) % modes.length];
        updateDisplay();
    }

    // 버튼 클릭 이벤트 처리
    document.querySelectorAll('.btn-calc-modern').forEach(button => {
        button.addEventListener('click', () => {
            const action = button.dataset.action;
            const value = button.dataset.value;

            switch (action) {
                case 'number':
                    inputNumber(value);
                    break;
                case 'decimal':
                    inputDecimal();
                    break;
                case 'add':
                case 'subtract':
                case 'multiply':
                case 'divide':
                case 'power':
                    handleOperator(action);
                    break;
                case 'equals':
                    calculate();
                    break;
                case 'clear':
                    clear();
                    break;
                case 'clear-entry':
                    clearEntry();
                    break;
                case 'backspace':
                    backspace();
                    break;
                case 'shift':
                    calculator.shiftMode = !calculator.shiftMode;
                    updateDisplay();
                    break;
                case 'mode':
                    changeMode();
                    break;
                case 'memory-plus':
                case 'memory-minus':
                case 'memory-recall':
                case 'memory-clear':
                    handleMemory(action);
                    break;
                default:
                    handleFunction(action);
            }
        });
    });

    // 키보드 이벤트 처리
    document.addEventListener('keydown', (e) => {
        // 계산기가 표시되어 있을 때만 키보드 이벤트 처리
        if (!calculatorElement || !calculatorElement.offsetParent) return;

        if (e.key >= '0' && e.key <= '9') {
            inputNumber(e.key);
        } else if (e.key === '.') {
            inputDecimal();
        } else if (e.key === '+') {
            handleOperator('add');
        } else if (e.key === '-') {
            handleOperator('subtract');
        } else if (e.key === '*') {
            handleOperator('multiply');
        } else if (e.key === '/') {
            e.preventDefault();
            handleOperator('divide');
        } else if (e.key === 'Enter' || e.key === '=') {
            calculate();
        } else if (e.key === 'Escape') {
            clear();
        } else if (e.key === 'Backspace') {
            e.preventDefault();
            backspace();
        }
    });

    // 초기 디스플레이 업데이트
    updateDisplay();
}

// 페이지 로드 시 초기화
if (typeof window.initializeScientificCalculator === 'undefined') {
    window.initializeScientificCalculator = initializeScientificCalculator;
}