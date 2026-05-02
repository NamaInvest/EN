const fs = require('fs');
let code = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

if (!code.includes("'i.wht'")) {
    code = code.replace(
        `'i.auto_ecl': 'توليد المخصصات',`,
        `'i.auto_ecl': 'توليد المخصصات',\n    'i.wht': 'ضريبة الاستقطاع',`
    );
    code = code.replace(
        `'i.auto_ecl': 'Auto-ECL (IFRS 9)',`,
        `'i.auto_ecl': 'Auto-ECL (IFRS 9)',\n    'i.wht': 'Withholding Tax',`
    );
}

if (!code.includes("href: '/finance/wht'")) {
    const target = `{ icon: '👑', lk: 'i.cfo_dashboard', href: '/finance/cfo', module: 'finance' },`;
    const replacement = `{ icon: '👑', lk: 'i.cfo_dashboard', href: '/finance/cfo', module: 'finance' },
        { icon: '💸', lk: 'i.wht', href: '/finance/wht', module: 'finance' },`;
    code = code.replace(target, replacement);
}

fs.writeFileSync('src/components/Sidebar.tsx', code);
console.log('patched sidebar for wht');
