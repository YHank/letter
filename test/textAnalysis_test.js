(function() {
    'use strict';

    // --- Test Runner Setup ---
    const testResults = [];
    let testsRun = 0;
    let testsPassed = 0;

    function runTest(description, testFn) {
        testsRun++;
        try {
            testFn();
            testResults.push({ description, status: 'PASSED' });
            testsPassed++;
        } catch (e) {
            testResults.push({ description, status: 'FAILED', error: e.toString(), stack: e.stack });
        }
    }

    function displayResults() {
        console.log(`\n--- TextAnalysis Test Results ---`);
        console.log(`Total tests: ${testsRun}, Passed: ${testsPassed}, Failed: ${testsRun - testsPassed}`);
        testResults.forEach(result => {
            if (result.status === 'PASSED') {
                console.log(`✅ PASSED: ${result.description}`);
            } else {
                console.error(`❌ FAILED: ${result.description}`);
                console.error(`   Error: ${result.error}`);
                if (result.stack) console.error(`   Stack: ${result.stack}`);
            }
        });
        console.log("--- End TextAnalysis Test Results ---\n");

        if (typeof document !== 'undefined' && document.getElementById) {
            const resultsContainer = document.getElementById('test-results-textanalysis');
            if (resultsContainer) {
                let html = `<h3>TextAnalysis Test Results</h3><p>Total: ${testsRun}, Passed: ${testsPassed}, Failed: ${testsRun - testsPassed}</p><ul>`;
                testResults.forEach(result => {
                    html += `<li style="color: ${result.status === 'PASSED' ? 'green' : 'red'};">
                                <strong>${result.status}:</strong> ${result.description}
                                ${result.error ? `<br><pre>${result.error}${result.stack ? `\n${result.stack}` : ''}</pre>` : ''}
                             </li>`;
                });
                html += "</ul>";
                resultsContainer.innerHTML = html;
            }
        }
    }

    // --- Load functions to test ---
    // Assuming this test file is run in an environment where 'require' can load the functions
    // or they are globally available (e.g. script tag in a test HTML runner)
    let TextAnalysis;
    if (typeof require !== 'undefined') {
        TextAnalysis = require('../js/textAnalysis.js');
    } else {
        // Fallback for browser-like environment if functions are global
        TextAnalysis = {
            countSentences,
            calculateAverageWordLength,
            calculateReadingTime,
            countParagraphs
        };
    }


    // --- Tests ---

    // countSentences Tests
    runTest("countSentences: Empty string", () => {
        if (TextAnalysis.countSentences("") !== 0) throw new Error("Expected 0 for empty string");
    });
    runTest("countSentences: String with only spaces", () => {
        if (TextAnalysis.countSentences("   ") !== 0) throw new Error("Expected 0 for string with only spaces");
    });
    runTest("countSentences: Single sentence (Korean)", () => {
        if (TextAnalysis.countSentences("안녕하세요.") !== 1) throw new Error("Expected 1 for '안녕하세요.'");
    });
    runTest("countSentences: Single sentence (English)", () => {
        if (TextAnalysis.countSentences("Hello world.") !== 1) throw new Error("Expected 1 for 'Hello world.'");
    });
    runTest("countSentences: Multiple sentences (Korean)", () => {
        if (TextAnalysis.countSentences("반갑습니다. 좋은 하루 되세요!") !== 2) throw new Error("Expected 2 for '반갑습니다. 좋은 하루 되세요!'");
    });
    runTest("countSentences: Multiple sentences (English)", () => {
        if (TextAnalysis.countSentences("This is a test. Is it working? Yes!") !== 3) throw new Error("Expected 3 for 'This is a test. Is it working? Yes!'");
    });
    runTest("countSentences: Mixed Korean/English sentences", () => {
        if (TextAnalysis.countSentences("이것은 테스트입니다. This is it! 정말요?") !== 3) throw new Error("Expected 3 for mixed sentences");
    });
    runTest("countSentences: No standard sentence terminators", () => {
        if (TextAnalysis.countSentences(" 그냥 문장 흐름") !== 1) throw new Error("Expected 1 for text with no standard terminators but content");
    });
     runTest("countSentences: Text ending without terminator but has content", () => {
        if (TextAnalysis.countSentences("이것은 문장이다") !== 1) throw new Error("Expected 1 for '이것은 문장이다'");
    });
    runTest("countSentences: Multiple sentences with various terminators", () => {
        if (TextAnalysis.countSentences("첫째。 둘째! 셋째? 넷째. 다섯째") !== 5) throw new Error("Expected 5 for varied terminators");
    });
    runTest("countSentences: Sentences with quotes", () => {
        if (TextAnalysis.countSentences('그가 말했다, "안녕하세요." 정말인가요?') !== 2) throw new Error('Expected 2 for sentences with quotes. Check regex logic for quotes around terminators.');
    });


    // calculateAverageWordLength Tests
    runTest("calculateAverageWordLength: Empty string", () => {
        if (TextAnalysis.calculateAverageWordLength("") !== 0) throw new Error("Expected 0 for empty string");
    });
    runTest("calculateAverageWordLength: Single word (Korean)", () => {
        if (TextAnalysis.calculateAverageWordLength("안녕하세요") !== 5.0) throw new Error("Expected 5.0 for '안녕하세요'");
    });
    runTest("calculateAverageWordLength: Single word (English)", () => {
        if (TextAnalysis.calculateAverageWordLength("Hello") !== 5.0) throw new Error("Expected 5.0 for 'Hello'");
    });
    runTest("calculateAverageWordLength: Multiple words (Korean)", () => {
        // (5+2+3)/3 = 10/3 = 3.333... -> 3.3
        if (TextAnalysis.calculateAverageWordLength("안녕하세요 좋은 하루") !== 3.3) throw new Error("Expected 3.3 for '안녕하세요 좋은 하루'");
    });
    runTest("calculateAverageWordLength: Multiple words (English)", () => {
        // (5+5+3)/3 = 13/3 = 4.333... -> 4.3
        if (TextAnalysis.calculateAverageWordLength("Hello world bye") !== 4.3) throw new Error("Expected 4.3 for 'Hello world bye'");
    });
    runTest("calculateAverageWordLength: Text with leading/trailing spaces", () => {
        if (TextAnalysis.calculateAverageWordLength("  Hello world  ") !== 5.0) throw new Error("Expected 5.0 for '  Hello world  '");
    });
    runTest("calculateAverageWordLength: Text with multiple spaces between words", () => {
        if (TextAnalysis.calculateAverageWordLength("Hello    world") !== 5.0) throw new Error("Expected 5.0 for 'Hello    world'");
    });


    // calculateReadingTime Tests (Korean based)
    runTest("calculateReadingTime: Empty string", () => {
        if (TextAnalysis.calculateReadingTime("") !== "0분") throw new Error("Expected '0분' for empty string");
    });
    runTest("calculateReadingTime: Short text (Korean)", () => {
        // Assuming 400 chars/min. "안녕하세요" is 5 chars (no spaces). 5/400 min.
        if (TextAnalysis.calculateReadingTime("안녕하세요") !== "1분 미만") throw new Error("Short Korean text failed");
    });
    runTest("calculateReadingTime: Medium text (Korean)", () => {
        let text = "동해물과 백두산이 마르고 닳도록 하느님이 보우하사 우리나라 만세 무궁화 삼천리 화려강산 대한사람 대한으로 길이 보전하세 남산위에 저 소나무 철갑을 두른듯 바람서리 불변함은 우리기상일세";
        text = text.replace(/\s/g, ''); // 98자
        // 98 / 400 = 0.245 minutes -> "1분 미만"
        if (TextAnalysis.calculateReadingTime(text) !== "1분 미만") throw new Error("Medium Korean text (애국가 1절) '1분 미만' failed");

        let longText = text.repeat(5); // 98 * 5 = 490자
        // 490 / 400 = 1.225 minutes -> ceil(1.225) = 2 -> "약 2분"
        if (TextAnalysis.calculateReadingTime(longText) !== "약 2분") throw new Error(`Medium Korean text (애국가 1절 x5) '약 2분' failed, got: ${TextAnalysis.calculateReadingTime(longText)}`);
    });
    runTest("calculateReadingTime: Long text (Korean)", () => {
        let text = "동해물과 백두산이 마르고 닳도록 하느님이 보우하사 우리나라 만세 무궁화 삼천리 화려강산 대한사람 대한으로 길이 보전하세";
        text = text.replace(/\s/g, ''); // 55 chars (애국가 1절 부분)
        let veryLongText = text.repeat(100); // 5500 chars
        // 5500 / 400 = 13.75 minutes -> "약 14분"
        if (TextAnalysis.calculateReadingTime(veryLongText) !== "약 14분") throw new Error("Long Korean text '약 14분' failed");

        veryLongText = text.repeat(500); // 55 * 500 = 27500 chars
        // 27500 / 400 = 68.75 minutes. hours = floor(1.145...) = 1. remainingMinutes = ceil(0.145... * 60) = ceil(8.75) = 9
        // 68.75 min = 1 hour 8.75 min -> "약 1시간 9분"
        if (TextAnalysis.calculateReadingTime(veryLongText) !== "약 1시간 9분") throw new Error(`Very long Korean text '약 1시간 9분' failed, got ${TextAnalysis.calculateReadingTime(veryLongText)}`);
    });
     runTest("calculateReadingTime: Exactly 1 hour", () => {
        let text = "가".repeat(400 * 60); // 24000자
        // 24000 / 400 = 60 minutes -> "약 1시간"
        if (TextAnalysis.calculateReadingTime(text) !== "약 1시간") throw new Error(`Exactly 1 hour text failed, got ${TextAnalysis.calculateReadingTime(text)}`);
    });


    // countParagraphs Tests
    runTest("countParagraphs: Empty string", () => {
        if (TextAnalysis.countParagraphs("") !== 0) throw new Error("Expected 0 for empty string");
    });
    runTest("countParagraphs: Single line of text (no explicit line breaks)", () => {
        if (TextAnalysis.countParagraphs("안녕하세요. 반갑습니다.") !== 1) throw new Error("Expected 1 for single line text");
    });
    runTest("countParagraphs: Text with single line breaks (not paragraphs)", () => {
        if (TextAnalysis.countParagraphs("첫째 줄입니다.\n둘째 줄입니다.") !== 1) throw new Error("Expected 1 for text with single line breaks");
    });
    runTest("countParagraphs: Two paragraphs", () => {
        if (TextAnalysis.countParagraphs("첫 번째 단락입니다.\n\n두 번째 단락입니다.") !== 2) throw new Error("Expected 2 for two paragraphs");
    });
    runTest("countParagraphs: Multiple paragraphs with varied spacing", () => {
        if (TextAnalysis.countParagraphs("단락1\n\n단락2\n\n\n단락3\n \n단락4") !== 4) throw new Error("Expected 4 for multiple paragraphs with varied spacing");
    });
    runTest("countParagraphs: Text starting/ending with multiple newlines", () => {
        if (TextAnalysis.countParagraphs("\n\n시작 단락.\n\n끝 단락.\n\n") !== 2) throw new Error("Expected 2 for text with leading/trailing newlines");
    });
    runTest("countParagraphs: Text with only spaces and newlines (should be 0 or handle as no content)", () => {
        if (TextAnalysis.countParagraphs("\n   \n\n  \n") !== 0) throw new Error("Expected 0 for text with only spaces and newlines");
    });
     runTest("countParagraphs: Single content paragraph with surrounding newlines", () => {
        if (TextAnalysis.countParagraphs("\n\n한 단락\n\n") !== 1) throw new Error("Expected 1 for single content paragraph with surrounding newlines");
    });


    // --- Display Results ---
    displayResults();

})();
