// salary_calculator.js

// 2023년 기준 국민연금 요율: 9% (근로자 4.5%, 사업주 4.5%)
// 근로자 부담분: 4.5%
// 월 소득액 하한: 370,000원 (이하일 경우 370,000원으로 계산) -> 개인부담 월 16,650원
// 월 소득액 상한: 5,900,000원 (이상일 경우 5,900,000원으로 계산) -> 개인부담 월 265,500원
// (2024년 7월부터 상한액 6,170,000원으로 변경 예정)
function calculateNationalPension(annualSalary) {
    const monthlySalary = annualSalary / 12;
    const rate = 0.045;
    const minMonthlyIncome = 370000;
    const maxMonthlyIncome = 5900000; // 2023년 기준

    let basisMonthlyIncome = monthlySalary;
    if (monthlySalary < minMonthlyIncome) {
        basisMonthlyIncome = minMonthlyIncome;
    } else if (monthlySalary > maxMonthlyIncome) {
        basisMonthlyIncome = maxMonthlyIncome;
    }

    const monthlyPension = basisMonthlyIncome * rate;
    return Math.floor(monthlyPension / 10) * 10 * 12; // 원단위 절사 후 연간 합계
}

// 2023년 기준 고용보험 요율: 실업급여 0.9% (근로자 부담)
// (고용안정/직업능력개발 보험료는 사업주가 전액 부담)
function calculateEmploymentInsurance(annualSalary) {
    const monthlySalary = annualSalary / 12;
    const rate = 0.009;
    // 고용보험은 일반적으로 월별 소득 상한액이 매우 높아 대부분의 경우 연봉 전액에 대해 부과됨.
    // (2023년 기준 월 상한액은 있으나, 근로자 부담분 계산에서는 보통 총액 기준으로 계산)
    const monthlyInsurance = monthlySalary * rate;
    return Math.floor(monthlyInsurance / 10) * 10 * 12; // 원단위 절사 후 연간 합계
}

// 2023년 기준 건강보험 요율: 7.09% (근로자 3.545%)
// 건강보험료 = 보수월액 × 보험료율(3.545%)
// 월별 보험료 상한액(2023): 7,822,560원 (총액) => 근로자 부담 3,911,280원
// 월별 보험료 하한액(2023): 19,780원 (총액) => 근로자 부담 9,890원
// (실제로는 보수월액 상/하한이 있고, 그에 따라 보험료 상/하한이 결정됨)
// 보수월액 상한: 110,330,000원, 하한: 279,256원 (2023년 1월부터)
function calculateHealthInsurance(annualSalary) {
    const monthlySalary = annualSalary / 12;
    const rate = 0.03545; // 근로자 부담분 요율

    // 2023년 기준 보수월액 상/하한에 따른 보험료 상/하한 적용
    const minMonthlyHealthInsurancePremium = 9890; // 근로자 부담분 하한액
    const maxMonthlyHealthInsurancePremium = 3911280; // 근로자 부담분 상한액

    let calculatedMonthlyPremium = monthlySalary * rate;

    // 건강보험료는 보수월액을 기준으로 계산된 후, 그 결과가 상/하한을 벗어나는지 체크합니다.
    // 따라서, 여기서 minMonthlyIncome, maxMonthlyIncome을 직접 사용하는 대신,
    // 계산된 보험료를 상/하한 보험료와 비교하는 것이 더 정확합니다.
    // (또는, 보수월액 자체를 minBoSuWolAaek = 279256, maxBoSuWolAaek = 110330000 으로 제한하고 계산)
    // 여기서는 문제에 제시된 보험료 상/하한을 직접 사용하겠습니다.

    if (calculatedMonthlyPremium < minMonthlyHealthInsurancePremium) {
        // 실제로는 보수월액이 279,256원 미만이면, 279,256원을 기준으로 보험료(9,890원)를 계산.
        // 현재 로직은 계산된 보험료가 9,890원 미만이면 9,890원으로 설정. 이는 동일한 결과를 줌.
        calculatedMonthlyPremium = minMonthlyHealthInsurancePremium;
    } else if (calculatedMonthlyPremium > maxMonthlyHealthInsurancePremium) {
        // 실제로는 보수월액이 110,330,000원 초과이면, 110,330,000원을 기준으로 보험료(3,911,280원)를 계산.
        // 현재 로직은 계산된 보험료가 3,911,280원 초과이면 3,911,280원으로 설정. 이는 동일한 결과를 줌.
        calculatedMonthlyPremium = maxMonthlyHealthInsurancePremium;
    }

    return Math.floor(calculatedMonthlyPremium / 10) * 10 * 12; // 10원 단위 절사 후 연간 합계
}

