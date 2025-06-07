// js/commands.js

export const handleCat = async (args, context) => {
    const { addToOutput, utils, state } = context;
    if (args.length === 0) {
        addToOutput('cat: missing operand');
        return;
    }
    const pathArg = args[0];
    let file;
    let fileName;

    if (pathArg.includes('/')) {
        file = utils.findItemByPath(pathArg, state.fileSystem);
        fileName = pathArg.split('/').pop();
    } else {
        const dir = utils.getCurrentDir(state.currentPath, state.fileSystem);
        file = dir.children[pathArg];
        fileName = pathArg;
    }

    if (file && file.type === 'file') {
        try {
            const response = await fetch(file.path);
            if (!response.ok) throw new Error(`Network response was not ok`);
            let content = await response.text();

            if (fileName.endsWith('.md')) {
                const processedContent = utils.preprocessObsidianSyntax(content);
                addToOutput(`<div class="markdown-body">${marked.parse(processedContent)}</div>`);
            } else if (fileName.endsWith('.json')) {
                const formattedJson = JSON.stringify(JSON.parse(content), null, 2);
                const highlightedJson = hljs.highlight(formattedJson, { language: 'json' }).value;
                addToOutput(`<pre><code class="hljs json">${highlightedJson}</code></pre>`);
            } else {
                addToOutput(`<pre>${content}</pre>`);
            }
        } catch (error) {
            console.error('Fetch error:', error);
            addToOutput(`cat: ${fileName}: Error fetching file`);
        }
    } else {
        addToOutput(`cat: ${pathArg}: No such file or directory`);
    }
};

export const handleLs = (args, context) => {
    const { addToOutput, utils, state } = context;
    const dir = utils.getCurrentDir(state.currentPath, state.fileSystem);
    if (!dir) return;

    const useLongFormat = args.includes('-la');
    // Get the filtered list of children first
    const visibleChildren = utils.getFilteredChildren(dir, state.EXCLUDED_DIRS);

    const displayItems = { ...visibleChildren };
    if (useLongFormat) {
        displayItems['.'] = { type: 'directory' };
        if (state.currentPath !== '~') displayItems['..'] = { type: 'directory' };
    }

    let listing = '';
    // Sort items alphabetically for consistent display
    const sortedNames = Object.keys(displayItems).sort();

    for (const name of sortedNames) {
        const item = displayItems[name];
        const isDir = item.type === 'directory';
        const className = isDir ? 'directory' : 'file';
        const link = `<a class="${className}" href="#" data-path="${name}">${name}${isDir && name !== '.' && name !== '..' ? '/' : ''}</a>`;
        if (useLongFormat) {
            const perms = isDir ? 'drwxr-xr-x' : '-rw-r--r--';
            const date = 'Jan 01 12:00';
            listing += `${perms}  1 user group  4096 ${date} ${link}\n`;
        } else {
            listing += `${link}  `;
        }
    }
    addToOutput(useLongFormat ? `<pre>${listing}</pre>` : `<div>${listing}</div>`);
};

export const handleCd = (args, context) => {
    const { addToOutput, utils, state, updatePrompt } = context;
    const target = args[0] || '~';

    // Check if the target directory is excluded
    if (state.EXCLUDED_DIRS.includes(target)) {
        addToOutput(`bash: cd: ${target}: Permission denied`);
        return;
    }

    if (target === '~' || target === '') {
        state.currentPath = '~';
    } else if (target === '..') {
        if (state.currentPath !== '~') {
            const parts = state.currentPath.split('/');
            parts.pop();
            state.currentPath = parts.join('/') || '~';
        }
    } else {
        const currentDir = utils.getCurrentDir(state.currentPath, state.fileSystem);
        const newDir = currentDir.children[target];
        if (newDir && newDir.type === 'directory') {
            state.currentPath = state.currentPath === '~' ? `~/${target}` : `${state.currentPath}/${target}`;
        } else {
            addToOutput(`cd: no such file or directory: ${target}`);
        }
    }
    updatePrompt();
};

