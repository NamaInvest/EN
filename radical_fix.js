const fs = require('fs');

const arMappings = {
    "sidebar.section.dashboard": "الرئيسية (Dashboard)",
    "sidebar.section.sales": "المبيعات (Sales & POS)",
    "sidebar.section.purchases": "المشتريات (Purchases)",
    "sidebar.section.inventory": "المستودعات والجرد (Inventory)",
    "sidebar.section.manufacturing": "التصنيع والإنتاج (MRP)",
    "sidebar.section.finance": "المالية والحسابات (Finance)",
    "sidebar.section.crm": "العملاء والتسويق (CRM)",
    "sidebar.section.hr": "الموارد البشرية (HR & Payroll)",
    "sidebar.section.enterprise": "أنظمة متخصصة (Enterprise)",
    "sidebar.section.settings": "الإعدادات والتكامل (Settings)",
    "sidebar.item.dashboard": "لوحة التحكم (Dashboard)",
    "sidebar.item.copilot": "الوكيل المساعد (Copilot)",
    "sidebar.item.cfo": "المدير المالي (AI CFO)",
    "sidebar.item.scm": "المخزون الذكي (AI SCM)",
    "sidebar.item.alerts": "صندوق الوارد والتنبيهات",
    "sidebar.item.pos": "شاشة نقطة البيع (POS)",
    "sidebar.item.restaurant": "نقطة بيع المطاعم والمقاهي",
    "sidebar.item.shifts": "ورديات الكاشير",
    "sidebar.item.sales_invoices": "فواتير المبيعات الضريبية",
    "sidebar.item.sales_history": "سجل الفواتير السابقة",
    "sidebar.item.sales_quotes": "عروض أسعار المبيعات",
    "sidebar.item.sales_orders": "أوامر البيع (Sales Orders)",
    "sidebar.item.delivery_notes": "مذكرات التسليم (Delivery Notes)",
    "sidebar.item.sales_returns": "مرتجعات المبيعات",
    "sidebar.item.recurring_invoices": "العقود والفواتير الدورية",
    "sidebar.item.sales_routes": "خطوط السير للمناديب",
    "sidebar.item.commissions": "العمولات والمستهدفات",
    "sidebar.item.purchase_reqs": "طلبات الشراء الداخلية (PR)",
    "sidebar.item.supplier_quotes": "عروض أسعار الموردين (RFQ)",
    "sidebar.item.purchase_orders": "أوامر الشراء المعتمدة (PO)",
    "sidebar.item.grn": "سندات الاستلام المخزني (GRN)",
    "sidebar.item.purchases": "فواتير المشتريات المستحقة",
    "sidebar.item.purchase_returns": "مرتجعات المشتريات",
    "sidebar.item.lc": "الاعتمادات المستندية (LC)",
    "sidebar.item.products": "بطاقات الأصناف والخدمات",
    "sidebar.item.stock": "الأرصدة المخزنية الحالية",
    "sidebar.item.movements": "حركة الصنف التاريخية",
    "sidebar.item.transfer": "نقل المخزون بين المستودعات",
    "sidebar.item.smart_transfer": "التحويلات الذكية (بين الفروع)",
    "sidebar.item.adjustments": "تسويات الجرد التعديلية",
    "sidebar.item.warehouses_setup": "تكويد المستودعات",
    "sidebar.item.wms": "توجيه المستودع الذكي (WMS)",
    "sidebar.item.barcodes": "البلوت والمقاسات (Barcodes)",
    "sidebar.item.batches": "تواريخ الصلاحية (Batches)",
    "sidebar.item.serials": "الأرقام التسلسلية (Serials)",
    "sidebar.item.vision": "الجرد الذكي بالكاميرا (Vision)",
    "sidebar.item.mfg_bom": "إدارة التصنيع ومعادلات (BOM)",
    "sidebar.item.advanced_mrp": "إدارة المصانع المتقدمة (MRP)",
    "sidebar.item.qc": "الفحص المخزني (QC)",
    "sidebar.item.coa": "شجرة الحسابات والقيود",
    "sidebar.item.treasury": "الخزينة والسيولة",
    "sidebar.item.banks": "البنوك والتسويات البنكية",
    "sidebar.item.papery": "أوراق القبض والدفع",
    "sidebar.item.vouchers": "سندات القبض والصرف",
    "sidebar.item.petty_expense": "المصروفات النثرية",
    "sidebar.item.petty_funds": "صناديق العهد المؤقتة",
    "sidebar.item.fixed_assets": "الأصول الثابتة والإهلاكات",
    "sidebar.item.budgets": "الموازنات والاعتمادات",
    "sidebar.item.installments_sys": "نظام التقسيط والديون",
    "sidebar.item.fin_reports": "التقارير المالية والختامية",
    "sidebar.item.customers": "قاعدة العملاء",
    "sidebar.item.leads": "الفرص البيعية (CRM)",
    "sidebar.item.loyalty_points": "نقاط الولاء والمكافآت",
    "sidebar.item.gift_cards": "بطاقات الهدايا",
    "sidebar.item.coupons": "الكوبونات والخصومات",
    "sidebar.item.promotions": "قواعد وعروض البيع",
    "sidebar.item.employees_data": "بيانات الموظفين",
    "sidebar.item.attendance_std": "الحضور والانصراف",
    "sidebar.item.payroll": "مسيرات الرواتب",
    "sidebar.item.leaves": "الإجازات والمغادرات",
    "sidebar.item.loans": "السلف والقروض",
    "sidebar.item.recruitment": "التوظيف والسير الذاتية",
    "sidebar.item.kpi": "تقييم الأداء (KPIs)",
    "sidebar.item.training": "التدريب والتطوير",
    "sidebar.item.face_id": "تسجيل البصمة الذكية",
    "sidebar.item.projects": "المشاريع والمقاولات (Projects)",
    "sidebar.item.real_estate": "إدارة الأملاك والعقارات",
    "sidebar.item.leases": "عقود الإيجار السكنية",
    "sidebar.item.fleet": "أسطول النقل (Fleet)",
    "sidebar.item.fleet_trips": "رحلات الأسطول",
    "sidebar.item.schools": "نظام المدارس الأكاديمي",
    "sidebar.item.classes": "الفصول والتسجيل",
    "sidebar.item.credit_control": "الضمانات والرقابة الائتمانية",
    "sidebar.item.saas": "محرك الشركات (SaaS)",
    "sidebar.item.branches_pos": "الفروع ونقاط البيع",
    "sidebar.item.currencies": "إدارة العملات وصرفها",
    "sidebar.item.approvals": "نظام الموافقات التقاطعية",
    "sidebar.item.wa": "بائع الواتساب الآلي",
    "sidebar.item.salla_int": "الربط مع منصة سلة",
    "sidebar.item.sys_settings": "إعدادات النظام العامة",
    "sidebar.item.audit": "سجلات المراقبة (Audit)",
    "sidebar.item.support": "أدوات الصيانة والدعم",
};

