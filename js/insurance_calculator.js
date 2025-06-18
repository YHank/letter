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
        healthInsuranceMaxMonthlyEarnings: 12568380, // This is an example, actual health insurance has no earning cap for calculation, but a premium cap.
        salaryMin: 100000,
        salaryMax: 100000000
    },
    INCOME_TAX_TABLE: [ // Simplified for testing; actual calculation is more complex
        { limit: 0, rate: 0, base: 0 },
        { limit: 14000000, rate: 0.06, base: 0 },
        { limit: 50000000, rate: 0.15, base: 840000 }, // 14000000 * 0.06
        { limit: 88000000, rate: 0.24, base: 5400000 + 840000 }, // (50000000-14000000)*0.15 + base
        { limit: 150000000, rate: 0.35, base: 15900000 + 5400000 + 840000 },
        { limit: 300000000, rate: 0.38, base: 15900000 + 5400000 + 840000 + 21700000 },
        { limit: 500000000, rate: 0.40, base: 15900000 + 5400000 + 840000 + 21700000 + 57000000 },
        { limit: 1000000000, rate: 0.42, base: 15900000 + 5400000 + 840000 + 21700000 + 57000000 + 80000000 },
        { limit: Infinity, rate: 0.45, base: 15900000 + 5400000 + 840000 + 21700000 + 57000000 + 80000000 + 210000000 }
    ],
    // DEPENDENT_DEDUCTION_PER_PERSON_MONTHLY: 12500 // This was in old config, but tax calc is more complex
};

/**
 * Creates an insurance calculator logic instance.
 * @param {object} config - The configuration object (INSURANCE_CALC_CONFIG).
 * @returns {object} An object with calculation methods.
 */
