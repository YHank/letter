# Project Update Plan

This document outlines the development plan and tracks progress.

## Main Development Steps

1.  **Code Review and Refactoring (JavaScript)** - **COMPLETE**
    *   Objective: Improve structure, modularity, readability, and maintainability of the existing JavaScript codebase.
    *   Status: All planned JavaScript refactoring sub-tasks are complete.
    *   Sub-tasks:
        *   [x] Refactor `js/index.js` (Modularization, Debounce, Simplification) - Complete
        *   [x] Refactor `js/insurance_calculator.js` (Tax calculation placeholder, Config object, Debounce) - Complete
        *   [x] Refactor `js/salary_calculator.js` (Tax calculation placeholder, Config object, Utils usage) - Complete
        *   [x] Refactor `js/scientific_calculator.js` (Clarify expression parsing, Modularize, Utils usage) - Complete
        *   [x] Refactor `js/spellcheck_client.js` (Externalize dictionary, Optimize `check` function with comments) - Complete
        *   [x] Refactor `js/typing_practice.js` (Modularize, Externalize texts, Review WPM calculation) - Complete
        *   [x] Refactor `js/utils.js` (Consolidate utilities, Review AnimationUtils, Add JSDoc) - Complete

2.  **HTML and CSS Review** - **Findings Documented**
    *   Objective: Analyze HTML and CSS for semantic correctness, accessibility, best practices, and potential optimizations.
    *   Status: Initial review complete. Findings summarized below. Detailed implementation of fixes is pending.
    *   **HTML Review Findings:**
        *   **Semantic Structure:**
            *   Generally, pages use basic Bootstrap structure. Key elements like `<h1>` are present for titles.
            *   *Recommendation:* Consistently implement HTML5 semantic elements such as `<main>` for primary page content, `<nav>` for navigation blocks, `<section>` for distinct thematic groups (e.g., input areas, result displays), and `<article>` for self-contained content where appropriate. Ensure a logical heading hierarchy (`<h1>` -> `<h2>`, etc.) is maintained on all pages.
        *   **Accessibility (A11y):**
            *   Labels are mostly used for form inputs. Some inputs have helpful `inputmode` or `pattern` attributes.
            *   *Key Recommendations:*
                *   **ARIA for Dynamic Content:** Implement `aria-live` attributes for regions updated dynamically by JavaScript (e.g., calculation results, validation messages, typing practice stats) to ensure screen readers announce changes.
                *   **ARIA for Controls:** For interactive elements, especially those with symbolic text (e.g., calculator buttons like `+`, `√`), provide clear accessible names using `aria-label` or screen-reader-only text. Use `aria-pressed` for toggle buttons (e.g., language selectors).
                *   **Forms:** Ensure all form inputs are programmatically linked to their labels. Use `aria-describedby` to associate helper text or error messages with inputs.
                *   **Images & Icons:** While not heavily used, ensure any future images have appropriate `alt` text. Decorative icons (e.g., Font Awesome) should be reviewed to ensure they don't convey critical information without a textual alternative or are properly hidden from assistive technologies if purely decorative (`aria-hidden="true"`).
                *   **Keyboard Navigation:** Verify all interactive elements are focusable and operable via keyboard.
                *   **Progress Bars:** The progress bar in Typing Practice needs full ARIA attributes (`aria-valuenow`, `aria-valuemin`, `aria-valuemax`).
    *   **CSS Review Findings:**
        *   **Best Practices & Organization:**
            *   Excellent use of CSS Custom Properties (`:root` and `.dark` themes) for colors, gradients, and shadows, facilitating maintainability and theming.
            *   Styles are generally grouped by feature or component. Class names are mostly descriptive.
            *   *Recommendations:*
                *   **Global Transitions:** The universal selector `* { transition: ...; }` should be replaced by applying transitions only to specific elements that require them to avoid potential performance overhead.
                *   **`!important` Flag:** Review and minimize the use of `!important` (currently used for some Bootstrap overrides and Google Translate styling). Explore alternative approaches like increasing specificity or adjusting SASS variables if Bootstrap is compiled from source.
                *   **Naming Conventions:** For larger-scale CSS, consider adopting a stricter naming convention (e.g., BEM) for improved clarity and to avoid style collisions.
                *   **Redundancy:** Consolidate duplicated `@keyframes` (e.g., `shake` animation).
        *   **Optimizations & Responsiveness:**
            *   The CSS includes media queries, demonstrating consideration for responsive design.
            *   Use of modern layout techniques (flexbox/grid via Bootstrap and custom styles) is good.
            *   *Recommendations:* Continue testing across various devices. Ensure that complex styles (shadows, gradients, animations) perform well on less powerful devices.
        *   **Cross-Browser Compatibility:**
            *   Modern CSS features are used. Standard CSS properties should be preferred over prefixed ones where support is widespread. For instance, ensure `background-clip: text;` is present alongside `-webkit-background-clip: text;`.
            *   `backdrop-filter` has improved but still not universal support; consider fallbacks or graceful degradation if critical.

