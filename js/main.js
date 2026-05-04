// js/main.js
import { THEMES, applyTheme, getNextThemeKey } from "./theme.js";
import * as commands from "./commands.js";
import * as utils from "./utils.js";
import { handleTabCompletion } from "./autocomplete.js";

document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const dom = {
    output: document.getElementById("output"),
    commandInput: document.getElementById("command-input"),
    promptElement: document.getElementById("prompt"),
    terminal: document.getElementById("terminal"),
    homeBtn: document.getElementById("home-btn"),
    backBtn: document.getElementById("back-btn"),
    contentArea: document.getElementById("content-area"),
    terminalDrawer: document.getElementById("terminal-drawer"),
    terminalHandle: document.querySelector(".terminal-handle"),
  };

  // Application State
  const state = {
    fileSystem: {},
    currentPath: "~",
    commandHistory: [],
    historyIndex: -1,
    EXCLUDED_DIRS: ["images", "js", "css"],
    currentThemeKey: "default",
    themeRotation: 0,
    isThemeTransitioning: false,
  };

  // Configuration
  const SCROLL_TO_TOP_COMMANDS = [
    "ls",
    "ll",
    "cat",
    "help",
    "?",
    "tree",
    "search",
    "theme",
  ];
  const commandHandlers = {
    cat: commands.handleCat,
    ls: commands.handleLs,
    cd: commands.handleCd,
    help: commands.handleHelp,
    "?": commands.handleHelp,
    ll: (args, context) => commands.handleLs(["-la", ...args], context),
    tree: commands.handleTree,
    search: commands.handleSearch,
    theme: commands.handleTheme,
    clear: commands.handleClear,
  };

  // --- New Theme Changer ---
  const themeStyles = `
    #theme-dial {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 1.5rem;
        padding: 0.5rem;
        margin-right: 5px;
        color: var(--text-color);
        transition: transform 0.7s cubic-bezier(0.25, 1, 0.5, 1);
    }
    ::view-transition-old(root),
    ::view-transition-new(root) {
        animation: none;
        mix-blend-mode: normal;
    }
  `;
  const styleSheet = document.createElement("style");
  styleSheet.innerText = themeStyles;
  document.head.appendChild(styleSheet);

  const themeSwitcher = document.getElementById("theme-switcher");
  if (themeSwitcher) {
    themeSwitcher.innerHTML = `<button id="theme-dial" title="Change Theme"></button>`;
  }
  const themeDial = document.getElementById("theme-dial");

  const handleThemeChange = () => {
    // Prevent multiple transitions if button is clicked rapidly
    if (state.isThemeTransitioning) return;
    state.isThemeTransitioning = true;

    const nextThemeKey = getNextThemeKey(state.currentThemeKey);

    // Rotate the theme dial button
    state.themeRotation += 360; // Full rotation so the new icon lands upright
    themeDial.style.transform = `rotate(${state.themeRotation}deg)`;

    // Fallback for browsers that do not support View Transitions
    if (!document.startViewTransition) {
      applyTheme(nextThemeKey);
      state.currentThemeKey = nextThemeKey;
      if (themeDial) themeDial.textContent = THEMES[nextThemeKey].icon;
      state.isThemeTransitioning = false;
      return;
    }

    const rect = themeDial.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = document.startViewTransition(() => {
      applyTheme(nextThemeKey);
      state.currentThemeKey = nextThemeKey;
      if (themeDial) themeDial.textContent = THEMES[nextThemeKey].icon;
    });

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`
          ]
        },
        {
          duration: 800,
          easing: "cubic-bezier(0.25, 1, 0.5, 1)",
          pseudoElement: "::view-transition-new(root)"
        }
      ).onfinish = () => {
        state.isThemeTransitioning = false;
      };
    });
  };

  // Core Helper Functions
  const updatePrompt = () => {
    const user = "hal";
    const host = "portfolio";
    dom.promptElement.textContent = `${user}@${host}:${state.currentPath}$ `;
  };

  const addToOutput = (html) => {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = html;
    dom.output.appendChild(wrapper);
  };

  const scrollToBottom = () => {
    dom.output.scrollTop = dom.output.scrollHeight;
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

  // Main Content Loading
  const loadContentToMainArea = async (path) => {
    const finalPath = utils.resolvePath(path, state.currentPath);

    const skipHistory = context.skipHistory || false;
    if (!skipHistory && window.history.state?.path !== finalPath) {
      window.history.pushState({ path: finalPath }, "", `?path=${encodeURIComponent(finalPath)}`);
    }

    const item = utils.findItemByPath(
      finalPath,
      state.fileSystem,
    );

    if (!item) {
      dom.contentArea.innerHTML = `<h1>404 Not Found</h1><p>The path <code>${path}</code> does not exist.</p>`;
      return;
    }

    if (item.type === "directory") {
      // Render directory listing
      const isHomeRoot = finalPath === "~";
      const children = isHomeRoot ? utils.getFilteredChildren(item, state.EXCLUDED_DIRS) : item.children;
      
      const viewMode = state.directoryViewMode || 'list';
      
      let html = `<div class="directory-header">
          <h1>Directory: ${finalPath}</h1>
          <button id="view-toggle-btn" class="view-toggle-btn">${viewMode === 'list' ? 'Tile View 🔲' : 'List View 📄'}</button>
        </div>
        <ul class="directory-list ${viewMode === 'tiles' ? 'tiles' : ''}">`;

      const childrenKeys = Object.keys(children).sort();
      const thumbnails = {};
      
      // Pre-fetch markdown files to find the first image for a thumbnail
      await Promise.all(childrenKeys.map(async (key) => {
        const child = children[key];
        if (child.type === "file" && child.path.endsWith('.md')) {
          try {
            const response = await fetch(child.path);
            const text = await response.text();
            
            // 1. Match standard markdown !alt
            const standardMatch = text.match(/!\[.*?\]\((.*?)\)/);
            if (standardMatch) {
              thumbnails[key] = standardMatch[1];
              return;
            }
            
            // 2. Match Obsidian style ![[filename.ext]] or ![[filename.ext|size]]
            const obsidianMatch = text.match(/!\[\[(.*?)(?:\|.*?)?\]\]/);
            if (obsidianMatch) {
              thumbnails[key] = `images/${obsidianMatch[1].trim()}`;
              return;
            }
            
            // 3. Match standard HTML img tags
            const imgTagMatch = text.match(/<img[^>]+src=["']([^"']+)["']/i);
            if (imgTagMatch) {
              thumbnails[key] = imgTagMatch[1];
            }
          } catch (e) {
            console.error("Failed to fetch thumbnail for", child.path);
          }
        }
      }));

      for (const key of childrenKeys) {
        const child = children[key];
        const isDir = child.type === "directory";
        const isImage = !isDir && key.match(/\.(png|jpe?g|gif|svg|webp)$/i);
        
        let iconHtml = "";
        if (isImage && viewMode === "tiles") {
          iconHtml = `<span class="icon"><img src="${child.path}" class="thumbnail" alt="${key}" /></span> `;
        } else if (thumbnails[key]) {
          const inlineStyle = viewMode === 'list' 
            ? 'style="width: 1.5em; height: 1.5em; object-fit: cover; border-radius: 4px; vertical-align: middle; margin-right: 5px;"' 
            : '';
          iconHtml = `<span class="icon"><img src="${thumbnails[key]}" class="thumbnail post-thumbnail" alt="${key}" ${inlineStyle} /></span> `;
        }

        const fileDate = isDir ? "" : `<span class="date"></span>`; // COULD PARSE DATE IF WE HAD METADATA
        const childPath = finalPath === "~" ? `~/${key}` : `${finalPath}/${key}`;
        html += `<li class="directory-list-item"><a href="#" data-nav="${childPath}">${iconHtml}<span class="name">${key}</span></a>${fileDate}</li>`;
      }
      html += `</ul>`;
      dom.contentArea.innerHTML = html;
      
      const toggleBtn = document.getElementById('view-toggle-btn');
      if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
          state.directoryViewMode = state.directoryViewMode === 'tiles' ? 'list' : 'tiles';
          loadContentToMainArea(path);
        });
      }

      if (state.directoryViewMode === 'tiles') {
        const adjustFontSizes = () => {
          const items = document.querySelectorAll('.directory-list.tiles .directory-list-item');
          items.forEach(item => {
            const nameEl = item.querySelector('.name');
            if (!nameEl) return;
            
            // Reset font size
            nameEl.style.fontSize = '1.1rem';
            let fontSize = 1.1; // rem
            
            // Allow name text to be measured
            nameEl.style.display = 'inline-block';
            nameEl.style.width = 'auto'; // Revert 100% so we can get actual width
            
            const maxWidth = item.clientWidth - 40; // Accounting for 20px padding left/right
            
            while (nameEl.scrollWidth > maxWidth && fontSize > 0.6) {
              fontSize -= 0.05;
              nameEl.style.fontSize = `${fontSize}rem`;
            }
            // Restore width for rendering
            nameEl.style.width = '100%';
          });
        };
        
        // Use ResizeObserver for more robust resizing over window resize listener
        const ro = new ResizeObserver(() => {
          adjustFontSizes();
        });
        
        const list = document.querySelector('.directory-list.tiles');
        if (list) ro.observe(list);
      }
    } else if (item.type === "file") {
      try {
        const response = await fetch(item.path);
        if (!response.ok) throw new Error("Network response was not ok");
        
        // Calculate back link
        const pathParts = finalPath.split('/');
        let parentPath = pathParts.length > 1 ? pathParts.slice(0, -1).join('/') : (finalPath.startsWith('~') ? '~' : '/');
        if (parentPath === "") parentPath = "/";
        const folderName = parentPath === '~' ? 'Home' : (parentPath === '/' ? 'Root' : parentPath.split('/').pop());
        const backArrowHtml = `<div style="margin-bottom: 20px;"><a href="#" data-nav="${parentPath}" class="back-link">← Back to ${folderName}</a></div>`;

        if (item.path.endsWith(".md")) {
          let content = await response.text();
          // Strip YAML frontmatter before parsing - be more flexible
          let markdownContent = content.replace(/^---\s*\n[\s\S]*?\n---\s*?\n?/, "");
          
          let rawHtml = marked.parse(markdownContent);
          
          // Wrap tables for responsiveness
          rawHtml = rawHtml.replace(/<table>/g, '<div class="table-wrapper"><table>');
          rawHtml = rawHtml.replace(/<\/table>/g, '</table></div>');
          
          const finalHtml = utils.preprocessObsidianSyntax(rawHtml);
          
          let outputHtml = finalHtml;
          
          // Apply percentage-based redaction safely to the generated HTML
          if (item.path.includes("resume.md")) {
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = outputHtml;
            
            const percentChanceToStart = 0.22; // 12% chance to start a redaction block

            const redactNodes = (node) => {
              if (node.nodeType === 3) { // Text node
                if (!node.textContent.trim()) return;
                
                // Split by spaces so layout and spacing are perfectly preserved
                const tokens = node.textContent.split(/(\s+)/);
                const fragment = document.createDocumentFragment();
                let changed = false;

                let isRedacting = false;
                let wordsToRedact = 0;
                let currentRedactedText = "";
                let currentDelay = "";
                let currentDuration = "";

                const appendRedactedSpan = (text) => {
                  changed = true;
                  const span = document.createElement("span");
                  span.className = "classified";
                  span.style.setProperty("--delay", currentDelay + "s");
                  span.style.setProperty("--duration", currentDuration + "s");
                  span.textContent = text;
                  fragment.appendChild(span);
                };

                tokens.forEach(token => {
                  const isWord = token.trim().length > 0;

                  if (!isRedacting) {
                    // Start a block on a solid word based on probability
                    if (isWord && token.trim().length > 3 && /^[a-zA-Z]+$/.test(token.trim()) && Math.random() < percentChanceToStart) {
                      isRedacting = true;
                      wordsToRedact = Math.floor(Math.random() * 6) + 1; // Block size: 1 to 6 words
                      currentDelay = (Math.random() * 0.4 + 0.5).toFixed(2);
                      currentDuration = (Math.random() * 1.5 + 1.0).toFixed(2);
                      
                      currentRedactedText = token;
                      wordsToRedact--;
                      
                      if (wordsToRedact <= 0) {
                        appendRedactedSpan(currentRedactedText);
                        isRedacting = false;
                        currentRedactedText = "";
                      }
                    } else {
                      fragment.appendChild(document.createTextNode(token));
                    }
                  } else {
                    // We are actively redacting a block
                    currentRedactedText += token;
                    if (isWord) wordsToRedact--;
                    
                    if (wordsToRedact <= 0) {
                      appendRedactedSpan(currentRedactedText);
                      isRedacting = false;
                      currentRedactedText = "";
                    }
                  }
                });

                // Catch any trailing redaction blocks that hit the end of the text node
                if (isRedacting && currentRedactedText) {
                  appendRedactedSpan(currentRedactedText);
                }

                if (changed) node.parentNode.replaceChild(fragment, node);
              } else if (node.nodeType === 1) { // Element node
                // Avoid redacting code blocks, links, and pre-existing spans
                if (!["CODE", "PRE", "A", "SPAN"].includes(node.tagName)) {
                  Array.from(node.childNodes).forEach(redactNodes);
                }
              }
            };

            Array.from(tempDiv.childNodes).forEach(redactNodes);
            outputHtml = tempDiv.innerHTML;
          }
          
          dom.contentArea.innerHTML = backArrowHtml + `<div class="markdown-content">${outputHtml}</div>`;
        } else if (item.path.match(/\.(png|jpe?g|gif|svg|webp)$/i)) {
          // Render image
          dom.contentArea.innerHTML = backArrowHtml + `<img src="${item.path}" style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" alt="Image view"/>`;
        } else if (item.path.endsWith(".json")) {
          // JSON handling
          let content = await response.text();
          const formattedJson = JSON.stringify(JSON.parse(content), null, 2);
          const highlightedJson = hljs.highlight(formattedJson, {
            language: "json",
          }).value;
          dom.contentArea.innerHTML = backArrowHtml + `<pre><code class="hljs json">${highlightedJson}</code></pre>`;
        } else {
          // Other text files like JS, HTML, CSS
          let content = await response.text();
          
          let lang = 'plaintext';
          if (item.path.endsWith('.js')) lang = 'javascript';
          else if (item.path.endsWith('.css')) lang = 'css';
          else if (item.path.endsWith('.html')) lang = 'xml'; // hljs uses xml for html
          
          const highlightedCode = hljs.highlight(content, { language: lang, ignoreIllegals: true }).value;
          dom.contentArea.innerHTML = backArrowHtml + `<pre><code class="hljs ${lang}">${highlightedCode}</code></pre>`;
        }

        // Add copy buttons to code blocks
        dom.contentArea.querySelectorAll("pre").forEach((preElement) => {
          const copyBtn = document.createElement("button");
          copyBtn.className = "copy-btn";
          copyBtn.innerHTML = commands.COPY_ICON_SVG || "Copy";
          copyBtn.addEventListener("click", () => {
            const codeToCopy = preElement.querySelector("code").innerText;
            navigator.clipboard.writeText(codeToCopy).then(() => {
              copyBtn.innerHTML = commands.CHECK_ICON_SVG || "Copied!";
              setTimeout(() => {
                copyBtn.innerHTML = commands.COPY_ICON_SVG || "Copy";
              }, 2000);
            });
          });
          preElement.appendChild(copyBtn);
        });
      } catch (error) {
        dom.contentArea.innerHTML = `<h1>Error</h1><p>Failed to load ${item.path}: ${error.message}</p>`;
      }
    }
  };

  context.loadContentToMainArea = loadContentToMainArea;

  const attachNavListeners = () => {
    document.body.addEventListener("click", (e) => {
      const navLink = e.target.closest("a[data-nav]");
      if (navLink) {
        e.preventDefault();
        const path = navLink.dataset.nav;
        
        const finalPath = utils.resolvePath(path, state.currentPath);
        const item = utils.findItemByPath(finalPath, state.fileSystem);

        if (item && item.type === "directory") {
            executeCommand(`cd ${path}`);
            executeCommand("ls -la");
        } else {
            executeCommand(`cat ${path}`);
        }
        
        window.scrollTo({ top: 0, behavior: "smooth" });
      }

      // If click is outside the terminal, close it
      if (
        !dom.terminalDrawer.contains(e.target) &&
        !e.target.closest("#theme-switcher") &&
        !e.target.closest(".terminal-handle")
      ) {
        dom.terminalDrawer.classList.remove("open");
      }
    });

    window.addEventListener("popstate", (e) => {
      const urlParams = new URLSearchParams(window.location.search);
      const path = e.state?.path || urlParams.get("path") || "welcome.md";
      const finalPath = utils.resolvePath(path, "~");
      const item = utils.findItemByPath(finalPath, state.fileSystem);

      if (item && item.type === "directory") {
        executeCommand(`cd ${path}`, true);
        executeCommand("ls -la", true);
      } else {
        executeCommand(`cat ${path}`, true);
      }
    });
  };

  // Terminal Drawer Logic
  dom.terminalDrawer.addEventListener("click", (e) => {
    e.stopPropagation(); // Prevent clicks inside terminal from closing it
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === '`' && e.ctrlKey) {
      e.preventDefault();
      dom.terminalDrawer.classList.toggle("open");
      if (dom.terminalDrawer.classList.contains("open")) {
        dom.commandInput.focus();
      }
    }
  });

  dom.terminalHandle.addEventListener("click", (e) => {
    dom.terminalDrawer.classList.toggle("open");
    if (dom.terminalDrawer.classList.contains("open")) {
      dom.commandInput.focus();
    }
  });

  // Main Command Execution Logic for Terminal
  const executeCommand = async (cmd, skipHistory = false) => {
    const [command, ...args] = cmd
      .trim()
      .split(" ")
      .filter((i) => i);

    context.skipHistory = skipHistory;

    const outputWrapper = document.createElement("div");
    outputWrapper.innerHTML = `<div class="command-line"><span class="prompt">${dom.promptElement.textContent}</span>${cmd}</div>`;
    dom.output.appendChild(outputWrapper);

    if (command) {
      const handler = commandHandlers[command];
      if (handler) {
        await handler(args, context);
      } else {
        // If it's a file, try to open it in the main content area as a fallback?
        addToOutput(
          `<div class="error">bash: command not found: ${command}</div>`,
        );
      }
    }

    if (cmd) state.commandHistory.unshift(cmd);
    state.historyIndex = -1;

    if (SCROLL_TO_TOP_COMMANDS.includes(command)) {
      outputWrapper.scrollIntoView({ behavior: "auto", block: "start" });
    } else {
      scrollToBottom();
    }
  };

  dom.terminal.addEventListener("click", (e) => {
    if (e.target === dom.terminal || e.target === dom.output) {
      dom.commandInput.focus({ preventScroll: true });
    }
  });

  // Terminal input event listeners
  dom.commandInput.addEventListener("keydown", (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      handleTabCompletion(context);
    } else if (e.key === "Enter") {
      const cmd = dom.commandInput.value;
      dom.commandInput.value = "";
      executeCommand(cmd);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (state.historyIndex < state.commandHistory.length - 1) {
        state.historyIndex++;
        dom.commandInput.value = state.commandHistory[state.historyIndex];
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (state.historyIndex > 0) {
        state.historyIndex--;
        dom.commandInput.value = state.commandHistory[state.historyIndex];
      } else {
        state.historyIndex = -1;
        dom.commandInput.value = "";
      }
    }
  });

  dom.output.addEventListener("click", (e) => {
    const link = e.target.closest("a");
    if (!link) return;

    if (link.dataset.path) {
      e.preventDefault();
      const path = link.dataset.path;

      if (link.classList.contains("directory")) {
        executeCommand(`cd ${path}`);
        executeCommand("ls -la");
      } else if (link.classList.contains("file")) {
        executeCommand(`cat ${path}`);
        // Optional: also load it into the main viewer
        loadContentToMainArea(utils.resolvePath(path, state.currentPath));
      }
    }
  });

  dom.homeBtn.addEventListener("click", () => {
    executeCommand("cd ~");
    executeCommand("ls -la");
  });
  dom.backBtn.addEventListener("click", () => {
    executeCommand("cd ..");
    executeCommand("ls -la");
  });

  if (themeDial) {
    themeDial.addEventListener("click", handleThemeChange);
  }

  // Initialization
  const bootUp = async () => {
    let savedTheme = localStorage.getItem("portfolio-theme");
    if (!savedTheme || !THEMES[savedTheme]) savedTheme = "primarydark";

    applyTheme(savedTheme);
    state.currentThemeKey = savedTheme;
    if (themeDial) themeDial.textContent = THEMES[savedTheme].icon;

    try {
      const response = await fetch("file-manifest.json");
      if (!response.ok) throw new Error("Failed to load file manifest.");
      state.fileSystem = await response.json();
      updatePrompt();

      attachNavListeners();

      // Terminal boot output
      const quickStartHtml = `
<div class="markdown-body" style="margin-bottom: 10px;">
<div style="color: var(--prompt-color); font-weight: bold; margin-bottom: 5px;">Terminal Quick Start</div>
<ul style="margin-top:0;">
<li>Use <code style="background:transparent;padding:0;color:var(--command-color)">ll</code> to see all files in the current directory.</li>
<li>Use <code style="background:transparent;padding:0;color:var(--command-color)">cat &lt;filename&gt;</code> to view a file's content.</li>
<li>Use <code style="background:transparent;padding:0;color:var(--command-color)">cd &lt;directory&gt;</code> to enter a folder.</li>
<li>Use <code style="background:transparent;padding:0;color:var(--command-color)">help</code> to see the list of all available commands.</li>
</ul>
</div>`;
      addToOutput(quickStartHtml);

      // Initial load of content based on URL or default
      const urlParams = new URLSearchParams(window.location.search);
      const initialPath = urlParams.get("path") || "welcome.md";
      const finalPath = utils.resolvePath(initialPath, "~");
      const item = utils.findItemByPath(finalPath, state.fileSystem);

      if (item && item.type === "directory") {
        await executeCommand(`cd ${initialPath}`, true);
        await executeCommand("ls -la", true);
      } else {
        await executeCommand(`cat ${initialPath}`, true);
      }

      state.commandHistory = [];
    } catch (error) {
      console.error(error);
      addToOutput(
        `<div class="error">FATAL: Could not load file-manifest.json.<br>Please run 'node generate-manifest.js' and refresh.</div>`,
      );
    }
  };

  // Configure third-party libraries
  if (typeof marked !== 'undefined') {
    marked.setOptions({
      gfm: true,
      breaks: true,
      highlight: function (code, lang) {
        const language = hljs.getLanguage(lang) ? lang : "plaintext";
        try {
          return hljs.highlight(code, { language }).value;
        } catch (e) {
          return code;
        }
      },
      langPrefix: 'hljs language-'
    });
  }

  bootUp();
});
