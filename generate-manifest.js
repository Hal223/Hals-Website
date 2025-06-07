// generate-manifest.js
const fs = require('fs');
const path = require('path');

// Files and directories to ignore during the scan
const ignoreList = [
    '.git',
    'node_modules',
    'index.html',
    'style.css',
    'script.js',
    'generate-manifest.js',
    'file-manifest.json' // Don't include the manifest itself
];

function generateManifest(dir) {
    const manifest = {
        type: 'directory',
        children: {}
    };

    const files = fs.readdirSync(dir);

    for (const file of files) {
        if (ignoreList.includes(file)) {
            continue;
        }

        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            manifest.children[file] = generateManifest(fullPath);
        } else {
            // We store the relative path for the fetch API
            const relativePath = path.relative('.', fullPath).replace(/\\/g, '/');
            manifest.children[file] = {
                type: 'file',
                path: relativePath
            };
        }
    }
    return manifest;
}

const projectManifest = generateManifest('.');
const manifestData = JSON.stringify({ '~': projectManifest }, null, 2);

fs.writeFileSync('file-manifest.json', manifestData);

console.log('✅ Successfully generated file-manifest.json');