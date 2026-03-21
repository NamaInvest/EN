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
            { icon: '📊', labelKey: 'sidebar.dashboard', href: '/dashboard', module: 'dashboard' },
        ]
    },
    {
        sectionKey: 'sidebar.sales_purchases', items: [
            { icon: '💻', labelKey: 'شاشة نقطة البيع (POS)', href: '/pos', module: 'pos' },
            { icon: '🍔', labelKey: 'نقطة بيع المطاعم والمقاهي', href: '/restaurant-pos', module: 'restaurant_pos' },
            { icon: '🕒', labelKey: 'ورديات الكاشير', href: '/shifts', module: 'shifts' },
            { icon: '📦', labelKey: 'أوامر البيع (Sales Orders)', href: '/sales/orders', module: 'sales_orders' },
            { icon: '🔄', labelKey: 'العقود والفواتير الدورية', href: '/recurring-invoices', module: 'sales_orders' },
            { icon: '🧾', labelKey: 'sidebar.sales', href: '/sales', module: 'sales' },
            { icon: '🗺️', labelKey: 'خطوط السير', href: '/sales/routes', module: 'sales_routes' },
            { icon: '🎯', labelKey: 'مستهدفات المبيعات', href: '/sales/targets', module: 'sales_targets' },
            { icon: '🛒', labelKey: 'sidebar.purchases', href: '/purchases', module: 'purchases' },
            { icon: '📋', labelKey: 'أوامر الشراء (طلبات)', href: '/purchase-orders', module: 'purchase_orders' },
            { icon: '🌍', labelKey: 'الاعتمادات المستندية', href: '/purchases/letters-of-credit', module: 'letters_of_credit' },
            { icon: '↩️', labelKey: 'sidebar.sales_returns', href: '/sales-returns', module: 'sales_returns' },
            { icon: '↩️', labelKey: 'sidebar.purchase_returns', href: '/purchase-returns', module: 'purchase_returns' },
            { icon: '📋', labelKey: 'sidebar.bookings', href: '/bookings', module: 'bookings' },
            { icon: '📄', labelKey: 'sidebar.price_quotes', href: '/price-quotes', module: 'price_quotes' },
            { icon: '🎟️', labelKey: 'sidebar.coupons', href: '/coupons', module: 'coupons' },
        ]
    },
    {
        sectionKey: 'sidebar.inventory', items: [
            { icon: '📦', labelKey: 'sidebar.products', href: '/products', module: 'products' },
            { icon: '🏭', labelKey: 'sidebar.stock', href: '/stock', module: 'stock' },
            { icon: '🛠️', labelKey: 'إدارة التصنيع (BOM)', href: '/manufacturing', module: 'manufacturing' },
            { icon: '🏢', labelKey: 'sidebar.warehouses', href: '/warehouses', module: 'warehouses' },
            { icon: '🔀', labelKey: 'sidebar.stock_transfers', href: '/stock-transfers', module: 'stock_transfers' },
            { icon: '🚚', labelKey: 'التحويلات الذكية (في الطريق)', href: '/smart-transfers', module: 'stock_transfers' },
            { icon: '🏷️', labelKey: 'sidebar.barcode', href: '/barcode', module: 'barcode' },
            { icon: '⏱️', labelKey: 'sidebar.batches', href: '/batches', module: 'batches' },
        ]
    },
    {
        sectionKey: 'sidebar.parties', items: [
            { icon: '👥', labelKey: 'sidebar.customers', href: '/customers', module: 'customers' },
            { icon: '🎁', labelKey: 'sidebar.loyalty', href: '/loyalty', module: 'loyalty' },
        ]
    },
    {
        sectionKey: 'sidebar.finance', items: [
            { icon: '💰', labelKey: 'sidebar.treasury', href: '/treasury', module: 'treasury' },
            { icon: '🏦', labelKey: 'أوراق القبض والدفع', href: '/treasury/checks', module: 'treasury_checks' },
            { icon: '⚖️', labelKey: 'التسويات البنكية', href: '/treasury/bank-reconciliation', module: 'bank_reconciliation' },
            { icon: '💸', labelKey: 'العهد والمصروفات النثرية', href: '/treasury/petty-cash', module: 'petty_cash' },
            { icon: '🏦', labelKey: 'sidebar.banks', href: '/accounting/banks', module: 'banks' },
            { icon: '🧾', labelKey: 'sidebar.receipt_vouchers', href: '/receipt-vouchers', module: 'receipt_vouchers' },
            { icon: '💸', labelKey: 'sidebar.expenses', href: '/expenses', module: 'expenses' },
            { icon: '📊', labelKey: 'sidebar.reports', href: '/reports', module: 'reports' },
            { icon: '🧠', labelKey: 'المدير المالي (AI CFO)', href: '/ai-cfo', module: 'ai_cfo' },
            { icon: '📑', labelKey: 'sidebar.installments', href: '/installments', module: 'installments' },
            { icon: '💳', labelKey: 'sidebar.gift_cards', href: '/gift-cards', module: 'gift_cards' },
        ]
    },
    {
        sectionKey: 'sidebar.hr', items: [
            { icon: '👨‍💼', labelKey: 'sidebar.employees', href: '/employees', module: 'employees' },
            { icon: '🕐', labelKey: 'sidebar.attendance', href: '/attendance', module: 'attendance' },
            { icon: '💼', labelKey: 'سلف الموظفين', href: '/hr/loans', module: 'hr_loans' },
            { icon: '💵', labelKey: 'sidebar.salaries', href: '/salaries', module: 'salaries' },
            { icon: '🏖️', labelKey: 'sidebar.vacations', href: '/vacations', module: 'vacations' },
        ]
    },
    {
        sectionKey: 'sidebar.integrations', items: [
            { icon: '🤖', labelKey: 'لوحة المبيعات الذكية (AI)', href: '/whatsapp-hub', module: 'whatsapp' },
            { icon: '📨', labelKey: 'sidebar.whatsapp', href: '/settings/whatsapp', module: 'whatsapp' },
            { icon: '🛒', labelKey: 'sidebar.salla', href: '/settings#salla', module: 'salla' },
        ]
    },
    {
        sectionKey: 'sidebar.extras', items: [
            { icon: '🔧', labelKey: 'sidebar.maintenance', href: '/maintenance', module: 'maintenance' },
            { icon: '🎯', labelKey: 'sidebar.promotions', href: '/promotions', module: 'promotions' },
            { icon: '📦', labelKey: 'sidebar.stocktake', href: '/stocktake', module: 'stocktake' },
            { icon: '📸', labelKey: 'الجرد بالذكاء الاصطناعي', href: '/stocktake/vision', module: 'vision_inventory' },
            { icon: '🌐', labelKey: 'محرك الشركات (SaaS)', href: '/master-panel', module: 'master-panel' },
            { icon: '📊', labelKey: 'sidebar.accounting', href: '/accounting', module: 'accounting' },
            { icon: '🏢', labelKey: 'sidebar.fixed_assets', href: '/fixed-assets', module: 'fixed_assets' },
            { icon: '🏢', labelKey: 'sidebar.branches', href: '/branches', module: 'branches' },
            { icon: '💱', labelKey: 'إدارة العملات', href: '/settings/currencies', module: 'currencies' },
            { icon: '✅', labelKey: 'نظام الموافقات', href: '/settings/approvals', module: 'approvals' },
            { icon: '⚙️', labelKey: 'sidebar.settings', href: '/settings', module: 'settings' },
            { icon: '🛡️', labelKey: 'sidebar.audit_logs', href: '/audit-logs', module: 'audit_logs' },
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
    const isSuper = loggedUser.role === 'admin';
    const filteredMenu = !permLoaded ? [] : menuItems.map(group => ({
        ...group,
        items: group.items.filter(item => {
            const mod = item.module || '';

            if (mod === 'dashboard' || mod === 'login') return true;
            
            // Allow ONLY Admin full access automatically. All other roles rely on explicit modules.
            if (['admin'].includes(loggedUser.role)) return true;

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
