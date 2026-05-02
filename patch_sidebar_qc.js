const fs = require('fs');
let code = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

if (!code.includes("'i.quality_control'")) {
    code = code.replace(
        `'i.stocks': 'المخازن',`,
        `'i.stocks': 'المخازن',\n    'i.quality_control': 'إدارة الجودة (QC)',`
    );
    code = code.replace(
        `'i.stocks': 'Stocks',`,
        `'i.stocks': 'Stocks',\n    'i.quality_control': 'Quality Control (QC)',`
    );
}

if (!code.includes("href: '/inventory/quality-control'")) {
    const target = `{ icon: '📦', lk: 'i.stocks', href: '/inventory/stocks', module: 'inventory' },`;
    const replacement = `{ icon: '📦', lk: 'i.stocks', href: '/inventory/stocks', module: 'inventory' },
        { icon: '🔍', lk: 'i.quality_control', href: '/inventory/quality-control', module: 'inventory' },`;
    code = code.replace(target, replacement);
}

fs.writeFileSync('src/components/Sidebar.tsx', code);
console.log('patched sidebar for QC');
