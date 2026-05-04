// js/commands.js

export const COPY_ICON_SVG = `<svg aria-hidden="true" viewBox="0 0 16 16" version="1.1" data-view-component="true" class="octicon octicon-copy">
    <path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z"></path><path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"></path>
</svg>`;

export const CHECK_ICON_SVG = `<svg aria-hidden="true" viewBox="0 0 16 16" version="1.1" data-view-component="true" class="octicon octicon-check">
    <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"></path>
</svg>`;

export const handleCat = async (args, context) => {
  const { addToOutput, utils, state, dom, loadContentToMainArea } = context;
  if (args.length === 0) {
    addToOutput("cat: missing operand");
    return;
  }
  const pathArg = args[0];
  const finalPath = utils.resolvePath(pathArg, state.currentPath);
  const item = utils.findItemByPath(
    finalPath,
    state.fileSystem,
  );

  if (!item) {
    addToOutput(`cat: ${pathArg}: No such file or directory`);
    return;
  }
  if (item.type === "directory") {
    addToOutput(`cat: ${pathArg}: Is a directory`);
    return;
  }

  if (loadContentToMainArea) {
    await loadContentToMainArea(finalPath);
    addToOutput(
      `<div>Opened <span style="color: var(--link-color)">${pathArg}</span> in main view.</div>`,
    );
  } else {
    addToOutput(`cat: unable to open ${pathArg}.`);
  }
};

export const handleLs = (args, context) => {
  const { addToOutput, utils, state } = context;
  
  const flags = args.filter(a => a.startsWith('-'));
  const paths = args.filter(a => !a.startsWith('-'));
  const targetArg = paths.length > 0 ? paths[0] : ".";
  
  const finalPath = utils.resolvePath(targetArg, state.currentPath);
  const dir = utils.findItemByPath(finalPath, state.fileSystem);

  if (!dir) {
    addToOutput(`ls: cannot access '${targetArg}': No such file or directory`);
    return;
  }

  const useLongFormat = flags.includes("-la") || flags.includes("-l") || flags.includes("-al");

  if (dir.type !== "directory") {
    const link = `<a class="file" href="#" data-path="${finalPath}">${targetArg}</a>`;
    if (useLongFormat) {
      addToOutput(`<pre>-rw-r--r--  1 user group  4096 Jan 01 12:00 ${link}</pre>`);
    } else {
      addToOutput(`<div>${link}</div>`);
    }
    return;
  }

  const isHomeRoot = finalPath === "~";
  const visibleChildren = isHomeRoot ? utils.getFilteredChildren(dir, state.EXCLUDED_DIRS) : dir.children;

  const displayItems = { ...visibleChildren };
  if (useLongFormat) {
    displayItems["."] = { type: "directory" };
    if (finalPath !== "~" && finalPath !== "/") displayItems[".."] = { type: "directory" };
  }

  let listing = "";
  // Sort items alphabetically for consistent display
  const sortedNames = Object.keys(displayItems).sort();

  for (const name of sortedNames) {
    const item = displayItems[name];
    const isDir = item.type === "directory";
    const className = isDir ? "directory" : "file";
    
    let itemPath = name;
    if (name === ".") itemPath = finalPath;
    else if (name === "..") {
        const parts = finalPath.split('/');
        parts.pop();
        itemPath = parts.length > 0 ? parts.join('/') : '/';
        if (itemPath === "" || (parts.length === 1 && parts[0] === "~")) itemPath = "~";
    } else {
        itemPath = finalPath === "~" ? `~/${name}` : (finalPath.endsWith('/') ? `${finalPath}${name}` : `${finalPath}/${name}`);
    }

    const link = `<a class="${className}" href="#" data-path="${itemPath}">${name}${isDir && name !== "." && name !== ".." ? "/" : ""}</a>`;
    if (useLongFormat) {
      const perms = isDir ? "drwxr-xr-x" : "-rw-r--r--";
      const date = "Jan 01 12:00";
      listing += `${perms}  1 user group  4096 ${date} ${link}\n`;
    } else {
      listing += `${link}  `;
    }
  }
  addToOutput(
    useLongFormat ? `<pre>${listing}</pre>` : `<div>${listing}</div>`,
  );
};

