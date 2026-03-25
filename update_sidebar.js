const fs = require('fs');
const path = require('path');
let sidebarContent = fs.readFileSync('src/components/Sidebar.tsx', 'utf-8');
const links = [...sidebarContent.matchAll(/href:\s*'([^']+)'/g)].map(m => m[1]);
let replacements = 0;

for (const link of links) {
    let pagePath = path.join('src/app/(dashboard)', link, 'page.tsx');
    if (!fs.existsSync(pagePath)) pagePath = path.join('src/app/(dashboard)', link + '/page.tsx');
    if (!fs.existsSync(pagePath)) pagePath = path.join('src/app', link, 'page.tsx');
    
    if (fs.existsSync(pagePath)) {
        const content = fs.readFileSync(pagePath, 'utf-8');
        const h1Match = content.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
        if (h1Match) {
            let text = h1Match[1].replace(/<[^>]+>/g, '').trim();
            // clean emoji if they exist in the h1 because the sidebar already has an icon field
            text = text.replace(/^[\u2000-\u3300\uD83C-\uD83E\uD83D][\uDC00-\uDFFF\u200D\uFE0F]*\s*/, '').trim();
            
            // avoid overwriting if H1 is a dynamic {t(...)} string
            if (!text.includes('{') && text.length > 0) {
                // Regex to find the object with this href and replace its labelKey
                // e.g. labelKey: 'فواتير المبيعات الضريبية', ... href: '/sales'
                const exactRegex = new RegExp(`labelKey:\\s*['"\`][^'"\`\n]+['"\`]\\s*,\\s*href:\\s*['"\`]${link.replace(/\//g, '\\\\/')}['"\`]`, 'g');
                
                sidebarContent = sidebarContent.replace(exactRegex, match => {
                    return match.replace(/labelKey:\s*['"\`][^'"\`\n]+['"\`]/, `labelKey: '${text}'`);
                });
                replacements++;
            }
        }
    }
}
fs.writeFileSync('src/components/Sidebar.tsx', sidebarContent);
console.log('Sidebar aligned globally! Replaced ' + replacements + ' titles.');
