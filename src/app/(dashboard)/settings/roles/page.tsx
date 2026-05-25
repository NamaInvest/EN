'use client';

import React, { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Shield, Save, Check, X, User } from 'lucide-react';
import { Skeleton } from '@/components/Skeleton';
import { useToast } from '@/components/Toast';

const MODULES_GROUPED = [
 {
 category: 'لوحة القيادة والذكاء الاصطناعي',
 keys: ['dashboard', 'ai_bank', 'ai_copilot', 'ai_cfo', 'ai_scm']
 },
 {
 category: 'المبيعات ونقاط البيع',
 keys: ['sales', 'sales_orders', 'sales_returns', 'sales_routes', 'sales_targets', 'price_quotes', 'pos', 'restaurant_pos', 'customers']
 },
 {
 category: 'المشتريات والتوريد',
 keys: ['purchases', 'purchase_orders', 'purchase_returns', 'letters_of_credit']
 },
 {
 category: 'المخزون والمستودعات',
 keys: ['products', 'stock', 'stock_transfers', 'warehouses', 'wms', 'barcode', 'batches', 'vision_inventory']
 },
 {
 category: 'المالية والمحاسبة',
 keys: ['accounting', 'treasury', 'banks', 'treasury_checks', 'receipt_vouchers', 'expenses', 'petty_cash', 'fixed_assets', 'installments', 'reports']
 },
 {
 category: 'الموارد البشرية والرواتب',
 keys: ['employees', 'attendance', 'salaries', 'vacations', 'hr_loans', 'shifts']
 },
 {
 category: 'التسويق وعلاقات العملاء',
 keys: ['loyalty', 'gift_cards', 'coupons', 'promotions', 'bookings', 'affiliates']
 },
 {
 category: 'التصنيع والصيانة',
 keys: ['manufacturing', 'mrp', 'maintenance']
 },
 {
 category: 'القطاعات المتخصصة (Verticals)',
 keys: ['projects', 'legal', 'schools', 'pharmacy']
 },
 {
 category: 'إعدادات النظام',
 keys: ['settings', 'branches', 'currencies', 'approvals', 'audit_logs', 'master-panel', 'whatsapp', 'salla']
 }
,
  {
    category: 'الوحدات الإضافية والمسارات الجديدة',
    keys: ['bank_integration', 'vendor_portal', 'vendor_statements', 'allocations', 'tax_zatca', 'customer_statements_ui', 'bi_builder', 'e2e_tester', 'audit_grc', 'v2_orchestration', 'compliance_matrix', 'qms_dashboard', 'inspections', 'ncrs', 'plm_dashboard', 'work_orders', 'dashboard_mfg', 'rev_rec', 'lease_acc', 'year_end_close', 'open_items', 'payment_runs', 'subscriptions', 'bank_imports', 'tech_tasks', 'dispatch_board', 'fsm_dashboard', 'copilot', 'cfo', 'scm', 'alerts', 'restaurant', 'sales_invoices', 'sales_history', 'sales_quotes', 'delivery_notes', 'debit_notes', 'sales_options', 'recurring', 'routes', 'commissions', 'purchase_reqs', 'rfq', 'po', 'grn', 'purchases_options', 'manual_purchases', 'lc', 'movements', 'transfer', 'smart_transfer', 'adjustments', 'barcodes', 'serials', 'vision', 'bom', 'qc', 'work_centers', 'scheduler', 'labor_eff', 'blockchain', 'kanban', 'digital_twin', 'mrp_engine', 'coa', 'checks', 'vouchers', 'budgets', 'fin_reports', 'budget_variance', 'customer_statement', 'cfo_dashboard', 'returns_report', 'expiry_report', 'leads', 'payroll', 'leaves', 'loans', 'recruitment', 'kpi', 'training', 'face_id', 'property', 'leases', 'fleet', 'fleet_trips', 'classes', 'credit', 'saas', 'wa', 'audit', 'support', 'fleet_fuel', 'prop_inst', 'book_cal', 'campaigns', 'tickets', 'bi_dashboard', 'budget_scenarios', 'ecommerce', 'contract_templates', 'sub_plans', 'ecommerce_stores', 'grc', 'knowledge', 'events', 'esign', 'cmms', 'logistics', 'lms', 'audits', 'maint_wo', 'carriers', 'planning', 'portal', 'rental', 'field_service', 'pos_offline', 'bank_recon', 'fraud_ai', '73mod', 'sys_health', 'mrp_recipes', 'stocktake', 'warehouse_opts', 'company_info', 'shift_monitor', 'pos_accountant', 'sales_analytics', 'smart_map', 'pharmacy_mgr', 'drug_interact', 'wms_map', 'fifo', 'cfo_dash', 'gosi', 'eos', 'leave_mgmt', 'doc_expiry', 'cash_flow', 'consolidation', 'fx_reval', 'allocation', 'budget_ctrl', 'supplier_contracts', 'price_compare', 'mrp_dash', 'mfg_qc', 'fleet_gps', 'help_desk', 'cx_nps', 'key_accounts', 'portfolio', 'marketing_analytics', 'ai_demand', 'ai_coach', 'siem', 'backup', 'profit_centers', 'segments', 'copa', 'copa_rules', 'num_seq', 'state_machine', 'field_audit', 'period_close', 'wps', 'bank_recon_auto', 'dunning', 'three_way', 'bpm', 'payment_run', 'ecl', 'std_cost', 'subcontracting', 'quality_mgmt', 'multi_book', 'custom_fields', 'qiwa_sync', 'saudization', 'qiwa_contracts', 'nitaqat_sim', 'pdpl_dsr', 'pdpl_breach', 'vat_categories', 'period_lock', 'profit_loss', 'vat_return', 'fin_health', 'collection_wf', 'prepayments_ui', 'interco', 'wht_form14', 'mudad_compliance', 'zakat_assessment', 'v3_retail', 'v3_restaurant', 'v3_mfg', 'v3_construction', 'v3_clinic', 'v3_school', 'v3_realestate', 'v3_distribution', 'v3_services', 'v3_retail_pos', 'v3_restaurant_kds', 'v3_mfg_mrp', 'v3_construction_boq', 'v3_clinic_emr', 'v3_school_sis', 'v3_realestate_leases', 'v3_distribution_wms', 'v3_services_timesheet', 'webhooks', 'credit_check', 'cash_forecast', 'number_sequences', 'cpq', 'rebates', 'sales_forecast', 'vendor_scorecard', 'aps_scheduler', 'project_evm', 'wave_picking', 'mes_oee', 'bi_cube', 'nlq', 'spend_analytics', 'service_sla', 'prev_maintenance', 'sso_saml', 'aging_report', 'kanban_board', 'timesheet', 'self_service', 'contracts_mgmt', 'vendor_portal_page', 'workflow_builder', 'print_templates', 'dashboard_builder', 'import_export', 'dms', 'calendar', 'pivot_table', 'customer360', 'reorder_rules', 'notifications', 'expense_reports', 'org_chart', 'global_search', 'chatter', 'deferred_rev', 'shipping']
  }];

