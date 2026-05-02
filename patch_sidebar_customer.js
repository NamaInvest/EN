const fs = require('fs');
let code = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

if (!code.includes("'i.customer_statement'")) {
    code = code.replace(
        `'i.budget_variance': 'انحراف الموازنة',`,
        `'i.budget_variance': 'انحراف الموازنة',\n    'i.customer_statement': 'كشف حساب عميل',`
    );
    code = code.replace(
        `'i.budget_variance': 'Budget Variance',`,
        `'i.budget_variance': 'Budget Variance',\n    'i.customer_statement': 'Customer Statement',`
    );
}

if (!code.includes("href: '/reports/customer-statement'")) {
    const target = `{ icon: '📊', lk: 'i.budget_variance', href: '/reports/budget-variance', module: 'reports' },`;
    const replacement = `{ icon: '📊', lk: 'i.budget_variance', href: '/reports/budget-variance', module: 'reports' },
        { icon: '🧾', lk: 'i.customer_statement', href: '/reports/customer-statement', module: 'reports' },`;
    code = code.replace(target, replacement);
}

fs.writeFileSync('src/components/Sidebar.tsx', code);
console.log('patched sidebar for customer statement');
