// js/utils.js

// --- NEW: Centralized function to filter out excluded directories ---
export function getFilteredChildren(directory, exclusionList) {
    const filtered = {};
    for (const name in directory.children) {
        if (!exclusionList.includes(name)) {
            filtered[name] = directory.children[name];
        }
    }
    return filtered;
}

export function findItemByPath(path, fileSystem) {
    // ... (rest of the function is unchanged)
    const parts = path.split('/').filter(p => p);
    let current = fileSystem['~'];
    for (const part of parts) {
        if (!current || current.type !== 'directory' || !current.children[part]) {
            return null;
        }
        current = current.children[part];
    }
    return current;
}

export function getCurrentDir(currentPath, fileSystem) {
    // ... (unchanged)
    return findItemByPath(currentPath.replace(/^~\/?/, ''), fileSystem);
}

// The buggy version
export function preprocessObsidianSyntax(content) {
    // Image syntax: ![[image.png]] - now on a single line
    content = content.replace(/!\[\[(.*?)\]\]/g, (match, p1) => `<img src="images/${p1}" alt="${p1}" class="markdown-image">`);
    
    // File link syntax: [[file.md]] - now on a single line
    content = content.replace(/\[\[(.*?)\]\]/g, (match, p1) => `<a class="file" href="#" data-path="${p1}">${p1}</a>`);
    
    return content;
}