const MODULE_NAMES: Record<string, string> = {
 'dashboard': 'لوحة القيادة',
 'ai_bank': 'محلل البنوك الذكي',
 'ai_copilot': 'المساعد الذكي',
 'ai_cfo': 'المدير المالي الذكي',
 'ai_scm': 'سلاسل الإمداد الذكية',
 'pos': 'نقاط البيع',
 'restaurant_pos': 'نقاط بيع المطاعم',
 'shifts': 'الورديات',
 'sales': 'المبيعات',
 'price_quotes': 'عروض الأسعار',
 'sales_orders': 'أوامر البيع',
 'sales_returns': 'مرتجعات المبيعات',
 'sales_routes': 'خطوط السير والمناديب',
 'sales_targets': 'العمولات والمستهدفات',
 'purchases': 'المشتريات',
 'purchase_orders': 'أوامر الشراء',
 'purchase_returns': 'مرتجعات المشتريات',
 'letters_of_credit': 'الاعتمادات المستندية',
 'products': 'المنتجات',
 'stock': 'المخزون',
 'stock_transfers': 'نقل المخزون',
 'warehouses': 'المستودعات',
 'wms': 'إدارة المستودعات المتقدمة',
 'barcode': 'الباركود',
 'batches': 'الدفعات وتواريخ الانتهاء',
 'vision_inventory': 'الجرد بالذكاء الاصطناعي',
 'manufacturing': 'التصنيع',
 'accounting': 'المحاسبة',
 'treasury': 'الخزينة',
 'banks': 'البنوك',
 'treasury_checks': 'الشيكات',
 'receipt_vouchers': 'سندات القبض والصرف',
 'expenses': 'المصروفات',
 'petty_cash': 'العهد النقدية',
 'fixed_assets': 'الأصول الثابتة',
 'installments': 'الأقساط',
 'reports': 'التقارير',
 'customers': 'العملاء',
 'loyalty': 'نقاط الولاء',
 'gift_cards': 'كروت الهدايا',
 'coupons': 'الكوبونات',
 'promotions': 'العروض الترويجية',
 'bookings': 'الحجوزات',
 'affiliates': 'التسويق بالعمولة',
 'employees': 'الموظفين',
 'attendance': 'الحضور والانصراف',
 'salaries': 'الرواتب',
 'vacations': 'الإجازات',
 'hr_loans': 'السلف والقروض',
 'projects': 'المشاريع',
 'legal': 'الشؤون القانونية',
 'schools': 'المدارس',
 'pharmacy': 'الصيدليات',
 'approvals': 'الاعتمادات والموافقات',
 'mrp': 'تخطيط الموارد',
 'maintenance': 'الصيانة',
 'audit_logs': 'سجل الحركات (Audit)',
 'settings': 'الإعدادات العامة',
 'master-panel': 'لوحة التحكم المركزية (Master)',
 'branches': 'الفروع',
 'currencies': 'العملات',
 'salla': 'ربط سلة',

  'bank_integration': 'الربط البنكي (Open Banking)',
  'vendor_portal': 'بوابة الموردين',
  'vendor_statements': 'كشوفات حساب الموردين',
  'allocations': 'توزيع التكاليف',
  'tax_zatca': 'الضرائب وهيئة الزكاة (ZATCA)',
  'customer_statements_ui': 'كشوفات حساب العملاء',
  'bi_builder': 'مصمم تقارير BI',
  'e2e_tester': 'اختبار مسارات النظام (E2E)',
  'audit_grc': 'المراجعة والامتثال (GRC)',
  'v2_orchestration': 'إدارة المزامنة (V2)',
  'compliance_matrix': 'مصفوفة الامتثال',
  'qms_dashboard': 'لوحة تحكم الجودة (QMS)',
  'inspections': 'الفحوصات والتفتيش',
  'ncrs': 'حالات عدم المطابقة (NCR)',
  'plm_dashboard': 'دورة حياة المنتج (PLM)',
  'work_orders': 'أوامر العمل',
  'dashboard_mfg': 'لوحة تحكم التصنيع',
  'rev_rec': 'الاعتراف بالإيرادات',
  'lease_acc': 'محاسبة عقود الإيجار',
  'year_end_close': 'الإغلاق السنوي',
  'open_items': 'العناصر المفتوحة (التسويات)',
  'payment_runs': 'دفعات الموردين المجمعة',
  'subscriptions': 'الاشتراكات المتكررة',
  'bank_imports': 'استيراد كشوفات البنك',
  'tech_tasks': 'مهام الفنيين',
  'dispatch_board': 'لوحة التوزيع والجدولة',
  'fsm_dashboard': 'إدارة الخدمات الميدانية',
  'copilot': 'المساعد الذكي',
  'cfo': 'المدير المالي الذكي',
  'scm': 'المخزون الذكي',
  'alerts': 'صندوق الوارد والتنبيهات',
  'restaurant': 'نقطة بيع المطاعم',
  'sales_invoices': 'فواتير المبيعات',
  'sales_history': 'سجل الفواتير',
  'sales_quotes': 'عروض الأسعار',
  'delivery_notes': 'مذكرات التسليم',
  'debit_notes': 'إشعارات مدينة',
  'sales_options': 'خيارات المبيعات',
  'recurring': 'العقود الدورية',
  'routes': 'خطوط السير',
  'commissions': 'العمولات والمستهدفات',
  'purchase_reqs': 'طلبات الشراء',
  'rfq': 'عروض أسعار الموردين',
  'po': 'أوامر الشراء',
  'grn': 'سندات الاستلام',
  'purchases_options': 'خيارات المشتريات',
  'manual_purchases': 'فواتير المشتريات اليدوية',
  'lc': 'الاعتمادات المستندية',
  'movements': 'حركة الصنف',
  'transfer': 'نقل المخزون',
  'smart_transfer': 'التحويلات الذكية',
  'adjustments': 'تسويات الجرد',
  'barcodes': 'الباركود والملصقات',
  'serials': 'الأرقام التسلسلية',
  'vision': 'جرد الكاميرا الذكي',
  'bom': 'معادلات التصنيع (BOM)',
  'qc': 'الفحص المخزني',
  'work_centers': 'مراكز العمل والمسارات',
  'scheduler': 'جدولة الإنتاج (Gantt)',
  'labor_eff': 'كفاءة العمالة',
  'blockchain': 'تتبع البلوك تشين',
  'kanban': 'التصنيع الرشيق (Kanban)',
  'digital_twin': 'التوأمة الرقمية',
  'mrp_engine': 'محرك الـ MRP',
  'coa': 'شجرة الحسابات',
  'checks': 'أوراق القبض والدفع',
  'vouchers': 'سندات القبض والمصرف',
  'budgets': 'الموازنات',
  'fin_reports': 'التقارير المالية',
  'budget_variance': 'انحراف الموازنة',
  'customer_statement': 'كشف حساب عميل',
  'cfo_dashboard': 'لوحة المدير المالي',
  'returns_report': 'تقرير المرتجعات',
  'expiry_report': 'تقرير الصلاحيات',
  'leads': 'الفرص البيعية',
  'payroll': 'مسيرات الرواتب',
  'leaves': 'الإجازات',
  'loans': 'السلف والقروض',
  'recruitment': 'التوظيف',
  'kpi': 'تقييم الأداء',
  'training': 'التدريب',
  'face_id': 'البصمة الذكية',
  'property': 'الأملاك والعقارات',
  'leases': 'عقود الإيجار',
  'fleet': 'أسطول النقل',
  'fleet_trips': 'رحلات الأسطول',
  'classes': 'الفصول',
  'credit': 'الرقابة الائتمانية',
  'saas': 'محرك الشركات',
  'wa': 'الواتساب الآلي',
  'audit': 'سجلات المراقبة',
  'support': 'الصيانة والدعم',
  'fleet_fuel': 'وقود الأودت',
  'prop_inst': 'أقساط العقارات',
  'book_cal': 'تقويم الحجوزات',
  'campaigns': 'الحملات التسويقية',
  'tickets': 'تذاكر الدعم',
  'bi_dashboard': 'لوحة ذكاء الأعمال',
  'budget_scenarios': 'سيناريوهات الميزانية',
  'ecommerce': 'التجارة الإلكترونية',
  'contract_templates': 'قوالب العقود',
  'sub_plans': 'خطط الاشتراك',
  'ecommerce_stores': 'المتاجر الإلكترونية',
  'grc': 'الحوكمة والمخاطر',
  'knowledge': 'قاعدة المعرفة',
  'events': 'الفعاليات',
  'esign': 'التوقيع الإلكتروني',
  'cmms': 'إدارة الصيانة',
  'logistics': 'النقل واللوجستيات',
  'lms': 'التعلم الإلكتروني',
  'audits': 'التدقيق الداخلي',
  'maint_wo': 'أوامر الصيانة',
  'carriers': 'شركات الشحن',
  'planning': 'التخطيط والجدولة',
  'portal': 'بوابة العملاء',
  'rental': 'إدارة الإيجارات',
  'field_service': 'الخدمة الميدانية',
  'pos_offline': 'POS أوفلاين',
  'bank_recon': 'مذكرات التسوية البنكية',
  'fraud_ai': 'كشف الاحتيال الذكي',
  '73mod': 'موسوعة الـ 104 وحدة',
  'sys_health': 'حالة النظام',
  'mrp_recipes': 'وصفات التصنيع (Recipes)',
  'stocktake': 'عمليات الجرد المخزني',
  'warehouse_opts': 'خيارات المستودعات',
  'company_info': 'معلومات المنشأة',
  'shift_monitor': 'مراقبة المناوبة لحظياً',
  'pos_accountant': 'محاسب نقطة البيع',
  'sales_analytics': 'تحليلات أداء المبيعات',
  'smart_map': 'الخريطة الذكية للمندوب',
  'pharmacy_mgr': 'لوحة مدير الصيدلية',
  'drug_interact': 'التفاعلات الدوائية',
  'wms_map': 'خريطة المستودع',
  'fifo': 'إدارة FIFO / FEFO',
  'cfo_dash': 'لوحة المدير المالي (CFO)',
  'gosi': 'التأمينات الاجتماعية GOSI',
  'eos': 'مكافأة نهاية الخدمة',
  'leave_mgmt': 'إدارة الإجازات',
  'doc_expiry': 'تنبيهات الوثائق',
  'cash_flow': 'التنبؤ بالتدفقات النقدية',
  'consolidation': 'التوحيد المالي',
  'fx_reval': 'إعادة تقييم العملات',
  'allocation': 'توزيع التكاليف',
  'budget_ctrl': 'الرقابة على الميزانية',
  'supplier_contracts': 'عقود الموردين',
  'price_compare': 'مقارنة أسعار الموردين',
  'mrp_dash': 'لوحة تخطيط الإنتاج',
  'mfg_qc': 'ضبط جودة التصنيع',
  'fleet_gps': 'تتبع الأسطول GPS',
  'help_desk': 'الدعم الفني',
  'cx_nps': 'تجربة العميل (NPS)',
  'key_accounts': 'الحسابات الكبرى (KAM)',
  'portfolio': 'محفظة المشاريع',
  'marketing_analytics': 'تحليلات التسويق',
  'ai_demand': 'توقع الطلب الذكي',
  'ai_coach': 'مدرب المبيعات الذكي',
  'siem': 'مركز الأمن (SIEM)',
  'backup': 'النسخ الاحتياطي',
  'profit_centers': 'مراكز الربحية',
  'segments': 'القطاعات',
  'copa': 'تحليل الربحية (CO-PA)',
  'copa_rules': 'قواعد توزيع التكاليف',
  'num_seq': 'تسلسل الترقيم',
  'state_machine': 'حالات المستندات',
  'field_audit': 'سجل التعديلات',
  'period_close': 'إغلاق الفترات',
  'wps': 'نظام حماية الأجور (WPS)',
  'bank_recon_auto': 'المطابقة البنكية الآلية',
  'dunning': 'محرك متابعة المديونيات',
  'three_way': 'المطابقة الثلاثية للمشتريات',
  'bpm': 'محرك سير العمل (BPM)',
  'payment_run': 'تشغيل الدفعات المجمعة',
  'ecl': 'خسائر الائتمان المتوقعة (ECL)',
  'std_cost': 'التكاليف المعيارية',
  'subcontracting': 'التصنيع الخارجي',
  'quality_mgmt': 'إدارة الجودة (CAPA/NCR)',
  'multi_book': 'الدفاتر المتعددة (Multi-GAAP)',
  'custom_fields': 'الحقول المخصصة',
  'qiwa_sync': 'ربط قوى (Qiwa)',
  'saudization': 'نسبة السعودة ونطاقات',
  'qiwa_contracts': 'عقود العمل (Qiwa)',
  'nitaqat_sim': 'محاكي نطاقات',
  'pdpl_dsr': 'طلبات أصحاب البيانات (PDPL)',
  'pdpl_breach': 'حوادث الاختراق',
  'vat_categories': 'تصنيفات ضريبية (VAT)',
  'period_lock': 'إقفال الفترات المحاسبية',
  'profit_loss': 'قائمة الدخل (P&L)',
  'vat_return': 'إقرار ضريبة القيمة المضافة',
  'fin_health': 'الصحة المالية (Z-Score)',
  'collection_wf': 'إدارة التحصيل',
  'prepayments_ui': 'المدفوعات المقدمة',
  'interco': 'المعاملات البينية (IC)',
  'wht_form14': 'نموذج 14 استقطاع',
  'mudad_compliance': 'امتثال مداد',
  'zakat_assessment': 'تقييم الزكاة',
  'v3_retail': 'لوحة تحكم التجزئة',
  'v3_restaurant': 'لوحة تحكم المطاعم',
  'v3_mfg': 'لوحة تحكم التصنيع',
  'v3_construction': 'لوحة تحكم المقاولات',
  'v3_clinic': 'لوحة تحكم العيادات',
  'v3_school': 'لوحة تحكم المدارس',
  'v3_realestate': 'لوحة تحكم العقارات',
  'v3_distribution': 'لوحة تحكم التوزيع',
  'v3_services': 'لوحة تحكم الخدمات',
  'v3_retail_pos': 'نقاط البيع المتعددة (POS)',
  'v3_restaurant_kds': 'شاشة المطبخ (KDS)',
  'v3_mfg_mrp': 'محرك التصنيع (MRP)',
  'v3_construction_boq': 'المستخلصات و BOQ',
  'v3_clinic_emr': 'الملف الطبي (EMR)',
  'v3_school_sis': 'نظام الطلاب (SIS)',
  'v3_realestate_leases': 'إدارة العقود والأملاك',
  'v3_distribution_wms': 'إدارة المستودعات (WMS)',
  'v3_services_timesheet': 'ساعات العمل والمصاريف',
  'webhooks': 'ربط Webhooks',
  'credit_check': 'فحص الحد الائتماني',
  'cash_forecast': 'توقع التدفقات النقدية',
  'number_sequences': 'تسلسل الترقيم',
  'cpq': 'تسعير ذكي (CPQ)',
  'rebates': 'برامج الخصم المؤجل',
  'sales_forecast': 'توقع المبيعات',
  'vendor_scorecard': 'تقييم الموردين',
  'aps_scheduler': 'جدولة متقدمة (APS)',
  'project_evm': 'قيمة مكتسبة (EVM)',
  'wave_picking': 'التقاط موجي (WMS)',
  'mes_oee': 'كفاءة المعدات (OEE)',
  'bi_cube': 'تحليلات ذكية (BI)',
  'nlq': 'اسأل النظام (NLQ)',
  'spend_analytics': 'تحليل الإنفاق',
  'service_sla': 'اتفاقيات الخدمة (SLA)',
  'prev_maintenance': 'صيانة وقائية',
  'sso_saml': 'تسجيل موحد (SSO)',
  'aging_report': 'تقادم الديون',
  'kanban_board': 'لوحة كانبان',
  'timesheet': 'سجل الدوام',
  'self_service': 'بوابة الموظف',
  'contracts_mgmt': 'إدارة العقود',
  'vendor_portal_page': 'بوابة الموردين',
  'workflow_builder': 'مصمم سير العمل',
  'print_templates': 'قوالب الطباعة',
  'dashboard_builder': 'لوحة تحكم مخصصة',
  'import_export': 'استيراد / تصدير',
  'dms': 'إدارة المستندات',
  'calendar': 'التقويم',
  'pivot_table': 'جدول محوري',
  'customer360': 'عرض شامل للعميل (360°)',
  'reorder_rules': 'قواعد إعادة الطلب',
  'notifications': 'الإشعارات',
  'expense_reports': 'تقارير المصروفات',
  'org_chart': 'الهيكل التنظيمي',
  'global_search': 'البحث الشامل',
  'chatter': 'التعليقات',
  'deferred_rev': 'الإيرادات المؤجلة',
  'shipping': 'شركات الشحن',
};

