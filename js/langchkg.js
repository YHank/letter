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
    const PNU_URL = 'http://speller.cs.pusan.ac.kr/results';
    const PNU_MAX_WORDS = 200; // Slightly less than library's 250 for safety
    const resultsDisplay = document.getElementById('spellcheck_results');

    if (!resultsDisplay) {
        console.error('Error: spellcheck_results element not found.');
        return;
    }
    resultsDisplay.innerHTML = '검사 중...';

    // Pre-processing similar to 9beach/hanspell (simplified)
    let processedText = textToCheck.replace(/<[^ㄱ-ㅎㅏ-ㅣ가-힣>]+>/g, ''); // Remove HTML tags
    processedText = processedText.replace(/([^])\n/g, '$1\r\n') + '\r\n'; // Normalize newlines

    const textParts = splitTextByWordCount(processedText, PNU_MAX_WORDS);
    let allSuggestions = [];

    try {
        for (const part of textParts) {
            const formData = new FormData();
            formData.append('text1', part);

            const response = await fetch(PNU_URL, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const responseHTML = await response.text();

            // --- Parsing Logic (Adapted from 9beach/hanspell's parseJSON) ---
            const match = responseHTML.match(/\tdata = \[.*;/g);
            if (match && match.length > 0) {
                // Ensure the matched string is valid before attempting to parse
                let jsonDataString = match[0];
                // Remove 'data = [' from the beginning and '];' or similar from the end
                jsonDataString = jsonDataString.replace(/^\s*data\s*=\s*\[/, '[');
                jsonDataString = jsonDataString.replace(/\];\s*$/, ']');

                try {
                    const parsedData = JSON.parse(jsonDataString);
                    if (parsedData && parsedData.length > 0 && parsedData[0].errInfo) {
                        const pnuTypos = parsedData[0].errInfo;
                        pnuTypos.forEach(pnutypo => {
                            let suggestions = pnutypo.candWord.replace(/\|$/, '');
                            if (suggestions === '') {
                                suggestions = decodeHTMLEntities(pnutypo.orgStr);
                            }
                            const info = pnutypo.help
                                .replace(/< *[bB][rR] *\/>/g, '\n')
                                .replace(/\n\n/g, '\n')
                                .replace(/\n\(예\) /g, '\n(예)\n')
                                .replace(/  \(예\) /g, '\n(예)\n')
                                .replace(/   */g, '\n');

                            allSuggestions.push({
                                token: decodeHTMLEntities(pnutypo.orgStr),
                                suggestions: decodeHTMLEntities(suggestions).split('|'),
                                info: decodeHTMLEntities(info)
                            });
                        });
                    }
                } catch (e) {
                    console.error("Error parsing JSON data from PNU:", e);
                    console.error("Original JSON string part:", jsonDataString);
                    // Optionally, display a more user-friendly message or part of the problematic data
                    resultsDisplay.innerHTML = '맞춤법 검사 결과를 처리하는 중 오류가 발생했습니다. (데이터 분석 오류)';
                    return; // Stop further processing for this part or all parts
                }
            }
            // --- End of Parsing Logic ---
        }

        displayResults(allSuggestions);

    } catch (error) {
        console.error('Spell check error:', error);
        resultsDisplay.innerHTML = '맞춤법 검사 중 오류가 발생했습니다: ' + error.message;
    }
}

function displayResults(suggestions) {
    const resultsDisplay = document.getElementById('spellcheck_results');
    if (!resultsDisplay) {
        console.error('Error: spellcheck_results element not found for displaying results.');
        return;
    }
    if (suggestions.length === 0) {
        resultsDisplay.innerHTML = '<p>수정할 내용이 없습니다.</p>';
        return;
    }

    let html = '<ul>';
    suggestions.forEach(item => {
        html += `<li style="margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 10px;">`;
        html += `<strong>오류:</strong> <span style="color: red;">${item.token}</span><br/>`;
        html += `<strong>추천:</strong> <span style="color: green;">${item.suggestions.join(', ')}</span><br/>`;
        html += `<strong>설명:</strong><pre style="white-space: pre-wrap; background-color: #f9f9f9; padding: 5px; border-radius: 3px;">${item.info}</pre>`;
        html += `</li>`;
    });
    html += '</ul>';
    resultsDisplay.innerHTML = html;
}

function initializeSpellchecker() {
    const spellcheckButton = document.getElementById('spellcheck_button');
    const spellcheckInput = document.getElementById('spellcheck_input');
    const resultsDisplay = document.getElementById('spellcheck_results');

    if (spellcheckButton && spellcheckInput && resultsDisplay) {
        spellcheckButton.addEventListener('click', () => {
            const text = spellcheckInput.value;
            if (text.trim() !== '') {
                checkSpellingPNU(text);
            } else {
                resultsDisplay.innerHTML = '<p>검사할 내용을 입력해주세요.</p>';
            }
        });
        // console.log("Spellchecker initialized.");
    } else {
        // console.log("Spellcheck elements not found, not initializing spellchecker events.");
    }
}

// Fallback for chgLng if it's called from somewhere else (e.g. old code not removed)
// or if other parts of the site expect it.
// Ideally, all calls to chgLng should be removed if it's no longer used.
function chgLng(p1, p2, p3) {
    console.warn("Old chgLng function called. This function should ideally be removed or replaced.");
    // Add any necessary fallback or error handling logic here if needed.
}

// Attempt to initialize spellchecker on initial load as well,
// in case the spellcheck page is the default page or loaded directly.
// However, the primary initialization for dynamic loads will be from index.js.
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSpellchecker);
} else {
    // DOMContentLoaded has already fired
    initializeSpellchecker();
}
