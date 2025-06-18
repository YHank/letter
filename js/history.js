// This module contains functions related to history management (undo/redo).

// debounce function is expected to be globally available from utils.js
// If not, it needs to be imported or passed in.
// For testing, we might need to provide a mock or ensure utils.js is loaded.

/**
 * @namespace textHistory
 * @description Manages a history of text states for undo/redo functionality.
 */
const textHistory = {
    /** @property {string[]} states - Array storing the history of text states. */
    states: [''], // Initialize with a single empty state
    /** @property {number} currentIndex - Pointer to the current state in the `states` array. */
    currentIndex: 0,
    /** @property {number} maxHistorySize - Maximum number of states to store. */
    maxHistorySize: 50,

    /**
     * Adds a new text state to the history.
     * If the current index is not at the end of the states array (e.g., after an undo),
     * subsequent states are removed before adding the new state.
     * If the history exceeds `maxHistorySize`, the oldest state is removed.
     * @memberof textHistory
     * @param {string} text - The text state to add.
     */
    addState: function(text) {
        // If current index is not at the end (e.g., after undo), slice off future states
        if (this.currentIndex < this.states.length - 1) {
            this.states = this.states.slice(0, this.currentIndex + 1);
        }

        this.states.push(text);

        if (this.states.length > this.maxHistorySize) {
            this.states.shift(); // Remove the oldest state
            // Current index should remain at the end, which is maxHistorySize - 1
            this.currentIndex = this.maxHistorySize - 1;
        } else {
            this.currentIndex = this.states.length - 1;
        }
    },

    /**
     * Moves to the previous state in history (undo).
     * @memberof textHistory
     * @returns {string|null} The previous text state, or null if no more states to undo.
     */
    undo: function() {
        if (this.canUndo()) {
            this.currentIndex--;
            return this.states[this.currentIndex];
        }
        return null; // Or return this.states[0] if always want to return a string
    },

    /**
     * Moves to the next state in history (redo).
     * @memberof textHistory
     * @returns {string|null} The next text state, or null if no more states to redo.
     */
    redo: function() {
        if (this.canRedo()) {
            this.currentIndex++;
            return this.states[this.currentIndex];
        }
        return null;
    },

    /**
     * Checks if an undo operation is possible.
     * @memberof textHistory
     * @returns {boolean} True if undo is possible, false otherwise.
     */
    canUndo: function() {
        return this.currentIndex > 0;
    },

    /**
     * Checks if a redo operation is possible.
     * @memberof textHistory
     * @returns {boolean} True if redo is possible, false otherwise.
     */
    canRedo: function() {
        return this.currentIndex < this.states.length - 1;
    },

    /**
     * Resets the history to its initial state (a single empty string).
     * @memberof textHistory
     */
    reset: function() {
        this.states = [''];
        this.currentIndex = 0;
    },

    /**
     * Gets the current text state.
     * @memberof textHistory
     * @returns {string} The current text state.
     */
    getCurrentState: function() {
        return this.states[this.currentIndex];
    }
};

/**
 * @description A debounced version of `textHistory.addState`.
 * Requires `debounce` function to be available (e.g., from utils.js).
 * Note: For unit testing `debouncedAddHistory` directly, timer mocks would be needed.
 * Tests will primarily focus on `textHistory`'s direct methods.
 */
let debouncedAddHistory;
if (typeof debounce === 'function') {
    debouncedAddHistory = debounce(function(text) {
        textHistory.addState(text);
    }, 500); // Default debounce time
} else {
    // Fallback or error if debounce is not defined
    console.warn("debounce function not found. debouncedAddHistory will not work as intended.");
    // Assign a passthrough function for testing core logic if debounce is missing
    debouncedAddHistory = function(text) {
        textHistory.addState(text);
    };
}


// Node.js environment for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        textHistory,
        debouncedAddHistory // Exporting for potential (though complex) debounce testing
    };
}
// Browser: textHistory and debouncedAddHistory will be global or attached to a namespace.
// Example:
// window.MyNamespace = window.MyNamespace || {};
// window.MyNamespace.textHistory = textHistory;
// window.MyNamespace.debouncedAddHistory = debouncedAddHistory;
