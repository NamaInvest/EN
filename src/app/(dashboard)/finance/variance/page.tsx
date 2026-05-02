'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from "@/lib/i18n";
import { CheckCircle, AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function CostVariancePage() {
    const { t } = useTranslation();
    const { success, error } = useToast();
    const [variances, setVariances] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [posting, setPosting] = useState(false);

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        setLoading(true);
        try {
            const token = localStorage.getItem('token') || '';
            const res = await fetch('/api/finance/variance', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const d = await res.json();
            if (res.ok) setVariances(d);
            else error(d.error || 'فشل في الجلب');
        } catch (e) { console.error(e); }
        setLoading(false);
    }

    const postToGL = async () => {
        setPosting(true);
        try {
            const token = localStorage.getItem('token') || '';
            const res = await fetch('/api/finance/variance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ action: 'post_gl' })
            });
            const result = await res.json();
            if (res.ok) {
                success(result.message);
                loadData();
            } else {
                error(result.error || 'فشل في الترحيل');
            }
        } catch (e) { console.error(e); }
        setPosting(false);
    };

    const unposted = variances.filter(v => !v.isPosted);
    const totalUnpostedAmount = unposted.reduce((sum, v) => sum + v.varianceAmount, 0);

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>جاري التحميل...</div>;

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">تحليل انحرافات التكاليف (Cost Variances - PPV)</h1>
            </div>

            <div className="page-content animate-fade-in">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                    <div className="card" style={{ padding: '20px', borderLeft: '4px solid #f59e0b' }}>
                        <div style={{ color: '#6b7280', marginBottom: '5px' }}>انحرافات غير مرحلة للقيود</div>
                        <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827' }}>
                            {unposted.length} حركة
                        </div>
                    </div>
                    <div className="card" style={{ padding: '20px', borderLeft: totalUnpostedAmount > 0 ? '4px solid #ef4444' : '4px solid #10b981' }}>
                        <div style={{ color: '#6b7280', marginBottom: '5px' }}>تأثير الانحراف المعلق (Unfavorable)</div>
                        <div style={{ fontSize: '28px', fontWeight: 'bold', color: totalUnpostedAmount > 0 ? '#ef4444' : '#10b981' }}>
                            {totalUnpostedAmount.toLocaleString()} ر.س
                        </div>
                    </div>
                </div>

                <div className="card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2 style={{ fontSize: '18px', margin: 0 }}>سجل انحرافات أسعار الشراء (PPV) والتصنيع</h2>
                        <button className="btn btn-primary" onClick={postToGL} disabled={unposted.length === 0 || posting}>
                            {posting ? 'جاري الترحيل...' : 'ترحيل الانحرافات المعلقة لليومية (Post to GL)'}
                        </button>
                    </div>

                    {variances.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '30px', color: '#6b7280' }}>لا توجد انحرافات مسجلة.</div>
                    ) : (
                        <table className="table" style={{ width: '100%' }}>
                            <thead>
                                <tr>
                                    <th>التاريخ</th>
                                    <th>نوع الانحراف</th>
                                    <th>رقم المرجع (Order/Inv)</th>
                                    <th>التكلفة المعيارية</th>
                                    <th>التكلفة الفعلية</th>
                                    <th>مبلغ الانحراف</th>
                                    <th>الحالة</th>
                                </tr>
                            </thead>
                            <tbody>
                                {variances.map((v: any) => (
                                    <tr key={v.id}>
                                        <td>{new Date(v.createdAt).toLocaleDateString('ar-SA')}</td>
                                        <td><span className="badge badge-outline">{v.type}</span></td>
                                        <td>{v.orderId}</td>
                                        <td>{v.expectedCost.toLocaleString()}</td>
                                        <td>{v.actualCost.toLocaleString()}</td>
                                        <td style={{ fontWeight: 'bold', color: v.varianceAmount > 0 ? '#ef4444' : '#10b981' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                {v.varianceAmount > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                                {Math.abs(v.varianceAmount).toLocaleString()}
                                            </div>
                                        </td>
                                        <td>
                                            {v.isPosted ? (
                                                <span className="badge badge-success"><CheckCircle size={12} style={{display:'inline', marginRight:'3px'}}/> مرحل</span>
                                            ) : (
                                                <span className="badge badge-warning">معلق</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </>
    );
}