3.  **Testing Strategy and Implementation** - **COMPLETE**
    *   Objective: Define and implement a comprehensive testing strategy to ensure code quality and application stability.
    *   **Progress & Files Created:**
        *   **`test/langchkg_test.js` Analysis:** Existing test for external API integration reviewed.
        *   **`test/utils_test.js`:** Comprehensive unit tests for all utilities in `js/utils.js`.
        *   **`test/textAnalysis_test.js`:** Unit tests for text analysis functions in `js/textAnalysis.js`.
        *   **`test/history_test.js`:** Unit tests for the `textHistory` object in `js/history.js`.
        *   **`test/scientific_calculator_test.js`:** Unit tests for the refactored core logic of `js/scientific_calculator.js`.
        *   **`test/insurance_calculator_test.js`:** Unit tests for the refactored core logic of `js/insurance_calculator.js`.
        *   **`test/salary_calculator_test.js`:** Unit tests for the refactored core logic of `js/salary_calculator.js`.
        *   **`test/spellcheck_client_test.js`:** Unit tests for `js/spellcheck_client.js` (check method and utilities).
        *   **`test/typingStats_test.js`:** Unit tests for WPM/accuracy calculations, practice records, achievements, and user levels in `js/typingStats.js`.
        *   **`test/gameLogic_test.js`:** Unit tests for core typing practice game mechanics in `js/gameLogic.js`, including state management, text preparation, and typing handlers.
    *   **Summary:** Core JavaScript logic for utilities, text analysis, history, calculators, spell checking, and typing practice (stats and game logic) now have corresponding unit test files.
    *   **Future Work (Not in this phase):** UI Interaction / End-to-End (E2E) Tests, Accessibility Tests, Visual Regression Tests.
    *   **Status:** **COMPLETE** (for core logic unit testing phase).

4.  **UI/UX Enhancements** - *Pending*
    *   Objective: Improve the user interface and user experience across all web tools.
    *   Key Areas:
        *   Consistent design language.
        *   Responsiveness and mobile-friendliness (building on CSS review).
        *   Accessibility improvements (implementing findings from Step 2 & 3).
        *   User feedback mechanisms.

5.  **New Feature Implementation** - *Pending*
    *   Objective: Add new tools and functionalities based on user needs and project goals.
    *   Potential Features (from old `update.md` and context):
        *   Internet search integration (Google, Naver, Daum, Bing).
        *   Multilingual support for UI and content.
        *   Language translation feature (e.g., using Google Translate API).
        *   Additional calculators or tools.

6.  **Content Update & Expansion** - *Pending*
    *   Objective: Ensure all data (tax tables, insurance rates, dictionaries, practice texts) is up-to-date and expanded where necessary.
    *   Key Areas:
        *   Update tax information for `js/salary_calculator.js` and `js/insurance_calculator.js` to the latest year.
        *   Expand `spellcheck_dictionary.json` with more common corrections.
        *   Add more diverse texts to `typing_texts.json`.

7.  **Build & Deployment Strategy** - *Pending*
    *   Objective: Define and implement a modern build process and deployment strategy.
    *   Considerations:
        *   Using a JavaScript framework (e.g., React, Vue, Svelte) or static site generator.
        *   Bundlers (Webpack, Parcel), Minification, Code splitting.
        *   Hosting platform and CI/CD pipeline.

8.  **Documentation** - *Pending*
    *   Objective: Provide clear documentation for users and developers.
    *   Types:
        *   User guides for each tool.
        *   Developer documentation (code structure, API, setup).
        *   Update JSDoc comments as code evolves.

9.  **SEO & Analytics** - *Pending*
    *   Objective: Improve search engine visibility and track user engagement.
    *   Tasks:
        *   Implement SEO best practices (meta tags, sitemap, structured data).
        *   Integrate web analytics (e.g., Google Analytics).

10. **Monetization Strategy** - *Pending*
    *   Objective: Explore and implement monetization options if applicable.
    *   Potential:
        *   Google AdSense or other ad networks.

## Previously Completed (from old `update.md`)
- 글자수 세기 기능 추가.
- 맞춤법 지원 추가.
