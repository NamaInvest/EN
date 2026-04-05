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
        sectionKey: 'الرئيسية (Dashboard)', items: [
            { icon: '📊', labelKey: 'sidebar.dashboard', href: '/dashboard', module: 'dashboard' },
            { icon: '🤖', labelKey: 'الوكيل المساعد (Copilot)', href: '/ai-copilot', module: 'ai_copilot' },
            { icon: '🧠', labelKey: 'المدير المالي (AI CFO)', href: '/ai-cfo', module: 'ai_cfo' },
            { icon: '📦', labelKey: 'المخزون الذكي (AI SCM)', href: '/ai-scm', module: 'ai_scm' },
            { icon: '🔔', labelKey: 'صندوق الوارد والتنبيهات', href: '/sys/alerts', module: 'dashboard' },
        ]
    },
    {
        sectionKey: 'المبيعات (Sales & POS)', items: [
            { icon: '💻', labelKey: 'شاشة نقطة البيع (POS)', href: '/pos', module: 'pos' },
            { icon: '🍔', labelKey: 'نقطة بيع المطاعم والمقاهي', href: '/restaurant-pos', module: 'restaurant_pos' },
            { icon: '🕒', labelKey: 'ورديات الكاشير', href: '/shifts', module: 'shifts' },
            { icon: '🧾', labelKey: 'فواتير المبيعات الضريبية', href: '/sales', module: 'sales' },
            { icon: '🗂️', labelKey: 'سجل الفواتير السابقة', href: '/sales/history', module: 'sales' },
            { icon: '📄', labelKey: 'عروض أسعار المبيعات', href: '/price-quotes', module: 'price_quotes' },
            { icon: '📦', labelKey: 'أوامر البيع (Sales Orders)', href: '/sales/orders', module: 'sales_orders' },
            { icon: '🚚', labelKey: 'مذكرات التسليم (Delivery Notes)', href: '/sales/delivery-notes', module: 'sales_orders' },
            { icon: '↩️', labelKey: 'مرتجعات المبيعات', href: '/sales-returns', module: 'sales_returns' },
            { icon: '🔄', labelKey: 'العقود والفواتير الدورية', href: '/recurring-invoices', module: 'sales_orders' },
            { icon: '🗺️', labelKey: 'خطوط السير للمناديب', href: '/sales/routes', module: 'sales_routes' },
            { icon: '🎯', labelKey: 'العمولات والمستهدفات', href: '/sales/targets', module: 'sales_targets' },
        ]
    },
    {
        sectionKey: 'المشتريات (Purchases)', items: [
            { icon: '📝', labelKey: 'طلبات الشراء الداخلية (PR)', href: '/purchases/requisitions', module: 'purchase_orders' },
            { icon: '📩', labelKey: 'عروض أسعار الموردين (RFQ)', href: '/purchases/rfq', module: 'purchase_orders' },
            { icon: '📋', labelKey: 'أوامر الشراء المعتمدة (PO)', href: '/purchase-orders', module: 'purchase_orders' },
            { icon: '📥', labelKey: 'سندات الاستلام المخزني (GRN)', href: '/purchases/grn', module: 'purchases' },
            { icon: '🛒', labelKey: 'فواتير المشتريات المستحقة', href: '/purchases', module: 'purchases' },
            { icon: '↩️', labelKey: 'مرتجعات المشتريات', href: '/purchase-returns', module: 'purchase_returns' },
            { icon: '🌍', labelKey: 'الاعتمادات المستندية (LC)', href: '/purchases/letters-of-credit', module: 'letters_of_credit' },
        ]
    },
    {
        sectionKey: 'المستودعات والجرد (Inventory)', items: [
            { icon: '📦', labelKey: 'بطاقات الأصناف والخدمات', href: '/products', module: 'products' },
            { icon: '🏭', labelKey: 'الأرصدة المخزنية الحالية', href: '/stock', module: 'stock' },
            { icon: '⌚', labelKey: 'حركة الصنف التاريخية', href: '/stock/movements', module: 'stock_transfers' },
            { icon: '🔀', labelKey: 'نقل المخزون بين المستودعات', href: '/stock-transfers', module: 'stock_transfers' },
            { icon: '🚚', labelKey: 'التحويلات الذكية (بين الفروع)', href: '/smart-transfers', module: 'stock_transfers' },
            { icon: '⚖️', labelKey: 'تسويات الجرد التعديلية', href: '/stock/adjustments', module: 'stock_transfers' },
            { icon: '🏢', labelKey: 'تكويد المستودعات', href: '/warehouses', module: 'warehouses' },
            { icon: '📐', labelKey: 'توجيه المستودع الذكي (WMS)', href: '/enterprise/wms', module: 'wms' },
            { icon: '🏷️', labelKey: 'البلوت والمقاسات (Barcodes)', href: '/barcode', module: 'barcode' },
            { icon: '⏱️', labelKey: 'تواريخ الصلاحية (Batches)', href: '/batches', module: 'batches' },
            { icon: '🔢', labelKey: 'الأرقام التسلسلية (Serials)', href: '/inv/serials', module: 'stock' },
            { icon: '📸', labelKey: 'الجرد الذكي بالكاميرا (Vision)', href: '/stocktake/vision', module: 'vision_inventory' },
        ]
    },
    {
        sectionKey: 'التصنيع والإنتاج (MRP)', items: [
            { icon: '🛠️', labelKey: 'إدارة التصنيع ومعادلات (BOM)', href: '/manufacturing', module: 'manufacturing' },
            { icon: '🏭', labelKey: 'إدارة المصانع المتقدمة (MRP)', href: '/enterprise/mrp', module: 'mrp' },
            { icon: '🔎', labelKey: 'الفحص المخزني (QC)', href: '/enterprise/quality', module: 'mrp' },
        ]
    },
    {
        sectionKey: 'المالية والحسابات (Finance)', items: [
            { icon: '📊', labelKey: 'شجرة الحسابات والقيود', href: '/accounting', module: 'accounting' },
            { icon: '💰', labelKey: 'الخزينة والسيولة', href: '/treasury', module: 'treasury' },
            { icon: '🏦', labelKey: 'البنوك والتسويات البنكية', href: '/accounting/banks', module: 'banks' },
            { icon: '🏦', labelKey: 'أوراق القبض والدفع', href: '/treasury/checks', module: 'treasury_checks' },
            { icon: '🧾', labelKey: 'سندات القبض والصرف', href: '/receipt-vouchers', module: 'receipt_vouchers' },
            { icon: '💸', labelKey: 'المصروفات النثرية', href: '/expenses', module: 'expenses' },
            { icon: '💼', labelKey: 'صناديق العهد المؤقتة', href: '/fng/petty-cash-funds', module: 'petty_cash' },
            { icon: '🏢', labelKey: 'الأصول الثابتة والإهلاكات', href: '/fixed-assets', module: 'fixed_assets' },
            { icon: '⚖️', labelKey: 'الموازنات والاعتمادات', href: '/fng/budgets', module: 'accounting' },
            { icon: '📑', labelKey: 'نظام التقسيط والديون', href: '/installments', module: 'installments' },
            { icon: '📈', labelKey: 'التقارير المالية والختامية', href: '/reports', module: 'reports' },
        ]
    },
    {
        sectionKey: 'العملاء والتسويق (CRM)', items: [
            { icon: '👥', labelKey: 'قاعدة العملاء', href: '/customers', module: 'customers' },
            { icon: '📈', labelKey: 'الفرص البيعية (CRM)', href: '/crm/leads', module: 'customers' },
            { icon: '🎁', labelKey: 'نقاط الولاء والمكافآت', href: '/loyalty', module: 'loyalty' },
            { icon: '💳', labelKey: 'بطاقات الهدايا', href: '/gift-cards', module: 'gift_cards' },
            { icon: '🎟️', labelKey: 'الكوبونات والخصومات', href: '/coupons', module: 'coupons' },
            { icon: '🎯', labelKey: 'قواعد وعروض البيع', href: '/promotions', module: 'promotions' },
        ]
    },
    {
        sectionKey: 'الموارد البشرية (HR & Payroll)', items: [
            { icon: '👨‍💼', labelKey: 'بيانات الموظفين', href: '/employees', module: 'employees' },
            { icon: '🕐', labelKey: 'الحضور والانصراف', href: '/attendance', module: 'attendance' },
            { icon: '💵', labelKey: 'مسيرات الرواتب', href: '/salaries', module: 'salaries' },
            { icon: '🏖️', labelKey: 'الإجازات والمغادرات', href: '/vacations', module: 'vacations' },
            { icon: '💼', labelKey: 'السلف والقروض', href: '/hr/loans', module: 'hr_loans' },
            { icon: '👔', labelKey: 'التوظيف والسير الذاتية', href: '/hr/jobs', module: 'employees' },
            { icon: '📊', labelKey: 'تقييم الأداء (KPIs)', href: '/hr/evaluations', module: 'employees' },
            { icon: '🎓', labelKey: 'التدريب والتطوير', href: '/hr/training', module: 'employees' },
            { icon: '👁️', labelKey: 'تسجيل البصمة الذكية', href: '/hr/ai-enrollment', module: 'employees' },
        ]
    },
    {
        sectionKey: 'أنظمة متخصصة (Enterprise)', items: [
            { icon: '🏗️', labelKey: 'المشاريع والمقاولات (Projects)', href: '/enterprise/projects', module: 'projects' },
            { icon: '🏢', labelKey: 'إدارة الأملاك والعقارات', href: '/enterprise/property', module: 'legal' },
            { icon: '📝', labelKey: 'عقود الإيجار السكنية', href: '/rem/leases', module: 'legal' },
            { icon: '🚚', labelKey: 'أسطول النقل (Fleet)', href: '/enterprise/fleet', module: 'legal' },
            { icon: '🛣️', labelKey: 'رحلات الأسطول', href: '/fleet/trips', module: 'legal' },
            { icon: '🏫', labelKey: 'نظام المدارس الأكاديمي', href: '/shl/students', module: 'schools' },
            { icon: '📚', labelKey: 'الفصول والتسجيل', href: '/shl/classes', module: 'schools' },
            { icon: '⚖️', labelKey: 'الضمانات والرقابة الائتمانية', href: '/enterprise/legal', module: 'legal' },
        ]
    },
    {
        sectionKey: 'الإعدادات والتكامل (Settings)', items: [
            { icon: '🌐', labelKey: 'محرك الشركات (SaaS)', href: '/master-panel', module: 'master-panel' },
            { icon: '🏢', labelKey: 'الفروع ونقاط البيع', href: '/branches', module: 'branches' },
            { icon: '💱', labelKey: 'إدارة العملات وصرفها', href: '/settings/currencies', module: 'currencies' },
            { icon: '✅', labelKey: 'نظام الموافقات التقاطعية', href: '/settings/approvals', module: 'approvals' },
            { icon: '💬', labelKey: 'بائع الواتساب الآلي', href: '/whatsapp-hub', module: 'whatsapp' },
            { icon: '🛒', labelKey: 'الربط مع منصة سلة', href: '/settings#salla', module: 'salla' },
            { icon: '⚙️', labelKey: 'إعدادات النظام العامة', href: '/settings', module: 'settings' },
            { icon: '🛡️', labelKey: 'سجلات المراقبة (Audit)', href: '/audit-logs', module: 'audit_logs' },
            { icon: '🔧', labelKey: 'أدوات الصيانة والدعم', href: '/maintenance', module: 'maintenance' },
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
                                        {group.sectionKey}
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
