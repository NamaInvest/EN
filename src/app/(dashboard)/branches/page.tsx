'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from "@/lib/i18n";
import { useToast } from '@/components/Toast';
import { z } from 'zod';
import { Form, FormField } from '@/components/forms';

interface Branch {
  id: number;
  name: string;
  code: string | null;
  address: string | null;
  phone: string | null;
  isActive: boolean;
  _count?: {
    users: number;
    stocks: number;
    shifts: number;
    invoices: number;
  }
}

const branchSchema = z.object({
  name: z.string().min(2, 'الاسم مطلوب ويجب أن يكون حرفين على الأقل'),
  code: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  isActive: z.boolean().default(true)
});

type BranchFormValues = z.infer<typeof branchSchema>;

export default function BranchesPage() {
  const { t } = useTranslation();
  const { error: toastError, success: toastSuccess } = useToast();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  async function fetchData() {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/branches', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setBranches(await res.json());
    } catch (err: any) { toastError(err?.message || 'حدث خطأ'); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (data: BranchFormValues) => {
    const token = localStorage.getItem('token');
    try {
      const url = '/api/branches';
      const method = editId ? 'PUT' : 'POST';
      const body = editId ? { id: editId, ...data } : data;

      const res = await fetch(url, {
        method, 
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });

      if (res.ok) { 
        toastSuccess(editId ? t('sys.str_486') : t('sys.str_487')); 
        setShowModal(false); 
        fetchData(); 
      } else { 
        const d = await res.json(); 
        toastError(d.error || 'حدث خطأ'); 
      }
    } catch { toastError(t('sys.str_419')); }
  };

  const deleteBranch = async (b: Branch) => {
    if (!confirm(`هل أنت متأكد من حذف الفرع "${b.name}"؟`)) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/branches?id=${b.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { toastSuccess(t('sys.str_488')); fetchData(); }
      else { const d = await res.json(); toastError(d.error || 'حدث خطأ'); }
    } catch { toastError(t('sys.str_419')); }
  };

  const openEdit = (b: Branch) => {
    setEditId(b.id);
    setShowModal(true);
  };

  const openAdd = () => {
    setEditId(null);
    setShowModal(true);
  };

  const editItem = branches.find(b => b.id === editId);

  const defaultValues: Partial<BranchFormValues> = editItem ? {
    name: editItem.name,
    code: editItem.code || '',
    address: editItem.address || '',
    phone: editItem.phone || '',
    isActive: editItem.isActive
  } : {
    name: '', code: '', address: '', phone: '', isActive: true
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">{t('sys.str_472')}</h1>
        <button className="btn btn-primary" onClick={openAdd}>{t('sys.str_473')}</button>
      </div>

      <div className="page-content animate-fade-in">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>{t('sys.str_474')}</th>
                <th>{t('sys.str_475')}</th>
                <th>{t('sys.str_476')}</th>
                <th>{t('sys.str_477')}</th>
                <th>{t('sys.str_478')}</th>
                <th>{t('fin.str_227')}</th>
                <th>{t('sys.str_435')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px' }}>{t('sys.str_168')}</td></tr>
              : branches.length === 0 ? <tr><td colSpan={8}><div className="empty-state"><div className="empty-state-text">{t('sys.str_479')}</div></div></td></tr>
              : branches.map((b, i) => (
                <tr key={b.id}>
                  <td>{i + 1}</td>
                  <td style={{ fontWeight: 'bold' }}>{b.name}</td>
                  <td><span className="badge badge-outline">{b.code || '-'}</span></td>
                  <td>{b.address || '-'}</td>
                  <td dir="ltr" style={{ textAlign: 'right' }}>{b.phone || '-'}</td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {b._count ? `👥 ${b._count.users} | 🧾 ${b._count.invoices}` : '-'}
                  </td>
                  <td>
                    <span className={`badge ${b.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {b.isActive ? t('sys.str_180') : t('sys.str_489')}
                    </span>
                  </td>
                  <td style={{ display: 'flex', gap: '4px' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(b)} style={{ color: 'var(--primary)', fontSize: '13px' }}>✏️</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => deleteBranch(b)} style={{ color: 'var(--danger)', fontSize: '13px' }}>🗑️</button>
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
              <div className="modal-title">{editId ? t('sys.str_490') : t('sys.str_473')}</div>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            
            <Form schema={branchSchema} defaultValues={defaultValues} onSubmit={handleSave} className="space-y-4 p-4">
              <FormField name="name" label={t('sys.str_480')} placeholder={t('sys.str_491')} />
              <FormField name="code" label={t('sys.str_481')} placeholder="BR-01" dir="ltr" />
              <FormField name="address" label={t('sys.str_476')} />
              <FormField name="phone" label={t('sys.str_482')} type="tel" dir="ltr" />
              
              <div className="flex items-center gap-2 mt-4">
                <FormField name="isActive" type="checkbox" label={t('sys.str_483')} />
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
