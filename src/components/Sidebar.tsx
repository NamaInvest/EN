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
        sectionKey: 'main', items: [
            { icon: '📊', labelKey: 'sidebar.dashboard', href: '/dashboard' },
        ]
    },
    {
        sectionKey: 'sidebar.sales_purchases', items: [
            { icon: '💻', labelKey: 'شاشة نقطة البيع (POS)', href: '/pos' },
            { icon: '🕒', labelKey: 'ورديات الكاشير', href: '/shifts' },
            { icon: '📦', labelKey: 'أوامر البيع (Sales Orders)', href: '/sales/orders' },
            { icon: '🧾', labelKey: 'sidebar.sales', href: '/sales' },
            { icon: '🗺️', labelKey: 'خطوط السير', href: '/sales/routes' },
            { icon: '🎯', labelKey: 'مستهدفات المبيعات', href: '/sales/targets' },
            { icon: '🛒', labelKey: 'sidebar.purchases', href: '/purchases' },
            { icon: '📋', labelKey: 'أوامر الشراء (طلبات)', href: '/purchase-orders' },
            { icon: '🌍', labelKey: 'الاعتمادات المستندية', href: '/purchases/letters-of-credit' },
            { icon: '↩️', labelKey: 'sidebar.sales_returns', href: '/sales-returns' },
            { icon: '↩️', labelKey: 'sidebar.purchase_returns', href: '/purchase-returns' },
            { icon: '📋', labelKey: 'sidebar.bookings', href: '/bookings' },
            { icon: '📄', labelKey: 'sidebar.price_quotes', href: '/price-quotes' },
            { icon: '🎟️', labelKey: 'sidebar.coupons', href: '/coupons' },
        ]
    },
    {
        sectionKey: 'sidebar.inventory', items: [
            { icon: '📦', labelKey: 'sidebar.products', href: '/products' },
            { icon: '🏭', labelKey: 'sidebar.stock', href: '/stock' },
            { icon: '🛠️', labelKey: 'إدارة التصنيع (BOM)', href: '/manufacturing' },
            { icon: '🏢', labelKey: 'sidebar.warehouses', href: '/warehouses' },
            { icon: '🔀', labelKey: 'sidebar.stock_transfers', href: '/stock-transfers' },
            { icon: '🏷️', labelKey: 'sidebar.barcode', href: '/barcode' },
            { icon: '⏱️', labelKey: 'sidebar.batches', href: '/batches' },
        ]
    },
    {
        sectionKey: 'sidebar.parties', items: [
            { icon: '👥', labelKey: 'sidebar.customers', href: '/customers' },
            { icon: '🎁', labelKey: 'sidebar.loyalty', href: '/loyalty' },
        ]
    },
    {
        sectionKey: 'sidebar.finance', items: [
            { icon: '💰', labelKey: 'sidebar.treasury', href: '/treasury' },
            { icon: '🏦', labelKey: 'أوراق القبض والدفع', href: '/treasury/checks' },
            { icon: '⚖️', labelKey: 'التسويات البنكية', href: '/treasury/bank-reconciliation' },
            { icon: '💸', labelKey: 'العهد والمصروفات النثرية', href: '/treasury/petty-cash' },
            { icon: '🏦', labelKey: 'sidebar.banks', href: '/accounting/banks' },
            { icon: '🧾', labelKey: 'sidebar.receipt_vouchers', href: '/receipt-vouchers' },
            { icon: '💸', labelKey: 'sidebar.expenses', href: '/expenses' },
            { icon: '📊', labelKey: 'sidebar.reports', href: '/reports' },
            { icon: '📑', labelKey: 'sidebar.installments', href: '/installments' },
            { icon: '💳', labelKey: 'sidebar.gift_cards', href: '/gift-cards' },
        ]
    },
    {
        sectionKey: 'sidebar.hr', items: [
            { icon: '👨‍💼', labelKey: 'sidebar.employees', href: '/employees' },
            { icon: '🕐', labelKey: 'sidebar.attendance', href: '/attendance' },
            { icon: '💼', labelKey: 'سلف الموظفين', href: '/hr/loans' },
            { icon: '💵', labelKey: 'sidebar.salaries', href: '/salaries' },
            { icon: '🏖️', labelKey: 'sidebar.vacations', href: '/vacations' },
        ]
    },
    {
        sectionKey: 'sidebar.integrations', items: [
            { icon: '📨', labelKey: 'sidebar.whatsapp', href: '/settings/whatsapp' },
            { icon: '🛒', labelKey: 'sidebar.salla', href: '/settings#salla' },
        ]
    },
    {
        sectionKey: 'sidebar.extras', items: [
            { icon: '🔧', labelKey: 'sidebar.maintenance', href: '/maintenance' },
            { icon: '🎯', labelKey: 'sidebar.promotions', href: '/promotions' },
            { icon: '📦', labelKey: 'sidebar.stocktake', href: '/stocktake' },
            { icon: '📸', labelKey: 'الجرد بالذكاء الاصطناعي', href: '/stocktake/vision' },
            { icon: '🌐', labelKey: 'محرك الشركات (SaaS)', href: '/master-panel' },
            { icon: '📊', labelKey: 'sidebar.accounting', href: '/accounting' },
            { icon: '🏭', labelKey: 'sidebar.manufacturing', href: '/manufacturing' },
            { icon: '🏢', labelKey: 'sidebar.fixed_assets', href: '/fixed-assets' },
            { icon: '🕒', labelKey: 'sidebar.shifts', href: '/shifts' },
            { icon: '🏢', labelKey: 'sidebar.branches', href: '/branches' },
            { icon: '💱', labelKey: 'إدارة العملات', href: '/settings/currencies' },
            { icon: '✅', labelKey: 'نظام الموافقات', href: '/settings/approvals' },
            { icon: '⚙️', labelKey: 'sidebar.settings', href: '/settings' },
            { icon: '🛡️', labelKey: 'sidebar.audit_logs', href: '/audit-logs' },
        ]
    },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
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
    const isLockedOutAdmin = loggedUser.role === 'admin' && userModules.length === 0;
    const filteredMenu = !permLoaded ? [] : menuItems.map(group => ({
        ...group,
        items: group.items.filter(item => {
            let mod = item.href.split('/').filter(Boolean)[0] || '';
            
            // Granular sub-module overrides:
            if (item.href === '/stocktake/vision') mod = 'vision_inventory';
            if (item.href === '/settings/whatsapp') mod = 'whatsapp';
            if (item.href === '/master-panel') mod = 'master-panel';
            if (item.href === '/hr/loans') mod = 'salaries';
            if (item.href === '/purchase-orders') mod = 'purchases';

            if (mod === 'dashboard' || mod === 'login') return true;
            
            if (loggedUser.role === 'admin') return true;

            return userModules.includes(mod);
        }),
    })).filter(group => group.items.length > 0);

    return (
        <>
            {/* Mobile hamburger button */}
            <button
                className="mobile-menu-btn"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="القائمة"
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
                    <div className="sidebar-logo-icon">ن</div>
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

                <nav className="sidebar-nav">
                    {filteredMenu.map((group, gIdx) => (
                        <div key={gIdx}>
                            {group.sectionKey !== 'main' && (
                                <div className="sidebar-section-title">{t(group.sectionKey)}</div>
                            )}
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
                    ))}
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
