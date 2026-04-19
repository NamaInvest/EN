'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSettings } from '@/lib/SettingsContext';
import { useClerk } from '@clerk/nextjs';

// ── All 5 language labels ─────────────────────────────────────────────────────
type Lang = 'ar' | 'en' | 'hi' | 'bn' | 'ur';

const LABELS: Record<Lang, Record<string, string>> = {
  ar: {
    's.dashboard': 'الرئيسية',
    's.sales': 'المبيعات',
    's.purchases': 'المشتريات',
    's.inventory': 'المستودعات والجرد',
    's.manufacturing': 'التصنيع والإنتاج',
    's.finance': 'المالية والحسابات',
    's.crm': 'العملاء والتسويق',
    's.hr': 'الموارد البشرية',
    's.enterprise': 'أنظمة متخصصة',
    's.settings': 'الإعدادات',
    'i.dashboard': 'لوحة التحكم', 'i.copilot': 'المساعد الذكي', 'i.cfo': 'المدير المالي الذكي',
    'i.scm': 'المخزون الذكي', 'i.alerts': 'صندوق الوارد والتنبيهات',
    'i.pos': 'شاشة نقطة البيع', 'i.restaurant': 'نقطة بيع المطاعم', 'i.shifts': 'ورديات الكاشير',
    'i.sales_invoices': 'فواتير المبيعات', 'i.sales_history': 'سجل الفواتير',
    'i.sales_quotes': 'عروض الأسعار', 'i.sales_orders': 'أوامر البيع',
    'i.delivery_notes': 'مذكرات التسليم', 'i.sales_returns': 'مرتجعات المبيعات', 'i.sales_options': 'خيارات المبيعات',
    'i.recurring': 'العقود الدورية', 'i.routes': 'خطوط السير', 'i.commissions': 'العمولات والمستهدفات',
    'i.purchase_reqs': 'طلبات الشراء', 'i.rfq': 'عروض أسعار الموردين',
    'i.po': 'أوامر الشراء', 'i.grn': 'سندات الاستلام',
    'i.purchases_options': 'خيارات المشتريات', 'i.manual_purchases': 'فواتير المشتريات اليدوية', 'i.purchases': 'فواتير المشتريات', 'i.purchase_returns': 'مرتجعات المشتريات', 'i.lc': 'الاعتمادات المستندية',
    'i.products': 'الأصناف والخدمات', 'i.stock': 'الأرصدة المخزنية',
    'i.movements': 'حركة الصنف', 'i.transfer': 'نقل المخزون',
    'i.smart_transfer': 'التحويلات الذكية', 'i.adjustments': 'تسويات الجرد',
    'i.warehouses': 'المستودعات', 'i.wms': 'المستودع الذكي',
    'i.barcodes': 'الباركود والملصقات', 'i.batches': 'تواريخ الصلاحية', 'i.serials': 'الأرقام التسلسلية',
    'i.vision': 'جرد الكاميرا الذكي',
    'i.bom': 'معادلات التصنيع', 'i.mrp': 'تخطيط الإنتاج', 'i.qc': 'الفحص المخزني',
    'i.coa': 'شجرة الحسابات', 'i.treasury': 'الخزينة', 'i.banks': 'البنوك',
    'i.checks': 'أوراق القبض والدفع', 'i.vouchers': 'سندات القبض والمصرف',
    'i.expenses': 'المصروفات النثرية', 'i.petty_cash': 'صناديق العهدة',
    'i.fixed_assets': 'الأصول الثابتة', 'i.budgets': 'الموازنات', 'i.installments': 'التقسيط',
    'i.fin_reports': 'التقارير المالية',
    'i.customers': 'قاعدة العملاء', 'i.leads': 'الفرص البيعية', 'i.loyalty': 'نقاط الولاء',
    'i.gift_cards': 'بطاقات الهدايا', 'i.coupons': 'الكوبونات', 'i.promotions': 'العروض',
    'i.employees': 'بيانات الموظفين', 'i.attendance': 'الحضور والانصراف',
    'i.payroll': 'مسيرات الرواتب', 'i.leaves': 'الإجازات', 'i.loans': 'السلف والقروض',
    'i.recruitment': 'التوظيف', 'i.kpi': 'تقييم الأداء',
    'i.training': 'التدريب', 'i.face_id': 'البصمة الذكية',
    'i.projects': 'المشاريع', 'i.property': 'الأملاك والعقارات', 'i.leases': 'عقود الإيجار',
    'i.fleet': 'أسطول النقل', 'i.fleet_trips': 'رحلات الأسطول',
    'i.schools': 'نظام المدارس', 'i.classes': 'الفصول',
    'i.credit': 'الرقابة الائتمانية',
    'i.saas': 'محرك الشركات', 'i.branches': 'الفروع ونقاط البيع',
    'i.currencies': 'العملات', 'i.approvals': 'نظام الموافقات',
    'i.wa': 'الواتساب الآلي', 'i.salla': 'ربط سلة',
    'i.settings': 'إعدادات النظام', 'i.audit': 'سجلات المراقبة', 'i.support': 'الصيانة والدعم',
        'i.ai_bank': 'البنك الذكي',
    'i.fleet_fuel': 'وقود الأودت',
    'i.prop_inst': 'أقساط العقارات',
    'i.bookings': 'الحجوزات والمواعيد',
    'i.book_cal': 'تقويم الحجوزات',
    'i.affiliates': 'التسويق بالعمولة',
    'i.bank_recon': 'مذكرات التسوية البنكية',
    'i.fraud_ai': 'كشف الاحتيال الذكي',
    'i.73mod': 'موسوعة الـ 104 وحدة',
    'i.sys_health': 'حالة النظام',
    'i.mrp_recipes': 'وصفات التصنيع (Recipes)',
    'i.stocktake': 'عمليات الجرد المخزني',
    'i.warehouse_opts': 'خيارات المستودعات',
    'i.company_info': 'معلومات المنشأة',
    's.company_info': '🏢 معلومات المنشأة',
'logout': 'تسجيل الخروج',
  },
  en: {
    's.dashboard': 'Dashboard',
    's.sales': 'Sales & POS',
    's.purchases': 'Purchases',
    's.inventory': 'Inventory & WMS',
    's.manufacturing': 'Manufacturing (MRP)',
    's.finance': 'Finance & Accounting',
    's.crm': 'CRM & Customers',
    's.hr': 'HR & Payroll',
    's.enterprise': 'Enterprise Modules',
    's.settings': 'System Settings',
    'i.company_info': 'Company Info',
    's.company_info': '🏢 Company Info',
    'i.warehouse_opts': 'Warehouse Options',
    'i.dashboard': 'Home Dashboard', 'i.copilot': 'AI Copilot', 'i.cfo': 'AI CFO',
    'i.scm': 'AI SCM', 'i.alerts': 'Inbox & Alerts',
    'i.pos': 'POS Terminal', 'i.restaurant': 'Restaurant POS', 'i.shifts': 'Cashier Shifts',
    'i.sales_invoices': 'Tax Invoices', 'i.sales_history': 'Sales History',
    'i.sales_quotes': 'Sales Quotations', 'i.sales_orders': 'Sales Orders',
    'i.delivery_notes': 'Delivery Notes', 'i.sales_returns': 'Sales Returns', 'i.sales_options': 'Sales Options',
    'i.recurring': 'Recurring Contracts', 'i.routes': 'Sales Routes', 'i.commissions': 'Commissions & Targets',
    'i.purchase_reqs': 'Purchase Requests (PR)', 'i.rfq': 'Supplier RFQ',
    'i.po': 'Purchase Orders (PO)', 'i.grn': 'Goods Receipt (GRN)',
    'i.purchases_options': 'Purchases Options', 'i.manual_purchases': 'Manual Purchase Invoices', 'i.purchases': 'Purchase Invoices', 'i.purchase_returns': 'Purchase Returns', 'i.lc': 'Letters of Credit (LC)',
    'i.products': 'Products & Services', 'i.stock': 'Stock Balances',
    'i.movements': 'Stock Item History', 'i.transfer': 'Internal Stock Transfer',
    'i.smart_transfer': 'Smart Branch Transfers', 'i.adjustments': 'Stock Adjustments',
    'i.warehouses': 'Warehouses Setup', 'i.wms': 'Smart WMS',
    'i.barcodes': 'Barcodes & Labels', 'i.batches': 'Batches & Expiry', 'i.serials': 'Serial Numbers',
    'i.vision': 'AI Stocktake Vision',
    'i.bom': 'Bills of Material (BOM)', 'i.mrp': 'Advanced MRP Planning', 'i.qc': 'Quality Control (QC)',
    'i.coa': 'Chart of Accounts', 'i.treasury': 'Treasury & Funds', 'i.banks': 'Banks & Reconciliation',
    'i.checks': 'Checks & Notes', 'i.vouchers': 'Journal Entries',
    'i.expenses': 'Petty Cash Expenses', 'i.petty_cash': 'Petty Cash Funds',
    'i.fixed_assets': 'Fixed Assets', 'i.budgets': 'Cost Centers & Budgets', 'i.installments': 'Installments',
    'i.fin_reports': 'Financial Reports',
    'i.customers': 'Customers Directory', 'i.leads': 'Leads & Prospects', 'i.loyalty': 'Loyalty Points',
    'i.gift_cards': 'Gift Cards', 'i.coupons': 'Discount Coupons', 'i.promotions': 'Promotions & Offers',
    'i.employees': 'Employee Files', 'i.attendance': 'Standard Attendance',
    'i.payroll': 'Payroll Generation', 'i.leaves': 'Vacations & Leaves', 'i.loans': 'Employee Loans',
    'i.recruitment': 'Recruitment', 'i.kpi': 'Performance Appraisals',
    'i.training': 'Training & Courses', 'i.face_id': 'AI Face Attendance',
    'i.projects': 'Project Management', 'i.property': 'Real Estate Management', 'i.leases': 'Rental Contracts',
    'i.fleet': 'Fleet & Vehicles', 'i.fleet_trips': 'Fleet Trips',
    'i.schools': 'Schools Management', 'i.classes': 'Classes Management',
    'i.credit': 'B2B Credit Control',
    'i.saas': 'SaaS Subscription', 'i.branches': 'Branches & Devices',
    'i.currencies': 'Currencies & Rates', 'i.approvals': 'Approval Workflows',
    'i.wa': 'WhatsApp Hub', 'i.salla': 'Salla Integration',
    'i.settings': 'General Settings', 'i.audit': 'Audit & Logs', 'i.support': 'Maintenance & Support',
        'i.ai_bank': 'AI Bank Reconciliation',
    'i.fleet_fuel': 'Fleet Fuel & Oil',
    'i.prop_inst': 'Property Installments',
    'i.bookings': 'Bookings & Appointments',
    'i.book_cal': 'Booking Calendar',
    'i.affiliates': 'Affiliates Marketing',
    'i.bank_recon': 'Bank Reconciliation',
    'i.fraud_ai': 'AI Fraud Detection',
    'i.73mod': '104-Modules Encyclopedia',
    'i.sys_health': 'System Health',
    'i.mrp_recipes': 'Manufacturing Recipes',
    'i.stocktake': 'Stocktake Operations',
'logout': 'Logout',
  },
  hi: {
    's.company_info': '🏢 कंपनी जानकारी',
    's.dashboard': 'डैशबोर्ड', 's.sales': 'बिक्री और POS', 's.purchases': 'खरीद',
    's.inventory': 'इन्वेंटरी', 's.manufacturing': 'विनिर्माण', 's.finance': 'वित्त और लेखा',
    's.crm': 'ग्राहक और CRM', 's.hr': 'मानव संसाधन', 's.enterprise': 'उद्यम', 's.settings': 'सेटिंग्स',
    'i.dashboard': 'होम डैशबोर्ड', 'i.copilot': 'AI कोपायलट', 'i.cfo': 'AI CFO', 'i.scm': 'AI SCM',
    'i.alerts': 'इनबॉक्स और अलर्ट', 'i.pos': 'POS टर्मिनल', 'i.restaurant': 'रेस्टोरेंट POS',
    'i.shifts': 'कैशियर शिफ्ट', 'i.sales_invoices': 'टैक्स इनवॉइस', 'i.sales_history': 'बिक्री इतिहास',
    'i.sales_quotes': 'बिक्री कोटेशन', 'i.sales_orders': 'बिक्री आदेश',
    'i.delivery_notes': 'डिलीवरी नोट', 'i.sales_returns': 'बिक्री वापसी',
    'i.recurring': 'आवर्ती अनुबंध', 'i.routes': 'बिक्री मार्ग', 'i.commissions': 'कमीशन और लक्ष्य',
    'i.purchase_reqs': 'खरीद अनुरोध', 'i.rfq': 'सप्लायर कोटेशन', 'i.po': 'खरीद आदेश',
    'i.grn': 'माल रसीद', 'i.purchases_options': 'Purchase Options', 'i.manual_purchases': 'Manual Purchases', 'i.purchases': 'खरीद इनवॉइस', 'i.purchase_returns': 'खरीद वापसी',
    'i.lc': 'साख पत्र', 'i.products': 'उत्पाद और सेवाएं', 'i.stock': 'स्टॉक शेष',
    'i.movements': 'स्टॉक इतिहास', 'i.transfer': 'आंतरिक स्थानांतरण',
    'i.smart_transfer': 'स्मार्ट शाखा स्थानांतरण', 'i.adjustments': 'स्टॉक समायोजन',
    'i.warehouses': 'गोदाम', 'i.wms': 'स्मार्ट WMS', 'i.barcodes': 'बारकोड', 'i.batches': 'बैच',
    'i.serials': 'सीरियल नंबर', 'i.vision': 'AI स्टॉक जांच',
    'i.bom': 'सामग्री बिल', 'i.mrp': 'उन्नत MRP', 'i.qc': 'गुणवत्ता नियंत्रण',
    'i.coa': 'खाता चार्ट', 'i.treasury': 'कोषागार', 'i.banks': 'बैंक',
    'i.checks': 'चेक', 'i.vouchers': 'जर्नल एंट्री', 'i.expenses': 'पेटी कैश',
    'i.petty_cash': 'पेटी कैश फंड', 'i.fixed_assets': 'अचल संपत्ति', 'i.budgets': 'बजट',
    'i.installments': 'किश्त', 'i.fin_reports': 'वित्तीय रिपोर्ट',
    'i.customers': 'ग्राहक', 'i.leads': 'लीड', 'i.loyalty': 'वफादारी अंक',
    'i.gift_cards': 'उपहार कार्ड', 'i.coupons': 'कूपन', 'i.promotions': 'प्रचार',
    'i.employees': 'कर्मचारी', 'i.attendance': 'उपस्थिति', 'i.payroll': 'वेतन', 'i.leaves': 'छुट्टी',
    'i.loans': 'ऋण', 'i.recruitment': 'भर्ती', 'i.kpi': 'प्रदर्शन', 'i.training': 'प्रशिक्षण',
    'i.face_id': 'AI चेहरा', 'i.projects': 'परियोजना', 'i.property': 'रियल एस्टेट',
    'i.leases': 'किराया', 'i.fleet': 'बेड़ा', 'i.fleet_trips': 'यात्राएं',
    'i.schools': 'स्कूल', 'i.classes': 'कक्षाएं', 'i.credit': 'क्रेडिट',
    'i.saas': 'SaaS', 'i.branches': 'शाखाएं', 'i.currencies': 'मुद्राएं',
    'i.approvals': 'अनुमोदन', 'i.wa': 'WhatsApp', 'i.salla': 'Salla',
    'i.settings': 'सेटिंग्स', 'i.audit': 'ऑडिट', 'i.support': 'समर्थन',
        'i.ai_bank': 'AI बैंक',
    'i.fleet_fuel': 'बेड़ा ईंधन',
    'i.prop_inst': 'संपत्ति किश्तें',
    'i.bookings': 'बुकिंग और अपॉइंटमेंट',
    'i.book_cal': 'बुकिंग कैलेंडर',
    'i.affiliates': 'सहबद्ध विपणन',
    'i.bank_recon': 'बैंक समाधान',
    'i.fraud_ai': 'AI धोखाधड़ी का पता लगाना',
    'i.73mod': '104-मॉड्यूल विश्वकोश',
    'i.sys_health': 'सिस्टम स्वास्थ्य',
    'i.mrp_recipes': 'विनिर्माण नुस्खे',
    'i.stocktake': 'स्टॉक जांच कार्य',
'logout': 'लॉगआउट',
  },
  bn: {
    's.company_info': '🏢 কোম্পানি তথ্য',
    's.dashboard': 'ড্যাশবোর্ড', 's.sales': 'বিক্রয় এবং POS', 's.purchases': 'ক্রয়',
    's.inventory': 'ইনভেন্টরি', 's.manufacturing': 'উৎপাদন', 's.finance': 'অর্থ ও হিসাব',
    's.crm': 'গ্রাহক এবং CRM', 's.hr': 'মানব সম্পদ', 's.enterprise': 'এন্টারপ্রাইজ', 's.settings': 'সেটিংস',
    'i.dashboard': 'হোম ড্যাশবোর্ড', 'i.copilot': 'AI কোপাইলট', 'i.cfo': 'AI CFO', 'i.scm': 'AI SCM',
    'i.alerts': 'ইনবক্স', 'i.pos': 'POS টার্মিনাল', 'i.restaurant': 'রেস্টুরেন্ট POS',
    'i.shifts': 'শিফট', 'i.sales_invoices': 'ট্যাক্স ইনভয়েস', 'i.sales_history': 'বিক্রয় ইতিহাস',
    'i.sales_quotes': 'কোটেশন', 'i.sales_orders': 'বিক্রয় আদেশ',
    'i.delivery_notes': 'ডেলিভারি নোট', 'i.sales_returns': 'বিক্রয় ফেরত',
    'i.recurring': 'চুক্তি', 'i.routes': 'রুট', 'i.commissions': 'কমিশন',
    'i.purchase_reqs': 'ক্রয় অনুরোধ', 'i.rfq': 'কোটেশন', 'i.po': 'ক্রয় আদেশ',
    'i.grn': 'পণ্য রসিদ', 'i.purchases_options': 'Purchase Options', 'i.manual_purchases': 'Manual Purchases', 'i.purchases': 'ক্রয় ইনভয়েস', 'i.purchase_returns': 'ক্রয় ফেরত',
    'i.lc': 'ঋণপত্র', 'i.products': 'পণ্য', 'i.stock': 'স্টক',
    'i.movements': 'স্টক ইতিহাস', 'i.transfer': 'স্থানান্তর',
    'i.smart_transfer': 'স্মার্ট স্থানান্তর', 'i.adjustments': 'সমন্বয়',
    'i.warehouses': 'গুদাম', 'i.wms': 'WMS', 'i.barcodes': 'বারকোড', 'i.batches': 'ব্যাচ',
    'i.serials': 'সিরিয়াল', 'i.vision': 'AI স্টকটেক',
    'i.bom': 'BOM', 'i.mrp': 'MRP', 'i.qc': 'মান নিয়ন্ত্রণ',
    'i.coa': 'হিসাব', 'i.treasury': 'কোষাগার', 'i.banks': 'ব্যাংক',
    'i.checks': 'চেক', 'i.vouchers': 'ভাউচার', 'i.expenses': 'খরচ',
    'i.petty_cash': 'পেটি ক্যাশ', 'i.fixed_assets': 'সম্পদ', 'i.budgets': 'বাজেট',
    'i.installments': 'কিস্তি', 'i.fin_reports': 'আর্থিক রিপোর্ট',
    'i.customers': 'গ্রাহক', 'i.leads': 'লিড', 'i.loyalty': 'আনুগত্য',
    'i.gift_cards': 'গিফট কার্ড', 'i.coupons': 'কুপন', 'i.promotions': 'প্রচার',
    'i.employees': 'কর্মচারী', 'i.attendance': 'উপস্থিতি', 'i.payroll': 'বেতন', 'i.leaves': 'ছুটি',
    'i.loans': 'ঋণ', 'i.recruitment': 'নিয়োগ', 'i.kpi': 'KPI', 'i.training': 'প্রশিক্ষণ',
    'i.face_id': 'AI হাজিরা', 'i.projects': 'প্রকল্প', 'i.property': 'রিয়েল এস্টেট',
    'i.leases': 'ভাড়া', 'i.fleet': 'বহর', 'i.fleet_trips': 'ভ্রমণ',
    'i.schools': 'স্কুল', 'i.classes': 'শ্রেণি', 'i.credit': 'ক্রেডিট',
    'i.saas': 'SaaS', 'i.branches': 'শাখা', 'i.currencies': 'মুদ্রা',
    'i.approvals': 'অনুমোদন', 'i.wa': 'WhatsApp', 'i.salla': 'Salla',
    'i.settings': 'সেটিংস', 'i.audit': 'অডিট', 'i.support': 'সহায়তা',
        'i.ai_bank': 'AI ব্যাংক',
    'i.fleet_fuel': 'বহর জ্বালানী',
    'i.prop_inst': 'সম্পত্তি কিস্তি',
    'i.bookings': 'বুকিং এবং অ্যাপয়েন্টমেন্ট',
    'i.book_cal': 'বুকিং ক্যালেন্ডার',
    'i.affiliates': 'অ্যাফিলিয়েট মার্কেটিং',
    'i.bank_recon': 'ব্যাংক সমন্বয়',
    'i.fraud_ai': 'AI জালিয়াতি সনাক্তকরণ',
    'i.73mod': '104-মডিউল এনসাইক্লোপিডিয়া',
    'i.sys_health': 'সিস্টেম স্বাস্থ্য',
    'i.mrp_recipes': 'উত্পাদন রেসিপি',
    'i.stocktake': 'স্টকটেক অপারেশন',
'logout': 'লগআউট',
  },
  ur: {
    's.company_info': '🏢 کمپنی کی معلومات',
    's.dashboard': 'ڈیش بورڈ', 's.sales': 'فروخت اور POS', 's.purchases': 'خریداری',
    's.inventory': 'انوینٹری', 's.manufacturing': 'مینوفیکچرنگ', 's.finance': 'مالیات',
    's.crm': 'کسٹمرز اور CRM', 's.hr': 'انسانی وسائل', 's.enterprise': 'انٹرپرائز', 's.settings': 'ترتیبات',
    'i.dashboard': 'ہوم ڈیش بورڈ', 'i.copilot': 'AI کوپائلٹ', 'i.cfo': 'AI CFO', 'i.scm': 'AI SCM',
    'i.alerts': 'ان باکس', 'i.pos': 'POS ٹرمینل', 'i.restaurant': 'ریستوران POS',
    'i.shifts': 'شفٹس', 'i.sales_invoices': 'ٹیکس انوائس', 'i.sales_history': 'فروخت کی تاریخ',
    'i.sales_quotes': 'کوٹیشن', 'i.sales_orders': 'فروخت آرڈرز',
    'i.delivery_notes': 'ڈیلیوری نوٹس', 'i.sales_returns': 'فروخت واپسی',
    'i.recurring': 'کنٹریکٹس', 'i.routes': 'راستے', 'i.commissions': 'کمیشن',
    'i.purchase_reqs': 'خریداری درخواستیں', 'i.rfq': 'کوٹیشن', 'i.po': 'خریداری آرڈرز',
    'i.grn': 'مال رسید', 'i.purchases_options': 'Purchase Options', 'i.manual_purchases': 'Manual Purchases', 'i.purchases': 'خریداری انوائس', 'i.purchase_returns': 'خریداری واپسی',
    'i.lc': 'اعتماد نامہ', 'i.products': 'مصنوعات', 'i.stock': 'اسٹاک',
    'i.movements': 'اسٹاک تاریخ', 'i.transfer': 'منتقلی',
    'i.smart_transfer': 'سمارٹ منتقلی', 'i.adjustments': 'ایڈجسٹمنٹ',
    'i.warehouses': 'گودام', 'i.wms': 'WMS', 'i.barcodes': 'بارکوڈ', 'i.batches': 'بیچ',
    'i.serials': 'سیریل', 'i.vision': 'AI اسٹاک',
    'i.bom': 'BOM', 'i.mrp': 'MRP', 'i.qc': 'کوالٹی',
    'i.coa': 'اکاؤنٹس', 'i.treasury': 'خزانہ', 'i.banks': 'بینک',
    'i.checks': 'چیک', 'i.vouchers': 'ووچر', 'i.expenses': 'اخراجات',
    'i.petty_cash': 'پیٹی کیش', 'i.fixed_assets': 'اثاثے', 'i.budgets': 'بجٹ',
    'i.installments': 'قسط', 'i.fin_reports': 'مالی رپورٹیں',
    'i.customers': 'کسٹمرز', 'i.leads': 'لیڈز', 'i.loyalty': 'وفاداری',
    'i.gift_cards': 'گفٹ کارڈز', 'i.coupons': 'کوپن', 'i.promotions': 'پروموشن',
    'i.employees': 'ملازمین', 'i.attendance': 'حاضری', 'i.payroll': 'تنخواہ', 'i.leaves': 'چھٹیاں',
    'i.loans': 'قرض', 'i.recruitment': 'بھرتی', 'i.kpi': 'KPI', 'i.training': 'تربیت',
    'i.face_id': 'AI حاضری', 'i.projects': 'پروجیکٹ', 'i.property': 'رئیل اسٹیٹ',
    'i.leases': 'کرایہ', 'i.fleet': 'بیڑہ', 'i.fleet_trips': 'سفر',
    'i.schools': 'اسکول', 'i.classes': 'کلاسز', 'i.credit': 'کریڈٹ',
    'i.saas': 'SaaS', 'i.branches': 'شاخیں', 'i.currencies': 'کرنسی',
    'i.approvals': 'منظوری', 'i.wa': 'WhatsApp', 'i.salla': 'Salla',
    'i.settings': 'ترتیبات', 'i.audit': 'آڈٹ', 'i.support': 'مدد',
        'i.ai_bank': 'AI بینک',
    'i.fleet_fuel': 'فلیٹ فیول',
    'i.prop_inst': 'جائیداد کی اقساط',
    'i.bookings': 'بکنگز',
    'i.book_cal': 'بکنگ کیلنڈر',
    'i.affiliates': 'ملحقہ مارکیٹنگ',
    'i.bank_recon': 'بینک مفاہمت',
    'i.fraud_ai': 'AI فراڈ کا پتہ لگانا',
    'i.73mod': '104-ماڈیولز انسائیکلوپیڈیا',
    'i.sys_health': 'سسٹم کی صحت',
    'i.mrp_recipes': 'مینوفیکچرنگ ترکیبیں',
    'i.stocktake': 'اسٹاک ٹیک آپریشنز',
'logout': 'لاگ آؤٹ',
  },
};

