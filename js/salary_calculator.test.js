// salary_calculator.test.js

const testResultsDiv = document.getElementById('test-results');
let testsPassed = 0;
let testsFailed = 0;

function logTestResult(description, passed, actual, expected) {
    const testCaseDiv = document.createElement('div');
    testCaseDiv.classList.add('test-case');
    if (passed) {
        testCaseDiv.classList.add('pass');
        testCaseDiv.textContent = `PASS: ${description}`;
        testsPassed++;
    } else {
        testCaseDiv.classList.add('fail');
        let message = `FAIL: ${description}\n`;
        message += `  Expected: ${expected}\n`;
        message += `  Actual:   ${actual}`;
        const pre = document.createElement('pre');
        pre.textContent = message;
        testCaseDiv.appendChild(pre);
        testsFailed++;
    }
    testResultsDiv.appendChild(testCaseDiv);
}

function assertEquals(actual, expected, description) {
    if (actual === expected) {
        logTestResult(description, true);
    } else {
        logTestResult(description, false, actual, expected);
    }
}

function assertAlmostEquals(actual, expected, description, tolerance = 0.01) {
    if (Math.abs(actual - expected) < tolerance) {
        logTestResult(description, true);
    } else {
        logTestResult(description, false, actual, expected);
    }
}

// --- 국민연금 (2023년 기준: 4.5%, 월 상한액 590만원 -> 개인부담 265,500원, 월 하한액 37만원 -> 개인부담 16,650원) ---
console.log('국민연금 테스트 시작...');
// Test case 1: 기본 계산
assertEquals(calculateNationalPension(30000000), 112500 * 12, '국민연금: 연봉 3000만원'); // 30,000,000 * 0.045 = 1,350,000 / 12 = 112,500

// Test case 2: 월 소득 하한액 미만 (연봉 444만원 미만 -> 37만원 * 12 = 4,440,000)
// (370,000 * 0.045 = 16,650)
assertEquals(calculateNationalPension(4000000), 16650 * 12, '국민연금: 연봉 400만원 (하한액 적용)');
assertEquals(calculateNationalPension(4440000), 16650 * 12, '국민연금: 연봉 444만원 (하한액 경계)');


// Test case 3: 월 소득 상한액 초과 (연봉 7080만원 초과 -> 5,900,000 * 12 = 70,800,000)
// (5,900,000 * 0.045 = 265,500)
assertEquals(calculateNationalPension(80000000), 265500 * 12, '국민연금: 연봉 8000만원 (상한액 적용)');
assertEquals(calculateNationalPension(70800000), 265500 * 12, '국민연금: 연봉 7080만원 (상한액 경계)');

// Test case 4: 중간값
assertEquals(calculateNationalPension(50000000), 187500 * 12, '국민연금: 연봉 5000만원'); // 50,000,000 * 0.045 = 2,250,000 / 12 = 187,500


// --- 고용보험 (2023년 기준: 0.9%) ---
console.log('고용보험 테스트 시작...');
// Test case 1: 기본 계산
assertAlmostEquals(calculateEmploymentInsurance(30000000), 22500 * 12, '고용보험: 연봉 3000만원'); // 30,000,000 * 0.009 = 270,000 / 12 = 22,500
assertAlmostEquals(calculateEmploymentInsurance(50000000), 37500 * 12, '고용보험: 연봉 5000만원'); // 50,000,000 * 0.009 = 450,000 / 12 = 37,500
assertAlmostEquals(calculateEmploymentInsurance(80000000), 60000 * 12, '고용보험: 연봉 8000만원'); // 80,000,000 * 0.009 = 720,000 / 12 = 60,000
// 고용보험은 상한액이 있지만, 보통 사업장 규모별로 요율이 달라지므로 개인 실업급여분은 일반적으로 연봉에 0.9%를 곱함. (별도 상하한액 개인적용은 일반적이지 않음)


// --- 건강보험 (2023년 기준: 근로자 3.545%) ---
// 월 보수월액 상한액에 따른 보험료 상한: 3,911,280원 (월) (보수월액 110,330,000원 기준)
// 월 보수월액 하한액에 따른 보험료 하한: 9,890원 (월) (보수월액 279,256원 기준)
console.log('건강보험 테스트 시작...');
// Test case 1: 기본 계산
// 연봉 50,000,000원 -> 월 보수액 4,166,666원
// 월 건강보험료: 4,166,666 * 0.03545 = 147,708.31원 -> 147,700원 (10원 단위 절사)
assertEquals(calculateHealthInsurance(50000000), 147700 * 12, '건강보험: 연봉 5000만원');

