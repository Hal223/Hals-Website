export let openTabs = {}; // { tabId: { tabEl, sectionEl, navLinkEl, config } }
export let activeTabId = null;

export function getActiveTabId() {
    return activeTabId;
}

export function setActiveTabId(tabId) {
    activeTabId = tabId;
}

export function getOpenTab(tabId) {
    return openTabs[tabId];
}
export function getAllOpenTabs() {
    return openTabs;
}

export function addOpenTab(tabId, tabData) {
    openTabs[tabId] = tabData;
}

export function removeOpenTabData(tabId) { // Renamed to avoid conflict if tabEl.remove() is meant
    delete openTabs[tabId];
}

export function resetState() {
    openTabs = {};
    activeTabId = null;
}