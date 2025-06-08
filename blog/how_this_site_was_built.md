# How This Site Was Built
`2025-06-07`
This portfolio isn't a standard webpage; it's an interactive terminal emulator built from the ground up with vanilla JavaScript, HTML, and CSS. The goal was to create something that reflects a developer's environment while still being accessible and functional.

This document highlights some of the most interesting technical challenges and solutions involved in its creation.

---

## The Virtual File System

The biggest challenge was simulating a file system in the browser. How do you handle commands like `ls`, `cd`, and `cat` without a real back-end?

Initially, it started as a large JavaScript object hard-coded into the main script. This worked, but it was a nightmare to update. Adding a new blog post meant manually editing a massive object.

The final solution was to automate this with a Node.js script, `generate-manifest.js`. This script scans the project directory and creates a `file-manifest.json` file. The web app simply fetches this manifest on startup.

Here's a snippet from the generator script:

```javascript
// generate-manifest.js
const fs = require('fs');
const path = require('path');

// A list of files/folders to ignore during the scan
const ignoreList = [
    '.git', 'node_modules', 'index.html', 
    'style.css', 'js', 'generate-manifest.js', 
    'file-manifest.json'
];

function generateManifest(dir) {
    // ... logic to read directory and build the object ...
}

const projectManifest = generateManifest('.');
// Write the final JSON object to a file
fs.writeFileSync('file-manifest.json', JSON.stringify({ '~': projectManifest }, null, 2));
```
Now, adding new content is as simple as creating a file and running `node generate-manifest.js`.

---

## The Heart of the Terminal: The Command Loop

The core of the terminal is an asynchronous `executeCommand` function that acts as a central dispatcher. It parses the user's input and routes it to the correct handler function.

Instead of a giant `if/else` or `switch` statement, the logic is managed by a clean `commandHandlers` map. This makes adding new commands incredibly simple.

```javascript
// from js/main.js
const commandHandlers = {
    cat: commands.handleCat,
    ls: commands.handleLs,
    cd: commands.handleCd,
    help: commands.handleHelp,
    // ... and so on
};

const handler = commandHandlers[command];
if (handler) {
    await handler(args, context);
}
```

---

## Dynamic Content and A Touch of Obsidian

One of the key features is rendering Markdown files with support for Obsidian-style syntax like internal links and image embeds.

### 1. Rendering Markdown
When you `cat` a `.md` file, the content is fetched and parsed using the `marked.js` library. The real trick was handling our custom syntax. Initially, I tried replacing `[[...]]` before parsing, but `marked.js` would escape the resulting HTML.

The solution was to let `marked.js` do its job first, and then run our custom replacer on the *resulting HTML*.

```javascript
// from js/commands.js
if (fileName.endsWith('.md')) {
    // 1. Parse the raw Markdown into HTML first.
    const rawHtml = marked.parse(content);
    // 2. Now, run our custom syntax replacer on the generated HTML.
    const finalHtml = utils.preprocessObsidianSyntax(rawHtml);
    addToOutput(`<div class="markdown-body">${finalHtml}</div>`);
}
```

### 2. Custom Syntax
The `preprocessObsidianSyntax` function uses simple but effective regular expressions to find and replace the custom tags.

` ! [ [ framework-logos.png ] ] `

This is what the function looks like:
```javascript
// from js/utils.js
export function preprocessObsidianSyntax(content) {
    // Image syntax: ![[image.png]]
    content = content.replace(/!\[\[(.*?)\]\]/g, (match, p1) => 
        `<img src="images/${p1}" alt="${p1}" class="markdown-image">`);
    
    // File link syntax: [[file.md]]
    content = content.replace(/\[\[(.*?)\]\]/g, (match, p1) => 
        `<a class="file" href="#" data-path="${p1}">${p1}</a>`);
        
    return content;
}
```

---

## The "Magic" of Tab Completion

This was one of the most challenging and rewarding features to implement. The `handleTabCompletion` function is "path-aware," meaning it can complete nested paths like `cat blog/my-`.

The core logic involves:
1.  Parsing the current input to identify the word being completed.
2.  Checking if it's the first word (a command) or an argument.
3.  If it's an argument, splitting it into a `pathPrefix` and a `partialName`.

```javascript
// Conceptual logic from js/autocomplete.js
const lastPart = 'blog/my-fi';
const lastSlashIndex = lastPart.lastIndexOf('/'); // 4

const pathPrefix = lastPart.substring(0, lastSlashIndex + 1); // "blog/"
const partialName = lastPart.substring(lastSlashIndex + 1);  // "my-fi"

// Now, search for 'my-fi' inside the 'blog' directory...
```
This allows the function to search for completions within the correct virtual directory.

This project was a fun exercise in vanilla JavaScript, DOM manipulation, and recreating complex shell behaviors in a web environment. You can see the project details by checking out my [[../projects.md]] file.
```

### Step 3: Update the Manifest

Finally, don't forget to tell your website that this new file exists!

**Action:** Open your terminal in the project's root directory and run your generator script.

```bash
node generate-manifest.js
```

### How to Test

1.  Refresh your website in the browser (hard refresh).
2.  Run `ls` to see `how-this-site-was-built.md` in the file list.
3.  Run `cat how-this-site-was-built.md`.

You should see your new, beautifully formatted document explaining the inner workings of the very site you're using. The code snippets will be highlighted, the image will render, and the final link to `projects.md` will be clickable.