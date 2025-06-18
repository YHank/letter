// salary_calculator.js

// TODO: (전체) 모든 요율 및 한도액은 실제 적용 시점의 최신 법령 기준으로 업데이트 필수.
// TODO: (세금계산) 소득세, 지방소득세 계산 로직은 국세청의 정확한 계산 방법(각종 공제 포함)을 반영해야 함.
//       현재는 단순화된 모델이며, 실제 세금과는 차이가 클 수 있음. 전문가 검토 또는 국세청 API 연동 권장.

const SALARY_CALC_CONFIG = {
    YEAR: 2023,
    NATIONAL_PENSION: {
        RATE_EMPLOYEE: 0.045,
        MIN_MONTHLY_INCOME: 370000,
        MAX_MONTHLY_INCOME: 5900000,
    },
    EMPLOYMENT_INSURANCE: {
        RATE_EMPLOYEE_UNEMPLOYMENT_BENEFIT: 0.009,
    },
    HEALTH_INSURANCE: {
        RATE_EMPLOYEE: 0.03545,
        MIN_MONTHLY_PREMIUM_EMPLOYEE: 9890,
        MAX_MONTHLY_PREMIUM_EMPLOYEE: 3911280,
    },
    LONG_TERM_CARE_INSURANCE: {
        RATE_OF_HEALTH_INSURANCE: 0.1281,
    },
    INCOME_TAX: {
        DEDUCTION_BRACKETS: [
            { limit: 5000000, rate: 0.70, base: 0, over: 0 }, // Corrected 'over' for first bracket
            { limit: 15000000, rate: 0.40, base: 3500000, over: 5000000 },
            { limit: 45000000, rate: 0.15, base: 7500000, over: 15000000 },
            { limit: 100000000, rate: 0.05, base: 12000000, over: 45000000 },
            { limit: Infinity, rate: 0.02, base: 14750000, over: 100000000 }
        ],
        HUMAN_DEDUCTION_AMOUNT: 1500000,
        TAX_BRACKETS: [ // Using cumulative base makes calculation easier
            { limit: 14000000, rate: 0.06, cumulativeBase: 0, prevLimit: 0 },
            { limit: 50000000, rate: 0.15, cumulativeBase: 840000, prevLimit: 14000000 },
            { limit: 88000000, rate: 0.24, cumulativeBase: 6240000, prevLimit: 50000000 },
            { limit: 150000000, rate: 0.35, cumulativeBase: 15360000, prevLimit: 88000000 },
            { limit: 300000000, rate: 0.38, cumulativeBase: 37060000, prevLimit: 150000000 },
            { limit: 500000000, rate: 0.40, cumulativeBase: 94060000, prevLimit: 300000000 },
            { limit: 1000000000, rate: 0.42, cumulativeBase: 174060000, prevLimit: 500000000 },
            { limit: Infinity, rate: 0.45, cumulativeBase: 384060000, prevLimit: 1000000000 }
        ],
        TAX_CREDIT: {
            STANDARD_AMOUNT: 1300000,
            RATE1: 0.55,
            RATE2: 0.30,
            BASE_CREDIT_FOR_RATE2: 715000,
            LIMITS: [
                { salaryLimit: 33000000, creditLimit: 740000 },
                { salaryLimit: 70000000, creditLimit: 660000, reductionFactor: 0.008, reductionBaseSalary: 33000000, minLimit: 660000 },
                { salaryLimit: Infinity, creditLimit: 500000, reductionFactor: 0.5, reductionBaseSalary: 70000000, minLimit: 500000 }
            ]
        },
        LOCAL_INCOME_TAX_RATE: 0.10
    }
};

/**
 * Creates a salary calculator logic instance.
 * @param {object} config - The configuration object (SALARY_CALC_CONFIG).
 * @returns {object} An object with calculation methods.
 */