// Test case 2: 월 소득 상한액 초과
// 연봉 150,000,000원 -> 월 보수액 12,500,000원. 이는 건강보험료 상한(근로자 부담 3,911,280원) 해당 보수월액(110,330,000원)을 초과.
// 따라서 월 건강보험료는 3,911,280원 (이론상. 실제로는 국민건강보험공단이 고지하는 보험료 상한액을 따름. 여기서는 계산된 상한액 사용)
// 2023년 실제 월별 보험료 상한액(본인부담): 3,911,280원 (총 보험료 7,822,560원)
assertEquals(calculateHealthInsurance(150000000), 3911280 * 12, '건강보험: 연봉 1억 5천만원 (상한액 적용)');

// Test case 3: 월 소득 하한액 미만
// 연봉 3,000,000원 -> 월 보수액 250,000원. 이는 건강보험료 하한(근로자 부담 9,890원) 해당 보수월액(279,256원) 미만.
// 따라서 월 건강보험료는 9,890원
assertEquals(calculateHealthInsurance(3000000), 9890 * 12, '건강보험: 연봉 300만원 (하한액 적용)');
assertEquals(calculateHealthInsurance(3351072), 9890 * 12, '건강보험: 연봉 3,351,072원 (하한액 경계 근처)'); // 279256 * 12

// Test case 4: 중간값
// 연봉 70,000,000원 -> 월 보수액 5,833,333원
// 월 건강보험료: 5,833,333 * 0.03545 = 206,791.65원 -> 206,790원
assertEquals(calculateHealthInsurance(70000000), 206790 * 12, '건강보험: 연봉 7000만원');


// --- 장기요양보험 (2023년 기준: 건강보험료의 12.81%) ---
console.log('장기요양보험 테스트 시작...');
// Test case 1: 기본 계산
// 월 건강보험료 147,700원 (연봉 5000만원 기준)
// 월 장기요양보험료: 147,700 * 0.1281 = 18,920.37원 -> 18,920원
assertEquals(calculateLongTermCareInsurance(147700 * 12), 18920 * 12, '장기요양보험: 연봉 5000만원 기준 건강보험료');

// Test case 2: 건강보험료 상한액 기준
// 월 건강보험료 3,911,280원
// 월 장기요양보험료: 3,911,280 * 0.1281 = 501,035.968원 -> 501,030원
assertEquals(calculateLongTermCareInsurance(3911280 * 12), 501030 * 12, '장기요양보험: 건강보험료 상한액 기준');

// Test case 3: 건강보험료 하한액 기준
// 월 건강보험료 9,890원
// 월 장기요양보험료: 9,890 * 0.1281 = 1,266.909원 -> 1,260원
// 월 장기요양보험료: 9,890 * 0.1281 = 1,266.909원 -> 1,260원
assertEquals(calculateLongTermCareInsurance(9890 * 12), 1260 * 12, '장기요양보험: 건강보험료 하한액 기준');

// (기존 4대 보험 테스트 코드 아래에 추가/수정)
console.log('소득세 계산 로직 테스트 시작 (2023년 귀속 기준 적용)...');

// --- 근로소득공제 테스트 (2023년 기준) ---
assertEquals(getIncomeDeduction(3000000), 2100000, '근로소득공제(2023): 연봉 300만원'); // 300만 * 0.7
assertEquals(getIncomeDeduction(10000000), 3500000 + 5000000 * 0.4, '근로소득공제(2023): 연봉 1000만원'); // 350만 + 200만 = 550만
assertEquals(getIncomeDeduction(30000000), 7500000 + (30000000 - 15000000) * 0.15, '근로소득공제(2023): 연봉 3000만원'); // 750만 + 1500만*0.15 = 750만 + 225만 = 975만
assertEquals(getIncomeDeduction(60000000), 12000000 + (60000000 - 45000000) * 0.05, '근로소득공제(2023): 연봉 6000만원'); // 1200만 + 1500만*0.05 = 1200만 + 75만 = 1275만
assertEquals(getIncomeDeduction(120000000), 14750000 + (120000000 - 100000000) * 0.02, '근로소득공제(2023): 연봉 1억2천만원'); // 1475만 + 2000만*0.02 = 1475만 + 40만 = 1515만

