const fs = require('fs');
let code = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

// Add translation keys if not present
if (!code.includes("'i.expiry_report'")) {
    code = code.replace(
        `'i.fin_reports': 'التقارير المالية',`,
        `'i.fin_reports': 'التقارير المالية',\n    'i.expiry_report': 'تقرير الصلاحيات',`
    );
    code = code.replace(
        `'i.fin_reports': 'Financial Reports',`,
        `'i.fin_reports': 'Financial Reports',\n    'i.expiry_report': 'Expiry Report',`
    );
}

// Add the link to the menu under inventory
if (!code.includes("href: '/reports/expiry'")) {
    const target = `{ icon: '📦', lk: 'i.products', href: '/products', module: 'inventory' },`;
    const replacement = `{ icon: '📦', lk: 'i.products', href: '/products', module: 'inventory' },
        { icon: '⏳', lk: 'i.expiry_report', href: '/reports/expiry', module: 'inventory' },`;
    code = code.replace(target, replacement);
}

fs.writeFileSync('src/components/Sidebar.tsx', code);
console.log('patched sidebar');
