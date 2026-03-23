'use client';
import { useState, useEffect } from 'react';
import { FileText, Plus, CheckCircle, Clock } from 'lucide-react';

export default function PurchaseRequisitionsPage() {
    const [prs, setPrs] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    
    const [form, setForm] = useState({ department: '', notes: '' });
    const [items, setItems] = useState<any[]>([]);

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        setLoading(true);
        try {
            const token = localStorage.getItem('token') || '';
            const [prRes, pRes] = await Promise.all([
                fetch('/api/purchases/requisitions', { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/products', { headers: { Authorization: `Bearer ${token}` } })
            ]);
            if (prRes.ok) setPrs(await prRes.json());
            if (pRes.ok) setProducts(await pRes.json());
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    }

    const addItem = () => setItems([...items, { productId: '', productName: '', quantity: 1, notes: '' }]);
    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...items];
        newItems[index][field] = value;
        if (field === 'productId') {
            const p = products.find(x => x.id.toString() === value.toString());
            if (p) newItems[index].productName = p.name;
        }
        setItems(newItems);
    };
    const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (items.length === 0) return alert('يجب إضافة منتجات للطلب');
        
        try {
            const token = localStorage.getItem('token') || '';
            const res = await fetch('/api/purchases/requisitions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ ...form, items })
            });
            if (res.ok) {
                setShowModal(false);
                setForm({ department: '', notes: '' });
                setItems([]);
                loadData();
            } else {
                alert('فشل حفظ طلب الشراء');
            }
        } catch (e) {}
    };

    const statusBadge = (s: string) => {
        if (s === 'pending') return <span style={{ padding: '6px 12px', backgroundColor: '#f59e0b20', color: '#f59e0b', borderRadius: '20px', fontSize: '12px' }}><Clock size={12} style={{display:'inline', marginRight:'4px'}}/> قيد المراجعة</span>;
        if (s === 'approved') return <span style={{ padding: '6px 12px', backgroundColor: '#10b98120', color: '#10b981', borderRadius: '20px', fontSize: '12px' }}><CheckCircle size={12} style={{display:'inline', marginRight:'4px'}}/> معتمد وجاهز للتسعير</span>;
        if (s === 'rejected') return <span style={{ padding: '6px 12px', backgroundColor: '#ef444420', color: '#ef4444', borderRadius: '20px', fontSize: '12px' }}>مرفوض</span>;
        return <span>{s}</span>;
    }

    return (<>
        <div className="page-header"><h1 className="page-title">📝 طلبات الشراء الداخلية (PR)</h1></div>
        
        <div className="page-content animate-fade-in">
            <div className="toolbar">
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>إدارة طلبات احتياجات الأقسام قبل الدخول لدورة الموردين</span>
                <div className="toolbar-spacer" />
                <button onClick={() => setShowModal(true)} className="primary-btn">
                    <Plus size={16} /> رفع احتياج جديد (New PR)
                </button>
            </div>

            <div className="card" style={{ padding: '0', overflowX: 'auto' }}>
                <table className="table" style={{ width: '100%' }}>
                    <thead>
                        <tr>
                            <th>رقم الطلب</th>
                            <th>التاريخ</th>
                            <th>القسم / الإدارة</th>
                            <th>الطالب</th>
                            <th>حالة الطلب</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>جاري التحميل...</td></tr> : prs.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>لا توجد طلبات شراء مسجلة</td></tr> : prs.map(p => (
                            <tr key={p.id}>
                                <td><strong style={{color: '#6366f1'}}>PR-{p.reqNo}</strong></td>
                                <td>{new Date(p.date).toLocaleDateString()}</td>
                                <td>{p.department || 'عام'}</td>
                                <td>{p.requester?.fullName || p.requester?.username || '-'}</td>
                                <td>{statusBadge(p.status)}</td>
                                <td>
                                    <div style={{ display: 'flex', gap: '5px' }}>
                                        <button className="btn btn-outline" style={{ fontSize: '12px', padding: '4px 8px' }}>عرض التفاصيل</button>
                                        {p.status === 'pending' && <button className="btn" style={{ fontSize: '12px', padding: '4px 8px', backgroundColor: '#10b981', color: 'white' }}>اعتماد الطلب</button>}
                                        {p.status === 'approved' && <button className="btn" style={{ fontSize: '12px', padding: '4px 8px', backgroundColor: '#3b82f6', color: 'white' }}>تحويل إلى عرض سعر (RFQ)</button>}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Create Modal */}
        {showModal && (
            <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 }}>
                <div className="modal animate-scale-in" style={{ maxWidth: '800px', width: '95%', backgroundColor: 'var(--card-bg, white)', borderRadius: '12px', padding: '24px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
                    <h2>إنشاء طلب احتياج داخلي (Purchase Requisition)</h2>
                    <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <div className="input-group" style={{ margin: 0, flex: 1 }}>
                                <label className="input-label">القسم الطالب (مثال: صيانة، تسويق، إنتاج)</label>
                                <input required className="input" value={form.department} onChange={e => setForm({...form, department: e.target.value})} placeholder="أدخل اسم القسم الموجه للطلب" />
                            </div>
                            <div className="input-group" style={{ margin: 0, flex: 1 }}>
                                <label className="input-label">ملاحظات أو مبررات الطلب</label>
                                <input className="input" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="السبب العاجل..." />
                            </div>
                        </div>
                        
                        <div style={{ padding: '15px', border: '1px solid var(--border)', borderRadius: '8px' }}>
                            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                <h4>الأصناف أو المواد المطلوبة</h4>
                                <button type="button" onClick={addItem} className="btn btn-outline" style={{fontSize: '12px'}}>+ إضافة منتج</button>
                            </div>
                            <table className="table" style={{ width: '100%', marginTop: '10px' }}>
                                <thead>
                                    <tr>
                                        <th>الصنف</th>
                                        <th style={{width: '100px'}}>الكمية المطلوبة</th>
                                        <th style={{width: '180px'}}>ملاحظات إضافية</th>
                                        <th style={{width: '50px'}}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, index) => (
                                        <tr key={index}>
                                            <td>
                                                <select required className="input" value={item.productId} onChange={e => updateItem(index, 'productId', e.target.value)}>
                                                    <option value="">اختر مادة من المستودع...</option>
                                                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                </select>
                                            </td>
                                            <td><input required type="number" min="0.1" step="any" className="input" value={item.quantity} onChange={e => updateItem(index, 'quantity', e.target.value)} /></td>
                                            <td><input type="text" className="input" value={item.notes} onChange={e => updateItem(index, 'notes', e.target.value)} placeholder="مثال: بحجم معين" /></td>
                                            <td>
                                                <button type="button" onClick={() => removeItem(index)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '5px' }}>✖</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {items.length === 0 && <tr><td colSpan={4} style={{textAlign:'center', color:'var(--text-muted)'}}>انقر على إضافة منتج للبدء</td></tr>}
                                </tbody>
                            </table>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                            <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">إلغاء</button>
                            <button type="submit" className="btn btn-primary">حفظ واعتماد المسودة</button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </>);
}