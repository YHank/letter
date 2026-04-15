// 모바일 터치 인터페이스 개선
class MobileTouchHandler {
    constructor() {
        this.textArea = null;
        this.dragIndicator = null;
        this.isDragging = false;
        this.startY = 0;
        this.startHeight = 0;
        this.minHeight = 150;
        this.maxHeight = 600;
    }

    init() {
        this.textArea = document.getElementById('letter_count');
        this.dragIndicator = document.querySelector('.mobile-drag-indicator');
        
        if (!this.textArea || !this.dragIndicator) return;

        // 모바일 감지
        const isMobile = window.innerWidth <= 768;
        if (!isMobile) return;

        this.setupTouchEvents();
    }

    setupTouchEvents() {
        // 드래그 인디케이터 터치 이벤트
        this.dragIndicator.addEventListener('touchstart', (e) => {
            this.isDragging = true;
            this.startY = e.touches[0].clientY;
            this.startHeight = parseInt(window.getComputedStyle(this.textArea).height);
            
            // 드래그 시작 피드백
            this.dragIndicator.style.background = 'var(--btn-primary-bg)';
            document.body.style.userSelect = 'none';
            
            e.preventDefault();
        });

        document.addEventListener('touchmove', (e) => {
            if (!this.isDragging) return;
            
            const currentY = e.touches[0].clientY;
            const deltaY = currentY - this.startY;
            const newHeight = Math.max(
                this.minHeight, 
                Math.min(this.maxHeight, this.startHeight + deltaY)
            );
            
            this.textArea.style.height = newHeight + 'px';
            e.preventDefault();
        });

        document.addEventListener('touchend', () => {
            if (!this.isDragging) return;
            
            this.isDragging = false;
            this.dragIndicator.style.background = 'var(--border-color)';
            document.body.style.userSelect = '';
            
            // 터치 종료 피드백
            this.dragIndicator.style.transform = 'scale(1.1)';
            setTimeout(() => {
                this.dragIndicator.style.transform = 'scale(1)';
            }, 150);
        });

        // 텍스트 영역 터치 최적화
        this.textArea.addEventListener('touchstart', () => {
            // 터치 시작 시 포커스 보장
            setTimeout(() => {
                this.textArea.focus();
            }, 100);
        });

        // 더블 탭으로 텍스트 영역 크기 토글
        let lastTap = 0;
        this.dragIndicator.addEventListener('touchend', (e) => {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            
            if (tapLength < 500 && tapLength > 0) {
                // 더블 탭 감지
                this.toggleTextAreaSize();
                e.preventDefault();
            }
            lastTap = currentTime;
        });
    }

    toggleTextAreaSize() {
        const currentHeight = parseInt(window.getComputedStyle(this.textArea).height);
        const isCompact = currentHeight <= 200;
        
        const newHeight = isCompact ? 400 : 150;
        this.textArea.style.height = newHeight + 'px';
        
        // 토글 피드백
        appToast.show(
            isCompact ? '텍스트 영역을 확장했습니다' : '텍스트 영역을 축소했습니다', 
            'info', 
            2000
        );
    }
}

window.MobileTouchHandler = MobileTouchHandler;
