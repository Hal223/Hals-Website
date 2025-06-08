// js/autocomplete.js

function displayAutocompleteOptions(matches, dom, scrollToBottom) {
    const outputWrapper = document.createElement('div');
    outputWrapper.innerHTML = `<div class="command-line"><span class="prompt">${dom.promptElement.textContent}</span>${dom.commandInput.value}</div>`;
    const optionsDiv = document.createElement('div');
    optionsDiv.innerHTML = matches.join('  ');
    outputWrapper.appendChild(optionsDiv);
    dom.output.appendChild(outputWrapper);
    scrollToBottom();
}

export function handleTabCompletion(context) {
    const { dom, state, commandHandlers, utils, scrollToBottom, theme } = context;
    const currentInput = dom.commandInput.value;
    const parts = currentInput.split(' ');
    
    if (currentInput.trim() === '' && !currentInput.endsWith(' ')) return;

    // Case 1: Completing a command (the first word)
    if (parts.length === 1) {
        const commandList = Object.keys(commandHandlers);
        const matches = commandList.filter(cmd => cmd.startsWith(parts[0]));
        if (matches.length === 1) dom.commandInput.value = matches[0] + ' ';
        else if (matches.length > 1) displayAutocompleteOptions(matches, dom, scrollToBottom);
        return;
    }

    const command = parts[0];
    const lastPart = parts[parts.length - 1];

    // --- Command-specific argument completion ---
    if (command === 'theme' && parts.length === 2 && !currentInput.endsWith(' ')) {
        const themeKeys = Object.keys(theme.THEMES);
        const matches = themeKeys.filter(key => key.startsWith(lastPart));
        if (matches.length === 1) dom.commandInput.value = `theme ${matches[0]} `;
        else if (matches.length > 1) displayAutocompleteOptions(matches, dom, scrollToBottom);
        return;
    }

    // Default Case: Completing a file/directory path for all other commands
    let pathPrefix = '';
    let partialName = lastPart;
    const lastSlashIndex = lastPart.lastIndexOf('/');
    
    if (lastSlashIndex > -1) {
        pathPrefix = lastPart.substring(0, lastSlashIndex + 1);
        partialName = lastPart.substring(lastSlashIndex + 1);
    }

    const dirPathToSearch = pathPrefix ? utils.resolvePath(pathPrefix, state.currentPath) : state.currentPath;
    const dirToSearch = utils.findItemByPath(dirPathToSearch.replace(/^~\/?/, ''), state.fileSystem);

    if (!dirToSearch || dirToSearch.type !== 'directory') return;

    const childrenNames = Object.keys(utils.getFilteredChildren(dirToSearch, state.EXCLUDED_DIRS));
    const matches = childrenNames.filter(name => name.startsWith(partialName));

    if (matches.length === 1) {
        const completedName = matches[0];
        const baseInput = currentInput.substring(0, currentInput.length - partialName.length);
        const item = dirToSearch.children[completedName];
        
        if (item.type === 'directory') dom.commandInput.value = `${baseInput}${completedName}/`;
        else dom.commandInput.value = `${baseInput}${completedName} `;
    } else if (matches.length > 1) {
        displayAutocompleteOptions(matches, dom, scrollToBottom);
    }
}