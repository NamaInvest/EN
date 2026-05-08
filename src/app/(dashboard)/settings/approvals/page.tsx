'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from "@/lib/i18n";
import { useToast } from '@/components/Toast';
import { z } from 'zod';
import { Form, FormField, FormSelect } from '@/components/forms';

interface ApprovalRule {
  id: number;
  documentType: string;
  minAmount: number;
  maxAmount: number | null;
  approverRole: string;
  approverId: number | null;
  level: number;
  isActive: boolean;
  approver?: {
    id: number;
    fullName: string;
    role: string;
  };
}

const approvalSchema = z.object({
  documentType: z.string().min(1, 'نوع المستند مطلوب'),
  minAmount: z.number().min(0, 'الحد الأدنى يجب أن يكون صفر أو أكبر').default(0),
  maxAmount: z.number().nullable().optional(),
  approverRole: z.string().min(1, 'دور المعتمد مطلوب'),
  approverId: z.number().nullable().optional(),
  level: z.number().min(1, 'المستوى يجب أن يكون 1 أو أكثر').default(1),
  isActive: z.boolean().default(true)
}).refine(data => data.maxAmount === null || data.maxAmount === undefined || data.maxAmount >= data.minAmount, {
  message: 'الحد الأقصى يجب أن يكون أكبر من الحد الأدنى أو فارغاً',
  path: ['maxAmount']
});

type ApprovalFormValues = z.infer<typeof approvalSchema>;

