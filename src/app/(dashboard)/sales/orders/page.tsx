'use client';
import { useState, useEffect } from 'react';

export default function SalesOrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    
    const [form, setForm] = useState({ customerId: '', salesRepId: '', notes: '' });
    const [items, setItems] = useState<any[]>([]);

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        setLoading(true);
        try {
            const token = localStorage.getItem('token') || '';
            const [oRes, cRes, eRes, pRes] = await Promise.all([
                fetch('/api/sales-orders', { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/customers?type=0', { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/hr/employees', { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/products', { headers: { Authorization: `Bearer ${token}` } })
            ]);
            if (oRes.ok) setOrders(await oRes.json());
            if (cRes.ok) setCustomers(await cRes.json());
            if (eRes.ok) setEmployees(await eRes.json());
            if (pRes.ok) setProducts(await pRes.json());
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    }

    const addItem = () => setItems([...items, { productId: '', productName: '', quantity: 1, price: 0, total: 0 }]);
    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...items];
        newItems[index][field] = value;
        if (field === 'productId') {
            const p = products.find(x => x.id.toString() === value.toString());
            if (p) {
                newItems[index].productName = p.name;
                newItems[index].price = p.salePrice || 0;
            }
        }
        if (field === 'quantity' || field === 'price' || field === 'productId') {
            newItems[index].total = parseFloat(newItems[index].quantity) * parseFloat(newItems[index].price || 0);
        }
        setItems(newItems);
    };
    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const subtotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
    const taxValue = subtotal * 0.15; // Assuming 15% VAT Standard NamaSoft
    const total = subtotal + taxValue;

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (items.length === 0) return alert('يجب إضافة منتجات');
        
        try {
            const token = localStorage.getItem('token') || '';
            const res = await fetch('/api/sales-orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ ...form, items, subtotal, taxValue, total })
            });
            if (res.ok) {
                setShowModal(false);
                setForm({ customerId: '', salesRepId: '', notes: '' });
                setItems([]);
                loadData();
            } else {
                alert('فشل الحفظ');
            }
        } catch (e) {}
    };

    const handleAction = async (id: number, action: string) => {
        try {
            const token = localStorage.getItem('token') || '';
            const res = await fetch(`/api/sales-orders/${id}/process`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ action })
            });
            if (res.ok) {
                loadData();
            } else {
                const err = await res.json();
                alert(err.error || 'فشل العملية!');
            }
        } catch (e) {}
    }

    const statusBadge = (s: string) => {
        if (s === 'pending') return <span style={{ padding: '4px 8px', backgroundColor: '#f59e0b20', color: '#f59e0b', borderRadius: '4px' }}>مسودة طلب</span>;
        if (s === 'approved') return <span style={{ padding: '4px 8px', backgroundColor: '#3b82f620', color: '#3b82f6', borderRadius: '4px' }}>طلب معتمد</span>;
        if (s === 'delivered') return <span style={{ padding: '4px 8px', backgroundColor: '#8b5cf620', color: '#8b5cf6', borderRadius: '4px' }}>تم الصرف والتسليم</span>;
        if (s === 'invoiced') return <span style={{ padding: '4px 8px', backgroundColor: '#10b98120', color: '#10b981', borderRadius: '4px' }}>مفوتر مالياً ✔️</span>;
        return <span>{s}</span>;
    }

    return (<>
        <div className="page-header"><h1 className="page-title">📦 أوامر البيع (Sales Orders Workflow)</h1></div>
        
        <div className="page-content animate-fade-in">
            <div className="toolbar">
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>إدارة دورة المبيعات المتقدمة من الطلب حتى الفوترة</span>
                <div className="toolbar-spacer" />
                <button onClick={() => setShowModal(true)} className="primary-btn">➕ إنشاء أمر بيع جديد</button>
            </div>

            <div className="card" style={{ padding: '0', overflowX: 'auto' }}>
                <table className="table" style={{ width: '100%' }}>
                    <thead>
                        <tr>
                            <th>رقم الأمر</th>
                            <th>التاريخ</th>
                            <th>العميل</th>
                            <th>المندوب / خط السير</th>
                            <th>الإجمالي</th>
                            <th>الحالة والمسار</th>
                            <th>إجراءات الدورة المستندية</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: '20px' }}>جاري التحميل...</td></tr> : orders.length === 0 ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: '20px' }}>لا توجد أوامر بيع مسجلة</td></tr> : orders.map(o => (
                            <tr key={o.id}>
                                <td><strong>SO-{o.orderNo}</strong></td>
                                <td>{new Date(o.date).toLocaleDateString()}</td>
                                <td>{o.customer?.name || '-'}</td>
                                <td>{o.salesRep?.name || <span style={{ color: 'var(--text-muted)' }}>بدون مندوب مباشر</span>}</td>
                                <td><strong style={{ color: '#10b981' }}>{o.total.toLocaleString()} ر.س</strong></td>
                                <td>{statusBadge(o.status)}</td>
                                <td>
                                    <div style={{ display: 'flex', gap: '5px' }}>
                                        {o.status === 'pending' && <button onClick={() => handleAction(o.id, 'approve')} className="btn btn-outline" style={{ fontSize: '12px', padding: '4px 8px' }}>اعتماد الطلبية</button>}
                                        {o.status === 'approved' && <button onClick={() => handleAction(o.id, 'deliver')} className="btn" style={{ fontSize: '12px', padding: '4px 8px', backgroundColor: '#8b5cf6', color: 'white' }}>🚚 إصدار إذن تسليم (صرف مخزني)</button>}
                                        {o.status === 'delivered' && <button onClick={() => handleAction(o.id, 'invoice')} className="btn btn-primary" style={{ fontSize: '12px', padding: '4px 8px' }}>🧾 إصدار فاتورة المبيعات (قيد مالي)</button>}
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
                <div className="modal" style={{ maxWidth: '800px', width: '95%', backgroundColor: 'var(--card-bg, white)', borderRadius: '12px', padding: '24px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
                    <h2>إنشاء مسودة أمر بيع (Sales Order)</h2>
                    <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <div className="input-group" style={{ margin: 0, flex: 1 }}>
                                <label className="input-label">العميل</label>
                                <select required className="input" value={form.customerId} onChange={e => setForm({...form, customerId: e.target.value})}>
                                    <option value="">اختر العميل...</option>
                                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="input-group" style={{ margin: 0, flex: 1 }}>
                                <label className="input-label">مندوب المبيعات المرتبط (لعمولات المحقق)</label>
                                <select className="input" value={form.salesRepId} onChange={e => setForm({...form, salesRepId: e.target.value})}>
                                    <option value="">لا يوجد (ربط مباشر)</option>
                                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                </select>
                            </div>
                        </div>
                        
                        <div style={{ padding: '15px', border: '1px solid var(--border)', borderRadius: '8px' }}>
                            <h4>الأصناف والمنتجات</h4>
                            <table className="table" style={{ width: '100%', marginTop: '10px' }}>
                                <thead>
                                    <tr>
                                        <th>الصنف</th>
                                        <th style={{width: '100px'}}>الكمية</th>
                                        <th style={{width: '120px'}}>سعر الوحدة</th>
                                        <th style={{width: '120px'}}>الإجمالي</th>
                                        <th style={{width: '50px'}}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, index) => (
                                        <tr key={index}>
                                            <td>
                                                <select required className="input" value={item.productId} onChange={e => updateItem(index, 'productId', e.target.value)}>
                                                    <option value="">اختر...</option>
                                                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                </select>
                                            </td>
                                            <td><input required type="number" min="1" className="input" value={item.quantity} onChange={e => updateItem(index, 'quantity', e.target.value)} /></td>
                                            <td><input required type="number" className="input" value={item.price} readOnly /></td>
                                            <td>{item.total.toLocaleString()}</td>
                                            <td><button type="button" onClick={() => removeItem(index)} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}>✖</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <button type="button" onClick={addItem} className="btn btn-outline" style={{ marginTop: '10px' }}>+ إضافة صنف</button>
                        </div>

                        <div style={{ alignSelf: 'flex-end', minWidth: '250px', padding: '15px', backgroundColor: 'var(--bg)', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}><span>الإجمالي غير شامل الضريبة:</span> <strong>{subtotal.toLocaleString()}</strong></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', color: '#ef4444' }}><span>ضريبة القيمة المضافة (15%):</span> <strong>{taxValue.toLocaleString()}</strong></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '5px' }}><span>الإجمالي النهائي:</span> <strong style={{ color: '#10b981', fontSize: '18px' }}>{total.toLocaleString()} ر.س</strong></div>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                            <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button>
                            <button type="submit" className="btn btn-primary">💾 حفظ واعتماد مسودة الطلب</button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </>);
}
