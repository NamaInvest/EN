'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from "@/lib/i18n";

export default function TrainingCoursesPage() {
  const { t } = useTranslation();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [provider, setProvider] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [cost, setCost] = useState('');
  const [status, setStatus] = useState('SCHEDULED');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hr/training');
      const data = await res.json();
      if (Array.isArray(data)) setCourses(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/hr/training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          provider,
          startDate,
          endDate,
          cost: parseFloat(cost) || 0,
          status
        })
      });
      if (res.ok) {
        setShowModal(false);
        // Reset form
        setTitle('');
        setProvider('');
        setStartDate('');
        setEndDate('');
        setCost('');
        setStatus('SCHEDULED');
        loadData();
      } else {
        alert('حدث خطأ أثناء حفظ الدورة التدريبية');
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="p-6" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">🎯 الدورات التدريبية (الموارد البشرية)</h1>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition">
          + جدولة دورة تدريبية
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in-up">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">إضافة دورة تدريبية جديدة</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xl">&times;</button>
            </div>
            <form onSubmit={handleSave} className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1">اسم الدورة (Title)</label>
                  <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">الجهة المدربة (Provider)</label>
                  <input required type="text" value={provider} onChange={e => setProvider(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">التكلفة (Cost SAR)</label>
                  <input type="number" step="0.01" value={cost} onChange={e => setCost(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">تاريخ البدء</label>
                  <input required type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">تاريخ الإنتهاء</label>
                  <input required type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1">الحالة</label>
                  <select value={status} onChange={e => setStatus(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600">
                    <option value="SCHEDULED">مجدولة (Scheduled)</option>
                    <option value="ONGOING">قيد التنفيذ (Ongoing)</option>
                    <option value="COMPLETED">مكتملة (Completed)</option>
                    <option value="CANCELLED">ملغية (Cancelled)</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-50 rounded-lg">إلغاء</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold shadow-md shadow-blue-600/20">حفظ وجدولة الدورة</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">جاري تحميل الدورات...</div>
        ) : courses.length === 0 ? (
          <div className="p-8 text-center text-slate-500">لا توجد دورات تدريبية مسجلة حالياً. اضغط على الزر بالأعلى لتسجيل أول دورة.</div>
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
                  <td className="p-4 font-bold text-slate-800">{course.title}</td>
                  <td className="p-4 text-slate-600">{course.provider || '-'}</td>
                  <td className="p-4 text-sm text-slate-500">
                    <span className="inline-block bg-slate-100 px-2 py-1 rounded text-xs ml-1 font-mono">
                      {new Date(course.startDate).toLocaleDateString('en-GB')}
                    </span>
                    إلى
                    <span className="inline-block bg-slate-100 px-2 py-1 rounded text-xs mr-1 font-mono">
                      {new Date(course.endDate).toLocaleDateString('en-GB')}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      course.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                      course.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-700' : 
                      course.status === 'ONGOING' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {course.status === 'COMPLETED' ? 'مكتملة' : 
                       course.status === 'SCHEDULED' ? 'مجدولة' : 
                       course.status === 'ONGOING' ? 'جارية' : 'ملغية'}
                    </span>
                  </td>
                  <td className="p-4 text-slate-600 font-bold">{course.enrollments?.length || 0} <span className="text-xs font-normal">موظفاً</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
