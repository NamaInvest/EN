'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
    Users, Shield, Zap, Search, RefreshCw, ExternalLink, 
    Database, Mail, Hash, Clock, CreditCard, Package, 
    FileText, CheckCircle, AlertTriangle, XCircle, 
    LayoutDashboard, Settings, Globe, BarChart3,
    ArrowLeft, Filter, Smartphone, Bot, Rocket, Gem,
    Sun, Moon, Sparkles
} from 'lucide-react';
import Link from 'next/link';

// ── Types & Config ─────────────────────────────────────────────────────────

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
    { key: 'Sales',         icon: <CreditCard className="w-4 h-4" />, label: 'المبيعات', sub: 'فواتير + عروض أسعار + مرتجعات', color: 'text-blue-500' },
    { key: 'POS',           icon: <Smartphone className="w-4 h-4" />, label: 'نقطة البيع', sub: 'POS + مطاعم + ورديات', color: 'text-emerald-500' },
    { key: 'Purchases',     icon: <Package className="w-4 h-4" />, label: 'المشتريات', sub: 'فواتير + أوامر شراء + مرتجعات', color: 'text-amber-500' },
    { key: 'Inventory',     icon: <Database className="w-4 h-4" />, label: 'المخزون والمستودعات', sub: 'أصناف + مخازن + جرد + باركود', color: 'text-indigo-500' },
    { key: 'Finance',       icon: <BarChart3 className="w-4 h-4" />, label: 'المالية والحسابات', sub: 'محاسبة + خزينة + أصول ثابتة', color: 'text-cyan-500' },
    { key: 'HR',            icon: <Users className="w-4 h-4" />, label: 'الموارد البشرية', sub: 'موظفون + رواتب + حضور + إجازات', color: 'text-rose-500' },
    { key: 'Manufacturing', icon: <Rocket className="w-4 h-4" />, label: 'التصنيع والإنتاج', sub: 'BOM + MRP + جودة', color: 'text-orange-500' },
    { key: 'CRM',           icon: <Bot className="w-4 h-4" />, label: 'العملاء والتسويق', sub: 'عملاء + ولاء + كوبونات + حجوزات', color: 'text-violet-500' },
    { key: 'Enterprise',    icon: <Globe className="w-4 h-4" />, label: 'الأنظمة المتخصصة', sub: 'مشاريع + عقارات + أسطول + مدارس', color: 'text-sky-500' },
    { key: 'AI',            icon: <Bot className="w-4 h-4" />, label: 'الذكاء الاصطناعي', sub: 'AI Copilot + CFO + SCM + Bank', color: 'text-purple-500' },
    { key: 'Reports',       icon: <FileText className="w-4 h-4" />, label: 'التقارير', sub: 'تقارير المبيعات والمالية والمخزون', color: 'text-slate-500' },
    { key: 'Settings',      icon: <Settings className="w-4 h-4" />, label: 'الإعدادات', sub: 'فروع + عملات + موافقات + واتساب', color: 'text-pink-500' },
];

const PLANS = [
    { value: 'free', label: 'مجاني', color: 'bg-slate-500', text: 'text-slate-500' },
    { value: 'basic', label: 'أساسي', color: 'bg-indigo-600', text: 'text-indigo-600' },
    { value: 'professional', label: 'احترافي', color: 'bg-purple-600', text: 'text-purple-600' },
    { value: 'enterprise', label: 'مؤسسات', color: 'bg-amber-600', text: 'text-amber-600' },
];

// ── Theme Mapping ──────────────────────────────────────────────────────────

