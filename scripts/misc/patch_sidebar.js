const fs = require('fs');

let c = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

// 1. Add Labels
c = c.replace(
    /'i.purchases': 'فواتير المشتريات',/g,
    `'i.purchases_options': 'خيارات المشتريات', 'i.manual_purchases': 'فواتير المشتريات اليدوية', 'i.purchases': 'فواتير المشتريات',`
);

c = c.replace(
    /'i.purchases': 'Purchase Invoices',/g,
    `'i.purchases_options': 'Purchases Options', 'i.manual_purchases': 'Manual Purchase Invoices', 'i.purchases': 'Purchase Invoices',`
);

// Fallbacks for other languages to not break build
c = c.replace(
    /'i.purchases': 'खरीद इनवॉइस',/g,
    `'i.purchases_options': 'Purchase Options', 'i.manual_purchases': 'Manual Purchases', 'i.purchases': 'खरीद इनवॉइस',`
);

c = c.replace(
    /'i.purchases': 'ক্রয় ইনভয়েস',/g,
    `'i.purchases_options': 'Purchase Options', 'i.manual_purchases': 'Manual Purchases', 'i.purchases': 'ক্রয় ইনভয়েস',`
);

c = c.replace(
    /'i.purchases': 'خریداری انوائس',/g,
    `'i.purchases_options': 'Purchase Options', 'i.manual_purchases': 'Manual Purchases', 'i.purchases': 'خریداری انوائس',`
);

// 2. Add Links to s.purchases in menuItems
const purchasesMenuTarget = `{ sk: 's.purchases', items: [
    { icon: '📝', lk: 'i.purchase_reqs', href: '/purchases/requisitions', module: 'purchase_orders' },`;

const purchasesMenuReplacement = `{ sk: 's.purchases', items: [
    { icon: '⚙️', lk: 'i.purchases_options', href: '/purchases/options', module: 'purchases' },
    { icon: '📝', lk: 'i.purchase_reqs', href: '/purchases/requisitions', module: 'purchase_orders' },`;

c = c.replace(purchasesMenuTarget, purchasesMenuReplacement);

const purchasesMenuBottomTarget = `{ icon: '🌍', lk: 'i.lc', href: '/purchases/letters-of-credit', module: 'letters_of_credit' },
  ]},`;

const purchasesMenuBottomReplacement = `{ icon: '🌍', lk: 'i.lc', href: '/purchases/letters-of-credit', module: 'letters_of_credit' },
    { icon: '📊', lk: 'i.manual_purchases', href: '/reports/manual-purchases', module: 'reports' },
  ]},`;

c = c.replace(purchasesMenuBottomTarget, purchasesMenuBottomReplacement);


fs.writeFileSync('src/components/Sidebar.tsx', c);
console.log('Sidebar Patched');
