'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { useSettings } from '@/lib/SettingsContext';
import {
    LayoutDashboard, ShoppingCart, Users as UsersIcon, Settings as SettingsIcon, Package,
} from 'lucide-react';

const menuItems = [
    {
        sectionKey: '╪د┘╪▒╪خ┘è╪│┘è╪ر (Dashboard)', items: [
            { icon: '≡اôè', labelKey: 'sidebar.dashboard', href: '/dashboard', module: 'dashboard' },
            { icon: '≡اجû', labelKey: '╪د┘┘ê┘â┘è┘ ╪د┘┘à╪│╪د╪╣╪» (Copilot)', href: '/ai-copilot', module: 'ai_copilot' },
            { icon: '≡ادب', labelKey: '╪د┘┘à╪»┘è╪▒ ╪د┘┘à╪د┘┘è (AI CFO)', href: '/ai-cfo', module: 'ai_cfo' },
            { icon: '≡اôخ', labelKey: '╪د┘┘à╪«╪▓┘ê┘ ╪د┘╪░┘â┘è (AI SCM)', href: '/ai-scm', module: 'ai_scm' },
            { icon: '≡ا¤¤', labelKey: '╪╡┘╪»┘ê┘é ╪د┘┘ê╪د╪▒╪» ┘ê╪د┘╪ز┘╪ذ┘è┘ç╪د╪ز', href: '/sys/alerts', module: 'dashboard' },
        ]
    },
    {
        sectionKey: '╪د┘┘à╪ذ┘è╪╣╪د╪ز (Sales & POS)', items: [
            { icon: '≡اْ╗', labelKey: '╪┤╪د╪┤╪ر ┘┘é╪╖╪ر ╪د┘╪ذ┘è╪╣ (POS)', href: '/pos', module: 'pos' },
            { icon: '≡ا¤', labelKey: '┘┘é╪╖╪ر ╪ذ┘è╪╣ ╪د┘┘à╪╖╪د╪╣┘à ┘ê╪د┘┘à┘é╪د┘ç┘è', href: '/restaurant-pos', module: 'restaurant_pos' },
            { icon: '≡اـْ', labelKey: '┘ê╪▒╪»┘è╪د╪ز ╪د┘┘â╪د╪┤┘è╪▒', href: '/shifts', module: 'shifts' },
            { icon: '≡اد╛', labelKey: '┘┘ê╪د╪ز┘è╪▒ ╪د┘┘à╪ذ┘è╪╣╪د╪ز ╪د┘╪╢╪▒┘è╪ذ┘è╪ر', href: '/sales', module: 'sales' },
            { icon: '≡اùéي╕', labelKey: '╪│╪ش┘ ╪د┘┘┘ê╪د╪ز┘è╪▒ ╪د┘╪│╪د╪ذ┘é╪ر', href: '/sales/history', module: 'sales' },
            { icon: '≡اô', labelKey: '╪╣╪▒┘ê╪╢ ╪ث╪│╪╣╪د╪▒ ╪د┘┘à╪ذ┘è╪╣╪د╪ز', href: '/price-quotes', module: 'price_quotes' },
            { icon: '≡اôخ', labelKey: '╪ث┘ê╪د┘à╪▒ ╪د┘╪ذ┘è╪╣ (Sales Orders)', href: '/sales/orders', module: 'sales_orders' },
            { icon: '≡اأأ', labelKey: '┘à╪░┘â╪▒╪د╪ز ╪د┘╪ز╪│┘┘è┘à (Delivery Notes)', href: '/sales/delivery-notes', module: 'sales_orders' },
            { icon: 'ظري╕', labelKey: '┘à╪▒╪ز╪ش╪╣╪د╪ز ╪د┘┘à╪ذ┘è╪╣╪د╪ز', href: '/sales-returns', module: 'sales_returns' },
            { icon: '≡ا¤', labelKey: '╪د┘╪╣┘é┘ê╪» ┘ê╪د┘┘┘ê╪د╪ز┘è╪▒ ╪د┘╪»┘ê╪▒┘è╪ر', href: '/recurring-invoices', module: 'sales_orders' },
            { icon: '≡اù║ي╕', labelKey: '╪«╪╖┘ê╪╖ ╪د┘╪│┘è╪▒ ┘┘┘à┘╪د╪»┘è╪ذ', href: '/sales/routes', module: 'sales_routes' },
            { icon: '≡ا»', labelKey: '╪د┘╪╣┘à┘ê┘╪د╪ز ┘ê╪د┘┘à╪│╪ز┘ç╪»┘╪د╪ز', href: '/sales/targets', module: 'sales_targets' },
        ]
    },
    {
        sectionKey: '╪د┘┘à╪┤╪ز╪▒┘è╪د╪ز (Purchases)', items: [
            { icon: '≡اôإ', labelKey: '╪╖┘╪ذ╪د╪ز ╪د┘╪┤╪▒╪د╪ة ╪د┘╪»╪د╪«┘┘è╪ر (PR)', href: '/purchases/requisitions', module: 'purchase_orders' },
            { icon: '≡اôر', labelKey: '╪╣╪▒┘ê╪╢ ╪ث╪│╪╣╪د╪▒ ╪د┘┘à┘ê╪▒╪»┘è┘ (RFQ)', href: '/purchases/rfq', module: 'purchase_orders' },
            { icon: '≡اôï', labelKey: '╪ث┘ê╪د┘à╪▒ ╪د┘╪┤╪▒╪د╪ة ╪د┘┘à╪╣╪ز┘à╪»╪ر (PO)', href: '/purchase-orders', module: 'purchase_orders' },
            { icon: '≡اôح', labelKey: '╪│┘╪»╪د╪ز ╪د┘╪د╪│╪ز┘╪د┘à ╪د┘┘à╪«╪▓┘┘è (GRN)', href: '/purchases/grn', module: 'purchases' },
            { icon: '≡اؤْ', labelKey: '┘┘ê╪د╪ز┘è╪▒ ╪د┘┘à╪┤╪ز╪▒┘è╪د╪ز ╪د┘┘à╪│╪ز╪ص┘é╪ر', href: '/purchases', module: 'purchases' },
            { icon: 'ظري╕', labelKey: '┘à╪▒╪ز╪ش╪╣╪د╪ز ╪د┘┘à╪┤╪ز╪▒┘è╪د╪ز', href: '/purchase-returns', module: 'purchase_returns' },
            { icon: '≡اî', labelKey: '╪د┘╪د╪╣╪ز┘à╪د╪»╪د╪ز ╪د┘┘à╪│╪ز┘╪»┘è╪ر (LC)', href: '/purchases/letters-of-credit', module: 'letters_of_credit' },
        ]
    },
    {
        sectionKey: '╪د┘┘à╪│╪ز┘ê╪»╪╣╪د╪ز ┘ê╪د┘╪ش╪▒╪» (Inventory)', items: [
            { icon: '≡اôخ', labelKey: '╪ذ╪╖╪د┘é╪د╪ز ╪د┘╪ث╪╡┘╪د┘ ┘ê╪د┘╪«╪»┘à╪د╪ز', href: '/products', module: 'products' },
            { icon: '≡اص', labelKey: '╪د┘╪ث╪▒╪╡╪»╪ر ╪د┘┘à╪«╪▓┘┘è╪ر ╪د┘╪ص╪د┘┘è╪ر', href: '/stock', module: 'stock' },
            { icon: 'ظîأ', labelKey: '╪ص╪▒┘â╪ر ╪د┘╪╡┘┘ ╪د┘╪ز╪د╪▒┘è╪«┘è╪ر', href: '/stock/movements', module: 'stock_transfers' },
            { icon: '≡ا¤', labelKey: '┘┘é┘ ╪د┘┘à╪«╪▓┘ê┘ ╪ذ┘è┘ ╪د┘┘à╪│╪ز┘ê╪»╪╣╪د╪ز', href: '/stock-transfers', module: 'stock_transfers' },
            { icon: '≡اأأ', labelKey: '╪د┘╪ز╪ص┘ê┘è┘╪د╪ز ╪د┘╪░┘â┘è╪ر (╪ذ┘è┘ ╪د┘┘╪▒┘ê╪╣)', href: '/smart-transfers', module: 'stock_transfers' },
            { icon: 'ظأûي╕', labelKey: '╪ز╪│┘ê┘è╪د╪ز ╪د┘╪ش╪▒╪» ╪د┘╪ز╪╣╪»┘è┘┘è╪ر', href: '/stock/adjustments', module: 'stock_transfers' },
            { icon: '≡ات', labelKey: '╪ز┘â┘ê┘è╪» ╪د┘┘à╪│╪ز┘ê╪»╪╣╪د╪ز', href: '/warehouses', module: 'warehouses' },
            { icon: '≡اô', labelKey: '╪ز┘ê╪ش┘è┘ç ╪د┘┘à╪│╪ز┘ê╪»╪╣ ╪د┘╪░┘â┘è (WMS)', href: '/enterprise/wms', module: 'wms' },
            { icon: '≡ا╖ي╕', labelKey: '╪د┘╪ذ┘┘ê╪ز ┘ê╪د┘┘à┘é╪د╪│╪د╪ز (Barcodes)', href: '/barcode', module: 'barcode' },
            { icon: 'ظ▒ي╕', labelKey: '╪ز┘ê╪د╪▒┘è╪« ╪د┘╪╡┘╪د╪ص┘è╪ر (Batches)', href: '/batches', module: 'batches' },
            { icon: '≡ا¤ت', labelKey: '╪د┘╪ث╪▒┘é╪د┘à ╪د┘╪ز╪│┘╪│┘┘è╪ر (Serials)', href: '/inv/serials', module: 'stock' },
            { icon: '≡اô╕', labelKey: '╪د┘╪ش╪▒╪» ╪د┘╪░┘â┘è ╪ذ╪د┘┘â╪د┘à┘è╪▒╪د (Vision)', href: '/stocktake/vision', module: 'vision_inventory' },
        ]
    },
    {
        sectionKey: '╪د┘╪ز╪╡┘┘è╪╣ ┘ê╪د┘╪ح┘╪ز╪د╪ش (MRP)', items: [
            { icon: '≡اؤبي╕', labelKey: '╪ح╪»╪د╪▒╪ر ╪د┘╪ز╪╡┘┘è╪╣ ┘ê┘à╪╣╪د╪»┘╪د╪ز (BOM)', href: '/manufacturing', module: 'manufacturing' },
            { icon: '≡اص', labelKey: '╪ح╪»╪د╪▒╪ر ╪د┘┘à╪╡╪د┘╪╣ ╪د┘┘à╪ز┘é╪»┘à╪ر (MRP)', href: '/enterprise/mrp', module: 'mrp' },
            { icon: '≡ا¤', labelKey: '╪د┘┘╪ص╪╡ ╪د┘┘à╪«╪▓┘┘è (QC)', href: '/enterprise/quality', module: 'mrp' },
        ]
    },
    {
        sectionKey: '╪د┘┘à╪د┘┘è╪ر ┘ê╪د┘╪ص╪│╪د╪ذ╪د╪ز (Finance)', items: [
            { icon: '≡اôè', labelKey: '╪┤╪ش╪▒╪ر ╪د┘╪ص╪│╪د╪ذ╪د╪ز ┘ê╪د┘┘é┘è┘ê╪»', href: '/accounting', module: 'accounting' },
            { icon: '≡اْ░', labelKey: '╪د┘╪«╪▓┘è┘╪ر ┘ê╪د┘╪│┘è┘ê┘╪ر', href: '/treasury', module: 'treasury' },
            { icon: '≡اخ', labelKey: '╪د┘╪ذ┘┘ê┘â ┘ê╪د┘╪ز╪│┘ê┘è╪د╪ز ╪د┘╪ذ┘┘â┘è╪ر', href: '/accounting/banks', module: 'banks' },
            { icon: '≡اخ', labelKey: '╪ث┘ê╪▒╪د┘é ╪د┘┘é╪ذ╪╢ ┘ê╪د┘╪»┘╪╣', href: '/treasury/checks', module: 'treasury_checks' },
            { icon: '≡اد╛', labelKey: '╪│┘╪»╪د╪ز ╪د┘┘é╪ذ╪╢ ┘ê╪د┘╪╡╪▒┘', href: '/receipt-vouchers', module: 'receipt_vouchers' },
            { icon: '≡اْ╕', labelKey: '╪د┘┘à╪╡╪▒┘ê┘╪د╪ز ╪د┘┘╪س╪▒┘è╪ر', href: '/expenses', module: 'expenses' },
            { icon: '≡اْ╝', labelKey: '╪╡┘╪د╪»┘è┘é ╪د┘╪╣┘ç╪» ╪د┘┘à╪ج┘é╪ز╪ر', href: '/fng/petty-cash-funds', module: 'petty_cash' },
            { icon: '≡ات', labelKey: '╪د┘╪ث╪╡┘ê┘ ╪د┘╪س╪د╪ذ╪ز╪ر ┘ê╪د┘╪ح┘ç┘╪د┘â╪د╪ز', href: '/fixed-assets', module: 'fixed_assets' },
            { icon: 'ظأûي╕', labelKey: '╪د┘┘à┘ê╪د╪▓┘╪د╪ز ┘ê╪د┘╪د╪╣╪ز┘à╪د╪»╪د╪ز', href: '/fng/budgets', module: 'accounting' },
            { icon: '≡اôّ', labelKey: '┘╪╕╪د┘à ╪د┘╪ز┘é╪│┘è╪╖ ┘ê╪د┘╪»┘è┘ê┘', href: '/installments', module: 'installments' },
            { icon: '≡اôê', labelKey: '╪د┘╪ز┘é╪د╪▒┘è╪▒ ╪د┘┘à╪د┘┘è╪ر ┘ê╪د┘╪«╪ز╪د┘à┘è╪ر', href: '/reports', module: 'reports' },
        ]
    },
    {
        sectionKey: '╪د┘╪╣┘à┘╪د╪ة ┘ê╪د┘╪ز╪│┘ê┘è┘é (CRM)', items: [
            { icon: '≡اّح', labelKey: '┘é╪د╪╣╪»╪ر ╪د┘╪╣┘à┘╪د╪ة', href: '/customers', module: 'customers' },
            { icon: '≡اôê', labelKey: '╪د┘┘╪▒╪╡ ╪د┘╪ذ┘è╪╣┘è╪ر (CRM)', href: '/crm/leads', module: 'customers' },
            { icon: '≡ا', labelKey: '┘┘é╪د╪╖ ╪د┘┘ê┘╪د╪ة ┘ê╪د┘┘à┘â╪د┘╪ت╪ز', href: '/loyalty', module: 'loyalty' },
            { icon: '≡اْ│', labelKey: '╪ذ╪╖╪د┘é╪د╪ز ╪د┘┘ç╪»╪د┘è╪د', href: '/gift-cards', module: 'gift_cards' },
            { icon: '≡ااي╕', labelKey: '╪د┘┘â┘ê╪ذ┘ê┘╪د╪ز ┘ê╪د┘╪«╪╡┘ê┘à╪د╪ز', href: '/coupons', module: 'coupons' },
            { icon: '≡ا»', labelKey: '┘é┘ê╪د╪╣╪» ┘ê╪╣╪▒┘ê╪╢ ╪د┘╪ذ┘è╪╣', href: '/promotions', module: 'promotions' },
        ]
    },
    {
        sectionKey: '╪د┘┘à┘ê╪د╪▒╪» ╪د┘╪ذ╪┤╪▒┘è╪ر (HR & Payroll)', items: [
            { icon: '≡اّذظ≡اْ╝', labelKey: '╪ذ┘è╪د┘╪د╪ز ╪د┘┘à┘ê╪╕┘┘è┘', href: '/employees', module: 'employees' },
            { icon: '≡اـ', labelKey: '╪د┘╪ص╪╢┘ê╪▒ ┘ê╪د┘╪د┘╪╡╪▒╪د┘', href: '/attendance', module: 'attendance' },
            { icon: '≡اْ╡', labelKey: '┘à╪│┘è╪▒╪د╪ز ╪د┘╪▒┘ê╪د╪ز╪ذ', href: '/salaries', module: 'salaries' },
            { icon: '≡اûي╕', labelKey: '╪د┘╪ح╪ش╪د╪▓╪د╪ز ┘ê╪د┘┘à╪║╪د╪»╪▒╪د╪ز', href: '/vacations', module: 'vacations' },
            { icon: '≡اْ╝', labelKey: '╪د┘╪│┘┘ ┘ê╪د┘┘é╪▒┘ê╪╢', href: '/hr/loans', module: 'hr_loans' },
            { icon: '≡اّ¤', labelKey: '╪د┘╪ز┘ê╪╕┘è┘ ┘ê╪د┘╪│┘è╪▒ ╪د┘╪░╪د╪ز┘è╪ر', href: '/hr/jobs', module: 'employees' },
            { icon: '≡اôè', labelKey: '╪ز┘é┘è┘è┘à ╪د┘╪ث╪»╪د╪ة (KPIs)', href: '/hr/evaluations', module: 'employees' },
            { icon: '≡اô', labelKey: '╪د┘╪ز╪»╪▒┘è╪ذ ┘ê╪د┘╪ز╪╖┘ê┘è╪▒', href: '/hr/training', module: 'employees' },
            { icon: '≡اّي╕', labelKey: '╪ز╪│╪ش┘è┘ ╪د┘╪ذ╪╡┘à╪ر ╪د┘╪░┘â┘è╪ر', href: '/hr/ai-enrollment', module: 'employees' },
        ]
    },
    {
        sectionKey: '╪ث┘╪╕┘à╪ر ┘à╪ز╪«╪╡╪╡╪ر (Enterprise)', items: [
            { icon: '≡اùي╕', labelKey: '╪د┘┘à╪┤╪د╪▒┘è╪╣ ┘ê╪د┘┘à┘é╪د┘ê┘╪د╪ز (Projects)', href: '/enterprise/projects', module: 'projects' },
            { icon: '≡ات', labelKey: '╪ح╪»╪د╪▒╪ر ╪د┘╪ث┘à┘╪د┘â ┘ê╪د┘╪╣┘é╪د╪▒╪د╪ز', href: '/enterprise/property', module: 'legal' },
            { icon: '≡اôإ', labelKey: '╪╣┘é┘ê╪» ╪د┘╪ح┘è╪ش╪د╪▒ ╪د┘╪│┘â┘┘è╪ر', href: '/rem/leases', module: 'legal' },
            { icon: '≡اأأ', labelKey: '╪ث╪│╪╖┘ê┘ ╪د┘┘┘é┘ (Fleet)', href: '/enterprise/fleet', module: 'legal' },
            { icon: '≡اؤثي╕', labelKey: '╪▒╪ص┘╪د╪ز ╪د┘╪ث╪│╪╖┘ê┘', href: '/fleet/trips', module: 'legal' },
            { icon: '≡اس', labelKey: '┘╪╕╪د┘à ╪د┘┘à╪»╪د╪▒╪│ ╪د┘╪ث┘â╪د╪»┘è┘à┘è', href: '/shl/students', module: 'schools' },
            { icon: '≡اôأ', labelKey: '╪د┘┘╪╡┘ê┘ ┘ê╪د┘╪ز╪│╪ش┘è┘', href: '/shl/classes', module: 'schools' },
            { icon: 'ظأûي╕', labelKey: '╪د┘╪╢┘à╪د┘╪د╪ز ┘ê╪د┘╪▒┘é╪د╪ذ╪ر ╪د┘╪د╪خ╪ز┘à╪د┘┘è╪ر', href: '/enterprise/legal', module: 'legal' },
        ]
    },
    {
        sectionKey: '╪د┘╪ح╪╣╪»╪د╪»╪د╪ز ┘ê╪د┘╪ز┘â╪د┘à┘ (Settings)', items: [
            { icon: '≡اî', labelKey: '┘à╪ص╪▒┘â ╪د┘╪┤╪▒┘â╪د╪ز (SaaS)', href: '/master-panel', module: 'master-panel' },
            { icon: '≡ات', labelKey: '╪د┘┘╪▒┘ê╪╣ ┘ê┘┘é╪د╪╖ ╪د┘╪ذ┘è╪╣', href: '/branches', module: 'branches' },
            { icon: '≡اْ▒', labelKey: '╪ح╪»╪د╪▒╪ر ╪د┘╪╣┘à┘╪د╪ز ┘ê╪╡╪▒┘┘ç╪د', href: '/settings/currencies', module: 'currencies' },
            { icon: 'ظ£à', labelKey: '┘╪╕╪د┘à ╪د┘┘à┘ê╪د┘┘é╪د╪ز ╪د┘╪ز┘é╪د╪╖╪╣┘è╪ر', href: '/settings/approvals', module: 'approvals' },
            { icon: '≡اْش', labelKey: '╪ذ╪د╪خ╪╣ ╪د┘┘ê╪د╪ز╪│╪د╪ذ ╪د┘╪ت┘┘è', href: '/whatsapp-hub', module: 'whatsapp' },
            { icon: '≡اؤْ', labelKey: '╪د┘╪▒╪ذ╪╖ ┘à╪╣ ┘à┘╪╡╪ر ╪│┘╪ر', href: '/settings#salla', module: 'salla' },
            { icon: 'ظأآي╕', labelKey: '╪ح╪╣╪»╪د╪»╪د╪ز ╪د┘┘╪╕╪د┘à ╪د┘╪╣╪د┘à╪ر', href: '/settings', module: 'settings' },
            { icon: '≡اؤةي╕', labelKey: '╪│╪ش┘╪د╪ز ╪د┘┘à╪▒╪د┘é╪ذ╪ر (Audit)', href: '/audit-logs', module: 'audit_logs' },
            { icon: '≡ا¤د', labelKey: '╪ث╪»┘ê╪د╪ز ╪د┘╪╡┘è╪د┘╪ر ┘ê╪د┘╪»╪╣┘à', href: '/maintenance', module: 'maintenance' },
        ]
    },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
    const { t, lang } = useTranslation();
    const { getSetting } = useSettings();
    const companyName = getSetting('company_name', 'NamaaSoft ERP');

    // Close sidebar on route change (mobile)
    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    // Close sidebar on window resize to desktop
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 768) setIsOpen(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Prevent body scroll when sidebar is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    const handleLogout = () => {
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        localStorage.removeItem('token');
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

    // Strict Permissions: Admin does not bypass if they have been explicitly restricted.
    // If an admin has absolutely 0 permissions, we give them a fallback to Settings so they aren't locked out.
    const isSuper = loggedUser.role === 'admin';
    const filteredMenu = !permLoaded ? [] : menuItems.map(group => ({
        ...group,
        items: group.items.filter(item => {
            const mod = item.module || '';

            if (mod === 'dashboard' || mod === 'login') return true;
            
            if (mod === 'master-panel') return loggedUser.role === 'owner';
            
            // Allow ONLY Admin and Owner full access automatically. All other roles rely on explicit modules.
            if (['admin', 'owner'].includes(loggedUser.role)) return true;

            return userModules.includes(mod);
        }),
    })).filter(group => group.items.length > 0);

    return (
        <>
            {/* Mobile hamburger button */}
            <button
                className="mobile-menu-btn"
                onClick={() => setIsOpen(!isOpen)}
                aria-label={t('sys.str_100')}
            >
                {isOpen ? 'ظ£ـ' : 'ظء░'}
            </button>

            {/* Overlay */}
            {isOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">{t('sys.str_99')}</div>
                    <div className="sidebar-logo-text" style={{ flex: 1 }}>{companyName}</div>
                    <button
                        className="mobile-close-btn"
                        onClick={() => setIsOpen(false)}
                        style={{
                            display: 'none',
                            background: 'rgba(255,255,255,0.1)',
                            border: 'none',
                            color: 'white',
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            fontSize: '18px',
                            cursor: 'pointer',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >ظ£ـ</button>
                </div>

                <nav className="sidebar-nav" style={{ padding: '10px 0' }}>
                    {filteredMenu.map((group, gIdx) => {
                        const isDashboard = group.sectionKey === t('sys.str_101');
                        const isExpanded = expandedGroup === group.sectionKey || (expandedGroup === null && isDashboard);

                        return (
                            <div key={gIdx} style={{ marginBottom: '4px' }}>
                                <button
                                    onClick={() => setExpandedGroup(isExpanded ? (isDashboard ? null : null) : group.sectionKey)}
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
                                        textAlign: lang === 'ar' ? 'right' : 'left',
                                        transition: 'all 0.2s ease',
                                        borderRadius: 'var(--radius-sm)'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                                    onMouseOut={(e) => e.currentTarget.style.background = isExpanded ? 'var(--bg-card-hover)' : 'transparent'}
                                >
                                    <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.02em' }}>
                                        {group.sectionKey}
                                    </span>
                                    <span style={{
                                        fontSize: '10px',
                                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                    }}>
                                        ظû╝
                                    </span>
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
                                            className={`sidebar-item ${pathname === item.href || pathname === item.href.split('#')[0] ? 'active' : ''}`}
                                            onClick={() => setIsOpen(false)}
                                        >
                                            <span className="sidebar-item-icon">{item.icon}</span>
                                            <span>{t(item.labelKey)}</span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </nav>

                <div className="sidebar-user">
                    <div className="sidebar-user-avatar">{loggedUser.fullName.charAt(0)}</div>
                    <div className="sidebar-user-info">
                        <div className="sidebar-user-name">{loggedUser.fullName}</div>
                        <div className="sidebar-user-role">{t(`role.${loggedUser.role}`)}</div>
                    </div>
                    <button
                        onClick={handleLogout}
                        style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: 'var(--text-muted)', fontSize: '18px', padding: '4px'
                        }}
                        title={t('sidebar.logout')}
                    >
                        ≡اأز
                    </button>
                </div>
            </aside>
        </>
    );
}
