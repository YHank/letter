// This file is responsible for WPM calculation, accuracy,
// level system, achievements, and practice records.
// console.log("typingStats.js loaded");

// Assumes StorageUtils is globally available (from utils.js)
// Assumes showAchievementNotification is globally available or will be moved to typingUI.js

const TypingStats = {
    config: null, // To be populated with typingConfig from gameLogic or main

    practiceRecords: {
        save: function(mode, wpm, accuracy, lang) { // Added lang
            const records = this.load();
            const record = {
                mode: mode,
                wpm: wpm,
                accuracy: accuracy,
                lang: lang, // Store language
                date: new Date().toISOString()
            };
            records.push(record);
            if (records.length > 100) {
                records.shift();
            }
            StorageUtils.save('typingPracticeRecords', records);
        },
        load: function() {
            return StorageUtils.load('typingPracticeRecords', []);
        },
        getBestWPM: function(mode, lang) { // Added lang
            const records = this.load();
            const modeRecords = records.filter(r => r.mode === mode && r.lang === lang);
            if (modeRecords.length === 0) return 0;
            return Math.max(...modeRecords.map(r => r.wpm));
        },
        getAverageWPM: function(mode, lang) { // Added lang
            const records = this.load();
            const modeRecords = records.filter(r => r.mode === mode && r.lang === lang);
            if (modeRecords.length === 0) return 0;
            const sum = modeRecords.reduce((acc, r) => acc + r.wpm, 0);
            return Math.round(sum / modeRecords.length);
        },
        getTotalCount: function() {
            return this.load().length;
        }
    },

    achievementSystem: {
        getUnlocked: function() {
            return StorageUtils.load('typingAchievements', []);
        },
        unlock: function(achievementId) {
            const unlocked = this.getUnlocked();
            if (!unlocked.includes(achievementId)) {
                unlocked.push(achievementId);
                StorageUtils.save('typingAchievements', unlocked);

                const achievement = TypingStats.config ? TypingStats.config.achievements.find(a => a.id === achievementId) : null;
                if (achievement && typeof showAchievementNotification === 'function') { // showAchievementNotification will be in typingUI
                    showAchievementNotification(achievement);
                }
                return true;
            }
            return false;
        },
        checkAchievements: function(wpm, accuracy, mode, lang) { // Added lang
            if (!TypingStats.config) {
                console.error("TypingStats.config not initialized for checkAchievements");
                return;
            }
            const records = TypingStats.practiceRecords.load();
            const totalCount = records.length; // Overall total count

            if (totalCount === 1) {
                this.unlock('first_practice');
            }
            if (accuracy === 100) {
                this.unlock('perfect_accuracy');
            }
            // WPM achievements might need to be language/mode specific if desired
            if (wpm >= 400) { // This threshold might need adjustment based on lang
                this.unlock('speed_demon');
            }
            if (totalCount >= 10) {
                this.unlock('consistent_player');
            }
            if (totalCount >= 50) {
                this.unlock('marathon_runner');
            }

            const langSpecificRecords = records.filter(r => r.mode === mode && r.lang === lang);
            const bestWPMLangSpecific = Math.max(0, ...langSpecificRecords.map(r => r.wpm));

            if (langSpecificRecords.length > 1 && wpm > bestWPMLangSpecific * 1.1 && wpm > langSpecificRecords.sort((a,b) => b.date.localeCompare(a.date))[1].wpm * 1.1) {
                 // Check against the true previous best for that mode/lang
                 const allWpmsForModeLang = langSpecificRecords.map(r => r.wpm).sort((a,b) => b-a);
                 if (allWpmsForModeLang.length > 1 && wpm > allWpmsForModeLang[1] * 1.1 && wpm === allWpmsForModeLang[0]){
                    this.unlock('improvement');
                 }
            }
        }
    },

    getUserLevel: function(wpm) {
        if (!TypingStats.config) {
            console.error("TypingStats.config not initialized for getUserLevel");
            return { name: 'N/A', minWPM: 0, color: 'secondary' };
        }
        const levels = TypingStats.config.levels;
        for (let i = levels.length - 1; i >= 0; i--) {
            if (wpm >= levels[i].minWPM) {
                return levels[i];
            }
        }
        return levels[0];
    },

    // WPM and Accuracy Calculation
    // This function will be called by gameLogic during typing and at the end.
    calculateWPMAndAccuracy: function(charactersTyped, errorCount, elapsedTimeMillis, currentLang) {
        const elapsedMinutes = elapsedTimeMillis / 60000;
        let wpm = 0;

        // WPM Calculation Notes:
        // English: Standard WPM is (characters typed / 5) / minutes.
        // Korean: "타수" (ta/min) is often used. A common heuristic is (completed Hangul characters * 2.5 or * 3) / minutes.
        //         This is because a Hangul character can involve multiple keystrokes.
        //         More accurate Korean WPM might involve:
        //         1. Counting actual keystrokes if input method complexity is considered.
        //         2. Using a library that understands Hangul syllable composition for a more precise "effective characters" count.
        // For simplicity here, we'll use a basic approach and note improvements.

        if (elapsedMinutes > 0) {
            if (currentLang === 'korean') {
                // Placeholder for Korean "타수" (타/분).
                // charactersTyped here represents completed Hangul characters.
                // A common heuristic is to multiply by a factor (e.g., 2.0 to 3.0) to approximate keystrokes or complexity.
                // Let's use 2.5 as a rough estimate.
                wpm = Math.round((charactersTyped * 2.5) / elapsedMinutes);
                // console.log(`Korean WPM (타수): chars=${charactersTyped}, factor=2.5, mins=${elapsedMinutes.toFixed(2)}, wpm=${wpm}`);
            } else { // Assuming English or other languages where char count is more direct
                // This is effectively Characters Per Minute (CPM).
                // To get WPM (Words Per Minute), typically CPM / 5 for English.
                // We will return CPM, and UI can decide to show it as CPM or WPM (CPM/5).
                // For this stats module, let's stick to a consistent "score" that can be compared.
                // If we want to call it "WPM" universally, then English needs adjustment.
                // Let's assume 'charactersTyped' for English is analogous to "words" of 5 chars.
                 wpm = Math.round((charactersTyped / 5) / elapsedMinutes);
                // console.log(`English WPM: chars=${charactersTyped}, effective_words=${charactersTyped/5}, mins=${elapsedMinutes.toFixed(2)}, wpm=${wpm}`);
            }
        }

        const totalAttempts = charactersTyped + errorCount;
        const accuracy = totalAttempts > 0 ? Math.round((charactersTyped / totalAttempts) * 100) : 100;

        return { wpm, accuracy };
    },

    // Call this to initialize TypingStats with the main config
    initialize: function(typingConfig) {
        this.config = typingConfig;
        // console.log("TypingStats initialized with config.");
    }
};

// Example of how it might be initialized from another file:
// TypingStats.initialize(typingConfigFromGameLogic);
// window.TypingStats = TypingStats; // If needed globally and not using modules
