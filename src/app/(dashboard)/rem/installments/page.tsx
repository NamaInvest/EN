'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

export default function RentInstallmentsPage() {
    const { lang } = useTranslation();
    const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;

  const [installments, setInstallments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/rem/installments')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setInstallments(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">🏢 إدارة الأملاك - الدفعات والأقساط</h1>
        <button onClick={() => alert('جاري برمجة شاشة التحصيل')} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition">
          + استلام دفعة
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">جاري تحميل الأقساط...</div>
        ) : installments.length === 0 ? (
          <div className="p-8 text-center text-slate-500">لا توجد أقساط مسجلة.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <th className="p-4 font-semibold">تاريخ الاستحقاق</th>
                <th className="p-4 font-semibold">المستأجر</th>
                <th className="p-4 font-semibold">العقد / الوحدة</th>
                <th className="p-4 font-semibold text-right">المبلغ المستحق</th>
                <th className="p-4 font-semibold">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {installments.map(inst => (
                <tr key={inst.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                  <td className="p-4 font-bold text-slate-700">{new Date(inst.dueDate).toLocaleDateString('en-GB')}</td>
                  <td className="p-4">{inst.contract?.tenant?.name || 'مستأجر غير معروف'}</td>
                  <td className="p-4 text-sm text-slate-600">
                    <span className="font-medium">وحدة {inst.contract?.unit?.unitNumber}</span> <br/>
                    <span className="text-slate-400">عقد {inst.contract?.contractNumber}</span>
                  </td>
                  <td className="p-4 font-bold text-right text-rose-600">ر.س {inst.amount.toLocaleString()}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      inst.isPaid ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {inst.isPaid ? 'مدفوع' : 'غير مدفوع'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
