import fs from 'fs';
import path from 'path';

function renderCanvasToHtml(canvasPath, outputPath) {
    const data = JSON.parse(fs.readFileSync(canvasPath, 'utf8'));
    const nodes = data.nodes || [];
    const edges = data.edges || [];

    if (nodes.length === 0) return;

    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    nodes.forEach(n => {
        if (n.x < minX) minX = n.x;
        if (n.y < minY) minY = n.y;
        if (n.x + n.width > maxX) maxX = n.x + n.width;
        if (n.y + n.height > maxY) maxY = n.y + n.height;
    });

    const padding = 100;
    minX -= padding;
    minY -= padding;
    const canvasWidth = (maxX - minX) + padding * 2;
    const canvasHeight = (maxY - minY) + padding * 2;

    let nodesHtml = '';
    const nodeMap = {};

    nodes.forEach(n => {
        nodeMap[n.id] = n;
        const left = n.x - minX;
        const top = n.y - minY;

        let content = '';
        let headerColor = 'var(--border-color)';
        if (n.type === 'text') {
            const safeText = (n.text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            content = `<div class="node-content text-node markdown-body">
                <textarea class="raw-markdown" style="display:none;">${safeText}</textarea>
                <div class="rendered-markdown"></div>
            </div>`;
            headerColor = 'var(--prompt-color)';
        } else if (n.type === 'f') {
            content = `<div class="node-content file-node">📄 ${n.file}</div>`;
            headerColor = 'var(--link-color)';
        } else if (n.type === 'link') {
            const url = n.url || '';
            const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
            const match = url.match(ytRegex);
            if (match) {
                const videoId = match[1];
                content = `<div class="node-content link-node" style="padding:0; overflow:hidden;"><iframe width="100%" height="100%" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
            } else {
                content = `<div class="node-content link-node">🔗 <a href="${url}" target="_blank" style="color:var(--link-color)">${url}</a></div>`;
            }
            headerColor = 'var(--command-color)';
        }

        nodesHtml += `
            <div class="node" id="${n.id}" style="left: ${left}px; top: ${top}px; width: ${n.width}px; height: ${n.height}px; border-top: 4px solid ${headerColor};">
                ${content}
            </div>
        `;
    });

    let svgLines = '';
    edges.forEach(e => {
        const fromNode = nodeMap[e.fromNode];
        const toNode = nodeMap[e.toNode];
        if (!fromNode || !toNode) return;

        const getAnchorPoint = (node, side) => {
            const left = node.x - minX;
            const top = node.y - minY;
            if (side === 'top') return { x: left + node.width / 2, y: top };
            if (side === 'bottom') return { x: left + node.width / 2, y: top + node.height };
            if (side === 'left') return { x: left, y: top + node.height / 2 };
            if (side === 'right') return { x: left + node.width, y: top + node.height / 2 };
            return { x: left + node.width / 2, y: top + node.height / 2 };
        };

        const p1 = getAnchorPoint(fromNode, e.fromSide);
        const p2 = getAnchorPoint(toNode, e.toSide);

        const c1x = e.fromSide === 'left' ? p1.x - 50 : e.fromSide === 'right' ? p1.x + 50 : p1.x;
        const c1y = e.fromSide === 'top' ? p1.y - 50 : e.fromSide === 'bottom' ? p1.y + 50 : p1.y;

        const c2x = e.toSide === 'left' ? p2.x - 50 : e.toSide === 'right' ? p2.x + 50 : p2.x;
        const c2y = e.toSide === 'top' ? p2.y - 50 : e.toSide === 'bottom' ? p2.y + 50 : p2.y;

        svgLines += `<path d="M ${p1.x} ${p1.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}" fill="none" stroke="var(--foreground)" stroke-width="2" marker-end="url(#arrowhead)"/>`;
    });

    const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Canvas View</title>
    <link rel="stylesheet" href="../css/themes.css">
    <link rel="stylesheet" href="../css/content.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css">
    <style>
        body {
            background-color: var(--background);
            color: var(--foreground);
            font-family: 'Inter', sans-serif;
            margin: 0;
            padding: 0;
            overflow: hidden;
            width: 100vw;
            height: 100vh;
        }
        #viewport {
            width: 100%;
            height: 100%;
            position: relative;
            cursor: grab;
        }
        #viewport:active {
            cursor: grabbing;
        }
        .canvas-container {
            position: absolute;
            width: ${canvasWidth}px;
            height: ${canvasHeight}px;
            transform-origin: 0 0;
            background-image: radial-gradient(var(--border-color) 1px, transparent 1px);
            background-size: 20px 20px;
        }
        .node {
            position: absolute;
            background-color: var(--header-bg);
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            overflow: hidden;
            display: flex;
            flex-direction: column;
            box-sizing: border-box;
            border: 1px solid var(--border-color);
        }
        .node-content {
            padding: 12px;
            overflow: auto;
            flex-grow: 1;
            font-size: 14px;
            word-wrap: break-word;
            scrollbar-width: thin;
        }
        .text-node {
            padding: 12px;
        }
        .file-node {
            display: flex;
            align-items: center;
            font-weight: bold;
        }
        .link-node {
            display: flex;
            align-items: center;
        }
        svg {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
        }
        marker polygon {
            fill: var(--foreground);
        }
    </style>
</head>
<body>
    <div id="viewport">
        <div class="canvas-container" id="canvas-container">
            <svg>
                <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" />
                    </marker>
                </defs>
                ${svgLines}
            </svg>
            ${nodesHtml}
        </div>
    </div>
    
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <script type="module">
        import { preprocessObsidianSyntax } from '../js/utils.js';

        // Setup Markdown rendering
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

        document.querySelectorAll('.text-node').forEach(node => {
            const rawEl = node.querySelector('.raw-markdown');
            const targetEl = node.querySelector('.rendered-markdown');
            if (rawEl && targetEl) {
                const rawText = rawEl.value;
                // Strip YAML frontmatter
                let markdownContent = rawText.replace(/^---\\s*\\n[\\s\\S]*?\\n---\\s*?\\n?/, "");
                
                let rawHtml = marked.parse(markdownContent);
                rawHtml = rawHtml.replace(/<table>/g, '<div class="table-wrapper"><table>');
                rawHtml = rawHtml.replace(/<\\/table>/g, '</table></div>');
                
                const finalHtml = preprocessObsidianSyntax(rawHtml);
                targetEl.innerHTML = finalHtml;
            }
        });

        // Sync theme with parent window
        function syncTheme() {
            try {
                if (window.parent !== window && window.parent.document.body.className) {
                    document.body.className = window.parent.document.body.className;
                } else if (!document.body.className) {
                    document.body.className = 'theme-primary-dark';
                }
            } catch(e) {}
        }
        syncTheme();
        
        try {
            if (window.parent !== window) {
                const observer = new MutationObserver(syncTheme);
                observer.observe(window.parent.document.body, { attributes: true, attributeFilter: ['class'] });
            }
        } catch(e) {}

        // Pan and Zoom logic
        const viewport = document.getElementById('viewport');
        const container = document.getElementById('canvas-container');
        const iframes = document.querySelectorAll('iframe');
        
        let scale = 0.5;
        let translateX = (viewport.clientWidth - ${canvasWidth} * scale) / 2;
        let translateY = (viewport.clientHeight - ${canvasHeight} * scale) / 2;
        
        let isDragging = false;
        let startX, startY;

        function updateTransform() {
            container.style.transform = \`translate(\${translateX}px, \${translateY}px) scale(\${scale})\`;
        }

        viewport.addEventListener('mousedown', (e) => {
            if (e.target.closest('.text-node')) return; // allow selecting text
            isDragging = true;
            startX = e.clientX - translateX;
            startY = e.clientY - translateY;
            iframes.forEach(f => f.style.pointerEvents = 'none');
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            translateX = e.clientX - startX;
            translateY = e.clientY - startY;
            updateTransform();
        });

        window.addEventListener('mouseup', () => {
            isDragging = false;
            iframes.forEach(f => f.style.pointerEvents = 'auto');
        });

        viewport.addEventListener('wheel', (e) => {
            const textNode = e.target.closest('.text-node');
            if (textNode && textNode.scrollHeight > textNode.clientHeight) {
                // Let the node scroll normally
                return; 
            }
            e.preventDefault();
            
            const zoomSensitivity = 0.001;
            const delta = -e.deltaY * zoomSensitivity;
            const newScale = Math.min(Math.max(0.05, scale * Math.exp(delta)), 5);
            
            const rect = viewport.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            translateX = mouseX - (mouseX - translateX) * (newScale / scale);
            translateY = mouseY - (mouseY - translateY) * (newScale / scale);
            
            scale = newScale;
            updateTransform();
        }, { passive: false });

        updateTransform();
    </script>
</body>
</html>`;

    fs.writeFileSync(outputPath, htmlTemplate);
    console.log(`✅ Generated HTML for ${canvasPath}`);
}

function processDirectory(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else if (file.endsWith('.canvas')) {
            const outputPath = fullPath.replace(/\.canvas$/, '.html');
            renderCanvasToHtml(fullPath, outputPath);
        }
    }
}

processDirectory('canvas');
