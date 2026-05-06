'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from "@/lib/i18n";
import { useToast } from '@/components/Toast';

interface OrderDetail { 
 productId: number; 
 productName: string;
 quantity: number; 
 price: number; 
 taxValue: number;
 total: number;
}

interface Order { 
 id: number; 
 orderNo: number; 
 date: string; 
 total: number; 
 taxValue: number; 
 subtotal: number; 
 status: string; 
 notes: string; 
 supplier?: { id: number; name: string };
 user?: { fullName: string };
 details: OrderDetail[];
}

export default function PurchaseOrdersPage() {
 const { t } = useTranslation();
 const { error: toastError, success: toastSuccess } = useToast();
 const [orders, setOrders] = useState<Order[]>([]);
 const [expanded, setExpanded] = useState<number | null>(null);
 const [loading, setLoading] = useState(true);
 const router = useRouter();

 // Create Modal State
 const [showModal, setShowModal] = useState(false);
 const [suppliers, setSuppliers] = useState<any[]>([]);
 const [saving, setSaving] = useState(false);
 const [newOrder, setNewOrder] = useState({ supplierId: '', notes: '' });
 const [newItems, setNewItems] = useState<{ productId: string, productName: string, quantity: number, price: number }[]>([
 { productId: '1', productName: 'صنف جديد', quantity: 1, price: 0 }
 ]);

 useEffect(() => { 
 load(); 
 fetchSuppliers();
 }, []);

 async function fetchSuppliers() {
 try {
 const res = await fetch('/api/customers?type=1');
 if (res.ok) setSuppliers(await res.json());
 } catch(e){}
 }
 async function load() { 
 setLoading(true); 
 try { 
 const r = await fetch('/api/purchase-orders'); 
 if (r.ok) setOrders(await r.json()); 
 } catch (e: any) { toastError(e?.message || 'حدث خطأ'); } 
 setLoading(false); 
 };

 const fmt = (n: number) => n.toLocaleString('en-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
 
 // Status can be pending, approved, rejected, completed
 const statusLabel: Record<string, string> = { 
 pending: '⏳ بانتظار الاعتماد', 
 approved: '✅ معتمد', 
 rejected: '❌ مرفوض', 
 completed: '📦 مكتمل' 
 };
 
 const statusColor: Record<string, string> = { 
 pending: '#f59e0b', 
 approved: '#3b82f6', 
 rejected: '#ef4444', 
 completed: '#22c55e' 
 };

 const updateStatus = async (id: number, newStatus: string) => {
 // We will implement the API put logic in the next step
 try {
 const res = await fetch(`/api/purchase-orders/${id}`, {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ status: newStatus })
 });
 if (res.ok) {
 load();
 } else {
 alert(t('sys.str_960'));
 }
 } catch (e) {
 console.error(e);
 alert(t('sys.str_961'));
 }
 };

 const handleCreateOrder = async (e: React.FormEvent) => {
 e.preventDefault();
 setSaving(true);
 try {
 const token = localStorage.getItem('token') || '';
 const res = await fetch('/api/purchase-orders', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
 body: JSON.stringify({
 supplierId: newOrder.supplierId,
 notes: newOrder.notes,
 items: newItems
 })
 });
 if (res.ok) {
 setShowModal(false);
 setNewOrder({ supplierId: '', notes: '' });
 setNewItems([{ productId: '1', productName: 'صنف جديد', quantity: 1, price: 0 }]);
 load();
 } else {
 alert(t('sys.str_962'));
 }
 } catch (err: any) { toastError(err?.message || 'حدث خطأ'); }
 setSaving(false);
 };

 return (<>
 <div className="page-header"><h1 className="page-title">{t('sys.str_942')}</h1></div>
 <div className="page-content animate-fade-in">
 <div className="toolbar">
 <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{orders.length} {t('sys.str_943')}</span>
 <div className="toolbar-spacer" />
 <button onClick={() => setShowModal(true)} className="primary-btn">{t('sys.str_944')}</button>
 </div>
 <div className="card">
 {loading ? <div className="empty-state"><div className="empty-state-text">{t('sys.str_168')}</div></div> :
 orders.length === 0 ? <div className="empty-state"><div className="empty-state-icon">📝</div><div className="empty-state-text">{t('sys.str_945')}</div></div> :
 <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>{orders.map(o => (
 <div key={o.id} className="card" style={{ padding: '12px', cursor: 'pointer', borderLeft: `4px solid ${statusColor[o.status] || '#888'}` }} onClick={() => setExpanded(expanded === o.id ? null : o.id)}>
 <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
 <span style={{ fontFamily: 'monospace', color: 'var(--primary)', fontWeight: 'bold' }}>#{o.orderNo}</span>
 <span style={{ fontSize: '12px', color: 'var(--text)' }}>👤 {o.user?.fullName || t('sys.str_963')}</span>
 {o.supplier && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>🏭 {o.supplier.name}</span>}
 <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>📅 {new Date(o.date).toLocaleDateString('en-GB')}</span>
 <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '12px', background: (statusColor[o.status] || '#888') + '15', color: statusColor[o.status] || '#888', fontWeight: 'bold' }}>{statusLabel[o.status] || o.status}</span>
 <div className="toolbar-spacer" />
 <span style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '16px' }}>{fmt(o.total)} {t('sys.str_68')}</span>
 </div>
 {expanded === o.id && o.details && (
 <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px dashed var(--border)' }} onClick={(e) => e.stopPropagation()}>
 <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
 <thead>
 <tr style={{ background: 'rgba(108,99,255,0.05)' }}>
 <th style={{ padding: '8px', textAlign: 'right' }}>{t('sys.str_63')}</th>
 <th style={{ padding: '8px', textAlign: 'center' }}>{t('sys.str_64')}</th>
 <th style={{ padding: '8px', textAlign: 'center' }}>{t('sys.str_65')}</th>
 <th style={{ padding: '8px', textAlign: 'center' }}>{t('sys.str_946')}</th>
 <th style={{ padding: '8px', textAlign: 'center' }}>{t('sys.str_947')}</th>
 </tr>
 </thead>
 <tbody>
 {o.details.map((item, i) => (
 <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
 <td style={{ padding: '8px' }}>{item.productName || `منتج #${item.productId}`}</td>
 <td style={{ padding: '8px', textAlign: 'center' }}>{item.quantity}</td>
 <td style={{ padding: '8px', textAlign: 'center', fontFamily: 'monospace' }}>{fmt(item.price)}</td>
 <td style={{ padding: '8px', textAlign: 'center', fontFamily: 'monospace' }}>{fmt(item.taxValue)}</td>
 <td style={{ padding: '8px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 'bold' }}>{fmt(item.total)}</td>
 </tr>
 ))}
 </tbody>
 </table>
 
 {/* Action Buttons for Approvals */}
 <div style={{ display: 'flex', gap: '10px', marginTop: '15px', justifyContent: 'flex-end' }}>
 {o.status === 'pending' && (
 <>
 <button onClick={() => updateStatus(o.id, 'rejected')} style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>{t('sys.str_948')}</button>
 <button onClick={() => updateStatus(o.id, 'approved')} style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #86efac', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>{t('sys.str_949')}</button>
 </>
 )}
 {o.status === 'approved' && (
 <div style={{ display: 'flex', gap: '10px' }}>
 <button onClick={() => router.push(`/purchase-orders/${o.id}/landed-costs`)} className="btn btn-outline" style={{ border: '1px solid var(--primary)', color: 'var(--primary)' }}>{t('sys.str_950')}</button>
 <button onClick={() => updateStatus(o.id, 'completed')} className="primary-btn">{t('sys.str_951')}</button>
 </div>
 )}
 </div>
 </div>
 )}
 </div>
 ))}</div>}
 </div>
 </div>

 {/* Create Order Modal */}
 {showModal && (
 <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 }}>
 <div className="modal bg-white "style={{ maxWidth: '1000px', width: '95%', borderRadius: '12px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto', margin: 0 }}>
 <div className="modal-header bg-white "style={{ position: 'sticky', top: 0, zIndex: 10, padding: '20px', borderBottom: '1px solid var(--border)' }}>
 <h2>{t('sys.str_952')}</h2>
 <button onClick={() => setShowModal(false)} className="close-btn">×</button>
 </div>
 <form onSubmit={handleCreateOrder} style={{ padding: '20px' }}>
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
 <div className="input-group" style={{ margin: 0 }}>
 <label className="input-label">{t('sys.str_953')}</label>
 <select className="input" required value={newOrder.supplierId} onChange={e => setNewOrder({...newOrder, supplierId: e.target.value})}>
 <option value="">{t('sys.str_954')}</option>
 {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
 </select>
 </div>
 <div className="input-group" style={{ margin: 0 }}>
 <label className="input-label">{t('sys.str_955')}</label>
 <input type="text" className="input" value={newOrder.notes} onChange={e => setNewOrder({...newOrder, notes: e.target.value})} />
 </div>
 </div>

 <h3 style={{ borderBottom: '1px solid #ccc', paddingBottom: '10px', marginBottom: '15px' }}>{t('sys.str_956')}</h3>
 <table className="table" style={{ marginBottom: '15px' }}>
 <thead>
 <tr>
 <th>{t('sys.str_957')}</th>
 <th>{t('sys.str_64')}</th>
 <th>{t('sys.str_958')}</th>
 <th>{t('sys.str_410')}</th>
 </tr>
 </thead>
 <tbody>
 {newItems.map((item, idx) => (
 <tr key={idx}>
 <td><input className="input" required value={item.productName} onChange={e => { const items = [...newItems]; items[idx].productName = e.target.value; setNewItems(items); }} /></td>
 <td><input type="number" step="0.01" className="input" required value={item.quantity} onChange={e => { const items = [...newItems]; items[idx].quantity = parseFloat(e.target.value) || 0; setNewItems(items); }} /></td>
 <td><input type="number" step="0.01" className="input" required value={item.price} onChange={e => { const items = [...newItems]; items[idx].price = parseFloat(e.target.value) || 0; setNewItems(items); }} /></td>
 <td>
 <button type="button" onClick={() => setNewItems(newItems.filter((_, i) => i !== idx))} className="btn btn-ghost" style={{ color: 'red' }}>🗑️</button>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 <button type="button" onClick={() => setNewItems([...newItems, { productId: '1', productName: '', quantity: 1, price: 0 }])} className="btn btn-outline" style={{ marginBottom: '20px' }}>{t('sys.str_959')}</button>

 <div className="modal-footer" style={{ borderTop: '1px solid #eee', paddingTop: '15px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
 <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost">{t('fin.str_206')}</button>
 <button type="submit" disabled={saving} className="btn btn-primary">{saving ? t('sys.str_454') : t('sys.str_964')}</button>
 </div>
 </form>
 </div>
 </div>
 )}
 </>);
}
