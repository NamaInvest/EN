'use client';

import React, { useState, useEffect } from 'react';
import DocumentUploader from '@/components/DocumentUploader';
import { useTranslation } from "@/lib/i18n";
import { useToast } from '@/components/Toast';

export default function LettersOfCreditPage() {
    const { t } = useTranslation();
    const { error: toastError, success: toastSuccess } = useToast();
    const [lcs, setLcs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [banks, setBanks] = useState<any[]>([]);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [currencies, setCurrencies] = useState<any[]>([]);

    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        lcNumber: '', bankId: '', supplierId: '', amount: '', currencyId: '',
        exchangeRate: '1', openDate: new Date().toISOString().split('T')[0],
        expiryDate: '', status: 'draft', marginPercent: '0', marginPaid: '0',
        portOfLoading: '', portOfDischarge: '', notes: ''
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token') || '';
            const opts = { headers: { Authorization: `Bearer ${token}` } };
            
            const [lcsRes, banksRes, suppliersRes, currenciesRes] = await Promise.all([
                fetch('/api/purchases/letters-of-credit', opts),
                fetch('/api/banks', opts),
                fetch('/api/customers?type=supplier', opts),
                fetch('/api/settings/currencies', opts)
            ]);
            
            if(lcsRes.ok) setLcs(await lcsRes.json());
            if(banksRes.ok) setBanks((await banksRes.json()).filter((b: any) => b.isActive !== false));
            if(suppliersRes.ok) setSuppliers((await suppliersRes.json()).filter((s:any) => s.type === 'supplier'));
            if(currenciesRes.ok) setCurrencies(await currenciesRes.json());
        } catch (error: any) { toastError(error?.message || 'حدث خطأ'); }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token') || '';
            const method = editingId ? 'PUT' : 'POST';
            const url = editingId ? `/api/purchases/letters-of-credit/${editingId}` : '/api/purchases/letters-of-credit';
            
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                setShowModal(false);
                fetchData();
            } else {
                alert(t('purchases.str_2293'));
            }
        } catch (error: any) { toastError(error?.message || 'حدث خطأ'); }
    };

    const handleDelete = async (id: number) => {
        if (!confirm(t('sys.str_541'))) return;
        try {
            const token = localStorage.getItem('token') || '';
            const response = await fetch(`/api/purchases/letters-of-credit/${id}`, { 
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                fetchData();
            } else {
                alert(t('purchases.str_2294'));
            }
        } catch (error: any) { toastError(error?.message || 'حدث خطأ'); }
    };

    const openCreateModal = () => {
        setEditingId(null);
        setFormData({
            lcNumber: '', bankId: '', supplierId: '', amount: '', currencyId: '',
            exchangeRate: '1', openDate: new Date().toISOString().split('T')[0],
            expiryDate: '', status: 'draft', marginPercent: '0', marginPaid: '0',
            portOfLoading: '', portOfDischarge: '', notes: ''
        });
        setShowModal(true);
    };

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">{t('purchases.str_2268')}</h1>
                    <p className="page-description">{t('purchases.str_2269')}</p>
                </div>
                <button onClick={openCreateModal} className="btn btn-primary">
                    {t('purchases.str_2270')}</button>
            </div>

            <div className="page-content animate-fade-in">
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>{t('sys.str_168')}</div>
                ) : (
                    <div className="grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                        {lcs.map(lc => (
                            <div key={lc.id} className="card" style={{ padding: '20px', borderTop: `4px solid ${lc.status === 'active' ? 'var(--success)' : lc.status === 'draft' ? 'var(--warning)' : 'var(--text-muted)'}` }}>
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '1.2rem' }}>LC: {lc.lcNumber}</h3>
                                        <p style={{ margin: '5px 0 0', color: 'var(--text-muted)' }}>{t('purchases.str_2271')}{lc.supplier?.name}</p>
                                    </div>
                                    <span className={`badge ${lc.status === 'active' ? 'badge-success' : lc.status === 'draft' ? 'badge-warning' : ''}`}>
                                        {lc.status === 'active' ? t('sys.str_180') : lc.status === 'draft' ? t('purchases.str_2285') : lc.status === 'completed' ? t('sys.str_1865') : t('purchases.str_2287')}
                                    </span>
                                </div>
                                
                                <div style={{ background: 'var(--bg-lighter)', padding: '15px', borderRadius: '8px', marginBottom: '15px', fontSize: '14px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>{t('purchases.str_2272')}</span>
                                        <strong>{lc.bank?.bankName} ({lc.bank?.accountName})</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>{t('purchases.str_2273')}</span>
                                        <strong style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>{lc.amount.toLocaleString()} {lc.currency?.code}</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>{t('sys.str_42')}</span>
                                        <strong style={{ color: 'var(--danger)' }}>{new Date(lc.expiryDate).toLocaleDateString('en-GB')}</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>{t('purchases.str_2274')}</span>
                                        <strong>{lc.marginPercent}{t('purchases.str_2275')}{lc.marginPaid})</strong>
                                    </div>
                                </div>
                                
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button 
                                        onClick={() => {
                                            setEditingId(lc.id);
                                            setFormData({
                                                lcNumber: lc.lcNumber, bankId: lc.bankId.toString(), supplierId: lc.supplierId.toString(),
                                                amount: lc.amount.toString(), currencyId: lc.currencyId.toString(),
                                                exchangeRate: lc.exchangeRate.toString(), openDate: new Date(lc.openDate).toISOString().split('T')[0],
                                                expiryDate: new Date(lc.expiryDate).toISOString().split('T')[0], status: lc.status,
                                                marginPercent: lc.marginPercent.toString(), marginPaid: lc.marginPaid.toString(),
                                                portOfLoading: lc.portOfLoading || '', portOfDischarge: lc.portOfDischarge || '', notes: lc.notes || ''
                                            });
                                            setShowModal(true);
                                        }}
                                        className="btn btn-outline" style={{ flex: 1 }}
                                    >
                                        {t('sys.str_393')}</button>
                                    <button 
                                        onClick={() => handleDelete(lc.id)}
                                        className="btn btn-danger"
                                    >
                                        {t('sys.str_394')}</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" style={{ maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-title">{editingId ? t('purchases.str_2295') : t('purchases.str_2296')}</div>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSave} style={{ padding: '20px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)', gap: '15px' }}>
                                <div className="input-group">
                                    <label className="input-label">{t('purchases.str_2276')}</label>
                                    <input type="text" className="input" value={formData.lcNumber} onChange={e => setFormData({...formData, lcNumber: e.target.value})} required />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">{t('purchases.str_2277')}</label>
                                    <select className="input" value={formData.supplierId} onChange={e => setFormData({...formData, supplierId: e.target.value})} required>
                                        <option value="">{t('sys.str_954')}</option>
                                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label className="input-label">{t('purchases.str_2278')}</label>
                                    <select className="input" value={formData.bankId} onChange={e => setFormData({...formData, bankId: e.target.value})} required>
                                        <option value="">{t('sys.str_1816')}</option>
                                        {banks.map(b => <option key={b.id} value={b.id}>{b.bankName} - {b.accountName}</option>)}
                                    </select>
                                </div>

                                <div className="input-group">
                                    <label className="input-label">{t('sys.str_577')}</label>
                                    <input type="number" step="0.01" className="input" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} required />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">{t('purchases.str_2279')}</label>
                                    <select className="input" value={formData.currencyId} onChange={e => setFormData({...formData, currencyId: e.target.value})} required>
                                        <option value="">{t('purchases.str_2280')}</option>
                                        {currencies.map(c => <option key={c.id} value={c.id}>{c.code} - {c.nameAr}</option>)}
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label className="input-label">{t('purchases.str_2281')}</label>
                                    <input type="number" step="0.000001" className="input" value={formData.exchangeRate} onChange={e => setFormData({...formData, exchangeRate: e.target.value})} required />
                                </div>

                                <div className="input-group">
                                    <label className="input-label">{t('purchases.str_2282')}</label>
                                    <input type="date" className="input" value={formData.openDate} onChange={e => setFormData({...formData, openDate: e.target.value})} required />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">{t('purchases.str_2283')}</label>
                                    <input type="date" className="input" value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} required />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">{t('purchases.str_2284')}</label>
                                    <select className="input" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                                        <option value="draft">{t('purchases.str_2285')}</option>
                                        <option value="active">{t('purchases.str_2286')}</option>
                                        <option value="completed">{t('sys.str_1865')}</option>
                                        <option value="cancelled">{t('purchases.str_2287')}</option>
                                    </select>
                                </div>

                                <div className="input-group">
                                    <label className="input-label">{t('purchases.str_2288')}</label>
                                    <input type="number" step="0.01" className="input" value={formData.marginPercent} onChange={e => setFormData({...formData, marginPercent: e.target.value})} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">{t('purchases.str_2289')}</label>
                                    <input type="number" step="0.01" className="input" value={formData.marginPaid} onChange={e => setFormData({...formData, marginPaid: e.target.value})} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">{t('purchases.str_2290')}</label>
                                    <input type="text" className="input" placeholder="Loading -> Discharge" value={formData.portOfLoading} onChange={e => setFormData({...formData, portOfLoading: e.target.value})} />
                                </div>
                            </div>

                            <div className="input-group" style={{ marginTop: '15px' }}>
                                <label className="input-label">{t('purchases.str_2291')}</label>
                                <textarea className="input" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} rows={2}></textarea>
                            </div>

                            <div className="modal-footer" style={{ marginTop: '20px' }}>
                                <button   type="submit" className="btn btn-primary">{t('purchases.str_2292')}</button>
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost">{t('fin.str_206')}</button>
                            </div>
                        </form>

                        {/* Document Archiving - Only show when editing an existing LC */}
                        {editingId && (
                            <div style={{ padding: '0 20px 20px' }}>
                                <DocumentUploader documentType="LETTER_OF_CREDIT" documentId={editingId} title={t('purchases.str_2297')} />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