function gl(lang: string, key: string): string {
  return (LABELS as any)[lang]?.[key] || LABELS['ar']?.[key] || key;
}

// ── Menu items ────────────────────────────────────────────────────────────────
const menuItems = [
  { sk: 's.dashboard', items: [
    { icon: '📊', lk: 'i.dashboard', href: '/dashboard', module: 'dashboard' },
    { icon: '🏦', lk: 'i.ai_bank', href: '/ai-bank', module: 'ai_bank' },
    { icon: '🤖', lk: 'i.copilot', href: '/ai-copilot', module: 'ai_copilot' },
    { icon: '🧠', lk: 'i.cfo', href: '/ai-cfo', module: 'ai_cfo' },
    { icon: '📦', lk: 'i.scm', href: '/ai-scm', module: 'ai_scm' },
    { icon: '🔔', lk: 'i.alerts', href: '/sys/alerts', module: 'dashboard' },
  ]},
  { sk: 's.sales', items: [
    { icon: '💻', lk: 'i.pos', href: '/pos', module: 'pos' },
    { icon: '🍔', lk: 'i.restaurant', href: '/restaurant-pos', module: 'restaurant_pos' },
    { icon: '🕒', lk: 'i.shifts', href: '/shifts', module: 'shifts' },
    { icon: '🧾', lk: 'i.sales_invoices', href: '/sales', module: 'sales' },
    { icon: '🗂️', lk: 'i.sales_history', href: '/sales/history', module: 'sales' },
    { icon: '📄', lk: 'i.sales_quotes', href: '/price-quotes', module: 'price_quotes' },
    { icon: '📦', lk: 'i.sales_orders', href: '/sales/orders', module: 'sales_orders' },
    { icon: '🚚', lk: 'i.delivery_notes', href: '/sales/delivery-notes', module: 'sales_orders' },
    { icon: '↩️', lk: 'i.sales_returns', href: '/sales-returns', module: 'sales_returns' },
    { icon: '🔄', lk: 'i.recurring', href: '/recurring-invoices', module: 'sales_orders' },
    { icon: '🗺️', lk: 'i.routes', href: '/sales/routes', module: 'sales_routes' },
    { icon: '🎯', lk: 'i.commissions', href: '/sales/targets', module: 'sales_targets' },
    { icon: '⚙️', lk: 'i.sales_options', href: '/sales/options?v=1', module: 'sales' },
  ]},
  { sk: 's.purchases', items: [
    { icon: '⚙️', lk: 'i.purchases_options', href: '/purchases/options', module: 'purchases' },
    { icon: '📝', lk: 'i.purchase_reqs', href: '/purchases/requisitions', module: 'purchase_orders' },
    { icon: '📩', lk: 'i.rfq', href: '/purchases/rfq', module: 'purchase_orders' },
    { icon: '📋', lk: 'i.po', href: '/purchase-orders', module: 'purchase_orders' },
    { icon: '📥', lk: 'i.grn', href: '/purchases/grn', module: 'purchases' },
    { icon: '🛒', lk: 'i.purchases', href: '/purchases', module: 'purchases' },
    { icon: '↩️', lk: 'i.purchase_returns', href: '/purchase-returns', module: 'purchase_returns' },
    { icon: '🌍', lk: 'i.lc', href: '/purchases/letters-of-credit', module: 'letters_of_credit' },
    { icon: '📊', lk: 'i.manual_purchases', href: '/reports/manual-purchases', module: 'purchases' },
  ]},
  { sk: 's.inventory', items: [
    { icon: '📦', lk: 'i.products', href: '/products', module: 'products' },
    { icon: '🏭', lk: 'i.stock', href: '/stock', module: 'stock' },
    { icon: '⌚', lk: 'i.movements', href: '/stock/movements', module: 'stock_transfers' },
    { icon: '🔀', lk: 'i.transfer', href: '/stock-transfers', module: 'stock_transfers' },
    { icon: '🚚', lk: 'i.smart_transfer', href: '/smart-transfers', module: 'stock_transfers' },
    { icon: '⚖️', lk: 'i.adjustments', href: '/stock/adjustments', module: 'stock_transfers' },
    { icon: '🏢', lk: 'i.warehouses', href: '/warehouses', module: 'warehouses' },
    { icon: '📐', lk: 'i.wms', href: '/enterprise/wms', module: 'wms' },
    { icon: '🏷️', lk: 'i.barcodes', href: '/barcode', module: 'barcode' },
    { icon: '⏱️', lk: 'i.batches', href: '/batches', module: 'batches' },
    { icon: '🔢', lk: 'i.serials', href: '/inv/serials', module: 'stock' },
    { icon: '📸', lk: 'i.vision', href: '/stocktake/vision', module: 'vision_inventory' },
    { icon: '📋', lk: 'i.stocktake', href: '/stocktake', module: 'stock' },
    { icon: '⚙️', lk: 'i.warehouse_opts', href: '/warehouses/options', module: 'warehouses' },
  ]},
  { sk: 's.manufacturing', items: [
    { icon: '🛠️', lk: 'i.bom', href: '/manufacturing', module: 'manufacturing' },
    { icon: '🏭', lk: 'i.mrp', href: '/enterprise/mrp', module: 'mrp' },
    { icon: '📚', lk: 'i.mrp_recipes', href: '/enterprise/mrp/recipes', module: 'mrp' },
    { icon: '🔎', lk: 'i.qc', href: '/enterprise/quality', module: 'mrp' },
  ]},
  { sk: 's.finance', items: [
    { icon: '📊', lk: 'i.coa', href: '/accounting', module: 'accounting' },
    { icon: '💰', lk: 'i.treasury', href: '/treasury', module: 'treasury' },
    { icon: '🏦', lk: 'i.banks', href: '/accounting/banks', module: 'banks' },
    { icon: '🏦', lk: 'i.checks', href: '/treasury/checks', module: 'treasury_checks' },
    { icon: '🧾', lk: 'i.vouchers', href: '/receipt-vouchers', module: 'receipt_vouchers' },
    { icon: '💸', lk: 'i.expenses', href: '/expenses', module: 'expenses' },
    { icon: '💼', lk: 'i.petty_cash', href: '/fng/petty-cash-funds', module: 'petty_cash' },
    { icon: '🏢', lk: 'i.fixed_assets', href: '/fixed-assets', module: 'fixed_assets' },
    { icon: '⚖️', lk: 'i.budgets', href: '/fng/budgets', module: 'accounting' },
    { icon: '📑', lk: 'i.installments', href: '/installments', module: 'installments' },
    { icon: '📈', lk: 'i.fin_reports', href: '/reports', module: 'reports' },
    { icon: '📚', lk: 'i.73mod', href: '/reports/104-modules', module: 'reports' },
    { icon: '🕵️', lk: 'i.fraud_ai', href: '/reports/fraud-ai', module: 'reports' },
    { icon: '🔄', lk: 'i.bank_recon', href: '/treasury/bank-reconciliation', module: 'treasury' },
  ]},
  { sk: 's.crm', items: [
    { icon: '👥', lk: 'i.customers', href: '/customers', module: 'customers' },
    { icon: '📈', lk: 'i.leads', href: '/crm/leads', module: 'customers' },
    { icon: '🎁', lk: 'i.loyalty', href: '/loyalty', module: 'loyalty' },
    { icon: '💳', lk: 'i.gift_cards', href: '/gift-cards', module: 'gift_cards' },
    { icon: '🎟️', lk: 'i.coupons', href: '/coupons', module: 'coupons' },
    { icon: '🎯', lk: 'i.promotions', href: '/promotions', module: 'promotions' },
    { icon: '📅', lk: 'i.bookings', href: '/bookings', module: 'bookings' },
    { icon: '📆', lk: 'i.book_cal', href: '/bookings/calendar', module: 'bookings' },
    { icon: '🤝', lk: 'i.affiliates', href: '/affiliates', module: 'affiliates' },
  ]},
  { sk: 's.hr', items: [
    { icon: '👨‍💼', lk: 'i.employees', href: '/employees', module: 'employees' },
    { icon: '🕐', lk: 'i.attendance', href: '/attendance', module: 'attendance' },
    { icon: '💵', lk: 'i.payroll', href: '/salaries', module: 'salaries' },
    { icon: '🏖️', lk: 'i.leaves', href: '/vacations', module: 'vacations' },
    { icon: '💼', lk: 'i.loans', href: '/hr/loans', module: 'hr_loans' },
    { icon: '👔', lk: 'i.recruitment', href: '/hr/jobs', module: 'employees' },
    { icon: '📊', lk: 'i.kpi', href: '/hr/evaluations', module: 'employees' },
    { icon: '🎓', lk: 'i.training', href: '/hr/training', module: 'employees' },
    { icon: '👁️', lk: 'i.face_id', href: '/hr/ai-enrollment', module: 'employees' },
  ]},
  { sk: 's.enterprise', items: [
    { icon: '🏗️', lk: 'i.projects', href: '/enterprise/projects', module: 'projects' },
    { icon: '🏢', lk: 'i.property', href: '/enterprise/property', module: 'legal' },
    { icon: '📝', lk: 'i.leases', href: '/rem/leases', module: 'legal' },
    { icon: '💵', lk: 'i.prop_inst', href: '/rem/installments', module: 'legal' },
    { icon: '🚚', lk: 'i.fleet', href: '/enterprise/fleet', module: 'legal' },
    { icon: '⛽', lk: 'i.fleet_fuel', href: '/fleet/fuel', module: 'legal' },
    { icon: '🛣️', lk: 'i.fleet_trips', href: '/fleet/trips', module: 'legal' },
    { icon: '🏫', lk: 'i.schools', href: '/shl/students', module: 'schools' },
    { icon: '📚', lk: 'i.classes', href: '/shl/classes', module: 'schools' },
    { icon: '⚖️', lk: 'i.credit', href: '/enterprise/legal', module: 'legal' },
  ]},
  { sk: 's.company_info', items: [
    { icon: '🏢', lk: 'i.company_info', href: '/settings/company', module: 'settings' },
  ]},
  { sk: 's.settings', items: [
    { icon: '🌐', lk: 'i.saas', href: '/ice', module: 'master-panel' },
    { icon: '🏢', lk: 'i.branches', href: '/branches', module: 'branches' },
    { icon: '💱', lk: 'i.currencies', href: '/settings/currencies', module: 'currencies' },
    { icon: '✅', lk: 'i.approvals', href: '/settings/approvals', module: 'approvals' },
    { icon: '💬', lk: 'i.wa', href: '/whatsapp-hub', module: 'whatsapp' },
    { icon: '🛒', lk: 'i.salla', href: '/settings#salla', module: 'salla' },
    { icon: '⚙️', lk: 'i.settings', href: '/settings', module: 'settings' },
    { icon: '🛡️', lk: 'i.audit', href: '/audit-logs', module: 'audit_logs' },
    { icon: '🔧', lk: 'i.support', href: '/maintenance', module: 'maintenance' },
    { icon: '💓', lk: 'i.sys_health', href: '/sys/health', module: 'maintenance' },
  ]},
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const { getSetting } = useSettings();
  const companyName = getSetting('company_name', 'Nama Invest ERP');

  // Manage language locally - reads from localStorage, no SSR risk
  const [lang, setLangLocal] = useState<Lang>('ar');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = (localStorage.getItem('app_lang') || 'ar') as Lang;
    setLangLocal(saved);
    // Listen for language changes (same-tab via custom event)
    const onLangChange = () => {
      const l = (localStorage.getItem('app_lang') || 'ar') as Lang;
      setLangLocal(l);
    };
    window.addEventListener('langchange', onLangChange);
    // Listen for cross-tab changes
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'app_lang' && e.newValue) setLangLocal(e.newValue as Lang);
    };
    window.addEventListener('storage', onStorage);
    setMounted(true);
    return () => {
      window.removeEventListener('langchange', onLangChange);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleResize = () => { if (window.innerWidth > 768) setIsOpen(false); };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isOpen) { document.body.style.overflow = 'hidden'; }
    else { document.body.style.overflow = ''; }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const { signOut } = useClerk();

  const handleLogout = async () => {
    // مسح بيانات الجلسة المحلية
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('lastActivity');
    // Determine redirect: subdomain → /login, main site → /sign-in
    const host = window.location.hostname;
    const isSubdomain = host !== 'namainvist.com' && host !== 'www.namainvist.com' && host.endsWith('.namainvist.com');
    const redirectUrl = isSubdomain ? `${window.location.origin}/login` : 'https://namainvist.com/sign-in';
    try {
      await signOut({ redirectUrl });
    } catch {
      // Clerk signOut fails if user has no Clerk session (ERP-only login)
      window.location.href = redirectUrl;
    }
  };

  const [loggedUser, setLoggedUser] = useState<{ fullName: string; role: string }>({ fullName: '', role: '' });
  const [userModules, setUserModules] = useState<string[]>([]);
  const [hiddenModules, setHiddenModules] = useState<string[]>([]);
  const [permLoaded, setPermLoaded] = useState(false);
  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      if (u.fullName) setLoggedUser({ fullName: u.fullName, role: u.role || 'admin' });
      if (u.permissions && Array.isArray(u.permissions)) {
        setUserModules(u.permissions.map((p: { module: string }) => p.module));
      }
    } catch { }
    // Fetch hidden_modules from ICE settings
    fetch('/api/tenant/hidden-modules')
      .then(r => r.json())
      .then(d => { if (d.hiddenModules) setHiddenModules(d.hiddenModules); })
      .catch(() => {})
      .finally(() => setPermLoaded(true));
  }, []);

  const isRTL = lang === 'ar' || lang === 'ur';

  const MODULE_MAP: Record<string, string[]> = {
    // ── الموارد البشرية ──────────────────────────
    HR: ['employees', 'attendance', 'salaries', 'vacations', 'hr_loans'],
    // ── نقطة البيع ──────────────────────────────
    POS: ['pos', 'restaurant_pos', 'shifts'],
    // ── المشتريات ───────────────────────────────
    Purchases: ['purchases', 'purchase_orders', 'purchase_returns', 'letters_of_credit'],
    // ── التصنيع ─────────────────────────────────
    Manufacturing: ['manufacturing', 'mrp'],
    // ── التقارير ────────────────────────────────
    Reports: ['reports'],
    // ── المبيعات (بدون POS) ──────────────────────
    Sales: ['sales', 'price_quotes', 'sales_orders', 'sales_returns', 'sales_routes', 'sales_targets'],
    // ── المخزون والمستودعات ──────────────────────
    Inventory: ['products', 'stock', 'stock_transfers', 'warehouses', 'wms', 'barcode', 'batches', 'vision_inventory'],
    // ── المالية والحسابات ────────────────────────
    Finance: ['accounting', 'treasury', 'banks', 'treasury_checks', 'receipt_vouchers', 'expenses', 'petty_cash', 'fixed_assets', 'installments'],
    // ── العملاء والتسويق ────────────────────────
    CRM: ['customers', 'loyalty', 'gift_cards', 'coupons', 'promotions', 'bookings', 'affiliates'],
    // ── الأنظمة المتخصصة ────────────────────────
    Enterprise: ['projects', 'legal', 'schools'],
    // ── الذكاء الاصطناعي ────────────────────────
    AI: ['ai_bank', 'ai_copilot', 'ai_cfo', 'ai_scm'],
    // ── الإعدادات ───────────────────────────────
    Settings: ['branches', 'currencies', 'approvals', 'whatsapp', 'salla', 'settings', 'audit_logs', 'maintenance'],
  };

  // ── خريطة الأقسام الفرعية (ICE sub-section → sidebar modules) ────────────
  const SUBMODULE_MAP: Record<string, string[]> = {
    // المبيعات
    'Sales.Invoices':        ['sales'],
    'Sales.Quotes':          ['price_quotes'],
    'Sales.Returns':         ['sales_returns'],
    // نقطة البيع
    'POS.Main':              ['pos'],
    'POS.Restaurants':       ['restaurant_pos'],
    'POS.Shifts':            ['shifts'],
    // المشتريات
    'Purchases.Invoices':    ['purchases'],
    'Purchases.Orders':      ['purchase_orders'],
    'Purchases.Returns':     ['purchase_returns'],
    // المخزون
    'Inventory.Products':    ['products'],
    'Inventory.Warehouses':  ['warehouses', 'wms'],
    'Inventory.Stocktaking': ['stock', 'stock_transfers', 'vision_inventory'],
    'Inventory.Barcode':     ['barcode', 'batches'],
    // المالية
    'Finance.Accounting':    ['accounting'],
    'Finance.Treasury':      ['treasury', 'banks', 'treasury_checks', 'receipt_vouchers', 'expenses', 'petty_cash'],
    'Finance.Assets':        ['fixed_assets', 'installments'],
    // الموارد البشرية
    'HR.Employees':          ['employees'],
    'HR.Payroll':            ['salaries'],
    'HR.Attendance':         ['attendance'],
    'HR.Leaves':             ['vacations', 'hr_loans'],
    // التصنيع
    'Manufacturing.BOM':     ['manufacturing'],
    'Manufacturing.MRP':     ['mrp'],
    'Manufacturing.Quality': ['mrp'],
    // العملاء والتسويق
    'CRM.Customers':         ['customers'],
    'CRM.Loyalty':           ['loyalty', 'gift_cards'],
    'CRM.Coupons':           ['coupons', 'promotions'],
    'CRM.Bookings':          ['bookings', 'affiliates'],
    // الأنظمة المتخصصة
    'Enterprise.Projects':   ['projects'],
    'Enterprise.RealEstate': ['legal'],
    'Enterprise.Fleet':      ['legal'],
    'Enterprise.Schools':    ['schools'],
    // الذكاء الاصطناعي
    'AI.Copilot':            ['ai_copilot'],
    'AI.CFO':                ['ai_cfo'],
    'AI.SCM':                ['ai_scm'],
    // التقارير
    'Reports.Sales':         ['reports'],
    'Reports.Finance':       ['reports'],
    'Reports.Inventory':     ['reports'],
    // الإعدادات
    'Settings.Branches':     ['branches'],
    'Settings.Currencies':   ['currencies'],
    'Settings.Approvals':    ['approvals'],
    'Settings.WhatsApp':     ['whatsapp', 'salla'],
  };

  const filteredMenu = !permLoaded ? [] : menuItems.map(group => ({
    ...group,
    items: group.items.filter(item => {
      const mod = item.module || '';
      if (mod === 'login') return true;
      // لوحة القيادة والذكاء الاصطناعي — فقط مالك/admin/مدير نظام
      const ADMIN_ONLY_MODULES = ['dashboard', 'ai_bank', 'ai_copilot', 'ai_cfo', 'ai_scm'];
      if (ADMIN_ONLY_MODULES.includes(mod)) {
        return ['admin', 'owner', 'system_admin'].includes(loggedUser.role);
      }
      if (mod === 'master-panel') return loggedUser.role === 'owner';
      if (['admin', 'owner', 'system_admin'].includes(loggedUser.role)) {
        // 1️⃣ تحقق من إخفاء الوحدة الرئيسية بالكامل
        const moduleKey = Object.entries(MODULE_MAP).find(([, mods]) => (mods as string[]).includes(mod))?.[0];
        if (moduleKey && hiddenModules.includes(moduleKey)) return false;

        // 2️⃣ تحقق من إخفاء قسم فرعي محدد
        const isHiddenBySub = Object.entries(SUBMODULE_MAP).some(
          ([subKey, mods]) => hiddenModules.includes(subKey) && (mods as string[]).includes(mod)
        );
        if (isHiddenBySub) return false;

        return true;
      }
      return userModules.includes(mod);
    }),
  })).filter(group => group.items.length > 0);


  if (!mounted) return <aside className="sidebar" style={{ width: '250px' }}></aside>;

  return (
    <>
      <button
        className="mobile-menu-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Menu"
      >
        {isOpen ? '✕' : '☰'}
      </button>

      {isOpen && (
        <div className="sidebar-overlay" onClick={() => setIsOpen(false)} />
      )}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🏢</div>
          <div className="sidebar-logo-text" style={{ flex: 1 }}>{companyName}</div>
          <button
            className="mobile-close-btn"
            onClick={() => setIsOpen(false)}
            style={{
              display: 'none',
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 10px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >✕</button>
        </div>

        <nav className="sidebar-nav" style={{ padding: '10px 0' }}>
          {filteredMenu.map((group, gIdx) => {
            const isDashboard = group.sk === 's.dashboard';
            const isExpanded = expandedGroup === group.sk || (expandedGroup === null && isDashboard);

            return (
              <div key={gIdx} style={{ marginBottom: '4px' }}>
                <button
                  onClick={() => setExpandedGroup(isExpanded ? null : group.sk)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: isExpanded ? 'var(--bg-card-hover)' : 'transparent',
                    border: 'none',
                    padding: '12px 16px',
                    cursor: 'pointer',
                    color: isExpanded ? 'var(--primary-light)' : 'var(--text-muted)',
                    textAlign: isRTL ? 'right' : 'left',
                    transition: 'all 0.2s ease',
                    borderRadius: 'var(--radius-sm)'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                  onMouseOut={(e) => e.currentTarget.style.background = isExpanded ? 'var(--bg-card-hover)' : 'transparent'}
                >
                  <span style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '0.02em' }}>
                    {gl(lang, group.sk)}
                  </span>
                  <span style={{
                    fontSize: '14px',
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}>▼</span>
                </button>

                <div style={{
                  overflow: 'hidden',
                  transition: 'max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease',
                  maxHeight: isExpanded ? '1200px' : '0',
                  opacity: isExpanded ? 1 : 0,
                  margin: isExpanded ? '4px 0 12px 0' : '0'
                }}>
                  {group.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '9px 20px',
                        color: pathname === item.href ? 'var(--primary-light)' : 'var(--text-secondary)',
                        textDecoration: 'none',
                        background: pathname === item.href ? 'rgba(var(--primary-rgb, 79,70,229),0.12)' : 'transparent',
                        borderRadius: 'var(--radius-sm)',
                        margin: '1px 8px',
                        fontSize: '18px',
                        fontWeight: pathname === item.href ? 600 : 400,
                        transition: 'all 0.15s ease',
                        direction: isRTL ? 'rtl' : 'ltr',
                      }}
                      onMouseOver={(e) => {
                        if (pathname !== item.href) e.currentTarget.style.background = 'var(--bg-card-hover)';
                      }}
                      onMouseOut={(e) => {
                        if (pathname !== item.href) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <span style={{ fontSize: '20px', flexShrink: 0 }}>{item.icon}</span>
                      <span style={{ fontSize: '18px', lineHeight: '1.4' }}>{gl(lang, item.lk)}</span>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--border-subtle)',
          marginTop: 'auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '50%',
              background: 'var(--primary)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '18px', fontWeight: 700, color: 'white',
              flexShrink: 0
            }}>
              {(loggedUser.fullName || 'U')[0].toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-primary)', truncate: true } as any}>
                {loggedUser.fullName || '...'}
              </div>
              <div style={{ fontSize: '15px', color: 'var(--text-muted)' }}>
                {loggedUser.role}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%', padding: '8px', background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-sm)',
              color: '#ef4444', cursor: 'pointer', fontSize: '17px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.2)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
          >
            🚪 {gl(lang, 'logout')}
          </button>
        </div>
      </aside>
    </>
  );
}
