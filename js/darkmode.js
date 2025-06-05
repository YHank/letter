// js/darkmode.js
const darkModeToggle = document.getElementById('darkModeToggle');
const darkModeIcon = document.getElementById('darkModeIcon');
const lightModeIcon = document.getElementById('lightModeIcon');
const htmlElement = document.documentElement;

// Function to set theme
function setTheme(theme) {
    if (theme === 'dark') {
        htmlElement.classList.add('dark');
        if(darkModeIcon) darkModeIcon.classList.add('hidden');
        if(lightModeIcon) lightModeIcon.classList.remove('hidden');
        localStorage.setItem('theme', 'dark');
        if (darkModeToggle) darkModeToggle.setAttribute('aria-pressed', 'true');
    } else {
        htmlElement.classList.remove('dark');
        if(darkModeIcon) darkModeIcon.classList.remove('hidden');
        if(lightModeIcon) lightModeIcon.classList.add('hidden');
        localStorage.setItem('theme', 'light');
        if (darkModeToggle) darkModeToggle.setAttribute('aria-pressed', 'false');
    }
}

// Event listener for the toggle button
if (darkModeToggle) {
    darkModeToggle.addEventListener('click', () => {
        const isDarkMode = htmlElement.classList.contains('dark');
        setTheme(isDarkMode ? 'light' : 'dark');
    });
}

// Apply saved theme on page load
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(savedTheme);
    // Initialize aria-pressed state based on the determined theme
    if (darkModeToggle) {
        darkModeToggle.setAttribute('aria-pressed', htmlElement.classList.contains('dark').toString());
    }
});
