const fs = require('fs');
const path = require('path');

const brainDir = path.join(__dirname, '.ai-brain');
if (!fs.existsSync(brainDir)) fs.mkdirSync(brainDir);

// Helpers
function walk(dir, extension = '.tsx') {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            if (!file.includes('node_modules') && !file.includes('.next')) {
                results = results.concat(walk(file, extension));
            }
        } else {
            if (file.endsWith(extension)) {
                results.push(file);
            }
        }
    });
    return results;
}

function extractFrontendPages() {
    const pageFiles = walk(path.join(__dirname, 'src/app'), '.tsx').filter(f => f.endsWith('page.tsx') || f.endsWith('layout.tsx'));
    let doc = '# توثيق جميع صفحات ومسارات الواجهة الأمامية (Frontend Pages & Layouts)\n\n';
    
    pageFiles.forEach(file => {
        const relativePath = file.split('src\\app\\')[1] || file.split('src/app/')[1];
        doc += `## \`${relativePath.replace(/\\/g, '/')}\`\n`;
        const content = fs.readFileSync(file, 'utf-8');
        
        // Check for 'use client' or server components
        if (content.includes('use client')) {
            doc += `- **Type:** Client Component (CSR)\n`;
        } else {
            doc += `- **Type:** Server Component (SSR)\n`;
        }
        
        // Extract dependencies used
        if (content.includes('useContext')) doc += `- **State:** Uses React Context\n`;
        if (content.includes('useState')) doc += `- **State:** Uses Local State\n`;
        if (content.includes('useQuery') || content.includes('swr')) doc += `- **Data Fetching:** Client-side Fetching\n`;
        
        doc += '\n';
    });
    fs.writeFileSync(path.join(brainDir, '10-frontend-pages.md'), doc);
}

function extractComponents() {
    const compFiles = walk(path.join(__dirname, 'src/components'), '.tsx');
    let doc = '# توثيق مكونات واجهة المستخدم (UI Components)\n\n';
    
    compFiles.forEach(file => {
        const relativePath = file.split('src\\components\\')[1] || file.split('src/components/')[1];
        doc += `## \`${relativePath.replace(/\\/g, '/')}\`\n`;
        const content = fs.readFileSync(file, 'utf-8');
        
        // Find exported functional components
        const exports = [...content.matchAll(/export function ([a-zA-Z0-9_]+)/g)].map(m => m[1]);
        const constExports = [...content.matchAll(/export const ([a-zA-Z0-9_]+) =/g)].map(m => m[1]);
        
        const allExports = [...exports, ...constExports];
        if (allExports.length > 0) {
            doc += `- **Exports:** ${allExports.join(', ')}\n`;
        }
        doc += '\n';
    });
    fs.writeFileSync(path.join(brainDir, '11-components.md'), doc);
}

function extractDependencies() {
    const pkgPath = path.join(__dirname, 'package.json');
    if (!fs.existsSync(pkgPath)) return;
    
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    let doc = '# الحزم والاعتماديات (Dependencies & Packages)\n\n';
    
    doc += `## Production Dependencies\n`;
    for (const [name, ver] of Object.entries(pkg.dependencies || {})) {
        doc += `- \`${name}\`: ${ver}\n`;
    }
    
    doc += `\n## Development Dependencies\n`;
    for (const [name, ver] of Object.entries(pkg.devDependencies || {})) {
        doc += `- \`${name}\`: ${ver}\n`;
    }
    
    doc += `\n## Scripts\n`;
    for (const [name, script] of Object.entries(pkg.scripts || {})) {
        doc += `- \`${name}\`: \`${script}\`\n`;
    }
    
    fs.writeFileSync(path.join(brainDir, '12-dependencies.md'), doc);
}

console.log('Extracting Frontend Pages...');
extractFrontendPages();
console.log('Extracting Components...');
extractComponents();
console.log('Extracting Dependencies...');
extractDependencies();
console.log('Phase 2 Brain Extracted Successfully!');
