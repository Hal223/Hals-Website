// generate-manifest.js
import fs from 'fs';
import path from 'path';

// Files and directories to ignore during the scan
const ignoreList = [
    '.git',
    'node_modules',
    'dist'
];

function generateManifest(dir) {
    const manifest = {
        type: 'directory',
        children: {}
    };

    const files = fs.readdirSync(dir);

    for (const file of files) {
        if (ignoreList.includes(file) || file.startsWith('.')) {
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

const rootChildren = {};
const homeChildren = {};
const publicFiles = ['blog', 'projects.md', 'resume.md', 'welcome.md', 'images'];

for (const key in projectManifest.children) {
    if (publicFiles.includes(key)) {
        homeChildren[key] = projectManifest.children[key];
    }
    rootChildren[key] = projectManifest.children[key];
}

const manifestData = JSON.stringify({ 
    '/': { type: 'directory', children: rootChildren },
    '~': { type: 'directory', children: homeChildren } 
}, null, 2);

fs.writeFileSync('file-manifest.json', manifestData);

console.log('✅ Successfully generated file-manifest.json');