const THEMES = {
    light: {
        bg: 'bg-slate-50',
        nav: 'bg-white border-slate-200',
        card: 'bg-white border-slate-200 shadow-sm',
        sidebar: 'bg-white border-l-slate-200',
        text: 'text-slate-900',
        textMuted: 'text-slate-500',
        subtext: 'text-slate-400',
        input: 'bg-slate-50 border-slate-200 text-slate-900',
        itemHover: 'hover:bg-slate-100',
        itemActive: 'bg-indigo-50 border-indigo-200 text-indigo-700',
        accent: 'indigo',
    },
    dark: {
        bg: 'bg-slate-950',
        nav: 'bg-slate-900 border-slate-800',
        card: 'bg-slate-900 border-slate-800 shadow-xl',
        sidebar: 'bg-slate-950 border-l-slate-800',
        text: 'text-slate-100',
        textMuted: 'text-slate-400',
        subtext: 'text-slate-500',
        input: 'bg-slate-950 border-slate-800 text-slate-100',
        itemHover: 'hover:bg-slate-900',
        itemActive: 'bg-indigo-900/20 border-indigo-800 text-indigo-400',
        accent: 'indigo',
    },
    glass: {
        bg: 'bg-[#020617] bg-[radial-gradient(circle_at_50%_0%,#1e1b4b_0%,#020617_100%)]',
        nav: 'bg-slate-900/60 backdrop-blur-xl border-indigo-500/20',
        card: 'bg-slate-900/40 backdrop-blur-lg border-white/5 shadow-2xl',
        sidebar: 'bg-slate-950/40 backdrop-blur-xl border-l-white/5',
        text: 'text-slate-100',
        textMuted: 'text-slate-400',
        subtext: 'text-slate-500',
        input: 'bg-slate-950/50 border-slate-800 text-slate-100',
        itemHover: 'hover:bg-white/5',
        itemActive: 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.1)]',
        accent: 'indigo',
    }
};

// ── Components ──────────────────────────────────────────────────────────────

