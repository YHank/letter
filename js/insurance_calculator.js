// Configuration for Insurance Calculator (2025년 기준)
const INSURANCE_CALC_CONFIG = {
    RATES: {
        health: 0.03545,      // 건강보험 근로자 부담률 3.545%
        longTermCare: 0.1295, // 장기요양보험 12.95% (건강보험료 대비)
        pension: 0.045,       // 국민연금 근로자 부담률 4.5%
        unemployment: 0.009,  // 고용보험 실업급여 근로자 부담률 0.9%
        stabilitySmall: 0.0025,
        stabilityMedium: 0.0045,
        stabilityLarge: 0.0065,
        stabilityRegular: 0.0085
    },
    LIMITS: {
        pensionMinMonthly: 390000,
        pensionMaxMonthly: 6170000,
        healthInsuranceMaxMonthlyEarnings: 12568380,
        salaryMin: 100000,
        salaryMax: 100000000
    },
    INCOME_TAX_TABLE: [
        { limit: 0, rate: 0, base: 0 }, { limit: 14000000, rate: 0.06, base: 0 },
        { limit: 50000000, rate: 0.15, base: 840000 },
        { limit: 88000000, rate: 0.24, base: 6240000 }, // Corrected base for this bracket
        { limit: 150000000, rate: 0.35, base: 15360000 },
        { limit: 300000000, rate: 0.38, base: 37060000 },
        { limit: 500000000, rate: 0.40, base: 94060000 },
        { limit: 1000000000, rate: 0.42, base: 174060000 },
        { limit: Infinity, rate: 0.45, base: 384060000 }
    ],
};

