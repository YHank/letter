// Main orchestrator for Typing Practice
// console.log("typing_practice.js (orchestrator) loaded");

// Ensure GameLogic, TypingStats, TypingUI, and DOMUtils/StorageUtils (from utils.js) are loaded before this script.

// Global reference to the main state object, primarily managed by GameLogic
// This is for easier debugging or if some parts of UI still need quick access.
// However, direct manipulation should be avoided outside GameLogic.
let typingPracticeOrchestratorState = null; // Renamed to avoid conflict if old `typingPracticeState` is cached somewhere

// Main initialization function for the entire typing practice feature
function initializeTypingPracticeNew() {
    console.log('Main Typing Practice System Initialization...');

    // 1. Initialize GameLogic: This sets up initial state and config.
    // GameLogic.init also calls TypingStats.initialize internally.
    GameLogic.init();
    typingPracticeOrchestratorState = GameLogic.state;

    // 2. Initialize TypingUI: Pass GameLogic instance for callbacks.
    TypingUI.init(GameLogic);

    // 3. Setup specific event listeners that bridge UI actions to GameLogic
    // Most UI event listeners that trigger game logic are now inside TypingUI (like mode selection).
    // Event listeners for typing inputs are set up here as they directly call GameLogic handlers.

    const modes = ['free', 'beginner', 'special', 'standard'];
    modes.forEach(mode => {
        const inputElement = DOMUtils.getElement(`#${mode}-typing-input`);
        if (inputElement) {
            // Input event: For continuous typing modes
            inputElement.addEventListener('input', function() {
                if (GameLogic.state && GameLogic.state.currentMode === mode && GameLogic.state.isTyping) {
                    if (mode === 'beginner') {
                        GameLogic.handleCharacterTyped(this.value);
                        // TypingUI.clearBeginnerInput(); // UI should handle this internally if it's always done
                    } else {
                        // For free, special, standard - full line/text comparison is usually done on specific actions
                        // (like space, enter, or blur), not every input char for performance.
                        // However, the original handleTyping was called on input.
                        // We'll assume GameLogic.handleLineTyped is smart enough or adapted.
                        // For now, let's assume it is for free and special. Standard might need Enter.
                        if (mode === 'free' || mode === 'special') {
                            GameLogic.handleLineTyped(this.value);
                        }
                        // For 'standard', original code didn't call handleTyping on every input,
                        // but rather when the whole sentence/paragraph was supposed to be submitted (often implicitly via length check).
                        // Let's keep it simple for now: if it's 'standard', it might also try to process the line.
                        // The actual check against currentText happens in handleLineTyped.
                        else if (mode === 'standard') {
                             GameLogic.handleLineTyped(this.value);
                        }
                    }
                }
            });

            // Keydown event: For special key handling
            if (mode === 'beginner') {
                inputElement.addEventListener('keydown', function(e) {
                    if (GameLogic.state && GameLogic.state.currentMode === 'beginner' && GameLogic.state.isTyping) {
                        if (['Backspace', 'Enter', 'Tab', 'Delete'].includes(e.key)) {
                            e.preventDefault();
                        }
                    }
                });
            }
            // For standard mode, 'Enter' might submit or start practice
            if (mode === 'standard') {
                 inputElement.addEventListener('keydown', function(e) {
                    if (GameLogic.state && GameLogic.state.currentMode === 'standard' && e.key === 'Enter') {
                        if (!GameLogic.state.isTyping) {
                            // If not typing, Enter could mean "Start Practice"
                            const startButton = DOMUtils.getElement('#standard-start-btn');
                            if (startButton && startButton.style.display !== 'none') {
                                startButton.click(); // Simulate click on start button
                            }
                        } else {
                            // If typing, Enter could mean "submit line/paragraph"
                            // This logic should be in GameLogic.handleLineTyped or a specific submit function
                            GameLogic.handleLineTyped(this.value, true); // Pass a flag indicating submission
                        }
                    }
                });
            }
        }

        // Start buttons for each mode
        // TypingUI's setupGlobalEventListeners now handles mode selection clicks, which calls GameLogic.selectMode.
        // GameLogic.selectMode should then call TypingUI to display the correct practice area.
        // The start buttons within those areas need to trigger GameLogic.startPractice.
        const startButton = DOMUtils.getElement(`#${mode}-start-btn`) || DOMUtils.getElement(`#start-${mode}-practice`);
        if (startButton) {
            startButton.addEventListener('click', () => {
                if (!GameLogic.state.currentMode) { // If mode not set via main menu buttons
                    GameLogic.selectMode(mode); // Set the mode first
                    TypingUI.displayPracticeArea(mode); // Update UI for the mode
                    TypingUI.updatePracticeTitle(mode);
                }
                // Ensure subMode and level are correctly set in GameLogic.state if applicable for this mode
                // For beginner/special, subMode is set via TypingUI clicking data-beginner-type etc.
                // For standard, subMode (words/sentences) and level (easy/medium) also via TypingUI.
                // So, GameLogic.state should have these by the time start is clicked.
                
                GameLogic.preparePracticeText();
                GameLogic.startPractice();
                TypingUI.startPracticeUI(mode, GameLogic.state.currentText);
                TypingUI.focusInputElement(mode);
            });
        }
        
        // Reset buttons
        const resetButton = DOMUtils.getElement(`#${mode}-reset-btn`) || DOMUtils.getElement(`#reset-${mode}-practice`);
        if (resetButton) {
            resetButton.addEventListener('click', () => {
                GameLogic.resetPracticeState();
                TypingUI.resetPracticeUI(mode);
                
                // Specific UI re-initialization after reset
                if (mode === 'free') TypingUI.initFreePracticeUI();
                else if (mode === 'beginner') TypingUI.initBeginnerPracticeUI(GameLogic.state.currentSubMode, GameLogic.state.currentLang);
                else if (mode === 'special') TypingUI.initSpecialPracticeUI(GameLogic.state.currentSubMode);
                else if (mode === 'standard') TypingUI.initStandardPracticeUI();
            });
        }
    });

    // "Next" button for standard mode (after completing a text segment)
    const standardNextButton = DOMUtils.getElement('#standard-next-btn');
    if (standardNextButton) {
        standardNextButton.addEventListener('click', () => {
            if (GameLogic.state.currentMode === 'standard') {
                GameLogic.preparePracticeText(); // Load new text
                GameLogic.startPractice();       // Start new session
                TypingUI.startPracticeUI('standard', GameLogic.state.currentText);
                TypingUI.focusInputElement('standard');
                standardNextButton.style.display = 'none'; // Hide next button until text is done
                const startButton = DOMUtils.getElement('#standard-start-btn');
                if(startButton) startButton.style.display = 'none';
            }
        });
    }
    
    // Event listener for the "Continue Practice" button in the results modal
    if (TypingUI.elements.continueBtn) {
        TypingUI.elements.continueBtn.addEventListener('click', () => {
            const currentMode = GameLogic.state.currentMode;
            if (currentMode) {
                TypingUI.resetPracticeUI(currentMode); // Reset UI for that mode

                // Re-initialize the UI for the current mode to show start button etc.
                if (currentMode === 'free') TypingUI.initFreePracticeUI();
                else if (currentMode === 'beginner') TypingUI.initBeginnerPracticeUI(GameLogic.state.currentSubMode, GameLogic.state.currentLang);
                else if (currentMode === 'special') TypingUI.initSpecialPracticeUI(GameLogic.state.currentSubMode);
                else if (currentMode === 'standard') TypingUI.initStandardPracticeUI();

                // The start button for the mode should now be visible to start a new session.
                const startButton = DOMUtils.getElement(`#${currentMode}-start-btn`) || DOMUtils.getElement(`#start-${currentMode}-practice`);
                if(startButton) startButton.style.display = 'inline-block';
                TypingUI.focusInputElement(currentMode);
            }
        });
    }

    // Initial UI setup - show main menu
    TypingUI.showMainMenu();
    console.log("Typing Practice Initialized with new modular structure.");
}


function cleanupTypingPractice() {
    if (GameLogic && GameLogic.state && GameLogic.state.timerInterval) {
        clearInterval(GameLogic.state.timerInterval);
        GameLogic.state.timerInterval = null;
    }
    // TODO: More robust event listener cleanup if modules add their own listeners dynamically
    // For now, TypingUI.init and this main init are primary places.
    console.log("Typing practice cleaned up.");
    typingPracticeOrchestratorState = null;
}

// Compatibility with existing HTML that might call the old function name
function initializeTypingPractice() {
    initializeTypingPracticeNew();
}

// Auto-initialize if this script is loaded directly and DOM is ready.
// This assumes GameLogic.js, TypingStats.js, TypingUI.js, and utils.js are loaded before this.
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => GameLogic.loadPracticeTexts(initializeTypingPracticeNew));
} else {
    // DOMContentLoaded has already fired
    GameLogic.loadPracticeTexts(initializeTypingPracticeNew);
}
