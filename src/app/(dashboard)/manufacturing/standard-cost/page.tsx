'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from "@/lib/i18n";
import { DollarSign, TrendingUp, TrendingDown, Calculator, Save } from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function StandardCostPage() {
    const { t } = useTranslation();
    const { success, error } = useToast();
    const [costs, setCosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ productId: '', materialCost: '', laborCost: '', overheadCost: '' });

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        setLoading(true);
        try {
            const token = localStorage.getItem('token') || '';
            const res = await fetch('/api/manufacturing/standard-cost', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const d = await res.json();
            if (res.ok) setCosts(d.costs || []);
        } catch (e) { console.error(e); }
        setLoading(false);
    }

    async function saveCost() {
        try {
            const token = localStorage.getItem('token') || '';
            const res = await fetch('/api/manufacturing/standard-cost', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    action: 'set',
                    productId: parseInt(form.productId),
                    materialCost: parseFloat(form.materialCost),
                    laborCost: parseFloat(form.laborCost),
                    overheadCost: parseFloat(form.overheadCost)
                })
            });
            if (res.ok) {
                success('تم تحديث التكلفة المعيارية بنجاح');
                setShowForm(false);
                setForm({ productId: '', materialCost: '', laborCost: '', overheadCost: '' });
                loadData();
            } else {
                const d = await res.json();
                error(d.error || 'فشل في الحفظ');
            }
        } catch (e) { console.error(e); }
    }

    const totalMaterial = costs.reduce((sum, c) => sum + (c.materialCost || 0), 0);
    const totalLabor = costs.reduce((sum, c) => sum + (c.laborCost || 0), 0);
    const totalOverhead = costs.reduce((sum, c) => sum + (c.overheadCost || 0), 0);

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>جاري التحميل...</div>;

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">إدارة التكاليف المعيارية (Standard Costing)</h1>
            </div>

            <div className="page-content animate-fade-in">
                {/* Summary */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                    <div className="card" style={{ padding: '20px', borderLeft: '4px solid #3b82f6' }}>
                        <div style={{ color: '#6b7280', fontSize: '13px', marginBottom: '4px' }}>عدد المنتجات المسعّرة</div>
                        <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{costs.length}</div>
                    </div>
                    <div className="card" style={{ padding: '20px', borderLeft: '4px solid #10b981' }}>
                        <div style={{ color: '#6b7280', fontSize: '13px', marginBottom: '4px' }}>متوسط تكلفة المواد</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
                            {costs.length > 0 ? (totalMaterial / costs.length).toFixed(2) : '0'} ر.س
                        </div>
                    </div>
                    <div className="card" style={{ padding: '20px', borderLeft: '4px solid #f59e0b' }}>
                        <div style={{ color: '#6b7280', fontSize: '13px', marginBottom: '4px' }}>متوسط تكلفة العمالة</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>
                            {costs.length > 0 ? (totalLabor / costs.length).toFixed(2) : '0'} ر.س
                        </div>
                    </div>
                    <div className="card" style={{ padding: '20px', borderLeft: '4px solid #8b5cf6' }}>
                        <div style={{ color: '#6b7280', fontSize: '13px', marginBottom: '4px' }}>متوسط المصاريف غير المباشرة</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#8b5cf6' }}>
                            {costs.length > 0 ? (totalOverhead / costs.length).toFixed(2) : '0'} ر.س
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h2 style={{ fontSize: '18px', margin: 0 }}>بطاقات التكلفة المعيارية</h2>
                        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                            <Calculator size={16} style={{ marginLeft: '5px' }} /> تسعير منتج جديد
                        </button>
                    </div>

                    {showForm && (
                        <div style={{ background: '#f9fafb', padding: '20px', borderRadius: '8px', marginBottom: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: '#6b7280' }}>رقم المنتج</label>
                                <input className="form-input" value={form.productId} onChange={e => setForm({ ...form, productId: e.target.value })} placeholder="Product ID" />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: '#6b7280' }}>تكلفة المواد</label>
                                <input className="form-input" type="number" value={form.materialCost} onChange={e => setForm({ ...form, materialCost: e.target.value })} placeholder="0.00" />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: '#6b7280' }}>تكلفة العمالة</label>
                                <input className="form-input" type="number" value={form.laborCost} onChange={e => setForm({ ...form, laborCost: e.target.value })} placeholder="0.00" />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: '#6b7280' }}>المصاريف غير المباشرة</label>
                                <input className="form-input" type="number" value={form.overheadCost} onChange={e => setForm({ ...form, overheadCost: e.target.value })} placeholder="0.00" />
                            </div>
                            <div style={{ gridColumn: '1 / -1', textAlign: 'left' }}>
                                <button className="btn btn-primary" onClick={saveCost}><Save size={16} style={{ marginLeft: '5px' }} /> حفظ</button>
                            </div>
                        </div>
                    )}

                    {costs.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                            <DollarSign size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
                            <p>لا توجد بطاقات تكلفة معيارية بعد</p>
                        </div>
                    ) : (
                        <table className="table" style={{ width: '100%' }}>
                            <thead>
                                <tr>
                                    <th>المنتج</th>
                                    <th>تكلفة المواد</th>
                                    <th>تكلفة العمالة</th>
                                    <th>المصاريف غير المباشرة</th>
                                    <th>إجمالي التكلفة المعيارية</th>
                                    <th>تاريخ السريان</th>
                                </tr>
                            </thead>
                            <tbody>
                                {costs.map((c: any) => (
                                    <tr key={c.id}>
                                        <td style={{ fontWeight: '500' }}>{c.productName || `Product #${c.productId}`}</td>
                                        <td>{c.materialCost.toLocaleString()} ر.س</td>
                                        <td>{c.laborCost.toLocaleString()} ر.س</td>
                                        <td>{c.overheadCost.toLocaleString()} ر.س</td>
                                        <td style={{ fontWeight: 'bold', color: '#6366f1' }}>{c.totalStdCost.toLocaleString()} ر.س</td>
                                        <td>{new Date(c.effectiveFrom).toLocaleDateString('ar-SA')}</td>
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
