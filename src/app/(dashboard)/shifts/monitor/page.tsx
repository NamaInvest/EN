'use client';
import React, { useEffect, useState } from 'react';
import { Clock, Loader2, CalendarClock } from 'lucide-react';
import { useTranslation } from "@/lib/i18n";

export default function ShiftsMonitorPage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="p-6" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Clock className="text-primary" /> {_t('شاشة مراقبة الورديات الحية', 'Shifts Monitor')}
      </h1>
      
      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" size={48} /></div>
      ) : (
        <div className="card p-8 text-center border border-(--border) bg-(--bg-secondary) rounded-xl shadow-sm">
          <CalendarClock className="mx-auto mb-4 text-gray-400" size={48} />
          <h2 className="text-lg font-bold mb-2">{_t('لا توجد ورديات نشطة حالياً', 'No Active Shifts')}</h2>
          <p className="text-(--text-muted)">{_t('لا يوجد موظفون مسجلون حالياً في ورديات نشطة.', 'There are no employees currently checked in to active shifts.')}</p>
        </div>
      )}
    </div>
  );
}
