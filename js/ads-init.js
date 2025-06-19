/**
 * 광고 초기화 스크립트
 * Google AdSense 광고를 안전하게 초기화합니다.
 */

// 광고 초기화 플래그
let adsInitialized = false;

// 광고 초기화 함수
window.initializeAds = function() {
    // 이미 초기화된 경우 건너뛰기
    if (adsInitialized) {
        return;
    }
    
    // 모든 광고 슬롯 찾기
    const adSlots = document.querySelectorAll('.adsbygoogle');
    
    adSlots.forEach(slot => {
        // 이미 광고가 로드된 경우 건너뛰기
        if (slot.getAttribute('data-adsbygoogle-status') || 
            slot.getAttribute('data-ad-status') ||
            slot.children.length > 0) {
            return;
        }
        
        try {
            // 광고 로드
            (adsbygoogle = window.adsbygoogle || []).push({});
        } catch (error) {
            // 광고 오류는 무시 (콘솔에만 표시)
            if (console && console.warn) {
                console.warn('광고 로드 중 오류:', error);
            }
        }
    });
    
    adsInitialized = true;
}

// DOM이 로드된 후 광고 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAds);
} else {
    // 이미 DOM이 로드된 경우
    setTimeout(initializeAds, 100); // 약간의 지연을 추가
}