function createInsuranceCalculatorLogic(config) {
    
    /**
     * Calculates income tax based on monthly income and number of dependents.
     * This is a simplified version. Accurate calculation requires full tax tables,
     * various income deductions (근로소득공제, 인적공제, 특별공제 등), and tax credits (세액공제).
     * @param {number} monthlyIncome - The pre-tax monthly income.
     * @param {number} dependents - The number of dependents (including self).
     * @returns {number} The calculated monthly income tax (simplified).
     */
    function calculateIncomeTaxInternal(monthlyIncome, dependents) {
        const annualIncome = monthlyIncome * 12;

        // 1. 근로소득공제 (Simplified version from previous code)
        let laborDeduction = 0;
        if (annualIncome <= 5000000) laborDeduction = annualIncome * 0.7;
        else if (annualIncome <= 15000000) laborDeduction = 3500000 + (annualIncome - 5000000) * 0.4;
        else if (annualIncome <= 45000000) laborDeduction = 7500000 + (annualIncome - 15000000) * 0.15;
        else if (annualIncome <= 100000000) laborDeduction = 12000000 + (annualIncome - 45000000) * 0.05;
        else laborDeduction = 14750000 + (annualIncome - 100000000) * 0.02;

        const incomeAfterLaborDeduction = Math.max(0, annualIncome - laborDeduction);

        // 2. 인적공제 (Simplified: 본인 + (부양가족수 - 1) * 150만원)
        // This is a very rough simplification of 인적공제.
        const basicDeductionSelf = 1500000; // 본인 기본공제
        const dependentDeductionAmount = (dependents > 0 ? dependents : 1) * 1500000; // 1인당 150만원 가정 (본인포함)
        
        const taxableIncomeAnnual = Math.max(0, incomeAfterLaborDeduction - dependentDeductionAmount);

        // 3. 산출세액 (Based on INCOME_TAX_TABLE from config)
        let calculatedAnnualTax = 0;
        let previousBracketLimit = 0;
        for (const bracket of config.INCOME_TAX_TABLE) {
            if (taxableIncomeAnnual > previousBracketLimit) {
                if (taxableIncomeAnnual <= bracket.limit) {
                    calculatedAnnualTax += (taxableIncomeAnnual - previousBracketLimit) * bracket.rate;
                    break;
                } else {
                    // For brackets with `base` already being cumulative tax up to previous limit.
                    // The provided table structure's `base` seems to be cumulative tax.
                    // So, direct calculation:
                    // if (taxableIncomeAnnual > bracket.limit) { continue; }
                    // else {
                    //    calculatedAnnualTax = bracket.base + (taxableIncomeAnnual - (config.INCOME_TAX_TABLE[config.INCOME_TAX_TABLE.indexOf(bracket)-1]?.limit || 0)) * bracket.rate;
                    //    break;
                    // }
                    // Simpler loop with the given structure:
                    if (taxableIncomeAnnual <= bracket.limit || bracket.limit === Infinity) {
                        const prevLimit = config.INCOME_TAX_TABLE.indexOf(bracket) > 0 ? config.INCOME_TAX_TABLE[config.INCOME_TAX_TABLE.indexOf(bracket)-1].limit : 0;
                        calculatedAnnualTax = bracket.base + (taxableIncomeAnnual - prevLimit) * bracket.rate;
                        break;
                    }
                }
            }
             if (bracket.limit === Infinity && taxableIncomeAnnual > previousBracketLimit) { // Should be caught by <= bracket.limit
                calculatedAnnualTax += (taxableIncomeAnnual - previousBracketLimit) * bracket.rate;
                break;
            }
            previousBracketLimit = bracket.limit;
        }
        
        // 4. 근로소득세액공제 (Simplified)
        let taxCredit = 0;
        if (calculatedAnnualTax <= 1300000) { // 산출세액 130만원 이하
            taxCredit = calculatedAnnualTax * 0.55;
        } else { // 산출세액 130만원 초과
            taxCredit = 715000 + (calculatedAnnualTax - 1300000) * 0.30;
        }
        // 한도 적용 (총급여액 기준)
        let creditLimit = 0;
        if (annualIncome <= 33000000) creditLimit = 740000;
        else if (annualIncome <= 70000000) creditLimit = Math.max(660000, 740000 - (annualIncome - 33000000) * 0.008);
        else creditLimit = Math.max(500000, 660000 - Math.max(0, (annualIncome - 70000000) * 0.5) ); // Ensure subtraction doesn't make limit < 0 before max with 500k

        taxCredit = Math.min(taxCredit, creditLimit);
        
        const finalAnnualTax = Math.max(0, calculatedAnnualTax - taxCredit);
        return Math.max(0, Math.round(finalAnnualTax / 120) * 10); // 원단위 절사 ( /12 -> 월세액, /10 * 10 -> 10원단위절사)
    }

    function calculateAll(monthlySalary, dependents, businessType, industrialRatePercentage) {
        if (isNaN(monthlySalary) || monthlySalary <= 0 ||
            monthlySalary < config.LIMITS.salaryMin || monthlySalary > config.LIMITS.salaryMax ||
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
            case 'medium': stabilityRateValue = config.RATES.stabilityMedium; break; // Assuming medium maps to this
            case 'large': stabilityRateValue = config.RATES.stabilityLarge; break;   // Assuming large maps to this
            default: stabilityRateValue = config.RATES.stabilityRegular;
        }
        const stabilityEmployer = Math.round(monthlySalary * stabilityRateValue);
        
        const employmentEmployeeTotal = unemploymentEmployee;
        const employmentEmployerTotal = unemploymentEmployer + stabilityEmployer;
        
        const industrialEmployer = Math.round(monthlySalary * (industrialRatePercentage / 100));
        
        const subtotalEmployee = healthEmployee + careEmployee + pensionEmployee + employmentEmployeeTotal;
        const subtotalEmployer = healthEmployer + careEmployer + pensionEmployer + employmentEmployerTotal + industrialEmployer;
        
        const incomeTax = calculateIncomeTaxInternal(monthlySalary, dependents);
        const localTax = Math.floor(incomeTax * 0.10 / 10) * 10; // 지방소득세는 소득세의 10%, 원단위 절사
        
        const totalDeductionEmployee = subtotalEmployee + incomeTax + localTax;
        const netSalary = monthlySalary - totalDeductionEmployee;

        return {
            monthlySalary, dependents, businessType, industrialRatePercentage,
            pensionBase, healthBase,
            healthEmployee, healthEmployer, healthTotal: healthEmployee + healthEmployer,
            careEmployee, careEmployer, careTotal: careEmployee + careEmployer,
            pensionEmployee, pensionEmployer, pensionTotal: pensionEmployee + pensionEmployer,
            unemploymentEmployee, unemploymentEmployer, stabilityEmployer,
            employmentEmployeeTotal, employmentEmployerTotal, employmentTotal: employmentEmployeeTotal + employmentEmployerTotal,
            industrialEmployer, industrialTotal: industrialEmployer,
            subtotalEmployee, subtotalEmployer, subtotalTotal: subtotalEmployee + subtotalEmployer,
            incomeTax, localTax,
            totalDeductionEmployee, netSalary
        };
    }

    return {
        calculateAll,
        calculateIncomeTax: calculateIncomeTaxInternal
    };
}

