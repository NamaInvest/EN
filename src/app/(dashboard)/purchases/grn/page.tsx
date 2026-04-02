'use client';
import { useState, useEffect } from 'react';
import { Box, Plus, CheckCircle, Package } from 'lucide-react';
import { useTranslation } from "@/lib/i18n";

export default function GoodsReceiptNotePage() {
    const { t } = useTranslation();
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
        if (items.length === 0) return alert(t('purchases.str_2265'));
        
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
                alert(t('purchases.str_2266'));
            }
        } catch (e) {}
    };

    return (<>
        <div className="page-header"><h1 className="page-title">{t('purchases.str_2241')}</h1></div>
        
        <div className="page-content animate-fade-in">
            <div className="toolbar">
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t('purchases.str_2242')}</span>
                <div className="toolbar-spacer" />
                <button onClick={() => setShowModal(true)} className="primary-btn">
                    <Plus size={16} /> {t('purchases.str_2243')}</button>
            </div>

            <div className="card" style={{ padding: '0', overflowX: 'auto' }}>
                <table className="table" style={{ width: '100%' }}>
                    <thead>
                        <tr>
                            <th>{t('sys.str_1045')}</th>
                            <th>{t('purchases.str_2244')}</th>
                            <th>{t('sys.str_953')}</th>
                            <th>{t('sys.str_2227')}</th>
                            <th>{t('purchases.str_2245')}</th>
                            <th>{t('purchases.str_2246')}</th>
                            <th>{t('purchases.str_2247')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: '20px' }}>{t('sys.str_168')}</td></tr> : grns.length === 0 ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: '20px' }}>{t('purchases.str_2248')}</td></tr> : grns.map(g => (
                            <tr key={g.id}>
                                <td><strong style={{color: '#6366f1'}}>GRN-{g.grnNo}</strong></td>
                                <td>{new Date(g.date).toLocaleDateString()}</td>
                                <td>{g.supplier?.name || '-'}</td>
                                <td>{g.stock?.name || t('purchases.str_2267')}</td>
                                <td>{g.receiver?.fullName || '-'}</td>
                                <td><span style={{ padding: '6px 12px', backgroundColor: '#10b98120', color: '#10b981', borderRadius: '20px', fontSize: '12px' }}><CheckCircle size={12} style={{display:'inline', marginRight:'4px'}}/> {t('purchases.str_2249')}</span></td>
                                <td>
                                    <div style={{ display: 'flex', gap: '5px' }}>
                                        <button className="btn btn-outline" style={{ fontSize: '12px', padding: '4px 8px' }}>{t('purchases.str_2250')}</button>
                                        <button className="btn" style={{ fontSize: '12px', padding: '4px 8px', backgroundColor: '#3b82f6', color: 'white' }}>{t('purchases.str_2251')}</button>
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
                    <h2>{t('purchases.str_2252')}</h2>
                    <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <div className="input-group" style={{ margin: 0, flex: 1 }}>
                                <label className="input-label">{t('purchases.str_2253')}</label>
                                <select required className="input" value={form.supplierId} onChange={e => setForm({...form, supplierId: e.target.value})}>
                                    <option value="">{t('sys.str_1498')}</option>
                                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div className="input-group" style={{ margin: 0, flex: 1 }}>
                                <label className="input-label">{t('purchases.str_2254')}</label>
                                <select className="input" value={form.stockId} onChange={e => setForm({...form, stockId: e.target.value})}>
                                    {stocks.length > 0 ? stocks.map(s => <option key={s.id} value={s.id}>{s.name}</option>) : <option value="1">{t('sys.str_753')}</option>}
                                </select>
                            </div>
                        </div>
                        
                        <div style={{ padding: '15px', border: '1px solid var(--border)', borderRadius: '8px' }}>
                            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                <h4>{t('purchases.str_2255')}</h4>
                                <button type="button" onClick={addItem} className="btn btn-outline" style={{fontSize: '12px'}}>{t('purchases.str_2256')}</button>
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table className="table" style={{ width: '100%', marginTop: '10px', minWidth: '700px' }}>
                                    <thead>
                                        <tr>
                                            <th>{t('purchases.str_2257')}</th>
                                            <th style={{width: '120px'}}>{t('purchases.str_2258')}</th>
                                            <th style={{width: '120px'}}>{t('purchases.str_2259')}</th>
                                            <th style={{width: '100px'}}>{t('purchases.str_2260')}</th>
                                            <th style={{width: '50px'}}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item, index) => (
                                            <tr key={index}>
                                                <td>
                                                    <select required className="input" value={item.productId} onChange={e => updateItem(index, 'productId', e.target.value)}>
                                                        <option value="">{t('purchases.str_2262')}</option>
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
                            <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">{t('purchases.str_2263')}</button>
                            <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#10b981' }}><Package size={16} style={{display:'inline', marginRight:'5px'}}/> {t('purchases.str_2264')}</button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </>);
}