// 2023년 기준 장기요양보험 요율: 건강보험료의 12.81%
function calculateLongTermCareInsurance(annualHealthInsurancePremium) {
    const monthlyHealthInsurancePremium = annualHealthInsurancePremium / 12;
    const rate = 0.1281;
    const monthlyLtcPremium = monthlyHealthInsurancePremium * rate;
    return Math.floor(monthlyLtcPremium / 10) * 10 * 12; // 10원 단위 절사 후 연간 합계
}

// --- 소득세 계산 관련 (2023년 기준, 단순화된 모델 및 예시 값) ---
// 실제로는 국세청의 복잡한 근로소득공제율, 소득세율표, 세액공제율을 정확히 반영해야 합니다.
// 여기서는 TDD를 위한 기본 구조와 예시 값을 사용합니다.

// 근로소득공제 (2023년 귀속 기준 유사 적용)
function getIncomeDeduction(annualSalary) {
    if (annualSalary <= 0) return 0;
    if (annualSalary <= 5000000) { // 500만원 이하: 총급여액의 70%
        return annualSalary * 0.7;
    } else if (annualSalary <= 15000000) { // 500만원 초과 1,500만원 이하: 350만원 + (500만원 초과금액의 40%)
        return 3500000 + (annualSalary - 5000000) * 0.4;
    } else if (annualSalary <= 45000000) { // 1,500만원 초과 4,500만원 이하: 750만원 + (1,500만원 초과금액의 15%) -> (정정: 350 + 1000*0.4 = 750)
        return 7500000 + (annualSalary - 15000000) * 0.15;
    } else if (annualSalary <= 100000000) { // 4,500만원 초과 1억원 이하: 1,200만원 + (4,500만원 초과금액의 5%) -> (정정: 750 + 3000*0.15 = 1200)
        return 12000000 + (annualSalary - 45000000) * 0.05;
    } else { // 1억원 초과: 1,475만원 + (1억원 초과금액의 2%) -> (정정: 1200 + 5500*0.05 = 1475)
        return 14750000 + (annualSalary - 100000000) * 0.02;
    }
    // 참고: 실제로는 더 복잡한 한도액(예: 2,000만원) 등이 존재할 수 있음.
}

// 인적공제 (본인 포함 부양가족 1명당 150만원) - 변경 없음
function getHumanDeduction(dependentsCount) {
    if (dependentsCount < 1) dependentsCount = 1;
    return dependentsCount * 1500000;
}

// 과세표준 계산 - 변경 없음
function calculateTaxableIncome(annualSalary, nonTaxableAnnualAmount = 0, annualNationalPension, annualHealthInsurance, annualEmploymentInsurance, annualIncomeDeduction, annualHumanDeduction) {
    const totalDeductions = nonTaxableAnnualAmount + annualNationalPension + annualHealthInsurance + annualEmploymentInsurance + annualIncomeDeduction + annualHumanDeduction;
    let taxable = annualSalary - totalDeductions;
    return taxable > 0 ? taxable : 0;
}

