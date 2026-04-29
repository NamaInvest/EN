const fs = require('fs');
const path = require('path');

const sidebarPath = 'src/components/Sidebar.tsx';
let sidebarContent = '';
try {
    sidebarContent = fs.readFileSync(sidebarPath, 'utf-8');
} catch (e) {
    console.error('Could not read Sidebar.tsx', e);
    process.exit(1);
}

// Get all hrefs from Sidebar
const hrefRegex = /href:\s*'([^']+)'/g;
const sidebarHrefs = new Set();
let match;
while ((match = hrefRegex.exec(sidebarContent)) !== null) {
    // some hrefs might be like '/settings#salla', so we only take the path part
    sidebarHrefs.add(match[1].split('#')[0]);
}

// Iterate over src/app/(dashboard) and find all folders that have page.tsx
const appPath = 'src/app/(dashboard)';
const existingPages = [];

function walkDir(dir, prefix = '') {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        if (entry.isDirectory()) {
            walkDir(path.join(dir, entry.name), prefix + '/' + entry.name);
        } else if (entry.name === 'page.tsx' || entry.name === 'page.jsx') {
            existingPages.push(prefix === '' ? '/' : prefix);
        }
    }
}

walkDir(appPath);

const missingFromSidebar = existingPages.filter(p => !sidebarHrefs.has(p) && p !== '/');

console.log('Pages that EXIST in the code but are NOT in the Sidebar:');
missingFromSidebar.forEach(p => console.log(' - ' + p));
