import re

path = 'src/components/Sidebar.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace broken link
content = content.replace("href: '/accounting/banking'", "href: '/accounting/banks'")

# List of manual replacements for lk and sk
replacements = [
    ("lk: 'Bank Integration'", "lk: 'i.bank_integration'"),
    ("lk: 'Period Close'", "lk: 'i.period_close'"),
    ("lk: 'Vendor Portal (Sourcing)'", "lk: 'i.vendor_portal'"),
    ("lk: 'Vendor Statements'", "lk: 'i.vendor_statements'"),
    ("lk: 'Allocations'", "lk: 'i.allocations'"),
    ("lk: 'Tax & ZATCA'", "lk: 'i.tax_zatca'"),
    ("lk: 'Customer Statements UI'", "lk: 'i.customer_statements_ui'"),
    ("lk: 'BI Report Builder'", "lk: 'i.bi_builder'"),
    ("lk: 'E2E Flow Tester'", "lk: 'i.e2e_tester'"),
    ("lk: 'Audit & GRC'", "lk: 'i.audit_grc'"),
    ("lk: 'V2 Orchestration'", "lk: 'i.v2_orchestration'"),
    ("lk: 'Compliance Matrix'", "lk: 'i.compliance_matrix'"),
    ("lk: 'QMS Dashboard'", "lk: 'i.qms_dashboard'"),
    ("lk: 'Inspections'", "lk: 'i.inspections'"),
    ("lk: 'NCRs'", "lk: 'i.ncrs'"),
    ("lk: 'PLM Dashboard'", "lk: 'i.plm_dashboard'"),
    ("lk: 'Work Orders'", "lk: 'i.work_orders'"),
    ("lk: 'Dashboard'", "lk: 'i.dashboard_mfg'"), # there is already i.dashboard, but this is for manufacturing
    ("lk: 'Revenue Recognition'", "lk: 'i.rev_rec'"),
    ("lk: 'Lease Accounting'", "lk: 'i.lease_acc'"),
    ("lk: 'Year-End Close'", "lk: 'i.year_end_close'"),
    ("lk: 'Open Items'", "lk: 'i.open_items'"),
    ("lk: 'Payment Runs'", "lk: 'i.payment_runs'"),
    ("lk: 'Subscriptions'", "lk: 'i.subscriptions'"),
    ("sk: 'Quality Management'", "sk: 's.quality_mgmt_group'"),
    ("sk: 'Product Lifecycle (PLM)'", "sk: 's.plm_group'"),
    ("lk: 'Bank Statement Imports'", "lk: 'i.bank_imports'"),
    ("lk: 'Technician Tasks'", "lk: 'i.tech_tasks'"),
    ("lk: 'Dispatch Board'", "lk: 'i.dispatch_board'"),
    ("lk: 'FSM Dashboard'", "lk: 'i.fsm_dashboard'")
]

for old, new in replacements:
    content = content.replace(old, new)

# Now inject translations into `ar`
ar_translations = """
    'i.bank_integration': 'الربط البنكي (Open Banking)',
    'i.period_close': 'إغلاق الفترات المحاسبية',
    'i.vendor_portal': 'بوابة الموردين',
    'i.vendor_statements': 'كشوفات حساب الموردين',
    'i.allocations': 'توزيع التكاليف',
    'i.tax_zatca': 'الضرائب وهيئة الزكاة (ZATCA)',
    'i.customer_statements_ui': 'كشوفات حساب العملاء',
    'i.bi_builder': 'مصمم تقارير BI',
    'i.e2e_tester': 'اختبار مسارات النظام (E2E)',
    'i.audit_grc': 'المراجعة والامتثال (GRC)',
    'i.v2_orchestration': 'إدارة المزامنة (V2)',
    'i.compliance_matrix': 'مصفوفة الامتثال',
    'i.qms_dashboard': 'لوحة تحكم الجودة (QMS)',
    'i.inspections': 'الفحوصات والتفتيش',
    'i.ncrs': 'حالات عدم المطابقة (NCR)',
    'i.plm_dashboard': 'دورة حياة المنتج (PLM)',
    'i.work_orders': 'أوامر العمل',
    'i.dashboard_mfg': 'لوحة تحكم التصنيع',
    'i.rev_rec': 'الاعتراف بالإيرادات',
    'i.lease_acc': 'محاسبة عقود الإيجار',
    'i.year_end_close': 'الإغلاق السنوي',
    'i.open_items': 'العناصر المفتوحة (التسويات)',
    'i.payment_runs': 'دفعات الموردين المجمعة',
    'i.subscriptions': 'الاشتراكات المتكررة',
    's.quality_mgmt_group': 'إدارة الجودة الشاملة',
    's.plm_group': 'دورة حياة المنتج (PLM)',
    'i.bank_imports': 'استيراد كشوفات البنك',
    'i.tech_tasks': 'مهام الفنيين',
    'i.dispatch_board': 'لوحة التوزيع والجدولة',
    'i.fsm_dashboard': 'إدارة الخدمات الميدانية',
"""

# Insert right after 's.settings': 'الإعدادات',
insert_marker = "'s.settings': 'الإعدادات',"
content = content.replace(insert_marker, insert_marker + "\n" + ar_translations)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Sidebar updated and translations injected!")
