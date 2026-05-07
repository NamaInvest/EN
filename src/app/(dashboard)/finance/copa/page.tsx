'use client';
import { useState, useEffect } from 'react';
import { useSettings } from '@/lib/SettingsContext';

const L: Record<string, Record<string, string>> = {
    ar: {
        title: 'تحليل الربحية (CO-PA)',
        subtitle: 'تحليل الهامش بأبعاد متعددة — عميل × منتج × قناة × منطقة',
        dims: 'أبعاد التجميع',
        from: 'من تاريخ',
        to: 'إلى تاريخ',
        run: 'تشغيل التحليل',
        revenue: 'الإيرادات',
        cogs: 'تكلفة البضاعة',
        discount: 'الخصومات',
        freight: 'الشحن',
        cm: 'هامش المساهمة',
        pct: 'نسبة الهامش %',
        count: 'العمليات',
        total: 'الإجمالي',
        noData: 'لا توجد بيانات — قم بإصدار فواتير مبيعات أولاً',
        loading: 'جاري التحليل...',
        customerId: 'العميل',
        productId: 'المنتج',
        channelCode: 'القناة',
        regionCode: 'المنطقة',
        profitCenterId: 'مركز الربحية',
        segmentId: 'القطاع',
        rules: 'قواعد التوزيع',
    },
    en: {
        title: 'Profitability Analysis (CO-PA)',
        subtitle: 'Multi-dimensional margin analysis — Customer × Product × Channel × Region',
        dims: 'Group By Dimensions',
        from: 'From Date',
        to: 'To Date',
        run: 'Run Analysis',
        revenue: 'Revenue',
        cogs: 'COGS',
        discount: 'Discounts',
        freight: 'Freight',
        cm: 'Contribution Margin',
        pct: 'Margin %',
        count: 'Transactions',
        total: 'Total',
        noData: 'No data — issue sales invoices first',
        loading: 'Analyzing...',
        customerId: 'Customer',
        productId: 'Product',
        channelCode: 'Channel',
        regionCode: 'Region',
        profitCenterId: 'Profit Center',
        segmentId: 'Segment',
        rules: 'Allocation Rules',
    },
};

const DIM_OPTIONS = [
    { value: 'customerId', key: 'customerId' },
    { value: 'productId', key: 'productId' },
    { value: 'channelCode', key: 'channelCode' },
    { value: 'regionCode', key: 'regionCode' },
    { value: 'profitCenterId', key: 'profitCenterId' },
    { value: 'segmentId', key: 'segmentId' },
];

