'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from "@/lib/i18n";
import { useToast } from '@/components/Toast';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FileText, Search, Plus, ShoppingCart, Clock, CheckCircle, AlertCircle, X, Trash2, Package } from 'lucide-react';

const fontImport = `@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Fira+Sans:wght@300;400;500;600;700&display=swap');`;

const itemSchema = z.object({
  productId: z.string().optional(),
  productName: z.string().min(1, 'Product name is required'),
  quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
  price: z.number().min(0, 'Price must be positive'),
});

const formSchema = z.object({
  supplierId: z.string().min(1, 'Supplier is required'),
  notes: z.string().optional(),
  items: z.array(itemSchema).min(1, 'At least one item is required')
});

type FormValues = z.infer<typeof formSchema>;

interface OrderDetail { 
  productId: number; 
  productName: string;
  quantity: number; 
  price: number; 
  taxValue: number;
  total: number;
}

interface Order { 
  id: number; 
  orderNo: number; 
  date: string; 
  total: number; 
  taxValue: number; 
  subtotal: number; 
  status: string; 
  notes: string; 
  supplier?: { id: number; name: string };
  user?: { fullName: string };
  details: OrderDetail[];
}

export default function PurchaseOrdersPage() {
  const { t, lang } = useTranslation();
  const { error: toastError, success: toastSuccess } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const [showModal, setShowModal] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      supplierId: '',
      notes: '',
      items: [{ productId: '1', productName: 'صنف جديد', quantity: 1, price: 0 }]
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  useEffect(() => { 
    load(); 
    fetchSuppliers();
  }, []);

  async function fetchSuppliers() {
    try {
      const res = await fetch('/api/customers?type=1');
      if (res.ok) setSuppliers(await res.json());
    } catch(e){}
  }
  
  async function load() { 
    setLoading(true); 
    try { 
      const r = await fetch('/api/purchase-orders'); 
      if (r.ok) setOrders(await r.json()); 
    } catch (e: any) { toastError(e?.message || 'حدث خطأ'); } 
    setLoading(false); 
  };

  const fmt = (n: number) => n.toLocaleString('en-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-xs font-bold border border-amber-200">بانتظار الاعتماد</span>;
      case 'approved': return <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-bold border border-blue-200">معتمد</span>;
      case 'rejected': return <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-xs font-bold border border-red-200">مرفوض</span>;
      case 'completed': return <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-bold border border-emerald-200">مكتمل</span>;
      default: return <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 rounded-full text-xs font-bold border border-slate-200">{status}</span>;
    }
  };

  const updateStatus = async (id: number, newStatus: string) => {
    try {
      const res = await fetch(`/api/purchase-orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        load();
        toastSuccess('تم تحديث حالة الأمر بنجاح');
      } else {
        toastError(t('sys.str_960'));
      }
    } catch (e) {
      console.error(e);
      toastError(t('sys.str_961'));
    }
  };

  const handleCreateOrder = async (data: FormValues) => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch('/api/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        setShowModal(false);
        reset({
          supplierId: '',
          notes: '',
          items: [{ productId: '1', productName: 'صنف جديد', quantity: 1, price: 0 }]
        });
        toastSuccess('تم إنشاء أمر الشراء بنجاح');
        load();
      } else {
        toastError(t('sys.str_962'));
      }
    } catch (err: any) { toastError(err?.message || 'حدث خطأ'); }
    setSaving(false);
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(o => 
      o.orderNo.toString().includes(searchQuery) ||
      (o.supplier?.name || '').includes(searchQuery) ||
      (o.user?.fullName || '').includes(searchQuery)
    );
  }, [orders, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] p-6 lg:p-10 transition-colors duration-300" style={{ fontFamily: "'Fira Sans', sans-serif" }} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <style dangerouslySetInnerHTML={{ __html: fontImport }} />
      
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white dark:bg-[#0F172A] p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 gap-4">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl relative overflow-hidden group">
              <ShoppingCart className="w-8 h-8 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">{t('sys.str_942')}</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">إدارة أوامر الشراء واعتمادات الموردين</p>
            </div>
          </div>
          <button onClick={() => setShowModal(true)} className="flex items-center px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-bold shadow-sm shadow-indigo-500/20">
            <Plus className="w-5 h-5 ml-2" /> {t('sys.str_944')}
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border-r-4 border-r-indigo-500 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">إجمالي الأوامر</p>
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white font-[Fira_Code]">{orders.length}</h3>
              </div>
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                <FileText className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border-r-4 border-r-amber-500 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">بانتظار الاعتماد</p>
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white font-[Fira_Code]">
                  {orders.filter(o => o.status === 'pending').length}
                </h3>
              </div>
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
                <Clock className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border-r-4 border-r-emerald-500 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">أوامر مكتملة</p>
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white font-[Fira_Code]">
                  {orders.filter(o => o.status === 'completed').length}
                </h3>
              </div>
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border-r-4 border-r-blue-500 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">القيمة الإجمالية</p>
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white font-[Fira_Code]">
                  {fmt(orders.reduce((acc, curr) => acc + curr.total, 0))}
                </h3>
              </div>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                <ShoppingCart className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and List */}
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm flex flex-col">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
             <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث برقم الأمر أو المورد..." 
                className="pl-4 pr-10 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors w-full"
              />
            </div>
          </div>

          <div className="p-4 space-y-4">
            {loading ? (
              <div className="p-10 text-center text-slate-500 font-bold">جاري تحميل البيانات...</div>
            ) : filteredOrders.length === 0 ? (
               <div className="p-10 text-center text-slate-500 font-bold border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">لا توجد أوامر شراء مطابقة</div>
            ) : (
              filteredOrders.map(o => (
                <div key={o.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors cursor-pointer group" onClick={() => setExpanded(expanded === o.id ? null : o.id)}>
                  <div className="p-5 flex flex-wrap items-center gap-6">
                    <div className="flex-1 flex items-center gap-4 min-w-[200px]">
                      <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-lg group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 transition-colors">
                        <FileText className="w-6 h-6 text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white font-[Fira_Code]">#{o.orderNo}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{o.supplier?.name || t('sys.str_963')}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6 flex-wrap">
                      <div className="text-left rtl:text-right">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">بواسطة</p>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{o.user?.fullName || '--'}</p>
                      </div>
                      <div className="text-left rtl:text-right">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">التاريخ</p>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300 font-[Fira_Code]">{new Date(o.date).toLocaleDateString('en-GB')}</p>
                      </div>
                      <div>
                        {getStatusBadge(o.status)}
                      </div>
                      <div className="text-left rtl:text-right ml-4 rtl:ml-0 rtl:mr-4">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">الإجمالي</p>
                        <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400 font-[Fira_Code]">{fmt(o.total)} {t('sys.str_68')}</p>
                      </div>
                    </div>
                  </div>

                  {expanded === o.id && (
                    <div className="bg-slate-50 dark:bg-[#0b1120] border-t border-slate-200 dark:border-slate-700 p-5 cursor-default" onClick={(e) => e.stopPropagation()}>
                      <table className="w-full text-right text-sm">
                        <thead className="text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                          <tr>
                            <th className="pb-3 font-bold">{t('sys.str_63')}</th>
                            <th className="pb-3 font-bold text-center">{t('sys.str_64')}</th>
                            <th className="pb-3 font-bold text-center">{t('sys.str_65')}</th>
                            <th className="pb-3 font-bold text-center">{t('sys.str_946')}</th>
                            <th className="pb-3 font-bold text-center">{t('sys.str_947')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-[Fira_Code]">
                          {o.details?.map((item, i) => (
                            <tr key={i}>
                              <td className="py-3 text-slate-900 dark:text-slate-200 font-bold">{item.productName || `منتج #${item.productId}`}</td>
                              <td className="py-3 text-center text-slate-700 dark:text-slate-300">{item.quantity}</td>
                              <td className="py-3 text-center text-slate-700 dark:text-slate-300">{fmt(item.price)}</td>
                              <td className="py-3 text-center text-slate-700 dark:text-slate-300">{fmt(item.taxValue)}</td>
                              <td className="py-3 text-center font-bold text-slate-900 dark:text-slate-100">{fmt(item.total)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      
                      <div className="mt-5 flex gap-3 justify-end border-t border-slate-200 dark:border-slate-700 pt-5">
                        {o.status === 'pending' && (
                          <>
                            <button onClick={() => updateStatus(o.id, 'rejected')} className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-lg font-bold text-sm transition-colors border border-red-200 dark:border-red-800/30">
                              {t('sys.str_948')}
                            </button>
                            <button onClick={() => updateStatus(o.id, 'approved')} className="px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 rounded-lg font-bold text-sm transition-colors border border-emerald-200 dark:border-emerald-800/30">
                              {t('sys.str_949')}
                            </button>
                          </>
                        )}
                        {o.status === 'approved' && (
                          <>
                            <button onClick={() => router.push(`/purchase-orders/${o.id}/landed-costs`)} className="px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 rounded-lg font-bold text-sm transition-colors border border-indigo-200 dark:border-indigo-800/30">
                              {t('sys.str_950')}
                            </button>
                            <button onClick={() => updateStatus(o.id, 'completed')} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm transition-colors shadow-sm shadow-indigo-500/20">
                              {t('sys.str_951')}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Create Order Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
                <Package className="w-6 h-6 ml-2 text-indigo-600 dark:text-indigo-400" />
                {t('sys.str_952')}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit(handleCreateOrder)} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{t('sys.str_953')}</label>
                  <select 
                    {...register('supplierId')}
                    className={`w-full px-4 py-2.5 bg-white dark:bg-slate-800 border rounded-xl text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500 transition-colors ${errors.supplierId ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'}`}
                  >
                    <option value="">{t('sys.str_954')}</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  {errors.supplierId && <span className="text-red-500 text-xs font-bold mt-1 block">{errors.supplierId.message}</span>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{t('sys.str_955')}</label>
                  <input 
                    type="text" 
                    {...register('notes')}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-3 mb-4">{t('sys.str_956')}</h3>
                {errors.items?.root && <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm font-bold mb-4">{errors.items.root.message}</div>}
                
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  <table className="w-full text-right">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-sm">
                      <tr>
                        <th className="px-4 py-3 font-bold">{t('sys.str_957')}</th>
                        <th className="px-4 py-3 font-bold w-24 text-center">{t('sys.str_64')}</th>
                        <th className="px-4 py-3 font-bold w-32 text-center">{t('sys.str_958')}</th>
                        <th className="px-4 py-3 font-bold w-16"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {fields.map((field, idx) => (
                        <tr key={field.id} className="bg-white dark:bg-slate-900">
                          <td className="px-4 py-3">
                            <input 
                              className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-colors ${errors.items?.[idx]?.productName ? 'border-red-500' : 'border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white'}`} 
                              {...register(`items.${idx}.productName` as const)} 
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input 
                              type="number" step="0.01" 
                              className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg text-sm font-bold text-center focus:ring-2 focus:ring-indigo-500 transition-colors ${errors.items?.[idx]?.quantity ? 'border-red-500' : 'border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white'}`} 
                              {...register(`items.${idx}.quantity` as const, { valueAsNumber: true })} 
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input 
                              type="number" step="0.01" 
                              className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg text-sm font-bold text-center focus:ring-2 focus:ring-indigo-500 transition-colors ${errors.items?.[idx]?.price ? 'border-red-500' : 'border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white'}`} 
                              {...register(`items.${idx}.price` as const, { valueAsNumber: true })} 
                            />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button type="button" onClick={() => remove(idx)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
                    <button type="button" onClick={() => append({ productId: '1', productName: '', quantity: 1, price: 0 })} className="flex items-center text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700">
                      <Plus className="w-4 h-4 ml-1" /> {t('sys.str_959')}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-800 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-bold transition-colors">
                  {t('fin.str_206')}
                </button>
                <button type="submit" disabled={saving} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm shadow-indigo-500/20 transition-colors disabled:opacity-50">
                  {saving ? t('sys.str_454') : t('sys.str_964')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
