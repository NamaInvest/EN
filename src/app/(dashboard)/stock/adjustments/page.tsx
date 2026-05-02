'use client';
import { useState, useEffect } from 'react';
import { Edit3, CheckCircle, AlertTriangle } from 'lucide-react';
import { useTranslation } from "@/lib/i18n";
import { useToast } from '@/components/Toast';

export default function StockAdjustmentsPage() {
    const { t } = useTranslation();
    const { error: toastError, success: toastSuccess } = useToast();
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
        } catch (e: any) { toastError(e?.message || 'حدث خطأ'); }
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
                alert(data.error || t('stock.str_2638'));
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
        <div className="page-header"><h1 className="page-title">{t('stock.str_2614')}</h1></div>
        
        <div className="page-content animate-fade-in">
            <div className="toolbar">
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t('stock.str_2615')}</span>
                <div className="toolbar-spacer" />
                <button onClick={() => setShowModal(true)} className="btn btn-primary" style={{ backgroundColor: '#f59e0b', color: 'white' }}>
                    <Edit3 size={16} style={{marginRight:'5px'}} /> {t('stock.str_2616')}</button>
            </div>

            <div className="card" style={{ padding: '0', overflowX: 'auto' }}>
                <table className="table" style={{ width: '100%' }}>
                    <thead>
                        <tr>
                            <th>{t('stock.str_2617')}</th>
                            <th>{t('stock.str_2618')}</th>
                            <th>{t('stock.str_2619')}</th>
                            <th>{t('stock.str_2620')}</th>
                            <th>{t('stock.str_2621')}</th>
                            <th>{t('sys.str_386')}</th>
                            <th>{t('stock.str_2622')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: '20px' }}>{t('sys.str_168')}</td></tr> : adjustments.length === 0 ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: '20px' }}>{t('stock.str_2623')}</td></tr> : adjustments.map(a => (
                            <tr key={a.id}>
                                <td><strong style={{color: '#6366f1'}}>ADJ-{a.id}</strong></td>
                                <td><span dir="ltr">{new Date(a.date).toLocaleDateString('en-GB')}</span></td>
                                <td>{a.product?.name} <span style={{fontSize:'10px', color:'#888'}}>({a.product?.sku})</span></td>
                                <td>
                                    {a.type === 'adjustment_in' ? 
                                        <span style={{color: '#10b981', fontWeight: 600}}>{t('stock.str_2624')}</span> : 
                                        <span style={{color: '#ef4444', fontWeight: 600}}>{t('stock.str_2625')}</span>
                                    }
                                </td>
                                <td><strong style={{color: a.type === 'adjustment_in' ? '#10b981' : '#ef4444'}}>{a.type === 'adjustment_in' ? '+' : '-'}{a.quantity}</strong></td>
                                <td>{a.user?.fullName || t('stock.str_1485')}</td>
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
                    <h2>{t('stock.str_2626')}</h2>
                    <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
                        
                        <div className="input-group" style={{ margin: 0 }}>
                            <label className="input-label">{t('stock.str_2627')}</label>
                            <select required className="input" value={form.productId} onChange={e => handleProductChange(e.target.value)}>
                                <option value="">{t('stock.str_2628')}</option>
                                {products.map(p => <option key={p.id} value={p.id}>{p.name} {t('stock.str_2629')}{p.currentStock})</option>)}
                            </select>
                        </div>
                        
                        {selectedProduct && (
                            <div style={{ display: 'flex', gap: '15px', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', alignItems: 'center' }}>
                                <div style={{flex: 1, textAlign: 'center'}}>
                                    <div style={{fontSize: '12px', color: '#64748b'}}>{t('stock.str_2630')}</div>
                                    <strong style={{fontSize: '20px'}}>{selectedProduct.currentStock}</strong>
                                </div>
                                <div style={{width: '2px', height: '40px', backgroundColor: '#cbd5e1'}}></div>
                                <div style={{flex: 1}}>
                                    <label style={{fontSize: '12px', color: '#64748b'}}>{t('stock.str_2631')}</label>
                                    <input required type="number" step="any" min="0" className="input" value={form.actualQuantity} onChange={e => setForm({...form, actualQuantity: e.target.value})} style={{ textAlign: 'center', fontSize: '18px', fontWeight: 'bold' }} />
                                </div>
                            </div>
                        )}

                        {diff !== null && selectedProduct && diff !== 0 && (
                            <div style={{ padding: '15px', borderRadius: '8px', backgroundColor: diff > 0 ? '#10b98115' : '#ef444415', color: diff > 0 ? '#059669' : '#dc2626', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {diff > 0 ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                                <div>
                                    {t('stock.str_2632')}<strong>{diff > 0 ? t('stock.str_2639') : t('stock.str_2640')}</strong> {t('stock.str_2633')}<strong>{Math.abs(diff)}</strong> {t('stock.str_2634')}</div>
                            </div>
                        )}
                        
                        {diff !== null && diff === 0 && (
                            <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: '#e2e8f0', color: '#475569', textAlign: 'center' }}>
                                {t('stock.str_2635')}</div>
                        )}

                        <div className="input-group" style={{ margin: 0 }}>
                            <label className="input-label">{t('stock.str_2636')}</label>
                            <input required type="text" className="input" value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} placeholder={t('stock.str_2641')} />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                            <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">{t('fin.str_206')}</button>
                            <button   type="submit" disabled={diff === null || diff === 0} className="btn btn-primary" style={{ backgroundColor: '#f59e0b', color: 'white', opacity: (diff === null || diff === 0) ? 0.5 : 1 }}>{t('stock.str_2637')}</button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </>);
}
