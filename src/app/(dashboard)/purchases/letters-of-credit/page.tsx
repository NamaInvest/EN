'use client';

import React, { useState, useEffect } from 'react';
import DocumentUploader from '@/components/DocumentUploader';
import { useTranslation } from "@/lib/i18n";
import { useToast } from '@/components/Toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const formSchema = z.object({
  lcNumber: z.string().min(1, 'LC Number is required'),
  supplierId: z.string().min(1, 'Supplier is required'),
  bankId: z.string().min(1, 'Bank is required'),
  amount: z.number().min(0.01, 'Amount must be positive'),
  currencyId: z.string().min(1, 'Currency is required'),
  exchangeRate: z.number().min(0.000001, 'Invalid exchange rate'),
  openDate: z.string().min(1, 'Open Date is required'),
  expiryDate: z.string().min(1, 'Expiry Date is required'),
  status: z.string(),
  marginPercent: z.number().min(0).max(100),
  marginPaid: z.number().min(0),
  portOfLoading: z.string().optional().nullable(),
  portOfDischarge: z.string().optional().nullable(),
  notes: z.string().optional().nullable()
});

type FormValues = z.infer<typeof formSchema>;

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

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      lcNumber: '',
      supplierId: '',
      bankId: '',
      amount: 0,
      currencyId: '',
      exchangeRate: 1,
      openDate: new Date().toISOString().split('T')[0],
      expiryDate: '',
      status: 'draft',
      marginPercent: 0,
      marginPaid: 0,
      portOfLoading: '',
      portOfDischarge: '',
      notes: ''
    }
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || '';
      const opts = { headers: { Authorization: `Bearer ${token}` } };
      
      const [lcsRes, banksRes, suppliersRes, currenciesRes] = await Promise.all([
        fetch('/api/purchases/letters-of-credit', opts),
        fetch('/api/banks', opts),
        fetch('/api/customers?type=1', opts),
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

  const handleSave = async (data: FormValues) => {
    try {
      const token = localStorage.getItem('token') || '';
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `/api/purchases/letters-of-credit/${editingId}` : '/api/purchases/letters-of-credit';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        setShowModal(false);
        toastSuccess('تم الحفظ بنجاح');
        fetchData();
      } else {
        toastError(t('purchases.str_2293'));
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
        toastSuccess('تم الحذف بنجاح');
        fetchData();
      } else {
        toastError(t('purchases.str_2294'));
      }
    } catch (error: any) { toastError(error?.message || 'حدث خطأ'); }
  };

  const openCreateModal = () => {
    setEditingId(null);
    reset({
      lcNumber: '', supplierId: '', bankId: '', amount: 0, currencyId: '',
      exchangeRate: 1, openDate: new Date().toISOString().split('T')[0],
      expiryDate: '', status: 'draft', marginPercent: 0, marginPaid: 0,
      portOfLoading: '', portOfDischarge: '', notes: ''
    });
    setShowModal(true);
  };

  const closeAndReset = () => {
    setShowModal(false);
    reset();
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('purchases.str_2268')}</h1>
          <p className="page-description">{t('purchases.str_2269')}</p>
        </div>
        <button onClick={openCreateModal} className="btn btn-primary">
          {t('purchases.str_2270')}
        </button>
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
                    <p style={{ margin: '5px 0 0', color: 'var(--text-muted)' }}>{t('purchases.str_2271')} {lc.supplier?.name}</p>
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
                    <strong>{lc.marginPercent}% ({t('purchases.str_2275')} {lc.marginPaid})</strong>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    onClick={() => {
                      setEditingId(lc.id);
                      reset({
                        lcNumber: lc.lcNumber, bankId: lc.bankId.toString(), supplierId: lc.supplierId.toString(),
                        amount: lc.amount, currencyId: lc.currencyId.toString(),
                        exchangeRate: lc.exchangeRate, openDate: new Date(lc.openDate).toISOString().split('T')[0],
                        expiryDate: new Date(lc.expiryDate).toISOString().split('T')[0], status: lc.status,
                        marginPercent: lc.marginPercent, marginPaid: lc.marginPaid,
                        portOfLoading: lc.portOfLoading || '', portOfDischarge: lc.portOfDischarge || '', notes: lc.notes || ''
                      });
                      setShowModal(true);
                    }}
                    className="btn btn-outline" style={{ flex: 1 }}
                  >
                    {t('sys.str_393')}
                  </button>
                  <button 
                    onClick={() => handleDelete(lc.id)}
                    className="btn btn-danger"
                  >
                    {t('sys.str_394')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeAndReset}>
          <div className="modal" style={{ maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{editingId ? t('purchases.str_2295') : t('purchases.str_2296')}</div>
              <button className="modal-close" onClick={closeAndReset}>✕</button>
            </div>
            <form onSubmit={handleSubmit(handleSave)} style={{ padding: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)', gap: '15px' }}>
                <div className="input-group">
                  <label className="input-label">{t('purchases.str_2276')}</label>
                  <input type="text" className="input" {...register('lcNumber')} />
                  {errors.lcNumber && <p style={{color: '#ef4444', fontSize: '12px', margin: 0}}>{errors.lcNumber.message}</p>}
                </div>
                <div className="input-group">
                  <label className="input-label">{t('purchases.str_2277')}</label>
                  <select className="input" {...register('supplierId')}>
                    <option value="">{t('sys.str_954')}</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  {errors.supplierId && <p style={{color: '#ef4444', fontSize: '12px', margin: 0}}>{errors.supplierId.message}</p>}
                </div>
                <div className="input-group">
                  <label className="input-label">{t('purchases.str_2278')}</label>
                  <select className="input" {...register('bankId')}>
                    <option value="">{t('sys.str_1816')}</option>
                    {banks.map(b => <option key={b.id} value={b.id}>{b.bankName} - {b.accountName}</option>)}
                  </select>
                  {errors.bankId && <p style={{color: '#ef4444', fontSize: '12px', margin: 0}}>{errors.bankId.message}</p>}
                </div>

                <div className="input-group">
                  <label className="input-label">{t('sys.str_577')}</label>
                  <input type="number" step="0.01" className="input" {...register('amount')} />
                  {errors.amount && <p style={{color: '#ef4444', fontSize: '12px', margin: 0}}>{errors.amount.message}</p>}
                </div>
                <div className="input-group">
                  <label className="input-label">{t('purchases.str_2279')}</label>
                  <select className="input" {...register('currencyId')}>
                    <option value="">{t('purchases.str_2280')}</option>
                    {currencies.map(c => <option key={c.id} value={c.id}>{c.code} - {c.nameAr}</option>)}
                  </select>
                  {errors.currencyId && <p style={{color: '#ef4444', fontSize: '12px', margin: 0}}>{errors.currencyId.message}</p>}
                </div>
                <div className="input-group">
                  <label className="input-label">{t('purchases.str_2281')}</label>
                  <input type="number" step="0.000001" className="input" {...register('exchangeRate')} />
                  {errors.exchangeRate && <p style={{color: '#ef4444', fontSize: '12px', margin: 0}}>{errors.exchangeRate.message}</p>}
                </div>

                <div className="input-group">
                  <label className="input-label">{t('purchases.str_2282')}</label>
                  <input type="date" className="input" {...register('openDate')} />
                  {errors.openDate && <p style={{color: '#ef4444', fontSize: '12px', margin: 0}}>{errors.openDate.message}</p>}
                </div>
                <div className="input-group">
                  <label className="input-label">{t('purchases.str_2283')}</label>
                  <input type="date" className="input" {...register('expiryDate')} />
                  {errors.expiryDate && <p style={{color: '#ef4444', fontSize: '12px', margin: 0}}>{errors.expiryDate.message}</p>}
                </div>
                <div className="input-group">
                  <label className="input-label">{t('purchases.str_2284')}</label>
                  <select className="input" {...register('status')}>
                    <option value="draft">{t('purchases.str_2285')}</option>
                    <option value="active">{t('purchases.str_2286')}</option>
                    <option value="completed">{t('sys.str_1865')}</option>
                    <option value="cancelled">{t('purchases.str_2287')}</option>
                  </select>
                  {errors.status && <p style={{color: '#ef4444', fontSize: '12px', margin: 0}}>{errors.status.message}</p>}
                </div>

                <div className="input-group">
                  <label className="input-label">{t('purchases.str_2288')}</label>
                  <input type="number" step="0.01" className="input" {...register('marginPercent')} />
                  {errors.marginPercent && <p style={{color: '#ef4444', fontSize: '12px', margin: 0}}>{errors.marginPercent.message}</p>}
                </div>
                <div className="input-group">
                  <label className="input-label">{t('purchases.str_2289')}</label>
                  <input type="number" step="0.01" className="input" {...register('marginPaid')} />
                  {errors.marginPaid && <p style={{color: '#ef4444', fontSize: '12px', margin: 0}}>{errors.marginPaid.message}</p>}
                </div>
                <div className="input-group">
                  <label className="input-label">{t('purchases.str_2290')}</label>
                  <input type="text" className="input" placeholder="Loading -> Discharge" {...register('portOfLoading')} />
                </div>
              </div>

              <div className="input-group" style={{ marginTop: '15px' }}>
                <label className="input-label">{t('purchases.str_2291')}</label>
                <textarea className="input" {...register('notes')} rows={2}></textarea>
              </div>

              <div className="modal-footer" style={{ marginTop: '20px' }}>
                <button type="submit" className="btn btn-primary">{t('purchases.str_2292')}</button>
                <button type="button" onClick={closeAndReset} className="btn btn-ghost">{t('fin.str_206')}</button>
              </div>
            </form>

            {/* Document Archiving - Only show when editing an existing LC */}
            {editingId && (
              <div style={{ padding: '0 20px 20px' }}>
                <DocumentUploader documentType="LETTER_OF_CREDIT" documentId={editingId.toString()} title={t('purchases.str_2297')} />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
