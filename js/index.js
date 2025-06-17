// Debounce 함수 - 성능 최적화를 위해 입력 이벤트를 지연시킴
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 텍스트 분석 함수들
function countSentences(text) {
    // 한국어와 영어 문장 종결 부호를 모두 고려
    const sentences = text.match(/[^.!?。！？]+[.!?。！？]+/g) || [];
    return sentences.length;
}

function calculateAverageWordLength(text) {
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    if (words.length === 0) return 0;
    
    const totalLength = words.reduce((sum, word) => sum + word.length, 0);
    return (totalLength / words.length).toFixed(1);
}

function calculateReadingTime(text) {
    if (!text || text.trim() === '') return '0';
    
    // 한국어 평균 읽기 속도: 분당 300-500자 (평균 400자)
    // 영어 평균 읽기 속도: 분당 200-250단어
    const charCount = text.replace(/\s/g, '').length;
    if (charCount === 0) return '0';
    
    const minutes = charCount / 400;
    
    if (minutes < 1) {
        return "1분 미만";
    } else if (minutes < 60) {
        return `약 ${Math.ceil(minutes)}분`;
    } else {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = Math.ceil(minutes % 60);
        return `약 ${hours}시간 ${remainingMinutes}분`;
    }
}

function countParagraphs(text) {
    if (!text || text.trim() === '') return 0;
    
    // 두 개 이상의 연속된 줄바꿈을 단락 구분으로 간주
    const paragraphs = text.split(/\n\s*\n/).filter(para => para.trim().length > 0);
    return paragraphs.length || 1;
}

// 자동 저장 함수
function autoSave(text) {
    localStorage.setItem('letterCountDraft', text);
    localStorage.setItem('letterCountDraftTime', new Date().toISOString());
}

// 저장된 내용 복원
function restoreDraft() {
    const draft = localStorage.getItem('letterCountDraft');
    const draftTime = localStorage.getItem('letterCountDraftTime');
    
    if (draft) {
        const letterCountElement = document.querySelector('#letter_count');
        letterCountElement.innerText = draft;
        
        // 복원 알림 표시 (선택사항)
        if (draftTime) {
            const savedDate = new Date(draftTime);
            const timeString = savedDate.toLocaleString('ko-KR');
            console.log(`자동 저장된 내용을 복원했습니다. (저장 시간: ${timeString})`);
        }
        
        // 복원 후 통계 업데이트
        updateStatistics();
    }
}

// 통계 업데이트 함수
function updateStatistics() {
    const letterCountElement = document.querySelector('#letter_count');
    const letter = letterCountElement.innerText;
    
    // 텍스트가 비어있는지 확인
    if (!letter || letter.trim() === '') {
        // 모든 통계를 0으로 초기화
        document.querySelector('[data-result="1"]').textContent = '0';
        document.querySelector('[data-result="2"]').textContent = '0';
        document.querySelector('[data-result="3"]').textContent = '0';
        document.querySelector('[data-result="4"]').textContent = '0';
        document.querySelector('[data-result="sentences"]').textContent = '0';
        document.querySelector('[data-result="avg-word-length"]').textContent = '0';
        document.querySelector('[data-result="reading-time"]').textContent = '0';
        document.querySelector('[data-result="paragraphs"]').textContent = '0';
        
        // 빈 텍스트도 저장
        autoSave(letter);
        return;
    }
    
    // 기본 통계
    let letter_count = letter.replace(/ /g, '').replace(/\n/g, '');
    let letter_count2 = letter.length;
    let word_count = letter.split(' ').length;
    let wrod_count2 = letter.split(/\n/).length;
    let line_count = letter.split('\n').length;
    
    // 빈 줄 처리
    let line_count2 = 0;
    letter.split('\n').forEach(function(enter){
        if(enter == ''){
            line_count2++;
        }
    })
    
    // 기본 통계 업데이트
    document.querySelector('[data-result="1"]').textContent = letter_count.length;
    document.querySelector('[data-result="2"]').textContent = letter_count2;
    document.querySelector('[data-result="3"]').textContent = word_count+wrod_count2-line_count2-1;
    document.querySelector('[data-result="4"]').textContent = line_count;
    
    // 텍스트 분석 통계 업데이트
    document.querySelector('[data-result="sentences"]').textContent = countSentences(letter);
    document.querySelector('[data-result="avg-word-length"]').textContent = calculateAverageWordLength(letter);
    document.querySelector('[data-result="reading-time"]').textContent = calculateReadingTime(letter);
    document.querySelector('[data-result="paragraphs"]').textContent = countParagraphs(letter);
    
    // 자동 저장
    autoSave(letter);
}

