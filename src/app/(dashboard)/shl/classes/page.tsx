'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from "@/lib/i18n";
import { useToast } from '@/components/Toast';

export default function AcademicClassesPage() {
    const { success, info } = useToast();

    const { t } = useTranslation();
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/shl/classes')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setClasses(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-6" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('sys.str_4781')}</h1>
        <button   className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition">
          {t('sys.str_4782')}</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">{t('sys.str_4783')}</div>
        ) : classes.length === 0 ? (
          <div className="p-8 text-center text-slate-500">{t('sys.str_4784')}</div>
        ) : (
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <th className="p-4 font-semibold">{t('sys.str_4785')}</th>
                <th className="p-4 font-semibold">{t('sys.str_2565')}</th>
                <th className="p-4 font-semibold">{t('sys.str_4786')}</th>
                <th className="p-4 font-semibold">{t('sys.str_4787')}</th>
              </tr>
            </thead>
            <tbody>
              {classes.map(cls => (
                <tr key={cls.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                  <td className="p-4 font-bold text-slate-700">{cls.className} <br/><span className="text-xs font-normal text-slate-400">{t('sys.str_4788')}{cls.academicYear}</span></td>
                  <td className="p-4 font-medium text-indigo-600">{cls.gradeLevel}</td>
                  <td className="p-4">{cls.teacher?.name || t('sys.str_4790')}</td>
                  <td className="p-4 font-medium text-slate-600">
                    {cls.enrollments?.length || 0} / {cls.capacity} {t('sys.str_4789')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
