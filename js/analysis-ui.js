// 고급 분석 UI 모듈
(function() {
    function setupAdvancedAnalysis() {
        // 고급 분석 표시/숨기기 버튼
        DOMUtils.addEvent('#show-advanced-analysis', 'click', function() {
            const section = DOMUtils.getElement('#advanced-analysis-section');
            const btnContainer = DOMUtils.getElement('#show-advanced-analysis-btn');
            if (section && btnContainer) {
                section.style.display = 'block';
                btnContainer.style.display = 'none';

                // 자동으로 분석 실행 (텍스트가 있는 경우)
                const letterCountElement = DOMUtils.getElement('#letter_count');
                if (letterCountElement && letterCountElement.innerText.trim()) {
                    performAdvancedAnalysis();
                }
            }
        });

        // 고급 분석 숨기기 버튼
        DOMUtils.addEvent('#toggle-advanced-analysis', 'click', function() {
            const section = DOMUtils.getElement('#advanced-analysis-section');
            const btnContainer = DOMUtils.getElement('#show-advanced-analysis-btn');
            if (section && btnContainer) {
                section.style.display = 'none';
                btnContainer.style.display = 'block';
            }
        });

        // 상세 분석 실행 버튼
        DOMUtils.addEvent('#perform-advanced-analysis', 'click', function() {
            performAdvancedAnalysis();
        });

        // 텍스트 입력 시 고급 분석 버튼 활성화
        DOMUtils.addEvent('#letter_count', 'input', debounce(function() {
            const button = DOMUtils.getElement('#perform-advanced-analysis');
            const letterCountEl = DOMUtils.getElement('#letter_count');
            const text = letterCountEl ? letterCountEl.innerText.trim() : '';

            if (button) {
                button.disabled = text.length < 10; // 최소 10글자 이상

                // 고급 분석이 표시된 상태이고 충분한 텍스트가 있으면 자동 분석
                const section = DOMUtils.getElement('#advanced-analysis-section');
                if (section && section.style.display !== 'none' && text.length > 50) {
                    performAdvancedAnalysis();
                }
            }
        }, 1000));
    }

    function performAdvancedAnalysis() {
        const letterCountElement = DOMUtils.getElement('#letter_count');
        const text = letterCountElement ? letterCountElement.innerText.trim() : '';

        if (text.length < 10) {
            if (window.Toast) {
                window.Toast.show('분석하려면 최소 10글자 이상 입력해주세요', 'warning', 3000);
            }
            return;
        }

        if (!window.advancedAnalyzer) {
            console.error('고급 분석 모듈이 로드되지 않았습니다');
            return;
        }

        try {
            // 로딩 상태 표시
            showAnalysisLoading();

            // 분석 실행 (약간의 지연으로 로딩 효과)
            setTimeout(() => {
                const analysis = window.advancedAnalyzer.performAdvancedAnalysis(text);
                const formatted = window.advancedAnalyzer.formatAnalysisResults(analysis);

                // 결과 표시
                displaySentimentResult(formatted.sentiment);
                displayReadabilityResult(formatted.readability);
                displayWritingStyleResult(formatted.writingStyle);
                displayKeywordsResult(formatted.keywords);

                if (window.Toast) {
                    window.Toast.show('고급 텍스트 분석이 완료되었습니다', 'success', 3000);
                }
            }, 500);
        } catch (error) {
            console.error('고급 분석 중 오류:', error);
            if (window.Toast) {
                window.Toast.show('분석 중 오류가 발생했습니다', 'danger', 3000);
            }
        }
    }

    function showAnalysisLoading() {
        const containers = ['#sentiment-result', '#readability-result', '#writing-style-result', '#keywords-result'];

        containers.forEach(selector => {
            const container = DOMUtils.getElement(selector);
            if (container) {
                container.innerHTML = `
                    <div class="text-center">
                        <div class="spinner-border spinner-border-sm text-primary mb-2" role="status">
                            <span class="visually-hidden">분석 중...</span>
                        </div>
                        <p class="small text-muted mb-0">분석 중...</p>
                    </div>
                `;
            }
        });
    }

    function displaySentimentResult(sentiment) {
        const container = DOMUtils.getElement('#sentiment-result');
        if (!container) return;

        const emotionIcon = sentiment.label === '긍정적' ? 'fa-smile text-success' :
            sentiment.label === '부정적' ? 'fa-frown text-danger' :
            'fa-meh text-secondary';

        container.innerHTML = `
            <div class="text-center">
                <i class="fas ${emotionIcon} fa-2x mb-2"></i>
                <h5 class="h6 mb-1">${sentiment.label}</h5>
                <p class="small text-muted mb-2">${sentiment.description}</p>
                <div class="small">
                    <strong>신뢰도:</strong> ${sentiment.confidence}
                </div>
            </div>
        `;
    }

    function displayReadabilityResult(readability) {
        const container = DOMUtils.getElement('#readability-result');
        if (!container) return;

        const scoreColor = readability.score >= 80 ? 'success' :
            readability.score >= 60 ? 'warning' :
            'danger';

        container.innerHTML = `
            <div class="text-center">
                <div class="progress mb-3" style="height: 8px;">
                    <div class="progress-bar bg-${scoreColor}" style="width: ${readability.score}%"></div>
                </div>
                <h5 class="h6 mb-1">${readability.level}</h5>
                <p class="small text-muted mb-2">${readability.description}</p>
                <div class="small">
                    <strong>점수:</strong> ${readability.score}/100
                </div>
            </div>
        `;
    }

    function displayWritingStyleResult(style) {
        const container = DOMUtils.getElement('#writing-style-result');
        if (!container) return;

        container.innerHTML = `
            <div>
                <div class="mb-2">
                    <span class="badge bg-primary">${style.formality}</span>
                </div>
                <div class="mb-2">
                    <span class="badge bg-info">${style.tone}</span>
                </div>
                <div class="small text-muted">
                    <div>질문: ${style.features.questionCount}개</div>
                    <div>감탄: ${style.features.exclamationCount}개</div>
                    <div>복합문: ${Math.round(style.features.avgSentenceComplexity * 100)}%</div>
                </div>
            </div>
        `;
    }

    function displayKeywordsResult(keywords) {
        const container = DOMUtils.getElement('#keywords-result');
        if (!container) return;

        if (keywords.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted">
                    <i class="fas fa-info-circle mb-2"></i>
                    <p class="small">키워드를 찾을 수 없습니다</p>
                </div>
            `;
            return;
        }

        const keywordList = keywords.slice(0, 5).map(keyword => `
            <div class="d-flex justify-content-between align-items-center mb-1">
                <span class="small">${keyword.word}</span>
                <span class="badge bg-secondary">${keyword.frequency}</span>
            </div>
        `).join('');

        container.innerHTML = `
            <div class="keywords-list">
                ${keywordList}
                ${keywords.length > 5 ? `<div class="small text-muted text-center mt-2">+${keywords.length - 5}개 더</div>` : ''}
            </div>
        `;
    }

    window.analysisUI = {
        init: setupAdvancedAnalysis,
        setupAdvancedAnalysis,
        performAdvancedAnalysis,
        showAnalysisLoading,
        displaySentimentResult,
        displayReadabilityResult,
        displayWritingStyleResult,
        displayKeywordsResult
    };
})();
