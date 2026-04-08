/**
 * 퇴직금 계산기 모듈
 * 근로기준법 기준: 퇴직금 = 1일 평균임금 × 30 × (총 재직일수 / 365)
 */

function initializeSeverancePay() {
    const salaryInput = document.getElementById('sv_monthly_salary');
    if (!salaryInput) return;

    // 천단위 콤마 자동 포맷
    salaryInput.addEventListener('input', function() {
        const raw = this.value.replace(/[^0-9]/g, '');
        const cursor = this.selectionStart;
        const prevLen = this.value.length;
        this.value = raw ? Number(raw).toLocaleString() : '';
        const diff = this.value.length - prevLen;
        this.setSelectionRange(cursor + diff, cursor + diff);
    });
}

function calculateSeverance() {
    const years        = parseInt(document.getElementById('sv_years').value)  || 0;
    const months       = parseInt(document.getElementById('sv_months').value) || 0;
    const days         = parseInt(document.getElementById('sv_days').value)   || 0;
    const salaryRaw    = document.getElementById('sv_monthly_salary').value.replace(/,/g, '');
    const monthlySalary = parseFloat(salaryRaw) || 0;

    const totalDays = Math.round(years * 365 + months * 30.44 + days);

    if (totalDays < 365) {
        alert('계속근로기간이 1년 미만이면 퇴직금이 발생하지 않습니다.');
        return;
    }
    if (monthlySalary <= 0) {
        alert('월 평균임금을 입력해주세요.');
        return;
    }

    // 1일 평균임금 = 월평균임금 / 30.4
    const dailyWage = monthlySalary / 30.4;

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
    document.getElementById('sv_formula').textContent       = `${Math.round(dailyWage).toLocaleString()} × 30 × ${(totalDays / 365).toFixed(2)}`;

    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function resetSeverance() {
    ['sv_years', 'sv_months', 'sv_days', 'sv_monthly_salary'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    document.getElementById('sv_result_card').classList.add('d-none');
}
