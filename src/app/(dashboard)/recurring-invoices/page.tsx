'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { RefreshCw, Plus, Clock, PlayCircle } from 'lucide-react';
import { useToast } from '@/components/Toast';

// تعريف الواجهة لضمان التحقق من الأنواع بدلاً من استخدام any
interface Contract {
  orderNo: string;
  customerName: string;
  total: number;
  frequency: string;
  nextBillingDate: string;
}

export default function RecurringInvoicesPage() {
  const { t, lang } = useTranslation();
  const { error: toastError, success: toastSuccess } = useToast();
  const isRTL = lang === 'ar';

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [cronResult, setCronResult] = useState<{message?: string, processed?: any[]}>({});
  const [cronLoading, setCronLoading] = useState(false);

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      const res = await fetch('/api/recurring-invoices');
      const data = await res.json();
      setContracts(Array.isArray(data) ? data : []);
    } catch (e: any) { 
      toastError(e?.message || t('sys.str_1059')); 
    } finally {
      setLoading(false);
    }
  };

  const runSimulatedCronJob = async () => {
    setCronLoading(true);
    try {
      const res = await fetch('/api/cron/trigger-invoices');
      const data = await res.json();
      setCronResult(data);
      if(data.success) fetchContracts(); // refresh table dates
    } catch(e: any) {
      toastError(t('sys.str_1059'));
    } finally {
      setCronLoading(false);
    }
  };

  return (
    <div className="bg-transparent min-h-screen">
      <div className="p-6 max-w-7xl mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <RefreshCw className="text-blue-400" size={32} />
              {t('sys.str_1048')}
            </h1>
            <p className="text-slate-400 mt-2">
              {t('sys.str_1049')}
            </p>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={runSimulatedCronJob}
              disabled={cronLoading}
              className="bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 px-4 py-2 rounded-lg flex items-center gap-2 transition"
            >
              <PlayCircle size={18} />
              {cronLoading ? t('sys.str_1060') : t('sys.str_1061')}
            </button>
            <a href="/sales/orders/create" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg">
              <Plus size={18} /> {t('sys.str_1050')}
            </a>
          </div>
        </div>

        {cronResult.message && (
          <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-4 rounded-lg mb-6 flex justify-between items-center">
            <span>{cronResult.message}</span>
            <button onClick={() => setCronResult({})} className="text-white hover:text-red-300">✕</button>
          </div>
        )}

        <div className="bg-surface border border-divider rounded-2xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-10 text-center text-slate-400">{t('sys.str_1051')}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left" dir={isRTL ? 'rtl' : 'ltr'}>
                <thead className="bg-[#111]">
                  <tr>
                    <th className="p-4 text-slate-400 font-medium">{t('sys.str_1052')}</th>
                    <th className="p-4 text-slate-400 font-medium">{t('sys.str_1053')}</th>
                    <th className="p-4 text-slate-400 font-medium">{t('sys.str_1054')}</th>
                    <th className="p-4 text-slate-400 font-medium">{t('sys.str_1055')}</th>
                    <th className="p-4 text-slate-400 font-medium">{t('sys.str_1056')}</th>
                    <th className="p-4 text-slate-400 font-medium">{t('fin.str_227')}</th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.map((contract, idx) => {
                    const isDueSoon = new Date(contract.nextBillingDate).getTime() - new Date().getTime() < 86400000 * 3; // 3 days
                    return (
                      <tr key={idx} className="border-t border-divider hover:bg-white/5 transition">
                        <td className="p-4 font-mono font-bold text-white">#CO-{contract.orderNo}</td>
                        <td className="p-4">{contract.customerName}</td>
                        <td className="p-4 text-emerald-400 font-bold">{contract.total?.toLocaleString()} {t('sys.str_68')}</td>
                        <td className="p-4 text-gray-300">
                          {contract.frequency === 'MONTHLY' ? t('sys.str_1062') : contract.frequency === 'YEARLY' ? t('sys.str_1063') : contract.frequency}
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${isDueSoon ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-blue-500/10 text-blue-400'}`}>
                            <Clock size={14} />
                            {new Date(contract.nextBillingDate).toLocaleDateString('en-GB')}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-green-400 text-xs bg-green-400/10 px-2 py-1 rounded">{t('sys.str_1057')}</span>
                        </td>
                      </tr>
                    )
                  })}
                  {contracts.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-10 text-center text-slate-500">
                        {t('sys.str_1058')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