// Debounce를 적용한 업데이트 함수
const debouncedUpdate = debounce(updateStatistics, 300);

// 메인 입력 이벤트 리스너
document.querySelector('#letter_count').addEventListener('input', debouncedUpdate);

// 텍스트 변환 함수들
const textTransformations = {
    uppercase: (text) => text.toUpperCase(),
    lowercase: (text) => text.toLowerCase(),
    capitalize: (text) => {
        return text.replace(/\b\w/g, char => char.toUpperCase());
    },
    'remove-special': (text) => {
        // 한글, 영어, 숫자, 공백, 줄바꿈만 남기고 제거
        return text.replace(/[^가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9\s\n]/g, '');
    },
    'remove-spaces': (text) => {
        // 줄바꿈은 유지하고 공백만 제거
        return text.replace(/ /g, '');
    },
    'trim-lines': (text) => {
        // 각 줄의 앞뒤 공백 제거
        return text.split('\n').map(line => line.trim()).join('\n');
    },
    clear: () => ''
};

// 텍스트 변환 처리
function handleTextTransform(transformType) {
    const letterCountElement = document.querySelector('#letter_count');
    const currentText = letterCountElement.innerText;
    
    if (transformType in textTransformations) {
        const transformedText = textTransformations[transformType](currentText);
        letterCountElement.innerText = transformedText;
        
        // 변환 후 통계 업데이트
        updateStatistics();
    }
}

// DOMContentLoaded 이벤트
document.addEventListener('DOMContentLoaded', function(){
    // 저장된 내용 복원
    restoreDraft();
    
    // 텍스트 변환 버튼 이벤트 리스너
    document.querySelectorAll('[data-transform]').forEach(button => {
        button.addEventListener('click', function() {
            const transformType = this.dataset.transform;
            handleTextTransform(transformType);
        });
    });
    
    // 페이지 네비게이션 처리
    document.querySelectorAll('[data-move]').forEach(function(link){
        link.addEventListener('click', function(e){
            const page = this.dataset.move;
            e.preventDefault();
            $('main').load('/html/'+page+'.html', function(response, status, xhr) {
                if (status === "success") {
                    // 페이지별 초기화 함수 호출
                    switch(page) {
                        case 'spellcheck_simple':
                            if (typeof initializeSimpleSpellchecker === 'function') {
                                setTimeout(initializeSimpleSpellchecker, 100);
                            }
                            break;
                        case 'typing_practice':
                            if (typeof initializeTypingPracticeNew === 'function') {
                                setTimeout(initializeTypingPracticeNew, 100);
                            } else if (typeof initializeTypingPractice === 'function') {
                                setTimeout(initializeTypingPractice, 100);
                            }
                            break;
                        case 'salary':
                            if (typeof initializeSalaryPage === 'function') {
                                setTimeout(initializeSalaryPage, 100);
                            }
                            break;
                        case 'insurance_calculator':
                            if (typeof initializeInsuranceCalculator === 'function') {
                                setTimeout(initializeInsuranceCalculator, 100);
                            }
                            break;
                        case 'scientific_calculator':
                            if (typeof initializeScientificCalculator === 'function') {
                                setTimeout(initializeScientificCalculator, 100);
                            }
                            break;
                    }
                } else if (status === "error") {
                    console.error("Error loading page: " + xhr.status + " " + xhr.statusText);
                    $('main').html("<p>Error loading page. Please try again.</p>");
                }
            });
        });
    });
});

// Google 번역 초기화 함수
function googleTranslateElementInit() {
    new google.translate.TranslateElement({
        pageLanguage: 'ko',
        includedLanguages: 'en,ja,zh-CN,fr,de',
        layout: google.translate.TranslateElement.InlineLayout.SIMPLE
    }, 'google_translate_element');
}