const ROLE_PRESETS = [
 {
 name: 'كاشير تجزئة (Retail Cashier)',
 icon: '💻',
 modules: ['dashboard', 'pos', 'sales', 'shifts', 'sales_returns', 'receipt_vouchers']
 },
 {
 name: 'كاشير مطعم (Restaurant Cashier)',
 icon: '🍔',
 modules: ['dashboard', 'restaurant_pos', 'shifts', 'receipt_vouchers']
 },
 {
 name: 'محاسب عام (Accountant)',
 icon: '📊',
 modules: ['dashboard', 'accounting', 'treasury', 'banks', 'treasury_checks', 'receipt_vouchers', 'expenses', 'petty_cash', 'fixed_assets', 'reports', 'purchases', 'sales']
 },
 {
 name: 'مراجع مالي (Auditor)',
 icon: '🕵️',
 modules: ['dashboard', 'reports', 'audit_logs', 'accounting', 'approvals', 'vision_inventory']
 },
 {
 name: 'أمين مستودع (Storekeeper)',
 icon: '📦',
 modules: ['dashboard', 'products', 'stock', 'stock_transfers', 'warehouses', 'wms', 'barcode', 'batches', 'vision_inventory', 'purchase_orders']
 },
 {
 name: 'مسؤول مشتريات (Purchaser)',
 icon: '🛒',
 modules: ['dashboard', 'purchases', 'purchase_orders', 'purchase_returns', 'letters_of_credit', 'products', 'suppliers']
 },
 {
 name: 'مندوب مبيعات (Sales Rep)',
 icon: '🎯',
 modules: ['dashboard', 'sales', 'sales_orders', 'price_quotes', 'customers', 'sales_routes']
 },
 {
 name: 'مدير إنتاج (Manufacturing)',
 icon: '🏭',
 modules: ['dashboard', 'manufacturing', 'mrp', 'maintenance', 'products', 'stock']
 },
 {
 name: 'مسؤول موارد بشرية (HR)',
 icon: '👥',
 modules: ['dashboard', 'employees', 'attendance', 'salaries', 'vacations', 'hr_loans', 'shifts']
 },
 {
 name: 'إدارة علاقات العملاء (CRM)',
 icon: '🤝',
 modules: ['dashboard', 'customers', 'loyalty', 'gift_cards', 'coupons', 'promotions', 'bookings', 'affiliates']
 },
 {
 name: 'مدير أسطول (Fleet Manager)',
 icon: '🚚',
 modules: ['dashboard', 'fleet', 'maintenance', 'employees']
 },
 {
 name: 'إدارة المدارس (School Admin)',
 icon: '🏫',
 modules: ['dashboard', 'schools', 'employees', 'accounting']
 },
 {
 name: 'صلاحيات كاملة (Admin)',
 icon: '👑',
 modules: MODULES_GROUPED.flatMap(g => g.keys)
 }
];

