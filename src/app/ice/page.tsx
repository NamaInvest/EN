'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
    Users, Zap, Search, RefreshCw, ExternalLink, 
    Database, Mail, Hash, Clock, CreditCard, Package, 
    FileText, Settings, Globe, BarChart3,
    Smartphone, Bot, Rocket, Gem, Building2,
    Sun, Moon, Sparkles, LayoutDashboard, ChevronDown, Trash2,
    Pencil, Save, Key, Lock, Check, X, Plus, Cloud, Monitor
} from 'lucide-react';
import Link from 'next/link';
import featuresList from '@/lib/featuresList.json';
type ThemeMode = 'light' | 'dark' | 'glass';

interface Tenant {
    id: number; subdomain: string; dbName: string; domainUrl: string;
    companyNameAr: string; companyNameEn: string; email: string; vatNumber: string;
    status: string; subscriptionStatus: string; plan: string;
    trialEndsAt: string | null; daysRemaining: number; isExpired: boolean;
    invoiceCount: number; invoiceQuota: number;
    productCount: number; productQuota: number;
    userCount: number; userQuota: number;
    hiddenModules: string[]; createdAt: string;
}

const ALL_SECTIONS = [
    { key: 'Sales',         icon: <CreditCard className="w-4 h-4" />, label: 'المبيعات',             color: 'text-blue-600',    bg: 'bg-blue-50',
      subs: [{ key: 'Sales.Invoices', label: 'فواتير المبيعات' }, { key: 'Sales.Quotes', label: 'عروض الأسعار' }, { key: 'Sales.Returns', label: 'المرتجعات' }] },
    { key: 'POS',           icon: <Smartphone className="w-4 h-4" />, label: 'نقطة البيع',           color: 'text-emerald-600', bg: 'bg-emerald-50',
      subs: [{ key: 'POS.Main', label: 'شاشة البيع' }, { key: 'POS.Restaurants', label: 'المطاعم' }, { key: 'POS.Shifts', label: 'الورديات' }] },
    { key: 'Purchases',     icon: <Package className="w-4 h-4" />,    label: 'المشتريات',             color: 'text-amber-600',   bg: 'bg-amber-50',
      subs: [{ key: 'Purchases.Invoices', label: 'فواتير المشتريات' }, { key: 'Purchases.Orders', label: 'أوامر الشراء' }, { key: 'Purchases.Returns', label: 'مرتجعات المشتريات' }] },
    { key: 'Inventory',     icon: <Database className="w-4 h-4" />,   label: 'المخزون والمستودعات',   color: 'text-indigo-600',  bg: 'bg-indigo-50',
      subs: [{ key: 'Inventory.Products', label: 'الأصناف' }, { key: 'Inventory.Warehouses', label: 'المستودعات' }, { key: 'Inventory.Stocktaking', label: 'الجرد' }, { key: 'Inventory.Barcode', label: 'الباركود' }] },
    { key: 'Finance',       icon: <BarChart3 className="w-4 h-4" />,  label: 'المالية والحسابات',     color: 'text-cyan-600',    bg: 'bg-cyan-50',
      subs: [{ key: 'Finance.Accounting', label: 'دفتر الأستاذ' }, { key: 'Finance.Treasury', label: 'الخزينة' }, { key: 'Finance.Assets', label: 'الأصول الثابتة' }] },
    { key: 'HR',            icon: <Users className="w-4 h-4" />,      label: 'الموارد البشرية',       color: 'text-rose-600',    bg: 'bg-rose-50',
      subs: [{ key: 'HR.Employees', label: 'الموظفون' }, { key: 'HR.Payroll', label: 'الرواتب' }, { key: 'HR.Attendance', label: 'الحضور والانصراف' }, { key: 'HR.Leaves', label: 'الإجازات' }] },
    { key: 'Manufacturing', icon: <Rocket className="w-4 h-4" />,     label: 'التصنيع والإنتاج',      color: 'text-orange-600',  bg: 'bg-orange-50',
      subs: [{ key: 'Manufacturing.BOM', label: 'قائمة المواد (BOM)' }, { key: 'Manufacturing.MRP', label: 'تخطيط الإنتاج (MRP)' }, { key: 'Manufacturing.Quality', label: 'ضبط الجودة' }] },
    { key: 'CRM',           icon: <Bot className="w-4 h-4" />,        label: 'العملاء والتسويق',      color: 'text-violet-600',  bg: 'bg-violet-50',
      subs: [{ key: 'CRM.Customers', label: 'إدارة العملاء' }, { key: 'CRM.Loyalty', label: 'برنامج الولاء' }, { key: 'CRM.Coupons', label: 'الكوبونات' }, { key: 'CRM.Bookings', label: 'الحجوزات' }] },
    { key: 'Enterprise',    icon: <Globe className="w-4 h-4" />,      label: 'الأنظمة المتخصصة',      color: 'text-sky-600',     bg: 'bg-sky-50',
      subs: [{ key: 'Enterprise.Projects', label: 'إدارة المشاريع' }, { key: 'Enterprise.RealEstate', label: 'العقارات' }, { key: 'Enterprise.Fleet', label: 'الأسطول' }, { key: 'Enterprise.Schools', label: 'المدارس' }] },
    { key: 'AI',            icon: <Bot className="w-4 h-4" />,        label: 'الذكاء الاصطناعي',      color: 'text-purple-600',  bg: 'bg-purple-50',
      subs: [{ key: 'AI.Copilot', label: 'AI Copilot' }, { key: 'AI.CFO', label: 'CFO الذكي' }, { key: 'AI.SCM', label: 'سلسلة التوريد الذكية' }] },
    { key: 'Reports',       icon: <FileText className="w-4 h-4" />,   label: 'التقارير',              color: 'text-slate-600',   bg: 'bg-slate-50',
      subs: [{ key: 'Reports.Sales', label: 'تقارير المبيعات' }, { key: 'Reports.Finance', label: 'التقارير المالية' }, { key: 'Reports.Inventory', label: 'تقارير المخزون' }] },
    { key: 'Settings',      icon: <Settings className="w-4 h-4" />,   label: 'الإعدادات',             color: 'text-pink-600',    bg: 'bg-pink-50',
      subs: [{ key: 'Settings.Branches', label: 'الفروع' }, { key: 'Settings.Currencies', label: 'العملات' }, { key: 'Settings.Approvals', label: 'الموافقات' }, { key: 'Settings.WhatsApp', label: 'تكامل واتساب' }] },
];


