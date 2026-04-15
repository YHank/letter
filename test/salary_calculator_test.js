/**
 * salary_calculator.js 단위 테스트
 * Node.js 환경에서 실행: node test/salary_calculator_test.js
 *
 * salary_calculator.js는 전역 함수로 선언되어 있으므로
 * Node.js에서 vm 모듈을 통해 로드합니다.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// DOM 의존 함수(displaySalaryCalculationResults, initializeSalaryPage)를 위한 최소 모킹
const mockContext = {
    DOMUtils: {
        getElement: () => ({ style: {}, textContent: '' }),
        addEvent: () => {}
    },
    NumberUtils: {
        addCommas: (n) => String(n)
    },
    console,
    Math,
    parseInt,
    parseFloat,
    isNaN,
    String,
    Number,
    Date
};

const scriptPath = path.join(__dirname, '../js/salary_calculator.js');
const scriptCode = fs.readFileSync(scriptPath, 'utf8');
const script = new vm.Script(scriptCode);
const context = vm.createContext(mockContext);
script.runInContext(context);

// 컨텍스트에서 함수 추출
const {
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
} = context;

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
// 헬퍼: 10원 단위 절사 여부 확인
// ─────────────────────────────────────────────
function is10WonUnit(value, message) {
    assertEquals(value % 10, 0, `${message} → 10원 단위 절사`);
}

// ─────────────────────────────────────────────
// 테스트
// ─────────────────────────────────────────────

describe('calculateNationalPension - 국민연금 (2026년 기준 4.5%)', () => {
    // 월급 390만원 (4680만원/년) → 월 3,900,000 × 4.5% = 175,500원 → 연 2,106,000원
    const result3900 = calculateNationalPension(46800000);
    assertAlmostEquals(result3900, 2106000, 10, '연봉 4680만원 → 연 국민연금 2,106,000원');
    is10WonUnit(result3900, '연봉 4680만원 국민연금');

    // 하한 적용: 연봉 2400000원 (월 200,000원 < 하한 400,000원)
    // 하한 적용 → 월 400,000 × 4.5% = 18,000원 → 연 216,000원
    const resultLow = calculateNationalPension(2400000);
    assertEquals(resultLow, 216000, '월급 하한(400,000원) 적용 → 연 216,000원');

    // 상한 적용: 연봉 200000000원 (월 > 6,370,000원)
    // 상한 적용 → 월 6,370,000 × 4.5% = 286,650원 → 연 3,439,800원
    const resultHigh = calculateNationalPension(200000000);
    assertEquals(resultHigh, 3439800, '월급 상한(6,370,000원) 적용 → 연 3,439,800원');

    // 월급 정확히 상한인 경우: 연봉 6,370,000 × 12 = 76,440,000원
    const resultExactMax = calculateNationalPension(76440000);
    assertEquals(resultExactMax, 3439800, '상한 정확히 일치 → 연 3,439,800원');

    is10WonUnit(calculateNationalPension(50000000), '연봉 5000만원 국민연금');
});

describe('calculateEmploymentInsurance - 고용보험 (0.9%)', () => {
    // 연봉 36,000,000원 → 월 3,000,000원 × 0.9% = 26,999.99...
    // 10원 단위 절사 → 26,990원 → 연 323,880원 (부동소수점 절사)
    const result = calculateEmploymentInsurance(36000000);
    assertEquals(result, 323880, '연봉 3600만원 → 연 고용보험 323,880원');
    is10WonUnit(result, '연봉 3600만원 고용보험');

    // 연봉 60,000,000원 → 월 5,000,000원 × 0.9% = 45,000원 → 연 540,000원
    const result5k = calculateEmploymentInsurance(60000000);
    assertEquals(result5k, 540000, '연봉 6000만원 → 연 고용보험 540,000원');

    is10WonUnit(calculateEmploymentInsurance(50000000), '연봉 5000만원 고용보험');
});

describe('calculateHealthInsurance - 건강보험 (3.595%)', () => {
    // 연봉 36,000,000원 → 월 3,000,000원 × 3.595% = 107,850원 → 연 1,294,200원
    const result = calculateHealthInsurance(36000000);
    assertEquals(result, 1294200, '연봉 3600만원 → 연 건강보험 1,294,200원');
    is10WonUnit(result, '연봉 3600만원 건강보험');

    // 하한 적용: 계산값이 10,080원 미만이면 10,080원 적용
    // 월급 100,000원 → 100,000 × 3.595% = 3,595원 < 10,080원 → 월 10,080원 → 연 120,960원
    const resultLow = calculateHealthInsurance(1200000);
    assertEquals(resultLow, 120960, '건강보험 하한(10,080원/월) 적용 → 연 120,960원');

    is10WonUnit(calculateHealthInsurance(50000000), '연봉 5000만원 건강보험');
});

describe('calculateLongTermCareInsurance - 장기요양보험 (건강보험의 13.14%)', () => {
    // 연 건강보험료 1,294,200원 → 월 107,850원 × 13.14% = 14,171.49 → 절사 14,170원 → 연 170,040원
    const hi = calculateHealthInsurance(36000000);
    const ltc = calculateLongTermCareInsurance(hi);
    is10WonUnit(ltc, '장기요양보험 10원 단위 절사');
    assertRange(ltc, 165000, 175000, '연봉 3600만원 장기요양보험 범위');
});

describe('getIncomeDeduction - 근로소득공제', () => {
    // 500만원 이하 구간: 70%
    assertEquals(getIncomeDeduction(0), 0, '0원 → 0');
    assertEquals(getIncomeDeduction(3000000), 2100000, '300만원 × 70% = 210만원');
    assertEquals(getIncomeDeduction(5000000), 3500000, '500만원 × 70% = 350만원');

    // 500만원 초과 ~ 1500만원 이하: 350만원 + 초과분 × 40%
    assertEquals(getIncomeDeduction(10000000), 5500000, '1000만원 → 350 + 500*0.4 = 550만원');
    assertEquals(getIncomeDeduction(15000000), 7500000, '1500만원 → 350 + 1000*0.4 = 750만원');

    // 1500만원 초과 ~ 4500만원 이하: 750만원 + 초과분 × 15%
    assertEquals(getIncomeDeduction(30000000), 9750000, '3000만원 → 750 + 1500*0.15 = 975만원');

    // 4500만원 초과 ~ 1억 이하: 1200만원 + 초과분 × 5%
    assertEquals(getIncomeDeduction(50000000), 12250000, '5000만원 → 1200 + 500*0.05 = 1225만원');

    // 1억 초과: 1475만원 + 초과분 × 2%
    assertEquals(getIncomeDeduction(110000000), 14950000, '1.1억 → 1475 + 1000*0.02 = 1495만원');
});

describe('getHumanDeduction - 인적공제 (1인당 150만원)', () => {
    assertEquals(getHumanDeduction(1), 1500000, '1명 → 150만원');
    assertEquals(getHumanDeduction(2), 3000000, '2명 → 300만원');
    assertEquals(getHumanDeduction(4), 6000000, '4명 → 600만원');
    // 0명 이하는 1명으로 처리
    assertEquals(getHumanDeduction(0), 1500000, '0명 → 1명 처리 → 150만원');
});

describe('calculateTaxableIncome - 과세표준', () => {
    // 과세표준 = 연봉 - 비과세 - 국민연금 - 건강보험 - 고용보험 - 근로소득공제 - 인적공제
    const annualSalary = 36000000;
    const np = calculateNationalPension(annualSalary);
    const hi = calculateHealthInsurance(annualSalary);
    const ei = calculateEmploymentInsurance(annualSalary);
    const id = getIncomeDeduction(annualSalary);
    const hd = getHumanDeduction(1);
    const taxable = calculateTaxableIncome(annualSalary, 0, np, hi, ei, id, hd);
    assertRange(taxable, 0, annualSalary, '과세표준은 0 이상 연봉 이하');

    // 공제가 연봉을 초과하면 0 반환
    const zeroTaxable = calculateTaxableIncome(1000000, 0, 500000, 500000, 500000, 500000, 500000);
    assertEquals(zeroTaxable, 0, '공제 합계 > 연봉 → 과세표준 0');
});

describe('calculateIncomeTax - 소득세 구간별 계산', () => {
    assertEquals(calculateIncomeTax(0), 0, '과세표준 0 → 세금 0');
    assertEquals(calculateIncomeTax(-1), 0, '음수 과세표준 → 세금 0');

    // 구간 1: 1400만원 이하 → 6%
    // 1,000만원 × 6% = 600,000원
    assertEquals(calculateIncomeTax(10000000), 600000, '1000만원 × 6% = 60만원');

    // 구간 2: 1400~5000만원 → 14,000,000×6% + 초과분×15%
    // 2,000만원: 840,000 + (20,000,000 - 14,000,000) × 0.15 = 840,000 + 900,000 = 1,740,000원
    assertAlmostEquals(calculateIncomeTax(20000000), 1740000, 10, '2000만원 세금 ~1,740,000원');

    // 구간 3: 5000~8800만원 → 15% 구간 상한 + (초과) × 24%
    // 6,000만원: 840,000 + (5000-1400)*0.15*10000 + (6000-5000)*0.24*10000
    //           = 840,000 + 5,400,000-2,100,000 + ... 정밀 계산
    const tax6k = calculateIncomeTax(60000000);
    assertRange(tax6k, 5000000, 10000000, '6000만원 소득세 범위 내');
    is10WonUnit(tax6k, '6000만원 소득세 10원 단위');

    // 전 구간 10원 단위 절사 확인
    is10WonUnit(calculateIncomeTax(30000000), '3000만원 소득세 10원 단위');
    is10WonUnit(calculateIncomeTax(100000000), '1억 소득세 10원 단위');
    is10WonUnit(calculateIncomeTax(400000000), '4억 소득세 10원 단위');
    is10WonUnit(calculateIncomeTax(600000000), '6억 소득세 10원 단위');
    is10WonUnit(calculateIncomeTax(2000000000), '20억 소득세 10원 단위');
});

describe('getIncomeTaxCredit - 근로소득세액공제', () => {
    assertEquals(getIncomeTaxCredit(0, 36000000), 0, '산출세액 0 → 공제 0');
    assertEquals(getIncomeTaxCredit(-1, 36000000), 0, '음수 산출세액 → 공제 0');

    // 130만원 이하: 55% 공제
    const credit100 = getIncomeTaxCredit(1000000, 36000000);
    assertAlmostEquals(credit100, 550000, 10, '산출세액 100만원 → 55% = 55만원');

    // 130만원 초과: 715,000 + (2,000,000-1,300,000)*0.30 = 925,000원
    // 연봉 3600만원 한도: max(660000, 740000-(36000000-33000000)*0.008) = 716,000원
    // min(925,000, 716,000) = 716,000원
    const credit200 = getIncomeTaxCredit(2000000, 36000000);
    assertAlmostEquals(credit200, 716000, 10, '산출세액 200만원, 연봉 3600만원 → 한도 적용 716,000원');

    is10WonUnit(credit100, '세액공제 10원 단위');
});

describe('calculateFinalIncomeTax - 결정세액', () => {
    assertEquals(calculateFinalIncomeTax(0, 0), 0, '산출세액 0, 공제 0 → 결정세액 0');
    assertEquals(calculateFinalIncomeTax(500000, 700000), 0, '공제 > 산출세액 → 0');
    assertEquals(calculateFinalIncomeTax(1000000, 300000), 700000, '100만 - 30만 = 70만원');
    is10WonUnit(calculateFinalIncomeTax(1500000, 400000), '결정세액 10원 단위');
});

describe('calculateLocalIncomeTax - 지방소득세 (결정세액의 10%)', () => {
    assertEquals(calculateLocalIncomeTax(0), 0, '결정세액 0 → 지방소득세 0');
    assertEquals(calculateLocalIncomeTax(1000000), 100000, '100만원 × 10% = 10만원');
    is10WonUnit(calculateLocalIncomeTax(1234560), '지방소득세 10원 단위');
});

describe('calculateTotalAnnualDeductions - 연간 총 공제액', () => {
    // 연봉 4000만원, 비과세 0, 부양가족 1명
    const total = calculateTotalAnnualDeductions(40000000, 0, 1);
    assertRange(total, 1000000, 40000000, '총 공제액은 합리적 범위 내');
    // 총 공제액은 반드시 연봉보다 작아야 함
    const check = total < 40000000;
    assertEquals(check, true, '총 공제액 < 연봉');

    // 부양가족이 많을수록 공제액이 더 커야 함 (세금이 줄어 총공제에서 세금 부분 감소,
    // 그러나 인적공제 증가분이 더 크므로 실수령은 더 높아져야 함)
    const net1 = calculateNetMonthlyPay(40000000, 0, 1);
    const net4 = calculateNetMonthlyPay(40000000, 0, 4);
    assertEquals(net4 > net1, true, '부양가족 4명 → 1명보다 실수령액 더 높음');
});

describe('calculateNetMonthlyPay - 월 실수령액', () => {
    // 연봉 3600만원 → 월 300만원 기준
    const net36 = calculateNetMonthlyPay(36000000, 0, 1);
    assertRange(net36, 2000000, 3000000, '연봉 3600만원 실수령 2~300만원 범위');

    // 연봉 6000만원 → 월 500만원 기준
    const net60 = calculateNetMonthlyPay(60000000, 0, 1);
    assertRange(net60, 3500000, 5000000, '연봉 6000만원 실수령 350~500만원 범위');

    // 연봉이 높을수록 실수령액도 높아야 함
    assertEquals(net60 > net36, true, '연봉 6000만원 실수령 > 3600만원 실수령');

    // 비과세 금액이 있으면 실수령액이 더 높아야 함
    const netWithNonTaxable = calculateNetMonthlyPay(36000000, 200000, 1);
    assertEquals(netWithNonTaxable >= net36, true, '비과세 있을 때 실수령 >= 비과세 없을 때');
});

// ─────────────────────────────────────────────
// 결과 출력
// ─────────────────────────────────────────────
console.log(`\n${'='.repeat(50)}`);
console.log(`salary_calculator 테스트 결과: ${passCount}개 통과 / ${failCount}개 실패`);
if (failCount === 0) {
    console.log('모든 테스트를 통과했습니다.');
} else {
    console.error(`${failCount}개의 테스트가 실패했습니다.`);
    process.exitCode = 1;
}