function createSalaryCalculatorLogic(config) {

    function calculateNationalPension(annualSalary) {
        const npConfig = config.NATIONAL_PENSION;
        const monthlySalary = annualSalary / 12;
        let basisMonthlyIncome = monthlySalary;
        if (monthlySalary < npConfig.MIN_MONTHLY_INCOME) basisMonthlyIncome = npConfig.MIN_MONTHLY_INCOME;
        else if (monthlySalary > npConfig.MAX_MONTHLY_INCOME) basisMonthlyIncome = npConfig.MAX_MONTHLY_INCOME;
        const monthlyPension = basisMonthlyIncome * npConfig.RATE_EMPLOYEE;
        return Math.floor(monthlyPension / 10) * 10 * 12;
    }

    function calculateEmploymentInsurance(annualSalary) {
        const eiConfig = config.EMPLOYMENT_INSURANCE;
        const monthlySalary = annualSalary / 12;
        const monthlyInsurance = monthlySalary * eiConfig.RATE_EMPLOYEE_UNEMPLOYMENT_BENEFIT;
        return Math.floor(monthlyInsurance / 10) * 10 * 12;
    }

    function calculateHealthInsurance(annualSalary) {
        const hiConfig = config.HEALTH_INSURANCE;
        const monthlySalary = annualSalary / 12;
        let calculatedMonthlyPremium = monthlySalary * hiConfig.RATE_EMPLOYEE;
        if (calculatedMonthlyPremium < hiConfig.MIN_MONTHLY_PREMIUM_EMPLOYEE) calculatedMonthlyPremium = hiConfig.MIN_MONTHLY_PREMIUM_EMPLOYEE;
        else if (calculatedMonthlyPremium > hiConfig.MAX_MONTHLY_PREMIUM_EMPLOYEE) calculatedMonthlyPremium = hiConfig.MAX_MONTHLY_PREMIUM_EMPLOYEE;
        return Math.floor(calculatedMonthlyPremium / 10) * 10 * 12;
    }

    function calculateLongTermCareInsurance(annualHealthInsurancePremium) {
        const ltcConfig = config.LONG_TERM_CARE_INSURANCE;
        const monthlyHealthInsurancePremium = annualHealthInsurancePremium / 12;
        const monthlyLtcPremium = monthlyHealthInsurancePremium * ltcConfig.RATE_OF_HEALTH_INSURANCE;
        return Math.floor(monthlyLtcPremium / 10) * 10 * 12;
    }

    function getIncomeDeduction(annualGrossSalary) {
        if (annualGrossSalary <= 0) return 0;
        const brackets = config.INCOME_TAX.DEDUCTION_BRACKETS;
        let deduction = 0;
        for (const bracket of brackets) {
            if (annualGrossSalary <= bracket.limit) {
                deduction = bracket.base + (annualGrossSalary - bracket.over) * bracket.rate;
                break;
            }
        }
        return Math.floor(deduction);
    }

    function getHumanDeduction(dependentsCount) {
        if (dependentsCount < 1) dependentsCount = 1;
        return dependentsCount * config.INCOME_TAX.HUMAN_DEDUCTION_AMOUNT;
    }

    function calculateTaxableIncome(annualSalary, nonTaxableAnnualAmount = 0, annualNationalPension, annualHealthInsurance, annualEmploymentInsurance, annualIncomeDeduction, annualHumanDeduction) {
        const totalDeductions = nonTaxableAnnualAmount + annualNationalPension + annualHealthInsurance + annualEmploymentInsurance + annualIncomeDeduction + annualHumanDeduction;
        let taxable = annualSalary - totalDeductions;
        return taxable > 0 ? taxable : 0;
    }

    function calculateIncomeTax(taxableIncome) { // 산출세액 계산
        if (taxableIncome <= 0) return 0;
        const brackets = config.INCOME_TAX.TAX_BRACKETS;
        let tax = 0;
        for (const bracket of brackets) {
            if (taxableIncome <= bracket.limit) {
                tax = bracket.cumulativeBase + (taxableIncome - bracket.prevLimit) * bracket.rate;
                break;
            }
        }
        return Math.floor(tax / 10) * 10;
    }

    function getIncomeTaxCredit(calculatedTax, annualGrossSalary) {
        if (calculatedTax <= 0) return 0;
        const creditConfig = config.INCOME_TAX.TAX_CREDIT;
        let taxCredit = 0;
        if (calculatedTax <= creditConfig.STANDARD_AMOUNT) {
            taxCredit = calculatedTax * creditConfig.RATE1;
        } else {
            taxCredit = creditConfig.BASE_CREDIT_FOR_RATE2 + (calculatedTax - creditConfig.STANDARD_AMOUNT) * creditConfig.RATE2;
        }
        let creditLimit = 0;
        for (const limitInfo of creditConfig.LIMITS) {
            if (annualGrossSalary <= limitInfo.salaryLimit) {
                if (limitInfo.reductionFactor) {
                    creditLimit = Math.max(limitInfo.minLimit, limitInfo.creditLimit - (annualGrossSalary - limitInfo.reductionBaseSalary) * limitInfo.reductionFactor);
                } else {
                    creditLimit = limitInfo.creditLimit;
                }
                break;
            }
        }
        return Math.floor(Math.min(taxCredit, creditLimit) / 10) * 10;
    }

    function calculateFinalIncomeTax(calculatedTax, taxCredit) {
        const finalTax = calculatedTax - taxCredit;
        return finalTax > 0 ? Math.floor(finalTax / 10) * 10 : 0;
    }

    function calculateLocalIncomeTax(finalIncomeTax) {
        return Math.floor((finalIncomeTax * config.INCOME_TAX.LOCAL_INCOME_TAX_RATE) / 10) * 10;
    }

    function calculateTotalAnnualDeductions(annualSalary, nonTaxableAnnualAmount, dependentsCount) {
        const np = calculateNationalPension(annualSalary);
        const hi = calculateHealthInsurance(annualSalary);
        const ltc = calculateLongTermCareInsurance(hi);
        const ei = calculateEmploymentInsurance(annualSalary);
        const incomeDeduction = getIncomeDeduction(annualSalary - nonTaxableAnnualAmount);
        const humanDeduction = getHumanDeduction(dependentsCount);
        const taxableIncome = calculateTaxableIncome(annualSalary, nonTaxableAnnualAmount, np, hi, ei, incomeDeduction, humanDeduction);
        const calculatedTax = calculateIncomeTax(taxableIncome);
        const taxCredit = getIncomeTaxCredit(calculatedTax, annualSalary - nonTaxableAnnualAmount);
        const finalIncomeTax = calculateFinalIncomeTax(calculatedTax, taxCredit);
        const localIncomeTax = calculateLocalIncomeTax(finalIncomeTax);
        return np + hi + ltc + ei + finalIncomeTax + localIncomeTax;
    }

    function calculateNetMonthlyPay(annualSalary, nonTaxableMonthlyAmount, dependentsCount) {
        const nonTaxableAnnualAmount = nonTaxableMonthlyAmount * 12;
        const totalAnnualDeductions = calculateTotalAnnualDeductions(annualSalary, nonTaxableAnnualAmount, dependentsCount);
        const netAnnualPay = annualSalary - totalAnnualDeductions;
        return Math.round(netAnnualPay / 12);
    }

    // Expose all calculation functions for testing or direct use
    return {
        calculateNationalPension,
        calculateEmploymentInsurance,
        calculateHealthInsurance,
        calculateLongTermCareInsurance,
        getIncomeDeduction,
        getHumanDeduction,
        calculateTaxableIncome,
        calculateIncomeTax,
        getIncomeTaxCredit,
        calculateFinalIncomeTax,
        calculateLocalIncomeTax,
        calculateTotalAnnualDeductions,
        calculateNetMonthlyPay
    };
}

