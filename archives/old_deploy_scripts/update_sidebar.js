const fs = require('fs');
let f = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

// 1. Add Arabic labels before s.pharmacy
f = f.replace(
    "'i.bpm': '\u0645\u062d\u0631\u0643 \u0633\u064a\u0631 \u0627\u0644\u0639\u0645\u0644 (BPM)',\r\n    's.pharmacy':",
    "'i.bpm': '\u0645\u062d\u0631\u0643 \u0633\u064a\u0631 \u0627\u0644\u0639\u0645\u0644 (BPM)',\r\n    'i.payment_run': '\u062a\u0634\u063a\u064a\u0644 \u0627\u0644\u062f\u0641\u0639\u0627\u062a \u0627\u0644\u0645\u062c\u0645\u0639\u0629',\r\n    'i.ecl': '\u062e\u0633\u0627\u0626\u0631 \u0627\u0644\u0627\u0626\u062a\u0645\u0627\u0646 \u0627\u0644\u0645\u062a\u0648\u0642\u0639\u0629 (ECL)',\r\n    'i.std_cost': '\u0627\u0644\u062a\u0643\u0627\u0644\u064a\u0641 \u0627\u0644\u0645\u0639\u064a\u0627\u0631\u064a\u0629',\r\n    'i.subcontracting': '\u0627\u0644\u062a\u0635\u0646\u064a\u0639 \u0627\u0644\u062e\u0627\u0631\u062c\u064a',\r\n    'i.quality_mgmt': '\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u062c\u0648\u062f\u0629 (CAPA/NCR)',\r\n    'i.multi_book': '\u0627\u0644\u062f\u0641\u0627\u062a\u0631 \u0627\u0644\u0645\u062a\u0639\u062f\u062f\u0629 (Multi-GAAP)',\r\n    'i.custom_fields': '\u0627\u0644\u062d\u0642\u0648\u0644 \u0627\u0644\u0645\u062e\u0635\u0635\u0629',\r\n    's.pharmacy':"
);

// 2. Add English labels
f = f.replace(
    "'i.bpm': 'BPM Engine',\r\n    's.pharmacy':",
    "'i.bpm': 'BPM Engine',\r\n    'i.payment_run': 'Payment Run (F110)',\r\n    'i.ecl': 'Expected Credit Loss (ECL)',\r\n    'i.std_cost': 'Standard Costing',\r\n    'i.subcontracting': 'Subcontracting',\r\n    'i.quality_mgmt': 'Quality Management (CAPA)',\r\n    'i.multi_book': 'Multi-Book (Multi-GAAP)',\r\n    'i.custom_fields': 'Custom Fields',\r\n    's.pharmacy':"
);

// 3. Manufacturing sidebar items
f = f.replace(
    "{ icon: '\uD83E\uDD16', lk: 'i.digital_twin', href: '/manufacturing/digital-twin', module: 'manufacturing' },\r\n  ]},",
    "{ icon: '\uD83E\uDD16', lk: 'i.digital_twin', href: '/manufacturing/digital-twin', module: 'manufacturing' },\r\n    { icon: '\uD83D\uDCB2', lk: 'i.std_cost', href: '/manufacturing/standard-cost', module: 'manufacturing' },\r\n    { icon: '\uD83C\uDFED', lk: 'i.subcontracting', href: '/manufacturing/subcontracting', module: 'manufacturing' },\r\n  ]},"
);

// 4. Finance sidebar items
f = f.replace(
    "{ icon: '\uD83D\uDD04', lk: 'i.bank_recon', href: '/treasury/bank-reconciliation', module: 'treasury' },\r\n  ]},",
    "{ icon: '\uD83D\uDD04', lk: 'i.bank_recon', href: '/treasury/bank-reconciliation', module: 'treasury' },\r\n    { icon: '\uD83D\uDCB3', lk: 'i.payment_run', href: '/finance/payment-run', module: 'accounting' },\r\n    { icon: '\uD83D\uDCC9', lk: 'i.ecl', href: '/finance/ecl', module: 'accounting' },\r\n    { icon: '\uD83D\uDCDA', lk: 'i.multi_book', href: '/accounting/multi-book', module: 'accounting' },\r\n  ]},"
);

// 5. Enterprise quality
f = f.replace(
    "{ icon: '\u2696\uFE0F', lk: 'i.credit', href: '/enterprise/legal', module: 'legal' },\r\n  ]},",
    "{ icon: '\u2696\uFE0F', lk: 'i.credit', href: '/enterprise/legal', module: 'legal' },\r\n    { icon: '\uD83D\uDD2C', lk: 'i.quality_mgmt', href: '/enterprise/quality-management', module: 'manufacturing' },\r\n  ]},"
);

// 6. Settings custom fields
f = f.replace(
    "{ icon: '\uD83D\uDC93', lk: 'i.sys_health', href: '/sys/health', module: 'maintenance' },\r\n  ]},",
    "{ icon: '\uD83D\uDC93', lk: 'i.sys_health', href: '/sys/health', module: 'maintenance' },\r\n    { icon: '\uD83E\uDDE9', lk: 'i.custom_fields', href: '/settings/custom-fields', module: 'settings' },\r\n  ]},"
);

fs.writeFileSync('src/components/Sidebar.tsx', f);
console.log('Sidebar updated successfully');
