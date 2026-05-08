'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from "@/lib/i18n";
import { useToast } from '@/components/Toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const formSchema = z.object({
  title: z.string().min(1, 'العنوان مطلوب'),
  provider: z.string().min(1, 'الجهة التدريبية مطلوبة'),
  startDate: z.string().min(1, 'تاريخ البداية مطلوب'),
  endDate: z.string().min(1, 'تاريخ النهاية مطلوب'),
  cost: z.number().min(0, 'التكلفة يجب أن تكون أكبر من أو تساوي 0').optional().nullable(),
  status: z.string().min(1, 'الحالة مطلوبة')
});

type FormValues = z.infer<typeof formSchema>;

export default function TrainingCoursesPage() {
 const { t } = useTranslation();
 const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast();
 const [courses, setCourses] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 const [showModal, setShowModal] = useState(false);
 const [saving, setSaving] = useState(false);

 const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
     resolver: zodResolver(formSchema),
     defaultValues: {
         title: '',
         provider: '',
         startDate: '',
         endDate: '',
         cost: undefined,
         status: 'SCHEDULED'
     }
 });

 useEffect(() => {
 loadData();
 }, []);

 const loadData = async () => {
 setLoading(true);
 try {
 const res = await fetch('/api/hr/training');
 const data = await res.json();
 if (Array.isArray(data)) setCourses(data);
 } catch (e: any) { toastError(e?.message || 'حدث خطأ'); }
 setLoading(false);
 };

 const onSubmit = async (data: FormValues) => {
 setSaving(true);
 try {
 const res = await fetch('/api/hr/training', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 ...data,
 cost: data.cost || 0
 })
 });
 if (res.ok) {
 setShowModal(false);
 reset();
 loadData();
 } else {
 toastWarning(t('sys.str_4646'));
 }
 } catch (error: any) { toastError(error?.message || 'حدث خطأ'); } finally {
     setSaving(false);
 }
 };

 return (
 <div className="p-6" dir="rtl">
 <div className="flex justify-between items-center mb-6">
 <h1 className="text-2xl font-bold">{t('sys.str_4628')}</h1>
 <button 
 onClick={() => { setShowModal(true); reset(); }}
 className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition">
 {t('sys.str_4629')}</button>
 </div>

 {showModal && (
 <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
 <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in-up">
 <div className="p-6 border-b border-slate-100 flex justify-between items-center">
 <h2 className="text-xl font-bold text-slate-800">{t('sys.str_4630')}</h2>
 <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xl">&times;</button>
 </div>
 <form onSubmit={handleSubmit(onSubmit)} className="p-6">
 <div className="grid grid-cols-2 gap-4">
 <div className="col-span-2">
 <label className="block text-sm font-bold text-slate-700 mb-1">{t('sys.str_4631')}</label>
 <input type="text" className={`w-full p-2 border ${errors.title ? 'border-red-500' : 'border-slate-200'} rounded-lg focus:ring-2 focus:ring-blue-600`} {...register('title')} />
 {errors.title && <span className="text-red-500 text-xs mt-1 block">{errors.title.message}</span>}
 </div>
 <div>
 <label className="block text-sm font-bold text-slate-700 mb-1">{t('sys.str_4632')}</label>
 <input type="text" className={`w-full p-2 border ${errors.provider ? 'border-red-500' : 'border-slate-200'} rounded-lg focus:ring-2 focus:ring-blue-600`} {...register('provider')} />
 {errors.provider && <span className="text-red-500 text-xs mt-1 block">{errors.provider.message}</span>}
 </div>
 <div>
 <label className="block text-sm font-bold text-slate-700 mb-1">{t('sys.str_4633')}</label>
 <input type="number" step="any" className={`w-full p-2 border ${errors.cost ? 'border-red-500' : 'border-slate-200'} rounded-lg focus:ring-2 focus:ring-blue-600`} {...register('cost', { valueAsNumber: true })} />
 {errors.cost && <span className="text-red-500 text-xs mt-1 block">{errors.cost.message}</span>}
 </div>
 <div>
 <label className="block text-sm font-bold text-slate-700 mb-1">{t('sys.str_1860')}</label>
 <input type="date" className={`w-full p-2 border ${errors.startDate ? 'border-red-500' : 'border-slate-200'} rounded-lg focus:ring-2 focus:ring-blue-600`} {...register('startDate')} />
 {errors.startDate && <span className="text-red-500 text-xs mt-1 block">{errors.startDate.message}</span>}
 </div>
 <div>
 <label className="block text-sm font-bold text-slate-700 mb-1">{t('fin.str_1697')}</label>
 <input type="date" className={`w-full p-2 border ${errors.endDate ? 'border-red-500' : 'border-slate-200'} rounded-lg focus:ring-2 focus:ring-blue-600`} {...register('endDate')} />
 {errors.endDate && <span className="text-red-500 text-xs mt-1 block">{errors.endDate.message}</span>}
 </div>
 <div className="col-span-2">
 <label className="block text-sm font-bold text-slate-700 mb-1">{t('fin.str_227')}</label>
 <select className={`w-full p-2 border ${errors.status ? 'border-red-500' : 'border-slate-200'} rounded-lg focus:ring-2 focus:ring-blue-600`} {...register('status')}>
 <option value="SCHEDULED">{t('sys.str_4634')}</option>
 <option value="ONGOING">{t('sys.str_4635')}</option>
 <option value="COMPLETED">{t('sys.str_4636')}</option>
 <option value="CANCELLED">{t('sys.str_4637')}</option>
 </select>
 {errors.status && <span className="text-red-500 text-xs mt-1 block">{errors.status.message}</span>}
 </div>
 </div>
 <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
 <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-50 rounded-lg">{t('fin.str_206')}</button>
 <button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold shadow-md shadow-blue-600/20 disabled:opacity-50">{saving ? 'جاري الحفظ...' : t('sys.str_4638')}</button>
 </div>
 </form>
 </div>
 </div>
 )}

 <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
 {loading ? (
 <div className="p-8 text-center text-slate-500">{t('sys.str_4639')}</div>
 ) : courses.length === 0 ? (
 <div className="p-8 text-center text-slate-500">{t('sys.str_4640')}</div>
 ) : (
 <table className="w-full text-right border-collapse">
 <thead>
 <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
 <th className="p-4 font-semibold">{t('sys.str_4641')}</th>
 <th className="p-4 font-semibold">{t('sys.str_4642')}</th>
 <th className="p-4 font-semibold">{t('sys.str_4643')}</th>
 <th className="p-4 font-semibold">{t('fin.str_227')}</th>
 <th className="p-4 font-semibold">{t('sys.str_4644')}</th>
 </tr>
 </thead>
 <tbody>
 {courses.map(course => (
 <tr key={course.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
 <td className="p-4 font-bold text-slate-800">{course.title}</td>
 <td className="p-4 text-slate-600">{course.provider || '-'}</td>
 <td className="p-4 text-sm text-slate-500">
 <span className="inline-block bg-slate-100 px-2 py-1 rounded text-xs ml-1 font-mono">
 {new Date(course.startDate).toLocaleDateString('en-GB')}
 </span>
 {t('sys.str_1068')}<span className="inline-block bg-slate-100 px-2 py-1 rounded text-xs mr-1 font-mono">
 {new Date(course.endDate).toLocaleDateString('en-GB')}
 </span>
 </td>
 <td className="p-4">
 <span className={`px-2 py-1 rounded text-xs font-bold ${
 course.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
 course.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-700' : 
 course.status === 'ONGOING' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
 }`}>
 {course.status === 'COMPLETED' ? t('hr.str_2185') : 
 course.status === 'SCHEDULED' ? t('sys.str_4647') : 
 course.status === 'ONGOING' ? t('sys.str_4648') : t('sys.str_4649')}
 </span>
 </td>
 <td className="p-4 text-slate-600 font-bold">{course.enrollments?.length || 0} <span className="text-xs font-normal">{t('sys.str_4645')}</span></td>
 </tr>
 ))}
 </tbody>
 </table>
 )}
 </div>
 </div>
 );
}
