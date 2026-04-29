const fs = require('fs');
const path = require('path');

let sidebarContent = fs.readFileSync('src/components/Sidebar.tsx', 'utf-8');
const lines = sidebarContent.split('\n');
let replacedCount = 0;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/href:\s*['"`]([^'"`]+)['"`]/);
    if (!match) continue;
    
    const link = match[1];
    if (link.startsWith('http') || link.startsWith('#')) continue;

    let pagePath = path.join('src/app/(dashboard)', link, 'page.tsx');
    if (!fs.existsSync(pagePath)) pagePath = path.join('src/app/(dashboard)', link + '/page.tsx');
    if (!fs.existsSync(pagePath)) pagePath = path.join('src/app', link, 'page.tsx');

    if (fs.existsSync(pagePath)) {
        const content = fs.readFileSync(pagePath, 'utf-8');
        const h1Match = content.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
        if (h1Match) {
            let text = h1Match[1].replace(/<[^>]+>/g, '').trim();
            // clean leading emoji
            text = text.replace(/^[\u2000-\u3300\uD83C-\uD83E\uD83D][\uDC00-\uDFFF\u200D\uFE0F]*\s*/, '').trim();

            if (!text.includes('{') && text.length > 0) {
                // Replace labelKey on this specific line
                const newLine = line.replace(/labelKey:\s*['"`][^'"`\n]+['"`]/, `labelKey: '${text}'`);
                if (newLine !== line) {
                    lines[i] = newLine;
                    replacedCount++;
                }
            }
        }
    }
}

fs.writeFileSync('src/components/Sidebar.tsx', lines.join('\n'));
console.log('Sidebar successfully aligned! Lines modified: ' + replacedCount);
