'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { useSettings } from '@/lib/SettingsContext';

const L: Record<string, Record<string, string>> = {
    ar: {
        title: 'قواعد توزيع التكاليف (CO-PA Allocation)',
        subtitle: 'توزيع المصاريف العمومية على مستندات الربحية وفق أسس محددة',
        name: 'اسم القاعدة',
        basis: 'أساس التوزيع',
        srcAccount: 'حساب المصدر',
        status: 'الحالة',
        active: 'نشطة',
        inactive: 'معطلة',
        add: 'إضافة قاعدة',
        run: 'تشغيل',
        noRules: 'لا توجد قواعد — أضف قاعدة توزيع جديدة',
        periodFrom: 'من فترة',
        periodTo: 'إلى فترة',
        running: 'جاري التوزيع...',
        result: 'تم توزيع التكاليف على',
        docs: 'مستند',
        REVENUE: 'بنسبة الإيرادات',
        HEADCOUNT: 'بعدد الموظفين',
        EQUAL: 'بالتساوي',
        CUSTOM_FORMULA: 'معادلة مخصصة',
    },
    en: {
        title: 'Cost Allocation Rules (CO-PA)',
        subtitle: 'Distribute overhead costs to profitability documents based on defined allocation bases',
        name: 'Rule Name',
        basis: 'Allocation Basis',
        srcAccount: 'Source Account',
        status: 'Status',
        active: 'Active',
        inactive: 'Inactive',
        add: 'Add Rule',
        run: 'Run',
        noRules: 'No rules — add a new allocation rule',
        periodFrom: 'Period From',
        periodTo: 'Period To',
        running: 'Allocating...',
        result: 'Allocated to',
        docs: 'documents',
        REVENUE: 'Revenue-based',
        HEADCOUNT: 'Headcount-based',
        EQUAL: 'Equal Split',
        CUSTOM_FORMULA: 'Custom Formula',
    },
};

export default function CopaRulesPage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const { getSetting } = useSettings();
    const t = L[lang] || L.ar;
    const isRtl = lang === 'ar';

    const [rules, setRules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ name: '', basis: 'REVENUE', srcAccount: '' });
    const [runResult, setRunResult] = useState<string | null>(null);

    useEffect(() => { loadRules(); }, []);

    const loadRules = async () => {
        try {
            const res = await fetch('/api/copa/allocations');
            const json = await res.json();
            setRules(Array.isArray(json) ? json : []);
        } catch { setRules([]); }
        setLoading(false);
    };

    const submitRule = async () => {
        if (!form.name || !form.srcAccount) return;
        try {
            await fetch('/api/copa/allocations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, ruleId: undefined }),
            });
            // Actually create via characteristics endpoint would be better — 
            // but for simplicity we note this needs a POST to /api/copa/allocations
        } catch {}
        setShowForm(false);
        setForm({ name: '', basis: 'REVENUE', srcAccount: '' });
        loadRules();
    };

    const runRule = async (ruleId: number) => {
        setRunResult(null);
        const now = new Date();
        const periodFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const periodTo = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        
        try {
            const res = await fetch('/api/copa/allocations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ruleId, periodFrom, periodTo }),
            });
            const json = await res.json();
            setRunResult(`${t.result} ${json.allocated} ${t.docs}`);
        } catch {
            setRunResult('Error');
        }
    };

    return (
        <div dir={isRtl ? 'rtl' : 'ltr'} style={{ padding: '30px', fontFamily: "'Inter','Tajawal',sans-serif", maxWidth: 1000, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', margin: 0 }}>⚙️ {t.title}</h1>
                    <p style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>{t.subtitle}</p>
                </div>
                <button onClick={() => setShowForm(!showForm)} style={{ padding: '8px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    + {t.add}
                </button>
            </div>

            {/* Result Banner */}
            {runResult && (
                <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: 10, padding: '10px 16px', marginBottom: 16, color: '#166534', fontSize: 13 }}>
                    ✅ {runResult}
                </div>
            )}

            {/* Add Form */}
            {showForm && (
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, marginBottom: 20 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                        <div>
                            <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>{t.name}</label>
                            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13 }} />
                        </div>
                        <div>
                            <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>{t.basis}</label>
                            <select value={form.basis} onChange={e => setForm({ ...form, basis: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13 }}>
                                <option value="REVENUE">{t.REVENUE}</option>
                                <option value="HEADCOUNT">{t.HEADCOUNT}</option>
                                <option value="EQUAL">{t.EQUAL}</option>
                                <option value="CUSTOM_FORMULA">{t.CUSTOM_FORMULA}</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>{t.srcAccount}</label>
                            <input value={form.srcAccount} onChange={e => setForm({ ...form, srcAccount: e.target.value })} placeholder="6xxx" style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13 }} />
                        </div>
                    </div>
                    <button onClick={submitRule} style={{ padding: '8px 24px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                        💾 {t.add}
                    </button>
                </div>
            )}

            {/* Rules List */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>⏳</div>
            ) : rules.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12 }}>
                    <p style={{ fontSize: 40, margin: 0 }}>📭</p>
                    <p>{t.noRules}</p>
                </div>
            ) : (
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                            <tr style={{ background: '#f8fafc' }}>
                                <th style={{ padding: '12px 14px', textAlign: isRtl ? 'right' : 'left', fontWeight: 600, color: '#334155', borderBottom: '1px solid #e2e8f0' }}>{t.name}</th>
                                <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 600, color: '#334155', borderBottom: '1px solid #e2e8f0' }}>{t.basis}</th>
                                <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 600, color: '#334155', borderBottom: '1px solid #e2e8f0' }}>{t.srcAccount}</th>
                                <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 600, color: '#334155', borderBottom: '1px solid #e2e8f0' }}>{t.status}</th>
                                <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 600, color: '#334155', borderBottom: '1px solid #e2e8f0' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {rules.map((rule: any) => (
                                <tr key={rule.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '10px 14px', fontWeight: 600, color: '#1e293b' }}>{rule.name}</td>
                                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                        <span style={{ padding: '2px 10px', borderRadius: 10, fontSize: 11, background: '#eff6ff', color: '#2563eb' }}>
                                            {t[rule.basis] || rule.basis}
                                        </span>
                                    </td>
                                    <td style={{ padding: '10px 14px', textAlign: 'center', fontFamily: 'monospace', color: '#6366f1' }}>{rule.srcAccount}</td>
                                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                        <span style={{ padding: '2px 10px', borderRadius: 10, fontSize: 11, background: rule.active ? '#dcfce7' : '#fee2e2', color: rule.active ? '#166534' : '#991b1b' }}>
                                            {rule.active ? t.active : t.inactive}
                                        </span>
                                    </td>
                                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                        <button onClick={() => runRule(rule.id)} style={{ padding: '4px 14px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 6, color: '#166534', fontSize: 11, cursor: 'pointer' }}>
                                            ▶ {t.run}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
