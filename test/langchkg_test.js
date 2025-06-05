// 이 스크립트는 실제 브라우저 환경을 시뮬레이션하는 것이 아니라,
// 코드 실행 가능성 및 기본적인 오류 발생 여부를 확인하기 위함입니다.
// js/langchkg.js 파일에 정의된 함수들을 사용하기 위해 해당 파일의 컨텍스트에서 실행되는 것처럼 가정합니다.

// 필요한 DOM 요소 모킹 (이전 테스트와 동일)
global.document = {
    getElementById: function(id) {
        if (id === 'spellcheck_results') {
            return {
                innerHTML: '' // 초기 상태
            };
        }
        return null;
    },
    createElement: function(type) {
        if (type === 'textarea') {
            return { innerHTML: '', value: '' };
        }
        return {};
    }
};
global.FormData = class FormData {
    constructor() {
        this.data = {};
    }
    append(key, value) {
        this.data[key] = value;
    }
};
global.fetch = async function(url, options) {
    console.log("Mock Fetch called with URL:", url);
    if (url === 'https://nara-speller.co.kr/speller/spell_check.do') { // 변경된 URL 확인
        const mockResponseHtml = `
            <html><body>
            <script type='text/javascript'>
                var data = []; // 빈 결과 또는 예상되는 최소한의 구조
            </script>
            </body></html>
        `;
        return {
            ok: true,
            text: async () => mockResponseHtml
        };
    }
    return {
        ok: false,
        status: 404,
        text: async () => "Mock API not found for this URL"
    };
};

// --- js/langchkg.js의 일부 함수 (이전 테스트와 동일, PNU_URL만 다름) ---
function decodeHTMLEntities(text) {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
}

function splitTextByWordCount(text, maxWords) {
    const words = text.split(/\s+/); // Split by whitespace
    const parts = [];
    let currentPart = [];
    for (const word of words) {
        currentPart.push(word);
        if (currentPart.length >= maxWords) {
            parts.push(currentPart.join(' '));
            currentPart = [];
        }
    }
    if (currentPart.length > 0) {
        parts.push(currentPart.join(' '));
    }
    return parts;
}

async function checkSpellingPNU(textToCheck) {
    const PNU_URL = 'https://nara-speller.co.kr/speller/spell_check.do'; // 새로 변경된 URL
    const PNU_MAX_WORDS = 200;
    const resultsDisplay = document.getElementById('spellcheck_results');

    if (!resultsDisplay) {
        console.error('Error: spellcheck_results element not found.');
        resultsDisplay.innerHTML = '오류: 결과를 표시할 영역을 찾을 수 없습니다.';
        return;
    }
    resultsDisplay.innerHTML = '검사 중...';

    let processedText = textToCheck.replace(/<[^ㄱ-ㅎㅏ-ㅣ가-힣>]+>/g, '');
    processedText = processedText.replace(/([^])\n/g, '$1\r\n') + '\r\n';

    const textParts = splitTextByWordCount(processedText, PNU_MAX_WORDS);
    let allSuggestions = [];
    let responseHTML = ""; // Declare and initialize responseHTML

    try {
        for (const part of textParts) {
            const formData = new FormData();
            formData.append('text1', part); // 실제 API는 'text1' 파라미터를 사용할 수도 있고, 다를 수도 있음

            const response = await fetch(PNU_URL, {
                method: 'POST', // POST 요청 가정
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            responseHTML = await response.text(); // Assign to the higher scoped variable
            console.log("Mock API Response HTML for spell_check.do:", responseHTML.substring(0, 200));

            const match = responseHTML.match(/	data = \[.*;/g); // 기존 파싱 로직 유지
            if (match && match.length > 0) {
                let jsonDataString = match[0];
                jsonDataString = jsonDataString.replace(/^\s*data\s*=\s*\[/, '[');
                jsonDataString = jsonDataString.replace(/\];\s*$/, ']');
                console.log("Extracted JSON string (spell_check.do):", jsonDataString);
                try {
                    const parsedData = JSON.parse(jsonDataString);
                    if (parsedData && parsedData.length > 0 && parsedData[0].errInfo) {
                        // ... (이하 파싱 및 suggestions 추가 로직은 이전과 동일)
                        // For brevity, the full parsing logic for errInfo is omitted here
                        // but it would be the same as in the previous test script.
                        // Example:
                        const pnuTypos = parsedData[0].errInfo;
                        pnuTypos.forEach(pnutypo => {
                            allSuggestions.push({ token: pnutypo.orgStr, suggestions: [pnutypo.candWord], info: pnutypo.help });
                        });
                    } else if (parsedData && parsedData.length === 0) {
                         console.log("API (spell_check.do) returned empty data array.");
                    }
                } catch (e) {
                    console.error("Error parsing JSON data from PNU (spell_check.do):", e);
                    resultsDisplay.innerHTML = '맞춤법 검사 결과를 처리하는 중 오류가 발생했습니다. (데이터 분석 오류)';
                    return;
                }
            } else {
                console.log("No 'data = [.*;' pattern found in responseHTML for spell_check.do. The response structure might have changed or there's no data.");
            }
        }
        // displayResults(allSuggestions);
        console.log("All suggestions (mock, spell_check.do):", allSuggestions);
        // Ensure responseHTML is checked before calling .includes
        if (allSuggestions.length === 0 && responseHTML && !responseHTML.includes("errInfo")) {
             resultsDisplay.innerHTML = '<p>수정할 내용이 없거나, API 응답을 확인해야 합니다. (spell_check.do)</p>';
        } else if (allSuggestions.length > 0) {
            resultsDisplay.innerHTML = '<p>검사 완료 (결과 수: ' + allSuggestions.length + ')</p>';
        }


    } catch (error) {
        console.error('Spell check error (spell_check.do):', error);
        resultsDisplay.innerHTML = '맞춤법 검사 중 오류가 발생했습니다: ' + error.message;
    }
}
// --- 끝: js/langchkg.js의 일부 함수 ---

// 테스트 실행
(async () => {
    console.log("테스트 시작: checkSpellingPNU 함수 호출 (spell_check.do)");
    await checkSpellingPNU("이것은 테스트 문장입니다 오류가 있읍니다.");
    console.log("테스트 완료 (spell_check.do). resultsDisplay.innerHTML:", document.getElementById('spellcheck_results').innerHTML);
})();
