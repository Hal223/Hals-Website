# Hal's Portfolio Website

A terminal-inspired, hybrid portfolio and blog built using vanilla JavaScript, HTML, CSS, and Markdown. The site features a navigable file system, a fully functional simulated Bash terminal, client-side Markdown parsing, and a dynamic theming system.

## 📂 File Structure

```text
Hals-Website/
├── generate-manifest.js       # Node.js script that builds the virtual file system
├── file-manifest.json         # (Auto-generated) JSON representation of the file system
│
├── index.html                 # Main entry point for the application
│
├── css/                       # Stylesheets
│   ├── content.css            # Styles for rendered Markdown, tables, and code blocks
│   ├── responsive.css         # Improvements to mobile
│   ├── traditional.css        # Core layout, UI elements, for the main page content
│   ├── terminal.css           # Core layout, UI elements, for the terminal
│   └── themes.css             # CSS variables for dynamic theming (Light/Dark mode)
│
├── js/                        # Frontend JavaScript Modules
│   ├── main.js                # Core application loop, state management, and View Transitions
│   ├── commands.js            # Terminal command handlers (cat, ls, cd, etc.)
│   ├── utils.js               # Helper functions (path resolution, Obsidian parsing)
│   ├── autocomplete.js        # Tab-completion logic for the terminal
│   ├── theme.js               # Theme configuration and switching logic
│   └── script.js              # (Legacy) Old consolidated script, for reference
│
├── blog/                      # Markdown content for blog posts
│   ├── how_this_site_was_built.md
│   └── ...
│
├── images/                    # Static image assets used in markdown files
│
├── welcome.md                 # Landing page content
├── resume.md                  # Interactive resume with dynamic redaction effect
├── projects.md                # Portfolio projects showcase
├── a-testing-example.md       # Markdown testing and validation page
└── README.md                  # This very document
```

## How it Works

- File System Generation: Running `node generate-manifest.js` scans the directory and outputs a `file-manifest.json` file, ignoring node_modules and dotfiles.
- Client-Side Routing**: The application reads `file-manifest.json` on load, allowing users to traverse folders and view files using either the GUI (Tile/List views) or the simulated terminal.
- Markdown Parsing**: When a `.md` file is requested (via GUI click or terminal `cat`), it is fetched, pre-processed to support Obsidian-style links/images, parsed using `marked.js`, syntax-highlighted with `highlight.js`, and injected into the main view.