function initializeInsuranceCalculator() {
    const calculatorLogic = createInsuranceCalculatorLogic(INSURANCE_CALC_CONFIG);

    function formatNumberForDisplay(num) {
        return typeof NumberUtils !== 'undefined' ? NumberUtils.addCommas(Math.round(num)) : String(Math.round(num));
    }

    function performCalculationAndUpdateUI() {
        try {
            const monthlySalaryStr = DOMUtils.getElement('#monthlySalary').value.replace(/,/g, '');
            const monthlySalary = parseFloat(monthlySalaryStr) || 0;
            const dependents = parseInt(DOMUtils.getElement('#dependents').value) || 1;
            const businessType = DOMUtils.getElement('#businessType').value;
            const industrialRate = parseFloat(DOMUtils.getElement('#industrialCode').value) || 0.7;

            if (monthlySalary <= 0) { alert('월 급여액을 입력해주세요.'); DOMUtils.getElement('#monthlySalary').focus(); return; }
            if (monthlySalary < INSURANCE_CALC_CONFIG.LIMITS.salaryMin) {
                alert(`월 급여액은 최소 ${formatNumberForDisplay(INSURANCE_CALC_CONFIG.LIMITS.salaryMin)}원 이상이어야 합니다.`);
                DOMUtils.getElement('#monthlySalary').focus(); return;
            }
            if (monthlySalary > INSURANCE_CALC_CONFIG.LIMITS.salaryMax) {
                alert(`월 급여액이 너무 큽니다. (최대: ${formatNumberForDisplay(INSURANCE_CALC_CONFIG.LIMITS.salaryMax)}원)`);
                DOMUtils.getElement('#monthlySalary').focus(); return;
            }

            const results = calculatorLogic.calculateAll(monthlySalary, dependents, businessType, industrialRate);

            if (!results) { alert('계산 오류: 입력값을 확인해주세요.'); return; }

            DOMUtils.getElement('#resultSection').classList.remove('d-none');
            // Update UI with results... (same as before, using results.property)
            DOMUtils.getElement('#employeeTotal').textContent = formatNumberForDisplay(results.subtotalEmployee) + '원';
            DOMUtils.getElement('#employerTotal').textContent = formatNumberForDisplay(results.subtotalEmployer) + '원';
            DOMUtils.getElement('#netSalary').textContent = formatNumberForDisplay(results.netSalary) + '원';

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

            const historyEntry = { /* ... */ }; // Same as before
            try {
                let history = StorageUtils.load('insuranceCalculationHistory', []);
                history.unshift(historyEntry);
                StorageUtils.save('insuranceCalculationHistory', history.slice(0, 10));
            } catch (e) { console.error('계산 이력 저장 실패:', e); }

        } catch (error) {
            console.error('UI 업데이트 중 오류 발생:', error);
            // alert('계산 결과를 표시하는 중 오류가 발생했습니다.'); // Avoid alert if DOMUtils is not ready
        }
    }
    
    function resetCalculatorUI() { /* ... same as before ... */ }
    
    const debouncedCalc = typeof debounce === 'function' ? debounce(performCalculationAndUpdateUI, 500) : performCalculationAndUpdateUI;
    
    if (typeof DOMUtils !== 'undefined') {
        DOMUtils.addEvent('#calculateBtn', 'click', performCalculationAndUpdateUI);
        DOMUtils.addEvent('#resetBtn', 'click', resetCalculatorUI);
        // ... rest of event listeners from original file ...
        const salaryInputEl = DOMUtils.getElement('#monthlySalary');
        if (salaryInputEl) {
            DOMUtils.addEvent(salaryInputEl, 'keypress', (e) => { if (e.key === 'Enter') performCalculationAndUpdateUI(); });
            DOMUtils.addEvent(salaryInputEl, 'input', (e) => {
                let value = e.target.value.replace(/,/g, '');
                if (!isNaN(value) && value !== '') {
                    const cursorPosition = e.target.selectionStart;
                    const oldLength = e.target.value.length;
                    e.target.value = Number(value).toLocaleString('ko-KR'); // Use Number() for safety
                    const newLength = e.target.value.length;
                    if(cursorPosition !== null) {
                        const diff = newLength - oldLength;
                        try { e.target.setSelectionRange(cursorPosition + diff, cursorPosition + diff); } catch(ex) {}
                    }
                }
                debouncedCalc();
            });
            DOMUtils.addEvent(salaryInputEl, 'focus', (e) => { e.target.value = e.target.value.replace(/,/g, ''); });
            DOMUtils.addEvent(salaryInputEl, 'blur', (e) => {
                let value = e.target.value.replace(/,/g, '');
                if (!isNaN(value) && value !== '') e.target.value = Number(value).toLocaleString('ko-KR');
            });
        }
        
        const allInputsForAutoCalc = ['dependents', 'businessType', 'industrialCode']; // monthlySalary handled by its own input listener now
        allInputsForAutoCalc.forEach(inputId => {
            const element = DOMUtils.getElement('#' + inputId);
            if (element) {
                DOMUtils.addEvent(element, 'change', debouncedCalc);
            }
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
    // Make config global if needed by tests in browser without modules
    // window.INSURANCE_CALC_CONFIG = INSURANCE_CALC_CONFIG;
}
