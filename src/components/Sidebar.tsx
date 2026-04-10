'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSettings } from '@/lib/SettingsContext';

// â”€â”€ All 5 language labels â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
type Lang = 'ar' | 'en' | 'hi' | 'bn' | 'ur';

const LABELS: Record<Lang, Record<string, string>> = {
  ar: {
    's.dashboard': 'ط§ظ„ط±ط¦ظٹط³ظٹط©',
    's.sales': 'ط§ظ„ظ…ط¨ظٹط¹ط§طھ',
    's.purchases': 'ط§ظ„ظ…ط´طھط±ظٹط§طھ',
    's.inventory': 'ط§ظ„ظ…ط³طھظˆط¯ط¹ط§طھ ظˆط§ظ„ط¬ط±ط¯',
    's.manufacturing': 'ط§ظ„طھطµظ†ظٹط¹ ظˆط§ظ„ط¥ظ†طھط§ط¬',
    's.finance': 'ط§ظ„ظ…ط§ظ„ظٹط© ظˆط§ظ„ط­ط³ط§ط¨ط§طھ',
    's.crm': 'ط§ظ„ط¹ظ…ظ„ط§ط، ظˆط§ظ„طھط³ظˆظٹظ‚',
    's.hr': 'ط§ظ„ظ…ظˆط§ط±ط¯ ط§ظ„ط¨ط´ط±ظٹط©',
    's.enterprise': 'ط£ظ†ط¸ظ…ط© ظ…طھط®طµطµط©',
    's.settings': 'ط§ظ„ط¥ط¹ط¯ط§ط¯ط§طھ',
    'i.dashboard': 'ظ„ظˆط­ط© ط§ظ„طھط­ظƒظ…', 'i.copilot': 'ط§ظ„ظ…ط³ط§ط¹ط¯ ط§ظ„ط°ظƒظٹ', 'i.cfo': 'ط§ظ„ظ…ط¯ظٹط± ط§ظ„ظ…ط§ظ„ظٹ ط§ظ„ط°ظƒظٹ',
    'i.scm': 'ط§ظ„ظ…ط®ط²ظˆظ† ط§ظ„ط°ظƒظٹ', 'i.alerts': 'طµظ†ط¯ظˆظ‚ ط§ظ„ظˆط§ط±ط¯ ظˆط§ظ„طھظ†ط¨ظٹظ‡ط§طھ',
    'i.pos': 'ط´ط§ط´ط© ظ†ظ‚ط·ط© ط§ظ„ط¨ظٹط¹', 'i.restaurant': 'ظ†ظ‚ط·ط© ط¨ظٹط¹ ط§ظ„ظ…ط·ط§ط¹ظ…', 'i.shifts': 'ظˆط±ط¯ظٹط§طھ ط§ظ„ظƒط§ط´ظٹط±',
    'i.sales_invoices': 'ظپظˆط§طھظٹط± ط§ظ„ظ…ط¨ظٹط¹ط§طھ', 'i.sales_history': 'ط³ط¬ظ„ ط§ظ„ظپظˆط§طھظٹط±',
    'i.sales_quotes': 'ط¹ط±ظˆط¶ ط§ظ„ط£ط³ط¹ط§ط±', 'i.sales_orders': 'ط£ظˆط§ظ…ط± ط§ظ„ط¨ظٹط¹',
    'i.delivery_notes': 'ظ…ط°ظƒط±ط§طھ ط§ظ„طھط³ظ„ظٹظ…', 'i.sales_returns': 'ظ…ط±طھط¬ط¹ط§طھ ط§ظ„ظ…ط¨ظٹط¹ط§طھ', 'i.sales_options': 'ط®ظٹط§ط±ط§طھ ط§ظ„ظ…ط¨ظٹط¹ط§طھ',
    'i.recurring': 'ط§ظ„ط¹ظ‚ظˆط¯ ط§ظ„ط¯ظˆط±ظٹط©', 'i.routes': 'ط®ط·ظˆط· ط§ظ„ط³ظٹط±', 'i.commissions': 'ط§ظ„ط¹ظ…ظˆظ„ط§طھ ظˆط§ظ„ظ…ط³طھظ‡ط¯ظپط§طھ',
    'i.purchase_reqs': 'ط·ظ„ط¨ط§طھ ط§ظ„ط´ط±ط§ط،', 'i.rfq': 'ط¹ط±ظˆط¶ ط£ط³ط¹ط§ط± ط§ظ„ظ…ظˆط±ط¯ظٹظ†',
    'i.po': 'ط£ظˆط§ظ…ط± ط§ظ„ط´ط±ط§ط،', 'i.grn': 'ط³ظ†ط¯ط§طھ ط§ظ„ط§ط³طھظ„ط§ظ…',
    'i.purchases_options': 'ط®ظٹط§ط±ط§طھ ط§ظ„ظ…ط´طھط±ظٹط§طھ', 'i.manual_purchases': 'ظپظˆط§طھظٹط± ط§ظ„ظ…ط´طھط±ظٹط§طھ ط§ظ„ظٹط¯ظˆظٹط©', 'i.purchases': 'ظپظˆط§طھظٹط± ط§ظ„ظ…ط´طھط±ظٹط§طھ', 'i.purchase_returns': 'ظ…ط±طھط¬ط¹ط§طھ ط§ظ„ظ…ط´طھط±ظٹط§طھ', 'i.lc': 'ط§ظ„ط§ط¹طھظ…ط§ط¯ط§طھ ط§ظ„ظ…ط³طھظ†ط¯ظٹط©',
    'i.products': 'ط§ظ„ط£طµظ†ط§ظپ ظˆط§ظ„ط®ط¯ظ…ط§طھ', 'i.stock': 'ط§ظ„ط£ط±طµط¯ط© ط§ظ„ظ…ط®ط²ظ†ظٹط©',
    'i.movements': 'ط­ط±ظƒط© ط§ظ„طµظ†ظپ', 'i.transfer': 'ظ†ظ‚ظ„ ط§ظ„ظ…ط®ط²ظˆظ†',
    'i.smart_transfer': 'ط§ظ„طھط­ظˆظٹظ„ط§طھ ط§ظ„ط°ظƒظٹط©', 'i.adjustments': 'طھط³ظˆظٹط§طھ ط§ظ„ط¬ط±ط¯',
    'i.warehouses': 'ط§ظ„ظ…ط³طھظˆط¯ط¹ط§طھ', 'i.wms': 'ط§ظ„ظ…ط³طھظˆط¯ط¹ ط§ظ„ط°ظƒظٹ',
    'i.barcodes': 'ط§ظ„ط¨ط§ط±ظƒظˆط¯ ظˆط§ظ„ظ…ظ„طµظ‚ط§طھ', 'i.batches': 'طھظˆط§ط±ظٹط® ط§ظ„طµظ„ط§ط­ظٹط©', 'i.serials': 'ط§ظ„ط£ط±ظ‚ط§ظ… ط§ظ„طھط³ظ„ط³ظ„ظٹط©',
    'i.vision': 'ط¬ط±ط¯ ط§ظ„ظƒط§ظ…ظٹط±ط§ ط§ظ„ط°ظƒظٹ',
    'i.bom': 'ظ…ط¹ط§ط¯ظ„ط§طھ ط§ظ„طھطµظ†ظٹط¹', 'i.mrp': 'طھط®ط·ظٹط· ط§ظ„ط¥ظ†طھط§ط¬', 'i.qc': 'ط§ظ„ظپط­طµ ط§ظ„ظ…ط®ط²ظ†ظٹ',
    'i.coa': 'ط´ط¬ط±ط© ط§ظ„ط­ط³ط§ط¨ط§طھ', 'i.treasury': 'ط§ظ„ط®ط²ظٹظ†ط©', 'i.banks': 'ط§ظ„ط¨ظ†ظˆظƒ',
    'i.checks': 'ط£ظˆط±ط§ظ‚ ط§ظ„ظ‚ط¨ط¶ ظˆط§ظ„ط¯ظپط¹', 'i.vouchers': 'ط³ظ†ط¯ط§طھ ط§ظ„ظ‚ط¨ط¶ ظˆط§ظ„ظ…طµط±ظپ',
    'i.expenses': 'ط§ظ„ظ…طµط±ظˆظپط§طھ ط§ظ„ظ†ط«ط±ظٹط©', 'i.petty_cash': 'طµظ†ط§ط¯ظٹظ‚ ط§ظ„ط¹ظ‡ط¯ط©',
    'i.fixed_assets': 'ط§ظ„ط£طµظˆظ„ ط§ظ„ط«ط§ط¨طھط©', 'i.budgets': 'ط§ظ„ظ…ظˆط§ط²ظ†ط§طھ', 'i.installments': 'ط§ظ„طھظ‚ط³ظٹط·',
    'i.fin_reports': 'ط§ظ„طھظ‚ط§ط±ظٹط± ط§ظ„ظ…ط§ظ„ظٹط©',
    'i.customers': 'ظ‚ط§ط¹ط¯ط© ط§ظ„ط¹ظ…ظ„ط§ط،', 'i.leads': 'ط§ظ„ظپط±طµ ط§ظ„ط¨ظٹط¹ظٹط©', 'i.loyalty': 'ظ†ظ‚ط§ط· ط§ظ„ظˆظ„ط§ط،',
    'i.gift_cards': 'ط¨ط·ط§ظ‚ط§طھ ط§ظ„ظ‡ط¯ط§ظٹط§', 'i.coupons': 'ط§ظ„ظƒظˆط¨ظˆظ†ط§طھ', 'i.promotions': 'ط§ظ„ط¹ط±ظˆط¶',
    'i.employees': 'ط¨ظٹط§ظ†ط§طھ ط§ظ„ظ…ظˆط¸ظپظٹظ†', 'i.attendance': 'ط§ظ„ط­ط¶ظˆط± ظˆط§ظ„ط§ظ†طµط±ط§ظپ',
    'i.payroll': 'ظ…ط³ظٹط±ط§طھ ط§ظ„ط±ظˆط§طھط¨', 'i.leaves': 'ط§ظ„ط¥ط¬ط§ط²ط§طھ', 'i.loans': 'ط§ظ„ط³ظ„ظپ ظˆط§ظ„ظ‚ط±ظˆط¶',
    'i.recruitment': 'ط§ظ„طھظˆط¸ظٹظپ', 'i.kpi': 'طھظ‚ظٹظٹظ… ط§ظ„ط£ط¯ط§ط،',
    'i.training': 'ط§ظ„طھط¯ط±ظٹط¨', 'i.face_id': 'ط§ظ„ط¨طµظ…ط© ط§ظ„ط°ظƒظٹط©',
    'i.projects': 'ط§ظ„ظ…ط´ط§ط±ظٹط¹', 'i.property': 'ط§ظ„ط£ظ…ظ„ط§ظƒ ظˆط§ظ„ط¹ظ‚ط§ط±ط§طھ', 'i.leases': 'ط¹ظ‚ظˆط¯ ط§ظ„ط¥ظٹط¬ط§ط±',
    'i.fleet': 'ط£ط³ط·ظˆظ„ ط§ظ„ظ†ظ‚ظ„', 'i.fleet_trips': 'ط±ط­ظ„ط§طھ ط§ظ„ط£ط³ط·ظˆظ„',
    'i.schools': 'ظ†ط¸ط§ظ… ط§ظ„ظ…ط¯ط§ط±ط³', 'i.classes': 'ط§ظ„ظپطµظˆظ„',
    'i.credit': 'ط§ظ„ط±ظ‚ط§ط¨ط© ط§ظ„ط§ط¦طھظ…ط§ظ†ظٹط©',
    'i.saas': 'ظ…ط­ط±ظƒ ط§ظ„ط´ط±ظƒط§طھ', 'i.branches': 'ط§ظ„ظپط±ظˆط¹ ظˆظ†ظ‚ط§ط· ط§ظ„ط¨ظٹط¹',
    'i.currencies': 'ط§ظ„ط¹ظ…ظ„ط§طھ', 'i.approvals': 'ظ†ط¸ط§ظ… ط§ظ„ظ…ظˆط§ظپظ‚ط§طھ',
    'i.wa': 'ط§ظ„ظˆط§طھط³ط§ط¨ ط§ظ„ط¢ظ„ظٹ', 'i.salla': 'ط±ط¨ط· ط³ظ„ط©',
    'i.settings': 'ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„ظ†ط¸ط§ظ…', 'i.audit': 'ط³ط¬ظ„ط§طھ ط§ظ„ظ…ط±ط§ظ‚ط¨ط©', 'i.support': 'ط§ظ„طµظٹط§ظ†ط© ظˆط§ظ„ط¯ط¹ظ…',
        'i.ai_bank': 'ط§ظ„ط¨ظ†ظƒ ط§ظ„ط°ظƒظٹ',
    'i.fleet_fuel': 'ظˆظ‚ظˆط¯ ط§ظ„ط£ظˆط¯طھ',
    'i.prop_inst': 'ط£ظ‚ط³ط§ط· ط§ظ„ط¹ظ‚ط§ط±ط§طھ',
    'i.bookings': 'ط§ظ„ط­ط¬ظˆط²ط§طھ ظˆط§ظ„ظ…ظˆط§ط¹ظٹط¯',
    'i.book_cal': 'طھظ‚ظˆظٹظ… ط§ظ„ط­ط¬ظˆط²ط§طھ',
    'i.affiliates': 'ط§ظ„طھط³ظˆظٹظ‚ ط¨ط§ظ„ط¹ظ…ظˆظ„ط©',
    'i.bank_recon': 'ظ…ط°ظƒط±ط§طھ ط§ظ„طھط³ظˆظٹط© ط§ظ„ط¨ظ†ظƒظٹط©',
    'i.fraud_ai': 'ظƒط´ظپ ط§ظ„ط§ط­طھظٹط§ظ„ ط§ظ„ط°ظƒظٹ',
    'i.73mod': 'طھظ‚ط±ظٹط± ط§ظ„ظ€ 73 ظ†ظ…ظˆط°ط¬',
    'i.sys_health': 'ط­ط§ظ„ط© ط§ظ„ظ†ط¸ط§ظ…',
    'i.mrp_recipes': 'ظˆطµظپط§طھ ط§ظ„طھطµظ†ظٹط¹ (Recipes)',
    'i.stocktake': 'ط¹ظ…ظ„ظٹط§طھ ط§ظ„ط¬ط±ط¯ ط§ظ„ظ…ط®ط²ظ†ظٹ',
'logout': 'طھط³ط¬ظٹظ„ ط§ظ„ط®ط±ظˆط¬',
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
    'i.73mod': '73-Modules Report',
    'i.sys_health': 'System Health',
    'i.mrp_recipes': 'Manufacturing Recipes',
    'i.stocktake': 'Stocktake Operations',
'logout': 'Logout',
  },
  hi: {
    's.dashboard': 'à¤،à¥ˆà¤¶à¤¬à¥‹à¤°à¥چà¤،', 's.sales': 'à¤¬à¤؟à¤•à¥چà¤°à¥€ à¤”à¤° POS', 's.purchases': 'à¤–à¤°à¥€à¤¦',
    's.inventory': 'à¤‡à¤¨à¥چà¤µà¥‡à¤‚à¤ںà¤°à¥€', 's.manufacturing': 'à¤µà¤؟à¤¨à¤؟à¤°à¥چà¤®à¤¾à¤£', 's.finance': 'à¤µà¤؟à¤¤à¥چà¤¤ à¤”à¤° à¤²à¥‡à¤–à¤¾',
    's.crm': 'à¤—à¥چà¤°à¤¾à¤¹à¤• à¤”à¤° CRM', 's.hr': 'à¤®à¤¾à¤¨à¤µ à¤¸à¤‚à¤¸à¤¾à¤§à¤¨', 's.enterprise': 'à¤‰à¤¦à¥چà¤¯à¤®', 's.settings': 'à¤¸à¥‡à¤ںà¤؟à¤‚à¤—à¥چà¤¸',
    'i.dashboard': 'à¤¹à¥‹à¤® à¤،à¥ˆà¤¶à¤¬à¥‹à¤°à¥چà¤،', 'i.copilot': 'AI à¤•à¥‹à¤ھà¤¾à¤¯à¤²à¤ں', 'i.cfo': 'AI CFO', 'i.scm': 'AI SCM',
    'i.alerts': 'à¤‡à¤¨à¤¬à¥‰à¤•à¥چà¤¸ à¤”à¤° à¤…à¤²à¤°à¥چà¤ں', 'i.pos': 'POS à¤ںà¤°à¥چà¤®à¤؟à¤¨à¤²', 'i.restaurant': 'à¤°à¥‡à¤¸à¥چà¤ںà¥‹à¤°à¥‡à¤‚à¤ں POS',
    'i.shifts': 'à¤•à¥ˆà¤¶à¤؟à¤¯à¤° à¤¶à¤؟à¤«à¥چà¤ں', 'i.sales_invoices': 'à¤ںà¥ˆà¤•à¥چà¤¸ à¤‡à¤¨à¤µà¥‰à¤‡à¤¸', 'i.sales_history': 'à¤¬à¤؟à¤•à¥چà¤°à¥€ à¤‡à¤¤à¤؟à¤¹à¤¾à¤¸',
    'i.sales_quotes': 'à¤¬à¤؟à¤•à¥چà¤°à¥€ à¤•à¥‹à¤ںà¥‡à¤¶à¤¨', 'i.sales_orders': 'à¤¬à¤؟à¤•à¥چà¤°à¥€ à¤†à¤¦à¥‡à¤¶',
    'i.delivery_notes': 'à¤،à¤؟à¤²à¥€à¤µà¤°à¥€ à¤¨à¥‹à¤ں', 'i.sales_returns': 'à¤¬à¤؟à¤•à¥چà¤°à¥€ à¤µà¤¾à¤ھà¤¸à¥€',
    'i.recurring': 'à¤†à¤µà¤°à¥چà¤¤à¥€ à¤…à¤¨à¥پà¤¬à¤‚à¤§', 'i.routes': 'à¤¬à¤؟à¤•à¥چà¤°à¥€ à¤®à¤¾à¤°à¥چà¤—', 'i.commissions': 'à¤•à¤®à¥€à¤¶à¤¨ à¤”à¤° à¤²à¤•à¥چà¤·à¥چà¤¯',
    'i.purchase_reqs': 'à¤–à¤°à¥€à¤¦ à¤…à¤¨à¥پà¤°à¥‹à¤§', 'i.rfq': 'à¤¸à¤ھà¥چà¤²à¤¾à¤¯à¤° à¤•à¥‹à¤ںà¥‡à¤¶à¤¨', 'i.po': 'à¤–à¤°à¥€à¤¦ à¤†à¤¦à¥‡à¤¶',
    'i.grn': 'à¤®à¤¾à¤² à¤°à¤¸à¥€à¤¦', 'i.purchases_options': 'Purchase Options', 'i.manual_purchases': 'Manual Purchases', 'i.purchases': 'à¤–à¤°à¥€à¤¦ à¤‡à¤¨à¤µà¥‰à¤‡à¤¸', 'i.purchase_returns': 'à¤–à¤°à¥€à¤¦ à¤µà¤¾à¤ھà¤¸à¥€',
    'i.lc': 'à¤¸à¤¾à¤– à¤ھà¤¤à¥چà¤°', 'i.products': 'à¤‰à¤¤à¥چà¤ھà¤¾à¤¦ à¤”à¤° à¤¸à¥‡à¤µà¤¾à¤ڈà¤‚', 'i.stock': 'à¤¸à¥چà¤ںà¥‰à¤• à¤¶à¥‡à¤·',
    'i.movements': 'à¤¸à¥چà¤ںà¥‰à¤• à¤‡à¤¤à¤؟à¤¹à¤¾à¤¸', 'i.transfer': 'à¤†à¤‚à¤¤à¤°à¤؟à¤• à¤¸à¥چà¤¥à¤¾à¤¨à¤¾à¤‚à¤¤à¤°à¤£',
    'i.smart_transfer': 'à¤¸à¥چà¤®à¤¾à¤°à¥چà¤ں à¤¶à¤¾à¤–à¤¾ à¤¸à¥چà¤¥à¤¾à¤¨à¤¾à¤‚à¤¤à¤°à¤£', 'i.adjustments': 'à¤¸à¥چà¤ںà¥‰à¤• à¤¸à¤®à¤¾à¤¯à¥‹à¤œà¤¨',
    'i.warehouses': 'à¤—à¥‹à¤¦à¤¾à¤®', 'i.wms': 'à¤¸à¥چà¤®à¤¾à¤°à¥چà¤ں WMS', 'i.barcodes': 'à¤¬à¤¾à¤°à¤•à¥‹à¤،', 'i.batches': 'à¤¬à¥ˆà¤ڑ',
    'i.serials': 'à¤¸à¥€à¤°à¤؟à¤¯à¤² à¤¨à¤‚à¤¬à¤°', 'i.vision': 'AI à¤¸à¥چà¤ںà¥‰à¤• à¤œà¤¾à¤‚à¤ڑ',
    'i.bom': 'à¤¸à¤¾à¤®à¤—à¥چà¤°à¥€ à¤¬à¤؟à¤²', 'i.mrp': 'à¤‰à¤¨à¥چà¤¨à¤¤ MRP', 'i.qc': 'à¤—à¥پà¤£à¤µà¤¤à¥چà¤¤à¤¾ à¤¨à¤؟à¤¯à¤‚à¤¤à¥چà¤°à¤£',
    'i.coa': 'à¤–à¤¾à¤¤à¤¾ à¤ڑà¤¾à¤°à¥چà¤ں', 'i.treasury': 'à¤•à¥‹à¤·à¤¾à¤—à¤¾à¤°', 'i.banks': 'à¤¬à¥ˆà¤‚à¤•',
    'i.checks': 'à¤ڑà¥‡à¤•', 'i.vouchers': 'à¤œà¤°à¥چà¤¨à¤² à¤ڈà¤‚à¤ںà¥چà¤°à¥€', 'i.expenses': 'à¤ھà¥‡à¤ںà¥€ à¤•à¥ˆà¤¶',
    'i.petty_cash': 'à¤ھà¥‡à¤ںà¥€ à¤•à¥ˆà¤¶ à¤«à¤‚à¤،', 'i.fixed_assets': 'à¤…à¤ڑà¤² à¤¸à¤‚à¤ھà¤¤à¥چà¤¤à¤؟', 'i.budgets': 'à¤¬à¤œà¤ں',
    'i.installments': 'à¤•à¤؟à¤¶à¥چà¤¤', 'i.fin_reports': 'à¤µà¤؟à¤¤à¥چà¤¤à¥€à¤¯ à¤°à¤؟à¤ھà¥‹à¤°à¥چà¤ں',
    'i.customers': 'à¤—à¥چà¤°à¤¾à¤¹à¤•', 'i.leads': 'à¤²à¥€à¤،', 'i.loyalty': 'à¤µà¤«à¤¾à¤¦à¤¾à¤°à¥€ à¤…à¤‚à¤•',
    'i.gift_cards': 'à¤‰à¤ھà¤¹à¤¾à¤° à¤•à¤¾à¤°à¥چà¤،', 'i.coupons': 'à¤•à¥‚à¤ھà¤¨', 'i.promotions': 'à¤ھà¥چà¤°à¤ڑà¤¾à¤°',
    'i.employees': 'à¤•à¤°à¥چà¤®à¤ڑà¤¾à¤°à¥€', 'i.attendance': 'à¤‰à¤ھà¤¸à¥چà¤¥à¤؟à¤¤à¤؟', 'i.payroll': 'à¤µà¥‡à¤¤à¤¨', 'i.leaves': 'à¤›à¥پà¤ںà¥چà¤ںà¥€',
    'i.loans': 'à¤‹à¤£', 'i.recruitment': 'à¤­à¤°à¥چà¤¤à¥€', 'i.kpi': 'à¤ھà¥چà¤°à¤¦à¤°à¥چà¤¶à¤¨', 'i.training': 'à¤ھà¥چà¤°à¤¶à¤؟à¤•à¥چà¤·à¤£',
    'i.face_id': 'AI à¤ڑà¥‡à¤¹à¤°à¤¾', 'i.projects': 'à¤ھà¤°à¤؟à¤¯à¥‹à¤œà¤¨à¤¾', 'i.property': 'à¤°à¤؟à¤¯à¤² à¤ڈà¤¸à¥چà¤ںà¥‡à¤ں',
    'i.leases': 'à¤•à¤؟à¤°à¤¾à¤¯à¤¾', 'i.fleet': 'à¤¬à¥‡à¤،à¤¼à¤¾', 'i.fleet_trips': 'à¤¯à¤¾à¤¤à¥چà¤°à¤¾à¤ڈà¤‚',
    'i.schools': 'à¤¸à¥چà¤•à¥‚à¤²', 'i.classes': 'à¤•à¤•à¥چà¤·à¤¾à¤ڈà¤‚', 'i.credit': 'à¤•à¥چà¤°à¥‡à¤،à¤؟à¤ں',
    'i.saas': 'SaaS', 'i.branches': 'à¤¶à¤¾à¤–à¤¾à¤ڈà¤‚', 'i.currencies': 'à¤®à¥پà¤¦à¥چà¤°à¤¾à¤ڈà¤‚',
    'i.approvals': 'à¤…à¤¨à¥پà¤®à¥‹à¤¦à¤¨', 'i.wa': 'WhatsApp', 'i.salla': 'Salla',
    'i.settings': 'à¤¸à¥‡à¤ںà¤؟à¤‚à¤—à¥چà¤¸', 'i.audit': 'à¤‘à¤،à¤؟à¤ں', 'i.support': 'à¤¸à¤®à¤°à¥چà¤¥à¤¨',
        'i.ai_bank': 'AI à¤¬à¥ˆà¤‚à¤•',
    'i.fleet_fuel': 'à¤¬à¥‡à¤،à¤¼à¤¾ à¤ˆà¤‚à¤§à¤¨',
    'i.prop_inst': 'à¤¸à¤‚à¤ھà¤¤à¥چà¤¤à¤؟ à¤•à¤؟à¤¶à¥چà¤¤à¥‡à¤‚',
    'i.bookings': 'à¤¬à¥پà¤•à¤؟à¤‚à¤— à¤”à¤° à¤…à¤ھà¥‰à¤‡à¤‚à¤ںà¤®à¥‡à¤‚à¤ں',
    'i.book_cal': 'à¤¬à¥پà¤•à¤؟à¤‚à¤— à¤•à¥ˆà¤²à¥‡à¤‚à¤،à¤°',
    'i.affiliates': 'à¤¸à¤¹à¤¬à¤¦à¥چà¤§ à¤µà¤؟à¤ھà¤£à¤¨',
    'i.bank_recon': 'à¤¬à¥ˆà¤‚à¤• à¤¸à¤®à¤¾à¤§à¤¾à¤¨',
    'i.fraud_ai': 'AI à¤§à¥‹à¤–à¤¾à¤§à¤،à¤¼à¥€ à¤•à¤¾ à¤ھà¤¤à¤¾ à¤²à¤—à¤¾à¤¨à¤¾',
    'i.73mod': '73-à¤®à¥‰à¤،à¥چà¤¯à¥‚à¤² à¤°à¤؟à¤ھà¥‹à¤°à¥چà¤ں',
    'i.sys_health': 'à¤¸à¤؟à¤¸à¥چà¤ںà¤® à¤¸à¥چà¤µà¤¾à¤¸à¥چà¤¥à¥چà¤¯',
    'i.mrp_recipes': 'à¤µà¤؟à¤¨à¤؟à¤°à¥چà¤®à¤¾à¤£ à¤¨à¥پà¤¸à¥چà¤–à¥‡',
    'i.stocktake': 'à¤¸à¥چà¤ںà¥‰à¤• à¤œà¤¾à¤‚à¤ڑ à¤•à¤¾à¤°à¥چà¤¯',
'logout': 'à¤²à¥‰à¤—à¤†à¤‰à¤ں',
  },
  bn: {
    's.dashboard': 'à¦،à§چà¦¯à¦¾à¦¶à¦¬à§‹à¦°à§چà¦،', 's.sales': 'à¦¬à¦؟à¦•à§چà¦°à¦¯à¦¼ à¦ڈà¦¬à¦‚ POS', 's.purchases': 'à¦•à§چà¦°à¦¯à¦¼',
    's.inventory': 'à¦‡à¦¨à¦­à§‡à¦¨à§چà¦ںà¦°à¦؟', 's.manufacturing': 'à¦‰à§ژà¦ھà¦¾à¦¦à¦¨', 's.finance': 'à¦…à¦°à§چà¦¥ à¦“ à¦¹à¦؟à¦¸à¦¾à¦¬',
    's.crm': 'à¦—à§چà¦°à¦¾à¦¹à¦• à¦ڈà¦¬à¦‚ CRM', 's.hr': 'à¦®à¦¾à¦¨à¦¬ à¦¸à¦®à§چà¦ھà¦¦', 's.enterprise': 'à¦ڈà¦¨à§چà¦ںà¦¾à¦°à¦ھà§چà¦°à¦¾à¦‡à¦œ', 's.settings': 'à¦¸à§‡à¦ںà¦؟à¦‚à¦¸',
    'i.dashboard': 'à¦¹à§‹à¦® à¦،à§چà¦¯à¦¾à¦¶à¦¬à§‹à¦°à§چà¦،', 'i.copilot': 'AI à¦•à§‹à¦ھà¦¾à¦‡à¦²à¦ں', 'i.cfo': 'AI CFO', 'i.scm': 'AI SCM',
    'i.alerts': 'à¦‡à¦¨à¦¬à¦•à§چà¦¸', 'i.pos': 'POS à¦ںà¦¾à¦°à§چà¦®à¦؟à¦¨à¦¾à¦²', 'i.restaurant': 'à¦°à§‡à¦¸à§چà¦ںà§پà¦°à§‡à¦¨à§چà¦ں POS',
    'i.shifts': 'à¦¶à¦؟à¦«à¦ں', 'i.sales_invoices': 'à¦ںà§چà¦¯à¦¾à¦•à§چà¦¸ à¦‡à¦¨à¦­à¦¯à¦¼à§‡à¦¸', 'i.sales_history': 'à¦¬à¦؟à¦•à§چà¦°à¦¯à¦¼ à¦‡à¦¤à¦؟à¦¹à¦¾à¦¸',
    'i.sales_quotes': 'à¦•à§‹à¦ںà§‡à¦¶à¦¨', 'i.sales_orders': 'à¦¬à¦؟à¦•à§چà¦°à¦¯à¦¼ à¦†à¦¦à§‡à¦¶',
    'i.delivery_notes': 'à¦،à§‡à¦²à¦؟à¦­à¦¾à¦°à¦؟ à¦¨à§‹à¦ں', 'i.sales_returns': 'à¦¬à¦؟à¦•à§چà¦°à¦¯à¦¼ à¦«à§‡à¦°à¦¤',
    'i.recurring': 'à¦ڑà§پà¦•à§چà¦¤à¦؟', 'i.routes': 'à¦°à§پà¦ں', 'i.commissions': 'à¦•à¦®à¦؟à¦¶à¦¨',
    'i.purchase_reqs': 'à¦•à§چà¦°à¦¯à¦¼ à¦…à¦¨à§پà¦°à§‹à¦§', 'i.rfq': 'à¦•à§‹à¦ںà§‡à¦¶à¦¨', 'i.po': 'à¦•à§چà¦°à¦¯à¦¼ à¦†à¦¦à§‡à¦¶',
    'i.grn': 'à¦ھà¦£à§چà¦¯ à¦°à¦¸à¦؟à¦¦', 'i.purchases_options': 'Purchase Options', 'i.manual_purchases': 'Manual Purchases', 'i.purchases': 'à¦•à§چà¦°à¦¯à¦¼ à¦‡à¦¨à¦­à¦¯à¦¼à§‡à¦¸', 'i.purchase_returns': 'à¦•à§چà¦°à¦¯à¦¼ à¦«à§‡à¦°à¦¤',
    'i.lc': 'à¦‹à¦£à¦ھà¦¤à§چà¦°', 'i.products': 'à¦ھà¦£à§چà¦¯', 'i.stock': 'à¦¸à§چà¦ںà¦•',
    'i.movements': 'à¦¸à§چà¦ںà¦• à¦‡à¦¤à¦؟à¦¹à¦¾à¦¸', 'i.transfer': 'à¦¸à§چà¦¥à¦¾à¦¨à¦¾à¦¨à§چà¦¤à¦°',
    'i.smart_transfer': 'à¦¸à§چà¦®à¦¾à¦°à§چà¦ں à¦¸à§چà¦¥à¦¾à¦¨à¦¾à¦¨à§چà¦¤à¦°', 'i.adjustments': 'à¦¸à¦®à¦¨à§چà¦¬à¦¯à¦¼',
    'i.warehouses': 'à¦—à§پà¦¦à¦¾à¦®', 'i.wms': 'WMS', 'i.barcodes': 'à¦¬à¦¾à¦°à¦•à§‹à¦،', 'i.batches': 'à¦¬à§چà¦¯à¦¾à¦ڑ',
    'i.serials': 'à¦¸à¦؟à¦°à¦؟à¦¯à¦¼à¦¾à¦²', 'i.vision': 'AI à¦¸à§چà¦ںà¦•à¦ںà§‡à¦•',
    'i.bom': 'BOM', 'i.mrp': 'MRP', 'i.qc': 'à¦®à¦¾à¦¨ à¦¨à¦؟à¦¯à¦¼à¦¨à§چà¦¤à§چà¦°à¦£',
    'i.coa': 'à¦¹à¦؟à¦¸à¦¾à¦¬', 'i.treasury': 'à¦•à§‹à¦·à¦¾à¦—à¦¾à¦°', 'i.banks': 'à¦¬à§چà¦¯à¦¾à¦‚à¦•',
    'i.checks': 'à¦ڑà§‡à¦•', 'i.vouchers': 'à¦­à¦¾à¦‰à¦ڑà¦¾à¦°', 'i.expenses': 'à¦–à¦°à¦ڑ',
    'i.petty_cash': 'à¦ھà§‡à¦ںà¦؟ à¦•à§چà¦¯à¦¾à¦¶', 'i.fixed_assets': 'à¦¸à¦®à§چà¦ھà¦¦', 'i.budgets': 'à¦¬à¦¾à¦œà§‡à¦ں',
    'i.installments': 'à¦•à¦؟à¦¸à§چà¦¤à¦؟', 'i.fin_reports': 'à¦†à¦°à§چà¦¥à¦؟à¦• à¦°à¦؟à¦ھà§‹à¦°à§چà¦ں',
    'i.customers': 'à¦—à§چà¦°à¦¾à¦¹à¦•', 'i.leads': 'à¦²à¦؟à¦،', 'i.loyalty': 'à¦†à¦¨à§پà¦—à¦¤à§چà¦¯',
    'i.gift_cards': 'à¦—à¦؟à¦«à¦ں à¦•à¦¾à¦°à§چà¦،', 'i.coupons': 'à¦•à§پà¦ھà¦¨', 'i.promotions': 'à¦ھà§چà¦°à¦ڑà¦¾à¦°',
    'i.employees': 'à¦•à¦°à§چà¦®à¦ڑà¦¾à¦°à§€', 'i.attendance': 'à¦‰à¦ھà¦¸à§چà¦¥à¦؟à¦¤à¦؟', 'i.payroll': 'à¦¬à§‡à¦¤à¦¨', 'i.leaves': 'à¦›à§پà¦ںà¦؟',
    'i.loans': 'à¦‹à¦£', 'i.recruitment': 'à¦¨à¦؟à¦¯à¦¼à§‹à¦—', 'i.kpi': 'KPI', 'i.training': 'à¦ھà§چà¦°à¦¶à¦؟à¦•à§چà¦·à¦£',
    'i.face_id': 'AI à¦¹à¦¾à¦œà¦؟à¦°à¦¾', 'i.projects': 'à¦ھà§چà¦°à¦•à¦²à§چà¦ھ', 'i.property': 'à¦°à¦؟à¦¯à¦¼à§‡à¦² à¦ڈà¦¸à§چà¦ںà§‡à¦ں',
    'i.leases': 'à¦­à¦¾à¦،à¦¼à¦¾', 'i.fleet': 'à¦¬à¦¹à¦°', 'i.fleet_trips': 'à¦­à§چà¦°à¦®à¦£',
    'i.schools': 'à¦¸à§چà¦•à§پà¦²', 'i.classes': 'à¦¶à§چà¦°à§‡à¦£à¦؟', 'i.credit': 'à¦•à§چà¦°à§‡à¦،à¦؟à¦ں',
    'i.saas': 'SaaS', 'i.branches': 'à¦¶à¦¾à¦–à¦¾', 'i.currencies': 'à¦®à§پà¦¦à§چà¦°à¦¾',
    'i.approvals': 'à¦…à¦¨à§پà¦®à§‹à¦¦à¦¨', 'i.wa': 'WhatsApp', 'i.salla': 'Salla',
    'i.settings': 'à¦¸à§‡à¦ںà¦؟à¦‚à¦¸', 'i.audit': 'à¦…à¦،à¦؟à¦ں', 'i.support': 'à¦¸à¦¹à¦¾à¦¯à¦¼à¦¤à¦¾',
        'i.ai_bank': 'AI à¦¬à§چà¦¯à¦¾à¦‚à¦•',
    'i.fleet_fuel': 'à¦¬à¦¹à¦° à¦œà§چà¦¬à¦¾à¦²à¦¾à¦¨à§€',
    'i.prop_inst': 'à¦¸à¦®à§چà¦ھà¦¤à§چà¦¤à¦؟ à¦•à¦؟à¦¸à§چà¦¤à¦؟',
    'i.bookings': 'à¦¬à§پà¦•à¦؟à¦‚ à¦ڈà¦¬à¦‚ à¦…à§چà¦¯à¦¾à¦ھà¦¯à¦¼à§‡à¦¨à§چà¦ںà¦®à§‡à¦¨à§چà¦ں',
    'i.book_cal': 'à¦¬à§پà¦•à¦؟à¦‚ à¦•à§چà¦¯à¦¾à¦²à§‡à¦¨à§چà¦،à¦¾à¦°',
    'i.affiliates': 'à¦…à§چà¦¯à¦¾à¦«à¦؟à¦²à¦؟à¦¯à¦¼à§‡à¦ں à¦®à¦¾à¦°à§چà¦•à§‡à¦ںà¦؟à¦‚',
    'i.bank_recon': 'à¦¬à§چà¦¯à¦¾à¦‚à¦• à¦¸à¦®à¦¨à§چà¦¬à¦¯à¦¼',
    'i.fraud_ai': 'AI à¦œà¦¾à¦²à¦؟à¦¯à¦¼à¦¾à¦¤à¦؟ à¦¸à¦¨à¦¾à¦•à§چà¦¤à¦•à¦°à¦£',
    'i.73mod': '73-à¦®à¦،à¦؟à¦‰à¦² à¦°à¦؟à¦ھà§‹à¦°à§چà¦ں',
    'i.sys_health': 'à¦¸à¦؟à¦¸à§چà¦ںà§‡à¦® à¦¸à§چà¦¬à¦¾à¦¸à§چà¦¥à§چà¦¯',
    'i.mrp_recipes': 'à¦‰à¦¤à§چà¦ھà¦¾à¦¦à¦¨ à¦°à§‡à¦¸à¦؟à¦ھà¦؟',
    'i.stocktake': 'à¦¸à§چà¦ںà¦•à¦ںà§‡à¦• à¦…à¦ھà¦¾à¦°à§‡à¦¶à¦¨',
'logout': 'à¦²à¦—à¦†à¦‰à¦ں',
  },
  ur: {
    's.dashboard': 'عˆغŒط´ ط¨ظˆط±عˆ', 's.sales': 'ظپط±ظˆط®طھ ط§ظˆط± POS', 's.purchases': 'ط®ط±غŒط¯ط§ط±غŒ',
    's.inventory': 'ط§ظ†ظˆغŒظ†ظ¹ط±غŒ', 's.manufacturing': 'ظ…غŒظ†ظˆظپغŒع©ع†ط±ظ†ع¯', 's.finance': 'ظ…ط§ظ„غŒط§طھ',
    's.crm': 'ع©ط³ظ¹ظ…ط±ط² ط§ظˆط± CRM', 's.hr': 'ط§ظ†ط³ط§ظ†غŒ ظˆط³ط§ط¦ظ„', 's.enterprise': 'ط§ظ†ظ¹ط±ظ¾ط±ط§ط¦ط²', 's.settings': 'طھط±طھغŒط¨ط§طھ',
    'i.dashboard': 'غپظˆظ… عˆغŒط´ ط¨ظˆط±عˆ', 'i.copilot': 'AI ع©ظˆظ¾ط§ط¦ظ„ظ¹', 'i.cfo': 'AI CFO', 'i.scm': 'AI SCM',
    'i.alerts': 'ط§ظ† ط¨ط§ع©ط³', 'i.pos': 'POS ظ¹ط±ظ…غŒظ†ظ„', 'i.restaurant': 'ط±غŒط³طھظˆط±ط§ظ† POS',
    'i.shifts': 'ط´ظپظ¹ط³', 'i.sales_invoices': 'ظ¹غŒع©ط³ ط§ظ†ظˆط§ط¦ط³', 'i.sales_history': 'ظپط±ظˆط®طھ ع©غŒ طھط§ط±غŒط®',
    'i.sales_quotes': 'ع©ظˆظ¹غŒط´ظ†', 'i.sales_orders': 'ظپط±ظˆط®طھ ط¢ط±عˆط±ط²',
    'i.delivery_notes': 'عˆغŒظ„غŒظˆط±غŒ ظ†ظˆظ¹ط³', 'i.sales_returns': 'ظپط±ظˆط®طھ ظˆط§ظ¾ط³غŒ',
    'i.recurring': 'ع©ظ†ظ¹ط±غŒع©ظ¹ط³', 'i.routes': 'ط±ط§ط³طھغ’', 'i.commissions': 'ع©ظ…غŒط´ظ†',
    'i.purchase_reqs': 'ط®ط±غŒط¯ط§ط±غŒ ط¯ط±ط®ظˆط§ط³طھغŒع؛', 'i.rfq': 'ع©ظˆظ¹غŒط´ظ†', 'i.po': 'ط®ط±غŒط¯ط§ط±غŒ ط¢ط±عˆط±ط²',
    'i.grn': 'ظ…ط§ظ„ ط±ط³غŒط¯', 'i.purchases_options': 'Purchase Options', 'i.manual_purchases': 'Manual Purchases', 'i.purchases': 'ط®ط±غŒط¯ط§ط±غŒ ط§ظ†ظˆط§ط¦ط³', 'i.purchase_returns': 'ط®ط±غŒط¯ط§ط±غŒ ظˆط§ظ¾ط³غŒ',
    'i.lc': 'ط§ط¹طھظ…ط§ط¯ ظ†ط§ظ…غپ', 'i.products': 'ظ…طµظ†ظˆط¹ط§طھ', 'i.stock': 'ط§ط³ظ¹ط§ع©',
    'i.movements': 'ط§ط³ظ¹ط§ع© طھط§ط±غŒط®', 'i.transfer': 'ظ…ظ†طھظ‚ظ„غŒ',
    'i.smart_transfer': 'ط³ظ…ط§ط±ظ¹ ظ…ظ†طھظ‚ظ„غŒ', 'i.adjustments': 'ط§غŒعˆط¬ط³ظ¹ظ…ظ†ظ¹',
    'i.warehouses': 'ع¯ظˆط¯ط§ظ…', 'i.wms': 'WMS', 'i.barcodes': 'ط¨ط§ط±ع©ظˆعˆ', 'i.batches': 'ط¨غŒع†',
    'i.serials': 'ط³غŒط±غŒظ„', 'i.vision': 'AI ط§ط³ظ¹ط§ع©',
    'i.bom': 'BOM', 'i.mrp': 'MRP', 'i.qc': 'ع©ظˆط§ظ„ظ¹غŒ',
    'i.coa': 'ط§ع©ط§ط¤ظ†ظ¹ط³', 'i.treasury': 'ط®ط²ط§ظ†غپ', 'i.banks': 'ط¨غŒظ†ع©',
    'i.checks': 'ع†غŒع©', 'i.vouchers': 'ظˆظˆع†ط±', 'i.expenses': 'ط§ط®ط±ط§ط¬ط§طھ',
    'i.petty_cash': 'ظ¾غŒظ¹غŒ ع©غŒط´', 'i.fixed_assets': 'ط§ط«ط§ط«غ’', 'i.budgets': 'ط¨ط¬ظ¹',
    'i.installments': 'ظ‚ط³ط·', 'i.fin_reports': 'ظ…ط§ظ„غŒ ط±ظ¾ظˆط±ظ¹غŒع؛',
    'i.customers': 'ع©ط³ظ¹ظ…ط±ط²', 'i.leads': 'ظ„غŒعˆط²', 'i.loyalty': 'ظˆظپط§ط¯ط§ط±غŒ',
    'i.gift_cards': 'ع¯ظپظ¹ ع©ط§ط±عˆط²', 'i.coupons': 'ع©ظˆظ¾ظ†', 'i.promotions': 'ظ¾ط±ظˆظ…ظˆط´ظ†',
    'i.employees': 'ظ…ظ„ط§ط²ظ…غŒظ†', 'i.attendance': 'ط­ط§ط¶ط±غŒ', 'i.payroll': 'طھظ†ط®ظˆط§غپ', 'i.leaves': 'ع†ع¾ظ¹غŒط§ع؛',
    'i.loans': 'ظ‚ط±ط¶', 'i.recruitment': 'ط¨ع¾ط±طھغŒ', 'i.kpi': 'KPI', 'i.training': 'طھط±ط¨غŒطھ',
    'i.face_id': 'AI ط­ط§ط¶ط±غŒ', 'i.projects': 'ظ¾ط±ظˆط¬غŒع©ظ¹', 'i.property': 'ط±ط¦غŒظ„ ط§ط³ظ¹غŒظ¹',
    'i.leases': 'ع©ط±ط§غŒغپ', 'i.fleet': 'ط¨غŒع‘غپ', 'i.fleet_trips': 'ط³ظپط±',
    'i.schools': 'ط§ط³ع©ظˆظ„', 'i.classes': 'ع©ظ„ط§ط³ط²', 'i.credit': 'ع©ط±غŒعˆظ¹',
    'i.saas': 'SaaS', 'i.branches': 'ط´ط§ط®غŒع؛', 'i.currencies': 'ع©ط±ظ†ط³غŒ',
    'i.approvals': 'ظ…ظ†ط¸ظˆط±غŒ', 'i.wa': 'WhatsApp', 'i.salla': 'Salla',
    'i.settings': 'طھط±طھغŒط¨ط§طھ', 'i.audit': 'ط¢عˆظ¹', 'i.support': 'ظ…ط¯ط¯',
        'i.ai_bank': 'AI ط¨غŒظ†ع©',
    'i.fleet_fuel': 'ظپظ„غŒظ¹ ظپغŒظˆظ„',
    'i.prop_inst': 'ط¬ط§ط¦غŒط¯ط§ط¯ ع©غŒ ط§ظ‚ط³ط§ط·',
    'i.bookings': 'ط¨ع©ظ†ع¯ط²',
    'i.book_cal': 'ط¨ع©ظ†ع¯ ع©غŒظ„ظ†عˆط±',
    'i.affiliates': 'ظ…ظ„ط­ظ‚غپ ظ…ط§ط±ع©غŒظ¹ظ†ع¯',
    'i.bank_recon': 'ط¨غŒظ†ع© ظ…ظپط§غپظ…طھ',
    'i.fraud_ai': 'AI ظپط±ط§عˆ ع©ط§ ظ¾طھغپ ظ„ع¯ط§ظ†ط§',
    'i.73mod': '73-ظ…ط§عˆغŒظˆظ„ط² ط±ظ¾ظˆط±ظ¹',
    'i.sys_health': 'ط³ط³ظ¹ظ… ع©غŒ طµط­طھ',
    'i.mrp_recipes': 'ظ…غŒظ†ظˆظپغŒع©ع†ط±ظ†ع¯ طھط±ع©غŒط¨غŒع؛',
    'i.stocktake': 'ط§ط³ظ¹ط§ع© ظ¹غŒع© ط¢ظ¾ط±غŒط´ظ†ط²',
'logout': 'ظ„ط§ع¯ ط¢ط¤ظ¹',
  },
};

