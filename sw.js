/**
 * Service Worker - PWA 기능을 위한 캐시 및 오프라인 지원
 * 글자수 세기 웹앱의 핵심 기능을 오프라인에서도 사용할 수 있도록 함
 */

const CACHE_NAME = 'letter-counter-v13';
const STATIC_CACHE_NAME = 'letter-counter-static-v13';
const DYNAMIC_CACHE_NAME = 'letter-counter-dynamic-v13';

// 캐시할 정적 자원들
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/spellcheck/',
    '/salary/',
    '/typing-practice/',
    '/insurance-calculator/',
    '/severance-pay/',
    '/scientific-calculator/',
    '/css/index.css',
    '/js/utils.js',
    '/js/darkmode.js',
    '/js/text-analyzer.js',
    '/js/analysis-ui.js',
    '/js/navigation-manager.js',
    '/js/storage-manager.js',
    '/js/toast.js',
    '/js/error-handler.js',
    '/js/undo-redo.js',
    '/js/mobile-handler.js',
    '/js/keyboard-handler.js',
    '/js/index.js',
    '/js/i18n.js',
    '/i18n/ko.json',
    '/i18n/en.json',
    '/i18n/ja.json',
    '/i18n/zh.json',
    '/html/spellcheck_simple.html',
    '/html/typing_practice.html',
    '/html/salary.html',
    '/html/insurance_calculator.html',
    '/html/severancepay.html',
    '/html/scientific_calculator.html',
    '/js/spellcheck_rules.js',
    '/js/spellcheck_client.js',
    '/js/spellcheck_simple.js',
    '/js/typing_practice.js',
    '/js/practice_data.js',
    '/data/typing/manifest.json',
    '/data/typing/korean/free.json',
    '/data/typing/korean/beginner.json',
    '/data/typing/korean/special.json',
    '/data/typing/korean/standard.json',
    '/data/typing/english/free.json',
    '/data/typing/english/beginner.json',
    '/data/typing/english/special.json',
    '/data/typing/english/standard.json',
    '/js/salary_calculator.js',
    '/js/insurance_calculator.js',
    '/js/scientific_calculator.js',
    '/manifest.json'
];

// 외부 CDN 자원들 (온라인일 때만)
const EXTERNAL_RESOURCES = [
    'https://cdn.jsdelivr.net/',
    'https://ajax.googleapis.com/',
    'https://cdnjs.cloudflare.com/',
    'https://fonts.googleapis.com/',
    'https://fonts.gstatic.com/',
    'https://translate.google.com/',
    'https://www.gstatic.com/',
    'https://pagead2.googlesyndication.com/'
];

// Service Worker 설치
self.addEventListener('install', (event) => {
    console.log('Service Worker 설치 중...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE_NAME)
            .then((cache) => {
                console.log('정적 자원 캐싱 중...');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('Service Worker 설치 완료');
                return self.skipWaiting(); // 즉시 활성화
            })
            .catch((error) => {
                console.error('Service Worker 설치 실패:', error);
            })
    );
});

// Service Worker 활성화
self.addEventListener('activate', (event) => {
    console.log('Service Worker 활성화 중...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        // 이전 버전 캐시 삭제
                        if (cacheName !== STATIC_CACHE_NAME && 
                            cacheName !== DYNAMIC_CACHE_NAME) {
                            console.log('이전 캐시 삭제:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker 활성화 완료');
                return self.clients.claim(); // 즉시 제어 시작
            })
    );
});

// 네트워크 요청 가로채기
self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);
    
    // 외부 API는 항상 네트워크 사용 (Google Ads, 번역 등)
    if (EXTERNAL_RESOURCES.some(domain => url.href.includes(domain))) {
        event.respondWith(
            fetch(request).catch(() => {
                // 외부 리소스 실패 시 빈 응답 반환
                return new Response('', { status: 200 });
            })
        );
        return;
    }
    
    // 정적 자원에 대한 캐시 우선 전략
    if (STATIC_ASSETS.includes(url.pathname) || url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|webp|svg|ico|woff|woff2)$/)) {
        event.respondWith(
            // STATIC_ASSETS는 버전 쿼리 없이 등록되는데 실제 요청에는 ?N 캐시 버스터가
            // 붙는다. ignoreSearch 없이는 프리캐시가 통째로 미스 나므로 무시하고 매칭한다.
            // 버전을 올릴 때 CACHE 이름도 함께 올리면 activate 단계에서 구버전이 삭제된다.
            caches.match(request, { ignoreSearch: true })
                .then((response) => {
                    if (response) {
                        console.log('캐시에서 반환:', request.url);
                        return response;
                    }
                    
                    // 캐시에 없으면 네트워크에서 가져와서 캐시에 저장
                    return fetch(request)
                        .then((fetchResponse) => {
                            if (fetchResponse.status === 200) {
                                const responseClone = fetchResponse.clone();
                                caches.open(STATIC_CACHE_NAME)
                                    .then((cache) => {
                                        cache.put(request, responseClone);
                                    });
                            }
                            return fetchResponse;
                        })
                        .catch(() => {
                            // 네트워크 실패 시 기본 오프라인 페이지
                            return caches.match('/index.html');
                        });
                })
        );
        return;
    }
    
    // HTML 페이지에 대한 네트워크 우선 전략 (업데이트 반영을 위해)
    if ((request.headers.get('accept') || '').includes('text/html')) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // 네트워크 성공 시 캐시 업데이트
                    if (response.status === 200) {
                        const responseClone = response.clone();
                        caches.open(DYNAMIC_CACHE_NAME)
                            .then((cache) => {
                                cache.put(request, responseClone);
                            });
                    }
                    return response;
                })
                .catch(() => {
                    // 네트워크 실패 시 캐시에서 반환
                    return caches.match(request)
                        .then((response) => {
                            return response || caches.match('/index.html');
                        });
                })
        );
        return;
    }
    
    // 기타 요청은 기본 네트워크 처리
    event.respondWith(
        fetch(request).catch(() => {
            return caches.match(request);
        })
    );
});

// 백그라운드 동기화 (미래 기능용)
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
        console.log('백그라운드 동기화 실행');
        // 여기에 오프라인에서 생성된 데이터 동기화 로직 추가 가능
    }
});

// 푸시 알림 (미래 기능용)
self.addEventListener('push', (event) => {
    if (event.data) {
        const data = event.data.json();
        console.log('푸시 알림 수신:', data);
        
        const options = {
            body: data.body || '새로운 업데이트가 있습니다.',
            icon: '/img/logo.webp',
            badge: '/img/logo.webp',
            tag: 'letter-counter-notification',
            requireInteraction: false,
            actions: [
                {
                    action: 'open',
                    title: '열기'
                },
                {
                    action: 'close',
                    title: '닫기'
                }
            ]
        };
        
        event.waitUntil(
            self.registration.showNotification(data.title || '글자수 세기', options)
        );
    }
});

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.action === 'open') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// 오류 처리
self.addEventListener('error', (event) => {
    console.error('Service Worker 오류:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error('Service Worker Promise 거부:', event.reason);
});
