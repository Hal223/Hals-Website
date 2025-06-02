import * as DOM from './domElements.js';
import * as State from './state.js';
import * as Storage from './storageManager.js';
import * as UI from './uiManager.js';
import * as Content from './contentManager.js';
import { generateFullFileConfig } from './config.js';

const fullFileConfig = generateFullFileConfig();
let draggedTab = null;

export async function openOrShowTab(tabId, makeActive = true, fromStorage = false) {
    const config = fullFileConfig[tabId];
    if (!config) {
        console.error(`No configuration found for tabId: ${tabId}`);
        return;
    }

    let tabData = State.getOpenTab(tabId);

    if (tabData && tabData.tabEl && tabData.tabEl.isConnected) {
        if (makeActive) setActiveTab(tabId);
        return;
    }

    let tabEl, sectionEl;

    if (tabData && tabData.tabEl) { // Was closed, re-attach
        tabEl = tabData.tabEl;
        sectionEl = tabData.sectionEl;
        if (!tabEl.isConnected) DOM.tabsContainer.appendChild(tabEl);
        if (sectionEl && !sectionEl.isConnected) {
            DOM.contentSectionsContainer.appendChild(sectionEl);
            // If re-attaching the contact section, ensure its form listener is active
            if (config.id === 'contact') {
                Content.reinitializeContactForm();
            }
        }
    } else { // First time opening
        tabEl = document.createElement('button');
        tabEl.classList.add('tab');
        tabEl.dataset.tab = tabId;
        tabEl.draggable = true;
        tabEl.innerHTML = `${config.title} ${config.closable ? '<span class="close-tab">×</span>' : ''}`;
        DOM.tabsContainer.appendChild(tabEl);
        addTabEventListeners(tabEl);

        if (config.type === 'static') {
            sectionEl = await Content.loadStaticContentSection(config);
        } else if (config.type === 'blog') {
            sectionEl = await Content.loadBlogContent(config, 
                (html) => Content.processInternalBlogLinks(html, fullFileConfig, openOrShowTab),
                (el) => Content.setupInternalBlogLinkListeners(el, openOrShowTab)
            );
        }
        
        const navLinkEl = document.querySelector(config.sidebarLinkSelector);
        State.addOpenTab(tabId, { tabEl, sectionEl, navLinkEl, config });
    }
    
    if (!fromStorage) {
        Storage.saveTabState();
    }

    if (makeActive) {
        setActiveTab(tabId);
    }
}
   
function addTabEventListeners(tabEl) {
    tabEl.addEventListener('click', () => setActiveTab(tabEl.dataset.tab));
    const closeBtn = tabEl.querySelector('.close-tab');
    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeTab(tabEl.dataset.tab);
        });
    }
    tabEl.addEventListener('dragstart', handleDragStart);
    tabEl.addEventListener('dragover', handleDragOver);
    tabEl.addEventListener('drop', handleDrop);
    tabEl.addEventListener('dragend', handleDragEnd);
}

export function setActiveTab(tabId) {
    const tabData = State.getOpenTab(tabId);

    if (!tabData || !tabData.tabEl || !tabData.sectionEl) {
        console.warn(`Attempted to activate tab "${tabId}" but its data is missing.`);
        if (fullFileConfig[tabId]) {
             openOrShowTab(tabId, true).catch(err => console.error("Reopen failed in setActiveTab:", err));
        } else {
            const availableTabs = Object.keys(State.getAllOpenTabs()).filter(id => State.getOpenTab(id).tabEl?.isConnected);
            if (availableTabs.length > 0) setActiveTab(availableTabs[0]);
            else UI.clearEditorView();
        }
        return;
    }
    if (tabData.tabEl && !tabData.tabEl.isConnected) DOM.tabsContainer.appendChild(tabData.tabEl);
    if (tabData.sectionEl && !tabData.sectionEl.isConnected) {
        DOM.contentSectionsContainer.appendChild(tabData.sectionEl);
         // If re-attaching the contact section during activation, ensure its form listener
        if (tabData.config.id === 'contact') {
            Content.reinitializeContactForm();
        }
    }


    State.setActiveTabId(tabId);
    const currentConfig = tabData.config;

    Object.values(State.getAllOpenTabs()).forEach(item => {
        if (item.tabEl?.isConnected) item.tabEl.classList.toggle('active', item.config.id === tabId);
        if (item.sectionEl?.isConnected) item.sectionEl.classList.toggle('active', item.config.id === tabId);
    });
    
    UI.updateSidebarActiveLink(tabId, State.getAllOpenTabs());
    UI.updateEditorPaneMode(currentConfig.type === 'blog');
    
    if (currentConfig.type !== 'blog') UI.updateLineNumbers(tabData.sectionEl);
    else if(DOM.lineNumbersContainer) DOM.lineNumbersContainer.innerHTML = '';
    
    if (tabData.sectionEl) tabData.sectionEl.scrollTop = 0;
    
    Storage.saveTabState();
}

export function closeTab(tabIdToClose) {
    const tabData = State.getOpenTab(tabIdToClose);
    if (!tabData || !tabData.tabEl || !tabData.tabEl.isConnected) return;

    tabData.tabEl.remove();
    if (tabData.sectionEl?.isConnected) tabData.sectionEl.remove();
    // State.removeOpenTabData(tabIdToClose); // Optional: fully remove state data

    if (State.getActiveTabId() === tabIdToClose) {
        State.setActiveTabId(null);
        const visibleTabs = Array.from(DOM.tabsContainer.querySelectorAll('.tab'));
        if (visibleTabs.length > 0) setActiveTab(visibleTabs[0].dataset.tab);
        else UI.clearEditorView();
    }
    Storage.saveTabState();
}

function handleDragStart(e) {
    draggedTab = e.target.closest('.tab');
    if (!draggedTab) return;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', draggedTab.dataset.tab);
    setTimeout(() => draggedTab.classList.add('dragging'), 0);
}

function handleDragOver(e) {
    e.preventDefault();
    const targetTab = e.target.closest('.tab');
    if (!targetTab || targetTab === draggedTab || !draggedTab) return;
    e.dataTransfer.dropEffect = 'move';
    const rect = targetTab.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    if (offsetX < rect.width / 2) DOM.tabsContainer.insertBefore(draggedTab, targetTab);
    else DOM.tabsContainer.insertBefore(draggedTab, targetTab.nextSibling);
}

function handleDrop(e) {
    e.preventDefault();
    Storage.saveTabState();
}

function handleDragEnd() {
    if (draggedTab) draggedTab.classList.remove('dragging');
    draggedTab = null;
}