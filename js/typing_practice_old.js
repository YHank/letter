// 타자 연습 기능
function initializeTypingPractice() {
    console.log('타자 연습 초기화 중...');
    
    // 연습 텍스트 데이터
    const practiceTexts = {
        words: {
            easy: ['안녕하세요', '감사합니다', '사랑합니다', '행복하세요', '좋은하루', '반갑습니다', '축하합니다', '고맙습니다', '미안합니다', '괜찮습니다'],
            medium: ['대한민국', '컴퓨터', '인터넷', '스마트폰', '프로그래밍', '코딩테스트', '알고리즘', '데이터베이스', '네트워크', '클라우드'],
            hard: ['정보통신기술', '인공지능', '머신러닝', '블록체인', '사물인터넷', '빅데이터분석', '클라우드컴퓨팅', '사이버보안', '디지털트랜스포메이션', '메타버스']
        },
        sentences: {
            easy: [
                '오늘은 날씨가 정말 좋습니다.',
                '맛있는 음식을 먹고 싶어요.',
                '주말에 친구들과 만날 예정입니다.',
                '새로운 책을 읽기 시작했습니다.',
                '운동을 열심히 하고 있습니다.'
            ],
            medium: [
                '프로그래밍을 배우는 것은 매우 유익한 일입니다.',
                '인터넷의 발달로 세상이 하나로 연결되었습니다.',
                '건강한 생활습관을 유지하는 것이 중요합니다.',
                '새로운 기술을 배우는 것은 항상 즐겁습니다.',
                '꾸준한 노력이 성공의 열쇠입니다.'
            ],
            hard: [
                '인공지능 기술의 발전은 우리의 일상생활을 크게 변화시키고 있습니다.',
                '지속가능한 발전을 위해서는 환경보호가 필수적입니다.',
                '디지털 시대에 필요한 역량을 갖추기 위해 노력해야 합니다.',
                '글로벌 경제의 불확실성이 증가하고 있는 상황입니다.',
                '혁신적인 아이디어가 세상을 변화시킬 수 있습니다.'
            ]
        },
        paragraph: {
            easy: '봄이 왔습니다. 따뜻한 햇살이 내리쬐고 있습니다. 꽃들이 피어나기 시작했습니다. 사람들의 옷차림도 가벼워졌습니다. 공원에는 산책하는 사람들이 많습니다.',
            medium: '코딩을 배우는 것은 쉽지 않습니다. 하지만 꾸준히 연습하면 실력이 향상됩니다. 매일 조금씩 공부하는 것이 중요합니다. 다양한 프로젝트를 만들어보세요. 실전 경험이 가장 좋은 스승입니다.',
            hard: '현대 사회는 급속도로 변화하고 있습니다. 기술의 발전은 우리의 생활 방식을 완전히 바꾸어 놓았습니다. 인공지능과 로봇 기술의 발달로 많은 직업이 사라질 위기에 처해 있습니다. 하지만 동시에 새로운 기회도 생겨나고 있습니다. 우리는 이러한 변화에 적응하고 준비해야 합니다.'
        }
    };
    
    // 변수들
    let currentMode = 'words';
    let currentLevel = 'easy';
    let currentText = '';
    let currentIndex = 0;
    let startTime = null;
    let timerInterval = null;
    let errorCount = 0;
    let isTyping = false;
    
    // DOM 요소들
    const typingInput = document.getElementById('typing-input');
    const typedText = document.getElementById('typed-text');
    const currentChar = document.getElementById('current-char');
    const remainingText = document.getElementById('remaining-text');
    const startBtn = document.getElementById('start-btn');
    const resetBtn = document.getElementById('reset-btn');
    const nextBtn = document.getElementById('next-btn');
    const wpmDisplay = document.getElementById('wpm');
    const accuracyDisplay = document.getElementById('accuracy');
    const timeDisplay = document.getElementById('time');
    const progressDisplay = document.getElementById('progress');
    
    // 모드 버튼들
    document.querySelectorAll('[data-mode]').forEach(btn => {
        btn.addEventListener('click', function() {
            if (!isTyping) {
                document.querySelectorAll('[data-mode]').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                currentMode = this.dataset.mode;
                resetPractice();
            }
        });
    });
    
    // 난이도 버튼들
    document.querySelectorAll('[data-level]').forEach(btn => {
        btn.addEventListener('click', function() {
            if (!isTyping) {
                document.querySelectorAll('[data-level]').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                currentLevel = this.dataset.level;
                resetPractice();
            }
        });
    });
    
    // 시작 버튼
    startBtn.addEventListener('click', startPractice);
    resetBtn.addEventListener('click', resetPractice);
    nextBtn.addEventListener('click', nextPractice);
    
    // 계속 연습 버튼 (모달에서)
    const continueBtn = document.getElementById('continue-btn');
    if (continueBtn) {
        continueBtn.addEventListener('click', function() {
            nextPractice();
        });
    }
    
    // 타이핑 입력
    typingInput.addEventListener('input', handleTyping);
    typingInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !isTyping) {
            startPractice();
        }
    });
    
    // 연습 시작
    function startPractice() {
        const texts = practiceTexts[currentMode][currentLevel];
        if (Array.isArray(texts)) {
            currentText = texts[Math.floor(Math.random() * texts.length)];
        } else {
            currentText = texts;
        }
        
        currentIndex = 0;
        errorCount = 0;
        isTyping = true;
        startTime = Date.now();
        
        updateDisplay();
        typingInput.value = '';
        typingInput.disabled = false;
        typingInput.focus();
        startBtn.style.display = 'none';
        
        // 타이머 시작
        timerInterval = setInterval(updateTimer, 100);
    }
    
    // 타이핑 처리
    function handleTyping(e) {
        if (!isTyping) return;
        
        const typed = typingInput.value;
        const expected = currentText.substring(0, typed.length);
        
        if (typed === expected) {
            currentIndex = typed.length;
            updateDisplay();
            updateStats();
            
            // 완료 체크
            if (currentIndex >= currentText.length) {
                completePractice();
            }
        } else {
            // 오류 처리
            errorCount++;
            typingInput.classList.add('is-invalid');
            setTimeout(() => {
                typingInput.classList.remove('is-invalid');
            }, 200);
        }
    }
    
    // 화면 업데이트
    function updateDisplay() {
        typedText.textContent = currentText.substring(0, currentIndex);
        currentChar.textContent = currentText[currentIndex] || '';
        remainingText.textContent = currentText.substring(currentIndex + 1);
        
        // 진행률
        const progress = Math.round((currentIndex / currentText.length) * 100);
        progressDisplay.textContent = progress + '%';
    }
    
    // 통계 업데이트
    function updateStats() {
        if (!startTime) return;
        
        const elapsedMinutes = (Date.now() - startTime) / 60000;
        const charactersTyped = currentIndex;
        const wpm = Math.round(charactersTyped / elapsedMinutes);
        const accuracy = Math.round(((charactersTyped - errorCount) / charactersTyped) * 100) || 100;
        
        wpmDisplay.textContent = wpm;
        accuracyDisplay.textContent = accuracy + '%';
    }
    
    // 타이머 업데이트
    function updateTimer() {
        if (!startTime) return;
        
        const elapsed = Date.now() - startTime;
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        timeDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // 연습 완료
    function completePractice() {
        isTyping = false;
        clearInterval(timerInterval);
        typingInput.disabled = true;
        nextBtn.style.display = 'inline-block';
        
        // 최종 통계
        const elapsedMinutes = (Date.now() - startTime) / 60000;
        const finalWpm = Math.round(currentText.length / elapsedMinutes);
        const finalAccuracy = Math.round(((currentText.length - errorCount) / currentText.length) * 100);
        
        // 결과 모달 표시
        document.getElementById('final-wpm').textContent = finalWpm;
        document.getElementById('final-accuracy').textContent = finalAccuracy + '%';
        
        let message = '';
        if (finalWpm >= 300) {
            message = '놀라운 속도입니다! 전문가 수준이시네요! 🏆';
        } else if (finalWpm >= 200) {
            message = '매우 훌륭합니다! 상위 수준의 타자 실력입니다! 🥇';
        } else if (finalWpm >= 150) {
            message = '좋습니다! 평균 이상의 실력입니다! 🥈';
        } else if (finalWpm >= 100) {
            message = '잘하고 있습니다! 조금만 더 연습하면 더 빨라질 거예요! 🥉';
        } else {
            message = '꾸준히 연습하면 실력이 향상될 거예요! 화이팅! 💪';
        }
        
        document.getElementById('result-message').textContent = message;
        
        const modal = new bootstrap.Modal(document.getElementById('resultModal'));
        modal.show();
        
        // 모달이 닫히면 자동으로 다음 문제로
        document.getElementById('resultModal').addEventListener('hidden.bs.modal', function () {
            // continue-btn을 클릭한 경우에만 자동 진행
            // (이미 nextPractice가 호출되었음)
        }, { once: true });
    }
    
    // 리셋
    function resetPractice() {
        isTyping = false;
        currentIndex = 0;
        errorCount = 0;
        clearInterval(timerInterval);
        
        typingInput.value = '';
        typingInput.disabled = true;
        startBtn.style.display = 'inline-block';
        nextBtn.style.display = 'none';
        
        typedText.textContent = '';
        currentChar.textContent = '';
        remainingText.textContent = '시작 버튼을 눌러주세요';
        
        wpmDisplay.textContent = '0';
        accuracyDisplay.textContent = '100%';
        timeDisplay.textContent = '0:00';
        progressDisplay.textContent = '0%';
    }
    
    // 다음 문제
    function nextPractice() {
        resetPractice();
        startPractice();
    }
    
    // 초기화
    resetPractice();
}