function gl(lang: string, key: string): string {
  return (LABELS as any)[lang]?.[key] || LABELS['ar']?.[key] || key;
}

// â”€â”€ Menu items â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const menuItems = [
  { sk: 's.dashboard', items: [
    { icon: 'ًں“ٹ', lk: 'i.dashboard', href: '/dashboard', module: 'dashboard' },
    { icon: 'ًںڈ¦', lk: 'i.ai_bank', href: '/ai-bank', module: 'ai_bank' },
    { icon: 'ًں¤–', lk: 'i.copilot', href: '/ai-copilot', module: 'ai_copilot' },
    { icon: 'ًں§ ', lk: 'i.cfo', href: '/ai-cfo', module: 'ai_cfo' },
    { icon: 'ًں“¦', lk: 'i.scm', href: '/ai-scm', module: 'ai_scm' },
    { icon: 'ًں””', lk: 'i.alerts', href: '/sys/alerts', module: 'dashboard' },
  ]},
  { sk: 's.sales', items: [
    { icon: 'ًں’»', lk: 'i.pos', href: '/pos', module: 'pos' },
    { icon: 'ًںچ”', lk: 'i.restaurant', href: '/restaurant-pos', module: 'restaurant_pos' },
    { icon: 'ًں•’', lk: 'i.shifts', href: '/shifts', module: 'shifts' },
    { icon: 'ًں§¾', lk: 'i.sales_invoices', href: '/sales', module: 'sales' },
    { icon: 'ًں—‚ï¸ڈ', lk: 'i.sales_history', href: '/sales/history', module: 'sales' },
    { icon: 'ًں“„', lk: 'i.sales_quotes', href: '/price-quotes', module: 'price_quotes' },
    { icon: 'ًں“¦', lk: 'i.sales_orders', href: '/sales/orders', module: 'sales_orders' },
    { icon: 'ًںڑڑ', lk: 'i.delivery_notes', href: '/sales/delivery-notes', module: 'sales_orders' },
    { icon: 'â†©ï¸ڈ', lk: 'i.sales_returns', href: '/sales-returns', module: 'sales_returns' },
    { icon: 'ًں”„', lk: 'i.recurring', href: '/recurring-invoices', module: 'sales_orders' },
    { icon: 'ًں—؛ï¸ڈ', lk: 'i.routes', href: '/sales/routes', module: 'sales_routes' },
    { icon: 'ًںژ¯', lk: 'i.commissions', href: '/sales/targets', module: 'sales_targets' },
    { icon: 'âڑ™ï¸ڈ', lk: 'i.sales_options', href: '/sales/options', module: 'sales' },
  ]},
  { sk: 's.purchases', items: [
    { icon: 'âڑ™ï¸ڈ', lk: 'i.purchases_options', href: '/purchases/options', module: 'purchases' },
    { icon: 'ًں“‌', lk: 'i.purchase_reqs', href: '/purchases/requisitions', module: 'purchase_orders' },
    { icon: 'ًں“©', lk: 'i.rfq', href: '/purchases/rfq', module: 'purchase_orders' },
    { icon: 'ًں“‹', lk: 'i.po', href: '/purchase-orders', module: 'purchase_orders' },
    { icon: 'ًں“¥', lk: 'i.grn', href: '/purchases/grn', module: 'purchases' },
    { icon: 'ًں›’', lk: 'i.purchases', href: '/purchases', module: 'purchases' },
    { icon: 'â†©ï¸ڈ', lk: 'i.purchase_returns', href: '/purchase-returns', module: 'purchase_returns' },
    { icon: 'ًںŒچ', lk: 'i.lc', href: '/purchases/letters-of-credit', module: 'letters_of_credit' },
    { icon: 'ًں“ٹ', lk: 'i.manual_purchases', href: '/reports/manual-purchases', module: 'purchases' },
  ]},
  { sk: 's.inventory', items: [
    { icon: 'ًں“¦', lk: 'i.products', href: '/products', module: 'products' },
    { icon: 'ًںڈ­', lk: 'i.stock', href: '/stock', module: 'stock' },
    { icon: 'âŒڑ', lk: 'i.movements', href: '/stock/movements', module: 'stock_transfers' },
    { icon: 'ًں”€', lk: 'i.transfer', href: '/stock-transfers', module: 'stock_transfers' },
    { icon: 'ًںڑڑ', lk: 'i.smart_transfer', href: '/smart-transfers', module: 'stock_transfers' },
    { icon: 'âڑ–ï¸ڈ', lk: 'i.adjustments', href: '/stock/adjustments', module: 'stock_transfers' },
    { icon: 'ًںڈ¢', lk: 'i.warehouses', href: '/warehouses', module: 'warehouses' },
    { icon: 'ًں“گ', lk: 'i.wms', href: '/enterprise/wms', module: 'wms' },
    { icon: 'ًںڈ·ï¸ڈ', lk: 'i.barcodes', href: '/barcode', module: 'barcode' },
    { icon: 'âڈ±ï¸ڈ', lk: 'i.batches', href: '/batches', module: 'batches' },
    { icon: 'ًں”¢', lk: 'i.serials', href: '/inv/serials', module: 'stock' },
    { icon: 'ًں“¸', lk: 'i.vision', href: '/stocktake/vision', module: 'vision_inventory' },
    { icon: 'ًں“‹', lk: 'i.stocktake', href: '/stocktake', module: 'stock' },
  ]},
  { sk: 's.manufacturing', items: [
    { icon: 'ًں› ï¸ڈ', lk: 'i.bom', href: '/manufacturing', module: 'manufacturing' },
    { icon: 'ًںڈ­', lk: 'i.mrp', href: '/enterprise/mrp', module: 'mrp' },
    { icon: 'ًں“ڑ', lk: 'i.mrp_recipes', href: '/enterprise/mrp/recipes', module: 'mrp' },
    { icon: 'ًں”ژ', lk: 'i.qc', href: '/enterprise/quality', module: 'mrp' },
  ]},
  { sk: 's.finance', items: [
    { icon: 'ًں“ٹ', lk: 'i.coa', href: '/accounting', module: 'accounting' },
    { icon: 'ًں’°', lk: 'i.treasury', href: '/treasury', module: 'treasury' },
    { icon: 'ًںڈ¦', lk: 'i.banks', href: '/accounting/banks', module: 'banks' },
    { icon: 'ًںڈ¦', lk: 'i.checks', href: '/treasury/checks', module: 'treasury_checks' },
    { icon: 'ًں§¾', lk: 'i.vouchers', href: '/receipt-vouchers', module: 'receipt_vouchers' },
    { icon: 'ًں’¸', lk: 'i.expenses', href: '/expenses', module: 'expenses' },
    { icon: 'ًں’¼', lk: 'i.petty_cash', href: '/fng/petty-cash-funds', module: 'petty_cash' },
    { icon: 'ًںڈ¢', lk: 'i.fixed_assets', href: '/fixed-assets', module: 'fixed_assets' },
    { icon: 'âڑ–ï¸ڈ', lk: 'i.budgets', href: '/fng/budgets', module: 'accounting' },
    { icon: 'ًں“‘', lk: 'i.installments', href: '/installments', module: 'installments' },
    { icon: 'ًں“ˆ', lk: 'i.fin_reports', href: '/reports', module: 'reports' },
    { icon: 'ًں“‹', lk: 'i.73mod', href: '/reports/73-modules', module: 'reports' },
    { icon: 'ًں•µï¸ڈ', lk: 'i.fraud_ai', href: '/reports/fraud-ai', module: 'reports' },
    { icon: 'ًں”„', lk: 'i.bank_recon', href: '/treasury/bank-reconciliation', module: 'treasury' },
  ]},
  { sk: 's.crm', items: [
    { icon: 'ًں‘¥', lk: 'i.customers', href: '/customers', module: 'customers' },
    { icon: 'ًں“ˆ', lk: 'i.leads', href: '/crm/leads', module: 'customers' },
    { icon: 'ًںژپ', lk: 'i.loyalty', href: '/loyalty', module: 'loyalty' },
    { icon: 'ًں’³', lk: 'i.gift_cards', href: '/gift-cards', module: 'gift_cards' },
    { icon: 'ًںژںï¸ڈ', lk: 'i.coupons', href: '/coupons', module: 'coupons' },
    { icon: 'ًںژ¯', lk: 'i.promotions', href: '/promotions', module: 'promotions' },
    { icon: 'ًں“…', lk: 'i.bookings', href: '/bookings', module: 'bookings' },
    { icon: 'ًں“†', lk: 'i.book_cal', href: '/bookings/calendar', module: 'bookings' },
    { icon: 'ًں¤‌', lk: 'i.affiliates', href: '/affiliates', module: 'affiliates' },
  ]},
  { sk: 's.hr', items: [
    { icon: 'ًں‘¨â€چًں’¼', lk: 'i.employees', href: '/employees', module: 'employees' },
    { icon: 'ًں•گ', lk: 'i.attendance', href: '/attendance', module: 'attendance' },
    { icon: 'ًں’µ', lk: 'i.payroll', href: '/salaries', module: 'salaries' },
    { icon: 'ًںڈ–ï¸ڈ', lk: 'i.leaves', href: '/vacations', module: 'vacations' },
    { icon: 'ًں’¼', lk: 'i.loans', href: '/hr/loans', module: 'hr_loans' },
    { icon: 'ًں‘”', lk: 'i.recruitment', href: '/hr/jobs', module: 'employees' },
    { icon: 'ًں“ٹ', lk: 'i.kpi', href: '/hr/evaluations', module: 'employees' },
    { icon: 'ًںژ“', lk: 'i.training', href: '/hr/training', module: 'employees' },
    { icon: 'ًں‘پï¸ڈ', lk: 'i.face_id', href: '/hr/ai-enrollment', module: 'employees' },
  ]},
  { sk: 's.enterprise', items: [
    { icon: 'ًںڈ—ï¸ڈ', lk: 'i.projects', href: '/enterprise/projects', module: 'projects' },
    { icon: 'ًںڈ¢', lk: 'i.property', href: '/enterprise/property', module: 'legal' },
    { icon: 'ًں“‌', lk: 'i.leases', href: '/rem/leases', module: 'legal' },
    { icon: 'ًں’µ', lk: 'i.prop_inst', href: '/rem/installments', module: 'legal' },
    { icon: 'ًںڑڑ', lk: 'i.fleet', href: '/enterprise/fleet', module: 'legal' },
    { icon: 'â›½', lk: 'i.fleet_fuel', href: '/fleet/fuel', module: 'legal' },
    { icon: 'ًں›£ï¸ڈ', lk: 'i.fleet_trips', href: '/fleet/trips', module: 'legal' },
    { icon: 'ًںڈ«', lk: 'i.schools', href: '/shl/students', module: 'schools' },
    { icon: 'ًں“ڑ', lk: 'i.classes', href: '/shl/classes', module: 'schools' },
    { icon: 'âڑ–ï¸ڈ', lk: 'i.credit', href: '/enterprise/legal', module: 'legal' },
  ]},
  { sk: 's.settings', items: [
    { icon: 'ًںŒگ', lk: 'i.saas', href: '/master-panel', module: 'master-panel' },
    { icon: 'ًںڈ¢', lk: 'i.branches', href: '/branches', module: 'branches' },
    { icon: 'ًں’±', lk: 'i.currencies', href: '/settings/currencies', module: 'currencies' },
    { icon: 'âœ…', lk: 'i.approvals', href: '/settings/approvals', module: 'approvals' },
    { icon: 'ًں’¬', lk: 'i.wa', href: '/whatsapp-hub', module: 'whatsapp' },
    { icon: 'ًں›’', lk: 'i.salla', href: '/settings#salla', module: 'salla' },
    { icon: 'âڑ™ï¸ڈ', lk: 'i.settings', href: '/settings', module: 'settings' },
    { icon: 'ًں›،ï¸ڈ', lk: 'i.audit', href: '/audit-logs', module: 'audit_logs' },
    { icon: 'ًں”§', lk: 'i.support', href: '/maintenance', module: 'maintenance' },
    { icon: 'ًں’“', lk: 'i.sys_health', href: '/sys/health', module: 'maintenance' },
  ]},
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const { getSetting } = useSettings();
  const companyName = getSetting('company_name', 'NamaaSoft ERP');

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

  const handleLogout = () => {
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    localStorage.removeItem('token');
    document.cookie = "auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    localStorage.removeItem('user');
    localStorage.removeItem('lastActivity');
    router.push('/login');
  };

  const [loggedUser, setLoggedUser] = useState<{ fullName: string; role: string }>({ fullName: '', role: '' });
  const [userModules, setUserModules] = useState<string[]>([]);
  const [permLoaded, setPermLoaded] = useState(false);
  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      if (u.fullName) setLoggedUser({ fullName: u.fullName, role: u.role || 'admin' });
      if (u.permissions && Array.isArray(u.permissions)) {
        setUserModules(u.permissions.map((p: { module: string }) => p.module));
      }
    } catch { }
    setPermLoaded(true);
  }, []);

  const isRTL = lang === 'ar' || lang === 'ur';

  const filteredMenu = !permLoaded ? [] : menuItems.map(group => ({
    ...group,
    items: group.items.filter(item => {
      const mod = item.module || '';
      if (mod === 'dashboard' || mod === 'login') return true;
      if (mod === 'master-panel') return loggedUser.role === 'owner';
      if (['admin', 'owner'].includes(loggedUser.role)) return true;
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
        {isOpen ? 'âœ•' : 'âک°'}
      </button>

      {isOpen && (
        <div className="sidebar-overlay" onClick={() => setIsOpen(false)} />
      )}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">ًںڈ¢</div>
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
          >âœ•</button>
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
                  <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.02em' }}>
                    {gl(lang, group.sk)}
                  </span>
                  <span style={{
                    fontSize: '10px',
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}>â–¼</span>
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
                        fontSize: '13px',
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
                      <span style={{ fontSize: '15px', flexShrink: 0 }}>{item.icon}</span>
                      <span style={{ fontSize: '12.5px', lineHeight: '1.4' }}>{gl(lang, item.lk)}</span>
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
              justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: 'white',
              flexShrink: 0
            }}>
              {(loggedUser.fullName || 'U')[0].toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', truncate: true } as any}>
                {loggedUser.fullName || '...'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {loggedUser.role}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%', padding: '8px', background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-sm)',
              color: '#ef4444', cursor: 'pointer', fontSize: '13px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.2)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
          >
            ًںڑھ {gl(lang, 'logout')}
          </button>
        </div>
      </aside>
    </>
  );
}

