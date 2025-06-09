// 4대보험료 계산기 초기화 함수
function initializeInsuranceCalculator() {
    console.log('4대보험료 계산기 초기화');
    
    // 상수 정의 (2025년 기준)
    const INSURANCE_RATES = {
        health: 0.03545,      // 건강보험 근로자 부담률 3.545%
        longTermCare: 0.1295, // 장기요양보험 12.95%
        pension: 0.045,       // 국민연금 근로자 부담률 4.5%
        unemployment: 0.009,  // 고용보험 실업급여 0.9%
        stabilitySmall: 0.0025, // 고용안정 우선지원 0.25%
        stabilityRegular: 0.0085 // 고용안정 일반 0.85%
    };
    
    const LIMITS = {
        pensionMin: 390000,   // 국민연금 하한
        pensionMax: 6170000,  // 국민연금 상한
        salaryMin: 100000,    // 최소 급여
        salaryMax: 100000000  // 최대 급여
    };
    
    // 숫자 포맷팅 함수
    function formatNumber(num) {
        return Math.round(num).toLocaleString('ko-KR');
    }
    
    // 소득세 계산 함수 (간이세액표 기준)
    function calculateIncomeTax(monthlyIncome, dependents) {
        // 간이세액표 기준 (2025년 기준, 근사치)
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
        
        return Math.round(tax);
    }
    
    // 계산 함수
    function calculateInsurance() {
        try {
            const salaryValue = document.getElementById('monthlySalary').value.replace(/,/g, '');
            const monthlySalary = parseFloat(salaryValue) || 0;
        const dependents = parseInt(document.getElementById('dependents').value) || 1;
        const businessType = document.getElementById('businessType').value;
        const industrialRate = parseFloat(document.getElementById('industrialCode').value) || 1.53;
        
        if (monthlySalary <= 0) {
            alert('월 급여액을 입력해주세요.');
            document.getElementById('monthlySalary').focus();
            return;
        }
        
        // 최소/최대값 검증
        if (monthlySalary < LIMITS.salaryMin) {
            alert('월 급여액은 최소 10만원 이상이어야 합니다.');
            document.getElementById('monthlySalary').focus();
            return;
        }
        
        if (monthlySalary > LIMITS.salaryMax) {
            alert('월 급여액이 너무 큽니다. 다시 확인해주세요.');
            document.getElementById('monthlySalary').focus();
            return;
        }
        
        // 상한선 적용 (2025년 기준)
        const pensionBase = Math.min(Math.max(monthlySalary, LIMITS.pensionMin), LIMITS.pensionMax); // 국민연금 상한: 617만원, 하한: 39만원
        const healthBase = monthlySalary; // 건강보험은 상한 없음
        
        // 1. 건강보험료 계산 (7.09%)
        const healthEmployee = Math.round(healthBase * INSURANCE_RATES.health); // 근로자 3.545%
        const healthEmployer = Math.round(healthBase * INSURANCE_RATES.health); // 사업주 3.545%
        const healthTotal = healthEmployee + healthEmployer;
        
        // 2. 장기요양보험료 계산 (건강보험료의 12.95% - 2025년 기준)
        const careEmployee = Math.round(healthEmployee * INSURANCE_RATES.longTermCare);
        const careEmployer = Math.round(healthEmployer * INSURANCE_RATES.longTermCare);
        const careTotal = careEmployee + careEmployer;
        
        // 3. 국민연금 계산 (9%)
        const pensionEmployee = Math.round(pensionBase * INSURANCE_RATES.pension); // 근로자 4.5%
        const pensionEmployer = Math.round(pensionBase * INSURANCE_RATES.pension); // 사업주 4.5%
        const pensionTotal = pensionEmployee + pensionEmployer;
        
        // 4. 고용보험 계산
        // 실업급여: 1.8% (근로자 0.9%, 사업주 0.9%)
        const unemploymentEmployee = Math.round(monthlySalary * INSURANCE_RATES.unemployment);
        const unemploymentEmployer = Math.round(monthlySalary * INSURANCE_RATES.unemployment);
        
        // 고용안정·직업능력개발: 사업주만 부담
        const stabilityRate = businessType === 'small' ? INSURANCE_RATES.stabilitySmall : INSURANCE_RATES.stabilityRegular;
        const stabilityEmployer = Math.round(monthlySalary * stabilityRate);
        
        const employmentEmployee = unemploymentEmployee;
        const employmentEmployer = unemploymentEmployer + stabilityEmployer;
        const employmentTotal = employmentEmployee + employmentEmployer;
        
        // 5. 산재보험 계산 (사업주 전액 부담)
        const industrialEmployer = Math.round(monthlySalary * (industrialRate / 100));
        const industrialTotal = industrialEmployer;
        
        // 총계 계산
        const subtotalEmployee = healthEmployee + careEmployee + pensionEmployee + employmentEmployee;
        const subtotalEmployer = healthEmployer + careEmployer + pensionEmployer + employmentEmployer + industrialEmployer;
        const subtotalTotal = subtotalEmployee + subtotalEmployer;
        
        // 소득세 계산
        const incomeTax = calculateIncomeTax(monthlySalary, dependents);
        const localTax = Math.round(incomeTax * 0.1); // 지방소득세는 소득세의 10%
        
        // 실수령액 계산
        const totalDeduction = subtotalEmployee + incomeTax + localTax;
        const netSalary = monthlySalary - totalDeduction;
        
        // 결과 표시
        document.getElementById('resultSection').classList.remove('d-none');
        
        // 요약 정보
        document.getElementById('employeeTotal').textContent = formatNumber(subtotalEmployee) + '원';
        document.getElementById('employerTotal').textContent = formatNumber(subtotalEmployer) + '원';
        document.getElementById('netSalary').textContent = formatNumber(netSalary) + '원';
        
        // 상세 내역 - 건강보험
        document.getElementById('healthEmployee').textContent = formatNumber(healthEmployee) + '원';
        document.getElementById('healthEmployer').textContent = formatNumber(healthEmployer) + '원';
        document.getElementById('healthTotal').textContent = formatNumber(healthTotal) + '원';
        
        // 상세 내역 - 장기요양보험
        document.getElementById('careEmployee').textContent = formatNumber(careEmployee) + '원';
        document.getElementById('careEmployer').textContent = formatNumber(careEmployer) + '원';
        document.getElementById('careTotal').textContent = formatNumber(careTotal) + '원';
        
        // 상세 내역 - 국민연금
        document.getElementById('pensionEmployee').textContent = formatNumber(pensionEmployee) + '원';
        document.getElementById('pensionEmployer').textContent = formatNumber(pensionEmployer) + '원';
        document.getElementById('pensionTotal').textContent = formatNumber(pensionTotal) + '원';
        
        // 상세 내역 - 고용보험
        const employmentRateText = businessType === 'small' ? '1.8% + 0.25%' : '1.8% + 0.85%';
        document.getElementById('employmentRate').textContent = employmentRateText;
        document.getElementById('employmentEmployee').textContent = formatNumber(employmentEmployee) + '원';
        document.getElementById('employmentEmployer').textContent = formatNumber(employmentEmployer) + '원';
        document.getElementById('employmentTotal').textContent = formatNumber(employmentTotal) + '원';
        
        // 상세 내역 - 산재보험
        document.getElementById('industrialRate').textContent = industrialRate + '%';
        document.getElementById('industrialEmployer').textContent = formatNumber(industrialEmployer) + '원';
        document.getElementById('industrialTotal').textContent = formatNumber(industrialTotal) + '원';
        
        // 소계
        document.getElementById('subtotalEmployee').textContent = formatNumber(subtotalEmployee) + '원';
        document.getElementById('subtotalEmployer').textContent = formatNumber(subtotalEmployer) + '원';
        document.getElementById('subtotalTotal').textContent = formatNumber(subtotalTotal) + '원';
        
        // 소득세
        document.getElementById('incomeTax').textContent = formatNumber(incomeTax) + '원';
        document.getElementById('localTax').textContent = formatNumber(localTax) + '원';
        
        // 스크롤 이동
        document.getElementById('resultSection').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        // 계산 이력 저장 (localStorage)
        const calculationHistory = {
            date: new Date().toISOString(),
            monthlySalary: monthlySalary,
            netSalary: netSalary,
            totalDeduction: totalDeduction
        };
        
        try {
            let history = JSON.parse(localStorage.getItem('insuranceCalculationHistory') || '[]');
            history.unshift(calculationHistory);
            history = history.slice(0, 10); // 최근 10개만 저장
            localStorage.setItem('insuranceCalculationHistory', JSON.stringify(history));
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
        document.getElementById('monthlySalary').value = '';
        document.getElementById('dependents').value = '1';
        document.getElementById('businessType').value = 'regular';
        document.getElementById('industrialCode').value = '0.7';
        document.getElementById('resultSection').classList.add('d-none');
    }
    
    // 디바운스 함수
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
        const salaryValue = document.getElementById('monthlySalary').value.replace(/,/g, '');
        if (salaryValue && parseFloat(salaryValue) >= LIMITS.salaryMin) {
            calculateInsurance();
        }
    }, 500);
    
    // 이벤트 리스너 등록
    const calculateBtn = document.getElementById('calculateBtn');
    const resetBtn = document.getElementById('resetBtn');
    const salaryInput = document.getElementById('monthlySalary');
    
    if (calculateBtn) {
        calculateBtn.addEventListener('click', calculateInsurance);
    }
    
    if (resetBtn) {
        resetBtn.addEventListener('click', resetCalculator);
    }
    
    // Enter 키로 계산 실행
    if (salaryInput) {
        salaryInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                calculateInsurance();
            }
        });
        
        // 숫자 입력 시 자동으로 콤마 추가
        salaryInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/,/g, '');
            if (!isNaN(value) && value !== '') {
                // 커서 위치 저장
                const cursorPosition = e.target.selectionStart;
                const oldLength = e.target.value.length;
                
                e.target.value = parseInt(value).toLocaleString('ko-KR');
                
                // 커서 위치 복원
                const newLength = e.target.value.length;
                const newPosition = cursorPosition + (newLength - oldLength);
                e.target.setSelectionRange(newPosition, newPosition);
            }
        });
        
        // 포커스 시 콤마 제거
        salaryInput.addEventListener('focus', function(e) {
            e.target.value = e.target.value.replace(/,/g, '');
        });
        
        // 포커스 해제 시 콤마 추가
        salaryInput.addEventListener('blur', function(e) {
            let value = e.target.value.replace(/,/g, '');
            if (!isNaN(value) && value !== '') {
                e.target.value = parseInt(value).toLocaleString('ko-KR');
            }
        });
    }
    
    // 실시간 계산을 위한 change 이벤트 추가
    const allInputs = ['monthlySalary', 'dependents', 'businessType', 'industrialCode'];
    allInputs.forEach(inputId => {
        const element = document.getElementById(inputId);
        if (element) {
            element.addEventListener('change', autoCalculate);
            if (inputId === 'monthlySalary') {
                element.addEventListener('input', autoCalculate);
            }
        }
    });
}

// 페이지 로드 시 초기화
if (typeof window.initializeInsurancePage === 'undefined') {
    window.initializeInsurancePage = initializeInsuranceCalculator;
}