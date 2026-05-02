'use client';
import { useState, useEffect } from 'react';
import { RefreshCw, Search, ArrowDownCircle } from 'lucide-react';
import { useTranslation } from "@/lib/i18n";

export default function ReturnsReportPage() {
    const { t } = useTranslation();
    const [returns, setReturns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Filters
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        setLoading(true);
        try {
            const token = localStorage.getItem('token') || '';
            const query = new URLSearchParams();
            if (dateFrom) query.append('from', dateFrom);
            if (dateTo) query.append('to', dateTo);

            const res = await fetch(`/api/reports/returns?${query.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) setReturns(await res.json());
        } catch (e) { console.error(e); }
        setLoading(false);
    }

    const totalRestockingFees = returns.reduce((sum, r) => sum + (r.restockingFee || 0), 0);
    const totalReturnsValue = returns.reduce((sum, r) => sum + (r.total || 0), 0);

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">تقرير المرتجعات والتوالف (RMA & Returns Report)</h1>
            </div>

            <div className="page-content animate-fade-in">
                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ padding: '15px', backgroundColor: '#eff6ff', color: '#3b82f6', borderRadius: '12px' }}>
                            <RefreshCw size={24} />
                        </div>
                        <div>
                            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px' }}>إجمالي المرتجعات</p>
                            <h3 style={{ margin: '5px 0 0 0', fontSize: '24px' }}>{returns.length}</h3>
                        </div>
                    </div>
                    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ padding: '15px', backgroundColor: '#fef2f2', color: '#ef4444', borderRadius: '12px' }}>
                            <ArrowDownCircle size={24} />
                        </div>
                        <div>
                            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px' }}>قيمة البضاعة المرتجعة</p>
                            <h3 style={{ margin: '5px 0 0 0', fontSize: '24px' }}>{totalReturnsValue.toFixed(2)} ر.س</h3>
                        </div>
                    </div>
                    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ padding: '15px', backgroundColor: '#ecfdf5', color: '#10b981', borderRadius: '12px' }}>
                            <span style={{ fontSize: '24px', fontWeight: 'bold' }}>%</span>
                        </div>
                        <div>
                            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px' }}>رسوم إعادة التخزين المحصلة (Restocking Fee)</p>
                            <h3 style={{ margin: '5px 0 0 0', fontSize: '24px', color: '#10b981' }}>{totalRestockingFees.toFixed(2)} ر.س</h3>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="card" style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                        <div className="input-group" style={{ margin: 0, width: '200px' }}>
                            <label className="input-label">من تاريخ</label>
                            <input type="date" className="input" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                        </div>
                        <div className="input-group" style={{ margin: 0, width: '200px' }}>
                            <label className="input-label">إلى تاريخ</label>
                            <input type="date" className="input" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                        </div>
                        <button className="btn btn-primary" onClick={loadData} style={{ height: '42px' }}>
                            <Search size={16} style={{ display: 'inline', marginRight: '5px' }} /> بحث
                        </button>
                    </div>
                </div>

                <div className="card" style={{ padding: '0', overflowX: 'auto' }}>
                    <table className="table" style={{ width: '100%' }}>
                        <thead>
                            <tr>
                                <th>رقم المرتجع</th>
                                <th>التاريخ</th>
                                <th>العميل</th>
                                <th>مستودع الوجهة (التوجيه)</th>
                                <th>رسوم التخزين (خصم)</th>
                                <th>القيمة الإجمالية</th>
                                <th>حالة زاتكا</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '20px' }}>جاري التحميل...</td></tr>
                            ) : returns.length === 0 ? (
                                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '20px' }}>لا توجد بيانات</td></tr>
                            ) : returns.map(r => (
                                <tr key={r.id}>
                                    <td><strong>RET-{r.returnNo}</strong></td>
                                    <td>{new Date(r.date).toLocaleDateString('ar-SA')}</td>
                                    <td>{r.customerId ? `عميل #${r.customerId}` : 'عميل نقدي'}</td>
                                    <td>
                                        <span style={{ 
                                            padding: '4px 8px', 
                                            borderRadius: '6px', 
                                            fontSize: '12px',
                                            backgroundColor: r.destinationStockName.includes('تالف') ? '#fee2e2' : '#f3f4f6',
                                            color: r.destinationStockName.includes('تالف') ? '#ef4444' : '#374151',
                                            fontWeight: 'bold'
                                        }}>
                                            {r.destinationStockName}
                                        </span>
                                    </td>
                                    <td style={{ color: r.restockingFee > 0 ? '#10b981' : 'inherit', fontWeight: r.restockingFee > 0 ? 'bold' : 'normal' }}>
                                        {r.restockingFee > 0 ? `${r.restockingFee.toFixed(2)} ر.س` : '-'}
                                    </td>
                                    <td><strong>{r.total.toFixed(2)} ر.س</strong></td>
                                    <td>
                                        <span style={{ color: r.zatcaStatus === 'reported' ? '#10b981' : '#6b7280', fontSize: '12px' }}>
                                            {r.zatcaStatus === 'reported' ? 'تم الإبلاغ (زاتكا)' : 'معلق'}
                                        </span>
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
