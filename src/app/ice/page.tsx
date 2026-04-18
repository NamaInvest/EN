'use client';

import { useState, useEffect, useCallback } from 'react';

// ── جميع الأقسام مرتّبة كما في Sidebar ──────────────────────────────────
const ALL_SECTIONS = [
    { key: 'Sales',         icon: '💰', label: 'المبيعات', sub: 'فواتير + عروض أسعار + مرتجعات' },
    { key: 'POS',           icon: '🛒', label: 'نقطة البيع', sub: 'POS + مطاعم + ورديات' },
    { key: 'Purchases',     icon: '🛍️', label: 'المشتريات', sub: 'فواتير + أوامر شراء + مرتجعات' },
    { key: 'Inventory',     icon: '📦', label: 'المخزون والمستودعات', sub: 'أصناف + مخازن + جرد + باركود' },
    { key: 'Finance',       icon: '📊', label: 'المالية والحسابات', sub: 'محاسبة + خزينة + أصول ثابتة' },
    { key: 'HR',            icon: '👥', label: 'الموارد البشرية', sub: 'موظفون + رواتب + حضور + إجازات' },
    { key: 'Manufacturing', icon: '🏭', label: 'التصنيع والإنتاج', sub: 'BOM + MRP + جودة' },
    { key: 'CRM',           icon: '🤝', label: 'العملاء والتسويق', sub: 'عملاء + ولاء + كوبونات + حجوزات' },
    { key: 'Enterprise',    icon: '🏗️', label: 'الأنظمة المتخصصة', sub: 'مشاريع + عقارات + أسطول + مدارس' },
    { key: 'AI',            icon: '🤖', label: 'الذكاء الاصطناعي', sub: 'AI Copilot + CFO + SCM + Bank' },
    { key: 'Reports',       icon: '📈', label: 'التقارير', sub: 'تقارير المبيعات والمالية والمخزون' },
    { key: 'Settings',      icon: '⚙️', label: 'الإعدادات', sub: 'فروع + عملات + موافقات + واتساب' },
];

const PLANS = [
    { value: 'free', label: 'مجاني', color: '#64748b' },
    { value: 'basic', label: 'أساسي', color: '#6366f1' },
    { value: 'professional', label: 'احترافي', color: '#a855f7' },
    { value: 'enterprise', label: 'مؤسسات', color: '#f59e0b' },
];

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

