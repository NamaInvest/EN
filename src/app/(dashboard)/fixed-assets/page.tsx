'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from "@/lib/i18n";
import { useToast } from '@/components/Toast';
import { z } from 'zod';
import { Form, FormField, FormSelect } from '@/components/forms';

interface DepreciationRecord { id: number; depreciationDate: string; amount: number; }
interface FixedAssetItem { id: number; assetName: string; assetType: string; purchaseDate: string; purchaseCost: number; salvageValue: number; usefulLifeYears: number; currentValue: number; location: string | null; status: string; depreciations: DepreciationRecord[]; }

const ASSET_TYPES = [
  { value: 'equipment', label: 'sys.str_4232' },
  { value: 'vehicle', label: 'sys.str_4233' },
  { value: 'furniture', label: 'sys.str_4234' },
  { value: 'computer', label: 'sys.str_4235' },
  { value: 'building', label: 'sys.str_4236' },
  { value: 'land', label: 'sys.str_4237' },
  { value: 'other', label: 'sys.str_4238' },
];

const assetSchema = z.object({
  assetName: z.string().min(2, 'الاسم مطلوب'),
  assetType: z.string().min(1, 'النوع مطلوب'),
  purchaseDate: z.string().min(1, 'التاريخ مطلوب'),
  purchaseCost: z.number().min(0.01, 'التكلفة يجب أن تكون أكبر من صفر'),
  salvageValue: z.number().min(0, 'القيمة التخريدية لا يمكن أن تكون سالبة').default(0),
  usefulLifeYears: z.number().min(1, 'العمر الافتراضي يجب أن يكون سنة أو أكثر').default(1),
  location: z.string().optional()
});

type AssetFormValues = z.infer<typeof assetSchema>;

