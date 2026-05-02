'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from "@/lib/i18n";
import { useToast } from '@/components/Toast';

export default function SerialNumbersPage() {
    const { success, info } = useToast();

    const { t } = useTranslation();
  const [serials, setSerials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/inv/serials')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setSerials(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-6" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('sys.str_4650')}</h1>
        <button onClick={() => info(_t('ميزة تحت التطوير', 'Feature in development'))}  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition">
          {t('sys.str_4651')}</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">{t('sys.str_4652')}</div>
        ) : serials.length === 0 ? (
          <div className="p-8 text-center text-slate-500">{t('sys.str_4653')}</div>
        ) : (
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <th className="p-4 font-semibold">{t('sys.str_2226')}</th>
                <th className="p-4 font-semibold">{t('sys.str_957')}</th>
                <th className="p-4 font-semibold">{t('sys.str_2227')}</th>
                <th className="p-4 font-semibold">{t('sys.str_4654')}</th>
                <th className="p-4 font-semibold">{t('sys.str_4655')}</th>
              </tr>
            </thead>
            <tbody>
              {serials.map((sn, i) => (
                <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition">
                  <td className="p-4 font-mono font-bold text-slate-800 tracking-wider text-left" dir="ltr">{sn.serialNumber}</td>
                  <td className="p-4 text-slate-700">{sn.product?.name || t('sys.str_4656')}</td>
                  <td className="p-4 text-slate-600">{sn.stock?.name || t('sys.str_753')}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      sn.status === 'IN_STOCK' ? 'bg-green-100 text-green-700' : 
                      sn.status === 'SOLD' ? 'bg-slate-100 text-slate-600' : 'bg-red-100 text-red-700'
                    }`}>
                      {sn.status === 'IN_STOCK' ? t('sys.str_4657') : sn.status === 'SOLD' ? t('sys.str_4658') : sn.status}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-slate-500">{new Date(sn.createdAt).toLocaleDateString('en-GB')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
