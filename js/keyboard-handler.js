// 키보드 접근성 핸들러
class KeyboardAccessibilityHandler {
    constructor() {
        this.lastFocused = null;
    }

    init() {
        this.setupKeyboardShortcuts();
        this.setupSkipLinks();
        this.setupFocusManagement();
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + / : 포커스를 텍스트 영역으로 이동
            if ((e.ctrlKey || e.metaKey) && e.key === '/') {
                e.preventDefault();
                const textArea = document.getElementById('letter_count');
                if (textArea) {
                    textArea.focus();
                    appToast.show('텍스트 입력 영역으로 포커스가 이동했습니다', 'info', 2000);
                }
            }

            // ESC: 모달이나 드롭다운 닫기
            if (e.key === 'Escape') {
                const openModals = document.querySelectorAll('.modal.show');
                const openDropdowns = document.querySelectorAll('.dropdown-menu.show');
                
                if (openModals.length > 0) {
                    openModals[0].querySelector('[data-bs-dismiss="modal"]')?.click();
                } else if (openDropdowns.length > 0) {
                    document.body.click(); // 드롭다운 닫기
                }
            }

            // Alt + 숫자: 빠른 버튼 접근
            if (e.altKey && !isNaN(e.key) && e.key !== '0') {
                e.preventDefault();
                const buttonIndex = parseInt(e.key) - 1;
                const buttons = document.querySelectorAll('[data-transform], [data-action]');
                if (buttons[buttonIndex]) {
                    buttons[buttonIndex].focus();
                    buttons[buttonIndex].click();
                }
            }
        });
    }

    setupSkipLinks() {
        // 스킵 링크 동작 개선
        const skipLinks = document.querySelectorAll('.skip-link');
        skipLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const target = document.getElementById(targetId);
                
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    
                    // 포커스 가능한 요소인지 확인 후 포커스
                    if (target.tabIndex >= 0 || target.tagName === 'INPUT' || 
                        target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
                        target.focus();
                    } else {
                        // 포커스할 수 없는 요소면 tabindex 임시 추가
                        target.tabIndex = -1;
                        target.focus();
                        target.addEventListener('blur', () => {
                            target.removeAttribute('tabindex');
                        }, { once: true });
                    }
                }
            });
        });
    }

    setupFocusManagement() {
        // 포커스 트랩 관리
        const focusableSelectors = [
            'a[href]',
            'button:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            '[contenteditable="true"]',
            '[tabindex]:not([tabindex="-1"])'
        ].join(',');

        // 페이지 로드 시 첫 번째 포커스 가능한 요소 찾기
        document.addEventListener('DOMContentLoaded', () => {
            const firstFocusable = document.querySelector(focusableSelectors);
            if (firstFocusable && !document.activeElement || document.activeElement === document.body) {
                // 자동 포커스는 사용자 상호작용 후에만
                setTimeout(() => {
                    if (!document.activeElement || document.activeElement === document.body) {
                        firstFocusable.focus();
                    }
                }, 100);
            }
        });

        // 모달이 열릴 때 포커스 관리
        document.addEventListener('shown.bs.modal', (e) => {
            const modal = e.target;
            const firstFocusable = modal.querySelector(focusableSelectors);
            if (firstFocusable) {
                firstFocusable.focus();
            }
        });

        // 탭 키 탐색 시 시각적 피드백
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
        });

        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-navigation');
        });
    }
}

window.KeyboardAccessibilityHandler = KeyboardAccessibilityHandler;