// ── Plan Configurations ──
const PLAN_CONFIGS: Record<string, {
    label: string; labelEn: string; price: string; priceYearly: string; color: string; colorBg: string;
    invoiceQuota: number; productQuota: number; userQuota: number;
    allowedModules: string[]; features: string[];
}> = {
    free: {
        label: 'تجريبي', labelEn: 'Free Trial', price: 'مجاني / 7 أيام', priceYearly: '', color: 'bg-slate-500', colorBg: 'bg-slate-50',
        invoiceQuota: 30, productQuota: 1000, userQuota: 1,
        allowedModules: ['Sales', 'POS', 'Purchases', 'Inventory', 'Finance', 'HR', 'Manufacturing', 'CRM', 'Enterprise', 'AI', 'Reports', 'Settings'],
        features: ['30 فاتورة', '1,000 صنف', 'مستخدم واحد', 'كل الأقسام مفتوحة للتقييم', 'ZATCA Phase 1 (QR)'],
    },
    basic: {
        label: 'أساسي', labelEn: 'Basic', price: '99 ر.س / شهرياً', priceYearly: '950 ر.س / سنوياً', color: 'bg-indigo-600', colorBg: 'bg-indigo-50',
        invoiceQuota: 999999, productQuota: 19900, userQuota: 3,
        allowedModules: ['Sales', 'POS', 'Purchases', 'Inventory', 'Finance', 'CRM', 'Reports', 'Settings'],
        features: ['فواتير غير محدودة', '19,900 صنف', '3 مستخدمين', 'تقارير متقدمة', 'ZATCA Phase 1 + 2', 'دعم بريد إلكتروني'],
    },
    professional: {
        label: 'احترافي', labelEn: 'Professional', price: '299 ر.س / شهرياً', priceYearly: '2,870 ر.س / سنوياً', color: 'bg-purple-600', colorBg: 'bg-purple-50',
        invoiceQuota: 999999, productQuota: 999999, userQuota: 10,
        allowedModules: ['Sales', 'POS', 'Purchases', 'Inventory', 'Finance', 'HR', 'Manufacturing', 'CRM', 'AI', 'Reports', 'Settings'],
        features: ['فواتير غير محدودة', 'أصناف غير محدودة', '10 مستخدمين', 'تقارير + BI', 'ZATCA Phase 2 كاملة', 'دعم أولوية 24/7', 'نسخ احتياطية يومية'],
    },
    enterprise: {
        label: 'مؤسسات', labelEn: 'Enterprise', price: 'تواصل معنا', priceYearly: 'تواصل معنا', color: 'bg-slate-900', colorBg: 'bg-slate-100',
        invoiceQuota: 999999, productQuota: 999999, userQuota: 999999,
        allowedModules: ['Sales', 'POS', 'Purchases', 'Inventory', 'Finance', 'HR', 'Manufacturing', 'CRM', 'Enterprise', 'AI', 'Reports', 'Settings'],
        features: ['كل شيء في الاحترافي', 'مستخدمون غير محدودون', 'فروع متعددة', 'تكامل API مخصص', 'SLA 99.9%', 'مدير حساب مخصص'],
    },
};

const PLANS = [
    { value: 'free',         label: 'تجريبي',   color: 'bg-slate-500' },
    { value: 'basic',        label: 'أساسي',    color: 'bg-indigo-600' },
    { value: 'professional', label: 'احترافي',  color: 'bg-purple-600' },
    { value: 'enterprise',   label: 'مؤسسات',   color: 'bg-slate-900' },
];

const THEMES = {
    light: {
        bg:          'bg-slate-100',
        nav:         'bg-white border-slate-200 shadow-sm',
        sidebar:     'bg-white border-l border-slate-200',
        content:     'bg-slate-100',
        card:        'bg-white border border-slate-200 shadow-sm',
        rowBg:       'bg-white border border-slate-100',
        rowHover:    'hover:border-indigo-200 hover:shadow-sm',
        text:        'text-slate-900',
        textMuted:   'text-slate-500',
        input:       'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white',
        tabsWrap:    'bg-slate-50 border-slate-200',
        itemHover:   'hover:bg-slate-50',
        itemActive:  'bg-indigo-50 border-l-4 border-indigo-500',
    },
    dark: {
        bg:          'bg-slate-950',
        nav:         'bg-slate-900 border-slate-800',
        sidebar:     'bg-slate-900 border-l border-slate-800',
        content:     'bg-slate-950',
        card:        'bg-slate-900 border border-slate-800 shadow-xl',
        rowBg:       'bg-slate-800/50 border border-slate-700/50',
        rowHover:    'hover:border-indigo-700',
        text:        'text-slate-100',
        textMuted:   'text-slate-400',
        input:       'bg-slate-800 border-slate-700 text-slate-100',
        tabsWrap:    'bg-slate-800 border-slate-700',
        itemHover:   'hover:bg-slate-800',
        itemActive:  'bg-indigo-900/30 border-l-4 border-indigo-500',
    },
    glass: {
        bg:          'bg-[#020617]',
        nav:         'bg-slate-900/60 backdrop-blur-xl border-white/10',
        sidebar:     'bg-white/5 backdrop-blur-2xl border-l border-white/10',
        content:     'bg-transparent',
        card:        'bg-white/5 backdrop-blur-xl border border-white/10',
        rowBg:       'bg-white/5 border border-white/5',
        rowHover:    'hover:border-indigo-500/40',
        text:        'text-slate-100',
        textMuted:   'text-slate-400',
        input:       'bg-black/40 border-white/10 text-white',
        tabsWrap:    'bg-black/20 border-white/10',
        itemHover:   'hover:bg-white/5',
        itemActive:  'bg-indigo-500/10 border-l-4 border-indigo-500',
    },
};

// â”€â”€ Progress Bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const UNLIMITED_THRESHOLD = 99999;
const fmtQuota = (n: number) => n >= UNLIMITED_THRESHOLD ? '∞' : n.toLocaleString();

