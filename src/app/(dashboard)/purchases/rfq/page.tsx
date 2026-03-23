'use client';
import { useState, useEffect } from 'react';
import { Mail, Plus, ShieldCheck, Inbox } from 'lucide-react';

export default function RequestForQuotationPage() {
    const [rfqs, setRfqs] = useState<any[]>([]);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    
    const [form, setForm] = useState({ supplierId: '', dueDate: '', notes: '' });
    const [items, setItems] = useState<any[]>([]);

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        setLoading(true);
        try {
            const token = localStorage.getItem('token') || '';
            const [rRes, sRes, pRes] = await Promise.all([
                fetch('/api/purchases/rfq', { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/customers?type=1', { headers: { Authorization: `Bearer ${token}` } }), // suppliers
                fetch('/api/products', { headers: { Authorization: `Bearer ${token}` } })
            ]);
            if (rRes.ok) setRfqs(await rRes.json());
            if (sRes.ok) setSuppliers(await sRes.json());
            if (pRes.ok) setProducts(await pRes.json());
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    }

    const addItem = () => setItems([...items, { productId: '', productName: '', quantity: 1, targetPrice: '' }]);
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
            const res = await fetch('/api/purchases/rfq', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ ...form, items })
            });
            if (res.ok) {
                setShowModal(false);
                setForm({ supplierId: '', dueDate: '', notes: '' });
                setItems([]);
                loadData();
            } else {
                alert('فشل حفظ طلب عرض السعر');
            }
        } catch (e) {}
    };

    const statusBadge = (s: string) => {
        if (s === 'draft') return <span style={{ padding: '6px 12px', backgroundColor: '#f1f5f9', color: '#64748b', borderRadius: '20px', fontSize: '12px' }}><Inbox size={12} style={{display:'inline', marginRight:'4px'}}/> مسودة قيد التجهيز</span>;
        if (s === 'sent') return <span style={{ padding: '6px 12px', backgroundColor: '#3b82f620', color: '#3b82f6', borderRadius: '20px', fontSize: '12px' }}><Mail size={12} style={{display:'inline', marginRight:'4px'}}/> تم الإرسال للمورد</span>;
        if (s === 'received') return <span style={{ padding: '6px 12px', backgroundColor: '#10b98120', color: '#10b981', borderRadius: '20px', fontSize: '12px' }}><ShieldCheck size={12} style={{display:'inline', marginRight:'4px'}}/> تم استلام التسعيرة</span>;
        if (s === 'closed') return <span style={{ padding: '6px 12px', backgroundColor: '#ef444420', color: '#ef4444', borderRadius: '20px', fontSize: '12px' }}>مغلق وجاري الترسية</span>;
        return <span>{s}</span>;
    }

    return (<>
        <div className="page-header"><h1 className="page-title">✉️ طلبات عروض الأسعار (RFQ)</h1></div>
        
        <div className="page-content animate-fade-in">
            <div className="toolbar">
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>إدارة طلبات الأسعار المرسلة للموردين وتحليل عروضهم والمفاضلة</span>
                <div className="toolbar-spacer" />
                <button onClick={() => setShowModal(true)} className="primary-btn">
                    <Plus size={16} /> صياغة طلب سعر جديد (New RFQ)
                </button>
            </div>

            <div className="card" style={{ padding: '0', overflowX: 'auto' }}>
                <table className="table" style={{ width: '100%' }}>
                    <thead>
                        <tr>
                            <th>رقم الـ(RFQ)</th>
                            <th>تاريخ الإنشاء</th>
                            <th>المورد الموجه له</th>
                            <th>آخر موعد للرد (Deadline)</th>
                            <th>حالة الطلب</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>جاري التحميل...</td></tr> : rfqs.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>لا توجد طلبات عروض أسعار مسجلة</td></tr> : rfqs.map(r => (
                            <tr key={r.id}>
                                <td><strong style={{color: '#6366f1'}}>RFQ-{r.rfqNo}</strong></td>
                                <td>{new Date(r.date).toLocaleDateString()}</td>
                                <td>{r.supplier?.name || <span style={{color: 'var(--text-muted)'}}>مفتوح (عام)</span>}</td>
                                <td>{r.dueDate ? new Date(r.dueDate).toLocaleDateString() : 'مفتوح المهلة'}</td>
                                <td>{statusBadge(r.status)}</td>
                                <td>
                                    <div style={{ display: 'flex', gap: '5px' }}>
                                        <button className="btn btn-outline" style={{ fontSize: '12px', padding: '4px 8px' }}>إدارة ومقارنة الأسعار</button>
                                        {r.status === 'draft' && <button className="btn" style={{ fontSize: '12px', padding: '4px 8px', backgroundColor: '#3b82f6', color: 'white' }}>إرسال عبر واتساب/إيميل</button>}
                                        {r.status === 'received' && <button className="btn" style={{ fontSize: '12px', padding: '4px 8px', backgroundColor: '#10b981', color: 'white' }}>ترسية (إنشاء أمر شراء PO)</button>}
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
                <div className="modal animate-scale-in" style={{ maxWidth: '850px', width: '95%', backgroundColor: 'var(--card-bg, white)', borderRadius: '12px', padding: '24px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
                    <h2>إنشاء طلب عرض سعر موجه للمورد (RFQ)</h2>
                    <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <div className="input-group" style={{ margin: 0, flex: 1 }}>
                                <label className="input-label">المورد المستهدف</label>
                                <select className="input" value={form.supplierId} onChange={e => setForm({...form, supplierId: e.target.value})}>
                                    <option value="">طلب عام غير محدد</option>
                                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.phone || '-'})</option>)}
                                </select>
                            </div>
                            <div className="input-group" style={{ margin: 0, flex: 1 }}>
                                <label className="input-label">تاريخ استحقاق الرد (Deadline)</label>
                                <input type="date" className="input" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} />
                            </div>
                        </div>
                        <div className="input-group" style={{ margin: 0 }}>
                            <label className="input-label">شروط خاصة أو ملاحظات</label>
                            <input className="input" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="شروط التسليم والدفع..." />
                        </div>
                        
                        <div style={{ padding: '15px', border: '1px solid var(--border)', borderRadius: '8px' }}>
                            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                <h4>الأصناف المطلوبة تسعيرها</h4>
                                <button type="button" onClick={addItem} className="btn btn-outline" style={{fontSize: '12px'}}>+ إضافة عنصر</button>
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table className="table" style={{ width: '100%', marginTop: '10px', minWidth: '600px' }}>
                                    <thead>
                                        <tr>
                                            <th>الصنف</th>
                                            <th style={{width: '120px'}}>الكمية المطلوبة</th>
                                            <th style={{width: '150px'}}>السعر المستهدف/المتوقع</th>
                                            <th style={{width: '50px'}}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item, index) => (
                                            <tr key={index}>
                                                <td>
                                                    <select required className="input" value={item.productId} onChange={e => updateItem(index, 'productId', e.target.value)}>
                                                        <option value="">اختر الصنف المراد شرائه...</option>
                                                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                    </select>
                                                </td>
                                                <td><input required type="number" min="0.1" step="any" className="input" value={item.quantity} onChange={e => updateItem(index, 'quantity', e.target.value)} /></td>
                                                <td><input type="number" step="any" className="input" value={item.targetPrice} onChange={e => updateItem(index, 'targetPrice', e.target.value)} placeholder="اختياري للتقييم" /></td>
                                                <td>
                                                    <button type="button" onClick={() => removeItem(index)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '5px' }}>✖</button>
                                                </td>
                                            </tr>
                                        ))}
                                        {items.length === 0 && <tr><td colSpan={4} style={{textAlign:'center', color:'var(--text-muted)'}}>انقر على الأزرار العلوية لسحب منتجات</td></tr>}
                                    </tbody>
                                </table>
                            </div>
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