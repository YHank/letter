/**
 * PWA 기능 관리 모듈
 * Service Worker 등록, 앱 설치 프롬프트, 업데이트 알림 등을 처리
 */

class PWAManager {
    constructor() {
        this.deferredPrompt = null;
        this.isInstalled = false;
        this.swRegistration = null;
        
        // 설치 상태 확인
        this.checkInstallStatus();
    }

    /**
     * PWA 기능 초기화
     */
    init() {
        this.registerServiceWorker();
        this.setupInstallPrompt();
        this.setupUpdateNotification();
        this.addInstallButton();
        
        return this;
    }

    /**
     * Service Worker 등록
     */
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                this.swRegistration = await navigator.serviceWorker.register('/sw.js', {
                    scope: '/'
                });
                
                // console.log('Service Worker 등록 성공:', this.swRegistration.scope);
                
                // 업데이트 확인
                this.swRegistration.addEventListener('updatefound', () => {
                    this.handleServiceWorkerUpdate();
                });
                
                // 토스트 알림 표시
                if (window.Toast) {
                    Toast.show('오프라인 지원이 활성화되었습니다', 'success', 3000);
                }
                
            } catch (error) {
                console.error('Service Worker 등록 실패:', error);
                
                if (window.Toast) {
                    Toast.show('오프라인 기능을 사용할 수 없습니다', 'warning', 3000);
                }
            }
        } else {
            // console.log('Service Worker를 지원하지 않는 브라우저입니다');
        }
    }

    /**
     * 앱 설치 프롬프트 설정
     */
    setupInstallPrompt() {
        // beforeinstallprompt 이벤트 처리
        window.addEventListener('beforeinstallprompt', (e) => {
            // console.log('앱 설치 프롬프트 준비됨');
            
            // 기본 프롬프트 방지
            e.preventDefault();
            
            // 나중에 사용하기 위해 이벤트 저장
            this.deferredPrompt = e;
            
            // 설치 버튼 표시
            this.showInstallButton();
        });

        // 앱 설치 완료 후
        window.addEventListener('appinstalled', () => {
            // console.log('앱 설치 완료');
            this.isInstalled = true;
            this.hideInstallButton();
            
            if (window.Toast) {
                Toast.show('앱이 성공적으로 설치되었습니다! 홈 화면에서 확인하세요.', 'success', 5000);
            }
        });
    }

    /**
     * Service Worker 업데이트 처리
     */
    handleServiceWorkerUpdate() {
        const newWorker = this.swRegistration.installing;
        
        newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // console.log('새로운 버전이 사용 가능합니다');
                this.showUpdateNotification();
            }
        });
    }

    /**
     * 업데이트 알림 표시
     */
    showUpdateNotification() {
        const updateBanner = document.createElement('div');
        updateBanner.id = 'update-banner';
        updateBanner.className = 'alert alert-info alert-dismissible fade show position-fixed bottom-0 start-0 end-0 m-3';
        updateBanner.style.zIndex = '1060';
        updateBanner.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fas fa-download me-2"></i>
                <div class="flex-grow-1">
                    <strong>새로운 업데이트가 있습니다!</strong>
                    <div class="small text-muted">더 나은 성능과 새로운 기능을 이용하려면 새로고침하세요.</div>
                </div>
                <button type="button" class="btn btn-sm btn-primary me-2" onclick="window.pwaManager.applyUpdate()">
                    업데이트
                </button>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        document.body.appendChild(updateBanner);
        
        // 5초 후 자동으로 사라지도록 (사용자가 닫지 않으면)
        setTimeout(() => {
            if (document.getElementById('update-banner')) {
                updateBanner.remove();
            }
        }, 15000);
    }

    /**
     * 업데이트 적용
     */
    async applyUpdate() {
        if (this.swRegistration && this.swRegistration.waiting) {
            // 새로운 Service Worker에게 메시지 전송
            this.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
            
            // 페이지 새로고침
            window.location.reload();
        }
    }

    /**
     * 설치 버튼 추가
     */
    addInstallButton() {
        // 이미 설치되어 있거나 iOS Safari인 경우 건너뛰기
        if (this.isInstalled || this.isIOSSafari()) {
            return;
        }

        const installButton = document.createElement('button');
        installButton.id = 'install-app-button';
        installButton.className = 'btn btn-outline-primary btn-sm position-fixed';
        installButton.style.cssText = 'top: 70px; right: 20px; z-index: 1050; display: none;';
        installButton.innerHTML = '<i class="fas fa-download me-1"></i>앱 설치';
        installButton.title = '홈 화면에 앱으로 설치';
        
        installButton.addEventListener('click', () => {
            this.showInstallPrompt();
        });
        
        document.body.appendChild(installButton);
    }

    /**
     * 설치 버튼 표시
     */
    showInstallButton() {
        const installButton = document.getElementById('install-app-button');
        if (installButton && !this.isInstalled) {
            installButton.style.display = 'block';
            
            // 애니메이션 효과
            installButton.style.opacity = '0';
            installButton.style.transform = 'translateY(-10px)';
            
            setTimeout(() => {
                installButton.style.transition = 'all 0.3s ease';
                installButton.style.opacity = '1';
                installButton.style.transform = 'translateY(0)';
            }, 100);
        }
    }

    /**
     * 설치 버튼 숨기기
     */
    hideInstallButton() {
        const installButton = document.getElementById('install-app-button');
        if (installButton) {
            installButton.style.display = 'none';
        }
    }

    /**
     * 설치 프롬프트 표시
     */
    async showInstallPrompt() {
        if (!this.deferredPrompt) {
            if (window.Toast) {
                Toast.show('현재 브라우저에서는 앱 설치를 지원하지 않습니다', 'warning', 4000);
            }
            return;
        }

        try {
            // 설치 프롬프트 표시
            this.deferredPrompt.prompt();
            
            // 사용자 선택 결과 대기
            const { outcome } = await this.deferredPrompt.userChoice;
            
            // console.log('설치 프롬프트 결과:', outcome);
            
            if (outcome === 'accepted') {
                // console.log('사용자가 앱 설치를 승인했습니다');
            } else {
                // console.log('사용자가 앱 설치를 거부했습니다');
            }
            
            // 프롬프트 재사용 불가하므로 null로 설정
            this.deferredPrompt = null;
            this.hideInstallButton();
            
        } catch (error) {
            console.error('설치 프롬프트 표시 실패:', error);
        }
    }

    /**
     * 업데이트 알림 설정
     */
    setupUpdateNotification() {
        // 페이지 가시성 변경 시 업데이트 확인
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.swRegistration) {
                this.swRegistration.update();
            }
        });
        
        // 주기적 업데이트 확인 (30분마다)
        setInterval(() => {
            if (this.swRegistration) {
                this.swRegistration.update();
            }
        }, 30 * 60 * 1000);
    }

    /**
     * 설치 상태 확인
     */
    checkInstallStatus() {
        // PWA 설치 상태 확인
        if (window.matchMedia('(display-mode: standalone)').matches || 
            window.navigator.standalone === true) {
            this.isInstalled = true;
            // console.log('PWA가 설치된 상태로 실행 중');
        }
    }

    /**
     * iOS Safari 여부 확인
     */
    isIOSSafari() {
        const ua = window.navigator.userAgent;
        const iOS = /iPad|iPhone|iPod/.test(ua);
        const webkit = /WebKit/.test(ua);
        return iOS && webkit && !/(CriOS|FxiOS|OPiOS|mercury)/.test(ua);
    }

    /**
     * 오프라인 상태 확인
     */
    isOffline() {
        return !navigator.onLine;
    }

    /**
     * 네트워크 상태 모니터링
     */
    setupNetworkMonitoring() {
        window.addEventListener('online', () => {
            // console.log('온라인 상태로 변경됨');
            if (window.Toast) {
                Toast.show('인터넷 연결이 복구되었습니다', 'success', 3000);
            }
        });

        window.addEventListener('offline', () => {
            // console.log('오프라인 상태로 변경됨');
            if (window.Toast) {
                Toast.show('오프라인 모드입니다. 기본 기능은 계속 사용할 수 있습니다', 'info', 5000);
            }
        });
    }

    /**
     * PWA 정보 반환
     */
    getInfo() {
        return {
            isInstalled: this.isInstalled,
            isOnline: navigator.onLine,
            hasServiceWorker: 'serviceWorker' in navigator,
            canInstall: !!this.deferredPrompt,
            swRegistration: this.swRegistration
        };
    }
}

// 전역 인스턴스 생성
window.pwaManager = new PWAManager();