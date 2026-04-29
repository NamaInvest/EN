/**
 * Script: optimize_prisma_includes.js
 * Purpose: Replace broad `include: { employee: true }` with selective `select`
 * This prevents leaking password hashes, private notes, internal IDs etc.
 */
const fs = require('fs');
const path = require('path');

const employeeSelect = `{ select: { id: true, name: true, position: true, department: true, phone: true } }`;
const customerSelect = `{ select: { id: true, name: true, phone: true, email: true, vatNumber: true } }`;
const supplierSelect = `{ select: { id: true, name: true, phone: true, email: true, vatNumber: true } }`;

// Files to patch and what to replace
const patches = [
    // employee: true -> employee: { select: ... }
    {
        file: 'src/app/api/vacations/route.ts',
        replacements: [{ from: 'employee: true', to: `employee: ${employeeSelect}` }]
    },
    {
        file: 'src/app/api/sales/targets/route.ts',
        replacements: [{ from: 'employee: true', to: `employee: ${employeeSelect}` }]
    },
    {
        file: 'src/app/api/hr/loans/route.ts',
        replacements: [{ from: 'employee: true', to: `employee: ${employeeSelect}` }]
    },
    {
        file: 'src/app/api/finance/petty-cash/route.ts',
        replacements: [{ from: 'employee: true', to: `employee: ${employeeSelect}` }]
    },
    {
        file: 'src/app/api/finance/petty-cash/[id]/process/route.ts',
        replacements: [{ from: 'employee: true', to: `employee: ${employeeSelect}` }]
    },
    {
        file: 'src/app/api/attendance/route.ts',
        replacements: [{ from: 'employee: true', to: `employee: ${employeeSelect}` }]
    },
    // Salaries - already has employee: true x2
    {
        file: 'src/app/api/salaries/route.ts',
        replacements: [{ from: 'employee: true', to: `employee: ${employeeSelect}` }]
    },
    // Customer/Supplier selects for reports and sales
    {
        file: 'src/app/api/reports/[type]/route.ts',
        replacements: [
            { from: 'customer: true', to: `customer: ${customerSelect}` },
            { from: 'supplier: true', to: `supplier: ${supplierSelect}` }
        ]
    },
    {
        file: 'src/app/api/purchases/route.ts',
        replacements: [{ from: 'supplier: true', to: `supplier: ${supplierSelect}` }]
    },
    {
        file: 'src/app/api/purchase-orders/route.ts',
        replacements: [{ from: 'supplier: true', to: `supplier: ${supplierSelect}` }]
    },
    {
        file: 'src/app/api/installments/route.ts',
        replacements: [{ from: 'customer: true', to: `customer: ${customerSelect}` }]
    },
    {
        file: 'src/app/api/bookings/invoice/route.ts',
        replacements: [{ from: 'customer: true', to: `customer: ${customerSelect}` }]
    },
    {
        file: 'src/app/api/sales-orders/route.ts',
        replacements: [{ from: 'customer: true', to: `customer: ${customerSelect}` }]
    },
    {
        file: 'src/app/api/ai-auditor/route.ts',
        replacements: [
            { from: 'customer: true', to: `customer: ${customerSelect}` },
            { from: 'supplier: true', to: `supplier: ${supplierSelect}` }
        ]
    },
    {
        file: 'src/app/api/cron/trigger-invoices/route.ts',
        replacements: [{ from: 'customer: true', to: `customer: ${customerSelect}` }]
    },
];

const base = path.join(__dirname);
let totalFixed = 0;

patches.forEach(({ file, replacements }) => {
    const filePath = path.join(base, file);
    if (!fs.existsSync(filePath)) {
        console.warn(`⚠️  File not found: ${file}`);
        return;
    }
    let content = fs.readFileSync(filePath, 'utf-8');
    let changed = false;
    replacements.forEach(({ from, to }) => {
        if (content.includes(from)) {
            // replaceAll
            content = content.split(from).join(to);
            changed = true;
            totalFixed++;
            console.log(`✅ ${file} → "${from.substring(0, 30)}..." → select`);
        } else {
            console.log(`ℹ️  ${file} → no match for "${from.substring(0, 30)}..."`);
        }
    });
    if (changed) {
        fs.writeFileSync(filePath, content, 'utf-8');
    }
});

console.log(`\n✅ Done. ${totalFixed} replacements applied.`);
