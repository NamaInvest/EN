const fs = require('fs');
let code = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

if (!code.includes("'i.budget_variance'")) {
    code = code.replace(
        `'i.fin_reports': 'التقارير المالية',`,
        `'i.fin_reports': 'التقارير المالية',\n    'i.budget_variance': 'انحراف الموازنة',`
    );
    code = code.replace(
        `'i.fin_reports': 'Financial Reports',`,
        `'i.fin_reports': 'Financial Reports',\n    'i.budget_variance': 'Budget Variance',`
    );
}

if (!code.includes("href: '/reports/budget-variance'")) {
    const target = `{ icon: '📈', lk: 'i.fin_reports', href: '/reports', module: 'reports' },`;
    const replacement = `{ icon: '📈', lk: 'i.fin_reports', href: '/reports', module: 'reports' },
        { icon: '📊', lk: 'i.budget_variance', href: '/reports/budget-variance', module: 'reports' },`;
    code = code.replace(target, replacement);
}

fs.writeFileSync('src/components/Sidebar.tsx', code);
console.log('patched sidebar for budget variance');
