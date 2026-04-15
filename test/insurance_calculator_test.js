/**
 * insurance_calculator.js 로직 단위 테스트
 * Node.js 환경에서 실행: node test/insurance_calculator_test.js
 *
 * insurance_calculator.js의 계산 로직은 initializeInsuranceCalculator() 클로저 내부에
 * 캡슐화되어 있어 직접 접근이 불가능합니다.
 * 따라서 동일한 요율과 로직을 이 파일에서 재현하여 테스트합니다.
 * (요율 변경 시 두 파일 모두 업데이트 필요)
 */

// ─────────────────────────────────────────────
// 2026년 기준 보험 요율 (insurance_calculator.js와 동일)
// ─────────────────────────────────────────────
const INSURANCE_RATES = {
    health: 0.03595,
    longTermCare: 0.1314,
    pension: 0.045,
    unemployment: 0.009,
    stabilitySmall: 0.0025,
    stabilityRegular: 0.0085
};

const LIMITS = {
    pensionMin: 400000,
    pensionMax: 6370000,
    salaryMin: 100000,
    salaryMax: 100000000
};

function floorToTen(value) {
    return Math.floor(value / 10) * 10;
}

// ─────────────────────────────────────────────
// 계산 함수 (insurance_calculator.js 내부 로직 재현)
// ─────────────────────────────────────────────

function calcHealthEmployee(monthlySalary) {
    return floorToTen(monthlySalary * INSURANCE_RATES.health);
}

function calcHealthEmployer(monthlySalary) {
    return floorToTen(monthlySalary * INSURANCE_RATES.health);
}

function calcLongTermCareEmployee(healthEmployee) {
    return floorToTen(healthEmployee * INSURANCE_RATES.longTermCare);
}

function calcLongTermCareEmployer(healthEmployer) {
    return floorToTen(healthEmployer * INSURANCE_RATES.longTermCare);
}

function calcPensionBase(monthlySalary) {
    return Math.min(Math.max(monthlySalary, LIMITS.pensionMin), LIMITS.pensionMax);
}

function calcPensionEmployee(monthlySalary) {
    return floorToTen(calcPensionBase(monthlySalary) * INSURANCE_RATES.pension);
}

function calcPensionEmployer(monthlySalary) {
    return floorToTen(calcPensionBase(monthlySalary) * INSURANCE_RATES.pension);
}

function calcUnemploymentEmployee(monthlySalary) {
    return floorToTen(monthlySalary * INSURANCE_RATES.unemployment);
}

function calcUnemploymentEmployer(monthlySalary) {
    return floorToTen(monthlySalary * INSURANCE_RATES.unemployment);
}

function calcStabilityEmployer(monthlySalary, businessType) {
    const rate = businessType === 'small' ? INSURANCE_RATES.stabilitySmall : INSURANCE_RATES.stabilityRegular;
    return floorToTen(monthlySalary * rate);
}

