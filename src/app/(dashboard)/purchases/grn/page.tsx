'use client';
import { useState, useEffect } from 'react';
import { Box, Plus, CheckCircle, Package } from 'lucide-react';

export default function GoodsReceiptNotePage() {
    const [grns, setGrns] = useState<any[]>([]);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [stocks, setStocks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    
    const [form, setForm] = useState({ supplierId: '', orderId: '', stockId: '1', notes: '' });
    const [items, setItems] = useState<any[]>([]);

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        setLoading(true);
        try {
            const token = localStorage.getItem('token') || '';
            const [gRes, sRes, pRes, stRes] = await Promise.all([
                fetch('/api/purchases/grn', { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/customers?type=1', { headers: { Authorization: `Bearer ${token}` } }), // suppliers
                fetch('/api/products', { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/config/stocks', { headers: { Authorization: `Bearer ${token}` } })
            ]);
            if (gRes.ok) setGrns(await gRes.json());
            if (sRes.ok) setSuppliers(await sRes.json());
            if (pRes.ok) setProducts(await pRes.json());
            if (stRes.ok) setStocks(await stRes.json());
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    }

    const addItem = () => setItems([...items, { productId: '', productName: '', quantity: 1, acceptedQty: 1, rejectedQty: 0 }]);
    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...items];
        newItems[index][field] = value;
        if (field === 'productId') {
            const p = products.find(x => x.id.toString() === value.toString());
            if (p) newItems[index].productName = p.name;
        }
        // Auto calculate
        if (field === 'quantity') {
            newItems[index].acceptedQty = value;
            newItems[index].rejectedQty = 0;
        }
        if (field === 'acceptedQty') {
            const rej = (parseFloat(newItems[index].quantity) || 0) - (parseFloat(value) || 0);
            newItems[index].rejectedQty = rej > 0 ? rej : 0;
        }
        setItems(newItems);
    };
    const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (items.length === 0) return alert('يجب إضافة منتجات للطلب');
        
        try {
            const token = localStorage.getItem('token') || '';
            const res = await fetch('/api/purchases/grn', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ ...form, items })
            });
            if (res.ok) {
                setShowModal(false);
                setForm({ supplierId: '', orderId: '', stockId: '1', notes: '' });
                setItems([]);
                loadData();
            } else {
                alert('فشل حفظ سند الاستلام');
            }
        } catch (e) {}
    };

    return (<>
        <div className="page-header"><h1 className="page-title">📦 مذكرات استلام البضائع (GRN)</h1></div>
        
        <div className="page-content animate-fade-in">
            <div className="toolbar">
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>إدارة الإدخالات المخزنية وفحص مطابقة البضائع قبل استلام الفاتورة</span>
                <div className="toolbar-spacer" />
                <button onClick={() => setShowModal(true)} className="primary-btn">
                    <Plus size={16} /> تسجيل مستند استلام (New GRN)
                </button>
            </div>

            <div className="card" style={{ padding: '0', overflowX: 'auto' }}>
                <table className="table" style={{ width: '100%' }}>
                    <thead>
                        <tr>
                            <th>رقم السند</th>
                            <th>تاريخ الاستلام</th>
                            <th>المورد</th>
                            <th>المستودع</th>
                            <th>مستلم البضاعة</th>
                            <th>حالة المطابقة</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: '20px' }}>جاري التحميل...</td></tr> : grns.length === 0 ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: '20px' }}>لا توجد مذكرات استلام مسجلة</td></tr> : grns.map(g => (
                            <tr key={g.id}>
                                <td><strong style={{color: '#6366f1'}}>GRN-{g.grnNo}</strong></td>
                                <td>{new Date(g.date).toLocaleDateString()}</td>
                                <td>{g.supplier?.name || '-'}</td>
                                <td>{g.stock?.name || 'الرئيسي'}</td>
                                <td>{g.receiver?.fullName || '-'}</td>
                                <td><span style={{ padding: '6px 12px', backgroundColor: '#10b98120', color: '#10b981', borderRadius: '20px', fontSize: '12px' }}><CheckCircle size={12} style={{display:'inline', marginRight:'4px'}}/> تم الفحص والإدخال</span></td>
                                <td>
                                    <div style={{ display: 'flex', gap: '5px' }}>
                                        <button className="btn btn-outline" style={{ fontSize: '12px', padding: '4px 8px' }}>إظهار السند</button>
                                        <button className="btn" style={{ fontSize: '12px', padding: '4px 8px', backgroundColor: '#3b82f6', color: 'white' }}>ترصيد فاتورة شراء</button>
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
                <div className="modal animate-scale-in" style={{ maxWidth: '900px', width: '95%', backgroundColor: 'var(--card-bg, white)', borderRadius: '12px', padding: '24px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
                    <h2>تسجيل مذكرة استلام بالمخزن (Goods Receipt Note)</h2>
                    <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <div className="input-group" style={{ margin: 0, flex: 1 }}>
                                <label className="input-label">المورد (مصدر البضاعة)</label>
                                <select required className="input" value={form.supplierId} onChange={e => setForm({...form, supplierId: e.target.value})}>
                                    <option value="">اختر...</option>
                                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div className="input-group" style={{ margin: 0, flex: 1 }}>
                                <label className="input-label">أمين المستودع / مستودع التخزين</label>
                                <select className="input" value={form.stockId} onChange={e => setForm({...form, stockId: e.target.value})}>
                                    {stocks.length > 0 ? stocks.map(s => <option key={s.id} value={s.id}>{s.name}</option>) : <option value="1">المستودع الرئيسي</option>}
                                </select>
                            </div>
                        </div>
                        
                        <div style={{ padding: '15px', border: '1px solid var(--border)', borderRadius: '8px' }}>
                            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                <h4>فحص البضائع المستلمة فعلياً</h4>
                                <button type="button" onClick={addItem} className="btn btn-outline" style={{fontSize: '12px'}}>+ إضافة عنصر</button>
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table className="table" style={{ width: '100%', marginTop: '10px', minWidth: '700px' }}>
                                    <thead>
                                        <tr>
                                            <th>الصنف المورد</th>
                                            <th style={{width: '120px'}}>المطالب به</th>
                                            <th style={{width: '120px'}}>المقبول (سليم)</th>
                                            <th style={{width: '100px'}}>المرفوض (تالف)</th>
                                            <th style={{width: '50px'}}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item, index) => (
                                            <tr key={index}>
                                                <td>
                                                    <select required className="input" value={item.productId} onChange={e => updateItem(index, 'productId', e.target.value)}>
                                                        <option value="">الصنف...</option>
                                                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                    </select>
                                                </td>
                                                <td><input required type="number" min="0.1" step="any" className="input" value={item.quantity} onChange={e => updateItem(index, 'quantity', e.target.value)} /></td>
                                                <td><input required type="number" step="any" className="input" value={item.acceptedQty} onChange={e => updateItem(index, 'acceptedQty', e.target.value)} style={{ borderColor: '#10b981' }}/></td>
                                                <td><input type="number" step="any" className="input" value={item.rejectedQty} readOnly style={{ backgroundColor: '#ef444410', color: '#ef4444' }} /></td>
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
                            <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">إلغاء المستند</button>
                            <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#10b981' }}><Package size={16} style={{display:'inline', marginRight:'5px'}}/> ترحيل المستند وإثبات الإدخال المخزني</button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </>);
}