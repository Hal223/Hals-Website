import * as DOM from './domElements.js';
import * as Theme from './themeManager.js';
import { predefinedThemes } from './config.js'; // To populate selector initially

export function initSettingsPanel() {
    if (DOM.settingsCog) {
        DOM.settingsCog.addEventListener('click', () => {
            DOM.settingsPanel.style.display = 'flex';
            Theme.updateColorPickersFromAppliedTheme();
        });
    }
    if (DOM.closeSettingsPanelBtn) {
        DOM.closeSettingsPanelBtn.addEventListener('click', () => {
            DOM.settingsPanel.style.display = 'none';
        });
    }
    if (DOM.settingsPanel) {
        DOM.settingsPanel.addEventListener('click', (e) => {
            if (e.target === DOM.settingsPanel) {
                DOM.settingsPanel.style.display = 'none';
            }
        });
    }

    // Populate theme selector
    if (DOM.themeSelector) {
        Object.keys(predefinedThemes).forEach(themeName => {
             // Check if option already exists from HTML (like 'default')
             if (!Array.from(DOM.themeSelector.options).find(opt => opt.value === themeName)) {
                 const option = new Option(
                     themeName.charAt(0).toUpperCase() + themeName.slice(1).replace('-ish', ' (Ish)').replace('-', ' '), // Prettify name
                     themeName
                 );
                 DOM.themeSelector.add(option);
             }
        });

        DOM.themeSelector.addEventListener('change', (e) => {
            Theme.selectTheme(e.target.value);
        });
    }
    

    if (DOM.applyImportedThemeBtn) {
        DOM.applyImportedThemeBtn.addEventListener('click', () => {
            Theme.applyImportedTheme(DOM.themeImportArea.value);
        });
    }
    if (DOM.resetToDefaultThemeBtn) {
        DOM.resetToDefaultThemeBtn.addEventListener('click', () => {
            Theme.resetThemeToDefault();
            DOM.themeImportArea.value = ''; // Clear import area
        });
    }

    const colorPickers = [DOM.bgColorPicker, DOM.fgColorPicker, DOM.accentColorPicker];
    colorPickers.forEach(picker => {
        if (picker) {
            picker.addEventListener('input', (e) => {
                const cssVar = e.target.dataset.cssVar;
                DOM.rootElement.style.setProperty(cssVar, e.target.value);
            });
        }
    });

    if (DOM.saveCustomColorsBtn) {
        DOM.saveCustomColorsBtn.addEventListener('click', () => {
            Theme.saveCustomPickedColors();
        });
    }
}