'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from "@/lib/i18n";
import { useToast } from '@/components/Toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Users, Search, Plus, Edit, Trash2, X, Briefcase, Building, Phone, Calendar, Banknote, UserCheck, UserMinus, ShieldCheck } from 'lucide-react';

const fontImport = `@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Fira+Sans:wght@300;400;500;600;700&display=swap');`;

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
  salary: z.number().min(0, 'الراتب لا يمكن أن يكون سالباً'),
  housingAllowance: z.number().min(0),
  transportAllowance: z.number().min(0),
  otherAllowance: z.number().min(0),
  bankName: z.string().optional(),
  iban: z.string().optional().refine(val => !val || (val.startsWith('SA') && val.length === 24), 'رقم الآيبان يجب أن يبدأ بـ SA ويتكون من 24 خانة'),
  startDate: z.string().optional()
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

export default function EmployeesPage() {
  const { t, lang } = useTranslation();
  const { error: toastError, success: toastSuccess } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Employee | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: '', phone: '', branchId: '', position: '', salary: 0, housingAllowance: 0, transportAllowance: 0, otherAllowance: 0, bankName: '', iban: '', startDate: ''
    }
  });

  async function fetchData() {
    const token = localStorage.getItem('token');
    try {
      const [empRes, bRes] = await Promise.all([
        fetch(`/api/employees`, { headers: { Authorization: `Bearer ${token}` } }),
        branches.length === 0 ? fetch('/api/branches', { headers: { Authorization: `Bearer ${token}` } }) : Promise.resolve(null)
      ]);
      if (empRes.ok) setEmployees(await empRes.json());
      if (bRes && bRes.ok) setBranches(await bRes.json());
    } catch (err: any) { toastError(err?.message || 'حدث خطأ'); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchData(); }, []);

  const openAdd = () => { 
    setEditItem(null);
    reset({
      name: '', phone: '', branchId: '', position: '', salary: 0, housingAllowance: 0, transportAllowance: 0, otherAllowance: 0, bankName: '', iban: '', startDate: ''
    });
    setShowModal(true); 
  };

  const openEdit = (e: Employee) => { 
    setEditItem(e);
    reset({
      name: e.name,
      phone: e.phone || '',
      branchId: e.branchId?.toString() || '',
      position: e.position || '',
      salary: e.salary || 0,
      housingAllowance: e.housingAllowance || 0,
      transportAllowance: e.transportAllowance || 0,
      otherAllowance: e.otherAllowance || 0,
      bankName: e.bankName || '',
      iban: e.iban || '',
      startDate: e.startDate || ''
    });
    setShowModal(true); 
  };

  const handleSave = async (data: EmployeeFormValues) => {
    setSaving(true);
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
    finally { setSaving(false); }
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

  const fmt = (v: number) => new Intl.NumberFormat('en-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

  const filteredEmployees = useMemo(() => {
    return employees.filter(e => 
      e.name.toLowerCase().includes(search.toLowerCase()) || 
      (e.phone && e.phone.includes(search)) ||
      (e.position && e.position.toLowerCase().includes(search.toLowerCase()))
    );
  }, [employees, search]);

  const totalSalary = employees.reduce((acc, e) => acc + (e.salary || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] p-6 lg:p-10 transition-colors duration-300" style={{ fontFamily: "'Fira Sans', sans-serif" }} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <style dangerouslySetInnerHTML={{ __html: fontImport }} />
      
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white dark:bg-[#0F172A] p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 gap-4">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl relative overflow-hidden group">
              <Users className="w-8 h-8 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">{t('hr.str_553')}</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">إدارة الكوادر البشرية، الرواتب، والبدلات</p>
            </div>
          </div>
          <button onClick={openAdd} className="flex items-center px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-bold shadow-sm shadow-indigo-500/20">
            <Plus className="w-5 h-5 ml-2" /> {t('hr.str_555')}
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border-r-4 border-r-indigo-500 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">إجمالي الموظفين</p>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white font-[Fira_Code]">{employees.length}</h3>
            </div>
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border-r-4 border-r-emerald-500 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">موظفون نشطون</p>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white font-[Fira_Code]">{employees.filter(e => e.active !== false).length}</h3>
            </div>
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <UserCheck className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border-r-4 border-r-amber-500 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">إجمالي الرواتب الأساسية</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white font-[Fira_Code]">{fmt(totalSalary)} {t('sys.str_68')}</h3>
            </div>
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl">
              <Banknote className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border-r-4 border-r-blue-500 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">نسبة التسجيل البنكي</p>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white font-[Fira_Code]">
                {employees.length ? Math.round((employees.filter(e => e.iban).length / employees.length) * 100) : 0}%
              </h3>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm flex flex-col">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50 dark:bg-slate-900/50">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
              قائمة الموظفين
            </h2>
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('hr.str_568')} 
                className="pl-4 pr-10 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors w-full"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-10 text-center text-slate-500 font-bold">جاري تحميل البيانات...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-4 font-bold">#</th>
                    <th className="px-6 py-4 font-bold">{t('fin.str_198')}</th>
                    <th className="px-6 py-4 font-bold">معلومات التواصل</th>
                    <th className="px-6 py-4 font-bold">{t('hr.str_557')} / {t('hr.str_556')}</th>
                    <th className="px-6 py-4 font-bold">الراتب الأساسي</th>
                    <th className="px-6 py-4 font-bold text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-500 font-bold">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <UserMinus className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                          <p>{t('hr.str_559')}</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredEmployees.map((e, i) => (
                    <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                      <td className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 font-[Fira_Code]">{i + 1}</td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 dark:text-slate-200">{e.name}</div>
                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {e.startDate || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-700 dark:text-slate-300 font-[Fira_Code] dir-ltr flex justify-end rtl:justify-start">
                          {e.phone || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-2 py-1 rounded text-xs font-bold border border-indigo-200 dark:border-indigo-800/30">
                            {e.position || 'غير محدد'}
                          </span>
                          <span className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                            <Building className="w-3 h-3" /> {e.branch?.name || 'بدون فرع'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-emerald-600 dark:text-emerald-400 font-[Fira_Code]">
                        {fmt(e.salary)} {t('sys.str_68')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEdit(e)} className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => handleDelete(e.id)} className="p-2 text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors">
                            <Trash2 size={16} />
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
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
                <Briefcase className="w-6 h-6 ml-2 text-indigo-600 dark:text-indigo-400" />
                {editItem ? t('sys.str_547') : t('hr.str_555')}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit(handleSave)} className="flex-1 overflow-y-auto p-6">
              
              {/* Personal Details */}
              <div className="mb-8">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2 mb-4 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-indigo-500" /> البيانات الأساسية
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{t('sys.str_531')} *</label>
                    <input type="text" {...register('name')} className={`w-full px-4 py-2 bg-white dark:bg-slate-800 border rounded-xl text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500 transition-colors ${errors.name ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'}`} />
                    {errors.name && <span className="text-red-500 text-xs font-bold mt-1 block">{errors.name.message}</span>}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{t('sys.str_527')}</label>
                    <input type="text" {...register('phone')} dir="ltr" className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{t('hr.str_556')}</label>
                    <select {...register('branchId')} className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500 transition-colors">
                      <option value="">{t('hr.str_560')}</option>
                      {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{t('hr.str_557')}</label>
                    <input type="text" {...register('position')} className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{t('sys.str_506')}</label>
                    <input type="date" {...register('startDate')} dir="ltr" className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500 transition-colors" />
                  </div>
                </div>
              </div>

              {/* Salary & Allowances */}
              <div className="mb-8">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2 mb-4 flex items-center gap-2">
                  <Banknote className="w-5 h-5 text-indigo-500" /> بيانات الراتب والبدلات
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">{t('hr.str_561')}</label>
                    <input type="number" step="0.01" {...register('salary', { valueAsNumber: true })} dir="ltr" className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">{t('hr.str_562')}</label>
                    <input type="number" step="0.01" {...register('housingAllowance', { valueAsNumber: true })} dir="ltr" className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">{t('hr.str_563')}</label>
                    <input type="number" step="0.01" {...register('transportAllowance', { valueAsNumber: true })} dir="ltr" className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">{t('hr.str_564')}</label>
                    <input type="number" step="0.01" {...register('otherAllowance', { valueAsNumber: true })} dir="ltr" className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500 transition-colors" />
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2 mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-500" /> بيانات الحساب البنكي
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{t('hr.str_565')}</label>
                    <input type="text" {...register('bankName')} className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{t('hr.str_566')}</label>
                    <input type="text" {...register('iban')} dir="ltr" placeholder="SA..." className={`w-full px-4 py-2 bg-white dark:bg-slate-800 border rounded-xl text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500 transition-colors font-[Fira_Code] ${errors.iban ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'}`} />
                    {errors.iban && <span className="text-red-500 text-xs font-bold mt-1 block">{errors.iban.message}</span>}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-bold transition-colors">
                  {t('fin.str_206')}
                </button>
                <button type="submit" disabled={saving} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm shadow-indigo-500/20 transition-colors disabled:opacity-50">
                  {saving ? t('sys.str_454') : t('sys.str_455')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
