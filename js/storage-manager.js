/**
 * StorageManager 모듈 - 로컬 저장소 관리 및 자동 저장 기능
 * 텍스트 데이터, 설정, 사용자 기본 설정 등을 관리합니다.
 */
class StorageManager {
    constructor() {
        this.storagePrefix = 'letterCount_';
        this.autoSaveDelay = 1000; // 1초 지연
        this.autoSaveTimer = null;
        
        // 저장소 키 상수
        this.KEYS = {
            DRAFT_DATA: 'letterCountData',
            TEXTAREA_HEIGHT: 'letterCountTextAreaHeight',
            USER_PREFERENCES: 'userPreferences',
            THEME: 'theme',
            TYPING_RECORDS: 'typingRecords',
            CALCULATION_HISTORY: 'calculationHistory'
        };
    }

    /**
     * 데이터 저장 (자동 저장과 수동 저장 지원)
     * @param {string} key - 저장소 키
     * @param {*} data - 저장할 데이터
     * @param {boolean} prefixed - 접두사 사용 여부
     * @returns {boolean} 저장 성공 여부
     */
    save(key, data, prefixed = true) {
        try {
            const storageKey = prefixed ? this.storagePrefix + key : key;
            const serializedData = JSON.stringify(data);
            localStorage.setItem(storageKey, serializedData);
            return true;
        } catch (error) {
            console.error('저장 실패:', error);
            this.handleStorageError(error);
            return false;
        }
    }

    /**
     * 데이터 로드
     * @param {string} key - 저장소 키
     * @param {*} defaultValue - 기본값
     * @param {boolean} prefixed - 접두사 사용 여부
     * @returns {*} 로드된 데이터 또는 기본값
     */
    load(key, defaultValue = null, prefixed = true) {
        try {
            const storageKey = prefixed ? this.storagePrefix + key : key;
            const serializedData = localStorage.getItem(storageKey);
            
            if (serializedData === null) {
                return defaultValue;
            }
            
            return JSON.parse(serializedData);
        } catch (error) {
            console.error('로드 실패:', error);
            return defaultValue;
        }
    }

    /**
     * 데이터 삭제
     * @param {string} key - 저장소 키
     * @param {boolean} prefixed - 접두사 사용 여부
     */
    remove(key, prefixed = true) {
        try {
            const storageKey = prefixed ? this.storagePrefix + key : key;
            localStorage.removeItem(storageKey);
        } catch (error) {
            console.error('삭제 실패:', error);
        }
    }

    /**
     * 텍스트 자동 저장
     * @param {string} text - 저장할 텍스트
     * @param {boolean} immediate - 즉시 저장 여부
     */
    autoSaveText(text, immediate = false) {
        // 기존 타이머 클리어
        if (this.autoSaveTimer) {
            clearTimeout(this.autoSaveTimer);
        }

        const saveAction = () => {
            const saveData = {
                draft: text,
                timestamp: Date.now(),
                lastModified: new Date().toISOString(),
                wordCount: window.textAnalyzer ? window.textAnalyzer.countWords(text) : 0,
                charCount: window.textAnalyzer ? window.textAnalyzer.countCharacters(text, false) : 0
            };
            
            const success = this.save(this.KEYS.DRAFT_DATA, saveData);
            
            if (success) {
                this.showSaveIndicator();
                // 자동 저장 이벤트 발생
                this.dispatchEvent('textAutoSaved', { text, saveData });
            }
        };

        if (immediate) {
            saveAction();
        } else {
            this.autoSaveTimer = setTimeout(saveAction, this.autoSaveDelay);
        }
    }

    /**
     * 저장된 텍스트 복원
     * @returns {Object|null} 복원된 데이터
     */
    restoreText() {
        const savedData = this.load(this.KEYS.DRAFT_DATA);
        
        if (savedData && savedData.draft) {
            // 저장된 지 너무 오래되었는지 확인 (30일)
            const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
            if (savedData.timestamp && savedData.timestamp < thirtyDaysAgo) {
                // console.log('저장된 데이터가 오래되어 복원하지 않습니다.');
                return null;
            }
            
            return savedData;
        }
        
        return null;
    }

    /**
     * 텍스트 영역 높이 저장
     * @param {string} height - CSS 높이 값
     */
    saveTextAreaHeight(height) {
        this.save(this.KEYS.TEXTAREA_HEIGHT, height);
    }

    /**
     * 텍스트 영역 높이 복원
     * @returns {string|null} 저장된 높이값
     */
    restoreTextAreaHeight() {
        return this.load(this.KEYS.TEXTAREA_HEIGHT);
    }

    /**
     * 사용자 기본 설정 저장
     * @param {Object} preferences - 사용자 설정 객체
     */
    saveUserPreferences(preferences) {
        const currentPrefs = this.load(this.KEYS.USER_PREFERENCES, {});
        const updatedPrefs = { ...currentPrefs, ...preferences };
        this.save(this.KEYS.USER_PREFERENCES, updatedPrefs);
    }

    /**
     * 사용자 기본 설정 로드
     * @returns {Object} 사용자 설정
     */
    loadUserPreferences() {
        return this.load(this.KEYS.USER_PREFERENCES, {
            theme: 'auto',
            autoSave: true,
            showStats: true,
            fontSize: 'medium',
            language: 'ko'
        });
    }

    /**
     * 계산 기록 저장 (연봉, 4대보험 등)
     * @param {string} type - 계산 유형
     * @param {Object} data - 계산 데이터
     */
    saveCalculationHistory(type, data) {
        const history = this.load(this.KEYS.CALCULATION_HISTORY, {});
        
        if (!history[type]) {
            history[type] = [];
        }
        
        const record = {
            ...data,
            timestamp: Date.now(),
            date: new Date().toISOString()
        };
        
        history[type].unshift(record);
        
        // 최대 50개 기록만 유지
        if (history[type].length > 50) {
            history[type] = history[type].slice(0, 50);
        }
        
        this.save(this.KEYS.CALCULATION_HISTORY, history);
    }

