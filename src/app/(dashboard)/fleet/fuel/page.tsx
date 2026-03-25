'use client';

import { useState, useEffect } from 'react';

export default function FleetFuelPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/fleet/fuel')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setLogs(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-6" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">⛽ إدارة الأسطول - سجلات الوقود</h1>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition">
          + تسجيل مشتريات وقود
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">جاري تحميل سجلات الوقود...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-slate-500">لا توجد سجلات تعبئة وقود.</div>
        ) : (
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <th className="p-4 font-semibold">التاريخ</th>
                <th className="p-4 font-semibold">المركبة</th>
                <th className="p-4 font-semibold">السائق</th>
                <th className="p-4 font-semibold">الكمية (لتر)</th>
                <th className="p-4 font-semibold">التكلفة الإجمالية</th>
                <th className="p-4 font-semibold">قراءة العداد</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                  <td className="p-4 text-slate-600">{new Date(log.date).toLocaleDateString('ar-SA')}</td>
                  <td className="p-4 font-bold text-slate-700">
                    <span dir="ltr">{log.vehicle?.plateNumber}</span> <br/>
                    <span className="text-xs font-normal text-slate-500">{log.vehicle?.make}</span>
                  </td>
                  <td className="p-4">{log.driver?.name || 'غير معروف'}</td>
                  <td className="p-4 font-medium text-amber-600" dir="ltr">{log.liters.toFixed(2)} L</td>
                  <td className="p-4 font-medium text-slate-700">{log.cost.toLocaleString()} ر.س</td>
                  <td className="p-4 font-mono text-slate-500 flex items-center gap-1" dir="ltr"><span>km</span> <span>{log.odometerReading.toLocaleString()}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