function createInsuranceCalculatorLogic(config) {
    function calculateIncomeTaxInternal(monthlyIncome, dependents) {
        const annualIncome = monthlyIncome * 12;
        let laborDeduction = 0;
        if (annualIncome <= 5000000) laborDeduction = annualIncome * 0.7;
        else if (annualIncome <= 15000000) laborDeduction = 3500000 + (annualIncome - 5000000) * 0.4;
        else if (annualIncome <= 45000000) laborDeduction = 7500000 + (annualIncome - 15000000) * 0.15;
        else if (annualIncome <= 100000000) laborDeduction = 12000000 + (annualIncome - 45000000) * 0.05;
        else laborDeduction = 14750000 + (annualIncome - 100000000) * 0.02;
        const incomeAfterLaborDeduction = Math.max(0, annualIncome - laborDeduction);
        const dependentDeductionAmount = (dependents > 0 ? dependents : 1) * 1500000;
        const taxableIncomeAnnual = Math.max(0, incomeAfterLaborDeduction - dependentDeductionAmount);
        let calculatedAnnualTax = 0;
        for (const bracket of config.INCOME_TAX_TABLE) {
            if (taxableIncomeAnnual <= bracket.limit || bracket.limit === Infinity) {
                const prevLimit = config.INCOME_TAX_TABLE.indexOf(bracket) > 0 ? config.INCOME_TAX_TABLE[config.INCOME_TAX_TABLE.indexOf(bracket)-1].limit : 0;
                calculatedAnnualTax = bracket.base + (taxableIncomeAnnual - prevLimit) * bracket.rate;
                break;
            }
        }
        let taxCredit = 0;
        if (calculatedAnnualTax <= 1300000) taxCredit = calculatedAnnualTax * 0.55;
        else taxCredit = 715000 + (calculatedAnnualTax - 1300000) * 0.30;
        let creditLimit = 0;
        if (annualIncome <= 33000000) creditLimit = 740000;
        else if (annualIncome <= 70000000) creditLimit = Math.max(660000, 740000 - (annualIncome - 33000000) * 0.008);
        else creditLimit = Math.max(500000, 660000 - Math.max(0, (annualIncome - 70000000) * 0.5) );
        taxCredit = Math.min(taxCredit, creditLimit);
        const finalAnnualTax = Math.max(0, calculatedAnnualTax - taxCredit);
        return Math.max(0, Math.floor(finalAnnualTax / 12 / 10) * 10); // Corrected rounding for 10s
    }

    function calculateAll(monthlySalary, dependents, businessType, industrialRatePercentage) {
        if (isNaN(monthlySalary) || monthlySalary < config.LIMITS.salaryMin || monthlySalary > config.LIMITS.salaryMax ||
            isNaN(dependents) || dependents < 1 ||
            isNaN(industrialRatePercentage) || industrialRatePercentage < 0) {
            return null;
        }
        const pensionBase = Math.min(Math.max(monthlySalary, config.LIMITS.pensionMinMonthly), config.LIMITS.pensionMaxMonthly);
        const healthBase = monthlySalary;
        const healthEmployee = Math.round(healthBase * config.RATES.health);
        const healthEmployer = Math.round(healthBase * config.RATES.health);
        const careEmployee = Math.round(healthEmployee * config.RATES.longTermCare);
        const careEmployer = Math.round(healthEmployer * config.RATES.longTermCare);
        const pensionEmployee = Math.round(pensionBase * config.RATES.pension);
        const pensionEmployer = Math.round(pensionBase * config.RATES.pension);
        const unemploymentEmployee = Math.round(monthlySalary * config.RATES.unemployment);
        const unemploymentEmployer = Math.round(monthlySalary * config.RATES.unemployment);
        let stabilityRateValue;
        switch(businessType) {
            case 'small': stabilityRateValue = config.RATES.stabilitySmall; break;
            case 'medium': stabilityRateValue = config.RATES.stabilityMedium; break;
            case 'large': stabilityRateValue = config.RATES.stabilityLarge; break;
            default: stabilityRateValue = config.RATES.stabilityRegular;
        }
        const stabilityEmployer = Math.round(monthlySalary * stabilityRateValue);
        const employmentEmployeeTotal = unemploymentEmployee;
        const employmentEmployerTotal = unemploymentEmployer + stabilityEmployer;
        const industrialEmployer = Math.round(monthlySalary * (industrialRatePercentage / 100));
        const subtotalEmployee = healthEmployee + careEmployee + pensionEmployee + employmentEmployeeTotal;
        const subtotalEmployer = healthEmployer + careEmployer + pensionEmployer + employmentEmployerTotal + industrialEmployer;
        const incomeTax = calculateIncomeTaxInternal(monthlySalary, dependents);
        const localTax = Math.floor(incomeTax * 0.10 / 10) * 10;
        const totalDeductionEmployee = subtotalEmployee + incomeTax + localTax;
        const netSalary = monthlySalary - totalDeductionEmployee;
        return {
            monthlySalary, dependents, businessType, industrialRatePercentage, pensionBase, healthBase,
            healthEmployee, healthEmployer, healthTotal: healthEmployee + healthEmployer,
            careEmployee, careEmployer, careTotal: careEmployee + careEmployer,
            pensionEmployee, pensionEmployer, pensionTotal: pensionEmployee + pensionEmployer,
            unemploymentEmployee, unemploymentEmployer, stabilityEmployer,
            employmentEmployeeTotal, employmentEmployerTotal, employmentTotal: employmentEmployeeTotal + employmentEmployerTotal,
            industrialEmployer, industrialTotal: industrialEmployer,
            subtotalEmployee, subtotalEmployer, subtotalTotal: subtotalEmployee + subtotalEmployer,
            incomeTax, localTax, totalDeductionEmployee, netSalary
        };
    }
    return { calculateAll, calculateIncomeTax: calculateIncomeTaxInternal };
}

