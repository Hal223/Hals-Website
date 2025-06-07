// js/theme.js

export const THEMES = {
    'default': { name: 'Portfolio Dark', class: '' },
    'noctis': { name: 'Noctis', class: 'theme-noctis' },
    'gruvbox': { name: 'Gruvbox Material', class: 'theme-gruvbox' },
    'vim-light': { name: 'Vim Light', class: 'theme-vim-light' },
    'sweetlove': { name: 'Sweetlove', class: 'theme-sweetlove' },
};

export function applyTheme(themeKey, themeDropdown) {
    const theme = THEMES[themeKey];
    if (!theme) return;

    document.body.className = theme.class;
    localStorage.setItem('portfolio-theme', themeKey);
    if (themeDropdown) {
        themeDropdown.classList.add('hidden'); // Hide dropdown after selection
    }
}