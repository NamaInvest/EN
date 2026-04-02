const fs = require('fs');

const mappings = [
    { ar: 'الرئيسية (Dashboard)', en: 'Dashboard', key: 'sidebar.section.dashboard' },
    { ar: 'المبيعات (Sales & POS)', en: 'Sales & POS', key: 'sidebar.section.sales' },
    { ar: 'المشتريات (Purchases)', en: 'Purchases', key: 'sidebar.section.purchases' },
    { ar: 'المستودعات والجرد (Inventory)', en: 'Inventory & Warehouses', key: 'sidebar.section.inventory' },
    { ar: 'التصنيع والإنتاج (MRP)', en: 'Manufacturing (MRP)', key: 'sidebar.section.manufacturing' },
    { ar: 'المالية والحسابات (Finance)', en: 'Finance & Accounting', key: 'sidebar.section.finance' },
    { ar: 'العملاء والتسويق (CRM)', en: 'Customers & CRM', key: 'sidebar.section.crm' },
    { ar: 'الموارد البشرية (HR & Payroll)', en: 'HR & Payroll', key: 'sidebar.section.hr' },
    { ar: 'أنظمة متخصصة (Enterprise)', en: 'Enterprise Systems', key: 'sidebar.section.enterprise' },
    { ar: 'الإعدادات والتكامل (Settings)', en: 'Settings & Integration', key: 'sidebar.section.settings' },
    
    // Dashboard items
    { ar: 'الوكيل المساعد (Copilot)', en: 'AI Copilot', key: 'sidebar.item.copilot' },
    { ar: 'المدير المالي (AI CFO)', en: 'AI CFO', key: 'sidebar.item.cfo' },
    { ar: 'المخزون الذكي (AI SCM)', en: 'AI SCM', key: 'sidebar.item.scm' },
    { ar: 'صندوق الوارد والتنبيهات', en: 'Inbox & Alerts', key: 'sidebar.item.alerts' },

    // Sales
    { ar: 'شاشة نقطة البيع (POS)', en: 'POS Terminals', key: 'sidebar.item.pos' },
    { ar: 'نقطة بيع المطاعم والمقاهي', en: 'Restaurant & Cafe POS', key: 'sidebar.item.restaurant' },
    { ar: 'ورديات الكاشير', en: 'Cashier Shifts', key: 'sidebar.item.shifts' },
    { ar: 'فواتير المبيعات الضريبية', en: 'Tax Sales Invoices', key: 'sidebar.item.sales_invoices' },
    { ar: 'سجل الفواتير السابقة', en: 'Previous Invoices History', key: 'sidebar.item.sales_history' },
    { ar: 'عروض أسعار المبيعات', en: 'Sales Price Quotes', key: 'sidebar.item.sales_quotes' },
    { ar: 'أوامر البيع (Sales Orders)', en: 'Sales Orders', key: 'sidebar.item.sales_orders' },
    { ar: 'مذكرات التسليم (Delivery Notes)', en: 'Delivery Notes', key: 'sidebar.item.delivery_notes' },
    { ar: 'مرتجعات المبيعات', en: 'Sales Returns', key: 'sidebar.item.sales_returns' },
    { ar: 'العقود والفواتير الدورية', en: 'Contracts & Recurring Invoices', key: 'sidebar.item.recurring_invoices' },
    { ar: 'خطوط السير للمناديب', en: 'Sales Rep Routes', key: 'sidebar.item.sales_routes' },
    { ar: 'العمولات والمستهدفات', en: 'Commissions & Targets', key: 'sidebar.item.commissions' },

    // Purchases
    { ar: 'طلبات الشراء الداخلية (PR)', en: 'Purchase Requisitions (PR)', key: 'sidebar.item.purchase_reqs' },
    { ar: 'عروض أسعار الموردين (RFQ)', en: 'Supplier Quotes (RFQ)', key: 'sidebar.item.supplier_quotes' },
    { ar: 'أوامر الشراء المعتمدة (PO)', en: 'Purchase Orders (PO)', key: 'sidebar.item.purchase_orders' },
    { ar: 'سندات الاستلام المخزني (GRN)', en: 'Goods Receipt Notes (GRN)', key: 'sidebar.item.grn' },
    { ar: 'فواتير المشتريات المستحقة', en: 'Accounts Payable', key: 'sidebar.item.payable' },
    { ar: 'مرتجعات المشتريات', en: 'Purchase Returns', key: 'sidebar.item.purchase_returns' },
    { ar: 'الاعتمادات المستندية (LC)', en: 'Letters of Credit (LC)', key: 'sidebar.item.lc' },

    // Inventory
    { ar: 'بطاقات الأصناف والخدمات', en: 'Products & Services', key: 'sidebar.item.products' },
    { ar: 'الأرصدة المخزنية الحالية', en: 'Current Stock Balances', key: 'sidebar.item.stock' },
    { ar: 'حركة الصنف التاريخية', en: 'Item Movement History', key: 'sidebar.item.movements' },
    { ar: 'نقل المخزون بين المستودعات', en: 'Stock Transfer', key: 'sidebar.item.transfer' },
    { ar: 'التحويلات الذكية (بين الفروع)', en: 'Smart Transfers (Branches)', key: 'sidebar.item.smart_transfer' },
    { ar: 'تسويات الجرد التعديلية', en: 'Stock Adjustments', key: 'sidebar.item.adjustments' },
    { ar: 'تكويد المستودعات', en: 'Warehouses Setup', key: 'sidebar.item.warehouses_setup' },
    { ar: 'توجيه المستودع الذكي (WMS)', en: 'Smart WMS', key: 'sidebar.item.wms' },
    { ar: 'البلوت والمقاسات (Barcodes)', en: 'Sizes & Barcodes', key: 'sidebar.item.barcodes' },
    { ar: 'تواريخ الصلاحية (Batches)', en: 'Expiry Dates (Batches)', key: 'sidebar.item.batches' },
    { ar: 'الأرقام التسلسلية (Serials)', en: 'Serial Numbers', key: 'sidebar.item.serials' },
    { ar: 'الجرد الذكي بالكاميرا (Vision)', en: 'Vision AI Stocktake', key: 'sidebar.item.vision' },

    // MRP
    { ar: 'إدارة التصنيع ومعادلات (BOM)', en: 'Manufacturing & BOM', key: 'sidebar.item.mfg_bom' },
    { ar: 'إدارة المصانع المتقدمة (MRP)', en: 'Advanced MRP', key: 'sidebar.item.advanced_mrp' },
    { ar: 'الفحص المخزني (QC)', en: 'Quality Control (QC)', key: 'sidebar.item.qc' },

    // Finance
    { ar: 'شجرة الحسابات والقيود', en: 'Chart of Accounts & GL', key: 'sidebar.item.coa' },
    { ar: 'الخزينة والسيولة', en: 'Treasury & Liquidity', key: 'sidebar.item.treasury' },
    { ar: 'البنوك والتسويات البنكية', en: 'Banks & Reconciliation', key: 'sidebar.item.banks' },
    { ar: 'أوراق القبض والدفع', en: 'Receivables & Payables', key: 'sidebar.item.receivables' },
    { ar: 'سندات القبض والصرف', en: 'Receipts & Payment Vouchers', key: 'sidebar.item.vouchers' },
    { ar: 'المصروفات النثرية', en: 'Petty Cash Expenses', key: 'sidebar.item.petty_expense' },
    { ar: 'صناديق العهد المؤقتة', en: 'Petty Cash Funds', key: 'sidebar.item.petty_funds' },
    { ar: 'الأصول الثابتة والإهلاكات', en: 'Fixed Assets & Depreciation', key: 'sidebar.item.fixed_assets' },
    { ar: 'الموازنات والاعتمادات', en: 'Budgets & Appropriations', key: 'sidebar.item.budgets' },
    { ar: 'نظام التقسيط والديون', en: 'Installments & Debt', key: 'sidebar.item.installments_sys' },
    { ar: 'التقارير المالية والختامية', en: 'Financial & Final Reports', key: 'sidebar.item.fin_reports' },

    // CRM
    { ar: 'قاعدة العملاء', en: 'Customer Database', key: 'sidebar.item.customers' },
    { ar: 'الفرص البيعية (CRM)', en: 'Sales Opportunities (CRM)', key: 'sidebar.item.leads' },
    { ar: 'نقاط الولاء والمكافآت', en: 'Loyalty Points & Rewards', key: 'sidebar.item.loyalty_points' },
    { ar: 'بطاقات الهدايا', en: 'Gift Cards', key: 'sidebar.item.gift_cards' },
    { ar: 'الكوبونات والخصومات', en: 'Coupons & Discounts', key: 'sidebar.item.coupons' },
    { ar: 'قواعد وعروض البيع', en: 'Sales Promotions & Rules', key: 'sidebar.item.promotions' },

    // HR
    { ar: 'بيانات الموظفين', en: 'Employee Data', key: 'sidebar.item.employees_data' },
    { ar: 'الحضور والانصراف التقليدي', en: 'Standard Attendance', key: 'sidebar.item.attendance_std' },
    { ar: 'تحضير الذكاء الاصطناعي (Face ID)', en: 'Face ID Attendance', key: 'sidebar.item.face_id' },
    { ar: 'مسيرات الرواتب', en: 'Payroll & Salaries', key: 'sidebar.item.payroll' },
    { ar: 'الإجازات والمغادرات', en: 'Leaves & Vacations', key: 'sidebar.item.leaves' },
    { ar: 'السلف والقروض', en: 'Loans & Advances', key: 'sidebar.item.loans' },
    { ar: 'التوظيف والسير الذاتية', en: 'Recruitment & CVs', key: 'sidebar.item.recruitment' },
    { ar: 'تقييم الأداء (KPIs)', en: 'Performance Evaluation (KPIs)', key: 'sidebar.item.kpi' },
    { ar: 'التدريب والتطوير', en: 'Training & Development', key: 'sidebar.item.training' },

    // Enterprise
    { ar: 'المشاريع والمقاولات (Projects)', en: 'Projects & Contracting', key: 'sidebar.item.projects' },
    { ar: 'إدارة الأملاك والعقارات', en: 'Property & Real Estate', key: 'sidebar.item.real_estate' },
    { ar: 'عقود الإيجار السكنية', en: 'Residential Leases', key: 'sidebar.item.leases' },
    { ar: 'أسطول النقل (Fleet)', en: 'Transport Fleet', key: 'sidebar.item.fleet' },
    { ar: 'رحلات الأسطول', en: 'Fleet Trips', key: 'sidebar.item.fleet_trips' },
    { ar: 'نظام المدارس الأكاديمي', en: 'School Academic System', key: 'sidebar.item.schools' },
    { ar: 'الفصول والتسجيل', en: 'Classes & Registration', key: 'sidebar.item.classes' },
    { ar: 'الضمانات والرقابة الائتمانية', en: 'Guarantees & Credit Control', key: 'sidebar.item.credit_control' },

    // Settings
    { ar: 'محرك الشركات (SaaS)', en: 'SaaS Master Panel', key: 'sidebar.item.saas' },
    { ar: 'الفروع ونقاط البيع', en: 'Branches & POS', key: 'sidebar.item.branches_pos' },
    { ar: 'إدارة العملات وصرفها', en: 'Currency Management', key: 'sidebar.item.currencies' },
    { ar: 'نظام الموافقات التقاطعية', en: 'Cross Approval System', key: 'sidebar.item.approvals' },
    { ar: 'المناطق الجغرافية', en: 'Geographical Regions', key: 'sidebar.item.regions' },
    { ar: 'صلاحيات المستخدمين', en: 'User Roles & Permissions', key: 'sidebar.item.users' },
    { ar: 'مراقبة وإسعاف السيرفرات (Sys Health)', en: 'Sys Health & Monitor', key: 'sidebar.item.health' },
    { ar: 'بائع الواتساب الآلي', en: 'WhatsApp Auto Seller', key: 'sidebar.item.wa' },
    { ar: 'الربط مع منصة سلة', en: 'Salla Platform Integration', key: 'sidebar.item.salla_int' },
    { ar: 'إعدادات النظام العامة', en: 'General System Settings', key: 'sidebar.item.sys_settings' },
    { ar: 'سجلات المراقبة (Audit)', en: 'Audit Logs', key: 'sidebar.item.audit' },
    { ar: 'أدوات الصيانة والدعم', en: 'Maintenance & Support', key: 'sidebar.item.support' },
];

