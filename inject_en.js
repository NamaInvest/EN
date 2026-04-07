const fs = require('fs');

const enMappings = {
    'sidebar.section.dashboard': 'Dashboard',
    'sidebar.section.sales': 'Sales & POS',
    'sidebar.section.purchases': 'Purchases',
    'sidebar.section.inventory': 'Inventory & WMS',
    'sidebar.section.manufacturing': 'Manufacturing (MRP)',
    'sidebar.section.finance': 'Finance & Accounting',
    'sidebar.section.crm': 'Customers (CRM)',
    'sidebar.section.hr': 'HR & Payroll',
    'sidebar.section.enterprise': 'Enterprise Systems',
    'sidebar.section.settings': 'Settings & Integration',
    'sidebar.item.dashboard': 'Dashboard',
    'sidebar.item.copilot': 'AI Copilot',
    'sidebar.item.cfo': 'AI CFO',
    'sidebar.item.scm': 'AI SCM',
    'sidebar.item.alerts': 'Inbox & Alerts',
    'sidebar.item.pos': 'POS',
    'sidebar.item.restaurant': 'Restaurant POS',
    'sidebar.item.shifts': 'Cashier Shifts',
    'sidebar.item.sales_invoices': 'Sales Invoices',
    'sidebar.item.sales_history': 'Invoice History',
    'sidebar.item.sales_quotes': 'Sales Quotes',
    'sidebar.item.sales_orders': 'Sales Orders',
    'sidebar.item.delivery_notes': 'Delivery Notes',
    'sidebar.item.sales_returns': 'Sales Returns',
    'sidebar.item.recurring_invoices': 'Recurring Invoices',
    'sidebar.item.sales_routes': 'Sales Routes',
    'sidebar.item.commissions': 'Commissions',
    'sidebar.item.purchase_reqs': 'Purchase Reqs (PR)',
    'sidebar.item.supplier_quotes': 'Supplier Quotes',
    'sidebar.item.purchase_orders': 'Purchase Orders (PO)',
    'sidebar.item.grn': 'Good Receive Notes (GRN)',
    'sidebar.item.purchases': 'Purchases',
    'sidebar.item.purchase_returns': 'Purchase Returns',
    'sidebar.item.lc': 'Letters of Credit',
    'sidebar.item.products': 'Products',
    'sidebar.item.stock': 'Stock Balances',
    'sidebar.item.movements': 'Item Movements',
    'sidebar.item.transfer': 'Warehouse Transfers',
    'sidebar.item.smart_transfer': 'Smart Transfers',
    'sidebar.item.adjustments': 'Stock Adjustments',
    'sidebar.item.warehouses_setup': 'Warehouses Setup',
    'sidebar.item.wms': 'Smart WMS',
    'sidebar.item.barcodes': 'Barcodes',
    'sidebar.item.batches': 'Batches & Expiry',
    'sidebar.item.serials': 'Serial Numbers',
    'sidebar.item.vision': 'AI Vision Stocktake',
    'sidebar.item.mfg_bom': 'Manufacturing & BOM',
    'sidebar.item.advanced_mrp': 'Advanced MRP',
    'sidebar.item.qc': 'Quality Control (QC)',
    'sidebar.item.coa': 'Chart of Accounts',
    'sidebar.item.treasury': 'Treasury & Liquidity',
    'sidebar.item.banks': 'Banks & Recon',
    'sidebar.item.papery': 'Checks Management',
    'sidebar.item.vouchers': 'Receipt Vouchers',
    'sidebar.item.petty_expense': 'Petty Expenses',
    'sidebar.item.petty_funds': 'Petty Funds',
    'sidebar.item.fixed_assets': 'Fixed Assets',
    'sidebar.item.budgets': 'Budgets',
    'sidebar.item.installments_sys': 'Installments',
    'sidebar.item.fin_reports': 'Financial Reports',
    'sidebar.item.customers': 'Customers Database',
    'sidebar.item.leads': 'Sales Leads (CRM)',
    'sidebar.item.loyalty_points': 'Loyalty Points',
    'sidebar.item.gift_cards': 'Gift Cards',
    'sidebar.item.coupons': 'Coupons',
    'sidebar.item.promotions': 'Promotions & Offers',
    'sidebar.item.employees_data': 'Employees Data',
    'sidebar.item.attendance_std': 'Attendance',
    'sidebar.item.payroll': 'Payroll',
    'sidebar.item.leaves': 'Leaves & Vacations',
    'sidebar.item.loans': 'Loans',
    'sidebar.item.recruitment': 'Recruitment',
    'sidebar.item.kpi': 'KPIs',
    'sidebar.item.training': 'Training',
    'sidebar.item.face_id': 'Smart Face ID App',
    'sidebar.item.projects': 'Projects & Contracting',
    'sidebar.item.real_estate': 'Real Estate',
    'sidebar.item.leases': 'Lease Contracts',
    'sidebar.item.fleet': 'Fleet Management',
    'sidebar.item.fleet_trips': 'Fleet Trips',
    'sidebar.item.schools': 'Academic System',
    'sidebar.item.classes': 'Classes',
    'sidebar.item.credit_control': 'Credit Control',
    'sidebar.item.saas': 'Master Panel (SaaS)',
    'sidebar.item.branches_pos': 'Branches & POS',
    'sidebar.item.currencies': 'Currencies',
    'sidebar.item.approvals': 'Approvals System',
    'sidebar.item.wa': 'WhatsApp Bot',
    'sidebar.item.salla_int': 'Salla Integration',
    'sidebar.item.sys_settings': 'System Settings',
    'sidebar.item.audit': 'Audit Logs',
    'sidebar.item.support': 'Support & Maintenance'
};

let transContent = fs.readFileSync('src/lib/translations.ts', 'utf8');

const enBlock = `
Object.assign(translations['en'], {
${Object.entries(enMappings).map(([k,v]) => `    '${k}': '${v}',`).join('\n')}
});
`;

if (!transContent.includes(`Object.assign(translations['en']`)) {
    transContent = transContent + '\n\n' + enBlock;
    fs.writeFileSync('src/lib/translations.ts', transContent, 'utf8');
    console.log('[+] Added English sidebar mappings directly into translations.ts');
}

// Ensure Sidebar.tsx has absolutely NO ARABIC in sectionKey or labelKey
const sidebar = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');
if (sidebar.includes('الرئيسية')) {
   console.log('[-] ERROR: Sidebar.tsx still contains Arabic strings. The rewrite was corrupted?');
} else {
   console.log('[+] Sidebar.tsx is clean.');
}