// 소득세 산출 (2023년 귀속 소득세 기본세율 적용)
function calculateIncomeTax(taxableIncome) {
    if (taxableIncome <= 0) return 0;
    let tax = 0;
    if (taxableIncome <= 14000000) {
        tax = taxableIncome * 0.06;
    } else if (taxableIncome <= 50000000) {
        tax = 14000000 * 0.06 + (taxableIncome - 14000000) * 0.15;
    } else if (taxableIncome <= 88000000) {
        tax = 14000000 * 0.06 + (50000000 - 14000000) * 0.15 + (taxableIncome - 50000000) * 0.24;
    } else if (taxableIncome <= 150000000) {
        tax = 14000000 * 0.06 + (50000000 - 14000000) * 0.15 + (88000000 - 50000000) * 0.24 + (taxableIncome - 88000000) * 0.35;
    } else if (taxableIncome <= 300000000) {
        tax = 14000000 * 0.06 + (50000000 - 14000000) * 0.15 + (88000000 - 50000000) * 0.24 + (150000000 - 88000000) * 0.35 + (taxableIncome - 150000000) * 0.38;
    } else if (taxableIncome <= 500000000) {
        tax = 14000000 * 0.06 + (50000000 - 14000000) * 0.15 + (88000000 - 50000000) * 0.24 + (150000000 - 88000000) * 0.35 + (300000000 - 150000000) * 0.38 + (taxableIncome - 300000000) * 0.40;
    } else if (taxableIncome <= 1000000000) {
        tax = 14000000 * 0.06 + (50000000 - 14000000) * 0.15 + (88000000 - 50000000) * 0.24 + (150000000 - 88000000) * 0.35 + (300000000 - 150000000) * 0.38 + (500000000 - 300000000) * 0.40 + (taxableIncome - 500000000) * 0.42;
    } else { // 10억원 초과
        tax = 14000000 * 0.06 + (50000000 - 14000000) * 0.15 + (88000000 - 50000000) * 0.24 + (150000000 - 88000000) * 0.35 + (300000000 - 150000000) * 0.38 + (500000000 - 300000000) * 0.40 + (1000000000 - 500000000) * 0.42 + (taxableIncome - 1000000000) * 0.45;
    }
    return Math.floor(tax / 10) * 10; // 10원 단위 절사 (연간 산출세액)
}

// 근로소득세액공제 (2023년 귀속 기준 적용)
function getIncomeTaxCredit(calculatedTax, annualSalary) {
    if (calculatedTax <= 0) return 0;
    let taxCredit = 0;
    if (calculatedTax <= 1300000) {
        taxCredit = calculatedTax * 0.55;
    } else {
        taxCredit = 715000 + (calculatedTax - 1300000) * 0.30;
    }

    let creditLimit = 0;
    if (annualSalary <= 33000000) {
        creditLimit = 740000;
    } else if (annualSalary <= 70000000) {
        creditLimit = Math.max(660000, 740000 - (annualSalary - 33000000) * 0.008);
    } else { // 7000만원 초과
        creditLimit = Math.max(500000, 660000 - (annualSalary - 70000000) * 0.5);
         // 한도액이 음수가 될 경우 0으로 처리 (또는 최소 한도 50만원)
        if (creditLimit < 500000 && annualSalary > 70000000 + ( (660000-500000) / 0.5) ) creditLimit = 500000;
    }

    return Math.floor(Math.min(taxCredit, creditLimit) / 10) * 10; // 10원 단위 절사
}

// 최종 결정세액 (근로소득세) - 변경 없음
function calculateFinalIncomeTax(calculatedTax, taxCredit) {
    const finalTax = calculatedTax - taxCredit;
    return finalTax > 0 ? Math.floor(finalTax / 10) * 10 : 0;
}

// 지방소득세 (결정세액의 10%) - 변경 없음
function calculateLocalIncomeTax(finalIncomeTax) {
    return Math.floor((finalIncomeTax * 0.1) / 10) * 10;
}

