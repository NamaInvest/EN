'use client';
import { useState, useEffect } from 'react';
import { Activity, ArrowDownRight, ArrowUpRight, Repeat, Edit3 } from 'lucide-react';

export default function StockMovementsPage() {
    const [movements, setMovements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        setLoading(true);
        try {
            const token = localStorage.getItem('token') || '';
            const res = await fetch('/api/stock/movements', { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) setMovements(await res.json());
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    }

    const getTypeDetails = (type: string) => {
        switch(type) {
            case 'in': return { icon: <ArrowDownRight size={16}/>, color: '#10b981', label: 'دخول (وارد)' };
            case 'out': return { icon: <ArrowUpRight size={16}/>, color: '#ef4444', label: 'خروج (منصرف)' };
            case 'transfer': return { icon: <Repeat size={16}/>, color: '#3b82f6', label: 'تحويل داخلي' };
            case 'adjustment': return { icon: <Edit3 size={16}/>, color: '#f59e0b', label: 'تسوية تعديلية' };
            default: return { icon: <Activity size={16}/>, color: '#6b7280', label: type };
        }
    };

    return (<>
        <div className="page-header"><h1 className="page-title">📖 دفتر الأستاذ المخزني (Stock Movements Ledger)</h1></div>
        
        <div className="page-content animate-fade-in">
            <div className="toolbar">
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>مراقبة كافة الحركات التاريخية التي تمت على المخزون لدواعي التدقيق والمحاسبة</span>
                <div className="toolbar-spacer" />
                <button onClick={loadData} className="btn btn-outline" style={{ fontSize: '12px' }}>
                    تحديث السجل
                </button>
            </div>

            <div className="card" style={{ padding: '0', overflowX: 'auto' }}>
                <table className="table" style={{ width: '100%' }}>
                    <thead>
                        <tr>
                            <th>رقم الحركة</th>
                            <th>التاريخ والوقت</th>
                            <th>المستودع</th>
                            <th>المنتج (الصنف)</th>
                            <th>نوع الحركة</th>
                            <th>الكمية</th>
                            <th>المستند المرجعي</th>
                            <th>المستخدم</th>
                            <th>ملاحظات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? <tr><td colSpan={9} style={{ textAlign: 'center', padding: '20px' }}>جاري التحميل...</td></tr> : movements.length === 0 ? <tr><td colSpan={9} style={{ textAlign: 'center', padding: '20px' }}>لا توجد حركات مسجلة</td></tr> : movements.map(m => {
                            const details = getTypeDetails(m.type);
                            return (
                                <tr key={m.id}>
                                    <td><strong style={{color: '#6366f1'}}>M-{m.id}</strong></td>
                                    <td><span dir="ltr">{new Date(m.date).toLocaleString()}</span></td>
                                    <td>{m.stock?.name}</td>
                                    <td>{m.product?.name} <span style={{fontSize:'11px', color:'#888'}}>({m.product?.sku})</span></td>
                                    <td>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: details.color, fontSize: '13px', fontWeight: 600 }}>
                                            {details.icon} {details.label}
                                        </span>
                                    </td>
                                    <td><strong style={{color: details.color}}>{m.type === 'out' ? '-' : '+'}{m.quantity}</strong></td>
                                    <td><span style={{backgroundColor: '#f3f4f6', padding: '3px 8px', borderRadius: '4px', fontSize: '11px'}}>{m.referenceType || 'N/A'} {m.referenceId ? `#${m.referenceId}` : ''}</span></td>
                                    <td>{m.user?.fullName || 'النظام'}</td>
                                    <td style={{fontSize:'12px', maxWidth:'200px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}} title={m.notes}>{m.notes || '-'}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    </>);
}