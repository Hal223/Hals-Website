// js/utils.js

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
    if (path === '~' || path === '') {
        return fileSystem['~'];
    }
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
    return findItemByPath(currentPath.replace(/^~\/?/, ''), fileSystem);
}

export function resolvePath(target, current) {
    // 1. Determine the base path
    let combinedPath;
    if (target.startsWith('~/') || target === '~') {
        combinedPath = target; // Absolute path
    } else {
        combinedPath = current === '~' ? target : `${current}/${target}`; // Relative path
    }

    // 2. Normalize the path
    const pathSegments = combinedPath.replace(/^~\/?/, '').split('/');
    const resolvedSegments = [];
    for (const segment of pathSegments) {
        if (segment === '..') {
            if (resolvedSegments.length > 0) resolvedSegments.pop();
        } else if (segment !== '.' && segment !== '') {
            resolvedSegments.push(segment);
        }
    }

    // 3. Reconstruct the final, clean path
    return '~' + (resolvedSegments.length > 0 ? '/' : '') + resolvedSegments.join('/');
}

export function preprocessObsidianSyntax(content) {
    // Image syntax: ![[image.png]]
    content = content.replace(/!\[\[(.*?)\]\]/g, (match, p1) => 
        `<img src="images/${p1}" alt="${p1}" class="markdown-image">`);
    
    // File link syntax: [[file.md]]
    content = content.replace(/\[\[(.*?)\]\]/g, (match, p1) => 
        `<a class="file" href="#" data-path="${p1}">${p1}</a>`);
        
    return content;
}

// --- REMOVED: All the duplicated functions from the bottom of the file are now gone. ---