// 다른 계산 함수들 (총 공제액, 실수령액 등)은 여기에 추가될 예정입니다.
// function calculateTotalDeductions(annualSalary, nonTaxableAmount, dependents) { ... }
// function calculateNetMonthlyPay(annualSalary, nonTaxableAmount, dependents) { ... }

// 모든 공제액 합산 (연간 기준)
function calculateTotalAnnualDeductions(annualSalary, nonTaxableAnnualAmount, dependentsCount) {
    const np = calculateNationalPension(annualSalary);
    const hi = calculateHealthInsurance(annualSalary); // 비과세는 건강보험료 산정 시 보수월액에서 제외되지 않음 (단, 일부 비과세는 제외될 수 있으나 여기선 단순화)
    const ltc = calculateLongTermCareInsurance(hi);
    const ei = calculateEmploymentInsurance(annualSalary);

    const incomeDeduction = getIncomeDeduction(annualSalary - nonTaxableAnnualAmount); // 근로소득공제는 과세 대상 급여 기준으로 계산
    const humanDeduction = getHumanDeduction(dependentsCount);

    // 과세표준 계산 시 연금보험료 등 소득공제 항목이 포함됨
    const taxableIncome = calculateTaxableIncome(
        annualSalary,
        nonTaxableAnnualAmount,
        np,
        hi, // 건강보험료는 소득공제 대상 (실제로는 보험료 납부액 기준)
        ei,
        incomeDeduction,
        humanDeduction
    );

    const calculatedTax = calculateIncomeTax(taxableIncome);
    const taxCredit = getIncomeTaxCredit(calculatedTax, annualSalary - nonTaxableAnnualAmount); // 세액공제 한도 계산 시 총급여는 비과세 제외
    const finalIncomeTax = calculateFinalIncomeTax(calculatedTax, taxCredit);
    const localIncomeTax = calculateLocalIncomeTax(finalIncomeTax);

    return np + hi + ltc + ei + finalIncomeTax + localIncomeTax;
}

// 월 예상 실수령액 계산
function calculateNetMonthlyPay(annualSalary, nonTaxableMonthlyAmount, dependentsCount) {
    const nonTaxableAnnualAmount = nonTaxableMonthlyAmount * 12;
    const totalAnnualDeductions = calculateTotalAnnualDeductions(annualSalary, nonTaxableAnnualAmount, dependentsCount);
    const netAnnualPay = annualSalary - totalAnnualDeductions;
    return Math.round(netAnnualPay / 12); // 월 실수령액은 반올림
}

