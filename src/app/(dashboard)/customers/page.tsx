'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from "@/lib/i18n";
import { useToast } from '@/components/Toast';
import { z } from 'zod';
import { Form, FormField, FormSelect, FormTextarea } from '@/components/forms';

interface Customer {
  id: number; name: string; phone: string; type: number; balance: number;
  address: string; city: string; district: string; taxNumber: string; crNo: string;
  creditLimit: number; notes: string; buildingNumber: string;
  postalCode: string; street: string; active: boolean; routeId: number | null;
}

const customerSchema = z.object({
  name: z.string().min(2, 'الاسم مطلوب ويجب أن يكون حرفين على الأقل'),
  phone: z.string().optional(),
  type: z.string(),
  address: z.string().optional(),
  street: z.string().optional(),
  buildingNumber: z.string().optional(),
  district: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  creditLimit: z.number().min(0).optional().default(0),
  taxNumber: z.string().optional().refine(val => !val || val.length === 15, 'الرقم الضريبي يجب أن يكون 15 رقماً'),
  crNo: z.string().optional(),
  notes: z.string().optional(),
  routeId: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

export default function CustomersPage() {
  const { t } = useTranslation();
  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [routes, setRoutes] = useState<any[]>([]);
  const [sendingReminderId, setSendingReminderId] = useState<number | null>(null);

  // Form default values
  const defaultValues: Partial<CustomerFormValues> = editItem ? {
    name: editItem.name,
    phone: editItem.phone || '',
    type: editItem.type.toString(),
    address: editItem.address || '',
    street: editItem.street || '',
    buildingNumber: editItem.buildingNumber || '',
    district: editItem.district || '',
    city: editItem.city || '',
    postalCode: editItem.postalCode || '',
    creditLimit: editItem.creditLimit || 0,
    taxNumber: editItem.taxNumber || '',
    crNo: editItem.crNo || '',
    notes: editItem.notes || '',
    routeId: editItem.routeId?.toString() || ''
  } : {
    name: '', phone: '', type: '0', address: '', street: '', buildingNumber: '',
    district: '', city: '', postalCode: '', creditLimit: 0, taxNumber: '', crNo: '', notes: '', routeId: ''
  };

  async function fetchData() {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (typeFilter) params.set('type', typeFilter);
      const [cRes, rRes] = await Promise.all([
        fetch(`/api/customers?${params}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/sales/routes`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (cRes.ok) setCustomers(await cRes.json());
      if (rRes.ok) setRoutes(await rRes.json());
    } catch (err: any) { toastError(err?.message || 'حدث خطأ'); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { const timer = setTimeout(fetchData, 300); return () => clearTimeout(timer); }, [search, typeFilter]);

  const typeLabel = (val: number) => val === 0 ? t('sys.str_532') : val === 1 ? t('sys.str_533') : t('sys.str_525');
  const typeBadge = (val: number) => val === 0 ? 'badge-info' : val === 1 ? 'badge-purple' : 'badge-warning';

  const openAdd = () => {
    setEditItem(null);
    setShowModal(true);
  };

  const openEdit = (c: Customer) => {
    setEditItem(c);
    setShowModal(true);
  };

  const handleSave = async (data: CustomerFormValues) => {
    const token = localStorage.getItem('token');
    const url = editItem ? `/api/customers/${editItem.id}` : '/api/customers';
    const method = editItem ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...data, creditLimit: data.creditLimit?.toString() || '0' }),
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
    if (!confirm(t('sys.str_541'))) return;
    const token = localStorage.getItem('token');
    try {
      await fetch(`/api/customers/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      toastSuccess('تم الحذف بنجاح');
      fetchData();
    } catch (err: any) { toastError(err?.message || 'حدث خطأ'); }
  };

  const sendReminder = async (c: Customer) => {
    if (!c.phone) {
      toastWarning(t('sys.str_542'));
      return;
    }
    setSendingReminderId(c.id);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/crm/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ phone: c.phone, type: 'reminder', balance: fmt(c.balance) })
      });
      const data = await res.json();
      if (data.success) {
        toastSuccess(t('sys.str_543'));
      } else {
        toastError(`❌ فشل الإرسال: ${data.error}`);
      }
    } catch (err) {
      toastWarning(t('sys.str_544'));
    } finally {
      setSendingReminderId(null);
    }
  };

  const fmt = (v: number) => new Intl.NumberFormat('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">{t('sys.str_521')}</h1>
        <span className="badge badge-info">{customers.length}</span>
      </div>
      <div className="page-content animate-fade-in">
        <div className="toolbar">
          <div className="search-bar">
            <input className="input" placeholder={t('sys.str_545')} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input" style={{ width: '150px' }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="">{t('sys.str_522')}</option>
            <option value="0">{t('sys.str_523')}</option>
            <option value="1">{t('sys.str_524')}</option>
            <option value="2">{t('sys.str_525')}</option>
          </select>
          <div className="toolbar-spacer" />
          <button className="btn btn-primary" onClick={openAdd}>{t('sys.str_526')}</button>
        </div>

        <div className="table-container">
          <table className="table">
            <thead><tr><th>#</th><th>{t('fin.str_198')}</th><th>{t('sys.str_527')}</th><th>{t('fin.str_199')}</th><th>{t('sys.str_528')}</th><th>{t('fin.str_234')}</th><th>{t('sys.str_529')}</th><th>{t('sys.str_530')}</th><th>{t('sys.str_435')}</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px' }}>{t('sys.str_168')}</td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={9}><div className="empty-state"><div className="empty-state-icon">👥</div><div className="empty-state-text">{t('fin.str_238')}</div></div></td></tr>
              ) : customers.map((c, i) => (
                <tr key={c.id}>
                  <td>{i + 1}</td>
                  <td style={{ fontWeight: '600' }}>{c.name}</td>
                  <td dir="ltr" style={{ color: 'var(--text-secondary)' }}>{c.phone || '-'}</td>
                  <td><span className={`badge ${typeBadge(c.type)}`}>{typeLabel(c.type)}</span></td>
                  <td>{c.city || '-'}</td>
                  <td style={{ fontWeight: '600', color: c.balance > 0 ? 'var(--danger-light)' : 'var(--success-light)' }}>{fmt(c.balance)} {t('sys.str_68')}</td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{c.taxNumber || '-'}</td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{c.crNo || '-'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {c.balance > 0 && (
                        <button className="btn btn-sm" 
                          style={{ background: '#25D366', color: '#fff', padding: '4px 8px', border: 'none', borderRadius: '4px' }}
                          onClick={() => sendReminder(c)}
                          disabled={sendingReminderId === c.id}
                          title={t('sys.str_546')}>
                          {sendingReminderId === c.id ? '⏳' : '💬'}
                        </button>
                      )}
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)}>✏️</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(c.id)} style={{ color: 'var(--danger)' }}>🗑️</button>
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
              <div className="modal-title">{editItem ? t('sys.str_547') : t('sys.str_548')}</div>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            
            <Form schema={customerSchema} defaultValues={defaultValues} onSubmit={handleSave} className="space-y-4 p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField name="name" label={t('sys.str_531')} placeholder="اسم العميل" />
                <FormField name="phone" label={t('sys.str_527')} placeholder="رقم الجوال" dir="ltr" />
                
                <FormSelect 
                  name="type" 
                  label={t('fin.str_199')} 
                  options={[
                    { label: t('sys.str_532'), value: '0' },
                    { label: t('sys.str_533'), value: '1' },
                    { label: t('sys.str_525'), value: '2' }
                  ]} 
                />

                <FormSelect 
                  name="routeId" 
                  label={t('sys.str_534')} 
                  options={[
                    { label: t('sys.str_535'), value: '' },
                    ...routes.map(r => ({ label: r.name, value: r.id.toString() }))
                  ]} 
                />

                <FormField name="city" label={t('sys.str_528')} />
                <FormField name="district" label={t('sys.str_536')} />
                <FormField name="street" label={t('sys.str_537')} />
                <FormField name="buildingNumber" label={t('sys.str_538')} />
                <FormField name="postalCode" label={t('sys.str_539')} dir="ltr" />
                <FormField name="taxNumber" label={t('sys.str_529')} dir="ltr" />
                <FormField name="crNo" label={t('sys.str_530')} dir="ltr" />
                <FormField name="creditLimit" type="number" label={t('sys.str_540')} dir="ltr" />
              </div>

              <FormTextarea name="notes" label={t('sys.str_465')} rows={2} />

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
