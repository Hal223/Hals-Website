// js/theme.js

export const THEMES = {
  // Background colors are approximations for the transition effect.
  // They should roughly match the theme's body background from css/themes.css
  primarylight: { name: "Primary Light", class: "theme-primary-light", background: "#f9f5d7", icon: "☀️" },
  primarydark: { name: "Primary Dark", class: "theme-primary-dark", background: "#1d2021", icon: "🌙" },
};

export function applyTheme(themeKey) {
  const theme = THEMES[themeKey];
  if (!theme) return;

  document.body.className = theme.class;
  localStorage.setItem("portfolio-theme", themeKey);
}

export function getNextThemeKey(currentThemeKey) {
  const themeKeys = Object.keys(THEMES);
  const currentIndex = themeKeys.indexOf(currentThemeKey);
  const nextIndex = (currentIndex + 1) % themeKeys.length;
  return themeKeys[nextIndex];
}
