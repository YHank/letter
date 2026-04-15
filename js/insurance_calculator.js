// 4대보험료 계산기 초기화 함수
function initializeInsuranceCalculator() {
    // console.log('4대보험료 계산기 초기화');
    
    // 상수 정의 (2026년 기준)
    const INSURANCE_RATES = {
        health: 0.03595,      // 건강보험 근로자 부담률 3.595%
        longTermCare: 0.1314, // 장기요양보험 13.14%
        pension: 0.045,       // 국민연금 근로자 부담률 4.5%
        unemployment: 0.009,  // 고용보험 실업급여 0.9%
        stabilitySmall: 0.0025, // 고용안정 우선지원 0.25%
        stabilityRegular: 0.0085 // 고용안정 일반 0.85%
    };
    
    const LIMITS = {
        pensionMin: 400000,   // 국민연금 하한
        pensionMax: 6370000,  // 국민연금 상한
        salaryMin: 100000,    // 최소 급여
        salaryMax: 100000000  // 최대 급여
    };

    function floorToTen(value) {
        return Math.floor(value / 10) * 10;
    }
    
    // 소득세 계산 함수 (간이세액표 기준)
    function calculateIncomeTax(monthlyIncome, dependents) {
        // 간이세액표 기준 (근사치)
        const taxBase = monthlyIncome;
        let tax = 0;
        
        if (taxBase <= 1060000) {
            tax = 0;
        } else if (taxBase <= 1500000) {
            tax = (taxBase * 0.006);
        } else if (taxBase <= 3000000) {
            tax = 9000 + (taxBase - 1500000) * 0.015;
        } else if (taxBase <= 4500000) {
            tax = 31500 + (taxBase - 3000000) * 0.024;
        } else if (taxBase <= 6000000) {
            tax = 67500 + (taxBase - 4500000) * 0.035;
        } else if (taxBase <= 8000000) {
            tax = 120000 + (taxBase - 6000000) * 0.038;
        } else {
            tax = 196000 + (taxBase - 8000000) * 0.040;
        }
        
        // 부양가족 공제 (1인당 약 12,500원)
        const deduction = (dependents - 1) * 12500;
        tax = Math.max(0, tax - deduction);
        
        return floorToTen(tax);
    }
    
    // 계산 함수
    function calculateInsurance() {
        try {
            const monthlySalary = NumberUtils.parseNumber(DOMUtils.getValue('#monthlySalary'));
            const dependents = parseInt(DOMUtils.getValue('#dependents'), 10) || 1;
            const businessType = DOMUtils.getValue('#businessType');
            const industrialRate = NumberUtils.parseNumber(DOMUtils.getValue('#industrialCode'), 1.53);
        
        if (monthlySalary <= 0) {
            alert('월 급여액을 입력해주세요.');
            DOMUtils.getElement('#monthlySalary').focus();
            return;
        }
        
        // 최소/최대값 검증
        if (monthlySalary < LIMITS.salaryMin) {
            alert('월 급여액은 최소 10만원 이상이어야 합니다.');
            DOMUtils.getElement('#monthlySalary').focus();
            return;
        }
        
        if (monthlySalary > LIMITS.salaryMax) {
            alert('월 급여액이 너무 큽니다. 다시 확인해주세요.');
            DOMUtils.getElement('#monthlySalary').focus();
            return;
        }
        
        // 상한선 적용 (2026년 기준)
        const pensionBase = Math.min(Math.max(monthlySalary, LIMITS.pensionMin), LIMITS.pensionMax); // 국민연금 상한: 637만원, 하한: 40만원
        const healthBase = monthlySalary; // 건강보험은 상한 없음
        
        // 1. 건강보험료 계산 (7.19%)
        const healthEmployee = floorToTen(healthBase * INSURANCE_RATES.health); // 근로자 3.595%
        const healthEmployer = floorToTen(healthBase * INSURANCE_RATES.health); // 사업주 3.595%
        const healthTotal = healthEmployee + healthEmployer;
        
        // 2. 장기요양보험료 계산 (건강보험료의 13.14% - 2026년 기준)
        const careEmployee = floorToTen(healthEmployee * INSURANCE_RATES.longTermCare);
        const careEmployer = floorToTen(healthEmployer * INSURANCE_RATES.longTermCare);
        const careTotal = careEmployee + careEmployer;
        
        // 3. 국민연금 계산 (9%)
        const pensionEmployee = floorToTen(pensionBase * INSURANCE_RATES.pension); // 근로자 4.5%
        const pensionEmployer = floorToTen(pensionBase * INSURANCE_RATES.pension); // 사업주 4.5%
        const pensionTotal = pensionEmployee + pensionEmployer;
        
        // 4. 고용보험 계산
        // 실업급여: 1.8% (근로자 0.9%, 사업주 0.9%)
        const unemploymentEmployee = floorToTen(monthlySalary * INSURANCE_RATES.unemployment);
        const unemploymentEmployer = floorToTen(monthlySalary * INSURANCE_RATES.unemployment);
        
        // 고용안정·직업능력개발: 사업주만 부담
        const stabilityRate = businessType === 'small' ? INSURANCE_RATES.stabilitySmall : INSURANCE_RATES.stabilityRegular;
        const stabilityEmployer = floorToTen(monthlySalary * stabilityRate);
        
        const employmentEmployee = unemploymentEmployee;
        const employmentEmployer = unemploymentEmployer + stabilityEmployer;
        const employmentTotal = employmentEmployee + employmentEmployer;
        
        // 5. 산재보험 계산 (사업주 전액 부담)
        const industrialEmployer = floorToTen(monthlySalary * (industrialRate / 100));
        const industrialTotal = industrialEmployer;
        
        // 총계 계산
        const subtotalEmployee = healthEmployee + careEmployee + pensionEmployee + employmentEmployee;
        const subtotalEmployer = healthEmployer + careEmployer + pensionEmployer + employmentEmployer + industrialEmployer;
        const subtotalTotal = subtotalEmployee + subtotalEmployer;
        
        // 소득세 계산
        const incomeTax = calculateIncomeTax(monthlySalary, dependents);
        const localTax = floorToTen(incomeTax * 0.1); // 지방소득세는 소득세의 10%
        
        // 실수령액 계산
        const totalDeduction = subtotalEmployee + incomeTax + localTax;
        const netSalary = floorToTen(monthlySalary - totalDeduction);
        
        // 결과 표시
        DOMUtils.getElement('#resultSection').classList.remove('d-none');
        
        // 요약 정보
        const employmentRateText = businessType === 'small' ? '1.8% (0.9% + 0.9%) + 0.25%' : '1.8% (0.9% + 0.9%) + 0.85%';
        DOMUtils.setTexts({
            '#employeeTotal': NumberUtils.formatCurrency(subtotalEmployee),
            '#employerTotal': NumberUtils.formatCurrency(subtotalEmployer),
            '#netSalary': NumberUtils.formatCurrency(netSalary),
            '#healthEmployee': NumberUtils.formatCurrency(healthEmployee),
            '#healthEmployer': NumberUtils.formatCurrency(healthEmployer),
            '#healthTotal': NumberUtils.formatCurrency(healthTotal),
            '#careEmployee': NumberUtils.formatCurrency(careEmployee),
            '#careEmployer': NumberUtils.formatCurrency(careEmployer),
            '#careTotal': NumberUtils.formatCurrency(careTotal),
            '#pensionEmployee': NumberUtils.formatCurrency(pensionEmployee),
            '#pensionEmployer': NumberUtils.formatCurrency(pensionEmployer),
            '#pensionTotal': NumberUtils.formatCurrency(pensionTotal),
            '#employmentRate': employmentRateText,
            '#employmentEmployee': NumberUtils.formatCurrency(employmentEmployee),
            '#employmentEmployer': NumberUtils.formatCurrency(employmentEmployer),
            '#employmentTotal': NumberUtils.formatCurrency(employmentTotal),
            '#industrialRate': industrialRate + '%',
            '#industrialEmployer': NumberUtils.formatCurrency(industrialEmployer),
            '#industrialTotal': NumberUtils.formatCurrency(industrialTotal),
            '#subtotalEmployee': NumberUtils.formatCurrency(subtotalEmployee),
            '#subtotalEmployer': NumberUtils.formatCurrency(subtotalEmployer),
            '#subtotalTotal': NumberUtils.formatCurrency(subtotalTotal),
            '#healthRate': '7.19%',
            '#careRate': '13.14%',
            '#pensionRate': '9%',
            '#incomeTax': NumberUtils.formatCurrency(incomeTax),
            '#localTax': NumberUtils.formatCurrency(localTax)
        });
        
        // 스크롤 이동
        DOMUtils.getElement('#resultSection').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        // 계산 이력 저장 (localStorage)
        const calculationHistory = {
            date: new Date().toISOString(),
            monthlySalary: monthlySalary,
            netSalary: netSalary,
            totalDeduction: totalDeduction
        };
        
        try {
            let history = window.storageManager.load('insuranceCalculationHistory', [], false);
            history.unshift(calculationHistory);
            history = history.slice(0, 10); // 최근 10개만 저장
            window.storageManager.save('insuranceCalculationHistory', history, false);
        } catch (e) {
            console.error('계산 이력 저장 실패:', e);
        }
        
        } catch (error) {
            console.error('계산 중 오류 발생:', error);
            alert('계산 중 오류가 발생했습니다. 입력값을 확인해주세요.');
        }
    }
    
    // 초기화 함수
    function resetCalculator() {
        const monthlySalaryInput = DOMUtils.getElement('#monthlySalary');
        const dependentsInput = DOMUtils.getElement('#dependents');
        const businessTypeInput = DOMUtils.getElement('#businessType');
        const industrialCodeInput = DOMUtils.getElement('#industrialCode');

        if (monthlySalaryInput) monthlySalaryInput.value = '';
        if (dependentsInput) dependentsInput.value = '1';
        if (businessTypeInput) businessTypeInput.value = 'regular';
        if (industrialCodeInput) industrialCodeInput.value = '0.7';
        DOMUtils.getElement('#resultSection').classList.add('d-none');
    }
    
    // 디바운스 함수 - utils.js의 debounce를 사용하는 경우 주석 처리
    // 현재는 utils.js에 debounce가 없으므로 그대로 유지
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // 실시간 계산 함수
    const autoCalculate = debounce(() => {
        const monthlySalary = NumberUtils.parseNumber(DOMUtils.getValue('#monthlySalary'), NaN);
        if (Number.isFinite(monthlySalary) && monthlySalary >= LIMITS.salaryMin) {
            calculateInsurance();
        }
    }, 500);
    
    // 이벤트 리스너 등록
    const calculateBtn = DOMUtils.getElement('#calculateBtn');
    const resetBtn = DOMUtils.getElement('#resetBtn');
    const salaryInput = DOMUtils.getElement('#monthlySalary');
    
    if (calculateBtn) {
        DOMUtils.addEvent(calculateBtn, 'click', calculateInsurance);
    }
    
    if (resetBtn) {
        DOMUtils.addEvent(resetBtn, 'click', resetCalculator);
    }
    
    // Enter 키로 계산 실행
    if (salaryInput) {
        DOMUtils.addEvent(salaryInput, 'keypress', function(e) {
            if (e.key === 'Enter') {
                calculateInsurance();
            }
        });
        
        // 숫자 입력 시 자동으로 콤마 추가
        DOMUtils.addEvent(salaryInput, 'input', function(e) {
            const plainValue = NumberUtils.toPlainNumberString(e.target.value);
            if (!plainValue || !Number.isFinite(Number(plainValue))) {
                return;
            }

            const cursorPosition = e.target.selectionStart;
            const oldLength = e.target.value.length;
            NumberUtils.formatInputValue(e.target);

            const newLength = e.target.value.length;
            const newPosition = cursorPosition + (newLength - oldLength);
            e.target.setSelectionRange(newPosition, newPosition);
        });
        
        // 포커스 시 콤마 제거
        DOMUtils.addEvent(salaryInput, 'focus', function(e) {
            e.target.value = NumberUtils.toPlainNumberString(e.target.value);
        });
        
        // 포커스 해제 시 콤마 추가
        DOMUtils.addEvent(salaryInput, 'blur', function(e) {
            NumberUtils.formatInputValue(e.target);
        });
    }
    
    // 실시간 계산을 위한 change 이벤트 추가
    const allInputs = ['monthlySalary', 'dependents', 'businessType', 'industrialCode'];
    allInputs.forEach(inputId => {
        const element = DOMUtils.getElement('#' + inputId);
        if (element) {
            DOMUtils.addEvent(element, 'change', autoCalculate);
            if (inputId === 'monthlySalary') {
                DOMUtils.addEvent(element, 'input', autoCalculate);
            }
        }
    });
}

// 페이지 로드 시 초기화
if (typeof window.initializeInsurancePage === 'undefined') {
    window.initializeInsurancePage = initializeInsuranceCalculator;
}