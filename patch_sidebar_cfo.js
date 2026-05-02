const fs = require('fs');
let code = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

if (!code.includes("'i.cfo_dashboard'")) {
    code = code.replace(
        `'i.fin_reports': 'التقارير المالية',`,
        `'i.fin_reports': 'التقارير المالية',\n    'i.cfo_dashboard': 'CFO Dashboard',`
    );
    code = code.replace(
        `'i.fin_reports': 'Financial Reports',`,
        `'i.fin_reports': 'Financial Reports',\n    'i.cfo_dashboard': 'CFO Dashboard',`
    );
}

if (!code.includes("href: '/finance/cfo'")) {
    const target = `{ icon: '🏦', lk: 'i.treasury', href: '/treasury', module: 'finance' },`;
    const replacement = `{ icon: '🏦', lk: 'i.treasury', href: '/treasury', module: 'finance' },
        { icon: '👑', lk: 'i.cfo_dashboard', href: '/finance/cfo', module: 'finance' },`;
    code = code.replace(target, replacement);
}

fs.writeFileSync('src/components/Sidebar.tsx', code);
console.log('patched sidebar for CFO Dashboard');
