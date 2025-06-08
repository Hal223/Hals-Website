document.addEventListener('DOMContentLoaded', () => {
    const output = document.getElementById('output');
    const commandInput = document.getElementById('command-input');
    const promptElement = document.getElementById('prompt');
    const terminal = document.getElementById('terminal');
    const homeBtn = document.getElementById('home-btn');
    const backBtn = document.getElementById('back-btn');

    let fileSystem = {};
    let currentPath = '~';
    let commandHistory = [];
    let historyIndex = -1;

    const EXCLUDED_DIRS = ['images'];

    marked.setOptions({
        highlight: function(code, lang) {
            const language = hljs.getLanguage(lang) ? lang : 'plaintext';
            return hljs.highlight(code, { language }).value;
        }
    });

    const preprocessObsidianSyntax = (content) => {
        content = content.replace(/!\[\[(.*?)\]\]/g, (match, p1) => `
            <img src="images/${p1}" alt="${p1}" class="markdown-image">`);
        content = content.replace(/\[\[(.*?)\]\]/g, (match, p1) => `
            <a class="file" href="#" data-path="${p1}">${p1}</a>`);
        return content;
    };

    // --- CORE FUNCTIONS ---

    const updatePrompt = () => {
        const user = 'Hal';
        const host = 'portfolio';
        promptElement.textContent = `${user}@${host}:${currentPath}$ `;
    };

    const executeCommand = async (cmd) => {
        addToOutput(`<div class="command-line"><span class="prompt">${promptElement.textContent}</span>${cmd}</div>`);
        
        const [command, ...args] = cmd.trim().split(' ').filter(i => i);

        if (command) {
            switch (command) {
                case 'cat': await handleCat(args); break;
                case 'ls': handleLs(args); break;
                case 'cd': handleCd(args); break;
                case 'help':
                case '?':
                    handleHelp(); break;
                case 'll':
                    handleLs(['-la']); break;
                case 'tree':
                    handleTree(); break;
                case 'search':
                    await handleSearch(args); break;
                case 'clear': output.innerHTML = ''; break;
                default: addToOutput(`<div class="error">bash: command not found: ${command}</div>`);
            }
        }

        if (cmd) commandHistory.unshift(cmd);
        historyIndex = -1;
        scrollToBottom();
    };

    const addToOutput = (html) => {
        output.innerHTML += html;
    };

    const scrollToBottom = () => {
        terminal.scrollTop = terminal.scrollHeight;
    };

    const findItemByPath = (path) => {
        const parts = path.split('/').filter(p => p);
        let current = fileSystem['~'];
        for (const part of parts) {
            if (!current || current.type !== 'directory' || !current.children[part]) {
                return null;
            }
            current = current.children[part];
        }
        return current;
    };
    
    const getCurrentDir = () => findItemByPath(currentPath.replace(/^~\/?/, ''));

    // --- COMMAND HANDLERS ---

    const handleHelp = () => {
        const helpText = `
Available commands:
  <span class="command-color">cat [file]</span>      - Display file content
  <span class="command-color">ls [-la]</span>        - List files and directories
  <span class="command-color">ll</span>              - Alias for 'ls -la'
  <span class="command-color">cd [dir]</span>        - Change directory
  <span class="command-color">tree</span>            - Display directory structure as a tree
  <span class="command-color">search [term]</span>   - Search for text in all files
  <span class="command-color">help, ?</span>         - Show this help message
  <span class="command-color">clear</span>           - Clear the terminal
        `;
        addToOutput(helpText);
    };

    const handleCat = async (args) => {
        if (args.length === 0) {
            addToOutput('cat: missing operand'); return;
        }
        const pathArg = args[0];
        let file;
        let fileName;

        if (pathArg.includes('/')) {
            file = findItemByPath(pathArg);
            fileName = pathArg.split('/').pop();
        } else {
            const dir = getCurrentDir();
            file = dir.children[pathArg];
            fileName = pathArg;
        }

        if (file && file.type === 'file') {
            try {
                const response = await fetch(file.path);
                if (!response.ok) throw new Error(`Network response was not ok`);
                let content = await response.text();

                if (fileName.endsWith('.md')) {
                    const processedContent = preprocessObsidianSyntax(content);
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

    const handleLs = (args) => {
        const dir = getCurrentDir();
        if (!dir) return;
        const useLongFormat = args.includes('-la');
        let listing = '';
        const children = { ...dir.children };
        if (useLongFormat) {
            children['.'] = { type: 'directory' };
            if (currentPath !== '~') children['..'] = { type: 'directory' };
        }
        for (const [name, item] of Object.entries(children)) {
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

    const handleCd = (args) => {
        const target = args[0] || '~';
        if (target === '~' || target === '') {
            currentPath = '~';
        } else if (target === '..') {
            if (currentPath !== '~') {
                const parts = currentPath.split('/');
                parts.pop();
                currentPath = parts.join('/') || '~';
            }
        } else {
            const currentDir = getCurrentDir();
            const newDir = currentDir.children[target];
            if (newDir && newDir.type === 'directory') {
                currentPath = currentPath === '~' ? `~/${target}` : `${currentPath}/${target}`;
            } else {
                addToOutput(`cd: no such file or directory: ${target}`);
            }
        }
        updatePrompt();
    };

    const handleTree = () => {
        const dir = getCurrentDir();
        if (!dir) return;
        let treeString = '.\n';
        const buildTree = (directory, prefix) => {
            const children = Object.keys(directory.children).sort();
            children.forEach((child, index) => {
                if (EXCLUDED_DIRS.includes(child)) {
                    return;
                }
                const isLast = index === children.length - 1;
                const connector = isLast ? '└── ' : '├── ';
                const item = directory.children[child];
                const name = item.type === 'directory' ? `<a class="directory" href="#" data-path="${child}">${child}/</a>` : `<a class="file" href="#" data-path="${child}">${child}</a>`;
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
    
    const handleSearch = async (args) => {
        if (args.length === 0) {
            addToOutput('search: missing operand');
            return;
        }
        const searchTerm = args.join(' ');
        const lowerCaseTerm = searchTerm.toLowerCase();
        let foundMatches = false;

        const getAllFiles = (dir) => {
            let files = [];
            for (const childName in dir.children) {
                if (EXCLUDED_DIRS.includes(childName)) continue;
                const child = dir.children[childName];
                if (child.type === 'file') {
                    files.push(child);
                } else if (child.type === 'directory') {
                    files = files.concat(getAllFiles(child));
                }
            }
            return files;
        };

        const allFiles = getAllFiles(fileSystem['~']);
        
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
            } catch (error) { /* Ignore fetch errors */ }
        }

        if (!foundMatches) {
            addToOutput(`No results found for "${searchTerm}".`);
        }
    };

    // --- EVENT LISTENERS ---
    commandInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const cmd = commandInput.value;
            commandInput.value = '';
            executeCommand(cmd);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (historyIndex < commandHistory.length - 1) {
                historyIndex++;
                commandInput.value = commandHistory[historyIndex];
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex > 0) {
                historyIndex--;
                commandInput.value = commandHistory[historyIndex];
            } else {
                historyIndex = -1;
                commandInput.value = '';
            }
        }
    });

    output.addEventListener('click', (e) => {
        const link = e.target.closest('a[data-path]');
        if (link) {
            e.preventDefault();
            const path = link.dataset.path;
            const item = findItemByPath(path.replace(/^~\/?/, ''));
            if (item && item.type === 'directory') {
                executeCommand(`cd ${path}`);
                executeCommand('ls -la');
            } else if (item) {
                executeCommand(`cat ${path}`);
            }
        }
    });

    homeBtn.addEventListener('click', () => {
        executeCommand('cd ~');
        executeCommand('ls -la');
    });

    backBtn.addEventListener('click', () => {
        executeCommand('cd ..');
        executeCommand('ls -la');
    });

    // --- INITIALIZATION ---
    const bootUp = async () => {
        try {
            const response = await fetch('file-manifest.json');
            if (!response.ok) throw new Error('Failed to load file manifest.');
            fileSystem = await response.json();
            
            updatePrompt();
            await executeCommand('cat welcome.md');
            await executeCommand('ls -la');
            commandHistory = [];
        } catch (error) {
            console.error(error);
            addToOutput(`<div class="error">FATAL: Could not load file-manifest.json.<br>Please run 'node generate-manifest.js' and refresh.</div>`);
        }
    };

    bootUp();
});