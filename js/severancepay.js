/**
 * 퇴직금 계산기 모듈
 * 근로자퇴직급여 보장법 제8조 기준 (고용노동부 퇴직금 계산기 산식과 동일)
 *   1일 평균임금 = (3개월 임금총액 + 연간상여금 × 3/12 + 연차수당 × 3/12) ÷ 3개월 총일수
 *   퇴직금 = 1일 평균임금 × 30 × (총 재직일수 / 365)
 */

// 퇴직 전 3개월의 총 역일수 근사치 (실제로는 89~92일, 월 30.4일 기준)
const SV_THREE_MONTH_DAYS = 30.4 * 3;

function initializeSeverancePay() {
    const moneyInputs = ['sv_monthly_salary', 'sv_annual_bonus', 'sv_annual_leave_pay'];
    if (!document.getElementById(moneyInputs[0])) return;

    // 천단위 콤마 자동 포맷
    moneyInputs.forEach(id => {
        const input = document.getElementById(id);
        if (!input) return;
        input.addEventListener('input', function() {
            const raw = this.value.replace(/[^0-9]/g, '');
            const cursor = this.selectionStart;
            const prevLen = this.value.length;
            this.value = raw ? Number(raw).toLocaleString() : '';
            const diff = this.value.length - prevLen;
            this.setSelectionRange(cursor + diff, cursor + diff);
        });
    });
}

// 콤마가 포함된 금액 입력값을 숫자로 변환
function parseSeveranceAmount(id) {
    const el = document.getElementById(id);
    if (!el) return 0;
    return parseFloat(el.value.replace(/,/g, '')) || 0;
}

function calculateSeverance() {
    const years           = parseInt(document.getElementById('sv_years').value)  || 0;
    const months          = parseInt(document.getElementById('sv_months').value) || 0;
    const days            = parseInt(document.getElementById('sv_days').value)   || 0;
    const monthlySalary   = parseSeveranceAmount('sv_monthly_salary');
    const annualBonus     = parseSeveranceAmount('sv_annual_bonus');
    const annualLeavePay  = parseSeveranceAmount('sv_annual_leave_pay');

    const totalDays = Math.round(years * 365 + months * 30.44 + days);

    if (totalDays < 365) {
        alert('계속근로기간이 1년 미만이면 퇴직금이 발생하지 않습니다.');
        return;
    }
    if (monthlySalary <= 0) {
        alert('월 평균임금을 입력해주세요.');
        return;
    }

    // 1일 평균임금 = (3개월 임금총액 + 연간상여금 × 3/12 + 연차수당 × 3/12) ÷ 3개월 총일수
    const wageThreeMonths = monthlySalary * 3;          // A. 3개월 임금총액
    const bonusAddition   = annualBonus * 3 / 12;       // B. 상여금 가산액
    const leavePayAddition = annualLeavePay * 3 / 12;   // C. 연차수당 가산액
    const extraAddition   = bonusAddition + leavePayAddition;
    const dailyWage = (wageThreeMonths + extraAddition) / SV_THREE_MONTH_DAYS;

    // 퇴직금 = 1일 평균임금 × 30 × (총 재직일수 / 365)
    const severance = Math.floor(dailyWage * 30 * (totalDays / 365));

    const card = document.getElementById('sv_result_card');
    card.classList.remove('d-none');

    const periodParts = [];
    if (years > 0)  periodParts.push(`${years}년`);
    if (months > 0) periodParts.push(`${months}개월`);
    if (days > 0)   periodParts.push(`${days}일`);

    document.getElementById('sv_result_amount').textContent = severance.toLocaleString() + '원';
    document.getElementById('sv_result_period').textContent = '근무기간: ' + (periodParts.join(' ') || '0일');
    document.getElementById('sv_total_days').textContent    = totalDays.toLocaleString() + '일';
    document.getElementById('sv_daily_wage').textContent    = Math.round(dailyWage).toLocaleString() + '원';
    document.getElementById('sv_monthly_display').textContent = monthlySalary.toLocaleString() + '원';

    // 캐시된 구버전 HTML에는 존재하지 않는 항목이므로 방어적으로 접근
    const extraDisplay = document.getElementById('sv_extra_display');
    if (extraDisplay) extraDisplay.textContent = Math.round(extraAddition).toLocaleString() + '원';
    document.getElementById('sv_formula').textContent       = `${Math.round(dailyWage).toLocaleString()} × 30 × ${(totalDays / 365).toFixed(2)}`;

    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function resetSeverance() {
    ['sv_years', 'sv_months', 'sv_days', 'sv_monthly_salary', 'sv_annual_bonus', 'sv_annual_leave_pay'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    document.getElementById('sv_result_card').classList.add('d-none');
}