const ProgressBar = ({ current, total, color, label, theme }: { current: number, total: number, color: string, label: string, theme: ThemeMode }) => {
    const pct = Math.min(100, Math.round((current / total) * 100));
    const isDark = theme !== 'light';
    return (
        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-50 border-slate-200'} transition-all`}>
            <div className="flex justify-between items-end mb-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{label}</span>
                <span className={`text-sm font-black ${color}`}>{current} / {total}</span>
            </div>
            <div className={`h-1.5 w-full rounded-full overflow-hidden ${isDark ? 'bg-slate-700/50' : 'bg-slate-200'}`}>
                <div 
                    className={`h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,0,0,0.1)] bg-gradient-to-r ${color.includes('blue') ? 'from-blue-600 to-cyan-400' : color.includes('emerald') ? 'from-emerald-600 to-teal-400' : 'from-purple-600 to-indigo-400'}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
};

const StatusBadge = ({ tenant }: { tenant: Tenant }) => {
    if (tenant.subscriptionStatus === 'active') return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            ● PAID
        </span>
    );
    if (tenant.isExpired) return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/10 text-rose-500 border border-rose-500/20">
            ● EXPIRED
        </span>
    );
    return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/10 text-amber-500 border border-amber-500/20">
            ● TRIAL {tenant.daysRemaining}D
        </span>
    );
};

// ── Main Page ───────────────────────────────────────────────────────────────

export default function IcePage() {
    const [theme, setTheme] = useState<ThemeMode>('dark');
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selected, setSelected] = useState<Tenant | null>(null);
    const [busy, setBusy] = useState('');
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'active' | 'trial' | 'expired'>('all');

    // Edit states
    const [editQuota, setEditQuota] = useState({ inv: '', prod: '', user: '' });
    const [extendDays, setExtendDays] = useState('30');
    const [newPlan, setNewPlan] = useState('basic');

    // Persist Theme
    useEffect(() => {
        const saved = localStorage.getItem('ice-theme') as ThemeMode;
        if (saved && (saved === 'light' || saved === 'dark' || saved === 'glass')) setTheme(saved);
    }, []);

    const toggleTheme = (mode: ThemeMode) => {
        setTheme(mode);
        localStorage.setItem('ice-theme', mode);
    };

    const fetchTenants = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const res = await fetch('/api/ice/tenants');
            const data = await res.json();
            if (!data.success) throw new Error(data.error || 'Failed');
            setTenants(data.tenants);
        } catch (e: any) { setError(e.message); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchTenants(); }, [fetchTenants]);

    const filteredTenants = useMemo(() => {
        return tenants.filter(t => {
            const matchesSearch = t.subdomain.toLowerCase().includes(search.toLowerCase()) || 
                                 t.companyNameAr.includes(search) || 
                                 t.email.toLowerCase().includes(search.toLowerCase());
            
            const matchesFilter = filter === 'all' 
                || (filter === 'active' && t.subscriptionStatus === 'active')
                || (filter === 'trial' && t.subscriptionStatus === 'trial' && !t.isExpired)
                || (filter === 'expired' && t.isExpired);

            return matchesSearch && matchesFilter;
        });
    }, [tenants, search, filter]);

    const selectTenant = (t: Tenant) => {
        setSelected(t);
        setEditQuota({ inv: String(t.invoiceQuota), prod: String(t.productQuota), user: String(t.userQuota) });
        setNewPlan(t.plan);
    };

    const doAction = async (action: string, extra: Record<string, any> = {}) => {
        if (!selected) return;
        setBusy(action);
        try {
            const res = await fetch('/api/ice/toggle', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subdomain: selected.subdomain, action, ...extra }),
            });
            const data = await res.json();
            if (data.success) await fetchTenants();
            else alert('Error: ' + data.error);
        } catch { alert('Connection failed'); }
        setBusy('');
    };

    const toggleSection = async (sectionKey: string, enabled: boolean) => {
        if (!selected) return;
        setBusy(`sec_${sectionKey}`);
        try {
            const res = await fetch('/api/ice/toggle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subdomain: selected.subdomain, moduleName: sectionKey, enabled }),
            });
            const data = await res.json();
            if (data.success) {
                const updated = { ...selected, hiddenModules: data.hiddenModules };
                setSelected(updated);
                setTenants(prev => prev.map(t => t.subdomain === selected.subdomain ? { ...t, hiddenModules: data.hiddenModules } : t));
            }
        } catch {}
        setBusy('');
    };

    const T = THEMES[theme];

    return (
        <div dir="rtl" className={`min-h-screen ${T.bg} ${T.text} font-sans selection:bg-indigo-500/30 transition-colors duration-500`}>
            <style dangerouslySetInnerHTML={{ __html: `
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=Cairo:wght@400;700;900&display=swap');
                .font-outfit { font-family: 'Outfit', sans-serif; }
                body { font-family: 'Cairo', sans-serif; }
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: ${theme === 'light' ? '#e2e8f0' : '#1e293b'}; border-radius: 10px; }
            `}} />

            {/* --- Navbar --- */}
            <header className={`sticky top-0 z-50 border-b ${T.nav} px-6 py-4 flex items-center justify-between transition-all`}>
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Shield className="text-white w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black tracking-tight flex items-center gap-2">
                             نما إنفست <span className="text-indigo-500 font-outfit uppercase tracking-[0.2em] text-[10px] px-2 py-0.5 bg-indigo-500/10 rounded-lg">ICE ENGINE</span>
                        </h1>
                        <p className={`text-[10px] ${T.textMuted} font-bold uppercase tracking-widest mt-0.5`}>Central Infrastructure Management</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Theme Switcher */}
                    <div className={`flex items-center p-1 rounded-xl border ${T.nav}`}>
                        <button onClick={() => toggleTheme('light')} className={`p-2 rounded-lg transition-all ${theme === 'light' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`} title="رسمي (Light)"><Sun className="w-4 h-4" /></button>
                        <button onClick={() => toggleTheme('dark')} className={`p-2 rounded-lg transition-all ${theme === 'dark' ? 'bg-slate-800 text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`} title="احترافي (Dark)"><Moon className="w-4 h-4" /></button>
                        <button onClick={() => toggleTheme('glass')} className={`p-2 rounded-lg transition-all ${theme === 'glass' ? 'bg-indigo-600/20 text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`} title="تقني (Glass)"><Sparkles className="w-4 h-4" /></button>
                    </div>

                    <div className="h-8 w-px bg-slate-800 hidden md:block" />
                    
                    <button onClick={fetchTenants} className={`p-2 rounded-xl transition-all ${T.itemHover}`}>
                        <RefreshCw className={`w-5 h-5 text-indigo-500 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <div className="hidden lg:flex gap-4 mr-2">
                        <div className="text-center">
                            <div className="text-[10px] text-emerald-500 font-black">PAID</div>
                            <div className="text-sm font-black font-outfit">{tenants.filter(t => t.subscriptionStatus === 'active').length}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-[10px] text-amber-500 font-black">TRIAL</div>
                            <div className="text-sm font-black font-outfit">{tenants.filter(t => t.subscriptionStatus === 'trial' && !t.isExpired).length}</div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex h-[calc(100vh-73px)] overflow-hidden">
                
                {/* --- Sidebar Navigator --- */}
                <aside className={`w-[340px] border-l ${T.sidebar} flex flex-col transition-all`}>
                    <div className="p-4 space-y-3">
                        {/* Search Input */}
                        <div className="relative group">
                            <Search className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 ${T.textMuted} group-focus-within:text-indigo-500 transition-colors`} />
                            <input 
                                type="text"
                                placeholder="..." 
                                className={`w-full border rounded-xl pr-10 pl-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold ${T.input}`}
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>

                        {/* Filter Tabs */}
                        <div className={`flex gap-1 p-1 rounded-xl border ${T.nav}`}>
                            {(['all', 'active', 'trial', 'expired'] as const).map(f => (
                                <button 
                                    key={f} 
                                    onClick={() => setFilter(f)}
                                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${filter === f ? 'bg-indigo-600 text-white shadow-lg' : `${T.textMuted} hover:${T.text}`}`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-2 pb-10">
                        {loading && tenants.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 gap-4">
                                <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin opacity-20" />
                                <span className={`text-xs font-bold ${T.subtext} uppercase tracking-widest`}>Syncing...</span>
                            </div>
                        ) : filteredTenants.map(t => (
                            <button 
                                key={t.subdomain}
                                onClick={() => selectTenant(t)}
                                className={`w-full text-right p-4 rounded-2xl mb-2 transition-all group relative border ${selected?.subdomain === t.subdomain ? T.itemActive : `border-transparent ${T.itemHover}`}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-sm font-black font-outfit tracking-wider transition-colors ${selected?.subdomain === t.subdomain ? 'text-indigo-500' : `${T.text} group-hover:text-indigo-500`}`}>
                                        {t.subdomain}.
                                    </span>
                                    <StatusBadge tenant={t} />
                                </div>
                                <div className={`text-xs font-bold mb-1 line-clamp-1 ${selected?.subdomain === t.subdomain ? T.text : T.textMuted}`}>{t.companyNameAr}</div>
                                <div className={`text-[10px] font-medium font-outfit line-clamp-1 ${T.subtext}`}>{t.email}</div>
                                
                                <div className={`mt-3 flex gap-4 text-[10px] font-black transition-colors ${selected?.subdomain === t.subdomain ? 'text-indigo-500/70' : T.subtext}`}>
                                    <span className="flex items-center gap-1.5"><FileText className="w-3 h-3"/> {t.invoiceCount}</span>
                                    <span className="flex items-center gap-1.5"><Package className="w-3 h-3"/> {t.productCount}</span>
                                    <span className="flex items-center gap-1.5"><Users className="w-3 h-3"/> {t.userCount}</span>
                                    <span className="mr-auto px-1.5 py-0.5 rounded bg-slate-500/10 text-[8px] uppercase tracking-tighter">
                                        {t.plan}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </aside>

                {/* --- Detail Area --- */}
                <section className="flex-1 overflow-y-auto relative p-6 md:p-10 transition-all">
                    {!selected ? (
                        <div className="h-full flex flex-col items-center justify-center text-center">
                            <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mb-6 animate-pulse ${theme === 'light' ? 'bg-slate-100' : 'bg-slate-900'}`}>
                                <LayoutDashboard className={`w-10 h-10 ${T.subtext}`} />
                            </div>
                            <h2 className={`text-2xl font-black tracking-tight ${T.text}`}>قمرة التحكم والقيادة</h2>
                            <p className={`${T.textMuted} max-w-sm mt-2 text-sm`}>يرجى اختيار مستأجر من القائمة الجانبية للبدء في إدارة النظام والاشتراكات.</p>
                        </div>
                    ) : (
                        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
                            
                            {/* Main Info Card */}
                            <div className={`p-8 rounded-[2.5rem] relative overflow-hidden transition-all border ${T.card}`}>
                                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500" />
                                <div className="flex flex-col md:flex-row justify-between gap-6 items-start">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4">
                                            <h2 className={`text-3xl font-black ${T.text}`}>{selected.companyNameAr}</h2>
                                            <Link href={`https://${selected.domainUrl}`} target="_blank" className={`p-2.5 rounded-xl transition-all ${theme === 'light' ? 'bg-slate-100 hover:bg-slate-200' : 'bg-white/5 hover:bg-white/10'}`}>
                                                <ExternalLink className="w-5 h-5 text-indigo-500" />
                                            </Link>
                                        </div>
                                        <div className="flex flex-wrap gap-4 items-center">
                                            <div className={`flex items-center gap-2 text-xs font-bold ${T.textMuted}`}>
                                                <Mail className="w-3.5 h-3.5 text-indigo-500" /> {selected.email}
                                            </div>
                                            <div className={`flex items-center gap-2 text-xs font-bold ${T.textMuted}`}>
                                                <Hash className="w-3.5 h-3.5 text-indigo-500" /> {selected.vatNumber}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs font-black text-indigo-500 font-outfit uppercase">
                                                <Database className="w-3.5 h-3.5" /> {selected.dbName}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <div className={`p-4 rounded-3xl text-center min-w-[140px] border ${T.nav}`}>
                                            <div className={`text-[10px] font-black uppercase mb-1 ${T.subtext}`}>PLAN</div>
                                            <div className={`text-sm font-black uppercase tracking-widest ${PLANS.find(p => p.value === selected.plan)?.text}`}>
                                                {selected.plan}
                                            </div>
                                        </div>
                                        <div className={`p-4 rounded-3xl text-center min-w-[140px] border ${T.nav}`}>
                                            <div className={`text-[10px] font-black uppercase mb-1 ${T.subtext}`}>STATUS</div>
                                            <div className="mt-1"><StatusBadge tenant={selected} /></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Usage Progress */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
                                    <div className={`p-4 rounded-2xl border transition-all ${theme === 'light' ? 'bg-indigo-50/50 border-indigo-100' : 'bg-slate-800/40 border-slate-700/50'}`}>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className={`text-[10px] font-black uppercase ${T.subtext}`}>متبقي</span>
                                            <Clock className={`w-4 h-4 ${selected.isExpired ? 'text-rose-500' : 'text-emerald-500'}`} />
                                        </div>
                                        <div className={`text-2xl font-outfit font-black ${selected.isExpired ? 'text-rose-500' : T.text}`}>{selected.daysRemaining}</div>
                                        <div className={`text-[10px] font-bold mt-1 uppercase ${T.subtext}`}>Days to expiry</div>
                                    </div>
                                    <ProgressBar theme={theme} label="الفواتير" current={selected.invoiceCount} total={selected.invoiceQuota} color="text-blue-500" />
                                    <ProgressBar theme={theme} label="الأصناف" current={selected.productCount} total={selected.productQuota} color="text-emerald-500" />
                                    <ProgressBar theme={theme} label="الموظفون" current={selected.userCount} total={selected.userQuota} color="text-purple-500" />
                                </div>
                            </div>

                            {/* Control Cards */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                
                                {/* 1. Subscription & Quota Card */}
                                <div className={`p-8 rounded-[2.5rem] space-y-8 border transition-all ${T.card}`}>
                                    <div className="flex items-center gap-3 border-b border-slate-700/10 pb-4">
                                        <Zap className="w-5 h-5 text-amber-500" />
                                        <h3 className="text-sm font-black uppercase tracking-widest">إدارة العضوية والقيود</h3>
                                    </div>

                                    {/* Trail Extend */}
                                    <div className="space-y-4">
                                        <label className={`text-[10px] font-black uppercase tracking-widest ${T.subtext}`}>تمديد فترة التجربة</label>
                                        <div className="flex flex-wrap gap-2">
                                            {['7', '14', '30', '60', '90'].map(d => (
                                                <button 
                                                    key={d} onClick={() => setExtendDays(d)}
                                                    className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all border ${extendDays === d ? 'bg-indigo-600 border-indigo-500 text-white shadow-xl shadow-indigo-500/20' : `${T.input} hover:border-slate-500`}`}
                                                >
                                                    +{d}
                                                </button>
                                            ))}
                                            <button 
                                                onClick={() => doAction('extend', { days: parseInt(extendDays) })}
                                                disabled={!!busy}
                                                className="mr-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-2xl shadow-lg transition-all flex items-center gap-2"
                                            >
                                                {busy === 'extend' ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Rocket className="w-4 h-4"/>} تمديد
                                            </button>
                                        </div>
                                    </div>

                                    {/* Plan Patch */}
                                    <div className="space-y-4">
                                        <label className={`text-[10px] font-black uppercase tracking-widest ${T.subtext}`}>ترقية الخطة (Plan Upgrade)</label>
                                        <div className="flex flex-wrap gap-2">
                                            {PLANS.filter(p => p.value !== 'free').map(p => (
                                                <button 
                                                    key={p.value} onClick={() => setNewPlan(p.value)}
                                                    className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all border ${newPlan === p.value ? `${p.color} border-transparent text-white shadow-xl` : `${T.input} hover:border-slate-500`}`}
                                                >
                                                    {p.label}
                                                </button>
                                            ))}
                                            <button 
                                                onClick={() => doAction('activate_paid', { plan: newPlan })}
                                                disabled={!!busy}
                                                className="mr-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-2xl shadow-lg transition-all flex items-center gap-2"
                                            >
                                                {busy === 'activate_paid' ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Gem className="w-4 h-4"/>} ترقية
                                            </button>
                                        </div>
                                    </div>

                                    {/* Manual Quotas */}
                                    <div className="space-y-4 pt-4">
                                        <label className={`text-[10px] font-black uppercase tracking-widest ${T.subtext}`}>تعديل الحدود يدوياً (Resource Override)</label>
                                        <div className="grid grid-cols-3 gap-4">
                                            {[
                                                { key: 'inv', label: 'الفواتير', color: 'text-blue-500' },
                                                { key: 'prod', label: 'الأصناف', color: 'text-emerald-500' },
                                                { key: 'user', label: 'المستخدمين', color: 'text-purple-500' },
                                            ].map(q => (
                                                <div key={q.key}>
                                                    <div className={`text-[10px] font-black mb-2 opacity-60`}>{q.label}</div>
                                                    <input 
                                                        type="number" 
                                                        value={editQuota[q.key as keyof typeof editQuota]}
                                                        onChange={e => setEditQuota(prev => ({ ...prev, [q.key]: e.target.value }))}
                                                        className={`w-full rounded-2xl px-4 py-3 text-sm font-outfit font-black border focus:outline-none focus:ring-4 focus:ring-indigo-500/10 ${T.input}`}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                        <button 
                                            onClick={() => doAction('set_quota', {
                                                invoiceQuota: parseInt(editQuota.inv),
                                                productQuota: parseInt(editQuota.prod),
                                                userQuota: parseInt(editQuota.user),
                                            })}
                                            disabled={!!busy}
                                            className="w-full py-4 bg-slate-500/10 hover:bg-slate-500/20 text-indigo-500 text-xs font-black rounded-2xl transition-all border border-indigo-500/10"
                                        >
                                            💾 حفظ القيود الجديدة
                                        </button>
                                    </div>

                                    {/* Critical Action */}
                                    <div className="pt-6 border-t border-slate-500/10 text-center">
                                        <button 
                                            onClick={() => { if (confirm('Danger: Proceed to suspend accounts?')) doAction('suspend'); }}
                                            disabled={!!busy}
                                            className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-500/50 hover:text-rose-500 transition-all"
                                        >
                                            🚫 Disable Account Access
                                        </button>
                                    </div>
                                </div>

                                {/* 2. Modules Card */}
                                <div className={`p-8 rounded-[2.5rem] border transition-all ${T.card} flex flex-col`}>
                                    <div className="flex items-center gap-3 border-b border-slate-700/10 pb-4 mb-8">
                                        <Settings className="w-5 h-5 text-indigo-500" />
                                        <h3 className="text-sm font-black uppercase tracking-widest">إدارة وحدات النظام (12 وحدة)</h3>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 flex-1">
                                        {ALL_SECTIONS.map(sec => {
                                            const isHidden = selected.hiddenModules.includes(sec.key);
                                            const isWorking = busy === `sec_${sec.key}`;
                                            return (
                                                <div 
                                                    key={sec.key} 
                                                    className={`flex items-center justify-between p-4 rounded-3xl border transition-all ${isHidden ? 'opacity-40 grayscale bg-slate-100 dark:bg-slate-800' : `${T.nav} hover:border-indigo-500/30`}`}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${theme === 'light' ? 'bg-slate-100' : 'bg-white/5'} ${sec.color}`}>
                                                            {sec.icon}
                                                        </div>
                                                        <div>
                                                            <div className={`text-xs font-black ${T.text}`}>{sec.label}</div>
                                                            <div className={`text-[10px] font-bold ${T.subtext} mt-0.5`}>{sec.sub}</div>
                                                        </div>
                                                    </div>
                                                    <button 
                                                        onClick={() => toggleSection(sec.key, isHidden)} 
                                                        disabled={isWorking}
                                                        className={`relative w-14 h-7 rounded-full transition-all duration-500 shadow-inner ${isHidden ? 'bg-slate-300 dark:bg-slate-800' : 'bg-emerald-500'}`}
                                                    >
                                                        {isWorking ? (
                                                            <RefreshCw className="w-4 h-4 text-white animate-spin absolute inset-0 m-auto" />
                                                        ) : (
                                                            <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all shadow-md ${isHidden ? 'right-1' : 'left-1'}`} />
                                                        )}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                            </div>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
