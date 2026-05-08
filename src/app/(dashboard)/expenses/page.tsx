'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from "@/lib/i18n";
import { useToast } from '@/components/Toast';
import { z } from 'zod';
import { Form, FormField, FormSelect, FormTextarea } from '@/components/forms';

interface Expense { 
  id: number; 
  date: string; 
  category: string; 
  description: string; 
  amount: number; 
  notes: string; 
  costCenterId?: number; 
  costCenter?: { name: string } 
}

const CATEGORIES = ['رواتب وأجور', 'إيجارات', 'مشتريات', 'خدمات ومرافق', 'تسويق وإعلان', 'صيانة', 'مصاريف إدارية', 'نقل وتوصيل', 'أخرى'];

const expenseSchema = z.object({
  category: z.string().min(1, 'الفئة مطلوبة'),
  description: z.string().min(2, 'البيان مطلوب'),
  amount: z.number().min(0.01, 'المبلغ يجب أن يكون أكبر من صفر'),
  costCenterId: z.string().optional(),
  notes: z.string().optional()
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

export default function ExpensesPage() {
  const { t } = useTranslation();
  const { error: toastError, success: toastSuccess } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [canDelete, setCanDelete] = useState(false);
  const [canDeleteAll, setCanDeleteAll] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [costCenters, setCostCenters] = useState<{id:number, name:string, isActive:boolean}[]>([]);
  const [saving, setSaving] = useState(false);

  async function fetchData() {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams();
    if (dateFrom) params.set('from', dateFrom);
    if (dateTo) params.set('to', dateTo);
    try {
      const res = await fetch(`/api/expenses?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setExpenses(await res.json());
    } catch (err: any) { toastError(err?.message || 'حدث خطأ'); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    fetchData();
    fetch('/api/accounting/cost-centers')
      .then(r => r.json())
      .then(d => setCostCenters(Array.isArray(d) ? d : []))
      .catch(() => {});

    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      const perms: string[] = (u.permissions || []).map((p: { module: string }) => p.module);
      const isAdmin = u.role === 'admin';
      setCanDelete(isAdmin || perms.includes('delete_expense'));
      setCanDeleteAll(isAdmin || perms.includes('delete_all_expenses'));
      setCanEdit(isAdmin || perms.includes('edit_expense'));
    } catch { }
  }, [dateFrom, dateTo]);

  const handleSave = async (data: ExpenseFormValues) => {
    setSaving(true);
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    try {
      const payload = {
        ...data,
        userId: user.id
      };

      if (editId) {
        // Edit existing expense
        const res = await fetch('/api/expenses', {
          method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ id: editId, ...payload }),
        });
        if (res.ok) { 
          toastSuccess(t('sys.str_4194')); 
          setShowModal(false); 
          setEditId(null); 
          fetchData(); 
        } else { 
          const d = await res.json(); 
          toastError(`❌ ${d.error || t('sys.str_4195')}`); 
        }
      } else {
        // Add new expense
        const res = await fetch('/api/expenses', {
          method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        if (res.ok) { 
          toastSuccess(t('sys.str_4196')); 
          setShowModal(false); 
          fetchData(); 
        } else {
          const d = await res.json();
          toastError(`❌ ${d.error || 'حدث خطأ'}`);
        }
      }
    } catch (err: any) { toastError(err?.message || 'حدث خطأ'); }
    finally { setSaving(false); }
  };

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const fmt = (v: number) => new Intl.NumberFormat('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

  const deleteExpense = async (e: Expense) => {
    if (!confirm(`هل أنت متأكد من حذف المصروف "${e.description}"؟`)) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/expenses?id=${e.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { toastSuccess(t('sys.str_4197')); fetchData(); }
      else { const d = await res.json(); toastError(`❌ ${d.error || t('sys.str_4198')}`); }
    } catch { toastError(t('sys.str_4199')); }
  };

  const deleteAllExpenses = async () => {
    if (!confirm(`⚠️ هل أنت متأكد من حذف جميع المصروفات (${expenses.length} مصروف)؟\n\nهذا الإجراء لا يمكن التراجع عنه!`)) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/expenses?all=true', { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const d = await res.json(); toastSuccess(`✅ ${d.message}`); fetchData(); }
      else { const d = await res.json(); toastError(`❌ ${d.error || t('sys.str_4198')}`); }
    } catch { toastError(t('sys.str_4199')); }
  };

  const editExpense = (e: Expense) => {
    setEditId(e.id);
    setShowModal(true);
  };

  const openAddModal = () => {
    setEditId(null);
    setShowModal(true);
  };

  const editItem = expenses.find(e => e.id === editId);

  const defaultValues: Partial<ExpenseFormValues> = editItem ? {
    category: editItem.category,
    description: editItem.description,
    amount: editItem.amount,
    notes: editItem.notes || '',
    costCenterId: editItem.costCenterId?.toString() || ''
  } : {
    category: 'أخرى', description: '', amount: 0, notes: '', costCenterId: ''
  };

  return (
    <>
      <div className="page-header"><h1 className="page-title">{t('sys.str_4169')}</h1></div>
      <div className="page-content animate-fade-in">
        
        <div className="kpi-grid" style={{ marginBottom: '24px' }}>
          <div className="kpi-card danger" style={{ gridColumn: 'span 2' }}>
            <div className="kpi-icon">💸</div>
            <div className="kpi-value">{fmt(totalExpenses)} {t('sys.str_4105')}</div>
            <div className="kpi-label">{t('sys.str_4170')}</div>
          </div>
        </div>

        <div className="toolbar">
          <input className="input" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ width: '160px' }} dir="ltr" />
          <input className="input" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ width: '160px' }} dir="ltr" />
          <div className="toolbar-spacer" />
          {canDeleteAll && expenses.length > 0 && (
            <button className="btn btn-ghost" onClick={deleteAllExpenses} style={{ color: 'var(--danger)', border: '1px solid var(--danger)', marginLeft: '8px' }}>
              {t('sys.str_4171')}{expenses.length})
            </button>
          )}
          <button className="btn btn-primary" onClick={openAddModal}>{t('sys.str_4172')}</button>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>{t('sys.str_4173')}</th>
                <th>{t('sys.str_4174')}</th>
                <th>{t('sys.str_4175')}</th>
                <th>{t('sys.str_4176')}</th>
                <th>{t('sys.str_4177')}</th>
                <th>{t('sys.str_4178')}</th>
                {(canDelete || canEdit) && <th>{t('sys.str_4179')}</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={(canDelete || canEdit) ? 8 : 7} style={{ textAlign: 'center', padding: '40px' }}>{t('sys.str_4107')}</td></tr>
              : expenses.length === 0 ? <tr><td colSpan={(canDelete || canEdit) ? 8 : 7}><div className="empty-state"><div className="empty-state-icon">💸</div><div className="empty-state-text">{t('sys.str_4180')}</div></div></td></tr>
              : expenses.map((e, i) => (
                <tr key={e.id}>
                  <td>{i + 1}</td>
                  <td dir="ltr" className="text-right">{new Date(e.date).toLocaleDateString('en-GB')}</td>
                  <td><span className="badge badge-warning">{e.category}</span></td>
                  <td>{e.description}</td>
                  <td style={{ fontWeight: '700', color: 'var(--danger-light)' }}>{fmt(e.amount)} {t('sys.str_4105')}</td>
                  <td><span className="badge" style={{background:'#eef2ff', color:'#4f46e5'}}>{e.costCenter?.name || '-'}</span></td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{e.notes || '-'}</td>
                  {(canDelete || canEdit) && <td style={{ display: 'flex', gap: '4px' }}>
                    {canEdit && <button className="btn btn-ghost btn-sm" onClick={() => editExpense(e)} style={{ color: 'var(--primary)', fontSize: '12px' }}>✏️</button>}
                    {canDelete && <button className="btn btn-ghost btn-sm" onClick={() => deleteExpense(e)} style={{ color: 'var(--danger)', fontSize: '12px' }}>🗑️</button>}
                  </td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{editId ? t('sys.str_4200') : t('sys.str_4172')}</div>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            
            <Form schema={expenseSchema} defaultValues={defaultValues} onSubmit={handleSave} className="space-y-4 p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormSelect 
                  name="category" 
                  label={t('sys.str_4174')} 
                  options={CATEGORIES.map(c => ({ label: c, value: c }))} 
                />
                
                <FormSelect 
                  name="costCenterId" 
                  label={t('sys.str_4181')} 
                  options={[
                    { label: t('sys.str_4182'), value: '' },
                    ...costCenters.filter(c => c.isActive || String(c.id) === defaultValues.costCenterId).map(c => ({ label: c.name, value: c.id.toString() }))
                  ]} 
                />
              </div>

              <FormField name="description" label={t('sys.str_4183')} placeholder={t('sys.str_4201')} />
              <FormField name="amount" type="number" label={t('sys.str_4184')} placeholder="0.00" dir="ltr" />
              <FormTextarea name="notes" label={t('sys.str_4178')} rows={2} />

              <div className="modal-footer mt-6 pt-4 border-t">
                <button type="submit" disabled={saving} className="btn btn-primary">
                  💾 {saving ? '...' : (editId ? t('sys.str_4202') : t('sys.str_4203'))}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>{t('sys.str_4097')}</button>
              </div>
            </Form>
          </div>
        </div>
      )}
    </>
  );
}
