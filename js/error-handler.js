// 전역 에러 핸들러
class ErrorHandler {
    static init() {
        // JavaScript 에러 처리
        window.addEventListener('error', (event) => {
            const thirdPartyDomains = [
                'googlesyndication', 'adsbygoogle', 'pagead',
                'translate.googleapis.com', 'translate_http', 'extension://'
            ];

            // 외부 서비스·크로스 오리진 에러는 로깅 없이 무시
            if (!event.error && !event.message) {
                event.preventDefault();
                return;
            }
            if (event.filename && thirdPartyDomains.some(d => event.filename.includes(d))) {
                event.preventDefault();
                return;
            }

            console.error('JavaScript 에러:', event.error);
            console.error('에러 파일:', event.filename);
            console.error('에러 라인:', event.lineno);
            console.error('에러 열:', event.colno);

            // 개발 모드 console 메서드는 무시
            if (event.message && (event.message.includes('console.log') ||
                                 event.message.includes('console.warn') ||
                                 event.message.includes('console.info'))) {
                event.preventDefault();
                return;
            }

            // ResizeObserver 경고 무시
            if (event.message && event.message.includes('ResizeObserver loop limit exceeded')) {
                event.preventDefault();
                return;
            }

            window.Toast.show('예상치 못한 오류가 발생했습니다. 페이지를 새로고침 해주세요.', 'danger', 5000);
        });

        // Promise rejection 처리
        window.addEventListener('unhandledrejection', (event) => {
            console.error('처리되지 않은 Promise 거부:', event.reason);
            window.Toast.show('비동기 작업 중 오류가 발생했습니다.', 'warning', 4000);
        });

        // 네트워크 상태 감지
        window.addEventListener('online', () => {
            window.Toast.show('인터넷 연결이 복구되었습니다.', 'success');
        });

        window.addEventListener('offline', () => {
            window.Toast.show('인터넷 연결이 끊어졌습니다. 일부 기능이 제한될 수 있습니다.', 'warning', 5000);
        });
    }

    static handleAjaxError(xhr, status, error) {
        console.error('AJAX 에러:', { xhr, status, error });
        if (xhr.status === 0) {
            window.Toast.show('네트워크 연결을 확인해주세요.', 'danger');
        } else if (xhr.status === 404) {
            window.Toast.show('요청한 페이지를 찾을 수 없습니다.', 'warning');
        } else if (xhr.status >= 500) {
            window.Toast.show('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', 'danger');
        } else {
            window.Toast.show('요청 처리 중 오류가 발생했습니다.', 'warning');
        }
    }
}

window.ErrorHandler = ErrorHandler;
