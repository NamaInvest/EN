'use client';
import { useState, useEffect } from 'react';
import { Truck, Plus, PackageOpen } from 'lucide-react';

export default function DeliveryNotesPage() {
    const [notes, setNotes] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    
    const [form, setForm] = useState({ customerId: '', salesOrderId: '' });
    const [items, setItems] = useState<any[]>([]);

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        setLoading(true);
        try {
            const token = localStorage.getItem('token') || '';
            const [nRes, cRes, pRes] = await Promise.all([
                fetch('/api/sales/delivery-notes', { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/customers?type=0', { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/products', { headers: { Authorization: `Bearer ${token}` } }),
            ]);
            if (nRes.ok) setNotes(await nRes.json());
            if (cRes.ok) setCustomers(await cRes.json());
            if (pRes.ok) setProducts(await pRes.json());
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    }

    const addItem = () => setItems([...items, { productId: '', productName: '', quantity: 1, stock: 0 }]);
    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...items];
        newItems[index][field] = value;
        if (field === 'productId') {
            const p = products.find(x => x.id.toString() === value.toString());
            if (p) {
                newItems[index].productName = p.name;
                newItems[index].stock = p.currentStock;
            }
        }
        setItems(newItems);
    };
    const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (items.length === 0) return alert('يجب إضافة منتجات للإذن');
        
        try {
            const token = localStorage.getItem('token') || '';
            const res = await fetch('/api/sales/delivery-notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ ...form, items })
            });
            if (res.ok) {
                setShowModal(false);
                setForm({ customerId: '', salesOrderId: '' });
                setItems([]);
                loadData();
            } else {
                alert('فشل حفظ إذن التسليم. تأكد من توفر الكميات المخزنية.');
            }
        } catch (e) {}
    };

    return (<>
        <div className="page-header"><h1 className="page-title">🚚 مذكرات التسليم (Delivery Notes)</h1></div>
        
        <div className="page-content animate-fade-in">
            <div className="toolbar">
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>إصدار أوامر السحب المخزنية للعملاء ومتابعة تسليم البضائع</span>
                <div className="toolbar-spacer" />
                <button onClick={() => setShowModal(true)} className="primary-btn">
                    <Plus size={16} /> مستند تسليم جديد
                </button>
            </div>

            <div className="card" style={{ padding: '0', overflowX: 'auto' }}>
                <table className="table" style={{ width: '100%' }}>
                    <thead>
                        <tr>
                            <th>رقم الإذن</th>
                            <th>التاريخ</th>
                            <th>العميل المستلم</th>
                            <th>الحالة</th>
                            <th>عدد الأصناف</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>جاري التحميل...</td></tr> : notes.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>لا توجد مذكرات تسليم مسجلة</td></tr> : notes.map(n => (
                            <tr key={n.id}>
                                <td><strong style={{color: '#f59e0b'}}>DN-{n.noteNo}</strong></td>
                                <td>{new Date(n.date).toLocaleDateString()}</td>
                                <td>{n.customer?.name || 'عميل نقدي'}</td>
                                <td><span style={{ padding: '6px 12px', backgroundColor: '#10b98120', color: '#10b981', borderRadius: '20px', fontSize: '12px' }}>تم التسليم وصرف المخزون</span></td>
                                <td>{n.details?.length || 0}</td>
                                <td>
                                    <button className="btn btn-outline" style={{ fontSize: '12px', padding: '4px 8px' }}>إظهار الإذن</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        {showModal && (
            <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 }}>
                <div className="modal animate-scale-in" style={{ maxWidth: '800px', width: '95%', backgroundColor: 'var(--card-bg, white)', borderRadius: '12px', padding: '24px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
                    <h2>إنشاء إذن تسليم مبيعات (Outbound Delivery)</h2>
                    <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <div className="input-group" style={{ margin: 0, flex: 1 }}>
                                <label className="input-label">العميل المُستلِم</label>
                                <select required className="input" value={form.customerId} onChange={e => setForm({...form, customerId: e.target.value})}>
                                    <option value="">عميل نقدي...</option>
                                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        </div>
                        
                        <div style={{ padding: '15px', border: '1px solid var(--border)', borderRadius: '8px' }}>
                            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                <h4>البضائع المسحوبة من المخزن</h4>
                                <button type="button" onClick={addItem} className="btn btn-outline" style={{fontSize: '12px'}}>+ إضافة صنف منصرف</button>
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table className="table" style={{ width: '100%', marginTop: '10px' }}>
                                    <thead>
                                        <tr>
                                            <th>الصنف</th>
                                            <th style={{width: '120px'}}>الكمية المتوفرة</th>
                                            <th style={{width: '120px'}}>الكمية المصروفة</th>
                                            <th style={{width: '50px'}}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item, index) => (
                                            <tr key={index}>
                                                <td>
                                                    <select required className="input" value={item.productId} onChange={e => updateItem(index, 'productId', e.target.value)}>
                                                        <option value="">اختيار...</option>
                                                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                    </select>
                                                </td>
                                                <td><input type="text" className="input" readOnly value={item.stock} style={{ backgroundColor: '#f3f4f6' }} /></td>
                                                <td><input required type="number" min="0.1" step="any" className="input" value={item.quantity} onChange={e => updateItem(index, 'quantity', e.target.value)} /></td>
                                                <td>
                                                    <button type="button" onClick={() => removeItem(index)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '5px' }}>✖</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                            <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">إلغاء الإذن</button>
                            <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#f59e0b', color: 'white' }}><Truck size={16} style={{display:'inline', marginRight:'5px'}}/> صرف البضاعة (Outbound Post)</button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </>);
}