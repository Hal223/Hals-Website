import { lineNumbersContainer, editorPane, blogPostListContainer, contentSectionsContainer } from './domElements.js';
import { blogPostsConfig } from './config.js'; // Only for initSidebarBlogLinks

export function generateLineNumbers(count) {
    if (!lineNumbersContainer) return;
    lineNumbersContainer.innerHTML = '';
    for (let i = 1; i <= count; i++) {
        const span = document.createElement('span');
        span.textContent = i;
        lineNumbersContainer.appendChild(span);
    }
}

export function updateLineNumbers(activeSection) {
    if (!editorPane.classList.contains('mode-code') || !activeSection) {
        if(lineNumbersContainer) lineNumbersContainer.innerHTML = '';
        return;
    }
    if (!activeSection.isConnected) {
        if(lineNumbersContainer) lineNumbersContainer.innerHTML = '';
        return;
    }

    const activeSectionPre = activeSection.querySelector('pre');
    if (!activeSectionPre) {
        generateLineNumbers(1); return;
    }

    const computedStyle = window.getComputedStyle(activeSectionPre);
    const lhString = computedStyle.lineHeight;
    let lineHeight = (lhString === 'normal') ? parseFloat(computedStyle.fontSize) * 1.2 : parseFloat(lhString);
    if (isNaN(lineHeight) || lineHeight === 0) lineHeight = parseFloat(computedStyle.fontSize) * 1.6;
    
    const contentHeight = activeSectionPre.scrollHeight;
    const estimatedLines = Math.max(10, Math.ceil(contentHeight / lineHeight) + 3);
    generateLineNumbers(estimatedLines);
}

export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => { clearTimeout(timeout); func(...args); };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

export function initSidebarLinks(fullFileConfig, openOrShowTabCallback) {
    // Static links
    document.querySelectorAll('.sidebar .nav-link[data-tab]').forEach(link => {
        const tabId = link.dataset.tab;
        // Check if it's a static link (not dynamically added blog link)
        if (fullFileConfig[tabId] && fullFileConfig[tabId].type === 'static') {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                openOrShowTabCallback(tabId, true);
            });
        }
    });

    // Blog links
    if (!blogPostListContainer) return;
    blogPostListContainer.innerHTML = ''; // Clear existing if any
    blogPostsConfig.forEach(postConf => { // Use original blogPostsConfig for this part
        const blogTabId = `blog-${postConf.id}`;
        const listItem = document.createElement('li');
        const link = document.createElement('a');
        link.href = `#${blogTabId}`;
        link.classList.add('nav-link');
        link.dataset.tab = blogTabId;
        link.innerHTML = `<span class="icon file-icon">📝</span> ${postConf.title}`;
        
        listItem.appendChild(link);
        blogPostListContainer.appendChild(listItem);

        link.addEventListener('click', (e) => {
            e.preventDefault();
            openOrShowTabCallback(blogTabId, true);
        });
    });
}

export function updateEditorPaneMode(isBlogPost) {
    editorPane.classList.toggle('mode-prose', isBlogPost);
    editorPane.classList.toggle('mode-code', !isBlogPost);
}

export function updateSidebarActiveLink(activeTabId, openTabs) {
     document.querySelectorAll('.sidebar .nav-link[data-tab]').forEach(l => {
         l.classList.remove('active');
     });
     const activeTabData = openTabs[activeTabId];
     if (activeTabData && activeTabData.navLinkEl) {
         activeTabData.navLinkEl.classList.add('active');
     }
}

export function clearEditorView() {
    editorPane.classList.remove('mode-prose', 'mode-code');
    contentSectionsContainer.innerHTML = `<p class="comment">// No files open.</p>`;
    if (lineNumbersContainer) lineNumbersContainer.innerHTML = '';
}