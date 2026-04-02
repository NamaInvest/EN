'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { 
    Scale, ShieldAlert, FileText, Landmark, Search, 
    AlertTriangle, CheckCircle, Clock, Plus
} from 'lucide-react';

export default function EnterpriseLegal() {
    const { t } = useTranslation();
    const [data, setData] = useState({ notes: [], lgs: [] });
    const [customers, setCustomers] = useState<any[]>([]);
    const [banks, setBanks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState<'notes' | 'lgs'>('notes');

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState<any>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => { fetchData(); }, [activeTab, search]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/enterprise/legal?type=${activeTab}&search=${search}`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) {
                const fetchedData = await res.json();
                setData(prev => ({ ...prev, ...fetchedData }));
            }
            
            // Lookups
            const custRes = await fetch(`/api/customers`, { headers: { Authorization: `Bearer ${token}` } });
            if (custRes.ok) setCustomers(await custRes.json());
            
            const reqBanks = await fetch(`/api/banks`, { headers: { Authorization: `Bearer ${token}` } });
            if (reqBanks.ok) setBanks(await reqBanks.json());

        } catch (error) { console.error(error); } 
        finally { setLoading(false); }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/enterprise/legal', {
                method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ ...formData, entityType: activeTab === 'notes' ? 'note' : 'lg' })
            });

            if (res.ok) { setShowModal(false); fetchData(); } 
            else { alert(t('sys.str_418')); }
        } catch (error) { alert(t('sys.str_446')); } 
        finally { setSaving(false); }
    };

    const collectNote = async (id: number) => {
        if (!confirm(t('sys.str_1822'))) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/enterprise/legal', {
                method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ id, entityType: 'note', status: 'COLLECTED' })
            });
            if (res.ok) fetchData();
            else alert(t('sys.str_1823'));
        } catch (error) { alert(t('sys.str_446')); }
    };

    const isDueSoon = (dateStr: string) => {
        const diff = new Date(dateStr).getTime() - new Date().getTime();
        return diff < 30 * 24 * 60 * 60 * 1000; // less than 30 days
    };

    return (
        <div style={{ padding: '24px', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Scale size={28} color="var(--primary)" />
                        {t('sys.str_1802')}</h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '14px' }}>
                        {t('sys.str_1803')}</p>
                </div>
                <button 
                    className="btn btn-primary"
                    onClick={() => {
                        setFormData({});
                        setShowModal(true);
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <Plus size={20} />
                    {activeTab === 'notes' ? 'تسجيل سند لأمر' : 'إصدار خطاب ضمان'}
                </button>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                <button 
                    className={`btn ${activeTab === 'notes' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setActiveTab('notes')} style={{ borderRadius: '20px' }}>
                    <FileText size={18} style={{ marginLeft: '6px' }} /> {t('sys.str_1804')}</button>
                <button 
                    className={`btn ${activeTab === 'lgs' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setActiveTab('lgs')} style={{ borderRadius: '20px' }}>
                    <Landmark size={18} style={{ marginLeft: '6px' }} /> {t('sys.str_1805')}</button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>{t('sys.str_168')}</div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                    {activeTab === 'notes' && data.notes.map((note: any) => (
                        <div key={note.id} className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', borderRight: isDueSoon(note.dueDate) && note.status === 'PENDING' ? '4px solid var(--danger)' : '4px solid var(--border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{note.noteNumber}</div>
                                {note.status === 'PENDING' ? <Clock size={18} color="var(--warning)" /> : 
                                 note.status === 'CLEARED' ? <CheckCircle size={18} color="var(--success)" /> : 
                                 <ShieldAlert size={18} color="var(--danger)" />}
                            </div>
                            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '6px' }}>{note.customer?.name}</h3>
                            <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--primary)', marginBottom: '16px' }}>
                                {note.amount.toFixed(2)} SAR
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', background: 'var(--bg-body)', padding: '10px', borderRadius: '8px', marginBottom: '12px' }}>
                                <span>{t('sys.str_1806')}{new Date(note.dueDate).toLocaleDateString()}</span>
                                <span style={{ color: isDueSoon(note.dueDate) && note.status === 'PENDING' ? 'var(--danger)' : 'inherit' }}>
                                    {isDueSoon(note.dueDate) && note.status === 'PENDING' ? '⚠️ يستحق قريباً' : (note.status === 'PENDING' ? 'مجدول' : 'مُحصّل')}
                                </span>
                            </div>
                            {note.status === 'PENDING' && (
                                <button className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start', fontSize: '12px', display: 'flex', gap: '6px' }} onClick={() => collectNote(note.id)}>
                                    <CheckCircle size={14} /> {t('sys.str_1807')}</button>
                            )}
                        </div>
                    ))}

                    {activeTab === 'lgs' && data.lgs.map((lg: any) => (
                        <div key={lg.id} className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', borderRight: isDueSoon(lg.expiryDate) && lg.status === 'ACTIVE' ? '4px solid var(--danger)' : '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>LG: {lg.lgNumber}</div>
                                <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '11px', background: 'var(--primary-light)', color: 'var(--primary)' }}>
                                    {lg.type === 'ADVANCE_PAYMENT' ? 'دفعة مقدمة' : 'ضمان أداء'}
                                </span>
                            </div>
                            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '6px' }}>{lg.bank?.name}</h3>
                            <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--text-muted)', marginBottom: '16px' }}>
                                {lg.amount.toFixed(2)} {lg.bank?.currency || 'SAR'}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', background: 'var(--bg-body)', padding: '10px', borderRadius: '8px' }}>
                                <span>{t('sys.str_1808')}{new Date(lg.expiryDate).toLocaleDateString()}</span>
                                <span style={{ color: lg.status === 'ACTIVE' ? 'var(--success)' : 'var(--danger)' }}>
                                    {lg.status === 'ACTIVE' ? 'فعّال' : 'منتهي الصلاحية'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>
                                {activeTab === 'notes' ? 'تسجيل كمبيالة (سند لأمر) جديدة' : 'إصدار خطاب ضمان جديد'}
                            </h2>
                            <button className="btn btn-ghost" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleSave} className="grid-2">
                                {activeTab === 'notes' ? (
                                    <>
                                        <div className="input-group">
                                            <label className="input-label">{t('sys.str_1045')}</label>
                                            <input className="input" required value={formData.noteNumber || ''} onChange={e => setFormData({...formData, noteNumber: e.target.value})} />
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label">{t('sys.str_1809')}</label>
                                            <input className="input" type="number" required dir="ltr" value={formData.amount || ''} onChange={e => setFormData({...formData, amount: e.target.value})} />
                                        </div>
                                        <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                                            <label className="input-label">{t('sys.str_1810')}</label>
                                            <select className="input" required value={formData.customerId || ''} onChange={e => setFormData({...formData, customerId: e.target.value})}>
                                                <option value="">{t('sys.str_1811')}</option>
                                                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                                            <label className="input-label">{t('sys.str_1812')}</label>
                                            <input className="input" type="date" required value={formData.dueDate || ''} onChange={e => setFormData({...formData, dueDate: e.target.value})} />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="input-group">
                                            <label className="input-label">{t('sys.str_1813')}</label>
                                            <input className="input" required value={formData.lgNumber || ''} onChange={e => setFormData({...formData, lgNumber: e.target.value})} />
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label">{t('sys.str_1814')}</label>
                                            <input className="input" type="number" required dir="ltr" value={formData.amount || ''} onChange={e => setFormData({...formData, amount: e.target.value})} />
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label">{t('sys.str_1815')}</label>
                                            <select className="input" required value={formData.bankId || ''} onChange={e => setFormData({...formData, bankId: e.target.value})}>
                                                <option value="">{t('sys.str_1816')}</option>
                                                {banks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label">{t('sys.str_1817')}</label>
                                            <select className="input" required value={formData.type || ''} onChange={e => setFormData({...formData, type: e.target.value})}>
                                                <option value="PERFORMANCE">{t('sys.str_1818')}</option>
                                                <option value="ADVANCE_PAYMENT">{t('sys.str_1819')}</option>
                                            </select>
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label">{t('sys.str_643')}</label>
                                            <input className="input" type="date" required value={formData.issueDate || ''} onChange={e => setFormData({...formData, issueDate: e.target.value})} />
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label">{t('sys.str_1820')}</label>
                                            <input className="input" type="date" required value={formData.expiryDate || ''} onChange={e => setFormData({...formData, expiryDate: e.target.value})} />
                                        </div>
                                    </>
                                )}
                                
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px', gridColumn: '1 / -1' }}>
                                    <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>{t('fin.str_206')}</button>
                                    <button type="submit" className="btn btn-primary" disabled={saving}>{t('sys.str_1821')}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
