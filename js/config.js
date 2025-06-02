export const LS_KEYS = {
    OPEN_TABS_ORDER: 'editorOpenTabsOrder',
    ACTIVE_TAB_ID: 'editorActiveTabId',
    CURRENT_THEME: 'editorCurrentTheme',
    CUSTOM_THEME_VARS: 'editorCustomThemeVars'
};

const fileConfigBase = {
    'about': { id: 'about', title: 'about_me.c', type: 'static', closable: true, filename: 'about_me.html', sidebarLinkSelector: '.nav-link[data-tab="about"]' },
    'projects': { id: 'projects', title: 'projects.json', type: 'static', closable: true, filename: 'projects.html', sidebarLinkSelector: '.nav-link[data-tab="projects"]' },
    'contact': { id: 'contact', title: 'contact.html', type: 'static', closable: true, filename: 'contact.html', sidebarLinkSelector: '.nav-link[data-tab="contact"]' },
};

export const blogPostsConfig = [
    { id: 'my-first-post', title: 'my_first_post.md', filename: 'my-first-post.md', date: '2023-10-26' },
    { id: 'another-cool-idea', title: 'another_cool_idea.md', filename: 'another-cool-idea.md', date: '2023-10-27' },
];

export function generateFullFileConfig() {
    const fullConfig = { ...fileConfigBase };
    blogPostsConfig.forEach(post => {
        const blogTabId = `blog-${post.id}`;
        fullConfig[blogTabId] = {
            id: blogTabId,
            title: post.title,
            type: 'blog',
            blogPostId: post.id,
            filename: post.filename, // Markdown filename
            closable: true,
            sidebarLinkSelector: `.nav-link[data-tab="${blogTabId}"]`
        };
    });
    return fullConfig;
}

export const predefinedThemes = {
    'archway': {
        "--background": '#251b16',
        "--foreground": '#c5c3c1',
        "--cursor": '#c5c3c1',
        "--color0": '#251b16',
        "--color1": '#7e421f',
        "--color2": '#6c4c25',
        "--color3": '#6f573b',
        "--color4": '#5a6358',
        "--color5": '#7f694a',
        "--color6": '#9f7f4d',
        "--color7": '#98928e',
        "--color8": '#6e6259',
        "--color9": '#A8592A',
        "--color10": '#916632',
        "--color11": '#94744F',
        "--color12": '#788576',
        "--color13": '#AA8D63',
        "--color14": '#D4AA67',
        "--color15": '#c5c3c1'
    },
    'solarized-light': {
        '--background': '#fdf6e3',
        '--foreground': '#657b83',
        '--cursor': '#657b83',
        '--color0': '#eee8d5',
        '--color1': '#dc322f',
        '--color2': '#859900',
        '--color3': '#b58900',
        '--color4': '#268bd2',
        '--color5': '#d33682',
        '--color6': '#2aa198',
        '--color7': '#93a1a1',
        '--color8': '#586e75',
        '--color9': '#cb4b16',
        '--color10': '#859900',
        '--color11': '#b58900',
        '--color12': '#268bd2',
        '--color13': '#d33682',
        '--color14': '#2aa198',
        '--color15': '#073642'
    },
    'hotline-tony': {
        '--background': '#111216',
        '--foreground': '#c3c3c4',
        '--cursor': '#c3c3c4',
        '--color0': '#111216',
        '--color1': '#45374b',
        '--color2': '#6f2228',
        '--color3': '#90332a',
        '--color4': '#75223a',
        '--color5': '#7d3f39',
        '--color6': '#ab4739',
        '--color7': '#8f9299',
        '--color8': '#5b5b6f',
        '--color9': '#5C4A65',
        '--color10': '#942E36',
        '--color11': '#C14438',
        '--color12': '#9D2E4E',
        '--color13': '#A7554D',
        '--color14': '#E55F4C',
        '--color15': '#c3c3c4'
    }
};