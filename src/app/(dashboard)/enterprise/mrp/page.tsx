'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { 
    Factory, Settings, PlayCircle, CheckCircle, Clock, 
    Wrench, Plus, ChevronRight, Activity
} from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function EnterpriseMRP() {
    const { t } = useTranslation();
    const { error: toastError, success: toastSuccess } = useToast();
    const [data, setData] = useState({ orders: [], machines: [], recipesCount: 0 });
    const [recipes, setRecipes] = useState<any[]>([]);
    const [warehouses, setWarehouses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // UI State
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({ recipeId: '', machineId: '', stockId: '', quantity: '', startDate: '', endDate: '' });

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/enterprise/mrp`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) setData(await res.json());

            // Fetch lookups
            const rRes = await fetch('/api/manufacturing/recipes', { headers: { Authorization: `Bearer ${token}` } });
            if (rRes.ok) setRecipes(await rRes.json());
            
            const wRes = await fetch('/api/stock', { headers: { Authorization: `Bearer ${token}` } });
            if (wRes.ok) setWarehouses(await wRes.json());

        } catch (error: any) { toastError(error?.message || 'حدث خطأ'); } 
        finally { setLoading(false); }
    };

    const handleCreateOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/enterprise/mrp', {
                method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ ...formData, type: 'order' })
            });
            if (res.ok) { setShowOrderModal(false); fetchData(); } 
            else { alert(t('sys.str_1862')); }
        } catch (error) { alert(t('sys.str_631')); } 
        finally { setSaving(false); }
    };

    const updateOrderStatus = async (id: number, action: string) => {
        const token = localStorage.getItem('token');
        try {
            await fetch('/api/enterprise/mrp', {
                method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ id, action })
            });
            fetchData();
        } catch (error) { alert(t('sys.str_631')); }
    };

    const getMachineStatusColor = (status: string) => {
        if (status === 'RUNNING') return 'var(--success)';
        if (status === 'MAINTENANCE') return 'var(--danger)';
        return 'var(--text-muted)'; // IDLE
    };

    return (
        <div style={{ padding: '24px', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Factory size={28} color="var(--primary)" />
                        {t('sys.str_1834')}</h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '14px' }}>
                        {t('sys.str_1835')}</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                        className="btn btn-ghost"
                        onClick={() => window.location.href = '/enterprise/mrp/recipes'}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        {t('sys.str_1836')}</button>
                    <button 
                        className="btn btn-primary"
                        onClick={() => setShowOrderModal(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <Plus size={20} /> {t('sys.str_1837')}</button>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>{t('sys.str_1838')}</div>
            ) : (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ padding: '16px', background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', borderRadius: '50%' }}><Settings size={28} /></div>
                            <div>
                                <div style={{ fontSize: '32px', fontWeight: '900' }}>{data.machines.length}</div>
                                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t('sys.str_1839')}</div>
                            </div>
                        </div>
                        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ padding: '16px', background: 'rgba(34, 197, 94, 0.1)', color: '#22C55E', borderRadius: '50%' }}><Activity size={28} /></div>
                            <div>
                                <div style={{ fontSize: '32px', fontWeight: '900' }}>{data.orders.filter((o: any) => o.status === 'IN_PROGRESS').length}</div>
                                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t('sys.str_1840')}</div>
                            </div>
                        </div>
                        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ padding: '16px', background: 'rgba(234, 179, 8, 0.1)', color: '#EAB308', borderRadius: '50%' }}><Clock size={28} /></div>
                            <div>
                                <div style={{ fontSize: '32px', fontWeight: '900' }}>{data.orders.filter((o: any) => o.status === 'PLANNED').length}</div>
                                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t('sys.str_1841')}</div>
                            </div>
                        </div>
                    </div>

                    <div className="grid-2">
                        {/* Manufacturing Orders */}
                        <div className="card" style={{ padding: '20px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {t('sys.str_1842')}</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {data.orders.map((order: any) => (
                                    <div key={order.id} style={{ border: '1px solid var(--border)', borderRadius: '10px', padding: '16px', background: order.status === 'IN_PROGRESS' ? 'var(--primary-light)' : 'var(--bg-body)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span style={{ fontWeight: 'bold', fontSize: '15px' }}>{order.orderNumber}</span>
                                            <span style={{ 
                                                fontSize: '11px', padding: '2px 8px', borderRadius: '12px',
                                                background: order.status === 'IN_PROGRESS' ? 'var(--primary)' : (order.status === 'COMPLETED' ? 'var(--success)' : 'var(--warning)'),
                                                color: '#fff'
                                            }}>
                                                {order.status === 'PLANNED' ? t('sys.str_1863') : order.status === 'IN_PROGRESS' ? t('sys.str_1864') : t('sys.str_1865')}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                                            {t('sys.str_1843')}<strong style={{color: 'var(--text)'}}>{order.recipe?.product?.name}</strong> <br/>
                                            {t('sys.str_1844')}<strong style={{color: 'var(--text)'}}>{order.quantity}</strong> 
                                        </div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <Settings size={14} /> {t('sys.str_1845')}{order.machine?.name}
                                        </div>

                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            {order.status === 'PLANNED' && (
                                                <button className="btn btn-primary btn-sm" style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '6px' }} onClick={() => updateOrderStatus(order.id, 'START')}>
                                                    <PlayCircle size={16} /> {t('sys.str_1846')}</button>
                                            )}
                                            {order.status === 'IN_PROGRESS' && (
                                                <button className="btn btn-success btn-sm" style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '6px' }} onClick={() => updateOrderStatus(order.id, 'COMPLETE')}>
                                                    <CheckCircle size={16} /> {t('sys.str_1847')}</button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {data.orders.length === 0 && <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>{t('sys.str_1848')}</div>}
                            </div>
                        </div>

                        {/* Machine Control Board */}
                        <div className="card" style={{ padding: '20px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {t('sys.str_1849')}</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr)', gap: '16px' }}>
                                {data.machines.map((machine: any) => (
                                    <div key={machine.id} style={{ padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ 
                                                width: '12px', height: '12px', borderRadius: '50%', 
                                                background: getMachineStatusColor(machine.status),
                                                boxShadow: `0 0 8px ${getMachineStatusColor(machine.status)}` 
                                            }} />
                                            <div>
                                                <div style={{ fontWeight: 'bold', fontSize: '15px' }}>{machine.name}</div>
                                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('sys.str_1850')}{machine.capacity} {t('sys.str_1851')}</div>
                                            </div>
                                        </div>
                                        {machine.status === 'MAINTENANCE' && <span title={t('sys.str_1799')}><Wrench size={20} color="var(--danger)" /></span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Modal */}
            {showOrderModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>{t('sys.str_1852')}</h2>
                            <button className="btn btn-ghost" onClick={() => setShowOrderModal(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleCreateOrder} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div className="input-group">
                                    <label className="input-label">{t('sys.str_1853')}</label>
                                    <select className="input" required value={formData.recipeId} onChange={e => setFormData({...formData, recipeId: e.target.value})}>
                                        <option value="">{t('sys.str_1854')}</option>
                                        {recipes.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label className="input-label">{t('sys.str_1855')}</label>
                                    <input className="input" type="number" required dir="ltr" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">{t('sys.str_1856')}</label>
                                    <select className="input" required value={formData.machineId} onChange={e => setFormData({...formData, machineId: e.target.value})}>
                                        <option value="">{t('sys.str_1857')}</option>
                                        {data.machines.map((m: any) => <option key={m.id} value={m.id}>{m.name} ({m.status})</option>)}
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label className="input-label">{t('sys.str_1858')}</label>
                                    <select className="input" required value={formData.stockId} onChange={e => setFormData({...formData, stockId: e.target.value})}>
                                        <option value="">{t('sys.str_1859')}</option>
                                        {warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
                                    </select>
                                </div>
                                <div style={{ display: 'flex', gap: '16px' }}>
                                    <div className="input-group" style={{ flex: 1 }}>
                                        <label className="input-label">{t('sys.str_1860')}</label>
                                        <input className="input" type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                                    </div>
                                    <div className="input-group" style={{ flex: 1 }}>
                                        <label className="input-label">{t('sys.str_432')}</label>
                                        <input className="input" type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                                    <button type="button" className="btn btn-ghost" onClick={() => setShowOrderModal(false)}>{t('fin.str_206')}</button>
                                    <button   type="submit" className="btn btn-primary" disabled={saving}>{t('sys.str_1861')}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
