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
    user?: {
        fullName: string;
        role: string;
    };
}

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    async function fetchData() {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/audit-logs', { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) {
                setLogs(await res.json());
            } else if (res.status === 403) {
                // Not authorized
                setLogs([]);
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }

    useEffect(() => {
        fetchData();
    }, []);

    const filteredLogs = logs.filter(l => 
        l.action.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (l.tableName && l.tableName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (l.user && l.user.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (l.details && l.details.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const getActionBadge = (action: string) => {
        if (action.includes('CREATE') || action.includes('إضافة')) return 'badge-success';
        if (action.includes('UPDATE') || action.includes('تعديل')) return 'badge-warning';
        if (action.includes('DELETE') || action.includes('حذف')) return 'badge-danger';
        return 'badge-outline';
    };

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">🛡️ سجل المراقبة والتدقيق (Audit Logs)</h1>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <input 
                        type="text" 
                        className="input" 
                        placeholder="بحث في السجل..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: '300px' }}
                    />
                    <button className="btn btn-ghost" onClick={fetchData}>🔄 تحديث</button>
                </div>
            </div>

            <div className="page-content animate-fade-in">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>الوقت والتاريخ</th>
                                <th>المستخدم</th>
                                <th>العملية</th>
                                <th>الجدول (Table)</th>
                                <th>رقم السجل (ID)</th>
                                <th>التفاصيل</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>جاري التحميل...</td></tr>
                                : filteredLogs.length === 0 ? <tr><td colSpan={6}><div className="empty-state"><div className="empty-state-text">لا توجد حركات مسجلة أو ليس لديك صلاحية</div></div></td></tr>
                                    : filteredLogs.map((log) => (
                                        <tr key={log.id}>
                                            <td style={{ whiteSpace: 'nowrap', fontSize: '13px', color: 'var(--text-muted)' }}>
                                                {new Date(log.date).toLocaleString('ar-SA')}
                                            </td>
                                            <td style={{ fontWeight: 'bold' }}>
                                                {log.user ? `${log.user.fullName} (${log.user.role})` : 'نظام آلي'}
                                            </td>
                                            <td>
                                                <span className={`badge ${getActionBadge(log.action)}`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td dir="ltr" style={{ fontSize: '14px' }}>{log.tableName || '-'}</td>
                                            <td><span className="badge badge-outline">{log.recordId || '-'}</span></td>
                                            <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.details || ''}>
                                                {log.details || '-'}
                                            </td>
                                        </tr>
                                    ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}
