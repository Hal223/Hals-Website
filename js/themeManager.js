import { rootElement, themeSelector, bgColorPicker, fgColorPicker, accentColorPicker, settingsPanel } from './domElements.js';
import { predefinedThemes } from './config.js';
import { saveThemeState, loadThemeState } from './storageManager.js';

export function rgbToHex(rgb) {
    if (!rgb || rgb.startsWith('#')) return rgb || '#000000'; // Default to black if undefined
     let sep = rgb.indexOf(",") > -1 ? "," : " ";
     let parts = rgb.substr(rgb.indexOf("(") + 1).split(")")[0].split(sep);

     let r = (+parts[0]).toString(16),
         g = (+parts[1]).toString(16),
         b = (+parts[2]).toString(16);

     if (r.length == 1) r = "0" + r;
     if (g.length == 1) g = "0" + g;
     if (b.length == 1) b = "0" + b;
     return "#" + r + g + b;
}

export function applyThemeVariables(themeVars) {
    for (const [variable, value] of Object.entries(themeVars)) {
        if (variable.startsWith('--color') || ['--background', '--foreground', '--cursor'].includes(variable)) {
            rootElement.style.setProperty(variable, value);
        }
    }
    updateColorPickersFromAppliedTheme();
}

export function updateColorPickersFromAppliedTheme() {
    if (!settingsPanel || settingsPanel.style.display === 'none') return;
    
    const rootStyle = getComputedStyle(rootElement);
    if (bgColorPicker) bgColorPicker.value = rgbToHex(rootStyle.getPropertyValue('--background').trim());
    if (fgColorPicker) fgColorPicker.value = rgbToHex(rootStyle.getPropertyValue('--foreground').trim());
    if (accentColorPicker) accentColorPicker.value = rgbToHex(rootStyle.getPropertyValue('--color1').trim());
}

export function loadAndApplyPersistedTheme() {
    const { savedThemeName, savedCustomVars } = loadThemeState();

    if (savedCustomVars) {
        try {
            const customVars = JSON.parse(savedCustomVars);
            applyThemeVariables(customVars);
            if (themeSelector.options.namedItem("custom")) {
                themeSelector.value = "custom";
            } else { // Fallback if no custom option, or create one
                const customOption = new Option("Custom (Imported/Picked)", "custom");
                if (!themeSelector.options.namedItem("custom")) themeSelector.add(customOption);
                themeSelector.value = "custom";
            }
        } catch (e) {
            console.error("Error applying custom theme vars:", e);
            applyThemeVariables(predefinedThemes);
            themeSelector.value = 'archway';
        }
    } else if (savedThemeName && predefinedThemes[savedThemeName]) {
        applyThemeVariables(predefinedThemes[savedThemeName]);
        themeSelector.value = savedThemeName;
    } else {
        applyThemeVariables(predefinedThemes);
        themeSelector.value = 'archway';
    }
    updateColorPickersFromAppliedTheme();
}

export function selectTheme(selectedThemeName) {
    if (predefinedThemes[selectedThemeName]) {
        applyThemeVariables(predefinedThemes[selectedThemeName]);
        saveThemeState(selectedThemeName, null); // Clear custom vars
    }
}

export function applyImportedTheme(cssText) {
    const importedVars = {};
    const regex = /(--[\w-]+)\s*:\s*([^;]+);?/g;
    let match;
    while ((match = regex.exec(cssText)) !== null) {
        importedVars[match[1].trim()] = match[2].trim();
    }

    if (Object.keys(importedVars).length > 0) {
        applyThemeVariables(importedVars);
        saveThemeState(null, JSON.stringify(importedVars)); // Clear predefined, save custom
        alert('Imported theme variables applied!');
        if (themeSelector.options.namedItem("custom")) {
            themeSelector.value = "custom";
        } else {
             const customOption = new Option("Custom (Imported/Picked)", "custom");
             if (!themeSelector.options.namedItem("custom")) themeSelector.add(customOption);
             themeSelector.value = "custom";
        }
        return true;
    } else {
        alert('No valid CSS variables found to import.');
        return false;
    }
}

export function resetThemeToDefault() {
    applyThemeVariables(predefinedThemes);
    saveThemeState('default', null);
    if (themeSelector) themeSelector.value = 'default';
    alert('Theme reset to default.');
}

export function saveCustomPickedColors() {
    const customVars = {};
    const currentAppliedThemeName = themeSelector.value;
    // Base on current visible theme, or default if custom
    let baseTheme = predefinedThemes;
    if (predefinedThemes[currentAppliedThemeName]) {
         baseTheme = predefinedThemes[currentAppliedThemeName];
    } else { // If current is 'custom' or unknown, might load from LS or use default
         const { savedCustomVars } = loadThemeState();
         if (savedCustomVars) {
             try { baseTheme = JSON.parse(savedCustomVars); }
             catch (e) { /* use predefinedThemes */ }
         }
    }
    Object.assign(customVars, baseTheme); // Start with a full theme

    const pickers = [bgColorPicker, fgColorPicker, accentColorPicker];
    pickers.forEach(picker => {
        if (picker && picker.value && picker.dataset.cssVar) {
            customVars[picker.dataset.cssVar] = picker.value;
        }
    });

    applyThemeVariables(customVars);
    saveThemeState(null, JSON.stringify(customVars));
    if (themeSelector.options.namedItem("custom")) {
        themeSelector.value = "custom";
    } else {
         const customOption = new Option("Custom (Imported/Picked)", "custom");
         if (!themeSelector.options.namedItem("custom")) themeSelector.add(customOption);
         themeSelector.value = "custom";
    }
    alert('Custom colors saved and applied!');
}