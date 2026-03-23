'use client';
import { useState, useEffect } from 'react';
import { Edit3, CheckCircle, AlertTriangle } from 'lucide-react';

export default function StockAdjustmentsPage() {
    const [adjustments, setAdjustments] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    
    const [form, setForm] = useState({ productId: '', actualQuantity: '', reason: '' });
    const [selectedProduct, setSelectedProduct] = useState<any>(null);

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        setLoading(true);
        try {
            const token = localStorage.getItem('token') || '';
            const [aRes, pRes] = await Promise.all([
                fetch('/api/stock/adjustments', { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/products', { headers: { Authorization: `Bearer ${token}` } }),
            ]);
            if (aRes.ok) setAdjustments(await aRes.json());
            if (pRes.ok) setProducts(await pRes.json());
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    }

    const handleProductChange = (val: string) => {
        setForm({...form, productId: val});
        const p = products.find(x => x.id.toString() === val);
        setSelectedProduct(p || null);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token') || '';
            const res = await fetch('/api/stock/adjustments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(form)
            });
            const data = await res.json();
            if (res.ok) {
                setShowModal(false);
                setForm({ productId: '', actualQuantity: '', reason: '' });
                setSelectedProduct(null);
                loadData();
            } else {
                alert(data.error || 'فشل حفظ التسوية');
            }
        } catch (e) {}
    };

    const getDelta = () => {
        if (!selectedProduct || form.actualQuantity === '') return null;
        const diff = parseFloat(form.actualQuantity) - selectedProduct.currentStock;
        return diff;
    };

    const diff = getDelta();

    return (<>
        <div className="page-header"><h1 className="page-title">⚖️ تسويات الجرد التعديلية (Stock Adjustments)</h1></div>
        
        <div className="page-content animate-fade-in">
            <div className="toolbar">
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>مطابقة الأرصدة الدفترية مع الجرد الفعلي وتسوية الفروقات الناجمة عن العجز أو التلف</span>
                <div className="toolbar-spacer" />
                <button onClick={() => setShowModal(true)} className="btn btn-primary" style={{ backgroundColor: '#f59e0b', color: 'white' }}>
                    <Edit3 size={16} style={{marginRight:'5px'}} /> تسوية رصيد يدوية
                </button>
            </div>

            <div className="card" style={{ padding: '0', overflowX: 'auto' }}>
                <table className="table" style={{ width: '100%' }}>
                    <thead>
                        <tr>
                            <th>رقم الحركة</th>
                            <th>تاريخ التسوية</th>
                            <th>الصنف المُسوى</th>
                            <th>نوع التسوية</th>
                            <th>مقدار الفارق</th>
                            <th>المستخدم</th>
                            <th>السبب المُسجل</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: '20px' }}>جاري التحميل...</td></tr> : adjustments.length === 0 ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: '20px' }}>سجل التسويات فارغ</td></tr> : adjustments.map(a => (
                            <tr key={a.id}>
                                <td><strong style={{color: '#6366f1'}}>ADJ-{a.id}</strong></td>
                                <td><span dir="ltr">{new Date(a.date).toLocaleDateString()}</span></td>
                                <td>{a.product?.name} <span style={{fontSize:'10px', color:'#888'}}>({a.product?.sku})</span></td>
                                <td>
                                    {a.type === 'adjustment_in' ? 
                                        <span style={{color: '#10b981', fontWeight: 600}}>زيادة فائض جردي</span> : 
                                        <span style={{color: '#ef4444', fontWeight: 600}}>تسوية تسريب/عجز</span>
                                    }
                                </td>
                                <td><strong style={{color: a.type === 'adjustment_in' ? '#10b981' : '#ef4444'}}>{a.type === 'adjustment_in' ? '+' : '-'}{a.quantity}</strong></td>
                                <td>{a.user?.fullName || 'النظام'}</td>
                                <td style={{fontSize:'12px'}}>{a.notes}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        {showModal && (
            <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 }}>
                <div className="modal animate-scale-in" style={{ maxWidth: '600px', width: '95%', backgroundColor: 'var(--card-bg, white)', borderRadius: '12px', padding: '24px', position: 'relative' }}>
                    <h2>إنشاء محضر تسوية جردية (New Adjustment)</h2>
                    <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
                        
                        <div className="input-group" style={{ margin: 0 }}>
                            <label className="input-label">الصنف المراد تسويته</label>
                            <select required className="input" value={form.productId} onChange={e => handleProductChange(e.target.value)}>
                                <option value="">اختر الصنف...</option>
                                {products.map(p => <option key={p.id} value={p.id}>{p.name} - (مخزون الدفتر: {p.currentStock})</option>)}
                            </select>
                        </div>
                        
                        {selectedProduct && (
                            <div style={{ display: 'flex', gap: '15px', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', alignItems: 'center' }}>
                                <div style={{flex: 1, textAlign: 'center'}}>
                                    <div style={{fontSize: '12px', color: '#64748b'}}>الرصيد الدفتري الحالي</div>
                                    <strong style={{fontSize: '20px'}}>{selectedProduct.currentStock}</strong>
                                </div>
                                <div style={{width: '2px', height: '40px', backgroundColor: '#cbd5e1'}}></div>
                                <div style={{flex: 1}}>
                                    <label style={{fontSize: '12px', color: '#64748b'}}>أدخل الرصيد المادي الفعلي</label>
                                    <input required type="number" step="any" min="0" className="input" value={form.actualQuantity} onChange={e => setForm({...form, actualQuantity: e.target.value})} style={{ textAlign: 'center', fontSize: '18px', fontWeight: 'bold' }} />
                                </div>
                            </div>
                        )}

                        {diff !== null && selectedProduct && diff !== 0 && (
                            <div style={{ padding: '15px', borderRadius: '8px', backgroundColor: diff > 0 ? '#10b98115' : '#ef444415', color: diff > 0 ? '#059669' : '#dc2626', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {diff > 0 ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                                <div>
                                    سيقوم النظام بتسجيل <strong>{diff > 0 ? 'فائض' : 'عجز'}</strong> بمقدار <strong>{Math.abs(diff)}</strong> حبة وإثباتها قيودياً للحفاظ على الميزانية.
                                </div>
                            </div>
                        )}
                        
                        {diff !== null && diff === 0 && (
                            <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: '#e2e8f0', color: '#475569', textAlign: 'center' }}>
                                الرصيد الفعلي يطابق الدفتري تماماً. لا توجد فروقات للتسوية.
                            </div>
                        )}

                        <div className="input-group" style={{ margin: 0 }}>
                            <label className="input-label">سبب التعديل أو رقم محضر الجرد (إلزامي للتدقيق)</label>
                            <input required type="text" className="input" value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} placeholder="مثال: تلف أثناء النقل، خطأ في النقل السابق، الخ..." />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                            <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">إلغاء</button>
                            <button type="submit" disabled={diff === null || diff === 0} className="btn btn-primary" style={{ backgroundColor: '#f59e0b', color: 'white', opacity: (diff === null || diff === 0) ? 0.5 : 1 }}>تأكيد واحتساب الفارق المجرد</button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </>);
}