export default function FixedAssetsPage() {
  const { t } = useTranslation();
  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast();
  const [assets, setAssets] = useState<FixedAssetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<FixedAssetItem | null>(null);
  const [showDepModal, setShowDepModal] = useState<FixedAssetItem | null>(null);
  const [saving, setSaving] = useState(false);

  const token = () => localStorage.getItem('token') || '';
  const headers = () => ({ Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' });

  async function fetchData() {
    try {
      const res = await fetch('/api/fixed-assets', { headers: headers() });
      if (res.ok) setAssets(await res.json());
    } catch (e: any) { toastError(e?.message || 'حدث خطأ'); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchData(); }, []);

  const openAdd = () => {
    setEditItem(null);
    setShowModal(true);
  };
  
  const openEdit = (a: FixedAssetItem) => {
    setEditItem(a);
    setShowModal(true);
  };

  const handleSave = async (data: AssetFormValues) => {
    setSaving(true);
    try {
      const url = editItem ? `/api/fixed-assets/${editItem.id}` : '/api/fixed-assets';
      const method = editItem ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: headers(), body: JSON.stringify(data) });
      if (res.ok) { 
        setShowModal(false); 
        toastSuccess('تم الحفظ بنجاح');
        fetchData(); 
      } else { 
        const d = await res.json(); 
        toastError(d.error || 'حدث خطأ أثناء الحفظ'); 
      }
    } catch { toastWarning(t('sys.str_4240')); } 
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('sys.str_4241'))) return;
    const res = await fetch(`/api/fixed-assets/${id}`, { method: 'DELETE', headers: headers() });
    if (res.ok) {
        toastSuccess('تم الحذف بنجاح');
        fetchData(); 
    } else { const d = await res.json(); toastError(d.error); }
  };

  const handleDepreciate = async (id: number) => {
    if (!confirm(t('sys.str_4242'))) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/fixed-assets/${id}/depreciate`, { method: 'POST', headers: headers() });
      if (res.ok) { fetchData(); setShowDepModal(null); toastSuccess(t('sys.str_4243')); }
      else { const d = await res.json(); toastError(d.error); }
    } catch { toastWarning(t('sys.str_4244')); } finally { setSaving(false); }
  };

  const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const typeLabel = (assetType: string) => t(ASSET_TYPES.find(x => x.value === assetType)?.label || assetType);
  const statusLabels: Record<string, { label: string; cls: string }> = {
    active: { label: t('sys.str_4245'), cls: 'badge-success' },
    disposed: { label: t('sys.str_4246'), cls: 'badge-error' },
    fully_depreciated: { label: t('sys.str_4247'), cls: 'badge-warning' },
  };

  const defaultValues: Partial<AssetFormValues> = editItem ? {
    assetName: editItem.assetName,
    assetType: editItem.assetType,
    purchaseDate: editItem.purchaseDate.split('T')[0],
    purchaseCost: editItem.purchaseCost,
    salvageValue: editItem.salvageValue,
    usefulLifeYears: editItem.usefulLifeYears,
    location: editItem.location || ''
  } : {
    assetName: '', assetType: 'equipment', purchaseDate: new Date().toISOString().split('T')[0], purchaseCost: 0, salvageValue: 0, usefulLifeYears: 5, location: ''
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>{t('sys.str_4204')}</h1>
        <button className="btn btn-primary" onClick={openAdd}>{t('sys.str_4205')}</button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t('sys.str_4206')}</div>
          <div style={{ fontSize: '22px', fontWeight: '700', color: 'var(--primary-color)' }}>{fmt(assets.reduce((s, a) => s + a.purchaseCost, 0))} {t('sys.str_4105')}</div>
        </div>
        <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t('sys.str_4207')}</div>
          <div style={{ fontSize: '22px', fontWeight: '700', color: '#10b981' }}>{fmt(assets.reduce((s, a) => s + a.currentValue, 0))} {t('sys.str_4105')}</div>
        </div>
        <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t('sys.str_4208')}</div>
          <div style={{ fontSize: '22px', fontWeight: '700', color: '#f59e0b' }}>{fmt(assets.reduce((s, a) => s + (a.purchaseCost - a.currentValue), 0))} {t('sys.str_4105')}</div>
        </div>
        <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t('sys.str_4209')}</div>
          <div style={{ fontSize: '22px', fontWeight: '700' }}>{assets.length}</div>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead><tr><th>{t('sys.str_4210')}</th><th>{t('sys.str_4211')}</th><th>{t('sys.str_4212')}</th><th>{t('sys.str_4213')}</th><th>{t('sys.str_4207')}</th><th>{t('sys.str_4214')}</th><th>{t('sys.str_4215')}</th><th>{t('sys.str_4179')}</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px' }}>{t('sys.str_4107')}</td></tr>
              : assets.length === 0 ? <tr><td colSpan={8}><div className="empty-state"><div className="empty-state-icon">🏢</div><div className="empty-state-text">{t('sys.str_4216')}</div></div></td></tr>
              : assets.map(a => (
                <tr key={a.id}>
                  <td style={{ fontWeight: '600' }}>{a.assetName}</td>
                  <td><span className="badge badge-outline">{typeLabel(a.assetType)}</span></td>
                  <td style={{ color: 'var(--text-secondary)' }}>{new Date(a.purchaseDate).toLocaleDateString('en-GB')}</td>
                  <td>{fmt(a.purchaseCost)} {t('sys.str_4105')}</td>
                  <td style={{ fontWeight: '700', color: a.currentValue <= a.salvageValue ? '#f59e0b' : '#10b981' }}>{fmt(a.currentValue)} {t('sys.str_4105')}</td>
                  <td>{a.usefulLifeYears} {t('sys.str_4217')}</td>
                  <td><span className={`badge ${statusLabels[a.status]?.cls || ''}`}>{statusLabels[a.status]?.label || a.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {a.status === 'active' && <button className="btn btn-sm" style={{ background: '#f59e0b', color: '#fff', border: 'none', fontSize: '11px' }} onClick={() => handleDepreciate(a.id)}>{t('sys.str_4218')}</button>}
                      <button className="btn btn-sm btn-ghost" style={{ fontSize: '11px' }} onClick={() => setShowDepModal(a)}>{t('sys.str_4219')}</button>
                      <button className="btn btn-sm btn-ghost" style={{ fontSize: '11px' }} onClick={() => openEdit(a)}>✏️</button>
                      <button className="btn btn-sm" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: 'none', fontSize: '11px' }} onClick={() => handleDelete(a.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>{editItem ? t('sys.str_4248') : t('sys.str_4205')}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <Form schema={assetSchema} defaultValues={defaultValues} onSubmit={handleSave} className="space-y-4 p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField name="assetName" label={t('sys.str_4220')} placeholder={t('sys.str_4249')} />
                <FormSelect 
                  name="assetType" 
                  label={t('sys.str_4221')} 
                  options={ASSET_TYPES.map(type => ({ label: t(type.label), value: type.value }))} 
                />
                <FormField name="purchaseDate" type="date" label={t('sys.str_4212')} dir="ltr" />
                <FormField name="location" label={t('sys.str_4225')} placeholder={t('sys.str_4250')} />
                
                <div className="col-span-1 md:col-span-2 mt-4 mb-2 border-b pb-2 font-bold text-gray-700">بيانات التكلفة والإهلاك</div>
                
                <FormField name="purchaseCost" type="number" label={t('sys.str_4222')} dir="ltr" disabled={!!editItem} />
                <FormField name="salvageValue" type="number" label={t('sys.str_4223')} dir="ltr" />
                <FormField name="usefulLifeYears" type="number" label={t('sys.str_4224')} dir="ltr" />
              </div>

              <div className="modal-footer mt-6 pt-4 border-t">
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? t('sys.str_4251') : t('sys.str_4252')}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>{t('sys.str_4097')}</button>
              </div>
            </Form>
          </div>
        </div>
      )}

      {/* Depreciation History Modal */}
      {showDepModal && (
        <div className="modal-overlay" onClick={() => setShowDepModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>{t('sys.str_4226')}{showDepModal.assetName}</h3>
              <button className="modal-close" onClick={() => setShowDepModal(null)}>&times;</button>
            </div>
            <div className="modal-body p-4">
              <div style={{ background: 'var(--bg-secondary)', borderRadius: '10px', padding: '12px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>{t('sys.str_4227')}</span><strong>{fmt(showDepModal.purchaseCost)} {t('sys.str_4105')}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>{t('sys.str_4228')}</span><strong style={{ color: '#10b981' }}>{fmt(showDepModal.currentValue)} {t('sys.str_4105')}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>{t('sys.str_4229')}</span><strong style={{ color: '#f59e0b' }}>{fmt(showDepModal.purchaseCost - showDepModal.currentValue)} {t('sys.str_4105')}</strong></div>
              </div>
              {showDepModal.depreciations.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>{t('sys.str_4230')}</div>
              ) : (
                <table className="table">
                  <thead><tr><th>{t('sys.str_4173')}</th><th>{t('sys.str_4176')}</th></tr></thead>
                  <tbody>
                    {showDepModal.depreciations.map(d => (
                      <tr key={d.id}>
                        <td dir="ltr">{new Date(d.depreciationDate).toLocaleDateString('en-GB')}</td>
                        <td style={{ fontWeight: '600', color: '#ef4444' }}>-{fmt(d.amount)} {t('sys.str_4105')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="modal-footer p-4 border-t">
              <button className="btn btn-ghost w-full" onClick={() => setShowDepModal(null)}>{t('sys.str_4231')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
