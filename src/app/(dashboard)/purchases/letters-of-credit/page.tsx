'use client';

import React, { useState, useEffect } from 'react';
import DocumentUploader from '@/components/DocumentUploader';

export default function LettersOfCreditPage() {
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
        } catch (error) {
            console.error('Failed to fetch data', error);
        }
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
                alert('حدث خطأ في الحفظ');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('هل أنت متأكد من الحذف؟')) return;
        try {
            const token = localStorage.getItem('token') || '';
            const response = await fetch(`/api/purchases/letters-of-credit/${id}`, { 
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                fetchData();
            } else {
                alert('فشل الحذف. قد يكون الاعتماد مرتبطاً بعمليات أخرى.');
            }
        } catch (error) {
            console.error(error);
        }
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
                    <h1 className="page-title">🌍 الاعتمادات المستندية (LC)</h1>
                    <p className="page-description">إدارة خطابات الاعتماد والشحنات الخارجية (Foreign Purchases)</p>
                </div>
                <button onClick={openCreateModal} className="btn btn-primary">
                    ➕ فتح اعتماد جديد
                </button>
            </div>

            <div className="page-content animate-fade-in">
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>جاري التحميل...</div>
                ) : (
                    <div className="grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                        {lcs.map(lc => (
                            <div key={lc.id} className="card" style={{ padding: '20px', borderTop: `4px solid ${lc.status === 'active' ? 'var(--success)' : lc.status === 'draft' ? 'var(--warning)' : 'var(--text-muted)'}` }}>
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '1.2rem' }}>LC: {lc.lcNumber}</h3>
                                        <p style={{ margin: '5px 0 0', color: 'var(--text-muted)' }}>المورد: {lc.supplier?.name}</p>
                                    </div>
                                    <span className={`badge ${lc.status === 'active' ? 'badge-success' : lc.status === 'draft' ? 'badge-warning' : ''}`}>
                                        {lc.status === 'active' ? 'نشط' : lc.status === 'draft' ? 'مسودة' : lc.status === 'completed' ? 'مكتمل' : 'ملغي'}
                                    </span>
                                </div>
                                
                                <div style={{ background: 'var(--bg-lighter)', padding: '15px', borderRadius: '8px', marginBottom: '15px', fontSize: '14px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>البنك:</span>
                                        <strong>{lc.bank?.bankName} ({lc.bank?.accountName})</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>المبلغ:</span>
                                        <strong style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>{lc.amount.toLocaleString()} {lc.currency?.code}</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>تاريخ الانتهاء:</span>
                                        <strong style={{ color: 'var(--danger)' }}>{new Date(lc.expiryDate).toLocaleDateString()}</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>الهامش (%):</span>
                                        <strong>{lc.marginPercent}% (دُفع {lc.marginPaid})</strong>
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
                                        تعديل
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(lc.id)}
                                        className="btn btn-danger"
                                    >
                                        حذف
                                    </button>
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
                            <div className="modal-title">{editingId ? 'تعديل اعتماد مستندي' : 'فتح اعتماد مستندي جديد'}</div>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSave} style={{ padding: '20px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)', gap: '15px' }}>
                                <div className="input-group">
                                    <label className="input-label">رقم الاعتماد المستندي *</label>
                                    <input type="text" className="input" value={formData.lcNumber} onChange={e => setFormData({...formData, lcNumber: e.target.value})} required />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">المورد المستفيد *</label>
                                    <select className="input" value={formData.supplierId} onChange={e => setFormData({...formData, supplierId: e.target.value})} required>
                                        <option value="">اختر المورد...</option>
                                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label className="input-label">البنك فاتح الاعتماد *</label>
                                    <select className="input" value={formData.bankId} onChange={e => setFormData({...formData, bankId: e.target.value})} required>
                                        <option value="">اختر البنك...</option>
                                        {banks.map(b => <option key={b.id} value={b.id}>{b.bankName} - {b.accountName}</option>)}
                                    </select>
                                </div>

                                <div className="input-group">
                                    <label className="input-label">المبلغ *</label>
                                    <input type="number" step="0.01" className="input" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} required />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">عملة الاعتماد *</label>
                                    <select className="input" value={formData.currencyId} onChange={e => setFormData({...formData, currencyId: e.target.value})} required>
                                        <option value="">اختر العملة...</option>
                                        {currencies.map(c => <option key={c.id} value={c.id}>{c.code} - {c.nameAr}</option>)}
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label className="input-label">سعر الصرف الداخلي *</label>
                                    <input type="number" step="0.000001" className="input" value={formData.exchangeRate} onChange={e => setFormData({...formData, exchangeRate: e.target.value})} required />
                                </div>

                                <div className="input-group">
                                    <label className="input-label">تاريخ الفتح *</label>
                                    <input type="date" className="input" value={formData.openDate} onChange={e => setFormData({...formData, openDate: e.target.value})} required />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">تاريخ الانتهاء *</label>
                                    <input type="date" className="input" value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} required />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">حالة الاعتماد</label>
                                    <select className="input" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                                        <option value="draft">مسودة</option>
                                        <option value="active">نشط / مفتوح</option>
                                        <option value="completed">مكتمل</option>
                                        <option value="cancelled">ملغي</option>
                                    </select>
                                </div>

                                <div className="input-group">
                                    <label className="input-label">نسبة الغطاء (% التأمين)</label>
                                    <input type="number" step="0.01" className="input" value={formData.marginPercent} onChange={e => setFormData({...formData, marginPercent: e.target.value})} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">المبلغ المسدد مسبقاً</label>
                                    <input type="number" step="0.01" className="input" value={formData.marginPaid} onChange={e => setFormData({...formData, marginPaid: e.target.value})} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">ميناء الشحن والتفريغ</label>
                                    <input type="text" className="input" placeholder="Loading -> Discharge" value={formData.portOfLoading} onChange={e => setFormData({...formData, portOfLoading: e.target.value})} />
                                </div>
                            </div>

                            <div className="input-group" style={{ marginTop: '15px' }}>
                                <label className="input-label">ملاحظات إضافية</label>
                                <textarea className="input" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} rows={2}></textarea>
                            </div>

                            <div className="modal-footer" style={{ marginTop: '20px' }}>
                                <button type="submit" className="btn btn-primary">💾 حفظ الاعتماد المستندي</button>
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost">إلغاء</button>
                            </div>
                        </form>

                        {/* Document Archiving - Only show when editing an existing LC */}
                        {editingId && (
                            <div style={{ padding: '0 20px 20px' }}>
                                <DocumentUploader documentType="LETTER_OF_CREDIT" documentId={editingId} title="مرفقات الاعتماد (Swift, B/L, etc.)" />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