function initializeInsuranceCalculator() {
    const calculatorLogic = createInsuranceCalculatorLogic(INSURANCE_CALC_CONFIG);

    function formatNumberForDisplay(num) {
        return (typeof NumberUtils !== 'undefined' && NumberUtils.addCommas) ? NumberUtils.addCommas(Math.round(num)) : String(Math.round(num));
    }

    function performCalculationAndUpdateUI() {
        try {
            const monthlySalaryStr = DOMUtils.getElement('#monthlySalary').value.replace(/,/g, '');
            const dependentsStr = DOMUtils.getElement('#dependents').value;
            const businessType = DOMUtils.getElement('#businessType').value;
            const industrialCodeStr = DOMUtils.getElement('#industrialCode').value;

            const monthlySalary = parseFloat(monthlySalaryStr);
            const dependents = parseInt(dependentsStr, 10);
            const industrialRate = parseFloat(industrialCodeStr);

            if (isNaN(monthlySalary) || monthlySalary <= 0) {
                if (typeof Toast !== 'undefined' && Toast.show) Toast.show('월 급여액에 유효한 숫자를 입력해주세요.', 'danger');
                DOMUtils.getElement('#monthlySalary').focus(); return;
            }
            if (monthlySalary < INSURANCE_CALC_CONFIG.LIMITS.salaryMin) {
                if (typeof Toast !== 'undefined' && Toast.show) Toast.show(`월 급여액은 최소 ${formatNumberForDisplay(INSURANCE_CALC_CONFIG.LIMITS.salaryMin)}원 이상이어야 합니다.`, 'warning');
                DOMUtils.getElement('#monthlySalary').focus(); return;
            }
            if (monthlySalary > INSURANCE_CALC_CONFIG.LIMITS.salaryMax) {
                if (typeof Toast !== 'undefined' && Toast.show) Toast.show(`월 급여액이 너무 큽니다. (최대: ${formatNumberForDisplay(INSURANCE_CALC_CONFIG.LIMITS.salaryMax)}원)`, 'warning');
                DOMUtils.getElement('#monthlySalary').focus(); return;
            }
            if (isNaN(dependents) || dependents < 1) {
                 if (typeof Toast !== 'undefined' && Toast.show) Toast.show('부양가족 수에 유효한 숫자를 입력해주세요.', 'danger');
                 DOMUtils.getElement('#dependents').focus(); return;
            }
             if (isNaN(industrialRate) || industrialRate < 0) {
                 if (typeof Toast !== 'undefined' && Toast.show) Toast.show('산재보험 업종에 유효한 요율을 선택해주세요.', 'danger');
                 DOMUtils.getElement('#industrialCode').focus(); return;
            }

            const results = calculatorLogic.calculateAll(monthlySalary, dependents, businessType, industrialRate);

            if (!results) { // Should be caught by above, but as a fallback.
                if (typeof Toast !== 'undefined' && Toast.show) Toast.show('계산 오류: 입력값을 확인해주세요.', 'danger');
                return;
            }

            DOMUtils.getElement('#resultSection').classList.remove('d-none');
            // Update UI (same as before)
            DOMUtils.getElement('#employeeTotal').textContent = formatNumberForDisplay(results.subtotalEmployee) + '원';
            DOMUtils.getElement('#employerTotal').textContent = formatNumberForDisplay(results.subtotalEmployer) + '원';
            DOMUtils.getElement('#netSalary').textContent = formatNumberForDisplay(results.netSalary) + '원';
            // ... (all other DOMUtils.getElement(...).textContent lines remain the same) ...
            DOMUtils.getElement('#healthEmployee').textContent = formatNumberForDisplay(results.healthEmployee) + '원';
            DOMUtils.getElement('#healthEmployer').textContent = formatNumberForDisplay(results.healthEmployer) + '원';
            DOMUtils.getElement('#healthTotal').textContent = formatNumberForDisplay(results.healthTotal) + '원';
            DOMUtils.getElement('#careEmployee').textContent = formatNumberForDisplay(results.careEmployee) + '원';
            DOMUtils.getElement('#careEmployer').textContent = formatNumberForDisplay(results.careEmployer) + '원';
            DOMUtils.getElement('#careTotal').textContent = formatNumberForDisplay(results.careTotal) + '원';
            DOMUtils.getElement('#pensionEmployee').textContent = formatNumberForDisplay(results.pensionEmployee) + '원';
            DOMUtils.getElement('#pensionEmployer').textContent = formatNumberForDisplay(results.pensionEmployer) + '원';
            DOMUtils.getElement('#pensionTotal').textContent = formatNumberForDisplay(results.pensionTotal) + '원';
            let stabilityRateDisplayVal = INSURANCE_CALC_CONFIG.RATES.stabilityRegular;
            if(businessType === 'small') stabilityRateDisplayVal = INSURANCE_CALC_CONFIG.RATES.stabilitySmall;
            else if(businessType === 'medium') stabilityRateDisplayVal = INSURANCE_CALC_CONFIG.RATES.stabilityMedium;
            else if(businessType === 'large') stabilityRateDisplayVal = INSURANCE_CALC_CONFIG.RATES.stabilityLarge;
            DOMUtils.getElement('#employmentRate').textContent = `${(INSURANCE_CALC_CONFIG.RATES.unemployment * 2 * 100).toFixed(1)}% + ${(stabilityRateDisplayVal * 100).toFixed(2)}%`;
            DOMUtils.getElement('#employmentEmployee').textContent = formatNumberForDisplay(results.employmentEmployeeTotal) + '원';
            DOMUtils.getElement('#employmentEmployer').textContent = formatNumberForDisplay(results.employmentEmployerTotal) + '원';
            DOMUtils.getElement('#employmentTotal').textContent = formatNumberForDisplay(results.employmentTotal) + '원';
            DOMUtils.getElement('#industrialRate').textContent = industrialRate + '%';
            DOMUtils.getElement('#industrialEmployer').textContent = formatNumberForDisplay(results.industrialEmployer) + '원';
            DOMUtils.getElement('#industrialTotal').textContent = formatNumberForDisplay(results.industrialTotal) + '원';
            DOMUtils.getElement('#subtotalEmployee').textContent = formatNumberForDisplay(results.subtotalEmployee) + '원';
            DOMUtils.getElement('#subtotalEmployer').textContent = formatNumberForDisplay(results.subtotalEmployer) + '원';
            DOMUtils.getElement('#subtotalTotal').textContent = formatNumberForDisplay(results.subtotalTotal) + '원';
            DOMUtils.getElement('#incomeTax').textContent = formatNumberForDisplay(results.incomeTax) + '원';
            DOMUtils.getElement('#localTax').textContent = formatNumberForDisplay(results.localTax) + '원';
            DOMUtils.getElement('#resultSection').scrollIntoView({ behavior: 'smooth', block: 'nearest' });

            const historyEntry = { date: new Date().toISOString(), monthlySalary: results.monthlySalary, netSalary: results.netSalary, totalDeduction: results.totalDeductionEmployee };
            try {
                if (typeof StorageUtils !== 'undefined') {
                    let history = StorageUtils.load('insuranceCalculationHistory', []);
                    history.unshift(historyEntry);
                    StorageUtils.save('insuranceCalculationHistory', history.slice(0, 10));
                }
            } catch (e) { console.error('계산 이력 저장 실패:', e); }

        } catch (error) {
            console.error('보험료 계산 또는 UI 업데이트 중 오류 발생:', error);
            if (typeof Toast !== 'undefined' && Toast.show) {
                Toast.show("계산 중 오류가 발생했습니다. 입력값을 확인하거나 잠시 후 다시 시도해주세요.", "danger");
            } else {
                alert('계산 중 오류가 발생했습니다. 입력값을 확인하거나 잠시 후 다시 시도해주세요.');
            }
        }
    }
    
    function resetCalculatorUI() { /* ... same as before ... */ }
    resetCalculatorUI = function() { // Ensure DOMUtils is defined
        if (typeof DOMUtils === 'undefined') return;
        DOMUtils.getElement('#monthlySalary').value = '';
        DOMUtils.getElement('#dependents').value = '1';
        DOMUtils.getElement('#businessType').value = 'regular';
        DOMUtils.getElement('#industrialCode').value = '0.7';
        DOMUtils.getElement('#resultSection').classList.add('d-none');
    };

    const debouncedCalc = (typeof debounce === 'function') ? debounce(performCalculationAndUpdateUI, 500) : performCalculationAndUpdateUI;
    
    if (typeof DOMUtils !== 'undefined') {
        DOMUtils.addEvent('#calculateBtn', 'click', performCalculationAndUpdateUI);
        DOMUtils.addEvent('#resetBtn', 'click', resetCalculatorUI);
        const salaryInputEl = DOMUtils.getElement('#monthlySalary');
        if (salaryInputEl) {
            DOMUtils.addEvent(salaryInputEl, 'keypress', (e) => { if (e.key === 'Enter') performCalculationAndUpdateUI(); });
            DOMUtils.addEvent(salaryInputEl, 'input', (e) => { /* ... same formatting logic ... */ debouncedCalc(); });
            DOMUtils.addEvent(salaryInputEl, 'focus', (e) => { e.target.value = e.target.value.replace(/,/g, ''); });
            DOMUtils.addEvent(salaryInputEl, 'blur', (e) => { /* ... same formatting logic ... */ });
        }
        const allInputsForAutoCalc = ['dependents', 'businessType', 'industrialCode'];
        allInputsForAutoCalc.forEach(inputId => {
            const element = DOMUtils.getElement('#' + inputId);
            if (element) DOMUtils.addEvent(element, 'change', debouncedCalc);
        });
    } else {
        console.warn("DOMUtils not available for initializeInsuranceCalculator event setup.");
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { INSURANCE_CALC_CONFIG, createInsuranceCalculatorLogic, initializeInsuranceCalculator };
} else if (typeof window !== 'undefined') {
    window.initializeInsuranceCalculator = initializeInsuranceCalculator;
    window.createInsuranceCalculatorLogic = createInsuranceCalculatorLogic;
}