function ProgressBar({ label, current, total, barColor, theme }: { label: string; current: number; total: number; barColor: string; theme: ThemeMode }) {
    const isUnlimited = total >= UNLIMITED_THRESHOLD;
    const pct = isUnlimited ? Math.min(100, 5) : Math.min(100, total > 0 ? Math.round((current / total) * 100) : 0);
    const T = THEMES[theme];
    return (
        <div className={`p-4 rounded-2xl ${T.card}`}>
            <div className="flex justify-between mb-2">
                <span className={`text-[10px] font-black uppercase tracking-widest ${T.textMuted}`}>{label}</span>
                <span className="text-xs font-black font-outfit text-slate-600">{current.toLocaleString()} / {isUnlimited ? '∞ غير محدود' : total.toLocaleString()}</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

// â”€â”€ Status Badge â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function StatusBadge({ tenant }: { tenant: Tenant }) {
    if (tenant.subscriptionStatus === 'active')
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-100">â—ڈ PAID</span>;
    if (tenant.isExpired)
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-100">â—ڈ EXPIRED</span>;
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-100">â—ڈ {tenant.daysRemaining}d</span>;
}

// â”€â”€ Toggle Switch â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function ToggleSwitch({ active, loading, onToggle }: { active: boolean; loading: boolean; onToggle: () => void }) {
    return (
        <button
            onClick={e => { e.stopPropagation(); e.preventDefault(); onToggle(); }}
            disabled={loading}
            className={`relative w-12 h-6 rounded-full transition-all duration-500 flex-shrink-0 ${
                active ? 'bg-emerald-500' : 'bg-slate-300'
            }`}
            style={{ minWidth: '48px' }}
            type="button"
        >
            {loading
                ? <RefreshCw className="w-3 h-3 text-white animate-spin absolute inset-0 m-auto" />
                : <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-500 ${
                    active ? 'left-6' : 'left-0.5'
                }`} />
            }
        </button>
    );
}

// â”€â”€ Main Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function IcePage() {
    const [theme, setTheme] = useState<ThemeMode>('light');
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<Tenant | null>(null);
    const [busy, setBusy] = useState('');
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'active' | 'trial' | 'expired'>('all');
    const [extendDays, setExtendDays] = useState('30');
    const [newPlan, setNewPlan] = useState('basic');
    const [quotaInv, setQuotaInv] = useState('');
    const [quotaProd, setQuotaProd] = useState('');
    const [quotaUser, setQuotaUser] = useState('');
    const [expandedSection, setExpandedSection] = useState<string | null>(null);
    const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // ── View Mode ──
    const [viewMode, setViewMode] = useState<'cloud' | 'desktop'>('cloud');
    const [allDesktopLicenses, setAllDesktopLicenses] = useState<any[]>([]);

    // ── Desktop Licenses ──
    const [tenantLicenses, setTenantLicenses] = useState<any[]>([]);
    const [licenseBusy, setLicenseBusy] = useState('');
    const [newMaxDevices, setNewMaxDevices] = useState(1);

    // ── Edit tenant info ──
    const [editMode, setEditMode] = useState(false);
    const [editEmail, setEditEmail] = useState('');
    const [editOrgName, setEditOrgName] = useState('');
    const [editVat, setEditVat] = useState('');

    // ── Tenant Feature Flags ──
    const [featureFlags, setFeatureFlags] = useState<any[]>([]);
    const [featureBusy, setFeatureBusy] = useState('');
    const [newFeatureKey, setNewFeatureKey] = useState('');

    const fetchTenantFeatures = async (id: number) => {
        try {
            const res = await fetch(`/api/ice/tenant-features?tenantAccountId=${id}`);
            const data = await res.json();
            if (data.success) setFeatureFlags(data.flags || []);
        } catch {}
    };

    const toggleFeatureFlag = async (moduleName: string, isEnabled: boolean) => {
        if (!selected) return;
        setFeatureBusy(moduleName);
        try {
            const res = await fetch('/api/ice/tenant-features', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenantAccountId: selected.id, moduleName, isEnabled })
            });
            if (res.ok) fetchTenantFeatures(selected.id);
        } catch {}
        finally { setFeatureBusy(''); }
    };

    // ── Toast notification ──
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
    const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleLogout = async () => {
        await fetch('/api/ice/auth', { method: 'DELETE' });
        window.location.reload();
    };

    useEffect(() => {
        const saved = localStorage.getItem('ice-theme') as ThemeMode;
        if (saved && ['light', 'dark', 'glass'].includes(saved)) setTheme(saved);
    }, []);

    const changeTheme = (m: ThemeMode) => { setTheme(m); localStorage.setItem('ice-theme', m); };

    const fetchTenants = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/ice/tenants');
            const data = await res.json();
            if (data.success) {
                setTenants(data.tenants);
                if (data.tenants?.length > 0 && !selected) {
                    setSelected(data.tenants[0]);
                    fetchTenantLicenses(data.tenants[0].id);
                    fetchTenantFeatures(data.tenants[0].id);
                }
            }
        } catch {}
        finally { setLoading(false); }
    }, []);

    // Auth is handled by layout — load tenants immediately
    useEffect(() => { fetchTenants(); }, [fetchTenants]);

    const filteredTenants = useMemo(() => tenants.filter(t => {
        const q = search.toLowerCase();
        const matchSearch = !q || t.subdomain.includes(q) || t.companyNameAr.includes(search) || t.email.includes(q);
        const matchFilter =
            filter === 'all'     ? true :
            filter === 'active'  ? t.subscriptionStatus === 'active' :
            filter === 'trial'   ? (t.subscriptionStatus === 'trial' && !t.isExpired) :
            filter === 'expired' ? t.isExpired : true;
        return matchSearch && matchFilter;
    }), [tenants, search, filter]);

    const filteredDesktopLicenses = useMemo(() => {
        return allDesktopLicenses.filter(lic => {
            const matchSearch = (lic.company_name || '').includes(search) || (lic.license_key || '').includes(search) || (lic.subdomain || '').includes(search);
            const matchFilter = filter === 'all' ? true :
                filter === 'active' ? lic.status === 'active' :
                filter === 'trial' ? lic.status === 'trial' :
                filter === 'expired' ? lic.status === 'expired' || lic.status === 'revoked' : true;
            return matchSearch && matchFilter;
        });
    }, [allDesktopLicenses, search, filter]);

    const pickTenant = (t: Tenant) => {
        setSelected(t);
        setShowDeleteConfirm(false);
        setDeleteConfirmInput('');
        fetchTenantLicenses(t.id);
        fetchTenantFeatures(t.id);
        setEditMode(false);
        setEditEmail(t.email);
        setEditOrgName(t.companyNameAr);
        setEditVat(t.vatNumber);
        setNewPlan(t.plan || 'free');
        setQuotaInv(String(t.invoiceQuota));
        setQuotaProd(String(t.productQuota));
        setQuotaUser(String(t.userQuota));
        fetchTenantLicenses(t.id);
    };

    const fetchTenantLicenses = async (tenantId: number) => {
        try {
            const res = await fetch(`/api/ice/desktop-licenses?tenant_id=${tenantId}`);
            const data = await res.json();
            if (data.licenses) setTenantLicenses(data.licenses);
        } catch {}
    };

    const fetchAllDesktopLicenses = async () => {
        try {
            const res = await fetch(`/api/ice/desktop-licenses`);
            const data = await res.json();
            if (data.licenses) setAllDesktopLicenses(data.licenses);
        } catch {}
    };

    const doAction = async (action: string, extra: Record<string, any> = {}) => {
        if (!selected || busy) return;
        setBusy(action);
        try {
            const isDelete = action === 'delete';
            const res = await fetch('/api/ice/toggle', {
                method: isDelete ? 'DELETE' : 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subdomain: selected.subdomain, action, ...extra }),
            });
            const data = await res.json();
            if (data.success) {
                const freshRes = await fetch('/api/ice/tenants');
                const freshData = await freshRes.json();
                if (freshData.success) {
                    setTenants(freshData.tenants);
                    if (isDelete) {
                        setSelected(null);
                        showToast('✅ تم حذف الحساب بنجاح');
                    } else {
                        const fresh = freshData.tenants.find((t: any) => t.subdomain === selected.subdomain);
                        if (fresh) pickTenant(fresh);
                        showToast('✅ تم تنفيذ الإجراء بنجاح');
                    }
                }
            } else {
                showToast('⚠️ خطأ: ' + (data.error || 'فشل الإجراء'), 'error');
            }
        } catch { showToast('⚠️ خطأ في الاتصال بالخادم', 'error'); }
        finally { setBusy(''); }
    };

    // ── Update tenant info ──
    const doUpdateInfo = async () => {
        if (!selected || busy) return;
        setBusy('update_info');
        try {
            const res = await fetch('/api/ice/toggle', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subdomain: selected.subdomain,
                    action: 'update_info',
                    email: editEmail,
                    orgName: editOrgName,
                    vatNumber: editVat,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setEditMode(false);
                const freshRes = await fetch('/api/ice/tenants');
                const freshData = await freshRes.json();
                if (freshData.success) {
                    setTenants(freshData.tenants);
                    const fresh = freshData.tenants.find((t: any) => t.subdomain === selected.subdomain);
                    if (fresh) pickTenant(fresh);
                }
                showToast('✅ تم تحديث بيانات المستأجر');
            } else {
                showToast('⚠️ ' + (data.error || 'فشل التحديث'), 'error');
            }
        } catch { showToast('⚠️ خطأ في الاتصال', 'error'); }
        finally { setBusy(''); }
    };

    // ── Apply plan with auto-modules ──
    const doApplyPlan = async (planKey: string) => {
        if (!selected || busy) return;
        const cfg = PLAN_CONFIGS[planKey];
        if (!cfg) return;
        setBusy('apply_plan');
        try {
            const res = await fetch('/api/ice/toggle', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subdomain: selected.subdomain,
                    action: 'apply_plan',
                    plan: planKey,
                    invoiceQuota: cfg.invoiceQuota,
                    productQuota: cfg.productQuota,
                    userQuota: cfg.userQuota,
                    allowedModules: cfg.allowedModules,
                }),
            });
            const data = await res.json();
            if (data.success) {
                const freshRes = await fetch('/api/ice/tenants');
                const freshData = await freshRes.json();
                if (freshData.success) {
                    setTenants(freshData.tenants);
                    const fresh = freshData.tenants.find((t: any) => t.subdomain === selected.subdomain);
                    if (fresh) pickTenant(fresh);
                }
                showToast(`✅ تم تطبيق باقة ${cfg.label} بنجاح`);
            } else {
                showToast('⚠️ ' + (data.error || 'فشل'), 'error');
            }
        } catch { showToast('⚠️ خطأ', 'error'); }
        finally { setBusy(''); }
    };

    const toggleSection = async (key: string, enabled: boolean) => {
        if (!selected || busy) return;
        const busyKey = `sec_${key}`;
        setBusy(busyKey);
        try {
            const res = await fetch('/api/ice/toggle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subdomain: selected.subdomain, moduleName: key, enabled }),
            });
            const data = await res.json();
            if (data.success) {
                const updated = { ...selected, hiddenModules: data.hiddenModules };
                setSelected(updated);
                setTenants(prev => prev.map(t => t.subdomain === selected.subdomain ? { ...t, hiddenModules: data.hiddenModules } : t));
                showToast(enabled ? '✅ تم تفعيل القسم' : '🔒 تم إقفال القسم');
            } else {
                showToast('⚠️ ' + (data.error || 'فشل تغيير حالة الوحدة'), 'error');
            }
        } catch { showToast('⚠️ خطأ في الاتصال', 'error'); }
        finally { setBusy(''); }
    };

    const T = THEMES[theme];
    const isLight = theme === 'light';

    return (
        <div dir="rtl" className={`h-screen flex flex-col overflow-hidden ${T.bg} ${T.text}`}>
            <style dangerouslySetInnerHTML={{ __html: `
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&family=Noto Sans Arabic:wght@400;700;900&display=swap');
                html { font-size: 24px !important; }
                body, button, input { font-family: 'Noto Sans Arabic', sans-serif; }
                .font-outfit { font-family: 'Outfit', sans-serif !important; }
                ::-webkit-scrollbar { width: 4px; }
                ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
            `}} />

            {/* â•گâ•گ TOPBAR â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ */}
            <header className={`h-[68px] flex-shrink-0 ${T.nav} border-b px-6 flex items-center justify-between z-50`}>
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                        <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <div className="text-lg font-black leading-none">محرك نما إنفست</div>
                        <div className={`text-[9px] font-black uppercase tracking-[0.25em] ${T.textMuted}`}>Infrastructure Engine v2.0</div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Theme Switcher */}
                    <div className={`flex items-center p-1 rounded-xl border ${T.tabsWrap}`}>
                        <button onClick={() => changeTheme('light')} title="Corporate Light" className={`p-1.5 rounded-lg transition-all ${theme === 'light' ? 'bg-white text-indigo-600 shadow-sm' : T.textMuted}`}><Sun className="w-4 h-4" /></button>
                        <button onClick={() => changeTheme('dark')}  title="Executive Dark"  className={`p-1.5 rounded-lg transition-all ${theme === 'dark'  ? 'bg-slate-700 text-indigo-400 shadow-sm' : T.textMuted}`}><Moon className="w-4 h-4" /></button>
                        <button onClick={() => changeTheme('glass')} title="Modern Glass"    className={`p-1.5 rounded-lg transition-all ${theme === 'glass' ? 'bg-indigo-600 text-white shadow-sm' : T.textMuted}`}><Sparkles className="w-4 h-4" /></button>
                    </div>

                    <Link href="/ice/desktop-licenses" className={`p-2 rounded-xl transition-all ${T.itemHover} flex items-center gap-1.5 text-xs font-bold`} title="تراخيص سطح المكتب">
                        <Key className="w-4 h-4 text-amber-500" />
                        <span className="hidden lg:inline">التراخيص</span>
                    </Link>

                    <button onClick={fetchTenants} title="تحديث" className={`p-2 rounded-xl transition-all ${T.itemHover}`}>
                        <RefreshCw className={`w-5 h-5 text-indigo-600 ${loading ? 'animate-spin' : ''}`} />
                    </button>

                    <div className={`hidden xl:flex items-center gap-5 border-r pr-5 ${isLight ? 'border-slate-200' : 'border-slate-700'}`}>
                        <div className="text-center">
                            <div className="text-[9px] font-black text-emerald-600 uppercase">مدفوع</div>
                            <div className="text-xl font-black font-outfit leading-none">{tenants.filter(t => t.subscriptionStatus === 'active').length}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-[9px] font-black text-amber-500 uppercase">تجريبي</div>
                            <div className="text-xl font-black font-outfit leading-none">{tenants.filter(t => t.subscriptionStatus === 'trial' && !t.isExpired).length}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-[9px] font-black text-rose-500 uppercase">منتهي</div>
                            <div className="text-xl font-black font-outfit leading-none">{tenants.filter(t => t.isExpired).length}</div>
                        </div>
                    </div>
                </div>
            </header>

            {/* â•گâ•گ BODY â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ */}
            <div className="flex flex-1 overflow-hidden">

                {/* â”€â”€ SIDEBAR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                <aside className={`w-[320px] flex-shrink-0 ${T.sidebar} flex flex-col overflow-hidden`}>
                    {/* View Toggle */}
                    <div className={`p-4 border-b ${isLight ? 'border-slate-100' : 'border-slate-800'} flex-shrink-0`}>
                        <div className={`flex rounded-xl border p-1 ${T.tabsWrap}`}>
                            <button onClick={() => setViewMode('cloud')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-black transition-all ${viewMode === 'cloud' ? 'bg-indigo-600 text-white shadow-md' : `${T.textMuted} ${T.itemHover}`}`}>
                                <Cloud className="w-4 h-4" /> السحابة
                            </button>
                            <button onClick={() => { setViewMode('desktop'); fetchAllDesktopLicenses(); }} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-black transition-all ${viewMode === 'desktop' ? 'bg-indigo-600 text-white shadow-md' : `${T.textMuted} ${T.itemHover}`}`}>
                                <Monitor className="w-4 h-4" /> المكتبي
                            </button>
                        </div>
                    </div>

                    {/* Search + Tabs */}
                    <div className={`p-4 border-b ${isLight ? 'border-slate-100' : 'border-slate-800'} space-y-3 flex-shrink-0`}>
                        <div className="relative">
                            <Search className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 ${T.textMuted}`} />
                            <input
                                type="text" placeholder={viewMode === 'cloud' ? "بحث عن مستأجر..." : "بحث عن ترخيص أو نطاق..."}
                                value={search} onChange={e => setSearch(e.target.value)}
                                className={`w-full pr-10 pl-4 py-2.5 rounded-2xl text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-400/30 transition-all ${T.input}`}
                            />
                        </div>
                        <div className={`flex gap-1 p-1 rounded-xl border ${T.tabsWrap}`}>
                            {(['all', 'active', 'trial', 'expired'] as const).map(f => (
                                <button key={f} onClick={() => setFilter(f)}
                                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${filter === f ? 'bg-indigo-600 text-white shadow-md' : `${T.textMuted} ${T.itemHover}`}`}>
                                    {f === 'all' ? 'الكل' : f === 'active' ? 'مدفوع' : f === 'trial' ? 'تجريبي' : 'منتهي'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {viewMode === 'cloud' ? (
                            <>
                                {filteredTenants.length === 0 && !loading && (
                                    <div className={`text-center py-16 ${T.textMuted}`}>
                                        <Building2 className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                        <p className="text-sm font-bold">لا يوجد مستأجرون</p>
                                    </div>
                                )}
                                {filteredTenants.map(t => (
                                    <button key={t.subdomain} onClick={() => pickTenant(t)}
                                        className={`w-full text-right p-4 rounded-2xl border transition-all relative ${selected?.subdomain === t.subdomain ? T.itemActive : `border-transparent ${T.itemHover}`}`}>
                                        <div className="flex items-start justify-between gap-2 mb-1.5">
                                            <span className={`text-sm font-black font-outfit ${selected?.subdomain === t.subdomain ? 'text-indigo-600' : ''}`}>{t.subdomain}</span>
                                            <StatusBadge tenant={t} />
                                        </div>
                                        <div className={`text-sm font-bold truncate ${T.text}`}>{t.companyNameAr}</div>
                                        <div className={`text-[10px] truncate mt-1 ${T.textMuted}`}>{t.email}</div>
                                        <div className={`mt-2 flex items-center gap-4 text-[10px] font-bold ${T.textMuted}`}>
                                            <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{t.invoiceCount}</span>
                                            <span className="flex items-center gap-1"><Package className="w-3 h-3" />{t.productCount}</span>
                                            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{t.userCount}</span>
                                            <span className={`mr-auto text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${isLight ? 'bg-indigo-50 text-indigo-600' : 'bg-indigo-900/40 text-indigo-400'}`}>{t.plan}</span>
                                        </div>
                                    </button>
                                ))}
                            </>
                        ) : (
                            <>
                                {filteredDesktopLicenses.length === 0 && !loading && (
                                    <div className={`text-center py-16 ${T.textMuted}`}>
                                        <Monitor className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                        <p className="text-sm font-bold">لا يوجد تراخيص مكتبية</p>
                                    </div>
                                )}
                                {filteredDesktopLicenses.map(lic => (
                                    <button key={lic.id} onClick={() => {/* We could select the desktop license to view details */}}
                                        className={`w-full text-right p-4 rounded-2xl border transition-all relative border-transparent ${T.itemHover}`}>
                                        <div className="flex items-start justify-between gap-2 mb-1.5">
                                            <span className={`text-sm font-black font-outfit ${lic.subdomain ? 'text-indigo-600' : ''}`}>{lic.subdomain || 'بدون نطاق'}</span>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                                lic.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                                                lic.status === 'revoked' ? 'bg-rose-50 text-rose-700' :
                                                'bg-amber-50 text-amber-700'
                                            }`}>
                                                {lic.status === 'active' ? 'نشط' : lic.status === 'revoked' ? 'ملغي' : lic.status}
                                            </span>
                                        </div>
                                        <div className={`text-sm font-bold truncate ${T.text}`}>{lic.company_name}</div>
                                        <div className={`text-[10px] truncate mt-1 ${T.textMuted}`}>{lic.license_key}</div>
                                    </button>
                                ))}
                            </>
                        )}
                    </div>
                </aside>

                {/* â”€â”€ MAIN CONTENT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                <main className={`flex-1 min-w-0 overflow-y-auto ${T.content} p-6 lg:p-10`}>
                    {!selected ? (
                        <div className="h-full flex flex-col items-center justify-center gap-6 opacity-30">
                            <LayoutDashboard className="w-20 h-20" />
                            <h2 className="text-2xl font-black">قمرة قيادة البنية التحتية</h2>
                            <p className="font-bold text-sm">اختر مستأجراً من القائمة للبدء</p>
                        </div>
                    ) : (
                        <div className="max-w-[1100px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                            {/* Toast */}
                            {toast && (
                                <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl text-sm font-black shadow-2xl ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
                                    {toast.msg}
                                </div>
                            )}

                            {/* Company Header Card */}
                            <div className={`rounded-3xl p-8 ${T.card} relative overflow-hidden`}>
                                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-l from-indigo-600 to-indigo-400" />
                                <div className="flex flex-col lg:flex-row justify-between gap-8">
                                    <div className="space-y-4 flex-1 min-w-0">
                                        <div className="flex items-center gap-4 flex-wrap">
                                            {editMode ? (
                                                <input value={editOrgName} onChange={e => setEditOrgName(e.target.value)}
                                                    className={`text-2xl font-black rounded-xl px-3 py-1 border w-64 ${T.input}`} />
                                            ) : (
                                                <h2 className="text-3xl font-black">{selected.companyNameAr}</h2>
                                            )}
                                            <Link href={`https://${selected.domainUrl}`} target="_blank"
                                                className={`p-2.5 rounded-xl transition-all border ${isLight ? 'bg-indigo-50 border-indigo-100 hover:bg-white' : 'bg-white/10 border-white/10 hover:bg-white/20'}`}>
                                                <ExternalLink className="w-5 h-5 text-indigo-600" />
                                            </Link>
                                            {!editMode ? (
                                                <button onClick={() => setEditMode(true)}
                                                    className={`p-2.5 rounded-xl transition-all border ${isLight ? 'bg-amber-50 border-amber-200 hover:bg-amber-100' : 'bg-amber-900/20 border-amber-800 hover:bg-amber-900/40'}`}>
                                                    <Pencil className="w-4 h-4 text-amber-600" />
                                                </button>
                                            ) : (
                                                <div className="flex gap-2">
                                                    <button onClick={doUpdateInfo} disabled={!!busy}
                                                        className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white">
                                                        {busy === 'update_info' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                                    </button>
                                                    <button onClick={() => { setEditMode(false); setEditEmail(selected.email); setEditOrgName(selected.companyNameAr); setEditVat(selected.vatNumber); }}
                                                        className={`p-2.5 rounded-xl border ${isLight ? 'border-slate-200 hover:bg-slate-100' : 'border-white/10 hover:bg-white/10'}`}>
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        <div className={`flex flex-wrap gap-6 pt-4 border-t ${isLight ? 'border-slate-100' : 'border-white/10'}`}>
                                            {editMode ? (<>
                                                <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-indigo-600" />
                                                    <input value={editEmail} onChange={e => setEditEmail(e.target.value)} className={`text-xs font-bold rounded-lg px-2 py-1 border w-48 ${T.input}`} /></div>
                                                <div className="flex items-center gap-2"><Hash className="w-3.5 h-3.5 text-indigo-600" />
                                                    <input value={editVat} onChange={e => setEditVat(e.target.value)} className={`text-xs font-bold rounded-lg px-2 py-1 border w-40 ${T.input}`} /></div>
                                            </>) : (<>
                                                <span className={`flex items-center gap-2 text-xs font-bold ${T.textMuted}`}><Mail className="w-3.5 h-3.5 text-indigo-600" />{selected.email}</span>
                                                <span className={`flex items-center gap-2 text-xs font-bold ${T.textMuted}`}><Hash className="w-3.5 h-3.5 text-indigo-600" />{selected.vatNumber}</span>
                                            </>)}
                                            <span className={`flex items-center gap-2 text-xs font-black text-indigo-600 ${isLight ? 'bg-indigo-50' : 'bg-indigo-900/40'} px-3 py-1 rounded-xl`}><Database className="w-3.5 h-3.5" />{selected.dbName}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 flex-shrink-0">
                                        <div className={`px-6 py-4 rounded-2xl text-center ${PLAN_CONFIGS[selected.plan]?.colorBg || 'bg-slate-50'} border ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
                                            <div className={`text-[9px] font-black uppercase tracking-widest mb-1 ${T.textMuted}`}>الباقة</div>
                                            <div className={`text-lg font-black ${selected.plan === 'enterprise' ? 'text-slate-800' : 'text-indigo-600'}`}>{PLAN_CONFIGS[selected.plan]?.label || selected.plan}</div>
                                        </div>
                                        <div className={`px-6 py-4 rounded-2xl text-center ${isLight ? 'bg-slate-50 border border-slate-200' : 'bg-white/5 border border-white/10'}`}>
                                            <div className={`text-[9px] font-black uppercase tracking-widest mb-2 ${T.textMuted}`}>الحالة</div>
                                            <StatusBadge tenant={selected} />
                                        </div>
                                    </div>
                                </div>

                                {/* Usage Stats */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                                    <div className={`p-4 rounded-2xl ${isLight ? 'bg-slate-50 border border-slate-100' : 'bg-white/5 border border-white/5'}`}>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className={`text-[10px] font-black uppercase ${T.textMuted}`}>أيام متبقية</span>
                                            <Clock className={`w-4 h-4 ${selected.isExpired ? 'text-rose-500' : 'text-emerald-600'}`} />
                                        </div>
                                        <div className={`text-3xl font-black font-outfit ${selected.isExpired ? 'text-rose-600' : T.text}`}>{selected.daysRemaining}</div>
                                    </div>
                                    <ProgressBar theme={theme} label="فواتير" current={selected.invoiceCount} total={selected.invoiceQuota} barColor="bg-indigo-600" />
                                    <ProgressBar theme={theme} label="أصناف" current={selected.productCount} total={selected.productQuota} barColor="bg-emerald-500" />
                                    <ProgressBar theme={theme} label="مستخدمين" current={selected.userCount} total={selected.userQuota} barColor="bg-violet-500" />
                                </div>
                            </div>

                            {/* â”€â”€ Control Row â”€â”€ */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                                {/* Panel 1: Subscription & Quotas */}
                                <div className={`rounded-3xl ${T.card} flex flex-col`}>
                                    <div className={`px-8 py-6 border-b ${isLight ? 'border-slate-100' : 'border-white/10'} flex items-center gap-4`}>
                                        <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200/40"><Zap className="w-5 h-5 text-white" /></div>
                                        <h3 className="text-lg font-black">إدارة الاشتراك والقيود</h3>
                                    </div>

                                    <div className="p-8 space-y-8 flex-1">
                                        {/* 1. Extend Trial */}
                                        <div className="space-y-3">
                                            <label className={`text-[10px] font-black uppercase tracking-widest ${T.textMuted}`}>تمديد الفترة التجريبية</label>
                                            <div className="flex flex-wrap gap-2 items-center">
                                                {['7', '14', '30', '90'].map(d => (
                                                    <button key={d} onClick={() => setExtendDays(d)}
                                                        className={`px-5 py-2.5 rounded-2xl text-sm font-black font-outfit transition-all border ${extendDays === d ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200' : `${isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'} ${T.textMuted} hover:border-indigo-400`}`}>
                                                        +{d}d
                                                    </button>
                                                ))}
                                                <button
                                                    disabled={!!busy}
                                                    onClick={() => doAction('extend', { days: parseInt(extendDays) })}
                                                    className="mr-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-black rounded-2xl shadow-lg shadow-emerald-100 flex items-center gap-2 transition-all active:scale-95">
                                                    {busy === 'extend' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                                                    تمديد
                                                </button>
                                            </div>
                                        </div>

                                        {/* 2. Upgrade Plan */}
                                        <div className="space-y-3">
                                            <label className={`text-[10px] font-black uppercase tracking-widest ${T.textMuted}`}>ترقية الباقة المدفوعة</label>
                                            <div className="flex flex-wrap gap-2 items-center">
                                                {PLANS.map(p => (
                                                    <button key={p.value} onClick={() => doApplyPlan(p.value)}
                                                        disabled={!!busy}
                                                        className={`px-5 py-2.5 rounded-2xl text-sm font-black transition-all border ${selected.plan === p.value ? `${p.color} text-white border-transparent shadow-lg` : `${isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'} ${T.textMuted} hover:border-indigo-400`}`}>
                                                        {busy === 'apply_plan' && newPlan === p.value ? '⏳' : selected.plan === p.value ? '✔️' : ''} {p.label}
                                                    </button>
                                                ))}
                                                <button
                                                    disabled={!!busy}
                                                    onClick={() => doAction('activate_paid', { plan: newPlan })}
                                                    className="mr-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-black rounded-2xl shadow-lg shadow-indigo-100 flex items-center gap-2 transition-all active:scale-95">
                                                    {busy === 'activate_paid' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Gem className="w-4 h-4" />}
                                                    تفعيل
                                                </button>
                                            </div>
                                        </div>

                                        {/* Danger Zone */}
                                        <div className={`pt-6 mt-4 border-t space-y-3 ${isLight ? 'border-slate-100' : 'border-white/10'}`}>
                                            <label className={`text-[10px] font-black uppercase tracking-widest text-rose-500`}>منطقة الخطر</label>
                                            <button
                                                disabled={!!busy}
                                                onClick={() => { if (window.confirm('⚠️ هل أنت متأكد من تعليق الوصول الكامل؟')) doAction('suspend'); }}
                                                className={`w-full py-3 rounded-2xl text-sm font-black transition-all border flex items-center justify-center gap-2 ${isLight ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100' : 'border-amber-800 bg-amber-900/20 text-amber-400 hover:bg-amber-900/40'}`}>
                                                {busy === 'suspend' ? <RefreshCw className="w-4 h-4 animate-spin" /> : '⛔'}
                                                تعليق الوصول الكامل
                                            </button>
                                            {!showDeleteConfirm ? (
                                                <button
                                                    disabled={!!busy || ['n7','n11'].includes(selected.subdomain)}
                                                    onClick={() => { setShowDeleteConfirm(true); setDeleteConfirmInput(''); }}
                                                    className={`w-full py-3 rounded-2xl text-sm font-black transition-all border flex items-center justify-center gap-2 ${['n7','n11'].includes(selected.subdomain) ? 'opacity-30 cursor-not-allowed border-slate-300 bg-slate-100 text-slate-400' : isLight ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100' : 'border-rose-800 bg-rose-900/20 text-rose-400 hover:bg-rose-900/40'}`}>
                                                    <Trash2 className="w-4 h-4" />
                                                    {['n7','n11'].includes(selected.subdomain) ? '🔒 محمي - لا يمكن حذفه' : '🗑️ حذف الحساب نهائياً'}
                                                </button>
                                            ) : (
                                                <div className={`p-4 rounded-2xl border space-y-3 ${isLight ? 'border-rose-200 bg-rose-50' : 'border-rose-800 bg-rose-900/20'}`}>
                                                    <p className="text-sm font-bold text-rose-600">⚠️ لتأكيد الحذف، اكتب اسم النطاق: <strong className="font-outfit">{selected.subdomain}</strong></p>
                                                    <input
                                                        type="text"
                                                        value={deleteConfirmInput}
                                                        onChange={e => setDeleteConfirmInput(e.target.value)}
                                                        placeholder={`اكتب ${selected.subdomain} هنا...`}
                                                        className={`w-full rounded-xl px-4 py-2.5 text-sm font-outfit border focus:outline-none focus:ring-2 focus:ring-rose-400/30 ${isLight ? 'bg-white border-rose-200' : 'bg-slate-900 border-rose-800 text-white'}`}
                                                        autoFocus
                                                    />
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmInput(''); }}
                                                            className={`flex-1 py-2.5 rounded-xl text-sm font-black border ${isLight ? 'border-slate-200 hover:bg-slate-100' : 'border-white/10 hover:bg-white/10 text-white'}`}>
                                                            إلغاء
                                                        </button>
                                                        <button
                                                            disabled={deleteConfirmInput !== selected.subdomain || !!busy}
                                                            onClick={() => { doAction('delete'); setShowDeleteConfirm(false); }}
                                                            className="flex-1 py-2.5 rounded-xl text-sm font-black bg-rose-600 hover:bg-rose-500 disabled:opacity-30 disabled:hover:bg-rose-600 text-white flex items-center justify-center gap-2">
                                                            {busy === 'delete' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                            تأكيد الحذف
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* 3. Custom Quotas */}
                                        <div className="space-y-3">
                                            <label className={`text-[10px] font-black uppercase tracking-widest ${T.textMuted}`}>تعديل حصص الموارد يدوياً</label>
                                            <div className="grid grid-cols-3 gap-3">
                                                {[
                                                    { label: 'فواتير', value: quotaInv, set: setQuotaInv },
                                                    { label: 'أصناف', value: quotaProd, set: setQuotaProd },
                                                    { label: 'مستخدمين', value: quotaUser, set: setQuotaUser },
                                                ].map(q => {
                                                    const isUn = +q.value >= UNLIMITED_THRESHOLD;
                                                    return (
                                                    <div key={q.label}>
                                                        <div className={`text-[9px] font-black uppercase mb-1.5 ${T.textMuted}`}>{q.label}</div>
                                                        <input type="number" value={q.value} onChange={e => q.set(e.target.value)}
                                                            className={`w-full rounded-2xl px-4 py-3 text-base font-black font-outfit text-center border focus:outline-none focus:ring-2 focus:ring-indigo-400/20 transition-all ${T.input}`} />
                                                        {isUn && <div className="text-[9px] font-bold text-emerald-600 text-center mt-1">∞ غير محدود</div>}
                                                    </div>
                                                    );
                                                })}
                                            </div>
                                            <button
                                                disabled={!!busy}
                                                onClick={() => doAction('set_quota', { invoiceQuota: +quotaInv, productQuota: +quotaProd, userQuota: +quotaUser })}
                                                className={`w-full py-3.5 rounded-2xl text-sm font-black transition-all active:scale-95 disabled:opacity-50 ${isLight ? 'bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-700' : 'bg-white/10 hover:bg-white/20 text-white'}`}>
                                                {busy === 'set_quota' ? '⏳ جارٍ الحفظ...' : '💾 تطبيق القيود الجديدة'}
                                            </button>
                                        </div>

                                        {/* Danger */}
                                        <div className={`pt-4 border-t text-center ${isLight ? 'border-slate-100' : 'border-white/10'}`}>
                                            <button
                                                disabled={!!busy}
                                                onClick={() => { if (confirm('⚠️ هل أنت متأكد من تعليق الوصول الكامل؟')) doAction('suspend'); }}
                                                className="text-[10px] font-black uppercase tracking-widest text-rose-300 hover:text-rose-600 transition-all disabled:opacity-50">
                                                â›” Global Access Suspension
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Panel 2: Module Registry */}
                                <div className={`rounded-3xl ${T.card} flex flex-col`}>
                                    <div className={`px-8 py-6 border-b ${isLight ? 'border-slate-100' : 'border-white/10'} flex items-center gap-4 flex-shrink-0`}>
                                        <div className={`p-2.5 ${isLight ? 'bg-slate-100' : 'bg-white/10'} rounded-xl`}><Settings className={`w-5 h-5 ${T.textMuted}`} /></div>
                                        <h3 className="text-lg font-black">إدارة الاشتراك والقيود</h3>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                        {ALL_SECTIONS.map(sec => {
                                            const isActive = !selected.hiddenModules.includes(sec.key);
                                            const isWorking = busy === `sec_${sec.key}`;
                                            const isExpanded = expandedSection === sec.key;
                                            return (
                                                <div key={sec.key} className="rounded-2xl border overflow-hidden transition-all">
                                                    {/* Module Row */}
                                                    <div className={`flex items-center gap-3 px-4 py-3 transition-all ${T.rowBg} ${!isActive ? 'opacity-50' : ''}`}>
                                                        {/* Icon */}
                                                        <div className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center ${sec.bg} ${sec.color}`}>
                                                            {sec.icon}
                                                        </div>
                                                        {/* Labels - clickable for expand */}
                                                        <button
                                                            type="button"
                                                            className="flex-1 min-w-0 text-right"
                                                            onClick={() => setExpandedSection(isExpanded ? null : sec.key)}
                                                        >
                                                            <div className={`text-sm font-black text-right ${T.text}`}>{sec.label}</div>
                                                            <div className={`text-[10px] font-bold text-right ${T.textMuted} mt-0.5`}>{sec.subs.length} أقسام</div>
                                                        </button>
                                                        {/* Expand arrow */}
                                                        <button
                                                            type="button"
                                                            onClick={() => setExpandedSection(isExpanded ? null : sec.key)}
                                                            className="p-1 flex-shrink-0"
                                                        >
                                                            <ChevronDown className={`w-4 h-4 ${T.textMuted} transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                                        </button>
                                                        {/* Toggle - completely separate */}
                                                        <div className="flex-shrink-0 pr-1">
                                                            <ToggleSwitch
                                                                active={isActive}
                                                                loading={isWorking}
                                                                onToggle={() => toggleSection(sec.key, !isActive)}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Sub-sections (expanded) */}
                                                    {isExpanded && (
                                                        <div className={`border-t ${isLight ? 'border-slate-100 bg-slate-50/50' : 'border-white/5 bg-white/5'} px-4 py-3 space-y-2`}>
                                                            {sec.subs.map(sub => {
                                                                const isSubActive = !selected.hiddenModules.includes(sub.key);
                                                                const isSubWorking = busy === `sec_${sub.key}`;
                                                                return (
                                                                    <div key={sub.key} className={`flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all ${isLight ? 'bg-white border-slate-100' : 'bg-white/5 border-white/5'} ${!isSubActive ? 'opacity-40 grayscale' : ''}`}>
                                                                        <div className="flex items-center gap-3">
                                                                            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isSubActive ? sec.color.replace('text-', 'bg-') : 'bg-slate-300'}`} />
                                                                            <span className={`text-xs font-bold ${T.text}`}>{sub.label}</span>
                                                                        </div>
                                                                        <ToggleSwitch
                                                                            active={isSubActive}
                                                                            loading={isSubWorking}
                                                                            onToggle={() => toggleSection(sub.key, !isSubActive)}
                                                                        />
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Panel 3: Desktop License Management */}
                                <div className={`rounded-3xl ${T.card} flex flex-col lg:col-span-2`}>
                                    <div className={`px-8 py-6 border-b ${isLight ? 'border-slate-100' : 'border-white/10'} flex items-center justify-between gap-4 flex-shrink-0`}>
                                        <div className="flex items-center gap-4">
                                            <div className="p-2.5 bg-amber-500 rounded-xl shadow-lg shadow-amber-200/40"><Key className="w-5 h-5 text-white" /></div>
                                            <h3 className="text-lg font-black">إدارة تراخيص تطبيق سطح المكتب (Desktop App)</h3>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl">
                                                <span className="text-xs font-bold text-slate-500">الأجهزة:</span>
                                                <input 
                                                    type="number" min="1" max="1000"
                                                    value={newMaxDevices}
                                                    onChange={e => setNewMaxDevices(parseInt(e.target.value) || 1)}
                                                    className="w-12 bg-transparent text-sm font-black text-center outline-none"
                                                />
                                            </div>
                                            <button
                                                onClick={async () => {
                                                    if (licenseBusy) return;
                                                    setLicenseBusy('create');
                                                    try {
                                                        const res = await fetch('/api/ice/desktop-licenses', {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({
                                                                action: 'create',
                                                                company_name: selected.companyNameAr,
                                                                contact_email: selected.email,
                                                                vat_number: selected.vatNumber,
                                                                tenant_account_id: selected.id,
                                                                max_devices: newMaxDevices
                                                            })
                                                        });
                                                        const data = await res.json();
                                                        if (data.success) {
                                                            showToast('✅ تم إنشاء ترخيص جديد بنجاح');
                                                            fetchTenantLicenses(selected.id);
                                                            setNewMaxDevices(1);
                                                        } else {
                                                            showToast('⚠️ خطأ في إنشاء الترخيص', 'error');
                                                        }
                                                    } catch { showToast('⚠️ خطأ في الاتصال', 'error'); }
                                                    finally { setLicenseBusy(''); }
                                                }}
                                                disabled={!!licenseBusy}
                                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-black rounded-xl shadow-sm transition-all flex items-center gap-2"
                                            >
                                                {licenseBusy === 'create' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4"/> إصدار ترخيص</>}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-8 space-y-4">
                                        {tenantLicenses.length === 0 ? (
                                            <div className={`text-center py-8 ${T.textMuted}`}>
                                                <Key className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                                <p className="text-sm font-bold">لا توجد تراخيص مكتبية مصدرة لهذا المستأجر</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {tenantLicenses.map(lic => (
                                                    <div key={lic.id} className={`p-5 rounded-2xl border ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-700 shadow-md'}`}>
                                                        <div className="flex justify-between items-start mb-3">
                                                            <div className="text-xs font-black uppercase tracking-widest text-indigo-500">License Key</div>
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                                                lic.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                                                                lic.status === 'revoked' ? 'bg-rose-50 text-rose-700' :
                                                                'bg-amber-50 text-amber-700'
                                                            }`}>
                                                                {lic.status === 'active' ? 'نشط' : lic.status === 'revoked' ? 'ملغي' : lic.status}
                                                            </span>
                                                        </div>
                                                        <div className="text-lg font-outfit font-black mb-4 select-all">{lic.license_key}</div>
                                                        
                                                        <div className="flex flex-col gap-2">
                                                            <div className="flex justify-between text-xs">
                                                                <span className={T.textMuted}>معرف الجهاز (Hardware ID):</span>
                                                                <span className="font-outfit font-black truncate max-w-[150px]">{lic.hardware_id || 'غير مرتبط بعد'}</span>
                                                            </div>
                                                            <div className="flex justify-between text-xs">
                                                                <span className={T.textMuted}>تاريخ الإصدار:</span>
                                                                <span className="font-outfit font-black">{new Date(lic.created_at).toLocaleDateString('en-GB')}</span>
                                                            </div>
                                                            <div className="flex justify-between items-center text-xs">
                                                                <span className={T.textMuted}>الأجهزة المفعلة / المسموحة:</span>
                                                                <div className="flex items-center gap-1">
                                                                    <span className="font-outfit font-black text-emerald-600">{lic.activated_devices}</span>
                                                                    <span className="text-slate-400">/</span>
                                                                    <input 
                                                                        type="number" min="1"
                                                                        defaultValue={lic.max_devices}
                                                                        onBlur={async (e) => {
                                                                            const val = parseInt(e.target.value);
                                                                            if (!val || val === lic.max_devices) return;
                                                                            setLicenseBusy(`max_${lic.id}`);
                                                                            try {
                                                                                await fetch('/api/ice/desktop-licenses', {
                                                                                    method: 'POST',
                                                                                    headers: { 'Content-Type': 'application/json' },
                                                                                    body: JSON.stringify({ action: 'update_max_devices', id: lic.id, max_devices: val })
                                                                                });
                                                                                fetchTenantLicenses(selected.id);
                                                                            } catch {}
                                                                            finally { setLicenseBusy(''); }
                                                                        }}
                                                                        className={`w-12 text-center rounded bg-slate-100 dark:bg-slate-800 font-outfit font-black px-1 py-0.5 outline-none focus:ring-2 focus:ring-indigo-500 ${licenseBusy === `max_${lic.id}` ? 'opacity-50 animate-pulse' : ''}`}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className={`mt-5 pt-4 border-t ${isLight ? 'border-slate-100' : 'border-slate-800'} flex gap-2`}>
                                                            <button 
                                                                onClick={async () => {
                                                                    if (!confirm('هل أنت متأكد من تعليق هذا الترخيص؟ سيفقد العميل القدرة على الدخول للتطبيق المكتبي.')) return;
                                                                    setLicenseBusy(`revoke_${lic.id}`);
                                                                    try {
                                                                        await fetch('/api/ice/desktop-licenses', {
                                                                            method: 'POST',
                                                                            headers: { 'Content-Type': 'application/json' },
                                                                            body: JSON.stringify({ action: 'revoke', id: lic.id })
                                                                        });
                                                                        fetchTenantLicenses(selected.id);
                                                                    } catch {} finally { setLicenseBusy(''); }
                                                                }}
                                                                disabled={!!licenseBusy || lic.status === 'revoked'}
                                                                className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${lic.status === 'revoked' ? 'opacity-30 cursor-not-allowed border bg-slate-50 text-slate-400' : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100'}`}
                                                            >
                                                                تعليق وإلغاء
                                                            </button>
                                                            <button 
                                                                onClick={async () => {
                                                                    setLicenseBusy(`activate_${lic.id}`);
                                                                    try {
                                                                        await fetch('/api/ice/desktop-licenses', {
                                                                            method: 'POST',
                                                                            headers: { 'Content-Type': 'application/json' },
                                                                            body: JSON.stringify({ action: 'activate', id: lic.id })
                                                                        });
                                                                        fetchTenantLicenses(selected.id);
                                                                    } catch {} finally { setLicenseBusy(''); }
                                                                }}
                                                                disabled={!!licenseBusy || lic.status === 'active'}
                                                                className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${lic.status === 'active' ? 'opacity-30 cursor-not-allowed border bg-slate-50 text-slate-400' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-100'}`}
                                                            >
                                                                إعادة تفعيل
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Panel 4: Dynamic Feature Control */}
                                <div className={`rounded-3xl ${T.card} flex flex-col lg:col-span-2 mt-4`}>
                                    <div className={`px-8 py-6 border-b ${isLight ? 'border-slate-100' : 'border-white/10'} flex items-center justify-between gap-4 flex-shrink-0`}>
                                        <div className="flex items-center gap-4">
                                            <div className="p-2.5 bg-rose-500 rounded-xl shadow-lg shadow-rose-200/40"><Bot className="w-5 h-5 text-white" /></div>
                                            <h3 className="text-lg font-black">التحكم بالأزرار والعناصر التفاعلية (Feature Flags)</h3>
                                        </div>
                                    </div>

                                    <div className="p-8 space-y-4">
                                        <div className="flex items-center gap-2 mb-4">
                                            <select
                                                value={newFeatureKey}
                                                onChange={e => setNewFeatureKey(e.target.value)}
                                                className={`flex-1 rounded-xl px-4 py-2 text-sm font-bold border focus:outline-none focus:ring-2 focus:ring-indigo-400/20 ${T.input}`}
                                            >
                                                <option value="">-- اختر العنصر لتعطيله / تفعيله --</option>
                                                
                                                {/* Dynamically grouped features */}
                                                {Array.from(new Set(featuresList.map(f => f.module))).map(moduleName => (
                                                    <optgroup key={moduleName} label={moduleName}>
                                                        {featuresList.filter(f => f.module === moduleName).map(f => (
                                                            <option key={f.key} value={f.key}>
                                                                {f.label}
                                                            </option>
                                                        ))}
                                                    </optgroup>
                                                ))}
                                            </select>
                                            <button
                                                onClick={() => {
                                                    if (newFeatureKey) {
                                                        toggleFeatureFlag(newFeatureKey, false);
                                                        setNewFeatureKey('');
                                                    }
                                                }}
                                                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-black rounded-xl shadow-sm transition-all flex items-center gap-2"
                                            >
                                                <Plus className="w-4 h-4"/> إضافة عنصر
                                            </button>
                                        </div>

                                        {featureFlags.length === 0 ? (
                                            <div className={`text-center py-4 ${T.textMuted}`}>
                                                <p className="text-sm font-bold">لا يوجد أي عناصر مقيدة لهذا المستأجر.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {featureFlags.map(f => (
                                                    <div key={f.id} className={`flex items-center justify-between p-4 rounded-xl border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-700'}`}>
                                                        <div className="flex flex-col">
                                                            <span className="font-outfit font-black text-indigo-600">{f.moduleName}</span>
                                                            <span className="text-xs text-slate-500">الحالة: {f.isEnabled ? 'مفعل' : 'معطل (مخفي)'}</span>
                                                        </div>
                                                        <ToggleSwitch
                                                            active={f.isEnabled}
                                                            loading={featureBusy === f.moduleName}
                                                            onToggle={() => toggleFeatureFlag(f.moduleName, !f.isEnabled)}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>


                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