export const handleCd = async (args, context) => {
  const { addToOutput, utils, state, updatePrompt, loadContentToMainArea } = context;
  const target = args[0] || "~";

  // --- UPDATED: Use the new path resolver ---
  const finalPath = utils.resolvePath(target, state.currentPath);
  const destination = utils.findItemByPath(
    finalPath,
    state.fileSystem,
  );

  if (destination && destination.type === "directory") {
    const isHomeRoot = state.currentPath === "~";
    const firstSegment = target.split("/")[0];
    if (isHomeRoot && state.EXCLUDED_DIRS.includes(firstSegment)) {
      addToOutput(`bash: cd: ${firstSegment}: Permission denied`);
      return;
    }
    state.currentPath = finalPath;
    if (loadContentToMainArea) {
      await loadContentToMainArea(finalPath);
    }
  } else {
    addToOutput(`cd: no such file or directory: ${args[0]}`);
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
  
  const paths = args.filter(a => !a.startsWith('-'));
  const targetArg = paths.length > 0 ? paths[0] : ".";
  const finalPath = utils.resolvePath(targetArg, state.currentPath);
  const dir = utils.findItemByPath(finalPath, state.fileSystem);

  if (!dir) {
    addToOutput(`tree: ${targetArg} [error opening dir]`);
    return;
  }
  if (dir.type !== "directory") {
    addToOutput(`${targetArg} [error opening dir]\n0 directories, 0 files`);
    return;
  }

  let treeString = `${targetArg}\n`;
  const buildTree = (directory, prefix, shouldFilter, currentDirPath) => {
    const visibleChildren = shouldFilter 
      ? utils.getFilteredChildren(directory, state.EXCLUDED_DIRS)
      : directory.children;
    const childrenNames = Object.keys(visibleChildren).sort();

    childrenNames.forEach((childName, index) => {
      const isLast = index === childrenNames.length - 1;
      const connector = isLast ? "└── " : "├── ";
      const item = visibleChildren[childName];
      
      let itemAbsPath = currentDirPath === "~" 
        ? `~/${childName}` 
        : (currentDirPath.endsWith('/') ? `${currentDirPath}${childName}` : `${currentDirPath}/${childName}`);

      const name =
        item.type === "directory"
          ? `<a class="directory" href="#" data-path="${itemAbsPath}">${childName}/</a>`
          : `<a class="file" href="#" data-path="${itemAbsPath}">${childName}</a>`;

      treeString += `${prefix}${connector}${name}\n`;

      if (item.type === "directory") {
        const newPrefix = prefix + (isLast ? "    " : "│   ");
        buildTree(item, newPrefix, shouldFilter, itemAbsPath);
      }
    });
  };

  const isHomeRoot = finalPath === "~";
  buildTree(dir, "", isHomeRoot, finalPath);
  addToOutput(`<pre class="tree-output">${treeString}</pre>`);
};

export const handleSearch = async (args, context) => {
  const { addToOutput, utils, state } = context;
  if (args.length === 0) {
    addToOutput("search: missing operand");
    return;
  }
  const searchTerm = args.join(" ");
  const lowerCaseTerm = searchTerm.toLowerCase();
  let foundMatches = false;

  const getAllFiles = (dir) => {
    let files = [];
    // Get filtered children before looping
    const visibleChildren = utils.getFilteredChildren(dir, state.EXCLUDED_DIRS);

    for (const childName in visibleChildren) {
      const child = visibleChildren[childName];
      if (child.type === "file") {
        files.push(child);
      } else if (child.type === "directory") {
        files = files.concat(getAllFiles(child));
      }
    }
    return files;
  };

  const allFiles = getAllFiles(state.fileSystem["~"]);

  for (const file of allFiles) {
    try {
      const response = await fetch(file.path);
      if (!response.ok) continue;
      const content = await response.text();
      const lines = content.split("\n");
      const matchedLines = [];

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes(lowerCaseTerm)) {
          const escapedLine = lines[i].replace(/</g, "<").replace(/>/g, ">");
          matchedLines.push({ number: i + 1, text: escapedLine });
        }
      }

      if (matchedLines.length > 0) {
        if (!foundMatches) foundMatches = true;
        addToOutput(
          `<div class="search-result-filename"><a class="file" href="#" data-path="${file.path}">${file.path}</a></div>`,
        );
        matchedLines.forEach((line) => {
          addToOutput(
            `<div class="search-result-line"><span class="search-line-number">${line.number}:</span>${line.text}</div>`,
          );
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
    let themeList = "Available themes:<br>";
    for (const key in theme.THEMES) {
      themeList += `  - <a href="#" data-theme="${key}">${theme.THEMES[key].name}</a><br>`;
    }
    addToOutput(themeList);
  } else {
    const themeKey = args[0].toLowerCase();
    if (theme.THEMES[themeKey]) {
      theme.applyTheme(themeKey); // No dropdown to hide
      addToOutput(`Theme changed to ${theme.THEMES[themeKey].name}.`);
    } else {
      addToOutput(`<div class="error">theme: '${themeKey}' not found.</div>`);
    }
  }
};

export const handleClear = (args, context) => {
  context.dom.output.innerHTML = "";
};