export default function ApprovalsPage() {
  const { t } = useTranslation();
  const { error: toastError, success: toastSuccess } = useToast();
  const [rules, setRules] = useState<ApprovalRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  async function fetchData() {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/settings/approvals', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setRules(await res.json());
    } catch (err: any) { toastError(err?.message || 'حدث خطأ'); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (data: ApprovalFormValues) => {
    const token = localStorage.getItem('token');
    try {
      const body = JSON.stringify({ ...data, maxAmount: data.maxAmount || null });
      if (editId) {
        const res = await fetch(`/api/settings/approvals/${editId}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body,
        });
        if (res.ok) { toastSuccess(t('sys.str_2506')); setShowModal(false); fetchData(); }
        else { const d = await res.json(); toastError(d.error || 'حدث خطأ'); }
      } else {
        const res = await fetch('/api/settings/approvals', {
          method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body,
        });
        if (res.ok) { toastSuccess(t('sys.str_2507')); setShowModal(false); fetchData(); }
        else { const d = await res.json(); toastError(d.error || 'حدث خطأ'); }
      }
    } catch { toastError(t('sys.str_419')); }
  };

  const deleteRule = async (r: ApprovalRule) => {
    if (!confirm(t('sys.str_2512'))) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/settings/approvals/${r.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { toastSuccess(t('sys.str_488')); fetchData(); }
      else { const d = await res.json(); toastError(d.error || 'حدث خطأ'); }
    } catch { toastError(t('sys.str_419')); }
  };

  const openEdit = (r: ApprovalRule) => {
    setEditId(r.id);
    setShowModal(true);
  };

  const openAdd = () => {
    setEditId(null);
    setShowModal(true);
  };

  const getDocTypeName = (type: string) => {
    const map: Record<string, string> = {
      'PURCHASE_ORDER': 'طلب / أمر شراء',
      'JOURNAL_ENTRY': 'قيد يومية',
      'MANUFACTURING_ORDER': 'أمر تصنيع',
      'EXPENSE': 'مصروف / عهدة',
      'SALES_INVOICE': 'فاتورة مبيعات'
    };
    return map[type] || type;
  };

  const editItem = rules.find(r => r.id === editId);

  const defaultValues: Partial<ApprovalFormValues> = editItem ? {
    documentType: editItem.documentType,
    minAmount: editItem.minAmount,
    maxAmount: editItem.maxAmount,
    approverRole: editItem.approverRole,
    approverId: editItem.approverId,
    level: editItem.level,
    isActive: editItem.isActive
  } : {
    documentType: 'PURCHASE_ORDER', minAmount: 0, maxAmount: null, approverRole: 'admin', approverId: null, level: 1, isActive: true
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">{t('sys.str_1307')}</h1>
        <button className="btn btn-primary" onClick={openAdd}>{t('sys.str_2484')}</button>
      </div>

      <div className="page-content animate-fade-in">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>{t('sys.str_2485')}</th>
                <th>{t('sys.str_2486')}</th>
                <th>{t('sys.str_2487')}</th>
                <th>{t('sys.str_2488')}</th>
                <th>{t('sys.str_2489')}</th>
                <th>{t('fin.str_227')}</th>
                <th>{t('sys.str_435')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px' }}>{t('sys.str_168')}</td></tr>
              : rules.length === 0 ? <tr><td colSpan={8}><div className="empty-state"><div className="empty-state-text">{t('sys.str_2490')}</div></div></td></tr>
              : rules.map((r, i) => (
                <tr key={r.id}>
                  <td>{i + 1}</td>
                  <td style={{ fontWeight: 'bold' }}>{getDocTypeName(r.documentType)}</td>
                  <td dir="ltr" style={{ color: 'var(--success)' }}>{r.minAmount > 0 ? r.minAmount?.toLocaleString() : t('sys.str_2508')}</td>
                  <td dir="ltr" style={{ color: 'var(--danger)' }}>{r.maxAmount ? r.maxAmount?.toLocaleString() : t('sys.str_2509')}</td>
                  <td><span className="badge badge-outline">{r.level}</span></td>
                  <td><span className="badge badge-primary">{r.approverRole}</span></td>
                  <td>
                    <span className={`badge ${r.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {r.isActive ? t('sys.str_2510') : t('sys.str_654')}
                    </span>
                  </td>
                  <td style={{ display: 'flex', gap: '4px' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(r)} style={{ color: 'var(--primary)', fontSize: '13px' }}>✏️</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => deleteRule(r)} style={{ color: 'var(--danger)', fontSize: '13px' }}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{editId ? t('sys.str_2511') : t('sys.str_2484')}</div>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            
            <Form schema={approvalSchema} defaultValues={defaultValues} onSubmit={handleSave} className="space-y-4 p-4">
              <FormSelect 
                name="documentType" 
                label={t('sys.str_2491')} 
                options={[
                  { label: t('sys.str_2492'), value: 'PURCHASE_ORDER' },
                  { label: t('sys.str_2493'), value: 'JOURNAL_ENTRY' },
                  { label: t('sys.str_2494'), value: 'EXPENSE' },
                  { label: t('sys.str_2495'), value: 'MANUFACTURING_ORDER' },
                  { label: t('sys.str_2496'), value: 'SALES_INVOICE' },
                ]} 
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField name="minAmount" type="number" label={t('sys.str_2497')} dir="ltr" />
                <FormField name="maxAmount" type="number" label={t('sys.str_2498')} dir="ltr" placeholder={t('sys.str_514')} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormSelect 
                  name="approverRole" 
                  label={t('sys.str_2499')} 
                  options={[
                    { label: t('sys.str_2500'), value: 'admin' },
                    { label: t('sys.str_2501'), value: 'manager' },
                    { label: t('sys.str_2502'), value: 'accountant' },
                  ]} 
                />
                <FormField name="level" type="number" label={t('sys.str_2503')} dir="ltr" min="1" />
              </div>

              <div className="flex items-center gap-2 mt-4">
                <FormField name="isActive" type="checkbox" label={t('sys.str_2504')} />
              </div>

              <div className="modal-footer mt-6 pt-4 border-t">
                <button type="submit" className="btn btn-primary">{t('sys.str_484')}</button>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>{t('fin.str_206')}</button>
              </div>
            </Form>
          </div>
        </div>
      )}
    </>
  );
}
