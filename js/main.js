import * as DOM from './domElements.js';
import * as State from './state.js';
import * as Storage from './storageManager.js';
import * as Theme from './themeManager.js';
import * as UI from './uiManager.js';
import * as Tabs from './tabManager.js';
import * as Settings from './settingsManager.js';
import { generateFullFileConfig } from './config.js';
// No need to import Content here unless directly using its functions not called by TabManager

const fullFileConfig = generateFullFileConfig();

async function initializeApp() {
    DOM.tabsContainer.innerHTML = '';
    Theme.loadAndApplyPersistedTheme();
    Settings.initSettingsPanel();
    UI.initSidebarLinks(fullFileConfig, Tabs.openOrShowTab);

    const savedTabState = Storage.loadTabState();
    let restoredActiveTab = null;

    if (savedTabState.openTabIdsOrder && savedTabState.openTabIdsOrder.length > 0) {
        const openPromises = savedTabState.openTabIdsOrder.map(tabId => {
            if (fullFileConfig[tabId]) return Tabs.openOrShowTab(tabId, false, true);
            return Promise.resolve();
        });
        await Promise.all(openPromises);
        
        const fragment = document.createDocumentFragment();
        savedTabState.openTabIdsOrder.forEach(tabId => {
            const tabData = State.getOpenTab(tabId);
            if (tabData && tabData.tabEl?.isConnected) fragment.appendChild(tabData.tabEl);
        });
        DOM.tabsContainer.innerHTML = '';
        DOM.tabsContainer.appendChild(fragment);
        restoredActiveTab = savedTabState.activeTabId;
    }

    if (restoredActiveTab && State.getOpenTab(restoredActiveTab)?.tabEl?.isConnected) {
        Tabs.setActiveTab(restoredActiveTab);
    } else {
        const defaultInitialTabId = 'about';
        if (fullFileConfig[defaultInitialTabId]) {
            const tabData = State.getOpenTab(defaultInitialTabId);
            if (!tabData || !tabData.tabEl?.isConnected) await Tabs.openOrShowTab(defaultInitialTabId, true, true);
            else Tabs.setActiveTab(defaultInitialTabId);
        } else if (Object.keys(fullFileConfig).length > 0) {
            const firstConfiguredTabId = Object.keys(fullFileConfig)[0];
            const tabData = State.getOpenTab(firstConfiguredTabId);
            if (!tabData || !tabData.tabEl?.isConnected) await Tabs.openOrShowTab(firstConfiguredTabId, true, true);
            else Tabs.setActiveTab(firstConfiguredTabId);
        } else {
            UI.clearEditorView();
            State.setActiveTabId(null);
        }
    }
    
    if (DOM.tabsContainer.children.length > 0) {
        Storage.saveTabState();
    }

    const debouncedLineUpdate = UI.debounce(() => {
        const activeTab = State.getOpenTab(State.getActiveTabId());
        if (activeTab && activeTab.sectionEl) UI.updateLineNumbers(activeTab.sectionEl);
    }, 150);

    if (DOM.contentSectionsContainer) {
        new ResizeObserver(debouncedLineUpdate).observe(DOM.contentSectionsContainer);
        DOM.contentSectionsContainer.addEventListener('scroll', () => {
            if (DOM.lineNumbersContainer && DOM.editorPane.classList.contains('mode-code')) {
                DOM.lineNumbersContainer.scrollTop = DOM.contentSectionsContainer.scrollTop;
            }
        });
        const mutationObserver = new MutationObserver(() => {
            if (DOM.editorPane.classList.contains('mode-code')) {
                const activeTab = State.getOpenTab(State.getActiveTabId());
                if (activeTab && activeTab.sectionEl?.classList.contains('active')) {
                    debouncedLineUpdate();
                }
            }
        });
        mutationObserver.observe(DOM.contentSectionsContainer, { childList: true, subtree: true, characterData: true });
    }

    // Contact form is initialized when its content is loaded by contentManager.js
}

document.addEventListener('DOMContentLoaded', initializeApp);