'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from "@/lib/i18n";
import { Factory, Truck, Package, CheckCircle, Clock, Plus } from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function SubcontractingPage() {
    const { t } = useTranslation();
    const { success, error } = useToast();
    const [pos, setPOs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ supplierId: '', productToReceive: '', productsToSend: '', expectedDate: '' });
    const [issuing, setIssuing] = useState<number | null>(null);

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        setLoading(true);
        try {
            const token = localStorage.getItem('token') || '';
            const res = await fetch('/api/manufacturing/subcontracting', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const d = await res.json();
            if (res.ok) setPOs(d.pos || []);
        } catch (e) { console.error(e); }
        setLoading(false);
    }

    async function createPO() {
        try {
            const token = localStorage.getItem('token') || '';
            const res = await fetch('/api/manufacturing/subcontracting', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ action: 'create', ...form })
            });
            if (res.ok) {
                success('تم إنشاء أمر التصنيع الخارجي بنجاح');
                setShowCreate(false);
                loadData();
            } else {
                const d = await res.json();
                error(d.error || 'فشل في الإنشاء');
            }
        } catch (e) { console.error(e); }
    }

    async function issueMaterials(poId: number) {
        setIssuing(poId);
        try {
            const token = localStorage.getItem('token') || '';
            const res = await fetch('/api/manufacturing/subcontracting', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ action: 'issue', poId })
            });
            if (res.ok) {
                success('تم صرف المواد للمورد بنجاح');
                loadData();
            }
        } catch (e) { console.error(e); }
        setIssuing(null);
    }

    async function receiveGoods(poId: number) {
        try {
            const token = localStorage.getItem('token') || '';
            const res = await fetch('/api/manufacturing/subcontracting', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ action: 'receive', poId })
            });
            if (res.ok) {
                success('تم استلام المنتجات النهائية بنجاح');
                loadData();
            }
        } catch (e) { console.error(e); }
    }

    const statusColor = (status: string) => {
        switch (status) {
            case 'DRAFT': return 'badge-outline';
            case 'ISSUED': return 'badge-warning';
            case 'COMPLETED': return 'badge-success';
            default: return 'badge-outline';
        }
    };
    const statusLabel = (status: string) => {
        switch (status) {
            case 'DRAFT': return 'مسودة';
            case 'ISSUED': return 'تم صرف المواد';
            case 'COMPLETED': return 'مكتمل';
            default: return status;
        }
    };

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>جاري التحميل...</div>;

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">التصنيع الخارجي (Subcontracting / Job Work)</h1>
            </div>

            <div className="page-content animate-fade-in">
                {/* Summary Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                    <div className="card" style={{ padding: '20px', borderLeft: '4px solid #6366f1' }}>
                        <div style={{ color: '#6b7280', fontSize: '13px', marginBottom: '4px' }}>إجمالي الأوامر</div>
                        <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{pos.length}</div>
                    </div>
                    <div className="card" style={{ padding: '20px', borderLeft: '4px solid #f59e0b' }}>
                        <div style={{ color: '#6b7280', fontSize: '13px', marginBottom: '4px' }}>قيد التصنيع</div>
                        <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f59e0b' }}>{pos.filter(p => p.status === 'ISSUED').length}</div>
                    </div>
                    <div className="card" style={{ padding: '20px', borderLeft: '4px solid #10b981' }}>
                        <div style={{ color: '#6b7280', fontSize: '13px', marginBottom: '4px' }}>مكتمل</div>
                        <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#10b981' }}>{pos.filter(p => p.status === 'COMPLETED').length}</div>
                    </div>
                </div>

                {/* Table */}
                <div className="card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h2 style={{ fontSize: '18px', margin: 0 }}>أوامر التصنيع الخارجي</h2>
                        <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
                            <Plus size={16} style={{ marginLeft: '5px' }} /> أمر جديد
                        </button>
                    </div>

                    {showCreate && (
                        <div style={{ background: '#f9fafb', padding: '20px', borderRadius: '8px', marginBottom: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: '#6b7280' }}>رقم المورد</label>
                                <input className="form-input" value={form.supplierId} onChange={e => setForm({ ...form, supplierId: e.target.value })} placeholder="ID المورد" />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: '#6b7280' }}>المنتج المطلوب استلامه</label>
                                <input className="form-input" value={form.productToReceive} onChange={e => setForm({ ...form, productToReceive: e.target.value })} placeholder="ID المنتج النهائي" />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: '#6b7280' }}>المواد المرسلة (JSON)</label>
                                <input className="form-input" value={form.productsToSend} onChange={e => setForm({ ...form, productsToSend: e.target.value })} placeholder='[{"productId": 1, "qty": 100}]' />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: '#6b7280' }}>تاريخ الاستلام المتوقع</label>
                                <input className="form-input" type="date" value={form.expectedDate} onChange={e => setForm({ ...form, expectedDate: e.target.value })} />
                            </div>
                            <div style={{ gridColumn: '1 / -1', textAlign: 'left' }}>
                                <button className="btn btn-primary" onClick={createPO}>إنشاء الأمر</button>
                            </div>
                        </div>
                    )}

                    {pos.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                            <Factory size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
                            <p>لا توجد أوامر تصنيع خارجي</p>
                        </div>
                    ) : (
                        <table className="table" style={{ width: '100%' }}>
                            <thead>
                                <tr>
                                    <th>رقم الأمر</th>
                                    <th>المورد</th>
                                    <th>المنتج النهائي</th>
                                    <th>تاريخ التسليم</th>
                                    <th>الحالة</th>
                                    <th>الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pos.map((po: any) => (
                                    <tr key={po.id}>
                                        <td>SC-{po.id}</td>
                                        <td>{po.supplierName || po.supplierId}</td>
                                        <td>{po.productName || po.productToReceive}</td>
                                        <td>{new Date(po.expectedDate).toLocaleDateString('ar-SA')}</td>
                                        <td><span className={`badge ${statusColor(po.status)}`}>{statusLabel(po.status)}</span></td>
                                        <td style={{ display: 'flex', gap: '8px' }}>
                                            {po.status === 'DRAFT' && (
                                                <button className="btn btn-outline" style={{ fontSize: '12px', padding: '4px 10px' }} onClick={() => issueMaterials(po.id)} disabled={issuing === po.id}>
                                                    <Truck size={14} style={{ marginLeft: '4px' }} /> {issuing === po.id ? '...' : 'صرف المواد'}
                                                </button>
                                            )}
                                            {po.status === 'ISSUED' && (
                                                <button className="btn btn-outline" style={{ fontSize: '12px', padding: '4px 10px' }} onClick={() => receiveGoods(po.id)}>
                                                    <Package size={14} style={{ marginLeft: '4px' }} /> استلام النهائي
                                                </button>
                                            )}
                                            {po.status === 'COMPLETED' && (
                                                <span style={{ color: '#10b981', fontSize: '13px' }}><CheckCircle size={14} style={{ display: 'inline', marginRight: '4px' }} />تم الإغلاق</span>
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
