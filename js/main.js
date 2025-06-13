// js/main.js
import { THEMES, applyTheme } from './theme.js';
import * as commands from './commands.js';
import * as utils from './utils.js';
import { handleTabCompletion } from './autocomplete.js';

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const dom = {
        output: document.getElementById('output'),
        commandInput: document.getElementById('command-input'),
        promptElement: document.getElementById('prompt'),
        terminal: document.getElementById('terminal'),
        homeBtn: document.getElementById('home-btn'),
        backBtn: document.getElementById('back-btn'),
        themeBtn: document.getElementById('theme-btn'),
        themeDropdown: document.getElementById('theme-dropdown'),
    };

    // Application State
    const state = {
        fileSystem: {},
        currentPath: '~',
        commandHistory: [],
        historyIndex: -1,
        EXCLUDED_DIRS: ['images', 'js'],
    };
    
    // Configuration
    const SCROLL_TO_TOP_COMMANDS = ['ls', 'll', 'cat', 'help', '?', 'tree', 'search', 'theme'];
    const commandHandlers = {
        cat: commands.handleCat,
        ls: commands.handleLs,
        cd: commands.handleCd,
        help: commands.handleHelp,
        '?': commands.handleHelp,
        ll: (args, context) => commands.handleLs(['-la'], context),
        tree: commands.handleTree,
        search: commands.handleSearch,
        theme: commands.handleTheme,
        clear: commands.handleClear,
    };

    // Core Helper Functions
    const updatePrompt = () => {
        const user = 'Hal';
        const host = 'portfolio';
        dom.promptElement.textContent = `${user}@${host}:${state.currentPath}$ `;
    };

    const addToOutput = (html) => {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = html;
        dom.output.appendChild(wrapper);
    };

    const scrollToBottom = () => {
        dom.terminal.scrollTop = dom.terminal.scrollHeight;
    };

    // The context object passed to handlers
    const context = {
        addToOutput,
        updatePrompt,
        utils,
        state,
        dom,
        theme: { THEMES, applyTheme },
        commandHandlers,
        scrollToBottom,
    };

    // Main Command Execution Logic
    const executeCommand = async (cmd) => {
        const [command, ...args] = cmd.trim().split(' ').filter(i => i);

        const outputWrapper = document.createElement('div');
        outputWrapper.innerHTML = `<div class="command-line"><span class="prompt">${dom.promptElement.textContent}</span>${cmd}</div>`;
        dom.output.appendChild(outputWrapper);

        if (command) {
            const handler = commandHandlers[command];
            if (handler) {
                await handler(args, context);
            } else {
                addToOutput(`<div class="error">bash: command not found: ${command}</div>`);
            }
        }

        if (cmd) state.commandHistory.unshift(cmd);
        state.historyIndex = -1;

        if (SCROLL_TO_TOP_COMMANDS.includes(command)) {
            outputWrapper.scrollIntoView({ behavior: 'auto', block: 'start' });
        } else {
            scrollToBottom();
        }
    };

    dom.terminal.addEventListener('click', (e) => {
    // Only focus the input if the user isn't trying to select text.
    // A simple way to check is if the click target is the terminal div itself
    // or the output div, and not a link or other interactive element.
    if (e.target === dom.terminal || e.target === dom.output) {
        dom.commandInput.focus({ preventScroll: true });
    }
});
    // Event Listeners
    dom.commandInput.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            e.preventDefault(); // Prevent tabbing to the next element
            handleTabCompletion(context);
        } else if (e.key === 'Enter') {
            const cmd = dom.commandInput.value;
            dom.commandInput.value = '';
            executeCommand(cmd);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (state.historyIndex < state.commandHistory.length - 1) {
                state.historyIndex++;
                dom.commandInput.value = state.commandHistory[state.historyIndex];
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (state.historyIndex > 0) {
                state.historyIndex--;
                dom.commandInput.value = state.commandHistory[state.historyIndex];
            } else {
                state.historyIndex = -1;
                dom.commandInput.value = '';
            }
        }
    });

    dom.output.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link) return;

        if (link.dataset.path) {
            e.preventDefault();
            const path = link.dataset.path;

            if (link.classList.contains('directory')) {
                executeCommand(`cd ${path}`);
                executeCommand('ls -la');
            } else if (link.classList.contains('file')) {
                executeCommand(`cat ${path}`);
            }
        } else if (link.dataset.theme) {
            e.preventDefault();
            applyTheme(link.dataset.theme, dom.themeDropdown);
        }
    });

    dom.homeBtn.addEventListener('click', () => { executeCommand('cd ~'); executeCommand('ls -la'); });
    dom.backBtn.addEventListener('click', () => { executeCommand('cd ..'); executeCommand('ls -la'); });
    dom.themeBtn.addEventListener('click', (e) => { e.stopPropagation(); dom.themeDropdown.classList.toggle('hidden'); });
    window.addEventListener('click', () => { if (!dom.themeDropdown.classList.contains('hidden')) dom.themeDropdown.classList.add('hidden'); });

    // Initialization
    const bootUp = async () => {
        for (const key in THEMES) {
            const option = document.createElement('a');
            option.className = 'theme-option';
            option.textContent = THEMES[key].name;
            option.href = '#';
            option.onclick = (e) => { e.preventDefault(); applyTheme(key, dom.themeDropdown); };
            dom.themeDropdown.appendChild(option);
        }
        const savedTheme = localStorage.getItem('portfolio-theme') || 'gruvbox';
        applyTheme(savedTheme, dom.themeDropdown);

        try {
            const response = await fetch('file-manifest.json');
            if (!response.ok) throw new Error('Failed to load file manifest.');
            state.fileSystem = await response.json();
            updatePrompt();
            
            await executeCommand('cat welcome.md');
            await executeCommand('ls -la');
            
            state.commandHistory = [];
        } catch (error) {
            console.error(error);
            addToOutput(`<div class="error">FATAL: Could not load file-manifest.json.<br>Please run 'node generate-manifest.js' and refresh.</div>`);
        }
    };

    // Configure third-party libraries
marked.setOptions({
    gfm: true, // <-- enable GitHub Flavored Markdown (for tables)
    highlight: function(code, lang) { 
        const language = hljs.getLanguage(lang) ? lang : 'plaintext'; 
        return hljs.highlight(code, { language }).value; 
    } 
});
    
    bootUp();
});