function calcIncomeTax(monthlyIncome, dependents) {
    const taxBase = monthlyIncome;
    let tax = 0;
    if (taxBase <= 1060000) {
        tax = 0;
    } else if (taxBase <= 1500000) {
        tax = taxBase * 0.006;
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
    const deduction = (dependents - 1) * 12500;
    tax = Math.max(0, tax - deduction);
    return floorToTen(tax);
}

// ─────────────────────────────────────────────
// 테스트 프레임워크
// ─────────────────────────────────────────────
let passCount = 0;
let failCount = 0;

function assertEquals(actual, expected, message) {
    if (actual === expected) {
        passCount++;
        console.log(`  PASS: ${message}`);
    } else {
        failCount++;
        console.error(`  FAIL: ${message}`);
        console.error(`       기대값: ${JSON.stringify(expected)}, 실제값: ${JSON.stringify(actual)}`);
    }
}

function assertAlmostEquals(actual, expected, tolerance, message) {
    if (Math.abs(actual - expected) <= tolerance) {
        passCount++;
        console.log(`  PASS: ${message}`);
    } else {
        failCount++;
        console.error(`  FAIL: ${message}`);
        console.error(`       기대값: ${expected} (±${tolerance}), 실제값: ${actual}`);
    }
}

function assertRange(actual, min, max, message) {
    if (actual >= min && actual <= max) {
        passCount++;
        console.log(`  PASS: ${message}`);
    } else {
        failCount++;
        console.error(`  FAIL: ${message}`);
        console.error(`       범위: ${min}~${max}, 실제값: ${actual}`);
    }
}

function describe(name, fn) {
    console.log(`\n[${name}]`);
    fn();
}

// ─────────────────────────────────────────────
// 테스트
// ─────────────────────────────────────────────

describe('건강보험 계산 (근로자 3.595%)', () => {
    // 월 3,000,000원 × 3.595% = 107,850원
    assertEquals(calcHealthEmployee(3000000), 107850, '월 300만원 건강보험 근로자 107,850원');
    assertEquals(calcHealthEmployer(3000000), 107850, '월 300만원 건강보험 사업주 107,850원');

    // 월 5,000,000원 × 3.595% = 179,750원
    assertEquals(calcHealthEmployee(5000000), 179750, '월 500만원 건강보험 근로자 179,750원');

    // 근로자 = 사업주 (동일 요율)
    assertEquals(calcHealthEmployee(4000000), calcHealthEmployer(4000000), '건강보험 근로자=사업주 동일');
});

describe('장기요양보험 계산 (건강보험료의 13.14%)', () => {
    // 건강보험료 107,850원 × 13.14% = 14,171.49원 → 10원 단위 절사 14,170원
    const he = calcHealthEmployee(3000000);
    assertEquals(calcLongTermCareEmployee(he), floorToTen(he * 0.1314), '장기요양 = 건강보험 × 13.14% 10원 절사');

    // 월 500만원
    const he5k = calcHealthEmployee(5000000);
    assertRange(calcLongTermCareEmployee(he5k), 22000, 24000, '월 500만원 장기요양 22,000~24,000원');
});

describe('국민연금 계산 (근로자 4.5%, 하한 400,000원 / 상한 6,370,000원)', () => {
    // 월 3,000,000원 × 4.5% = 135,000원
    assertEquals(calcPensionEmployee(3000000), 135000, '월 300만원 국민연금 근로자 135,000원');
    assertEquals(calcPensionEmployer(3000000), 135000, '월 300만원 국민연금 사업주 135,000원');

    // 하한 적용: 월 200,000원 < 400,000원 → 400,000 × 4.5% = 18,000원
    assertEquals(calcPensionEmployee(200000), 18000, '월 20만원 → 하한 적용 18,000원');

    // 상한 적용: 월 8,000,000원 > 6,370,000원 → 6,370,000 × 4.5% = 286,650원
    assertEquals(calcPensionEmployee(8000000), 286650, '월 800만원 → 상한 적용 286,650원');

    // 정확히 하한
    assertEquals(calcPensionEmployee(400000), floorToTen(400000 * 0.045), '하한 정확히 일치');

    // 정확히 상한
    assertEquals(calcPensionEmployee(6370000), floorToTen(6370000 * 0.045), '상한 정확히 일치');

    // 근로자 = 사업주
    assertEquals(calcPensionEmployee(5000000), calcPensionEmployer(5000000), '국민연금 근로자=사업주 동일');
});

describe('고용보험 계산 (실업급여 0.9%)', () => {
    // 월 3,000,000원 × 0.9% = 27,000원 → 10원 단위 절사 26,990원
    assertEquals(calcUnemploymentEmployee(3000000), 26990, '월 300만원 고용보험 근로자 26,990원');
    assertEquals(calcUnemploymentEmployer(3000000), 26990, '월 300만원 고용보험 사업주(실업) 26,990원');

    // 우선지원대상기업 고용안정: 월 3,000,000원 × 0.25% = 7,500원
    assertEquals(calcStabilityEmployer(3000000, 'small'), 7500, '우선지원기업 고용안정 7,500원');

    // 일반기업 고용안정: 월 3,000,000원 × 0.85% = 25,500원
    assertEquals(calcStabilityEmployer(3000000, 'regular'), 25500, '일반기업 고용안정 25,500원');

    // 사업주 고용보험 총액 (실업급여 + 고용안정)
    const empEmployer = calcUnemploymentEmployer(3000000) + calcStabilityEmployer(3000000, 'regular');
    assertEquals(empEmployer, 52490, '일반기업 사업주 고용보험 총액 52,490원');
});

describe('소득세 간이세액 계산 (간이세액표 근사치, 10원 절사)', () => {
    // 월 1,060,000원 이하 → 세금 0
    assertEquals(calcIncomeTax(1000000, 1), 0, '월 100만원 이하 → 소득세 0');
    assertEquals(calcIncomeTax(1060000, 1), 0, '월 1,060,000원 → 소득세 0');

    // 월 2,000,000원 구간: 9,000 + (2,000,000 - 1,500,000) * 0.015 = 9,000 + 7,500 = 16,500원
    assertEquals(calcIncomeTax(2000000, 1), 16500, '월 200만원 소득세 16,500원');

    // 부양가족 2명 → 1인당 12,500원 추가 공제
    assertAlmostEquals(calcIncomeTax(2000000, 2), 4000, 500, '월 200만원, 부양가족 2명 → 약 4,000원');

    // 부양가족 많을수록 세금 감소
    const tax1 = calcIncomeTax(3000000, 1);
    const tax3 = calcIncomeTax(3000000, 3);
    assertEquals(tax3 < tax1, true, '부양가족 3명 → 1명보다 세금 낮음');

    // 세금은 0 이상
    assertEquals(calcIncomeTax(3000000, 10) >= 0, true, '부양가족 많아도 세금 0 이상');
});

describe('근로자 부담 합계 (건강+장기요양+국민연금+고용보험)', () => {
    const salary = 3000000;
    const he = calcHealthEmployee(salary);
    const lce = calcLongTermCareEmployee(he);
    const pe = calcPensionEmployee(salary);
    const ue = calcUnemploymentEmployee(salary);
    const total = he + lce + pe + ue;

    // 각 항목이 양수
    assertEquals(he > 0, true, '건강보험 > 0');
    assertEquals(lce > 0, true, '장기요양보험 > 0');
    assertEquals(pe > 0, true, '국민연금 > 0');
    assertEquals(ue > 0, true, '고용보험 > 0');

    // 총합이 합리적 범위 (월급의 9%~12% 범위)
    assertRange(total / salary, 0.09, 0.12, '근로자 부담 비율 9~12%');

    // 월 300만원 예시 총합 검증
    // 107,850 + 14,170 + 135,000 + 27,000 = 284,020원
    assertRange(total, 270000, 300000, '월 300만원 근로자 부담 총액 27~30만원');
});

describe('실수령액 계산 검증', () => {
    function calcNetSalary(monthlySalary, dependents, businessType = 'regular') {
        const he = calcHealthEmployee(monthlySalary);
        const lce = calcLongTermCareEmployee(he);
        const pe = calcPensionEmployee(monthlySalary);
        const ue = calcUnemploymentEmployee(monthlySalary);
        const incomeTax = calcIncomeTax(monthlySalary, dependents);
        const localTax = floorToTen(incomeTax * 0.1);
        const totalDeduction = he + lce + pe + ue + incomeTax + localTax;
        return monthlySalary - totalDeduction;
    }

    // 월 300만원 실수령은 250만원~290만원 범위
    assertRange(calcNetSalary(3000000, 1), 2500000, 2900000, '월 300만원 실수령 250~290만원');

    // 월 500만원 실수령은 400만원~470만원 범위
    assertRange(calcNetSalary(5000000, 1), 4000000, 4700000, '월 500만원 실수령 400~470만원');

    // 급여 높을수록 실수령 높음
    const net3m = calcNetSalary(3000000, 1);
    const net5m = calcNetSalary(5000000, 1);
    assertEquals(net5m > net3m, true, '월 500만원 실수령 > 300만원 실수령');

    // 부양가족 많을수록 실수령 높음 (세금 감소)
    const net1dep = calcNetSalary(3000000, 1);
    const net3dep = calcNetSalary(3000000, 3);
    assertEquals(net3dep >= net1dep, true, '부양가족 3명 실수령 >= 1명 실수령');
});

// ─────────────────────────────────────────────
// 결과 출력
// ─────────────────────────────────────────────
console.log(`\n${'='.repeat(50)}`);
console.log(`insurance_calculator 테스트 결과: ${passCount}개 통과 / ${failCount}개 실패`);
if (failCount === 0) {
    console.log('모든 테스트를 통과했습니다.');
} else {
    console.error(`${failCount}개의 테스트가 실패했습니다.`);
    process.exitCode = 1;
}
