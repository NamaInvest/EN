'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from "@/lib/i18n";
import { useToast } from '@/components/Toast';
import { z } from 'zod';
import { Form, FormField, FormSelect } from '@/components/forms';

interface Employee { 
  id: number; 
  name: string; 
  phone: string; 
  position: string; 
  salary: number; 
  startDate: string; 
  active: boolean; 
  branchId?: number; 
  branch?: { id: number; name: string } | null; 
  housingAllowance?: number; 
  transportAllowance?: number; 
  otherAllowance?: number; 
  bankName?: string; 
  iban?: string; 
}

const employeeSchema = z.object({
  name: z.string().min(2, 'الاسم مطلوب ويجب أن يكون حرفين على الأقل'),
  phone: z.string().optional(),
  branchId: z.string().optional(),
  position: z.string().optional(),
  salary: z.number().min(0, 'الراتب لا يمكن أن يكون سالباً').default(0),
  housingAllowance: z.number().min(0).optional().default(0),
  transportAllowance: z.number().min(0).optional().default(0),
  otherAllowance: z.number().min(0).optional().default(0),
  bankName: z.string().optional(),
  iban: z.string().optional().refine(val => !val || (val.startsWith('SA') && val.length === 24), 'رقم الآيبان يجب أن يبدأ بـ SA ويتكون من 24 خانة'),
  startDate: z.string().optional()
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

export default function EmployeesPage() {
  const { t } = useTranslation();
  const { error: toastError, success: toastSuccess } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Employee | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    const token = localStorage.getItem('token');
    const params = search ? `?search=${search}` : '';
    try {
      const [empRes, bRes] = await Promise.all([
        fetch(`/api/employees${params}`, { headers: { Authorization: `Bearer ${token}` } }),
        branches.length === 0 ? fetch('/api/branches', { headers: { Authorization: `Bearer ${token}` } }) : Promise.resolve(null)
      ]);
      if (empRes.ok) setEmployees(await empRes.json());
      if (bRes && bRes.ok) setBranches(await bRes.json());
    } catch (err: any) { toastError(err?.message || 'حدث خطأ'); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { const t = setTimeout(fetchData, 300); return () => clearTimeout(t); }, [search]);

  const openAdd = () => { 
    setEditItem(null); 
    setShowModal(true); 
  };

  const openEdit = (e: Employee) => { 
    setEditItem(e); 
    setShowModal(true); 
  };

  const handleSave = async (data: EmployeeFormValues) => {
    const token = localStorage.getItem('token');
    const url = editItem ? `/api/employees/${editItem.id}` : '/api/employees';
    const method = editItem ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, { 
        method, 
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, 
        body: JSON.stringify(data) 
      });
      if (res.ok) { 
        setShowModal(false); 
        toastSuccess('تم الحفظ بنجاح');
        fetchData(); 
      } else {
        const err = await res.json();
        toastError(err.error || 'حدث خطأ أثناء الحفظ');
      }
    } catch (err: any) { toastError(err?.message || 'حدث خطأ'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('hr.str_567'))) return;
    const token = localStorage.getItem('token');
    try { 
      await fetch(`/api/employees/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }); 
      toastSuccess('تم الحذف بنجاح');
      fetchData(); 
    } catch (err: any) { toastError(err?.message || 'حدث خطأ'); }
  };

  const fmt = (v: number) => new Intl.NumberFormat('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

  const defaultValues: Partial<EmployeeFormValues> = editItem ? {
    name: editItem.name,
    phone: editItem.phone || '',
    branchId: editItem.branchId?.toString() || '',
    position: editItem.position || '',
    salary: editItem.salary || 0,
    housingAllowance: editItem.housingAllowance || 0,
    transportAllowance: editItem.transportAllowance || 0,
    otherAllowance: editItem.otherAllowance || 0,
    bankName: editItem.bankName || '',
    iban: editItem.iban || '',
    startDate: editItem.startDate || ''
  } : {
    name: '', phone: '', branchId: '', position: '', salary: 0, housingAllowance: 0, transportAllowance: 0, otherAllowance: 0, bankName: '', iban: '', startDate: ''
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">{t('hr.str_553')}</h1>
        <span className="badge badge-info">{employees.length} {t('hr.str_554')}</span>
      </div>
      
      <div className="page-content animate-fade-in">
        <div className="toolbar">
          <div className="search-bar">
            <input className="input" placeholder={t('hr.str_568')} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="toolbar-spacer" />
          <button className="btn btn-primary" onClick={openAdd}>{t('hr.str_555')}</button>
        </div>
        
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>{t('fin.str_198')}</th>
                <th>{t('sys.str_527')}</th>
                <th>{t('hr.str_556')}</th>
                <th>{t('hr.str_557')}</th>
                <th>{t('hr.str_558')}</th>
                <th>{t('sys.str_506')}</th>
                <th>{t('fin.str_227')}</th>
                <th>{t('sys.str_435')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px' }}>{t('sys.str_168')}</td></tr>
              ) : employees.length === 0 ? (
                <tr><td colSpan={9}><div className="empty-state"><div className="empty-state-icon">👨‍💼</div><div className="empty-state-text">{t('hr.str_559')}</div></div></td></tr>
              ) : employees.map((e, i) => (
                <tr key={e.id}>
                  <td>{i + 1}</td>
                  <td style={{ fontWeight: '600' }}>{e.name}</td>
                  <td dir="ltr" style={{ color: 'var(--text-secondary)' }}>{e.phone || '-'}</td>
                  <td><span className="badge badge-outline">{e.branch?.name || '-'}</span></td>
                  <td><span className="badge badge-purple">{e.position || '-'}</span></td>
                  <td style={{ fontWeight: '600' }}>{fmt(e.salary)} {t('sys.str_68')}</td>
                  <td>{e.startDate || '-'}</td>
                  <td><span className="status-dot active" /> {t('sys.str_180')}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(e)}>✏️</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(e.id)} style={{ color: 'var(--danger)' }}>🗑️</button>
                    </div>
                  </td>
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
              <div className="modal-title">{editItem ? t('sys.str_547') : t('hr.str_555')}</div>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            
            <Form schema={employeeSchema} defaultValues={defaultValues} onSubmit={handleSave} className="space-y-4 p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField name="name" label={t('sys.str_531')} placeholder="اسم الموظف" />
                <FormField name="phone" label={t('sys.str_527')} placeholder="رقم الجوال" dir="ltr" />
                
                <FormSelect 
                  name="branchId" 
                  label={t('hr.str_556')} 
                  options={[
                    { label: t('hr.str_560'), value: '' },
                    ...branches.map(b => ({ label: b.name, value: b.id.toString() }))
                  ]} 
                />
                
                <FormField name="position" label={t('hr.str_557')} placeholder="المسمى الوظيفي" />
                <FormField name="startDate" type="date" label={t('sys.str_506')} dir="ltr" />
              </div>

              <div className="mt-6 mb-2 border-b pb-2 font-bold text-gray-700">بيانات الراتب والبدلات</div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-md border">
                <FormField name="salary" type="number" label={t('hr.str_561')} dir="ltr" />
                <FormField name="housingAllowance" type="number" label={t('hr.str_562')} dir="ltr" />
                <FormField name="transportAllowance" type="number" label={t('hr.str_563')} dir="ltr" />
                <FormField name="otherAllowance" type="number" label={t('hr.str_564')} dir="ltr" />
              </div>

              <div className="mt-6 mb-2 border-b pb-2 font-bold text-gray-700">بيانات البنك</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField name="bankName" label={t('hr.str_565')} placeholder="اسم البنك" />
                <FormField name="iban" label={t('hr.str_566')} placeholder="SA..." dir="ltr" />
              </div>

              <div className="modal-footer mt-6 pt-4 border-t">
                <button type="submit" className="btn btn-primary">{t('sys.str_455')}</button>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>{t('fin.str_206')}</button>
              </div>
            </Form>
            
          </div>
        </div>
      )}
    </>
  );
}
