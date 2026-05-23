'use client';
import React, { useState, useEffect } from 'react';
import { Microscope, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const formSchema = z.object({
  manufacturingOrderId: z.string().min(1, 'أمر التصنيع مطلوب'),
  inspectedQuantity: z.number().min(0.01, 'يجب أن تكون الكمية المفحوصة أكبر من 0'),
  passedQuantity: z.number().min(0, 'لا يمكن أن تكون سالبة'),
  failedQuantity: z.number().min(0, 'لا يمكن أن تكون سالبة'),
  notes: z.string().optional().nullable()
});

type FormValues = z.infer<typeof formSchema>;

export default function QCPage() {
    const { lang } = useTranslation();
        const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
 const { success, info, error: toastError } = useToast();

 const [orders, setOrders] = useState([]);
 const [checks, setChecks] = useState([]);
 const [loading, setLoading] = useState(true);
 const [showForm, setShowForm] = useState(false);
 const [saving, setSaving] = useState(false);

 const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
     resolver: zodResolver(formSchema),
     defaultValues: {
         manufacturingOrderId: '',
         inspectedQuantity: undefined,
         passedQuantity: undefined,
         failedQuantity: undefined,
         notes: ''
     }
 });

 useEffect(() => { fetchData(); }, []);

 const fetchData = async () => {
   setLoading(true);
   try {
     const [woRes, qcRes] = await Promise.all([
       fetch('/api/manufacturing/work-orders'),
       fetch('/api/manufacturing/quality-control')
     ]);
     const woData = await woRes.json();
     const qcData = await qcRes.json();
     if (woRes.ok) setOrders(woData.filter((o:any) => o.status === 'in_progress' || o.status === 'completed'));
     if (qcRes.ok) setChecks(qcData);
   } catch (error) {
     console.error('Error fetching data', error);
   } finally {
     setLoading(false);
   }
 };

 const onSubmit = async (data: FormValues) => {
   setSaving(true);
   try {
     const res = await fetch('/api/manufacturing/quality-control', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(data)
     });
     if (res.ok) {
       setShowForm(false);
       fetchData();
       reset();
       success('تم تسجيل الفحص بنجاح');
     } else {
         const d = await res.json();
         toastError(d.message || 'حدث خطأ');
     }
   } catch (error) {
     console.error('Error creating QC log', error);
     toastError('حدث خطأ أثناء الاتصال بالخادم');
   } finally {
       setSaving(false);
   }
 };

 return (
 <div className="p-6">
 <div className="flex justify-between items-center mb-6">
 <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
 <Microscope className="w-6 h-6 text-blue-600" />
 {_t('بوابة الجودة والمطابقة (جودة تحكم)', 'بوابة الجودة والمطابقة (Quality Control)')}</h1>
 <button 
 onClick={() => { setShowForm(!showForm); reset(); }}
 className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
 >
 <CheckCircle className="w-5 h-5" /> تسجيل فحص جديد
 </button>
 </div>

 {showForm && (
 <div className="bg-white p-6 rounded shadow mb-6 border-t-4 border-blue-500">
 <h2 className="text-xl font-semibold mb-4">نموذج الفحص المخزني</h2>
 <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <label className="block text-sm text-slate-700 mb-1">أمر التصنيع المرتبط</label>
 <select 
    className={`w-full border p-2 rounded ${errors.manufacturingOrderId ? 'border-red-500' : ''}`} 
    {...register('manufacturingOrderId')}
 >
 <option value="">اختر أمر التصنيع...</option>
 {orders.map((o: any) => (
 <option key={o.id} value={o.id}>{o.orderNumber} - {o.recipe?.name}</option>
 ))}
 </select>
 {errors.manufacturingOrderId && <span className="text-red-500 text-xs mt-1 block">{errors.manufacturingOrderId.message}</span>}
 </div>
 <div>
 <label className="block text-sm text-slate-700 mb-1">الكمية المفحوصة (إجمالي)</label>
 <input 
    type="number" 
    step="any"
    className={`w-full border p-2 rounded ${errors.inspectedQuantity ? 'border-red-500' : ''}`} 
    {...register('inspectedQuantity', { valueAsNumber: true })}
 />
 {errors.inspectedQuantity && <span className="text-red-500 text-xs mt-1 block">{errors.inspectedQuantity.message}</span>}
 </div>
 <div>
 <label className="block text-sm text-green-700 font-bold mb-1">الكمية المطابقة (نجاح)</label>
 <input 
    type="number" 
    step="any"
    className={`w-full border p-2 rounded border-green-300 ${errors.passedQuantity ? 'border-red-500' : ''}`} 
    {...register('passedQuantity', { valueAsNumber: true })}
 />
 {errors.passedQuantity && <span className="text-red-500 text-xs mt-1 block">{errors.passedQuantity.message}</span>}
 </div>
 <div>
 <label className="block text-sm text-red-700 font-bold mb-1">الكمية التالفة (هدر / Scrap)</label>
 <input 
    type="number" 
    step="any"
    className={`w-full border p-2 rounded border-red-300 ${errors.failedQuantity ? 'border-red-500' : ''}`} 
    {...register('failedQuantity', { valueAsNumber: true })}
 />
 {errors.failedQuantity && <span className="text-red-500 text-xs mt-1 block">{errors.failedQuantity.message}</span>}
 </div>
 <div className="md:col-span-2">
 <label className="block text-sm text-slate-700 mb-1">ملاحظات الفاحص (أسباب الرفض إن وجدت)</label>
 <textarea 
    className="w-full border p-2 rounded" 
    rows={3} 
    {...register('notes')}
 ></textarea>
 </div>
 <div className="md:col-span-2 flex justify-end gap-3">
 <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 rounded text-slate-600 bg-slate-100 hover:bg-slate-200">إلغاء</button>
 <button type="submit" disabled={saving} className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50">
     {saving ? 'جاري الحفظ...' : 'اعتماد الفحص'}
 </button>
 </div>
 </form>
 </div>
 )}

 <div className="bg-white rounded shadow overflow-hidden">
 <table className="min-w-full text-right">
 <thead className="bg-slate-50 border-b">
 <tr>
 <th className="px-6 py-3 text-slate-500 font-medium">رقم الأمر</th>
 <th className="px-6 py-3 text-slate-500 font-medium">التاريخ</th>
 <th className="px-6 py-3 text-slate-500 font-medium">الكمية المفحوصة</th>
 <th className="px-6 py-3 text-slate-500 font-medium">المطابق</th>
 <th className="px-6 py-3 text-slate-500 font-medium">التالف (Scrap)</th>
 <th className="px-6 py-3 text-slate-500 font-medium">النتيجة المحاسبية</th>
 </tr>
 </thead>
 <tbody className="divide-y">
 {loading ? <tr><td colSpan={6} className="text-center py-4">جاري التحميل...</td></tr> :
 checks.length === 0 ? <tr><td colSpan={6} className="text-center py-4">لا توجد سجلات فحص</td></tr> :
 checks.map((c: any) => (
 <tr key={c.id} className="hover:bg-slate-50">
 <td className="px-6 py-4 font-medium text-blue-600">{c.order?.orderNumber}</td>
 <td className="px-6 py-4 text-slate-600">{new Date(c.checkDate).toLocaleDateString('ar-SA')}</td>
 <td className="px-6 py-4">{c.inspectedQuantity}</td>
 <td className="px-6 py-4 text-green-600 font-bold">{c.passedQuantity}</td>
 <td className="px-6 py-4 text-red-600 font-bold">{c.failedQuantity}</td>
 <td className="px-6 py-4">
 {c.failedQuantity > 0 ? (
 <span className="flex items-center gap-1 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
 <AlertTriangle className="w-3 h-3"/> تم تحميل هدر مالي
 </span>
 ) : (
 <span className="flex items-center gap-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
 <CheckCircle className="w-3 h-3"/> لا يوجد هدر
 </span>
 )}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 );
}
