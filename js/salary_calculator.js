// salary_calculator.js

/**
 * 화면에 표시할 문구를 현재 언어로 가져온다.
 * i18n이 아직 준비되지 않았으면 한국어 원문을 그대로 사용한다.
 * @param {string} key - 번역 키
 * @param {string} fallback - 한국어 원문
 * @param {Object} [params] - {name} 자리에 채울 값
 */
function salaryText(key, fallback, params) {
    const manager = window.i18nManager;
    if (!manager || !manager.ready) return fallback;
    return params ? manager.format(key, params, fallback) : manager.t(key, fallback);
}


// 2026년 기준 국민연금 요율: 9.5% (근로자 4.75%, 사업주 4.75%)
// - 2025년 연금개혁(국민연금법 개정)으로 2026-01-01부터 9% -> 9.5%로 인상
//   (2033년 13%까지 매년 0.5%p 단계적 인상 예정)
// 근로자 부담분: 4.75%
// 기준소득월액 (2026-07 ~ 2027-06 적용)
// - 하한: 410,000원   -> 근로자 부담 월 19,470원 (10원 절사)
// - 상한: 6,590,000원 -> 근로자 부담 월 313,020원 (10원 절사)
const NATIONAL_PENSION_RATE = 0.0475;              // 근로자 부담 요율
const NATIONAL_PENSION_MIN_MONTHLY_INCOME = 410000;   // 기준소득월액 하한
const NATIONAL_PENSION_MAX_MONTHLY_INCOME = 6590000;  // 기준소득월액 상한

function calculateNationalPension(annualSalary) {
    const monthlySalary = annualSalary / 12;
    const rate = NATIONAL_PENSION_RATE;
    const minMonthlyIncome = NATIONAL_PENSION_MIN_MONTHLY_INCOME;
    const maxMonthlyIncome = NATIONAL_PENSION_MAX_MONTHLY_INCOME;

    let basisMonthlyIncome = monthlySalary;
    if (monthlySalary < minMonthlyIncome) {
        basisMonthlyIncome = minMonthlyIncome;
    } else if (monthlySalary > maxMonthlyIncome) {
        basisMonthlyIncome = maxMonthlyIncome;
    }

    const monthlyPension = basisMonthlyIncome * rate;
    return Math.floor(monthlyPension / 10) * 10 * 12; // 원단위 절사 후 연간 합계
}

// 2026년 기준 고용보험 요율: 실업급여 0.9% (근로자 부담)
// (고용안정/직업능력개발 보험료는 사업주가 전액 부담)
function calculateEmploymentInsurance(annualSalary) {
    const monthlySalary = annualSalary / 12;
    const rate = 0.009;
    // 고용보험은 일반적으로 월별 소득 상한액이 매우 높아 대부분의 경우 연봉 전액에 대해 부과됨.
    // (2023년 기준 월 상한액은 있으나, 근로자 부담분 계산에서는 보통 총액 기준으로 계산)
    const monthlyInsurance = monthlySalary * rate;
    return Math.floor(monthlyInsurance / 10) * 10 * 12; // 원단위 절사 후 연간 합계
}

// 2026년 기준 건강보험 요율: 7.19% (근로자 3.595%)
// 건강보험료 = 보수월액 × 보험료율(3.595%)
// 월별 보험료 상한액(2026): 9,183,480원 (총액) => 근로자 부담 4,591,740원
// 월별 보험료 하한액(2026): 20,160원 (총액) => 근로자 부담 10,080원
function calculateHealthInsurance(annualSalary) {
    const monthlySalary = annualSalary / 12;
    const rate = 0.03595; // 근로자 부담분 요율

    // 2026년 기준 보수월액 상/하한에 따른 보험료 상/하한 적용
    const minMonthlyHealthInsurancePremium = 10080; // 근로자 부담분 하한액
    const maxMonthlyHealthInsurancePremium = 4591740; // 근로자 부담분 상한액

    let calculatedMonthlyPremium = monthlySalary * rate;

    // 건강보험료는 보수월액을 기준으로 계산된 후, 그 결과가 상/하한을 벗어나는지 체크합니다.
    // 따라서, 여기서 minMonthlyIncome, maxMonthlyIncome을 직접 사용하는 대신,
    // 계산된 보험료를 상/하한 보험료와 비교하는 것이 더 정확합니다.
    // (또는, 보수월액 자체를 minBoSuWolAaek = 279256, maxBoSuWolAaek = 110330000 으로 제한하고 계산)
    // 여기서는 문제에 제시된 보험료 상/하한을 직접 사용하겠습니다.

    if (calculatedMonthlyPremium < minMonthlyHealthInsurancePremium) {
        // 실제로는 계산된 보험료가 월 근로자 부담분 하한액 10,080원보다 작으면 10,080원을 적용합니다.
        // 현재 로직은 계산된 보험료가 하한액 미만이면 하한액으로 설정합니다.
        calculatedMonthlyPremium = minMonthlyHealthInsurancePremium;
    } else if (calculatedMonthlyPremium > maxMonthlyHealthInsurancePremium) {
        // 실제로는 계산된 보험료가 월 근로자 부담분 상한액 4,591,740원을 초과하면 4,591,740원을 적용합니다.
        // 현재 로직은 계산된 보험료가 상한액을 초과하면 상한액으로 설정합니다.
        calculatedMonthlyPremium = maxMonthlyHealthInsurancePremium;
    }

    return Math.floor(calculatedMonthlyPremium / 10) * 10 * 12; // 10원 단위 절사 후 연간 합계
}

