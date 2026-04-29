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
                {isOpen ? '✕' : '☰'}
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
                    >✕</button>
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
                                        {t(group.sectionKey)}
                                    </span>
                                    <span style={{
                                        fontSize: '10px',
                                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                    }}>
                                        ▼
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
                        🚪
                    </button>
                </div>
            </aside>
        </>
    );
}