    /**
     * 계산 기록 로드
     * @param {string} type - 계산 유형
     * @returns {Array} 계산 기록 배열
     */
    loadCalculationHistory(type) {
        const history = this.load(this.KEYS.CALCULATION_HISTORY, {});
        return history[type] || [];
    }

    /**
     * 타자 연습 기록 저장
     * @param {Object} record - 타자 연습 기록
     */
    saveTypingRecord(record) {
        const records = this.load(this.KEYS.TYPING_RECORDS, []);
        
        const typingRecord = {
            ...record,
            timestamp: Date.now(),
            date: new Date().toISOString()
        };
        
        records.unshift(typingRecord);
        
        // 최대 100개 기록만 유지
        if (records.length > 100) {
            records.splice(100);
        }
        
        this.save(this.KEYS.TYPING_RECORDS, records);
    }

    /**
     * 타자 연습 기록 로드
     * @returns {Array} 타자 연습 기록 배열
     */
    loadTypingRecords() {
        return this.load(this.KEYS.TYPING_RECORDS, []);
    }

    /**
     * 저장소 정리 (오래된 데이터 삭제)
     * @param {number} daysOld - 삭제할 데이터의 나이 (일 단위)
     */
    cleanup(daysOld = 30) {
        const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
        
        try {
            // 타자 연습 기록 정리
            const typingRecords = this.load(this.KEYS.TYPING_RECORDS, []);
            const cleanedTyping = typingRecords.filter(record => 
                record.timestamp > cutoffTime
            );
            this.save(this.KEYS.TYPING_RECORDS, cleanedTyping);
            
            // 계산 기록 정리
            const calcHistory = this.load(this.KEYS.CALCULATION_HISTORY, {});
            Object.keys(calcHistory).forEach(type => {
                calcHistory[type] = calcHistory[type].filter(record => 
                    record.timestamp > cutoffTime
                );
            });
            this.save(this.KEYS.CALCULATION_HISTORY, calcHistory);
            
            console.log(`${daysOld}일 이상된 데이터 정리 완료`);
        } catch (error) {
            console.error('데이터 정리 중 오류:', error);
        }
    }

    /**
     * 저장소 사용량 확인
     * @returns {Object} 저장소 사용량 정보
     */
    getStorageInfo() {
        try {
            let totalSize = 0;
            let itemCount = 0;
            const sizes = {};
            
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    const size = localStorage[key].length;
                    totalSize += size;
                    itemCount++;
                    
                    if (key.startsWith(this.storagePrefix)) {
                        sizes[key] = size;
                    }
                }
            }
            
            return {
                totalSizeKB: (totalSize / 1024).toFixed(2),
                itemCount,
                appSizes: sizes,
                available: this.checkStorageAvailable()
            };
        } catch (error) {
            console.error('저장소 정보 확인 실패:', error);
            return null;
        }
    }

    /**
     * 저장소 사용 가능 여부 확인
     * @returns {boolean} 사용 가능 여부
     */
    checkStorageAvailable() {
        try {
            const testKey = this.storagePrefix + 'test';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * 저장 인디케이터 표시
     */
    showSaveIndicator() {
        const saveIndicator = document.getElementById('save-indicator');
        if (saveIndicator) {
            saveIndicator.classList.remove('d-none');
            saveIndicator.classList.add('animate-fadeIn');
            
            // 2초 후 숨기기
            setTimeout(() => {
                saveIndicator.classList.add('d-none');
                saveIndicator.classList.remove('animate-fadeIn');
            }, 2000);
        }
    }

    /**
     * 저장소 오류 처리
     * @param {Error} error - 오류 객체
     */
    handleStorageError(error) {
        if (error.name === 'QuotaExceededError') {
            // 저장소 용량 초과
            console.warn('로컬 저장소 용량이 부족합니다.');
            
            if (window.Toast) {
                Toast.show('저장소 용량이 부족합니다. 오래된 데이터를 정리합니다.', 'warning', 5000);
            }
            
            // 자동으로 오래된 데이터 정리
            this.cleanup(7); // 7일 이상된 데이터 삭제
        }
    }

    /**
     * 커스텀 이벤트 발생
     * @param {string} eventName - 이벤트 이름
     * @param {*} detail - 이벤트 세부정보
     */
    dispatchEvent(eventName, detail) {
        const event = new CustomEvent(eventName, { detail });
        document.dispatchEvent(event);
    }

    /**
     * 전체 앱 데이터 내보내기
     * @returns {Object} 모든 저장된 데이터
     */
    exportAllData() {
        const exportData = {};
        
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key) && key.startsWith(this.storagePrefix)) {
                try {
                    exportData[key] = JSON.parse(localStorage[key]);
                } catch (error) {
                    exportData[key] = localStorage[key];
                }
            }
        }
        
        return {
            exported: new Date().toISOString(),
            version: '1.0',
            data: exportData
        };
    }

    /**
     * 데이터 가져오기
     * @param {Object} importData - 가져올 데이터
     * @returns {boolean} 성공 여부
     */
    importData(importData) {
        try {
            if (!importData.data) {
                throw new Error('잘못된 데이터 형식입니다.');
            }
            
            for (let key in importData.data) {
                localStorage.setItem(key, JSON.stringify(importData.data[key]));
            }
            
            return true;
        } catch (error) {
            console.error('데이터 가져오기 실패:', error);
            return false;
        }
    }
}

// 전역 인스턴스 생성
window.storageManager = new StorageManager();