// 1. Inject AR translations into `translations.ts`
let transContent = fs.readFileSync('src/lib/translations.ts', 'utf8');
const arBlock = `
Object.assign(translations['ar'], {
${Object.entries(arMappings).map(([k,v]) => `    '${k}': '${v}',`).join('\n')}
});
`;

if (!transContent.includes('Object.assign(translations[\'ar\']')) {
    transContent = transContent + '\n\n' + arBlock;
    fs.writeFileSync('src/lib/translations.ts', transContent, 'utf8');
    console.log('[+] Injected missing arabic sidebar keys into translations.ts');
}

// 2. Rewrite Sidebar.tsx menuItems structurally
let sidebarContent = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

// The new menuItems string block
const newMenuItems = `const menuItems = [
    {
        sectionKey: 'sidebar.section.dashboard', items: [
            { icon: '📊', labelKey: 'sidebar.item.dashboard', href: '/dashboard', module: 'dashboard' },
            { icon: '🤖', labelKey: 'sidebar.item.copilot', href: '/ai-copilot', module: 'ai_copilot' },
            { icon: '🧠', labelKey: 'sidebar.item.cfo', href: '/ai-cfo', module: 'ai_cfo' },
            { icon: '📦', labelKey: 'sidebar.item.scm', href: '/ai-scm', module: 'ai_scm' },
            { icon: '🔔', labelKey: 'sidebar.item.alerts', href: '/sys/alerts', module: 'dashboard' },
        ]
    },
    {
        sectionKey: 'sidebar.section.sales', items: [
            { icon: '💻', labelKey: 'sidebar.item.pos', href: '/pos', module: 'pos' },
            { icon: '🍔', labelKey: 'sidebar.item.restaurant', href: '/restaurant-pos', module: 'restaurant_pos' },
            { icon: '🕒', labelKey: 'sidebar.item.shifts', href: '/shifts', module: 'shifts' },
            { icon: '🧾', labelKey: 'sidebar.item.sales_invoices', href: '/sales', module: 'sales' },
            { icon: '🗂️', labelKey: 'sidebar.item.sales_history', href: '/sales/history', module: 'sales' },
            { icon: '📄', labelKey: 'sidebar.item.sales_quotes', href: '/price-quotes', module: 'price_quotes' },
            { icon: '📦', labelKey: 'sidebar.item.sales_orders', href: '/sales/orders', module: 'sales_orders' },
            { icon: '🚚', labelKey: 'sidebar.item.delivery_notes', href: '/sales/delivery-notes', module: 'sales_orders' },
            { icon: '↩️', labelKey: 'sidebar.item.sales_returns', href: '/sales-returns', module: 'sales_returns' },
            { icon: '🔄', labelKey: 'sidebar.item.recurring_invoices', href: '/recurring-invoices', module: 'sales_orders' },
            { icon: '🗺️', labelKey: 'sidebar.item.sales_routes', href: '/sales/routes', module: 'sales_routes' },
            { icon: '🎯', labelKey: 'sidebar.item.commissions', href: '/sales/targets', module: 'sales_targets' },
        ]
    },
    {
        sectionKey: 'sidebar.section.purchases', items: [
            { icon: '📝', labelKey: 'sidebar.item.purchase_reqs', href: '/purchases/requisitions', module: 'purchase_orders' },
            { icon: '📩', labelKey: 'sidebar.item.supplier_quotes', href: '/purchases/rfq', module: 'purchase_orders' },
            { icon: '📋', labelKey: 'sidebar.item.purchase_orders', href: '/purchase-orders', module: 'purchase_orders' },
            { icon: '📥', labelKey: 'sidebar.item.grn', href: '/purchases/grn', module: 'purchases' },
            { icon: '🛒', labelKey: 'sidebar.item.purchases', href: '/purchases', module: 'purchases' },
            { icon: '↩️', labelKey: 'sidebar.item.purchase_returns', href: '/purchase-returns', module: 'purchase_returns' },
            { icon: '🌍', labelKey: 'sidebar.item.lc', href: '/purchases/letters-of-credit', module: 'letters_of_credit' },
        ]
    },
    {
        sectionKey: 'sidebar.section.inventory', items: [
            { icon: '📦', labelKey: 'sidebar.item.products', href: '/products', module: 'products' },
            { icon: '🏭', labelKey: 'sidebar.item.stock', href: '/stock', module: 'stock' },
            { icon: '⌚', labelKey: 'sidebar.item.movements', href: '/stock/movements', module: 'stock_transfers' },
            { icon: '🔀', labelKey: 'sidebar.item.transfer', href: '/stock-transfers', module: 'stock_transfers' },
            { icon: '🚚', labelKey: 'sidebar.item.smart_transfer', href: '/smart-transfers', module: 'stock_transfers' },
            { icon: '⚖️', labelKey: 'sidebar.item.adjustments', href: '/stock/adjustments', module: 'stock_transfers' },
            { icon: '🏢', labelKey: 'sidebar.item.warehouses_setup', href: '/warehouses', module: 'warehouses' },
            { icon: '📐', labelKey: 'sidebar.item.wms', href: '/enterprise/wms', module: 'wms' },
            { icon: '🏷️', labelKey: 'sidebar.item.barcodes', href: '/barcode', module: 'barcode' },
            { icon: '⏱️', labelKey: 'sidebar.item.batches', href: '/batches', module: 'batches' },
            { icon: '🔢', labelKey: 'sidebar.item.serials', href: '/inv/serials', module: 'stock' },
            { icon: '📸', labelKey: 'sidebar.item.vision', href: '/stocktake/vision', module: 'vision_inventory' },
        ]
    },
    {
        sectionKey: 'sidebar.section.manufacturing', items: [
            { icon: '🛠️', labelKey: 'sidebar.item.mfg_bom', href: '/manufacturing', module: 'manufacturing' },
            { icon: '🏭', labelKey: 'sidebar.item.advanced_mrp', href: '/enterprise/mrp', module: 'mrp' },
            { icon: '🔎', labelKey: 'sidebar.item.qc', href: '/enterprise/quality', module: 'mrp' },
        ]
    },
    {
        sectionKey: 'sidebar.section.finance', items: [
            { icon: '📊', labelKey: 'sidebar.item.coa', href: '/accounting', module: 'accounting' },
            { icon: '💰', labelKey: 'sidebar.item.treasury', href: '/treasury', module: 'treasury' },
            { icon: '🏦', labelKey: 'sidebar.item.banks', href: '/accounting/banks', module: 'banks' },
            { icon: '🏦', labelKey: 'sidebar.item.papery', href: '/treasury/checks', module: 'treasury_checks' },
            { icon: '🧾', labelKey: 'sidebar.item.vouchers', href: '/receipt-vouchers', module: 'receipt_vouchers' },
            { icon: '💸', labelKey: 'sidebar.item.petty_expense', href: '/expenses', module: 'expenses' },
            { icon: '💼', labelKey: 'sidebar.item.petty_funds', href: '/fng/petty-cash-funds', module: 'petty_cash' },
            { icon: '🏢', labelKey: 'sidebar.item.fixed_assets', href: '/fixed-assets', module: 'fixed_assets' },
            { icon: '⚖️', labelKey: 'sidebar.item.budgets', href: '/fng/budgets', module: 'accounting' },
            { icon: '📑', labelKey: 'sidebar.item.installments_sys', href: '/installments', module: 'installments' },
            { icon: '📈', labelKey: 'sidebar.item.fin_reports', href: '/reports', module: 'reports' },
        ]
    },
    {
        sectionKey: 'sidebar.section.crm', items: [
            { icon: '👥', labelKey: 'sidebar.item.customers', href: '/customers', module: 'customers' },
            { icon: '📈', labelKey: 'sidebar.item.leads', href: '/crm/leads', module: 'customers' },
            { icon: '🎁', labelKey: 'sidebar.item.loyalty_points', href: '/loyalty', module: 'loyalty' },
            { icon: '💳', labelKey: 'sidebar.item.gift_cards', href: '/gift-cards', module: 'gift_cards' },
            { icon: '🎟️', labelKey: 'sidebar.item.coupons', href: '/coupons', module: 'coupons' },
            { icon: '🎯', labelKey: 'sidebar.item.promotions', href: '/promotions', module: 'promotions' },
        ]
    },
    {
        sectionKey: 'sidebar.section.hr', items: [
            { icon: '👨‍💼', labelKey: 'sidebar.item.employees_data', href: '/employees', module: 'employees' },
            { icon: '🕐', labelKey: 'sidebar.item.attendance_std', href: '/attendance', module: 'attendance' },
            { icon: '💵', labelKey: 'sidebar.item.payroll', href: '/salaries', module: 'salaries' },
            { icon: '🏖️', labelKey: 'sidebar.item.leaves', href: '/vacations', module: 'vacations' },
            { icon: '💼', labelKey: 'sidebar.item.loans', href: '/hr/loans', module: 'hr_loans' },
            { icon: '👔', labelKey: 'sidebar.item.recruitment', href: '/hr/jobs', module: 'employees' },
            { icon: '📊', labelKey: 'sidebar.item.kpi', href: '/hr/evaluations', module: 'employees' },
            { icon: '🎓', labelKey: 'sidebar.item.training', href: '/hr/training', module: 'employees' },
            { icon: '👁️', labelKey: 'sidebar.item.face_id', href: '/hr/ai-enrollment', module: 'employees' },
        ]
    },
    {
        sectionKey: 'sidebar.section.enterprise', items: [
            { icon: '🏗️', labelKey: 'sidebar.item.projects', href: '/enterprise/projects', module: 'projects' },
            { icon: '🏢', labelKey: 'sidebar.item.real_estate', href: '/enterprise/property', module: 'legal' },
            { icon: '📝', labelKey: 'sidebar.item.leases', href: '/rem/leases', module: 'legal' },
            { icon: '🚚', labelKey: 'sidebar.item.fleet', href: '/enterprise/fleet', module: 'legal' },
            { icon: '🛣️', labelKey: 'sidebar.item.fleet_trips', href: '/fleet/trips', module: 'legal' },
            { icon: '🏫', labelKey: 'sidebar.item.schools', href: '/shl/students', module: 'schools' },
            { icon: '📚', labelKey: 'sidebar.item.classes', href: '/shl/classes', module: 'schools' },
            { icon: '⚖️', labelKey: 'sidebar.item.credit_control', href: '/enterprise/legal', module: 'legal' },
        ]
    },
    {
        sectionKey: 'sidebar.section.settings', items: [
            { icon: '🌐', labelKey: 'sidebar.item.saas', href: '/master-panel', module: 'master-panel' },
            { icon: '🏢', labelKey: 'sidebar.item.branches_pos', href: '/branches', module: 'branches' },
            { icon: '💱', labelKey: 'sidebar.item.currencies', href: '/settings/currencies', module: 'currencies' },
            { icon: '✅', labelKey: 'sidebar.item.approvals', href: '/settings/approvals', module: 'approvals' },
            { icon: '💬', labelKey: 'sidebar.item.wa', href: '/whatsapp-hub', module: 'whatsapp' },
            { icon: '🛒', labelKey: 'sidebar.item.salla_int', href: '/settings#salla', module: 'salla' },
            { icon: '⚙️', labelKey: 'sidebar.item.sys_settings', href: '/settings', module: 'settings' },
            { icon: '🛡️', labelKey: 'sidebar.item.audit', href: '/audit-logs', module: 'audit_logs' },
            { icon: '🔧', labelKey: 'sidebar.item.support', href: '/maintenance', module: 'maintenance' },
        ]
    },
];`;

const startIdx = sidebarContent.indexOf('const menuItems = [');
const endIdx = sidebarContent.indexOf('];', startIdx) + 2;

if (startIdx !== -1 && endIdx !== -1) {
    sidebarContent = sidebarContent.substring(0, startIdx) + newMenuItems + sidebarContent.substring(endIdx);
    
    // We also need to fix the sectionKey rendering because it might not be passing through t()
    // Find: {group.sectionKey}
    // Replace: {t(group.sectionKey)}
    sidebarContent = sidebarContent.replace('{group.sectionKey}', '{t(group.sectionKey)}');
    
    fs.writeFileSync('src/components/Sidebar.tsx', sidebarContent, 'utf8');
    console.log('[+] Rewrote Sidebar.tsx successfully.');
} else {
    console.log('[-] Could not find menuItems in Sidebar.tsx');
}
