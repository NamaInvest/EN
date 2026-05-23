'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { useParams } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const formSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.number().min(0.01, 'Amount must be positive'),
  expenseAccountId: z.string(),
  allocationMethod: z.string()
});

type FormValues = z.infer<typeof formSchema>;

export default function LandedCostPage() {
  const { lang } = useTranslation();
  const { error: toastError, success: toastSuccess } = useToast();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
  const params = useParams();
  const poId = params?.poId as string;

  const [costs, setCosts] = useState<any[]>([]);
  const [po, setPo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: '',
      amount: 0,
      expenseAccountId: '1',
      allocationMethod: 'value'
    }
  });

  useEffect(() => {
    if (poId) {
      fetchData();
    }
  }, [poId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [poRes, costsRes] = await Promise.all([
        fetch(`/api/purchases/po/${poId}`), // Assumes this exists
        fetch(`/api/purchases/po/${poId}/landed-costs`)
      ]);
      
      if (poRes.ok) {
        const poData = await poRes.json();
        setPo(poData.data || poData);
      }
      if (costsRes.ok) {
        const costsData = await costsRes.json();
        setCosts(costsData.data || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const closeAndReset = () => {
    setShowModal(false);
    reset();
  };

  const handleAddCost = async (data: FormValues) => {
    try {
      const res = await fetch(`/api/purchases/po/${poId}/landed-costs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        toastSuccess('تم إضافة التكلفة بنجاح');
        closeAndReset();
        fetchData();
      } else {
        toastError('فشلت إضافة التكلفة');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleAllocate = async (costId: string) => {
    if (!confirm('هل أنت متأكد من تخصيص هذه التكلفة؟ سيؤدي ذلك إلى تحديث تكلفة المخزون.')) return;
    
    try {
      const res = await fetch(`/api/purchases/po/${poId}/landed-costs/${costId}/allocate`, {
        method: 'POST'
      });
      if (res.ok) {
        toastSuccess('تم التخصيص بنجاح');
        fetchData();
      } else {
        toastError('فشل التخصيص');
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">تخصيص التكاليف الإضافية (Landed Costs)</h1>
          <p className="text-gray-500 mt-1">توزيع مصاريف الشحن، الجمارك، والتأمين على أصناف أمر الشراء رقم PO-{poId}</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          + إضافة تكلفة جديدة
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-bold mb-4 dark:text-white">التكاليف المسجلة</h2>
        {loading ? (
          <div className="text-center py-4">جاري التحميل...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-right text-xs font-medium text-gray-500 uppercase">الوصف</th>
                  <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-right text-xs font-medium text-gray-500 uppercase">المبلغ</th>
                  <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-right text-xs font-medium text-gray-500 uppercase">طريقة التوزيع</th>
                  <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-center text-xs font-medium text-gray-500 uppercase">الحالة</th>
                  <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-center text-xs font-medium text-gray-500 uppercase">إجراء</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {costs.map((c: any) => (
                  <tr key={c.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{c.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-bold">{c.amount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {c.allocationMethod === 'value' ? 'حسب القيمة (Value)' : 'حسب الكمية (Quantity)'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {c.isAllocated ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">تم التوزيع</span>
                      ) : (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold">معلق</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                      {!c.isAllocated && (
                        <button 
                          onClick={() => handleAllocate(c.id)} 
                          className="text-blue-600 hover:text-blue-900 font-bold"
                        >
                          توزيع التكلفة
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {costs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">لا توجد تكاليف إضافية مسجلة.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Cost Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={closeAndReset}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4 dark:text-white">إضافة تكلفة شحن/جمارك</h2>
            <form onSubmit={handleSubmit(handleAddCost)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">الوصف (نوع التكلفة)</label>
                <input 
                  type="text" 
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 dark:bg-gray-700 dark:text-white"
                  {...register('description')}
                  placeholder="مثال: رسوم شحن DHL"
                />
                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">المبلغ</label>
                <input 
                  type="number" 
                  step="0.01"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 dark:bg-gray-700 dark:text-white"
                  {...register('amount')}
                />
                {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">طريقة التوزيع</label>
                <select 
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 dark:bg-gray-700 dark:text-white"
                  {...register('allocationMethod')}
                >
                  <option value="value">{_t('توزيع حسب القيمة الإجمالية للصنف (بواسطة قيمة)', 'توزيع حسب القيمة الإجمالية للصنف (By Value)')}</option>
                  <option value="quantity">{_t('توزيع حسب كمية الصنف (بواسطة الكمية)', 'توزيع حسب كمية الصنف (By Quantity)')}</option>
                </select>
                {errors.allocationMethod && <p className="text-red-500 text-xs mt-1">{errors.allocationMethod.message}</p>}
              </div>
              <div className="flex justify-end space-x-2 rtl:space-x-reverse pt-4">
                <button type="button" onClick={closeAndReset} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md dark:text-gray-300 dark:hover:bg-gray-700">إلغاء</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">حفظ التكلفة</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
