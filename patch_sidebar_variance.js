const fs = require('fs');
let code = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

if (!code.includes("'i.variance'")) {
    code = code.replace(
        `'i.wht': 'ضريبة الاستقطاع',`,
        `'i.wht': 'ضريبة الاستقطاع',\n    'i.variance': 'انحرافات التكاليف (PPV)',`
    );
    code = code.replace(
        `'i.wht': 'Withholding Tax',`,
        `'i.wht': 'Withholding Tax',\n    'i.variance': 'Cost Variances (PPV)',`
    );
}

if (!code.includes("href: '/finance/variance'")) {
    const target = `{ icon: '💸', lk: 'i.wht', href: '/finance/wht', module: 'finance' },`;
    const replacement = `{ icon: '💸', lk: 'i.wht', href: '/finance/wht', module: 'finance' },
        { icon: '📉', lk: 'i.variance', href: '/finance/variance', module: 'finance' },`;
    code = code.replace(target, replacement);
}

fs.writeFileSync('src/components/Sidebar.tsx', code);
console.log('patched sidebar for Variance');