// UI 업데이트 함수 (결과 표시)
function displaySalaryCalculationResults(annualSalary, nonTaxableMonthly, dependentsCount) {
    const resultsContainer = DOMUtils.getElement('#salary_results_container');
    const errorDiv = DOMUtils.getElement('#error_message');
    errorDiv.style.display = 'none'; // 이전 오류 메시지 숨김

    // 입력값 유효성 검사
    if (isNaN(annualSalary) || annualSalary <= 0) {
        errorDiv.textContent = '유효한 연봉을 입력해주세요.';
        errorDiv.style.display = 'block';
        resultsContainer.style.display = 'none';
        return;
    }
    if (isNaN(nonTaxableMonthly) || nonTaxableMonthly < 0) {
        errorDiv.textContent = '유효한 월 비과세액을 입력해주세요.';
        errorDiv.style.display = 'block';
        resultsContainer.style.display = 'none';
        return;
    }
    if (isNaN(dependentsCount) || dependentsCount < 1) {
        errorDiv.textContent = '부양가족 수는 본인을 포함하여 1명 이상이어야 합니다.';
        errorDiv.style.display = 'block';
        resultsContainer.style.display = 'none';
        return;
    }


    const nonTaxableAnnual = nonTaxableMonthly * 12;

    const anp = calculateNationalPension(annualSalary);
    const ahi = calculateHealthInsurance(annualSalary);
    const altc = calculateLongTermCareInsurance(ahi);
    const aei = calculateEmploymentInsurance(annualSalary);

    const incomeDeduction = getIncomeDeduction(annualSalary - nonTaxableAnnual);
    const humanDeduction = getHumanDeduction(dependentsCount);

    const taxableIncome = calculateTaxableIncome(
        annualSalary, nonTaxableAnnual, anp, ahi, aei, incomeDeduction, humanDeduction
    );
    const calculatedTax = calculateIncomeTax(taxableIncome);
    const taxCredit = getIncomeTaxCredit(calculatedTax, annualSalary - nonTaxableAnnual);
    const finalIncomeTax = calculateFinalIncomeTax(calculatedTax, taxCredit);
    const localIncomeTax = calculateLocalIncomeTax(finalIncomeTax);

    const totalMonthlyDeduction = Math.round((anp + ahi + altc + aei + finalIncomeTax + localIncomeTax) / 12);
    const netMonthlyPay = Math.round((annualSalary - (anp + ahi + altc + aei + finalIncomeTax + localIncomeTax)) / 12);

    DOMUtils.getElement('#result_annual_salary').textContent = NumberUtils.addCommas(annualSalary) + '원';
    DOMUtils.getElement('#result_non_taxable_monthly').textContent = NumberUtils.addCommas(nonTaxableMonthly) + '원';
    DOMUtils.getElement('#result_non_taxable_annual').textContent = NumberUtils.addCommas(nonTaxableAnnual) + '원';
    DOMUtils.getElement('#result_dependents_count').textContent = dependentsCount + '명';

    DOMUtils.getElement('#result_net_monthly_pay').textContent = NumberUtils.addCommas(netMonthlyPay) + '원';
    DOMUtils.getElement('#result_gross_monthly_pay').textContent = NumberUtils.addCommas(Math.round(annualSalary / 12)) + '원';
    DOMUtils.getElement('#result_total_monthly_deduction').textContent = NumberUtils.addCommas(totalMonthlyDeduction) + '원';

    DOMUtils.getElement('#deduction_national_pension').textContent = NumberUtils.addCommas(Math.round(anp / 12));
    DOMUtils.getElement('#deduction_health_insurance').textContent = NumberUtils.addCommas(Math.round(ahi / 12));
    DOMUtils.getElement('#deduction_long_term_care').textContent = NumberUtils.addCommas(Math.round(altc / 12));
    DOMUtils.getElement('#deduction_employment_insurance').textContent = NumberUtils.addCommas(Math.round(aei / 12));
    DOMUtils.getElement('#deduction_income_tax').textContent = NumberUtils.addCommas(Math.round(finalIncomeTax / 12));
    DOMUtils.getElement('#deduction_local_income_tax').textContent = NumberUtils.addCommas(Math.round(localIncomeTax / 12));

    resultsContainer.style.display = 'block';
}

function initializeSalaryPage() {
    const calculateButton = DOMUtils.getElement('#calculate_salary_button');
    const annualSalaryInput = DOMUtils.getElement('#annual_salary');
    const nonTaxableMonthlyInput = DOMUtils.getElement('#non_taxable_monthly');
    const dependentsCountInput = DOMUtils.getElement('#dependents_count');

    if (calculateButton && annualSalaryInput && nonTaxableMonthlyInput && dependentsCountInput) {
        DOMUtils.addEvent(calculateButton, 'click', function() {
            const annualSalary = parseInt(annualSalaryInput.value, 10);
            const nonTaxableMonthly = parseInt(nonTaxableMonthlyInput.value, 10);
            const dependentsCount = parseInt(dependentsCountInput.value, 10);

            displaySalaryCalculationResults(annualSalary, nonTaxableMonthly, dependentsCount);
        });
    } else {
        console.error('One or more salary input elements are missing for event listener setup.');
    }
}