// --- 인적공제 테스트 (변경 없음) ---
assertEquals(getHumanDeduction(1), 1500000, '인적공제: 1명');
assertEquals(getHumanDeduction(3), 4500000, '인적공제: 3명');

// --- 과세표준, 소득세, 세액공제, 최종세액, 지방소득세 테스트 (연봉 5000만원, 비과세 240만원(월20), 부양가족 1명) ---
const annualSalary_5000 = 50000000;
const nonTaxable_240 = 2400000; // 월 20만원 식대 가정
const dependents_1 = 1;

const np_5000 = calculateNationalPension(annualSalary_5000); // 2,250,000 (월 187,500)
const hi_5000 = calculateHealthInsurance(annualSalary_5000); // 1,772,400 (월 147,700)
const ei_5000 = calculateEmploymentInsurance(annualSalary_5000); // 450,000 (월 37,500)

const incomeDeduction_5000 = getIncomeDeduction(annualSalary_5000); // 12,750,000 (연봉6천만 예시와 다름, 5000만 기준: 1200만 + 500만*0.05 = 1225만)
// 수정된 getIncomeDeduction(50000000) = 12000000 + (50000000 - 45000000) * 0.05 = 12000000 + 250000 = 12250000
assertEquals(incomeDeduction_5000, 12250000, '근로소득공제(2023): 연봉 5000만원 확인');

const humanDeduction_1 = getHumanDeduction(dependents_1); // 1,500,000

const taxableIncome_5000 = calculateTaxableIncome(annualSalary_5000, nonTaxable_240, np_5000, hi_5000, ei_5000, incomeDeduction_5000, humanDeduction_1);
// 50000000 - 2400000 - 2250000 - 1772400 - 450000 - 12250000 - 1500000 = 29377600
assertEquals(taxableIncome_5000, 29377600, '과세표준(2023): 연봉 5000만원, 비과세240, 1명');

const calculatedTax_5000 = calculateIncomeTax(taxableIncome_5000);
// (1400만 * 0.06) + (29377600 - 1400만) * 0.15 = 840000 + (15377600 * 0.15) = 840000 + 2306640 = 3146640
assertEquals(calculatedTax_5000, 3146640, '소득세 산출(2023): 과세표준 29,377,600원');

const taxCredit_5000 = getIncomeTaxCredit(calculatedTax_5000, annualSalary_5000);
// 산출세액 3,146,640원. 연봉 5천만원 (3300 초과 7000 이하)
// 한도: Max(660000, 740000 - (50000000 - 33000000) * 0.008) = Max(660000, 740000 - 17000000 * 0.008) = Max(660000, 740000 - 136000) = Max(660000, 604000) = 604000
// 공제액: 715000 + (3146640 - 1300000) * 0.30 = 715000 + 1846640 * 0.30 = 715000 + 553992 = 1268992
// 적용 공제액: Min(1268992, 604000) = 604000. 10원단위 절사 -> 604000
assertEquals(taxCredit_5000, 604000, '근로소득세액공제(2023): 산출세액 3,146,640원, 연봉 5000만원');

const finalIncomeTax_5000 = calculateFinalIncomeTax(calculatedTax_5000, taxCredit_5000); // 3146640 - 604000 = 2542640
assertEquals(finalIncomeTax_5000, 2542640, '최종 결정세액(2023)');

const localIncomeTax_5000 = calculateLocalIncomeTax(finalIncomeTax_5000); // 2542640 * 0.1 = 254264 -> 254260
assertEquals(localIncomeTax_5000, 254260, '지방소득세(2023)');

// (테스트 실행기 및 최종 결과 표시 코드는 salary_calculator.test.js 에 이미 존재)
// --- 최종 결과 표시 ---
const summaryDiv = document.createElement('div');
summaryDiv.style.marginTop = '20px';
summaryDiv.style.paddingTop = '10px';
summaryDiv.style.borderTop = '1px solid black';
summaryDiv.innerHTML = `<strong>테스트 완료: 총 ${testsPassed + testsFailed}개 중 ${testsPassed}개 성공, ${testsFailed}개 실패</strong>`;
testResultsDiv.appendChild(summaryDiv);

if (testsFailed > 0) {
    console.error(`${testsFailed}개의 테스트 실패.`);
} else {
    console.log('모든 테스트 성공!');
}
