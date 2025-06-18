(function() {
    'use strict';

    // --- Test Runner Setup ---
    const testResults = [];
    let testsRun = 0;
    let testsPassed = 0;
    let currentTestName = "";

    function runTest(description, testFn) {
        currentTestName = description;
        testsRun++;
        try {
            testFn();
            testResults.push({ description, status: 'PASSED' });
            testsPassed++;
        } catch (e) {
            testResults.push({ description, status: 'FAILED', error: e.toString(), stack: e.stack });
        }
        currentTestName = "";
    }

    function displayResults() {
        console.log(`\n--- Salary Calculator Test Results ---`);
        console.log(`Total tests: ${testsRun}, Passed: ${testsPassed}, Failed: ${testsRun - testsPassed}`);
        testResults.forEach(result => {
            if (result.status === 'PASSED') {
                console.log(`✅ PASSED: ${result.description}`);
            } else {
                console.error(`❌ FAILED: ${result.description}`);
                console.error(`   Error: ${result.error}`);
            }
        });
        console.log("--- End Salary Calculator Test Results ---\n");
        // Optional: Display in HTML
        if (typeof document !== 'undefined' && document.getElementById) {
            const resultsContainer = document.getElementById('test-results-salary-calculator');
            if (resultsContainer) {
                let html = `<h3>Salary Calculator Test Results</h3><p>Total: ${testsRun}, Passed: ${testsPassed}, Failed: ${testsRun - testsPassed}</p><ul>`;
                testResults.forEach(result => {
                    html += `<li style="color: ${result.status === 'PASSED' ? 'green' : 'red'};"><strong>${result.status}:</strong> ${result.description}${result.error ? `<br><pre>${result.error}</pre>` : ''}</li>`;
                });
                html += "</ul>";
                resultsContainer.innerHTML = html;
            }
        }
    }

    function assertEqual(actual, expected, message, tolerance = 0.5) { // Using 0.5 for rounding issues with 10s
        if (typeof actual === 'number' && typeof expected === 'number') {
            if (Math.abs(actual - expected) > tolerance) {
                throw new Error(message || `Expected ${expected} (approx.), but got ${actual}`);
            }
        } else if (actual !== expected) {
            throw new Error(message || `Expected ${expected}, but got ${actual}`);
        }
    }

    function assert(condition, message) {
        if (!condition) {
            throw new Error(message || "Assertion failed in test: " + currentTestName);
        }
    }

    // --- Load Calculator Logic ---
    let salaryLogic;
    let testConfig;

    if (typeof createSalaryCalculatorLogic === 'function') { // Browser context
        testConfig = typeof SALARY_CALC_CONFIG !== 'undefined' ? SALARY_CALC_CONFIG : {};
        salaryLogic = createSalaryCalculatorLogic(testConfig);
    } else if (typeof require !== 'undefined') { // Node.js context
        const salaryModule = require('../js/salary_calculator.js');
        testConfig = salaryModule.SALARY_CALC_CONFIG;
        salaryLogic = salaryModule.createSalaryCalculatorLogic(testConfig);
    } else {
        console.error("Cannot load createSalaryCalculatorLogic. Tests will not run.");
        return;
    }

    if (!salaryLogic || !testConfig) {
        console.error("Salary calculator logic or config not loaded. Tests will not run.");
        return;
    }

    // --- Test Cases ---

    const annualSalary1 = 30000000; // 30백만원
    const annualSalary2 = 50000000; // 50백만원
    const annualSalary3 = 70000000; // 70백만원
    const annualSalary4 = 100000000; // 1억원

    runTest("National Pension: calculateNationalPension", () => {
        // Test with 30M annual salary: 30M/12 = 2.5M monthly.
        // Min: 370k, Max: 5.9M (for 2023 config)
        // 2.5M * 0.045 = 112500 monthly. Annual = 112500 * 12 = 1350000
        assertEqual(salaryLogic.calculateNationalPension(annualSalary1), 1350000, "NP for 30M");
        // Test with salary below min (e.g., 3M annual = 250k monthly)
        // Basis = 370k. 370k * 0.045 * 12 = 199800
        assertEqual(salaryLogic.calculateNationalPension(3000000), 199800, "NP for 3M (below min)");
        // Test with salary above max (e.g., 80M annual = 6.66M monthly)
        // Basis = 5.9M. 5.9M * 0.045 * 12 = 3186000
        assertEqual(salaryLogic.calculateNationalPension(80000000), 3186000, "NP for 80M (above max)");
    });

    runTest("Employment Insurance: calculateEmploymentInsurance", () => {
        // 30M * 0.009 = 270000
        assertEqual(salaryLogic.calculateEmploymentInsurance(annualSalary1), 270000, "EI for 30M");
        // 50M * 0.009 = 450000
        assertEqual(salaryLogic.calculateEmploymentInsurance(annualSalary2), 450000, "EI for 50M");
    });

    runTest("Health Insurance: calculateHealthInsurance", () => {
        // 30M/12 = 2.5M. 2.5M * 0.03545 = 88625 monthly. Annual = 1063500
        assertEqual(salaryLogic.calculateHealthInsurance(annualSalary1), 1063500, "HI for 30M");
        // Test min premium: Salary 200k/month = 2.4M/year. 200k * 0.03545 = 7090. Min is 9890. Annual = 118680
        assertEqual(salaryLogic.calculateHealthInsurance(2400000), 118680, "HI for 2.4M (min premium)");
    });

    runTest("Long-Term Care Insurance: calculateLongTermCareInsurance", () => {
        const healthIns1 = salaryLogic.calculateHealthInsurance(annualSalary1); // 1063500
        // 1063500 * 0.1281 = 136234.35. Monthly = 11352.86. Floor(11352.86/10)*10 = 11350. Annual = 136200
        assertEqual(salaryLogic.calculateLongTermCareInsurance(healthIns1), 136200, "LTC for 30M's HI");
    });

    runTest("Income Deduction: getIncomeDeduction", () => {
        // 30M: 7.5M + (30M - 15M) * 0.15 = 7.5M + 15M * 0.15 = 7.5M + 2.25M = 9.75M
        assertEqual(salaryLogic.getIncomeDeduction(annualSalary1), 9750000, "Income Deduction for 30M");
        // 5M: 5M * 0.7 = 3.5M
        assertEqual(salaryLogic.getIncomeDeduction(5000000), 3500000, "Income Deduction for 5M");
        // 100M: 12M + (100M - 45M) * 0.05 = 12M + 55M*0.05 = 12M + 2.75M = 14.75M
        assertEqual(salaryLogic.getIncomeDeduction(annualSalary4), 14750000, "Income Deduction for 100M");
    });

    runTest("Human Deduction: getHumanDeduction", () => {
        assertEqual(salaryLogic.getHumanDeduction(1), 1500000, "Human Deduction for 1 person");
        assertEqual(salaryLogic.getHumanDeduction(3), 4500000, "Human Deduction for 3 people");
    });

    runTest("Taxable Income: calculateTaxableIncome (example values)", () => {
        // Simplified test, as individual components are tested above
        // For 30M annual, 0 non-taxable, 1 dependent
        const nonTaxable = 0;
        const dependents = 1;
        const np = salaryLogic.calculateNationalPension(annualSalary1); // 1350000
        const hi = salaryLogic.calculateHealthInsurance(annualSalary1); // 1063500
        const ei = salaryLogic.calculateEmploymentInsurance(annualSalary1); // 270000
        const incomeDed = salaryLogic.getIncomeDeduction(annualSalary1 - nonTaxable); // 9750000
        const humanDed = salaryLogic.getHumanDeduction(dependents); // 1500000
        // Total deductions from salary for tax base:
        // NP + HI + EI + IncomeDed + HumanDed (assuming HI/EI are also part of 소득공제 for 과세표준 in this model)
        // 1350000 + 1063500 + 270000 + 9750000 + 1500000 = 13933500
        // Taxable Income = 30000000 - 13933500 = 16066500
        const taxable = salaryLogic.calculateTaxableIncome(annualSalary1, nonTaxable, np, hi, ei, incomeDed, humanDed);
        assertEqual(taxable, 16066500, "Taxable Income for 30M, 1 dep, 0 non-taxable");
    });

    runTest("Income Tax (Calculated Tax): calculateIncomeTax (산출세액)", () => {
        // Taxable income 16,066,500 falls in 14M-50M bracket (15% rate)
        // (14M * 0.06) + (16066500 - 14M) * 0.15 = 840000 + (2066500 * 0.15) = 840000 + 309975 = 1149975
        // Floor to 10s: 1149970
        assertEqual(salaryLogic.calculateIncomeTax(16066500), 1149970, "Calculated Tax for taxable 16,066,500");
        // Taxable income 0
        assertEqual(salaryLogic.calculateIncomeTax(0), 0, "Calculated Tax for taxable 0");
        // Taxable income just in first bracket (e.g. 10M)
        // 10M * 0.06 = 600000
        assertEqual(salaryLogic.calculateIncomeTax(10000000), 600000, "Calculated Tax for taxable 10M");
    });

    runTest("Income Tax Credit: getIncomeTaxCredit", () => {
        // Calculated tax 1,149,970 (which is <= 1.3M)
        // Credit = 1149970 * 0.55 = 632483.5 -> 632480
        // Annual gross salary for limit check (30M - 0 non-taxable = 30M)
        // Limit for 30M salary = 740000
        // Min(632480, 740000) = 632480
        assertEqual(salaryLogic.getIncomeTaxCredit(1149970, annualSalary1 - 0), 632480, "Tax Credit for tax 1,149,970 and salary 30M");

        // Calculated tax > 1.3M. E.g. 2,000,000. Salary 50M.
        // Credit = 715000 + (2000000 - 1300000) * 0.30 = 715000 + 700000 * 0.30 = 715000 + 210000 = 925000
        // Limit for 50M salary: max(660k, 740k - (50M-33M)*0.008) = max(660k, 740k - 17M*0.008) = max(660k, 740k - 136k) = max(660k, 604k) = 660k
        // Min(925000, 660000) = 660000
        assertEqual(salaryLogic.getIncomeTaxCredit(2000000, annualSalary2 - 0), 660000, "Tax Credit for tax 2M and salary 50M");
    });

    runTest("Final Income Tax: calculateFinalIncomeTax", () => {
        // Calculated Tax 1149970, Credit 632480
        // Final = 1149970 - 632480 = 517490
        assertEqual(salaryLogic.calculateFinalIncomeTax(1149970, 632480), 517490, "Final Tax (1149970 - 632480)");
        // If credit > tax
        assertEqual(salaryLogic.calculateFinalIncomeTax(500000, 600000), 0, "Final Tax (credit > tax)");
    });

    runTest("Local Income Tax: calculateLocalIncomeTax", () => {
        // Final tax 517490. Local = 517490 * 0.1 = 51749 -> 51740
        assertEqual(salaryLogic.calculateLocalIncomeTax(517490), 51740, "Local Tax for 517490");
    });

    runTest("Net Monthly Pay: calculateNetMonthlyPay (30M annual, 0 non-tax, 1 dep)", () => {
        // From previous tests for 30M, 1 dep, 0 non-tax:
        // NP = 1350000
        // HI = 1063500
        // LTC = 136200 (based on HI 1063500)
        // EI = 270000
        // Final Income Tax = 517490
        // Local Income Tax = 51740
        // Total Annual Deductions = 1350000+1063500+136200+270000+517490+51740 = 3388930
        // Net Annual Pay = 30000000 - 3388930 = 26611070
        // Net Monthly Pay = round(26611070 / 12) = round(2217589.166) = 2217589
        assertEqual(salaryLogic.calculateNetMonthlyPay(annualSalary1, 0, 1), 2217589, "Net monthly for 30M, 0 non-tax, 1 dep");
    });

    runTest("Net Monthly Pay: calculateNetMonthlyPay (50M annual, 200k non-tax monthly, 2 dep)", () => {
        const salary = 50000000;
        const nonTaxMonthly = 200000; // 2.4M non-tax annual
        const dependents = 2;
        const nonTaxAnnual = nonTaxMonthly * 12; // 2400000

        const np = salaryLogic.calculateNationalPension(salary); // 50M/12 = 4.16M. 4.16M*0.045*12 = 2250000
        const hi = salaryLogic.calculateHealthInsurance(salary); // 50M/12 = 4.16M. 4.16M*0.03545*12 = 1772400
        const ltc = salaryLogic.calculateLongTermCareInsurance(hi); // 1772400 * 0.1281 / 12 (month) -> floor_10 * 12 = 226920 (approx)
                                                                 // 1772400 * 0.1281 = 227044.44 -> 227040 (Annual, 10s floored)
        const ei = salaryLogic.calculateEmploymentInsurance(salary); // 50M * 0.009 = 450000

        const grossTaxableSalary = salary - nonTaxAnnual; // 50M - 2.4M = 47.6M
        const incomeDed = salaryLogic.getIncomeDeduction(grossTaxableSalary);
            // 47.6M: 12M + (47.6M - 45M)*0.05 = 12M + 2.6M*0.05 = 12M + 130000 = 12130000
        const humanDed = salaryLogic.getHumanDeduction(dependents); // 2 * 1.5M = 3000000

        const taxableIncome = salaryLogic.calculateTaxableIncome(salary, nonTaxAnnual, np, hi, ei, incomeDed, humanDed);
            // 50M - (2.4M + 2.25M + 1.7724M + 0.22704M + 0.45M + 12.13M + 3M)
            // = 50M - (2.4 + 2.25 + 1.7724 + 0.22704 + 0.45 + 12.13 + 3)M = 50M - 22.22944M = 27.77056M
        assertEqual(taxableIncome, 27770560, "Taxable Income for 50M, 2.4M non-tax, 2 dep");

        const calculatedTax = salaryLogic.calculateIncomeTax(taxableIncome); // 27.77M
            // (14M * 0.06) + (27.77056M - 14M) * 0.15 = 840000 + 13.77056M * 0.15 = 840000 + 2065584 = 2905584 -> 2905580
        assertEqual(calculatedTax, 2905580, "Calculated Tax for 27.77M taxable");

        const taxCredit = salaryLogic.getIncomeTaxCredit(calculatedTax, grossTaxableSalary); // Tax 2.9M, Salary 47.6M
            // Credit = 715000 + (2905580 - 1300000) * 0.30 = 715000 + 1605580 * 0.30 = 715000 + 481674 = 1196674 -> 1196670
            // Limit for 47.6M salary: max(660k, 740k - (47.6M-33M)*0.008) = max(660k, 740k - 14.6M*0.008) = max(660k, 740k - 116800) = max(660k, 623200) = 660k
            // Min(1196670, 660000) = 660000
        assertEqual(taxCredit, 660000, "Tax Credit for tax 2.9M, salary 47.6M");

        const finalIncomeTax = salaryLogic.calculateFinalIncomeTax(calculatedTax, taxCredit); // 2905580 - 660000 = 2245580
        assertEqual(finalIncomeTax, 2245580, "Final Tax for 50M scenario");

        const localIncomeTax = salaryLogic.calculateLocalIncomeTax(finalIncomeTax); // 2245580 * 0.1 = 224558 -> 224550
        assertEqual(localIncomeTax, 224550, "Local Tax for 50M scenario");

        // Total Annual Deductions:
        // NP (2.25M) + HI (1.7724M) + LTC (0.22704M) + EI (0.45M) + FinalTax (2.24558M) + LocalTax (0.22455M)
        // = 2250000 + 1772400 + 227040 + 450000 + 2245580 + 224550 = 7169570
        const totalDeductions = salaryLogic.calculateTotalAnnualDeductions(salary, nonTaxAnnual, dependents);
        assertEqual(totalDeductions, 7169570, "Total Annual Deductions for 50M scenario");

        // Net Annual = 50M - 7169570 = 42830430
        // Net Monthly = round(42830430 / 12) = round(3569202.5) = 3569203
        assertEqual(salaryLogic.calculateNetMonthlyPay(salary, nonTaxMonthly, dependents), 3569203, "Net monthly for 50M, 200k non-tax, 2 dep");
    });

    // --- Display Results ---
    displayResults();
})();
