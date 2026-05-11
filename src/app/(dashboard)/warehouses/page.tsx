"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Edit, Trash2, Building, AlertCircle, DollarSign, TrendingUp, AlertTriangle, Search, MapPin, X } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useToast } from '@/components/Toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const fontImport = `@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Fira+Sans:wght@300;400;500;600;700&display=swap');`;

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: z.string().optional(),
  branchId: z.string().optional(),
  isActive: z.boolean()
});

type FormValues = z.infer<typeof formSchema>;

export default function WarehousesPage() {
  const { error: toastError, success: toastSuccess } = useToast();
  const { t, lang } = useTranslation();
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentWarehouse, setCurrentWarehouse] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      address: "",
      branchId: "",
      isActive: true
    }
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const [wRes, bRes, aRes] = await Promise.all([
        fetch("/api/warehouses", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/branches", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/warehouses/analytics", { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (wRes.ok) setWarehouses(await wRes.json());
      if (bRes.ok) setBranches(await bRes.json());
      if (aRes.ok) setAnalytics(await aRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (warehouse: any = null) => {
    if (warehouse) {
      setCurrentWarehouse(warehouse);
      reset({
        name: warehouse.name,
        address: warehouse.address || "",
        branchId: warehouse.branchId?.toString() || "",
        isActive: warehouse.active
      });
    } else {
      setCurrentWarehouse(null);
      reset({
        name: "",
        address: "",
        branchId: "",
        isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (data: FormValues) => {
    setSaving(true);
    const token = localStorage.getItem("token");
    if (!token) {
        setSaving(false);
        return;
    }

    const payload = {
      name: data.name,
      address: data.address,
      branchId: data.branchId ? parseInt(data.branchId) : null,
      active: data.isActive
    };

    try {
      if (currentWarehouse) {
        await fetch(`/api/warehouses/${currentWarehouse.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
        toastSuccess('تم التعديل بنجاح');
      } else {
        await fetch("/api/warehouses", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
        toastSuccess('تمت الإضافة بنجاح');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      toastError("Error saving warehouse.");
    } finally {
        setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t("are_you_sure_delete"))) return;

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`/api/warehouses/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
          toastSuccess('تم الحذف بنجاح');
          fetchData();
      }
      else toastError("Cannot delete warehouse. It might have products or invoices tied to it.");
    } catch (e) {
      toastError('حدث خطأ');
    }
  };

  const filteredWarehouses = useMemo(() => {
    return warehouses.filter(wh => 
      wh.name.includes(searchQuery) || 
      (wh.address && wh.address.includes(searchQuery))
    );
  }, [warehouses, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] p-6 lg:p-10 transition-colors duration-300" style={{ fontFamily: "'Fira Sans', sans-serif" }} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <style dangerouslySetInnerHTML={{ __html: fontImport }} />
      
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white dark:bg-[#0F172A] p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 gap-4">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl relative overflow-hidden group">
              <Building className="w-8 h-8 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">إدارة المستودعات (WMS)</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">تتبع الفروع، السعة التخزينية، وحالة التوفر المباشرة</p>
            </div>
          </div>
          <button onClick={() => handleOpenModal()} className="flex items-center px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-bold shadow-sm shadow-indigo-500/20">
            <Plus className="w-5 h-5 ml-2" /> إضافة مستودع
          </button>
        </div>

        {/* Analytics Banner */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border-r-4 border-r-emerald-500 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">{t('sys.str_1506')}</p>
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white font-[Fira_Code]">{analytics.totalValuationBuy?.toLocaleString()} {t('sys.str_68')}</h3>
              </div>
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
            
            <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border-r-4 border-r-blue-500 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">{t('sys.str_1507')}</p>
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white font-[Fira_Code]">{analytics.expectedProfit?.toLocaleString()} {t('sys.str_68')}</h3>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>

            <a href="/warehouses/alerts" className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border-r-4 border-r-red-500 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between hover:border-red-500 dark:hover:border-red-500 transition-colors group cursor-pointer">
              <div>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">{t('sys.str_1508')}</p>
                <h3 className="text-3xl font-bold text-red-600 dark:text-red-500 font-[Fira_Code]">{analytics.lowStockCount} {t('sys.str_1509')}</h3>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl group-hover:bg-red-600 group-hover:text-white transition-colors">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </a>
          </div>
        )}

        {/* Data Table */}
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm flex flex-col">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50 dark:bg-slate-900/50">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
              قائمة المستودعات النشطة
            </h2>
            <div className="relative w-full sm:w-auto">
              <Search className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث باسم المستودع..." 
                className="pl-4 pr-10 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors w-full sm:w-64"
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
                    <th className="px-6 py-4 font-bold">الاسم</th>
                    <th className="px-6 py-4 font-bold">الفرع التابع له</th>
                    <th className="px-6 py-4 font-bold">العنوان (الموقع)</th>
                    <th className="px-6 py-4 font-bold text-center">الحالة</th>
                    <th className="px-6 py-4 font-bold text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredWarehouses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-500 font-bold">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <AlertCircle className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                          <p>{t("no_warehouses_found")}</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredWarehouses.map((wh) => (
                    <tr key={wh.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                      <td className="px-6 py-4 font-bold text-indigo-600 dark:text-indigo-400 font-[Fira_Code]">#{wh.id}</td>
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-200 flex items-center gap-2">
                        <Building className="w-4 h-4 text-slate-400" /> {wh.name}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">
                        {wh.branch ? wh.branch.name : "-"}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400">
                        {wh.address ? (
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {wh.address}</span>
                        ) : "-"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 inline-block rounded-full text-xs font-bold border ${wh.active ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50" : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/50"}`}>
                          {wh.active ? 'نشط' : 'غير نشط'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleOpenModal(wh)} className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => handleDelete(wh.id)} className="p-2 text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors">
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
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
                <Building className="w-6 h-6 ml-2 text-indigo-600 dark:text-indigo-400" />
                {currentWarehouse ? 'تعديل المستودع' : 'إضافة مستودع'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit(handleSave)} className="p-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{'اسم المستودع'} *</label>
                  <input
                    type="text"
                    className={`w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500 transition-colors ${errors.name ? 'border-red-500' : ''}`}
                    {...register('name')}
                  />
                  {errors.name && <span className="text-red-500 text-xs font-bold mt-1 block">{errors.name.message}</span>}
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{'ارتباط بفرع'} ({'اختياري'})</label>
                  <select
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500 transition-colors"
                    {...register('branchId')}
                  >
                    <option value="">{'بدون فرع'}</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{'العنوان'} ({'اختياري'})</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500 transition-colors"
                    {...register('address')}
                  />
                </div>

                <div className="flex items-center gap-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <input
                    type="checkbox"
                    id="wh-active"
                    className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 dark:bg-slate-900 dark:border-slate-700"
                    {...register('isActive')}
                  />
                  <label htmlFor="wh-active" className="text-sm font-bold select-none cursor-pointer text-slate-900 dark:text-white mr-2">
                    المستودع في حالة نشطة ومتاح للعمليات
                  </label>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-bold transition-colors"
                >
                  {'إلغاء'}
                </button>
                <button 
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm shadow-indigo-500/20 transition-colors disabled:opacity-50"
                >
                  {saving ? 'جاري الحفظ...' : 'حفظ المستودع'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
