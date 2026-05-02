const fs = require('fs');
let code = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

if (!code.includes("'i.returns_report'")) {
    code = code.replace(
        `'i.fin_reports': 'التقارير المالية',`,
        `'i.fin_reports': 'التقارير المالية',\n    'i.returns_report': 'تقرير المرتجعات',`
    );
    code = code.replace(
        `'i.fin_reports': 'Financial Reports',`,
        `'i.fin_reports': 'Financial Reports',\n    'i.returns_report': 'Returns Report',`
    );
}

if (!code.includes("href: '/reports/returns'")) {
    const target = `{ icon: '📦', lk: 'i.products', href: '/products', module: 'inventory' },`;
    const replacement = `{ icon: '📦', lk: 'i.products', href: '/products', module: 'inventory' },
        { icon: '↩️', lk: 'i.returns_report', href: '/reports/returns', module: 'inventory' },`;
    code = code.replace(target, replacement);
}

fs.writeFileSync('src/components/Sidebar.tsx', code);
console.log('patched sidebar for returns');