// UI Initialization and Event Handling part
function initializeSalaryPage() {
    // console.log("Salary Calculator UI Initializing...");
    const salaryCalculator = createSalaryCalculatorLogic(SALARY_CALC_CONFIG);

    function displayResults(annualSalary, nonTaxableMonthly, dependentsCount) {
        const resultsContainer = DOMUtils.getElement('#salary_results_container');
        const errorDiv = DOMUtils.getElement('#error_message');
        errorDiv.style.display = 'none';

        if (isNaN(annualSalary) || annualSalary <= 0) {
            errorDiv.textContent = '유효한 연봉을 입력해주세요.'; errorDiv.style.display = 'block'; resultsContainer.style.display = 'none'; return;
        }
        if (isNaN(nonTaxableMonthly) || nonTaxableMonthly < 0) {
            errorDiv.textContent = '유효한 월 비과세액을 입력해주세요.'; errorDiv.style.display = 'block'; resultsContainer.style.display = 'none'; return;
        }
        if (isNaN(dependentsCount) || dependentsCount < 1) {
            errorDiv.textContent = '부양가족 수는 본인을 포함하여 1명 이상이어야 합니다.'; errorDiv.style.display = 'block'; resultsContainer.style.display = 'none'; return;
        }

        const nonTaxableAnnual = nonTaxableMonthly * 12;
        const np = salaryCalculator.calculateNationalPension(annualSalary);
        const hi = salaryCalculator.calculateHealthInsurance(annualSalary);
        const ltc = salaryCalculator.calculateLongTermCareInsurance(hi);
        const ei = salaryCalculator.calculateEmploymentInsurance(annualSalary);
        const incomeDeduction = salaryCalculator.getIncomeDeduction(annualSalary - nonTaxableAnnual);
        const humanDeduction = salaryCalculator.getHumanDeduction(dependentsCount);
        const taxableIncome = salaryCalculator.calculateTaxableIncome(annualSalary, nonTaxableAnnual, np, hi, ei, incomeDeduction, humanDeduction);
        const calculatedTax = salaryCalculator.calculateIncomeTax(taxableIncome);
        const taxCredit = salaryCalculator.getIncomeTaxCredit(calculatedTax, annualSalary - nonTaxableAnnual);
        const finalIncomeTax = salaryCalculator.calculateFinalIncomeTax(calculatedTax, taxCredit);
        const localIncomeTax = salaryCalculator.calculateLocalIncomeTax(finalIncomeTax);

        const totalMonthlyDeduction = Math.round((np + hi + ltc + ei + finalIncomeTax + localIncomeTax) / 12);
        const netMonthlyPay = salaryCalculator.calculateNetMonthlyPay(annualSalary, nonTaxableMonthly, dependentsCount);

        DOMUtils.getElement('#result_annual_salary').textContent = NumberUtils.addCommas(annualSalary) + '원';
        DOMUtils.getElement('#result_non_taxable_monthly').textContent = NumberUtils.addCommas(nonTaxableMonthly) + '원';
        DOMUtils.getElement('#result_non_taxable_annual').textContent = NumberUtils.addCommas(nonTaxableAnnual) + '원';
        DOMUtils.getElement('#result_dependents_count').textContent = dependentsCount + '명';
        DOMUtils.getElement('#result_net_monthly_pay').textContent = NumberUtils.addCommas(netMonthlyPay) + '원';
        DOMUtils.getElement('#result_gross_monthly_pay').textContent = NumberUtils.addCommas(Math.round(annualSalary / 12)) + '원';
        DOMUtils.getElement('#result_total_monthly_deduction').textContent = NumberUtils.addCommas(totalMonthlyDeduction) + '원';
        DOMUtils.getElement('#deduction_national_pension').textContent = NumberUtils.addCommas(Math.round(np / 12));
        DOMUtils.getElement('#deduction_health_insurance').textContent = NumberUtils.addCommas(Math.round(hi / 12));
        DOMUtils.getElement('#deduction_long_term_care').textContent = NumberUtils.addCommas(Math.round(altc / 12));
        DOMUtils.getElement('#deduction_employment_insurance').textContent = NumberUtils.addCommas(Math.round(aei / 12));
        DOMUtils.getElement('#deduction_income_tax').textContent = NumberUtils.addCommas(Math.round(finalIncomeTax / 12));
        DOMUtils.getElement('#deduction_local_income_tax').textContent = NumberUtils.addCommas(Math.round(localIncomeTax / 12));
        resultsContainer.style.display = 'block';
    }

    const calculateButton = DOMUtils.getElement('#calculate_salary_button');
    if (calculateButton) {
        DOMUtils.addEvent(calculateButton, 'click', function() {
            const annualSalary = parseInt(DOMUtils.getElement('#annual_salary').value.replace(/,/g, ''), 10);
            const nonTaxableMonthly = parseInt(DOMUtils.getElement('#non_taxable_monthly').value.replace(/,/g, ''), 10);
            const dependentsCount = parseInt(DOMUtils.getElement('#dependents_count').value, 10);
            displayResults(annualSalary, nonTaxableMonthly, dependentsCount);
        });
    }
    // Auto-calculate on page load if values are present (optional)
    // const initialAnnualSalary = parseInt(DOMUtils.getElement('#annual_salary').value.replace(/,/g, ''), 10);
    // if(initialAnnualSalary > 0) {
    //      displayResults(initialAnnualSalary,
    //      parseInt(DOMUtils.getElement('#non_taxable_monthly').value.replace(/,/g, ''), 10),
    //      parseInt(DOMUtils.getElement('#dependents_count').value, 10)
    //      );
    // }
}

// Export for testing if in Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SALARY_CALC_CONFIG, createSalaryCalculatorLogic, initializeSalaryPage };
} else if (typeof window !== 'undefined') {
    // Ensure initializeSalaryPage is globally available for the HTML page
    window.initializeSalaryPage = initializeSalaryPage;
    // Expose createSalaryCalculatorLogic for potential direct use or testing in browser console
    window.createSalaryCalculatorLogic = createSalaryCalculatorLogic;
}
