'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from "@/lib/i18n";
import { useToast } from '@/components/Toast';
import { z } from 'zod';
import { Form, FormField, FormSelect } from '@/components/forms';
import { Building, Landmark, Percent, Ban, AlertTriangle, Plus, RefreshCw, Trash2, History, MapPin, Calendar, DollarSign, Activity } from 'lucide-react';

import SensitiveValue from '@/components/security/SensitiveValue';
import PermissionGate from '@/components/security/PermissionGate';

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
  const { t, lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
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
      setLoading(true);
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
  const statusLabels: Record<string, { label: string; cls: string; color: string }> = {
    active: { label: t('sys.str_4245'), cls: 'badge-success', color: '#10B981' },
    disposed: { label: t('sys.str_4246'), cls: 'badge-error', color: '#EF4444' },
    fully_depreciated: { label: t('sys.str_4247'), cls: 'badge-warning', color: '#F59E0B' },
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

  const totalCost = assets.reduce((s, a) => s + a.purchaseCost, 0);
  const totalBookValue = assets.reduce((s, a) => s + a.currentValue, 0);
  const totalDepreciation = totalCost - totalBookValue;

  const kpis = [
    { l: t('sys.str_4206'), v: totalCost, s: t('sys.str_4209'), sv: assets.length, c: '#4F46E5', ic: Landmark },
    { l: t('sys.str_4207'), v: totalBookValue, s: _t('صافي القيمة الحالية للأصول', 'Current net book value'), c: '#10B981', ic: Building },
    { l: t('sys.str_4208'), v: totalDepreciation, s: _t('استقطاعات الإهلاك المتراكمة', 'Accumulated depreciation deductions'), c: '#F59E0B', ic: Percent },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Building size={28} color="#4F46E5" /> {t('sys.str_4204')}
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '6px', fontSize: '14px' }}>{_t('إدارة الأصول الثابتة للشركة، تسجيلها، احتساب الإهلاك وتتبع القيمة الدفترية', 'Manage fixed assets, record items, calculate depreciation, and track current values')}</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={16} /> {t('sys.str_4205')}
        </button>
      </div>

      {/* Summary KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {kpis.map((k, i) => (
          <div key={i} className="card" style={{ padding: '20px', borderTop: `4px solid ${k.c}`, borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>{k.l}</span>
              <k.ic size={20} color={k.c} />
            </div>
            <div style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-main)', margin: '4px 0' }}>
              <SensitiveValue value={fmt(Number(k.v))} currency={t('sys.str_4105')} module="assets" />
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Activity size={12} color={k.c} /> {k.s} {k.sv !== undefined && <strong>({k.sv})</strong>}
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid: Assets Table */}
      <div className="card" style={{ borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary, #f8fafc)' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>{_t('سجل ومحفظة الأصول الثابتة', 'Fixed Assets Portfolio Register')}</h3>
        </div>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <div className="animate-spin" style={{ width: '32px', height: '32px', border: '3px solid var(--border)', borderTopColor: '#4F46E5', borderRadius: '50%', margin: '0 auto 12px auto' }}></div>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{t('sys.str_4107')}</p>
          </div>
        ) : assets.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Ban size={40} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
            <span style={{ fontWeight: '700', fontSize: '16px', display: 'block', marginBottom: '6px' }}>{t('sys.str_4216')}</span>
            <p style={{ fontSize: '13px' }}>{_t('ابدأ بتسجيل أصولك الثابتة الجديدة للشركة الآن.', 'Start by adding new fixed assets for the company now.')}</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.01)' }}>
                  <th style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>{t('sys.str_4210')}</th>
                  <th style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>{t('sys.str_4211')}</th>
                  <th style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>{t('sys.str_4212')}</th>
                  <th style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600', textAlign: 'left' }}>{t('sys.str_4213')}</th>
                  <th style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600', textAlign: 'left' }}>{t('sys.str_4207')}</th>
                  <th style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>{t('sys.str_4214')}</th>
                  <th style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>{t('sys.str_4215')}</th>
                  <th style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600', textAlign: 'center' }}>{t('sys.str_4179')}</th>
                </tr>
              </thead>
              <tbody>
                {assets.map(a => (
                  <tr key={a.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: '600', fontSize: '14px' }}>{a.assetName}</td>
                    <td style={{ padding: '12px 16px' }}><span className="badge badge-outline" style={{ fontSize: '12px' }}>{typeLabel(a.assetType)}</span></td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '13px' }}>{new Date(a.purchaseDate).toLocaleDateString('en-GB')}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'left', fontFamily: 'monospace', fontSize: '13px' }} dir="ltr">
                      <SensitiveValue value={fmt(a.purchaseCost)} module="assets" />
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '700', color: a.currentValue <= a.salvageValue ? '#F59E0B' : '#10B981', fontFamily: 'monospace', fontSize: '14px' }} dir="ltr">
                      <SensitiveValue value={fmt(a.currentValue)} module="assets" />
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-muted)' }}>{a.usefulLifeYears} {t('sys.str_4217')}</td>
                    <td style={{ padding: '12px 16px' }}><span className={`badge ${statusLabels[a.status]?.cls || ''}`} style={{ background: statusLabels[a.status]?.color, color: '#fff', fontSize: '11px', padding: '3px 8px', borderRadius: '4px' }}>{statusLabels[a.status]?.label || a.status}</span></td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        {a.status === 'active' && (
                          <button className="btn btn-sm" style={{ background: '#F59E0B', color: '#fff', border: 'none', padding: '4px 8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => handleDepreciate(a.id)}>
                            <RefreshCw size={12} /> {t('sys.str_4218')}
                          </button>
                        )}
                        <button className="btn btn-sm btn-outline" style={{ padding: '4px 8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => setShowDepModal(a)}>
                          <History size={12} /> {t('sys.str_4219')}
                        </button>
                        <button className="btn btn-sm btn-ghost" style={{ fontSize: '13px', padding: '4px' }} onClick={() => openEdit(a)}>✏️</button>
                        <button className="btn btn-sm" style={{ color: '#EF4444', background: 'rgba(239,68,68,0.1)', border: 'none', padding: '4px' }} onClick={() => handleDelete(a.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', borderRadius: '12px', padding: '0' }}>
            <div className="modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>{editItem ? t('sys.str_4248') : t('sys.str_4205')}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)} style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer' }}>&times;</button>
            </div>
            <Form schema={assetSchema} defaultValues={defaultValues} onSubmit={handleSave} className="space-y-4 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField name="assetName" label={t('sys.str_4220')} placeholder={t('sys.str_4249')} />
                <FormSelect 
                  name="assetType" 
                  label={t('sys.str_4221')} 
                  options={ASSET_TYPES.map(type => ({ label: t(type.label), value: type.value }))} 
                />
                <FormField name="purchaseDate" type="date" label={t('sys.str_4212')} dir="ltr" />
                <FormField name="location" label={t('sys.str_4225')} placeholder={t('sys.str_4250')} />
                
                <div className="col-span-1 md:col-span-2 mt-4 mb-2 border-b pb-2 font-bold text-gray-700" style={{ fontSize: '14px', borderBottom: '1px solid var(--border)' }}>{_t('بيانات التكلفة والإهلاك للتحليل المالي', 'Cost & Depreciation Data')}</div>
                
                <FormField name="purchaseCost" type="number" label={t('sys.str_4222')} dir="ltr" disabled={!!editItem} />
                <FormField name="salvageValue" type="number" label={t('sys.str_4223')} dir="ltr" />
                <FormField name="usefulLifeYears" type="number" label={t('sys.str_4224')} dir="ltr" />
              </div>

              <div className="modal-footer mt-6 pt-4 border-t" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
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
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', borderRadius: '12px', padding: '0' }}>
            <div className="modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>{t('sys.str_4226')}{showDepModal.assetName}</h3>
              <button className="modal-close" onClick={() => setShowDepModal(null)} style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer' }}>&times;</button>
            </div>
            <div className="modal-body p-6">
              <div style={{ background: 'var(--bg-secondary, #f8fafc)', borderRadius: '10px', padding: '14px', marginBottom: '16px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}><span>{t('sys.str_4227')}</span><strong>{fmt(showDepModal.purchaseCost)} {t('sys.str_4105')}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}><span>{t('sys.str_4228')}</span><strong style={{ color: '#10b981' }}>{fmt(showDepModal.currentValue)} {t('sys.str_4105')}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}><span>{t('sys.str_4229')}</span><strong style={{ color: '#f59e0b' }}>{fmt(showDepModal.purchaseCost - showDepModal.currentValue)} {t('sys.str_4105')}</strong></div>
              </div>
              {showDepModal.depreciations.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '13px' }}>{t('sys.str_4230')}</div>
              ) : (
                <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '8px 12px', fontSize: '12px', color: 'var(--text-muted)' }}>{t('sys.str_4173')}</th>
                      <th style={{ padding: '8px 12px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'left' }}>{t('sys.str_4176')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {showDepModal.depreciations.map(d => (
                      <tr key={d.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '8px 12px', fontSize: '13px' }} dir="ltr">{new Date(d.depreciationDate).toLocaleDateString('en-GB')}</td>
                        <td style={{ padding: '8px 12px', fontSize: '13px', fontWeight: '600', color: '#EF4444', textAlign: 'left' }} dir="ltr">-{fmt(d.amount)} {t('sys.str_4105')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="modal-footer p-4 border-t" style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <button className="btn btn-ghost w-full" onClick={() => setShowDepModal(null)}>{t('sys.str_4231')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
