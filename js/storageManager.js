import { LS_KEYS } from './config.js';
import { tabsContainer } from './domElements.js';
import { getActiveTabId } from './state.js';

export function saveTabState() {
    try {
        const openTabIdsOrder = Array.from(tabsContainer.querySelectorAll('.tab')).map(tab => tab.dataset.tab);
        localStorage.setItem(LS_KEYS.OPEN_TABS_ORDER, JSON.stringify(openTabIdsOrder));
        const currentActiveTabId = getActiveTabId();
        if (currentActiveTabId) {
            localStorage.setItem(LS_KEYS.ACTIVE_TAB_ID, currentActiveTabId);
        } else {
            localStorage.removeItem(LS_KEYS.ACTIVE_TAB_ID);
        }
    } catch (e) {
        console.error("Error saving tab state to localStorage:", e);
    }
}

export function loadTabState() {
    try {
        const savedOrder = localStorage.getItem(LS_KEYS.OPEN_TABS_ORDER);
        const savedActiveTab = localStorage.getItem(LS_KEYS.ACTIVE_TAB_ID);
        return {
            openTabIdsOrder: savedOrder ? JSON.parse(savedOrder) : null,
            activeTabId: savedActiveTab || null
        };
    } catch (e) {
        console.error("Error loading tab state from localStorage:", e);
        localStorage.removeItem(LS_KEYS.OPEN_TABS_ORDER);
        localStorage.removeItem(LS_KEYS.ACTIVE_TAB_ID);
        return { openTabIdsOrder: null, activeTabId: null };
    }
}

export function saveThemeState(themeName, customVarsString) {
    try {
        if (themeName) {
            localStorage.setItem(LS_KEYS.CURRENT_THEME, themeName);
        } else {
            localStorage.removeItem(LS_KEYS.CURRENT_THEME);
        }
        if (customVarsString) {
            localStorage.setItem(LS_KEYS.CUSTOM_THEME_VARS, customVarsString);
        } else {
            localStorage.removeItem(LS_KEYS.CUSTOM_THEME_VARS);
        }
    } catch (e) {
        console.error("Error saving theme state to localStorage:", e);
    }
}

export function loadThemeState() {
    try {
        return {
            savedThemeName: localStorage.getItem(LS_KEYS.CURRENT_THEME),
            savedCustomVars: localStorage.getItem(LS_KEYS.CUSTOM_THEME_VARS)
        };
    } catch (e) {
        console.error("Error loading theme state from localStorage:", e);
        return { savedThemeName: null, savedCustomVars: null };
    }
}