export default function RolesAndPermissionsPage() {
 const { lang } = useTranslation();
 const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
 
 const [users, setUsers] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);
 const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
 const [selectedModules, setSelectedModules] = useState<string[]>([]);
 const toast = useToast();

 useEffect(() => {
 fetchUsers();
 }, []);

 const fetchUsers = async () => {
 try {
 const token = localStorage.getItem('token') || '';
 const res = await fetch('/api/settings/roles', {
 headers: {
 'Authorization': `Bearer ${token}`
 }
 });
 
 if (res.status === 401) {
 window.location.href = '/login';
 return;
 }

 if (res.ok) {
 const data = await res.json();
 setUsers(data);
 if (data.length > 0) {
 selectUser(data[0]);
 }
 } else {
 toast.error(_t('فشل تحميل المستخدمين', 'Failed to load users'));
 }
 } catch (error) {
 toast.error(_t('حدث خطأ', 'Error occurred'));
 } finally {
 setLoading(false);
 }
 };

 const selectUser = (user: any) => {
 setSelectedUserId(user.id);
 const userMods = user.permissions?.map((p: any) => p.module) || [];
 setSelectedModules(userMods);
 };

 const toggleModule = (moduleKey: string) => {
 setSelectedModules(prev => 
 prev.includes(moduleKey) 
 ? prev.filter(m => m !== moduleKey)
 : [...prev, moduleKey]
 );
 };

 const toggleGroup = (groupKeys: string[]) => {
 const allSelected = groupKeys.every(k => selectedModules.includes(k));
 if (allSelected) {
 setSelectedModules(prev => prev.filter(m => !groupKeys.includes(m)));
 } else {
 setSelectedModules(prev => Array.from(new Set([...prev, ...groupKeys])));
 }
 };

 const applyPreset = (presetModules: string[]) => {
 setSelectedModules(presetModules);
 };

 const handleSave = async () => {
 if (!selectedUserId) return;
 setSaving(true);
 try {
 const token = localStorage.getItem('token') || '';
 const res = await fetch('/api/settings/roles', {
 method: 'POST',
 headers: { 
 'Content-Type': 'application/json',
 'Authorization': `Bearer ${token}`
 },
 body: JSON.stringify({ targetUserId: selectedUserId, modules: selectedModules })
 });

 if (res.status === 401) {
 window.location.href = '/login';
 return;
 }

 if (res.ok) {
 toast.success(_t('تم الحفظ بنجاح', 'Saved successfully'));
 // Update local state
 setUsers(users.map(u => u.id === selectedUserId ? { ...u, permissions: selectedModules.map(m => ({ module: m })) } : u));
 } else {
 toast.error(_t('فشل الحفظ', 'Failed to save'));
 }
 } catch (error) {
 toast.error(_t('حدث خطأ', 'Error occurred'));
 } finally {
 setSaving(false);
 }
 };

 if (loading) {
 return (
 <div className="p-6">
 <Skeleton type="rectangular" className="h-12 w-1/3 mb-6" />
 <div className="flex gap-6">
 <Skeleton type="rectangular" className="w-1/4 h-96" />
 <Skeleton type="rectangular" className="w-3/4 h-96" />
 </div>
 </div>
 );
 }

 return (
 <div className="p-6 max-w-7xl mx-auto">
 
 <div className="flex items-center justify-between mb-6">
 <div>
 <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
 <Shield className="w-6 h-6 text-indigo-600" />
 {_t('مصفوفة الصلاحيات (Roles & Permissions)', 'Roles & Permissions')}
 </h1>
 <p className="text-slate-500 mt-1">{_t('حدد الوحدات المسموح بها لكل مستخدم', 'Define allowed modules per user')}</p>
 </div>
 <button 
 onClick={handleSave}
 disabled={saving}
 className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-xl hover:bg-indigo-700 transition-colors shadow-md disabled:opacity-50"
 >
 <Save className="w-5 h-5" />
 {saving ? _t('جاري الحفظ...', 'Saving...') : _t('حفظ التعديلات', 'Save Changes')}
 </button>
 </div>

 <div className="flex flex-col md:flex-row gap-6">
 {/* Users List */}
 <div className="w-full md:w-1/4 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
 <div className="p-4 border-b border-slate-200 bg-slate-50 ">
 <h3 className="font-bold text-slate-700 ">{_t('المستخدمين', 'Users')}</h3>
 </div>
 <div className="overflow-y-auto max-h-[600px] p-2 space-y-1">
 {users.map(user => (
 <button
 key={user.id}
 onClick={() => selectUser(user)}
 className={`w-full text-start px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${selectedUserId === user.id ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 border' : 'hover:bg-slate-50 dark:hover:bg-gray-700 border border-transparent'}`}
 >
 <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedUserId === user.id ? 'bg-indigo-200 text-indigo-700' : 'bg-slate-200 text-slate-600'}`}>
 <User className="w-4 h-4" />
 </div>
 <div>
 <div className="font-semibold text-sm text-slate-800 ">{user.username}</div>
 <div className="text-xs text-slate-500">{user.role}</div>
 </div>
 </button>
 ))}
 </div>
 </div>

 <div className="w-full md:w-3/4 flex flex-col gap-6">
 {/* Presets Section */}
 <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
 <h3 className="font-bold text-slate-700 mb-3">{_t('تطبيق قالب جاهز (Role Templates)', 'Apply Role Template')}</h3>
 <div className="flex flex-wrap gap-3">
 {ROLE_PRESETS.map((preset, idx) => (
 <button
 key={idx}
 onClick={() => applyPreset(preset.modules)}
 className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors text-slate-800 " >
 <span>{preset.icon}</span>
 {preset.name}
 </button>
 ))}
 <button
 onClick={() => applyPreset([])}
 className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors text-red-700 dark:text-red-400"
 >
 🗑️ {_t('إزالة جميع الصلاحيات', 'Clear All')}
 </button>
 </div>
 </div>

 {/* Modules Checklist */}
 <div className="bg-white rounded-xl shadow-sm border border-slate-200 ">
 <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
 <h3 className="font-bold text-slate-700 ">{_t('الوحدات البرمجية المتاحة', 'Available Modules')}</h3>
 <span className="text-sm bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full font-bold">{selectedModules.length} {_t('محددة', 'Selected')}</span>
 </div>
 
 <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[600px] overflow-y-auto">
 {MODULES_GROUPED.map((group, idx) => (
 <div key={idx} className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 ">
 <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200 ">
 <h4 className="font-bold text-sm text-slate-800 ">{group.category}</h4>
 <button 
 onClick={() => toggleGroup(group.keys)}
 className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 font-medium"
 >
 {_t('تحديد الكل', 'Select All')}
 </button>
 </div>
 <div className="space-y-2">
 {group.keys.map(key => {
 const isSelected = selectedModules.includes(key);
 const displayName = MODULE_NAMES[key] || key;
 return (
 <label key={key} className="flex items-center gap-3 p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-slate-200 dark:hover:border-gray-600 w-full">
 <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors shrink-0 ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 '}`}>
 {isSelected && <Check className="w-3 h-3" />}
 </div>
 <span className={`text-sm ${isSelected ? 'text-slate-900 font-medium' : 'text-slate-600 '}`}>
 {displayName}
 </span>
 </label>
 );
 })}
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}