export default function CopaPage() {
    const { getSetting } = useSettings();
    const lang = (getSetting('language', 'ar')) as 'ar' | 'en';
    const t = L[lang] || L.ar;
    const isRtl = lang === 'ar';

    const [selectedDims, setSelectedDims] = useState<string[]>(['customerId']);
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const toggleDim = (dim: string) => {
        setSelectedDims(prev =>
            prev.includes(dim) ? prev.filter(d => d !== dim) : [...prev, dim]
        );
    };

    const runAnalysis = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('dims', selectedDims.join(','));
            if (from) params.set('from', from);
            if (to) params.set('to', to);
            const res = await fetch(`/api/copa?${params}`);
            const json = await res.json();
            setData(json);
        } catch {
            setData(null);
        }
        setLoading(false);
    };

    const formatNum = (n: number) => n.toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return (
        <div dir={isRtl ? 'rtl' : 'ltr'} style={{ padding: '30px', fontFamily: "'Inter','Tajawal',sans-serif", maxWidth: 1400, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1e293b', margin: 0 }}>📊 {t.title}</h1>
                    <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>{t.subtitle}</p>
                </div>
                <a href="/finance/copa/rules" style={{ padding: '8px 20px', background: '#f1f5f9', borderRadius: 8, color: '#334155', textDecoration: 'none', fontSize: 13 }}>
                    ⚙️ {t.rules}
                </a>
            </div>

            {/* Filters */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, marginBottom: 20 }}>
                <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 8 }}>{t.dims}</label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {DIM_OPTIONS.map(d => (
                            <button key={d.value} onClick={() => toggleDim(d.value)} style={{
                                padding: '6px 14px', borderRadius: 20, border: '1px solid',
                                borderColor: selectedDims.includes(d.value) ? '#3b82f6' : '#d1d5db',
                                background: selectedDims.includes(d.value) ? '#eff6ff' : '#fff',
                                color: selectedDims.includes(d.value) ? '#2563eb' : '#64748b',
                                fontSize: 12, cursor: 'pointer', fontWeight: selectedDims.includes(d.value) ? 600 : 400,
                                transition: 'all .2s',
                            }}>
                                {t[d.key]}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div>
                        <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>{t.from}</label>
                        <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13 }} />
                    </div>
                    <div>
                        <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>{t.to}</label>
                        <input type="date" value={to} onChange={e => setTo(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13 }} />
                    </div>
                    <button onClick={runAnalysis} disabled={loading} style={{
                        padding: '8px 24px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8,
                        fontSize: 13, fontWeight: 600, cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1,
                    }}>
                        {loading ? t.loading : t.run}
                    </button>
                </div>
            </div>

            {/* Totals Bar */}
            {data?.totals && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
                    {[
                        { label: t.revenue, value: data.totals.revenue, color: '#10b981' },
                        { label: t.cogs, value: data.totals.cogs, color: '#ef4444' },
                        { label: t.discount, value: data.totals.discount, color: '#f59e0b' },
                        { label: t.freight, value: data.totals.freight, color: '#6366f1' },
                        { label: t.cm, value: data.totals.contributionMargin, color: data.totals.contributionMargin >= 0 ? '#059669' : '#dc2626' },
                    ].map((card, i) => (
                        <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px' }}>
                            <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>{card.label}</p>
                            <p style={{ fontSize: 20, fontWeight: 700, color: card.color, margin: '4px 0 0' }}>{formatNum(card.value)}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Results Table */}
            {data?.rows && data.rows.length > 0 ? (
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                            <tr style={{ background: '#f8fafc' }}>
                                {selectedDims.map(dim => (
                                    <th key={dim} style={{ padding: '12px 14px', textAlign: isRtl ? 'right' : 'left', fontWeight: 600, color: '#334155', borderBottom: '1px solid #e2e8f0' }}>
                                        {t[dim] || dim}
                                    </th>
                                ))}
                                <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 600, color: '#334155', borderBottom: '1px solid #e2e8f0' }}>{t.revenue}</th>
                                <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 600, color: '#334155', borderBottom: '1px solid #e2e8f0' }}>{t.cogs}</th>
                                <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 600, color: '#334155', borderBottom: '1px solid #e2e8f0' }}>{t.cm}</th>
                                <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 600, color: '#334155', borderBottom: '1px solid #e2e8f0' }}>{t.pct}</th>
                                <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 600, color: '#334155', borderBottom: '1px solid #e2e8f0' }}>{t.count}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.rows.map((row: any, i: number) => (
                                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    {selectedDims.map(dim => (
                                        <td key={dim} style={{ padding: '10px 14px', color: '#475569' }}>{row[dim] ?? '—'}</td>
                                    ))}
                                    <td style={{ padding: '10px 14px', textAlign: 'center', color: '#10b981', fontWeight: 600 }}>{formatNum(row.revenue)}</td>
                                    <td style={{ padding: '10px 14px', textAlign: 'center', color: '#ef4444' }}>{formatNum(row.cogs)}</td>
                                    <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: row.contributionMargin >= 0 ? '#059669' : '#dc2626' }}>
                                        {formatNum(row.contributionMargin)}
                                    </td>
                                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                        <span style={{
                                            display: 'inline-block', padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                                            background: row.marginPct >= 30 ? '#dcfce7' : row.marginPct >= 10 ? '#fef3c7' : '#fee2e2',
                                            color: row.marginPct >= 30 ? '#166534' : row.marginPct >= 10 ? '#92400e' : '#991b1b',
                                        }}>
                                            {row.marginPct}%
                                        </span>
                                    </td>
                                    <td style={{ padding: '10px 14px', textAlign: 'center', color: '#64748b' }}>{row.count}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : data ? (
                <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12 }}>
                    <p style={{ fontSize: 40, margin: 0 }}>📭</p>
                    <p>{t.noData}</p>
                </div>
            ) : null}
        </div>
    );
}