export const handleHelp = (args, context) => {
    const { addToOutput } = context;
    const helpText = `Available commands:<br>  <span class="command-color">cat [file]</span>      - Display file content<br>  <span class="command-color">ls [-la]</span>        - List files and directories<br>  <span class="command-color">ll</span>              - Alias for 'ls -la'<br>  <span class="command-color">cd [dir]</span>        - Change directory<br>  <span class="command-color">tree</span>            - Display directory structure as a tree<br>  <span class="command-color">search [term]</span>   - Search for text in all files<br>  <span class="command-color">theme [name]</span>    - Change or list themes<br>  <span class="command-color">help, ?</span>         - Show this help message<br>  <span class="command-color">clear</span>           - Clear the terminal`;
    addToOutput(helpText);
};

export const handleTree = (args, context) => {
    const { addToOutput, utils, state } = context;
    const dir = utils.getCurrentDir(state.currentPath, state.fileSystem);
    if (!dir) return;

    let treeString = '.\n';
    const buildTree = (directory, prefix) => {
        // Get filtered children at the start of the function
        const visibleChildren = utils.getFilteredChildren(directory, state.EXCLUDED_DIRS);
        const childrenNames = Object.keys(visibleChildren).sort();

        childrenNames.forEach((childName, index) => {
            const isLast = index === childrenNames.length - 1;
            const connector = isLast ? '└── ' : '├── ';
            const item = visibleChildren[childName];
            const name = item.type === 'directory' ? `<a class="directory" href="#" data-path="${childName}">${childName}/</a>` : `<a class="file" href="#" data-path="${childName}">${childName}</a>`;
            
            treeString += `${prefix}${connector}${name}\n`;

            if (item.type === 'directory') {
                const newPrefix = prefix + (isLast ? '    ' : '│   ');
                buildTree(item, newPrefix);
            }
        });
    };
    
    buildTree(dir, '');
    addToOutput(`<pre class="tree-output">${treeString}</pre>`);
};

export const handleSearch = async (args, context) => {
    const { addToOutput, utils, state } = context;
    if (args.length === 0) {
        addToOutput('search: missing operand');
        return;
    }
    const searchTerm = args.join(' ');
    const lowerCaseTerm = searchTerm.toLowerCase();
    let foundMatches = false;

    const getAllFiles = (dir) => {
        let files = [];
        // Get filtered children before looping
        const visibleChildren = utils.getFilteredChildren(dir, state.EXCLUDED_DIRS);

        for (const childName in visibleChildren) {
            const child = visibleChildren[childName];
            if (child.type === 'file') {
                files.push(child);
            } else if (child.type === 'directory') {
                files = files.concat(getAllFiles(child));
            }
        }
        return files;
    };

    const allFiles = getAllFiles(state.fileSystem['~']);
    
    for (const file of allFiles) {
        try {
            const response = await fetch(file.path);
            if (!response.ok) continue;
            const content = await response.text();
            const lines = content.split('\n');
            const matchedLines = [];

            for (let i = 0; i < lines.length; i++) {
                if (lines[i].toLowerCase().includes(lowerCaseTerm)) {
                    const escapedLine = lines[i].replace(/</g, "<").replace(/>/g, ">");
                    matchedLines.push({ number: i + 1, text: escapedLine });
                }
            }

            if (matchedLines.length > 0) {
                if (!foundMatches) foundMatches = true;
                addToOutput(`<div class="search-result-filename"><a class="file" href="#" data-path="${file.path}">${file.path}</a></div>`);
                matchedLines.forEach(line => {
                    addToOutput(`<div class="search-result-line"><span class="search-line-number">${line.number}:</span>${line.text}</div>`);
                });
            }
        } catch (error) {
            // Ignore fetch errors
        }
    }

    if (!foundMatches) {
        addToOutput(`No results found for "${searchTerm}".`);
    }
};

export const handleTheme = (args, context) => {
    const { addToOutput, theme } = context;
    if (args.length === 0) {
        let themeList = 'Available themes:<br>';
        for (const key in theme.THEMES) {
            themeList += `  - <a href="#" data-theme="${key}">${theme.THEMES[key].name}</a><br>`;
        }
        addToOutput(themeList);
    } else {
        const themeKey = args[0].toLowerCase();
        if (theme.THEMES[themeKey]) {
            theme.applyTheme(themeKey, context.dom.themeDropdown);
            addToOutput(`Theme changed to ${theme.THEMES[themeKey].name}.`);
        } else {
            addToOutput(`<div class="error">theme: '${themeKey}' not found.</div>`);
        }
    }
};

export const handleClear = (args, context) => {
    context.dom.output.innerHTML = '';
};