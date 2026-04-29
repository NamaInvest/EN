const fs = require('fs');
const data = JSON.parse(fs.readFileSync('c:/Users/1/Desktop/alfa/audit_results.json', 'utf8'));

let md = '# جرد العناصر التفاعلية الكامل - Nama Invest ERP\n# Full Interactive Elements Audit\n\n';
md += '> **إجمالي العناصر:** ' + Object.values(data).flat().length + ' عنصر تفاعلي في ' + Object.keys(data).length + ' موديول\n\n';
md += '---\n\n';

for (const [mod, items] of Object.entries(data)) {
  md += '## ' + mod + ' (' + items.length + ' عنصر)\n\n';
  md += '| # | اسم العنصر (Label) | الموقع (Location) | الوظيفة (Action) | المنطق البرمجي (Handler) | نوع التفاعل (Type) |\n';
  md += '|---|---|---|---|---|---|\n';
  items.forEach((el, i) => {
    const label = (el.label || '').replace(/\|/g, '/').replace(/\n/g, ' ').substring(0, 50);
    const page = (el.page || '').replace(/\|/g, '/');
    const action = (el.action || 'تفاعل').replace(/\|/g, '/');
    const handler = (el.handler || '-').replace(/\|/g, '/').replace(/`/g, "'").substring(0, 55);
    const type = (el.type || '-').replace(/\|/g, '/');
    const apiInfo = el.api ? ' → `' + (el.method || 'GET') + ' ' + el.api + '`' : '';
    md += '| ' + (i + 1) + ' | ' + label + ' | `' + page + '` | ' + action + apiInfo + ' | `' + handler + '` | ' + type + ' |\n';
  });
  md += '\n---\n\n';
}

const outPath = 'C:/Users/1/.gemini/antigravity/brain/ddd10d8c-df4b-430c-9a10-0fc7b8386f88/interactive_elements_audit.md';
fs.writeFileSync(outPath, md, 'utf8');
console.log('Done! Written ' + md.length + ' chars to audit file');
console.log('Total elements: ' + Object.values(data).flat().length);
