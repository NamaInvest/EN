'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from "@/lib/i18n";

export default function TrainingCoursesPage() {
    const { t } = useTranslation();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/hr/training')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setCourses(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-6" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">🎯 الدورات التدريبية (الموارد البشرية)</h1>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition">
          + جدولة دورة تدريبية
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">جاري تحميل الدورات...</div>
        ) : courses.length === 0 ? (
          <div className="p-8 text-center text-slate-500">لا توجد دورات تدريبية مسجلة حالياً.</div>
        ) : (
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <th className="p-4 font-semibold">عنوان الدورة</th>
                <th className="p-4 font-semibold">مقدم الدورة</th>
                <th className="p-4 font-semibold">المدة الزمنية</th>
                <th className="p-4 font-semibold">{t('fin.str_227')}</th>
                <th className="p-4 font-semibold">المسجلون</th>
              </tr>
            </thead>
            <tbody>
              {courses.map(course => (
                <tr key={course.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                  <td className="p-4 font-medium">{course.title}</td>
                  <td className="p-4 text-slate-600">{course.provider || '-'}</td>
                  <td className="p-4 text-sm text-slate-500">
                    {new Date(course.startDate).toLocaleDateString('ar-SA')} - {new Date(course.endDate).toLocaleDateString('ar-SA')}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      course.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                      course.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {course.status === 'COMPLETED' ? 'مكتملة' : course.status === 'SCHEDULED' ? 'مجدولة' : course.status}
                    </span>
                  </td>
                  <td className="p-4 text-slate-600">{course.enrollments?.length || 0} موظفاً</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
