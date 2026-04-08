// 타자 연습 데이터 관리
// 한글/영어 타자 연습을 위한 모든 연습 텍스트 데이터

var practiceTexts = practiceTexts || {
    korean: {
        free: [
            '안녕하세요',
            '반갑습니다',
            '오늘도 좋은 하루 되세요',
            '즐거운 하루 보내세요',
            '행복한 하루 되세요',
            // 세계 명언
            '천 리 길도 한 걸음부터',
            '로마는 하루아침에 이루어지지 않았다',
            '시작이 반이다',
            '꿈을 포기하지 마라',
            '실패는 성공의 어머니',
            '노력 없이는 아무것도 얻을 수 없다',
            '지식은 힘이다',
            '시간은 금이다',
            '인내는 쓰지만 그 열매는 달다',
            '기회는 준비된 자에게 온다',
            '배움에는 왕도가 없다',
            '오늘 할 수 있는 일을 내일로 미루지 마라',
            '진리는 시간이 걸려도 결국 밝혀진다',
            '인생은 아름다운 꿈의 연속이다',
            '작은 친절이 큰 행복을 만든다',
            // 한국 속담
            '가는 말이 고와야 오는 말이 곱다',
            '백지장도 맞들면 낫다',
            '물에 빠진 놈 건져놓으니 보따리 내놓으라 한다',
            '호랑이도 제 말하면 온다',
            '낮말은 새가 듣고 밤말은 쥐가 듣는다',
            '개천에서 용 난다',
            '뜻이 있는 곳에 길이 있다',
            '원숭이도 나무에서 떨어진다',
            '티끌 모아 태산',
            '고생 끝에 낙이 온다',
            '금강산도 식후경',
            '소 잃고 외양간 고친다',
            '급하게 먹는 밥이 체한다',
            '콩 심은 데 콩 나고 팥 심은 데 팥 난다',
            '하늘은 스스로 돕는 자를 돕는다'
        ],
        beginner: {
            home: [
                'ㅁ', 'ㄴ', 'ㅇ', 'ㄹ', 'ㅎ', 'ㅗ', 'ㅓ', 'ㅏ', 'ㅂ', 'ㅈ', 'ㄷ', 'ㄱ', 'ㅅ', 'ㅛ', 'ㅕ', 'ㅑ', 'ㅋ', 'ㅌ', 'ㅊ', 'ㅍ',
                'ㅠ', 'ㅜ', 'ㅡ', 'ㅣ', 'ㅐ', 'ㅔ', 'ㅒ', 'ㅖ',
                'ㅁㄴ', 'ㅇㄹ', 'ㅎㅗ', 'ㅓㅏ', 'ㅂㅈ', 'ㄷㄱ', 'ㅅㅛ', 'ㅕㅑ', 'ㅋㅌ', 'ㅊㅍ', 'ㅠㅜ', 'ㅡㅣ', 'ㅐㅔ', 'ㅒㅖ'
        ],
        consonant: [
                'ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ', 'ㄲ', 'ㄸ', 'ㅃ', 'ㅆ', 'ㅉ',
                'ㄱㄱ', 'ㄴㄴ', 'ㄷㄷ', 'ㄹㄹ', 'ㅁㅁ', 'ㅂㅂ', 'ㅅㅅ', 'ㅇㅇ', 'ㅈㅈ', 'ㅊㅊ', 'ㅋㅋ', 'ㅌㅌ', 'ㅍㅍ', 'ㅎㅎ',
                'ㄲㄲ', 'ㄸㄸ', 'ㅃㅃ', 'ㅆㅆ', 'ㅉㅉ', 'ㄱㄴ', 'ㄷㄹ', 'ㅁㅂ', 'ㅅㅇ', 'ㅈㅊ', 'ㅋㅌ', 'ㅍㅎ', 'ㄱㄷ', 'ㅂㅈ', 'ㅅㅁ', 'ㄴㅇ'
        ],
        vowel: [
                'ㅏ', 'ㅑ', 'ㅓ', 'ㅕ', 'ㅗ', 'ㅛ', 'ㅜ', 'ㅠ', 'ㅡ', 'ㅣ', 'ㅐ', 'ㅔ', 'ㅒ', 'ㅖ',
                'ㅏㅏ', 'ㅓㅓ', 'ㅗㅗ', 'ㅜㅜ', 'ㅡㅡ', 'ㅣㅣ', 'ㅐㅐ', 'ㅔㅔ', 'ㅑㅑ', 'ㅕㅕ', 'ㅛㅛ', 'ㅠㅠ', 'ㅒㅒ', 'ㅖㅖ',
                'ㅏㅑ', 'ㅓㅕ', 'ㅗㅛ', 'ㅜㅠ', 'ㅡㅣ', 'ㅐㅔ', 'ㅒㅖ'
            ],
            word: [
                // 기초 단어 (2글자)
                '나무', '하늘', '바다', '구름', '바람', '꽃잎', '눈물', '미소', '기쁨', '사랑',
                '친구', '가족', '학교', '선생', '공부', '운동', '음식', '커피', '물병', '책상',
                // 일상 단어 (3글자)
                '고맙다', '반갑다', '행복해', '즐거워', '힘내요', '괜찮아', '맛있다', '예쁘다', '멋있다', '재밌다',
                '안녕히', '천천히', '빨리요', '잠깐요', '여기요', '저기요', '감사해', '미안해', '사랑해', '보고파',
                // 자주 쓰는 단어 (4글자+)
                '안녕하세', '감사합니', '사랑합니', '반갑습니', '행복하다', '즐거웁다', '따뜻하다', '포근하다', '고마워요', '미안해요',
                '화이팅요', '잘했어요', '대단해요', '멋있어요', '예뻐요', '재밌어요', '맛있어요', '신나요', '좋아요', '싫어요'
            ]
        },
        special: {
            numbers: [
                '1234567890', '2024-01-01', '010-1234-5678', '000000-0000000', '12345',
                '2025/01/06', '12/31/2023', '09/09/1999', '01/01/2000', '03/03/2030',
            '123-456-789', '987-654-321', '111-222-333', '444-555-666', '777-888-999',
                '100,000', '250,000', '1,000,000', '50,000', '750,000',
            '3.14159', '2.71828', '1.41421', '1.61803', '0.57721',
            '02-1234-5678', '031-987-6543', '032-111-2222', '033-444-5555', '051-777-8888'
        ],
        symbols: [
            '!@#$%^&*()', '[]{}()<>', '+-*/=', '.,;:\'"', '?!~`|\\',
            '!!!@@@###', '$$$%%%^^^', '&&&***(((', ')))___+++', '===---...',
            '<html></html>', '[array]', '{object}', '(function)', '/*comment*/',
            'a->b', 'x=>y', 'p<q', 'm>n', 'i<=j', 'k>=l',
            'A&&B', 'C||D', '!E', '~F', 'G!=H', 'I==J',
            '...', '---', '___', '***', '+++', '///', '\\\\\\', '|||'
        ],
        mixed: [
                '123!@#', '2024-01-01', '@.', '.', '123!',
                '@.', '@.', '@.', '@.', '@.',
                '://..', '://3000', '://.', '@192.168.1.1', '@:/.', 
                '@!', '#', '*', '&', '2',
                '_01.', '-2.', '.2024.', '_20250106.', '_3.',
                ' = 10;', ' = 3.14;', '(, ) {  + ; }', '( > 0) { .(); }', '( = 0;  < 10; ++)'
        ],
        chunjiin: [
            'ㅣ.ㅡ', 'ㅣ..', '...', 'ㅡ.ㅣ', 'ㅣ.ㅣ',
            '..ㅡ', 'ㅡ..', 'ㅣㅡ.', '.ㅣㅡ', 'ㅡㅣ.',
            'ㅣㅣ.', '..ㅣ', 'ㅡㅡ.', '...ㅣ', 'ㅣ...',
            '.ㅡ.', 'ㅣ.ㅡㅣ', 'ㅡ.ㅣ.', '..ㅡㅣ', 'ㅣㅡ..'
        ]
    },
    standard: {
        words: {
            easy: [
                '안녕하세요', '감사합니다', '사랑합니다', '행복하세요', '좋은하루', '반갑습니다'
            ],
            medium: ['프로그래밍', '인터넷', '컴퓨터', '스마트폰'],
            hard: ['정보기술 인프라', '인공지능 윤리', '머신러닝 알고리즘']
        },
        sentences: {
            easy: ['오늘 날씨가 정말 좋네요', '맛있는 것을 먹고 싶어요'],
            medium: ['프로그래밍을 배우는 것은 개인적 성장에 매우 유익한 노력입니다'],
            hard: ['인공지능 기술의 급속한 발전은 우리의 일상생활을 근본적으로 변화시키고 있습니다']
        },
        paragraph: {
            easy: '봄이 왔습니다. 따뜻한 햇살이 내리쬐고 있습니다.',
            medium: '프로그래밍을 배우는 것은 개인적 성장에 매우 유익한 노력입니다.',
            hard: '인공지능 기술의 급속한 발전은 우리의 일상생활을 근본적으로 변화시키고 있습니다.'
        }
    }
    },
    english: {
        free: [
            'Hello',
            'Welcome',
            'Have a nice day',
            'A journey of a thousand miles begins with a single step',
            'Rome was not built in a day',
            'Knowledge is power',
            'Time is money',
            'Actions speak louder than words',
            // 일상 표현
            'Good morning everyone',
            'How are you doing today',
            'Nice to meet you',
            'Thank you very much',
            'You are welcome',
            'See you later',
            'Take care of yourself',
            'Have a great weekend',
            'I appreciate your help',
            'That sounds wonderful',
            // 명언
            'The only way to do great work is to love what you do',
            'In the middle of every difficulty lies opportunity',
            'It does not matter how slowly you go as long as you do not stop',
            'The future belongs to those who believe in the beauty of their dreams',
            'Success is not final failure is not fatal it is the courage to continue that counts',
            'Believe you can and you are halfway there',
            'Life is what happens when you are busy making other plans',
            'The best time to plant a tree was twenty years ago the second best time is now',
            'An investment in knowledge pays the best interest',
            'The only limit to our realization of tomorrow is our doubts of today',
            // 기술/업무 관련
            'Please review the attached document and provide your feedback',
            'The meeting has been scheduled for tomorrow at ten in the morning',
            'Could you please send me the latest version of the report',
            'I will get back to you as soon as possible',
            'Let me know if you have any questions or concerns',
            'The project deadline has been moved to next Friday',
            'We need to discuss the budget for the upcoming quarter',
            'Thank you for your quick response and cooperation',
            // 문학/교양
            'To be or not to be that is the question',
            'It was the best of times it was the worst of times',
            'All animals are equal but some animals are more equal than others',
            'Not all those who wander are lost'
        ],
        beginner: {
            home: ['a', 's', 'd', 'f', 'j', 'k', 'l', ';', 'h', 'g'],
            consonant: ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
            vowel: ['a', 'e', 'i', 'o', 'u'],
            word: [
                // 기초 단어 (2-3글자)
                'hi', 'ok', 'yes', 'no', 'do', 'go', 'be', 'he', 'she', 'we',
                'it', 'is', 'am', 'are', 'was', 'can', 'may', 'let', 'try', 'ask',
                // 일상 단어 (4-5글자)
                'book', 'desk', 'home', 'work', 'play', 'read', 'help', 'talk', 'walk', 'time',
                'good', 'nice', 'fast', 'slow', 'high', 'love', 'like', 'look', 'stop', 'come',
                // 자주 쓰는 단어 (6글자+)
                'school', 'coffee', 'travel', 'family', 'friend', 'letter', 'garden', 'window', 'flower', 'button',
                'simple', 'little', 'people', 'before', 'mother', 'father', 'market', 'dinner', 'listen', 'finish'
            ]
        },
        special: {
            numbers: ['1234567890', '2024-01-01', 'Phone: 555-1234'],
            symbols: ['!@#$%^&*()', '[]{}()<>', '+-*/='],
            mixed: ['abc123!@#', '2024-01-01', 'email@test.com'],
            chunjiin: ['abc', 'def', 'ghi', 'jkl', 'mno']
        },
        standard: {
            words: {
                easy: ['hello', 'thank', 'love', 'happy', 'good'],
                medium: ['computer', 'internet', 'smartphone'],
                hard: ['information technology infrastructure']
            },
            sentences: {
                easy: ['Today is a beautiful day', 'I want to eat something delicious'],
                medium: ['Learning to code is very beneficial for personal growth'],
                hard: ['The rapid advancement of artificial intelligence technology is fundamentally transforming our daily lives']
            },
            paragraph: {
                easy: 'Spring has arrived. The warm sunshine is shining down.',
                medium: 'Learning to code is not easy. However, your skills will improve.',
                hard: 'Modern society is changing rapidly. Technological advancement has transformed our way of life.'
            }
        }
    }
};

// 다른 JavaScript 파일에서 사용할 수 있도록 전역으로 설정
if (typeof window !== 'undefined') {
    window.practiceTexts = practiceTexts;
} 