export default function IcePage() {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selected, setSelected] = useState<Tenant | null>(null);
    const [busy, setBusy] = useState('');
    const [editQuota, setEditQuota] = useState({ inv: '', prod: '', user: '' });
    const [extendDays, setExtendDays] = useState('30');
    const [newPlan, setNewPlan] = useState('basic');

    const fetchTenants = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const res = await fetch('/api/ice/tenants');
            const data = await res.json();
            if (!data.success) throw new Error(data.error || 'فشل');
            setTenants(data.tenants);
        } catch (e: any) { setError(e.message); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchTenants(); }, [fetchTenants]);

    const selectTenant = (t: Tenant) => {
        setSelected(t);
        setEditQuota({ inv: String(t.invoiceQuota), prod: String(t.productQuota), user: String(t.userQuota) });
        setNewPlan(t.plan);
    };

    // تحديث المستأجر المحدد بعد عملية ناجحة
    const refreshSelected = async () => {
        await fetchTenants();
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
            if (data.success) await refreshSelected();
            else alert('خطأ: ' + data.error);
        } catch { alert('فشل الاتصال'); }
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

    const activeCount = tenants.filter(t => t.subscriptionStatus === 'active').length;
    const trialCount = tenants.filter(t => t.subscriptionStatus === 'trial' && !t.isExpired).length;
    const expiredCount = tenants.filter(t => t.isExpired).length;

    const statusColor = (t: Tenant) => {
        if (t.subscriptionStatus === 'active') return '#22c55e';
        if (t.isExpired) return '#ef4444';
        if (t.subscriptionStatus === 'suspended') return '#f97316';
        return '#eab308';
    };
    const statusLabel = (t: Tenant) => {
        if (t.subscriptionStatus === 'active') return 'مدفوع';
        if (t.isExpired) return 'منتهي';
        if (t.subscriptionStatus === 'suspended') return 'موقوف';
        return `تجريبي ${t.daysRemaining}ي`;
    };
    const planColor = (p: string) => PLANS.find(x => x.value === p)?.color || '#64748b';

    const S = { /* styles shorthand */
        card: { background: '#0d1117', border: '1px solid #1a2535', borderRadius: 16, padding: 20 },
        label: { color: '#94a3b8', fontSize: 11, display: 'block' as const, marginBottom: 5 },
        input: { width: '100%', background: '#111827', border: '1px solid #1e293b', borderRadius: 8, padding: '8px 12px', color: '#e2e8f0', fontSize: 14 },
        btn: (color: string) => ({ padding: '6px 16px', borderRadius: 8, border: `1px solid ${color}40`, background: `${color}15`, color, cursor: 'pointer' as const, fontSize: 13 }),
    };

    return (
        <div dir="rtl" style={{ minHeight: '100vh', background: '#0a0e1a', color: '#e2e8f0', fontFamily: "'Courier New', monospace" }}>
            {/* TopBar */}
            <div style={{ borderBottom: '1px solid #00ff9430', background: '#0d1117', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#00ff94', animation: 'pulse 2s infinite' }} />
                    <span style={{ color: '#00ff94', fontSize: 18, fontWeight: 700, letterSpacing: 4 }}>ICE PANEL</span>
                    <span style={{ color: '#475569', fontSize: 11 }}>// SUPER ADMIN — {tenants.length} مستأجر</span>
                </div>
                <div style={{ display: 'flex', gap: 20, fontSize: 12, alignItems: 'center' }}>
                    <span style={{ color: '#22c55e' }}>● مدفوع: {activeCount}</span>
                    <span style={{ color: '#eab308' }}>● تجريبي: {trialCount}</span>
                    <span style={{ color: '#ef4444' }}>● منتهي: {expiredCount}</span>
                    <button onClick={fetchTenants} style={{ ...S.btn('#00ff94'), fontSize: 12 }}>↺ تحديث</button>
                </div>
            </div>

            <div style={{ display: 'flex', height: 'calc(100vh - 53px)' }}>
                {/* Sidebar */}
                <div style={{ width: 300, borderLeft: '1px solid #1a2535', overflowY: 'auto', background: '#0d1117', flexShrink: 0 }}>
                    {loading ? <div style={{ padding: 40, textAlign: 'center', color: '#00ff94' }}>⟳ جاري التحميل...</div>
                        : error ? <div style={{ padding: 16, color: '#ef4444', fontSize: 13 }}>⚠️ {error}</div>
                        : tenants.length === 0 ? <div style={{ padding: 40, textAlign: 'center', color: '#475569' }}>لا يوجد مستأجرين</div>
                        : tenants.map(t => (
                            <div key={t.subdomain} onClick={() => selectTenant(t)}
                                style={{
                                    padding: '14px 16px', borderBottom: '1px solid #1a2535', cursor: 'pointer',
                                    background: selected?.subdomain === t.subdomain ? '#111827' : 'transparent',
                                    borderRight: selected?.subdomain === t.subdomain ? '3px solid #00ff94' : '3px solid transparent',
                                }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <span style={{ color: '#00ff94', fontWeight: 700, fontSize: 14 }}>{t.subdomain}</span>
                                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: statusColor(t) + '22', color: statusColor(t) }}>{statusLabel(t)}</span>
                                </div>
                                <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 3 }}>{t.companyNameAr}</div>
                                <div style={{ color: '#475569', fontSize: 11, marginBottom: 6 }}>{t.email}</div>
                                <div style={{ display: 'flex', gap: 8, fontSize: 11, flexWrap: 'wrap' as const }}>
                                    <span style={{ color: '#60a5fa' }}>🧾 {t.invoiceCount}/{t.invoiceQuota}</span>
                                    <span style={{ color: '#a78bfa' }}>📦 {t.productCount}/{t.productQuota}</span>
                                    <span style={{ color: '#34d399' }}>👤 {t.userCount}/{t.userQuota}</span>
                                    <span style={{ marginRight: 'auto', color: planColor(t.plan), fontWeight: 700, fontSize: 10 }}>{PLANS.find(p => p.value === t.plan)?.label}</span>
                                </div>
                            </div>
                        ))}
                </div>

                {/* Detail */}
                <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
                    {!selected ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#1e293b', flexDirection: 'column', gap: 12 }}>
                            <div style={{ fontSize: 64 }}>❄️</div>
                            <div style={{ fontSize: 16 }}>اختر مستأجراً من القائمة</div>
                        </div>
                    ) : (
                        <div style={{ maxWidth: 900, display: 'flex', flexDirection: 'column', gap: 20 }}>

                            {/* ── Header ── */}
                            <div style={S.card}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                                    <div>
                                        <h1 style={{ color: '#00ff94', fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>{selected.companyNameAr}</h1>
                                        <div style={{ color: '#64748b', fontSize: 12 }}>{selected.companyNameEn}</div>
                                        <a href={`https://${selected.domainUrl}`} target="_blank" rel="noreferrer"
                                            style={{ color: '#818cf8', fontSize: 12, textDecoration: 'none', display: 'inline-block', marginTop: 4 }}>
                                            🔗 {selected.domainUrl}
                                        </a>
                                    </div>
                                    <div style={{ textAlign: 'left', fontSize: 12, lineHeight: 1.8 }}>
                                        <div style={{ color: '#475569' }}>📧 {selected.email}</div>
                                        <div style={{ color: '#475569' }}>🔢 {selected.vatNumber}</div>
                                        <div style={{ color: '#00ff94', fontFamily: 'monospace' }}>💾 {selected.dbName}</div>
                                    </div>
                                </div>

                                {/* Stats Grid */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 16, paddingTop: 16, borderTop: '1px solid #1a2535' }}>
                                    {[
                                        { label: 'أيام متبقية', value: selected.daysRemaining, color: selected.isExpired ? '#ef4444' : '#22c55e' },
                                        { label: `فواتير ${selected.invoiceCount}/${selected.invoiceQuota}`, value: Math.round((selected.invoiceCount / selected.invoiceQuota) * 100) + '%', color: '#60a5fa' },
                                        { label: `أصناف ${selected.productCount}/${selected.productQuota}`, value: Math.round((selected.productCount / selected.productQuota) * 100) + '%', color: '#a78bfa' },
                                        { label: `مستخدمون ${selected.userCount}/${selected.userQuota}`, value: selected.userCount + '/' + selected.userQuota, color: '#34d399' },
                                    ].map(s => (
                                        <div key={s.label} style={{ textAlign: 'center', background: '#111827', borderRadius: 10, padding: 12 }}>
                                            <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
                                            <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>{s.label}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* ── Subscription Controls ── */}
                            <div style={S.card}>
                                <h2 style={{ color: '#00ff94', fontSize: 12, fontWeight: 700, letterSpacing: 3, margin: '0 0 16px' }}>⚡ إدارة الاشتراك</h2>

                                {/* Row 1: مد التجربة */}
                                <div style={{ marginBottom: 16 }}>
                                    <label style={S.label}>مد فترة التجربة</label>
                                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                        {['7', '14', '30', '60', '90'].map(d => (
                                            <button key={d} onClick={() => setExtendDays(d)}
                                                style={{ padding: '5px 14px', borderRadius: 8, border: `1px solid ${extendDays === d ? '#00ff94' : '#1e293b'}`, background: extendDays === d ? '#00ff9415' : 'transparent', color: extendDays === d ? '#00ff94' : '#64748b', cursor: 'pointer', fontSize: 13 }}>
                                                +{d}
                                            </button>
                                        ))}
                                        <button onClick={() => doAction('extend', { days: parseInt(extendDays) })} disabled={!!busy} style={{ ...S.btn('#22c55e'), marginRight: 'auto' }}>
                                            {busy === 'extend' ? '...' : '⏱️ تمديد'}
                                        </button>
                                    </div>
                                </div>

                                {/* Row 2: تفعيل مدفوع */}
                                <div style={{ marginBottom: 16 }}>
                                    <label style={S.label}>تفعيل اشتراك مدفوع</label>
                                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                        {PLANS.filter(p => p.value !== 'free').map(p => (
                                            <button key={p.value} onClick={() => setNewPlan(p.value)}
                                                style={{ padding: '5px 14px', borderRadius: 8, border: `1px solid ${newPlan === p.value ? p.color : '#1e293b'}`, background: newPlan === p.value ? p.color + '20' : 'transparent', color: newPlan === p.value ? p.color : '#64748b', cursor: 'pointer', fontSize: 13 }}>
                                                {p.label}
                                            </button>
                                        ))}
                                        <button onClick={() => doAction('activate_paid', { plan: newPlan })} disabled={!!busy} style={{ ...S.btn('#a855f7'), marginRight: 'auto' }}>
                                            {busy === 'activate_paid' ? '...' : '💎 تفعيل'}
                                        </button>
                                    </div>
                                </div>

                                {/* Row 3: الحدود */}
                                <div style={{ marginBottom: 16 }}>
                                    <label style={S.label}>الحدود (Quotas)</label>
                                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                                        {[
                                            { id: 'inv', label: 'فواتير', color: '#60a5fa' },
                                            { id: 'prod', label: 'أصناف', color: '#a78bfa' },
                                            { id: 'user', label: 'مستخدمون', color: '#34d399' },
                                        ].map(q => (
                                            <div key={q.id} style={{ flex: 1, minWidth: 100 }}>
                                                <div style={{ color: '#64748b', fontSize: 10, marginBottom: 4 }}>{q.label}</div>
                                                <input type="number" value={editQuota[q.id as keyof typeof editQuota]}
                                                    onChange={e => setEditQuota(prev => ({ ...prev, [q.id]: e.target.value }))}
                                                    style={{ ...S.input, color: q.color }} />
                                            </div>
                                        ))}
                                        <button onClick={() => doAction('set_quota', {
                                            invoiceQuota: parseInt(editQuota.inv),
                                            productQuota: parseInt(editQuota.prod),
                                            userQuota: parseInt(editQuota.user),
                                        })} disabled={!!busy} style={{ ...S.btn('#60a5fa'), alignSelf: 'flex-end', whiteSpace: 'nowrap' as const }}>
                                            {busy === 'set_quota' ? '...' : '💾 حفظ الحدود'}
                                        </button>
                                    </div>
                                </div>

                                {/* Row 4: إيقاف */}
                                <button onClick={() => { if (confirm('هل تريد إيقاف هذا الحساب؟')) doAction('suspend'); }} disabled={!!busy}
                                    style={{ ...S.btn('#f97316') }}>
                                    🚫 إيقاف الحساب
                                </button>
                            </div>

                            {/* ── Module Controls ── */}
                            <div style={S.card}>
                                <h2 style={{ color: '#00ff94', fontSize: 12, fontWeight: 700, letterSpacing: 3, margin: '0 0 16px' }}>🔧 التحكم في الأقسام والوحدات ({ALL_SECTIONS.length} قسم)</h2>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 10 }}>
                                    {ALL_SECTIONS.map(sec => {
                                        const isHidden = selected.hiddenModules.includes(sec.key);
                                        const isWorking = busy === `sec_${sec.key}`;
                                        return (
                                            <div key={sec.key} style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                padding: '12px 16px', border: `1px solid ${isHidden ? '#1e293b' : '#00ff9420'}`,
                                                borderRadius: 10, background: isHidden ? 'transparent' : '#00ff9408',
                                                opacity: isHidden ? 0.6 : 1, transition: 'all 0.2s',
                                            }}>
                                                <div>
                                                    <div style={{ fontSize: 14, color: isHidden ? '#475569' : '#e2e8f0' }}>
                                                        {sec.icon} {sec.label}
                                                    </div>
                                                    <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{sec.sub}</div>
                                                </div>
                                                <button onClick={() => toggleSection(sec.key, isHidden)} disabled={isWorking}
                                                    style={{
                                                        position: 'relative', width: 44, height: 24, borderRadius: 99,
                                                        border: 'none', cursor: 'pointer', flexShrink: 0, marginRight: 8,
                                                        background: isHidden ? '#374151' : '#00ff9470',
                                                        transition: 'background 0.2s',
                                                    }}>
                                                    <span style={{
                                                        position: 'absolute', top: 3,
                                                        left: isHidden ? 3 : undefined, right: isHidden ? undefined : 3,
                                                        width: 18, height: 18, borderRadius: '50%',
                                                        background: 'white', transition: 'all 0.2s', display: 'block',
                                                    }} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
