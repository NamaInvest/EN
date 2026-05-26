'use client';
import React, { useEffect, useState } from 'react';
import { Calculator, Loader2, AlertTriangle, MonitorPlay } from 'lucide-react';
import { useTranslation } from "@/lib/i18n";

export default function POSAccountantPage() {
    const { lang } = useTranslation();
    const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/pos/accountant')
            .then(res => res.json())
            .then(d => {
                setData(d);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

  return (
    <div className="p-6" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Calculator className="text-primary" /> {_t('شاشة مراقبة ورديات نقاط البيع الحية', 'POS Sessions Monitor')}
      </h1>
      
      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" size={48} /></div>
      ) : !data || data.error ? (
        <div className="card p-8 text-center text-red-500 border border-red-200 bg-red-50 rounded-xl shadow-sm">
          <AlertTriangle className="mx-auto mb-4" size={48} />
          <p>{_t('فشل تحميل ورديات نقاط البيع.', 'Failed to load POS sessions.')} {data?.error}</p>
        </div>
      ) : data.length === 0 ? (
        <div className="card p-8 text-center border border-(--border) bg-(--bg-secondary) rounded-xl shadow-sm">
          <MonitorPlay className="mx-auto mb-4 text-gray-400" size={48} />
          <p className="text-(--text-muted)">{_t('لا توجد ورديات نقاط بيع نشطة لهذا المستأجر حالياً.', 'No POS sessions found for this tenant.')}</p>
        </div>
      ) : (
        <div className="overflow-x-auto card border border-(--border) rounded-xl shadow-sm">
          <table className="w-full border-collapse" dir={lang === 'ar' ? 'rtl' : 'ltr'} style={{ textAlign: lang === 'ar' ? 'right' : 'left' }}>
            <thead className="bg-(--bg-secondary) border-b border-(--border)">
              <tr>
                <th className="p-4 font-semibold text-sm">{_t('رقم الوردية', 'Session ID')}</th>
                <th className="p-4 font-semibold text-sm">{_t('المستخدم', 'User')}</th>
                <th className="p-4 font-semibold text-sm">{_t('تاريخ الفتح', 'Opened At')}</th>
                <th className="p-4 font-semibold text-sm">{_t('الحالة', 'Status')}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((s: any, i: number) => (
                <tr key={i} className="border-b border-(--border) bg-(--bg-primary) hover:bg-(--bg-secondary) transition-colors">
                  <td className="p-4 font-mono">{s.id}</td>
                  <td className="p-4 font-medium">{s.user?.fullName || _t('غير معروف', 'Unknown')}</td>
                  <td className="p-4 text-sm text-(--text-muted)">{new Date(s.openedAt).toLocaleString()}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${s.closedAt ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'}`}>
                      {s.closedAt ? _t('مغلقة', 'Closed') : _t('نشطة', 'Active')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
