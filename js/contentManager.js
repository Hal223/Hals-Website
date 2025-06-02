/* global marked */
import { contentSectionsContainer } from './domElements.js';

// Function to re-attach event listener to the contact form if it's loaded
export function reinitializeContactForm() { // Export this function
    const form = document.getElementById('contactForm'); // Query within the currently active content
    if (form) {
        // A common robust way to remove old listeners is to replace the element
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);
        
        newForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Form submitted (simulated)!');
            newForm.reset();
        });
    }
}

export async function loadStaticContentSection(staticConfig) {
    const sectionEl = document.createElement('section');
    sectionEl.id = staticConfig.id;
    sectionEl.classList.add('content-section');
    try {
        const response = await fetch(`content/${staticConfig.filename}`);
        if (!response.ok) throw new Error(`Fetch failed: ${response.statusText} for ${staticConfig.filename}`);
        const htmlContent = await response.text();
        sectionEl.innerHTML = htmlContent;

        if (staticConfig.id === 'contact') {
            reinitializeContactForm();
        }
    } catch (error) {
        console.error(`Error loading static content ${staticConfig.filename}:`, error);
        sectionEl.innerHTML = `<p class="comment">// Error loading content: ${staticConfig.title}. ${error.message}</p>`;
    }
    contentSectionsContainer.appendChild(sectionEl);
    return sectionEl;
}

export async function loadBlogContent(blogConfig, processInternalLinksCallback, setupInternalBlogLinksCallback) {
    const sectionEl = document.createElement('section');
    sectionEl.id = blogConfig.id;
    sectionEl.classList.add('content-section', 'blog-post-content');
    contentSectionsContainer.appendChild(sectionEl);

    try {
        const response = await fetch(`blog/${blogConfig.filename}`);
        if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);
        const markdownContent = await response.text();
        if (typeof marked === 'undefined') throw new Error("marked.js not loaded!");
        
        let htmlContent = marked.parse(markdownContent);
        htmlContent = processInternalLinksCallback(htmlContent);
        sectionEl.innerHTML = htmlContent;
        // Call setupInternalBlogLinksCallback AFTER innerHTML is set
        setupInternalBlogLinksCallback(sectionEl); 
    } catch (error) {
        console.error(`Error loading blog post ${blogConfig.title}:`, error);
        sectionEl.innerHTML = `<p class="comment">// Error loading: ${blogConfig.title}. ${error.message}</p>`;
    }
    return sectionEl;
}

export function processInternalBlogLinks(htmlContent, fullFileConfig, openOrShowTabCallback) {
    if (typeof marked === 'undefined') return htmlContent;
    const internalLinkRegex = /\[\[([a-zA-Z0-9-_]+)\]\]/g;
    // We can't add event listeners directly to the string here.
    // Instead, we'll add data attributes to identify them later in setupInternalBlogLinks.
    return htmlContent.replace(internalLinkRegex, (match, slug) => {
        const linkedPostTabId = `blog-${slug}`;
        const linkedPostConfig = fullFileConfig[linkedPostTabId];
        if (linkedPostConfig) {
            // Return an anchor tag that setupInternalBlogLinkListeners can find
            return `<a href="#${linkedPostTabId}" class="internal-blog-link" data-target-tab-id="${linkedPostTabId}">${linkedPostConfig.title}</a>`;
        } else {
            return `<span class="broken-internal-link" title="Blog post not found: ${slug}">[[${slug}]]</span>`;
        }
    });
}

export function setupInternalBlogLinkListeners(containerElement, openOrShowTabCallback) {
    containerElement.querySelectorAll('a.internal-blog-link').forEach(link => {
        if (link.dataset.listenerAttached === 'true') return; // Prevent duplicate listeners
        link.dataset.listenerAttached = 'true';
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetTabId = e.currentTarget.dataset.targetTabId; // Use data attribute
            if (targetTabId) {
                openOrShowTabCallback(targetTabId, true);
            }
        });
    });
}