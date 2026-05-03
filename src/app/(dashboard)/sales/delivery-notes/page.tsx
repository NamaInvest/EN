'use client';
import { useState, useEffect } from 'react';
import { Truck, Plus, PackageOpen } from 'lucide-react';
import { useTranslation } from "@/lib/i18n";
import { useToast } from '@/components/Toast';

export default function DeliveryNotesPage() {
 const { t } = useTranslation();
 const { error: toastError, success: toastSuccess } = useToast();
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
 } catch (e: any) { toastError(e?.message || 'حدث خطأ'); }
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
 if (items.length === 0) return alert(t('sales.str_2411'));
 
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
 alert(t('sales.str_2412'));
 }
 } catch (e) {}
 };

 return (<>
 <div className="page-header"><h1 className="page-title">{t('sales.str_2394')}</h1></div>
 
 <div className="page-content animate-fade-in">
 <div className="toolbar">
 <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t('sales.str_2395')}</span>
 <div className="toolbar-spacer" />
 <button onClick={() => setShowModal(true)} className="primary-btn">
 <Plus size={16} /> {t('sales.str_2396')}</button>
 </div>

 <div className="card" style={{ padding: '0', overflowX: 'auto' }}>
 <table className="table" style={{ width: '100%' }}>
 <thead>
 <tr>
 <th>{t('sales.str_2397')}</th>
 <th>{t('fin.str_232')}</th>
 <th>{t('sales.str_2398')}</th>
 <th>{t('fin.str_227')}</th>
 <th>{t('stock.str_1443')}</th>
 <th>{t('purchases.str_2247')}</th>
 </tr>
 </thead>
 <tbody>
 {loading ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>{t('sys.str_168')}</td></tr> : notes.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>{t('sales.str_2399')}</td></tr> : notes.map(n => (
 <tr key={n.id}>
 <td><strong style={{color: '#f59e0b'}}>DN-{n.noteNo}</strong></td>
 <td>{new Date(n.date).toLocaleDateString('en-GB')}</td>
 <td>{n.customer?.name || t('sys.str_752')}</td>
 <td><span style={{ padding: '6px 12px', backgroundColor: '#10b98120', color: '#10b981', borderRadius: '20px', fontSize: '12px' }}>{t('sales.str_2400')}</span></td>
 <td>{n.details?.length || 0}</td>
 <td>
 <button className="btn btn-outline" style={{ fontSize: '12px', padding: '4px 8px' }}>{t('sales.str_2401')}</button>
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
 <h2>{t('sales.str_2402')}</h2>
 <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
 <div style={{ display: 'flex', gap: '15px' }}>
 <div className="input-group" style={{ margin: 0, flex: 1 }}>
 <label className="input-label">{t('sales.str_2403')}</label>
 <select required className="input" value={form.customerId} onChange={e => setForm({...form, customerId: e.target.value})}>
 <option value="">{t('sales.str_2404')}</option>
 {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
 </select>
 </div>
 </div>
 
 <div style={{ padding: '15px', border: '1px solid var(--border)', borderRadius: '8px' }}>
 <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
 <h4>{t('sales.str_2405')}</h4>
 <button type="button" onClick={addItem} className="btn btn-outline" style={{fontSize: '12px'}}>{t('sales.str_2406')}</button>
 </div>
 <div style={{ overflowX: 'auto' }}>
 <table className="table" style={{ width: '100%', marginTop: '10px' }}>
 <thead>
 <tr>
 <th>{t('sys.str_801')}</th>
 <th style={{width: '120px'}}>{t('sales.str_2407')}</th>
 <th style={{width: '120px'}}>{t('sales.str_2408')}</th>
 <th style={{width: '50px'}}></th>
 </tr>
 </thead>
 <tbody>
 {items.map((item, index) => (
 <tr key={index}>
 <td>
 <select required className="input" value={item.productId} onChange={e => updateItem(index, 'productId', e.target.value)}>
 <option value="">{t('fin.str_2007')}</option>
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
 <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">{t('sales.str_2409')}</button>
 <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#f59e0b', color: 'white' }}><Truck size={16} style={{display:'inline', marginRight:'5px'}}/> {t('sales.str_2410')}</button>
 </div>
 </form>
 </div>
 </div>
 )}
 </>);
}