let sidebar = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

mappings.forEach(m => {
    sidebar = sidebar.replace(new RegExp(`sectionKey:\\s*'${m.ar}'`, 'g'), `sectionKey: '${m.key}'`);
    sidebar = sidebar.replace(new RegExp(`labelKey:\\s*'${m.ar}'`, 'g'), `labelKey: '${m.key}'`);
});

fs.writeFileSync('src/components/Sidebar.tsx', sidebar, 'utf8');

// Now inject mappings into i18n
let i18n = fs.readFileSync('src/lib/i18n.tsx', 'utf8');
const arInjection = mappings.map(m => `        '${m.key}': '${m.ar}',`).join('\n');
const enInjection = mappings.map(m => `        '${m.key}': '${m.en}',`).join('\n');

i18n = i18n.replace(/ar:\\s*\\{/, 'ar: {\\n' + arInjection);
i18n = i18n.replace(/en:\\s*\\{/, 'en: {\\n' + enInjection);
i18n = i18n.replace(/hi:\\s*\\{/, 'hi: {\\n' + enInjection);
i18n = i18n.replace(/bn:\\s*\\{/, 'bn: {\\n' + enInjection);
i18n = i18n.replace(/ur:\\s*\\{/, 'ur: {\\n' + arInjection);

fs.writeFileSync('src/lib/i18n.tsx', i18n, 'utf8');
console.log('Successfully completed professional unicode-safe refactor!');