// 2026년 기준 장기요양보험 요율: 건강보험료의 13.14% (보수월액 대비 0.9448%)
function calculateLongTermCareInsurance(annualHealthInsurancePremium) {
    const monthlyHealthInsurancePremium = annualHealthInsurancePremium / 12;
    const rate = 0.1314;
    const monthlyLtcPremium = monthlyHealthInsurancePremium * rate;
    return Math.floor(monthlyLtcPremium / 10) * 10 * 12; // 10원 단위 절사 후 연간 합계
}

// --- 소득세 계산 관련 (2026년 기준) ---
// 소득세 기본세율 구간 및 근로소득공제율은 2023년 이후 변동 없음
// 여기서는 TDD를 위한 기본 구조와 예시 값을 사용합니다.

// 근로소득공제 (2026년 귀속 기준 적용 - 2023년 이후 변동 없음)
// 공제 한도 2,000만원 (소득세법 제47조 제1항 단서)
const INCOME_DEDUCTION_LIMIT = 20000000;

function getIncomeDeduction(annualSalary) {
    if (annualSalary <= 0) return 0;
    let deduction;
    if (annualSalary <= 5000000) { // 500만원 이하: 총급여액의 70%
        deduction = annualSalary * 0.7;
    } else if (annualSalary <= 15000000) { // 500만원 초과 1,500만원 이하: 350만원 + (500만원 초과금액의 40%)
        deduction = 3500000 + (annualSalary - 5000000) * 0.4;
    } else if (annualSalary <= 45000000) { // 1,500만원 초과 4,500만원 이하: 750만원 + (1,500만원 초과금액의 15%)
        deduction = 7500000 + (annualSalary - 15000000) * 0.15;
    } else if (annualSalary <= 100000000) { // 4,500만원 초과 1억원 이하: 1,200만원 + (4,500만원 초과금액의 5%)
        deduction = 12000000 + (annualSalary - 45000000) * 0.05;
    } else { // 1억원 초과: 1,475만원 + (1억원 초과금액의 2%)
        deduction = 14750000 + (annualSalary - 100000000) * 0.02;
    }
    // 공제액이 2,000만원을 초과하면 2,000만원까지만 공제 (총급여 약 3억 6,250만원 초과 시 적용)
    return Math.min(deduction, INCOME_DEDUCTION_LIMIT);
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

// 소득세 산출 (2026년 귀속 소득세 기본세율 적용 - 2023년 이후 변동 없음)
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

// 근로소득세액공제 (2026년 귀속 기준 적용 - 2023년 이후 변동 없음)
function getIncomeTaxCredit(calculatedTax, annualSalary) {
    if (calculatedTax <= 0) return 0;
    let taxCredit = 0;
    if (calculatedTax <= 1300000) {
        taxCredit = calculatedTax * 0.55;
    } else {
        taxCredit = 715000 + (calculatedTax - 1300000) * 0.30;
    }

    // 근로소득세액공제 한도 (소득세법 제59조)
    let creditLimit = 0;
    if (annualSalary <= 33000000) {
        creditLimit = 740000;
    } else if (annualSalary <= 70000000) {
        // 3,300만원 초과 7,000만원 이하: Max[74만원 - (총급여 - 3,300만원) x 0.008, 66만원]
        creditLimit = Math.max(660000, 740000 - (annualSalary - 33000000) * 0.008);
    } else if (annualSalary <= 120000000) {
        // 7,000만원 초과 1억 2,000만원 이하: Max[66만원 - (총급여 - 7,000만원) x 1/2, 50만원]
        creditLimit = Math.max(500000, 660000 - (annualSalary - 70000000) * 0.5);
    } else {
        // 1억 2,000만원 초과: Max[50만원 - (총급여 - 1억 2,000만원) x 1/2, 20만원]
        creditLimit = Math.max(200000, 500000 - (annualSalary - 120000000) * 0.5);
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
    return Math.floor((netAnnualPay / 12) / 10) * 10; // 월 실수령액 10원 단위 절사
}

// ─────────────────────────────────────────────
// 역계산: 월 실수령액 -> 연봉 추정
// ─────────────────────────────────────────────
// calculateNetMonthlyPay(연봉)은 연봉에 대해 단조 증가(비감소)하므로 이분 탐색으로 역산합니다.
// 10원 단위 절사 때문에 하나의 실수령액에 여러 연봉이 대응될 수 있어,
// 목표 실수령액 이상이 되는 "최소 연봉"을 반환합니다.
const REVERSE_SEARCH_MAX_ANNUAL_SALARY = 10000000000; // 탐색 상한: 100억원

function calculateAnnualSalaryFromNetMonthly(targetNetMonthly, nonTaxableMonthlyAmount, dependentsCount) {
    if (!Number.isFinite(targetNetMonthly) || targetNetMonthly <= 0) return null;

    const hiNet = calculateNetMonthlyPay(REVERSE_SEARCH_MAX_ANNUAL_SALARY, nonTaxableMonthlyAmount, dependentsCount);
    if (hiNet < targetNetMonthly) return null; // 탐색 범위를 넘어서는 실수령액

    let lo = 0;
    let hi = REVERSE_SEARCH_MAX_ANNUAL_SALARY;

    while (hi - lo > 1) {
        const mid = Math.floor((lo + hi) / 2);
        if (calculateNetMonthlyPay(mid, nonTaxableMonthlyAmount, dependentsCount) >= targetNetMonthly) {
            hi = mid;
        } else {
            lo = mid;
        }
    }

    return hi;
}

// 역계산 결과를 만원 단위로 반올림한 "표시용 연봉"
function roundAnnualSalaryToManwon(annualSalary) {
    return Math.round(annualSalary / 10000) * 10000;
}

// ─────────────────────────────────────────────
// UI 관련
// ─────────────────────────────────────────────
const SALARY_INPUT_UNIT = 1000000;      // 연봉 입력 단위: 백만원
const NET_MONTHLY_INPUT_UNIT = 10000;   // 실수령 월급 입력 단위: 만원

// 입력값(백만원) -> 원
function annualSalaryInputToWon(inputValue) {
    const parsed = parseFloat(inputValue);
    if (!Number.isFinite(parsed)) return NaN;
    return Math.round(parsed * SALARY_INPUT_UNIT);
}

// 입력값(만원) -> 원
function netMonthlyInputToWon(inputValue) {
    const parsed = parseFloat(inputValue);
    if (!Number.isFinite(parsed)) return NaN;
    return Math.round(parsed * NET_MONTHLY_INPUT_UNIT);
}

function showSalaryError(message) {
    const errorDiv = DOMUtils.getElement('#error_message');
    const resultsContainer = DOMUtils.getElement('#salary_results_container');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
    if (resultsContainer) {
        resultsContainer.style.display = 'none';
    }
}

// 결과 강조 전환: 어떤 값이 "정답"인지 한눈에 보이도록 모드별로 크기/굵기를 바꿉니다.
const RESULT_EMPHASIS = {
    netPayPrimary: { fontSize: '2.75rem', weightClass: 'fw-bolder' },
    netPaySecondary: { fontSize: '1.9rem', weightClass: 'fw-bold' }
};

function applyResultEmphasis(isReverseMode) {
    const netPayEl = DOMUtils.getElement('#result_net_monthly_pay');
    if (!netPayEl) return;

    const style = isReverseMode ? RESULT_EMPHASIS.netPaySecondary : RESULT_EMPHASIS.netPayPrimary;
    netPayEl.style.fontSize = style.fontSize;
    netPayEl.classList.remove('fw-bold', 'fw-bolder');
    netPayEl.classList.add(style.weightClass);
}

// UI 업데이트 함수 (결과 표시)
// reverseInfo: 역계산(실수령액 -> 연봉) 결과일 때 { targetNetMonthly, exactAnnualSalary } 전달
function displaySalaryCalculationResults(annualSalary, nonTaxableMonthly, dependentsCount, reverseInfo = null) {
    const resultsContainer = DOMUtils.getElement('#salary_results_container');
    const errorDiv = DOMUtils.getElement('#error_message');
    errorDiv.style.display = 'none'; // 이전 오류 메시지 숨김

    // 입력값 유효성 검사
    if (isNaN(annualSalary) || annualSalary <= 0) {
        showSalaryError(salaryText('salary.err_annual', '유효한 연봉을 입력해주세요.'));
        return;
    }
    if (isNaN(nonTaxableMonthly) || nonTaxableMonthly < 0) {
        showSalaryError(salaryText('salary.err_non_taxable', '유효한 월 비과세액을 입력해주세요.'));
        return;
    }
    if (isNaN(dependentsCount) || dependentsCount < 1) {
        showSalaryError(salaryText('salary.err_dependents', '부양가족 수는 본인을 포함하여 1명 이상이어야 합니다.'));
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

    const totalMonthlyDeduction = Math.floor(((anp + ahi + altc + aei + finalIncomeTax + localIncomeTax) / 12) / 10) * 10;
    const netMonthlyPay = Math.floor(((annualSalary - (anp + ahi + altc + aei + finalIncomeTax + localIncomeTax)) / 12) / 10) * 10;

    DOMUtils.setTexts({
        '#result_annual_salary': NumberUtils.formatCurrency(annualSalary),
        '#result_non_taxable_monthly': NumberUtils.formatCurrency(nonTaxableMonthly),
        '#result_non_taxable_annual': NumberUtils.formatCurrency(nonTaxableAnnual),
        '#result_dependents_count': salaryText('salary.unit_people', `${dependentsCount}명`, { count: dependentsCount }),
        '#result_net_monthly_pay': NumberUtils.formatCurrency(netMonthlyPay),
        '#result_gross_monthly_pay': NumberUtils.formatCurrency(Math.floor((annualSalary / 12) / 10) * 10),
        '#result_total_monthly_deduction': NumberUtils.formatCurrency(totalMonthlyDeduction),
        '#deduction_national_pension': NumberUtils.formatRounded(anp / 12),
        '#deduction_health_insurance': NumberUtils.formatRounded(ahi / 12),
        '#deduction_long_term_care': NumberUtils.formatRounded(altc / 12),
        '#deduction_employment_insurance': NumberUtils.formatRounded(aei / 12),
        '#deduction_income_tax': NumberUtils.formatCurrency(Math.floor((finalIncomeTax / 12) / 10) * 10),
        '#deduction_local_income_tax': NumberUtils.formatCurrency(Math.floor((localIncomeTax / 12) / 10) * 10)
    });

    // 역계산 안내 배너 처리
    const notice = DOMUtils.getElement('#reverse_result_notice');
    if (notice) {
        if (reverseInfo) {
            DOMUtils.setTexts({
                '#reverse_target_net': NumberUtils.formatCurrency(reverseInfo.targetNetMonthly),
                '#reverse_estimated_salary': NumberUtils.formatCurrency(annualSalary),
                '#reverse_result_detail': salaryText(
                    'salary.reverse_detail',
                    `정확히는 연봉 ${NumberUtils.formatCurrency(reverseInfo.exactAnnualSalary)}부터 목표 실수령액에 도달하며, 위 금액은 만원 단위로 정리한 값입니다. (실수령 ${NumberUtils.formatCurrency(netMonthlyPay)})`,
                    {
                        exact: NumberUtils.formatCurrency(reverseInfo.exactAnnualSalary),
                        net: NumberUtils.formatCurrency(netMonthlyPay)
                    }
                )
            });
            notice.classList.remove('d-none');
        } else {
            notice.classList.add('d-none');
        }
    }

    // 모드별 강조 전환
    // - 정방향(연봉 → 실수령액): 월 실수령액을 가장 크고 진하게
    // - 역방향(실수령액 → 연봉): 배너의 연봉을 가장 크고 진하게, 실수령액은 한 단계 축소
    applyResultEmphasis(!!reverseInfo);

    resultsContainer.style.display = 'block';
}

function initializeSalaryPage() {
    const calculateButton = DOMUtils.getElement('#calculate_salary_button');
    const annualSalaryInput = DOMUtils.getElement('#annual_salary');
    const targetNetMonthlyInput = DOMUtils.getElement('#target_net_monthly');
    const nonTaxableMonthlyInput = DOMUtils.getElement('#non_taxable_monthly');
    const dependentsCountInput = DOMUtils.getElement('#dependents_count');
    const annualSalaryGroup = DOMUtils.getElement('#annual_salary_group');
    const targetNetMonthlyGroup = DOMUtils.getElement('#target_net_monthly_group');
    const annualSalaryPreview = DOMUtils.getElement('#annual_salary_preview');
    const targetNetMonthlyPreview = DOMUtils.getElement('#target_net_monthly_preview');
    const modeForward = DOMUtils.getElement('#salary_mode_forward');
    const modeReverse = DOMUtils.getElement('#salary_mode_reverse');

    if (!calculateButton || !annualSalaryInput || !nonTaxableMonthlyInput || !dependentsCountInput) {
        console.error('One or more salary input elements are missing for event listener setup.');
        return;
    }

    function isReverseMode() {
        return !!(modeReverse && modeReverse.checked);
    }

    function updatePreviews() {
        if (annualSalaryPreview) {
            const won = annualSalaryInputToWon(annualSalaryInput.value);
            annualSalaryPreview.textContent = Number.isFinite(won) && won > 0
                ? NumberUtils.formatCurrency(won)
                : salaryText('salary.hint_forward', '연봉을 백만원 단위로 입력하세요 (예: 50 → 5,000만원)');
        }
        if (targetNetMonthlyPreview && targetNetMonthlyInput) {
            const won = netMonthlyInputToWon(targetNetMonthlyInput.value);
            targetNetMonthlyPreview.textContent = Number.isFinite(won) && won > 0
                ? NumberUtils.formatCurrency(won)
                : salaryText('salary.hint_reverse', '월 실수령액을 만원 단위로 입력하세요 (예: 300 → 300만원)');
        }
    }

    function applyMode() {
        const reverse = isReverseMode();
        if (annualSalaryGroup) annualSalaryGroup.classList.toggle('d-none', reverse);
        if (targetNetMonthlyGroup) targetNetMonthlyGroup.classList.toggle('d-none', !reverse);
    }

    function runCalculation() {
        const nonTaxableMonthly = parseInt(nonTaxableMonthlyInput.value, 10);
        const dependentsCount = parseInt(dependentsCountInput.value, 10);

        if (!isReverseMode()) {
            const annualSalary = annualSalaryInputToWon(annualSalaryInput.value);
            displaySalaryCalculationResults(annualSalary, nonTaxableMonthly, dependentsCount);
            return;
        }

        // 역계산 모드: 월 실수령액 -> 연봉
        const targetNetMonthly = netMonthlyInputToWon(targetNetMonthlyInput ? targetNetMonthlyInput.value : '');
        if (isNaN(targetNetMonthly) || targetNetMonthly <= 0) {
            showSalaryError(salaryText('salary.err_net', '유효한 월 실수령액을 입력해주세요.'));
            return;
        }
        if (isNaN(nonTaxableMonthly) || nonTaxableMonthly < 0) {
            showSalaryError(salaryText('salary.err_non_taxable', '유효한 월 비과세액을 입력해주세요.'));
            return;
        }
        if (isNaN(dependentsCount) || dependentsCount < 1) {
            showSalaryError(salaryText('salary.err_dependents', '부양가족 수는 본인을 포함하여 1명 이상이어야 합니다.'));
            return;
        }

        const exactAnnualSalary = calculateAnnualSalaryFromNetMonthly(targetNetMonthly, nonTaxableMonthly, dependentsCount);
        if (exactAnnualSalary === null) {
            showSalaryError(salaryText('salary.err_not_found', '입력하신 실수령액에 해당하는 연봉을 찾을 수 없습니다. 금액을 확인해주세요.'));
            return;
        }

        const displayAnnualSalary = roundAnnualSalaryToManwon(exactAnnualSalary);
        displaySalaryCalculationResults(displayAnnualSalary, nonTaxableMonthly, dependentsCount, {
            targetNetMonthly,
            exactAnnualSalary
        });

        // 역산된 연봉을 정방향 입력값에도 반영 (모드 전환 시 이어서 확인 가능)
        annualSalaryInput.value = String(Math.round(displayAnnualSalary / SALARY_INPUT_UNIT * 100) / 100);
        updatePreviews();
    }

    DOMUtils.addEvent(calculateButton, 'click', runCalculation);
    DOMUtils.addEvent(annualSalaryInput, 'input', updatePreviews);
    if (targetNetMonthlyInput) DOMUtils.addEvent(targetNetMonthlyInput, 'input', updatePreviews);
    if (modeForward) DOMUtils.addEvent(modeForward, 'change', applyMode);
    if (modeReverse) DOMUtils.addEvent(modeReverse, 'change', applyMode);

    [annualSalaryInput, targetNetMonthlyInput, nonTaxableMonthlyInput, dependentsCountInput].forEach((input) => {
        if (!input) return;
        DOMUtils.addEvent(input, 'keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                runCalculation();
            }
        });
    });

    applyMode();
    updatePreviews();
}
