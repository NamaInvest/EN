'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from "@/lib/i18n";
import { useToast } from '@/components/Toast';

export default function SalesOrdersPage() {
    const { t } = useTranslation();
    const { error: toastError, success: toastSuccess } = useToast();
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
        } catch (e: any) { toastError(e?.message || 'حدث خطأ'); }
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
        if (items.length === 0) return alert(t('sales.str_2451'));
        
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
                alert(t('sales.str_2452'));
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
                alert(err.error || t('sales.str_2453'));
            }
        } catch (e) {}
    }

    const statusBadge = (s: string) => {
        if (s === 'pending') return <span style={{ padding: '4px 8px', backgroundColor: '#f59e0b20', color: '#f59e0b', borderRadius: '4px' }}>{t('sales.str_2427')}</span>;
        if (s === 'approved') return <span style={{ padding: '4px 8px', backgroundColor: '#3b82f620', color: '#3b82f6', borderRadius: '4px' }}>{t('sales.str_2428')}</span>;
        if (s === 'delivered') return <span style={{ padding: '4px 8px', backgroundColor: '#8b5cf620', color: '#8b5cf6', borderRadius: '4px' }}>{t('sales.str_2429')}</span>;
        if (s === 'invoiced') return <span style={{ padding: '4px 8px', backgroundColor: '#10b98120', color: '#10b981', borderRadius: '4px' }}>{t('sales.str_2430')}</span>;
        return <span>{s}</span>;
    }

    return (<>
        <div className="page-header"><h1 className="page-title">{t('sales.str_2431')}</h1></div>
        
        <div className="page-content animate-fade-in">
            <div className="toolbar">
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t('sales.str_2432')}</span>
                <div className="toolbar-spacer" />
                <button onClick={() => setShowModal(true)} className="primary-btn">{t('sales.str_2433')}</button>
            </div>

            <div className="card" style={{ padding: '0', overflowX: 'auto' }}>
                <table className="table" style={{ width: '100%' }}>
                    <thead>
                        <tr>
                            <th>{t('sales.str_2434')}</th>
                            <th>{t('fin.str_232')}</th>
                            <th>{t('sys.str_460')}</th>
                            <th>{t('sales.str_2435')}</th>
                            <th>{t('sys.str_66')}</th>
                            <th>{t('sales.str_2436')}</th>
                            <th>{t('sales.str_2437')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: '20px' }}>{t('sys.str_168')}</td></tr> : orders.length === 0 ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: '20px' }}>{t('sales.str_2438')}</td></tr> : orders.map(o => (
                            <tr key={o.id}>
                                <td><strong>SO-{o.orderNo}</strong></td>
                                <td>{new Date(o.date).toLocaleDateString()}</td>
                                <td>{o.customer?.name || '-'}</td>
                                <td>{o.salesRep?.name || <span style={{ color: 'var(--text-muted)' }}>{t('sales.str_2439')}</span>}</td>
                                <td><strong style={{ color: '#10b981' }}>{o.total.toLocaleString()} {t('sys.str_68')}</strong></td>
                                <td>{statusBadge(o.status)}</td>
                                <td>
                                    <div style={{ display: 'flex', gap: '5px' }}>
                                        {o.status === 'pending' && <button onClick={() => handleAction(o.id, 'approve')} className="btn btn-outline" style={{ fontSize: '12px', padding: '4px 8px' }}>{t('sales.str_2440')}</button>}
                                        {o.status === 'approved' && <button onClick={() => handleAction(o.id, 'deliver')} className="btn" style={{ fontSize: '12px', padding: '4px 8px', backgroundColor: '#8b5cf6', color: 'white' }}>{t('sales.str_2441')}</button>}
                                        {o.status === 'delivered' && <button onClick={() => handleAction(o.id, 'invoice')} className="btn btn-primary" style={{ fontSize: '12px', padding: '4px 8px' }}>{t('sales.str_2442')}</button>}
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
                    <h2>{t('sales.str_2443')}</h2>
                    <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <div className="input-group" style={{ margin: 0, flex: 1 }}>
                                <label className="input-label">{t('sys.str_460')}</label>
                                <select required className="input" value={form.customerId} onChange={e => setForm({...form, customerId: e.target.value})}>
                                    <option value="">{t('sys.str_1811')}</option>
                                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="input-group" style={{ margin: 0, flex: 1 }}>
                                <label className="input-label">{t('sales.str_2444')}</label>
                                <select className="input" value={form.salesRepId} onChange={e => setForm({...form, salesRepId: e.target.value})}>
                                    <option value="">{t('sales.str_2445')}</option>
                                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                </select>
                            </div>
                        </div>
                        
                        <div style={{ padding: '15px', border: '1px solid var(--border)', borderRadius: '8px' }}>
                            <h4>{t('sales.str_2446')}</h4>
                            <table className="table" style={{ width: '100%', marginTop: '10px' }}>
                                <thead>
                                    <tr>
                                        <th>{t('sys.str_801')}</th>
                                        <th style={{width: '100px'}}>{t('sys.str_64')}</th>
                                        <th style={{width: '120px'}}>{t('sys.str_958')}</th>
                                        <th style={{width: '120px'}}>{t('sys.str_66')}</th>
                                        <th style={{width: '50px'}}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, index) => (
                                        <tr key={index}>
                                            <td>
                                                <select required className="input" value={item.productId} onChange={e => updateItem(index, 'productId', e.target.value)}>
                                                    <option value="">{t('sys.str_1498')}</option>
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
                            <button type="button" onClick={addItem} className="btn btn-outline" style={{ marginTop: '10px' }}>{t('stock.str_1461')}</button>
                        </div>

                        <div style={{ alignSelf: 'flex-end', minWidth: '250px', padding: '15px', backgroundColor: 'var(--bg)', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}><span>{t('sales.str_2447')}</span> <strong>{subtotal.toLocaleString()}</strong></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', color: '#ef4444' }}><span>{t('sales.str_2448')}</span> <strong>{taxValue.toLocaleString()}</strong></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '5px' }}><span>{t('sales.str_2449')}</span> <strong style={{ color: '#10b981', fontSize: '18px' }}>{total.toLocaleString()} {t('sys.str_68')}</strong></div>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                            <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>{t('fin.str_206')}</button>
                            <button type="submit" className="btn btn-primary">{t('sales.str_2450')}</button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </>);
}
