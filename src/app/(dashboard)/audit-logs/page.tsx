'use client';

import { useState, useEffect } from 'react';

interface AuditLog {
    id: number;
    userId: number | null;
    action: string;
    tableName: string | null;
    recordId: number | null;
    details: string | null;
    date: string;
    user: { fullName: string; username: string } | null;
}

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterLimit, setFilterLimit] = useState('100');

    const token = () => localStorage.getItem('token') || '';
    const headers = () => ({ Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' });

    async function fetchData() {
        setLoading(true);
        try {
            const res = await fetch(`/api/audit-logs?limit=${filterLimit}`, { headers: headers() });
            if (res.ok) setLogs(await res.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, [filterLimit]);

    const getActionBadge = (action: string) => {
        const act = action.toLowerCase();
        if (act.includes('create') || act.includes('add')) return <span className="badge badge-success">➕ إنشاء</span>;
        if (act.includes('update') || act.includes('edit')) return <span className="badge badge-warning">✏️ تعديل</span>;
        if (act.includes('delete') || act.includes('remove')) return <span className="badge badge-error">🗑️ حذف</span>;
        if (act.includes('login')) return <span className="badge badge-info">🔐 دخول</span>;
        return <span className="badge badge-ghost">{action}</span>;
    };

    const formatTable = (tbl: string | null) => {
        if (!tbl) return '-';
        const m = {
            'users': '👥 المستخدمين', 'products': '📦 المنتجات', 'sales_invoices': '🧾 فواتير البيع',
            'purchase_invoices': '🛒 فواتير الشراء', 'expenses': '💸 المصروفات', 'customers': '🤝 العملاء'
        };
        return (m as any)[tbl] || tbl;
    };

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>🛡️ سجل حركات النظام (Audit Logs)</h1>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <label style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>عرض آخر:</label>
                    <select className="input" style={{ width: '120px', padding: '6px' }} value={filterLimit} onChange={e => setFilterLimit(e.target.value)}>
                        <option value="100">100 حركة</option>
                        <option value="500">500 حركة</option>
                        <option value="1000">1000 حركة</option>
                    </select>
                    <button className="btn btn-ghost" onClick={fetchData}>🔄 تحديث</button>
                </div>
            </div>

            <div className="card">
                <div className="table-container">
                    <table className="table" style={{ fontSize: '14px' }}>
                        <thead><tr><th>التاريخ والوقت</th><th>المستخدم</th><th>نوع الحركة</th><th>الجدول/القسم</th><th>رقم السجل</th><th>تفاصيل إضافية</th></tr></thead>
                        <tbody>
                            {loading ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>جاري التحميل...</td></tr>
                            : logs.length === 0 ? <tr><td colSpan={6}><div className="empty-state"><div className="empty-state-icon">🛡️</div><div className="empty-state-text">لا يوجد حركات مسجلة</div></div></td></tr>
                            : logs.map(l => (
                                <tr key={l.id}>
                                    <td dir="ltr" style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>{new Date(l.date).toLocaleString('ar-SA')}</td>
                                    <td style={{ fontWeight: '600' }}>{l.user ? `${l.user.fullName} (@${l.user.username})` : 'نظام تلقائي'}</td>
                                    <td>{getActionBadge(l.action)}</td>
                                    <td><span className="badge badge-outline">{formatTable(l.tableName)}</span></td>
                                    <td>{l.recordId ? `#${l.recordId}` : '-'}</td>
                                    <td style={{ color: 'var(--text-muted)', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={l.details || ''}>
                                        {l.details || '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
