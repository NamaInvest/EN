'use client';

import React, { useState, useEffect } from 'react';

export default function FleetMaintenancePage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/fleet/maintenance');
            const json = await res.json();
            if (json.success) {
                setData(json.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !data) return <div className="p-8 text-indigo-600 font-bold">جاري فحص عدادات المركبات...</div>;

    const { alerts, maintenanceLogs } = data || { alerts: [], maintenanceLogs: [] };

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-6" dir="rtl">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow flex justify-between items-center border-b-4 border-yellow-500">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">مواعيد الصيانة الدورية (Fleet Maintenance)</h1>
                    <p className="text-gray-500 mt-1">تتبع مواعيد تغيير الزيت والصيانة بناءً على قراءات عداد المسافات لكل شاحنة.</p>
                </div>
                <button className="bg-yellow-500 text-white px-4 py-2 rounded-md font-bold shadow hover:bg-yellow-600">
                    + تسجيل صيانة جديدة
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Alerts Column */}
                <div className="lg:col-span-1 space-y-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white border-b pb-2">🚨 تنبيهات الصيانة</h2>
                    
                    {alerts.map((alert: any) => (
                        <div key={alert.vehicleId} className={`p-4 rounded-lg shadow border-l-4 ${alert.status === 'OVERDUE' ? 'bg-red-50 border-red-500 dark:bg-red-900/20' : 'bg-yellow-50 border-yellow-500 dark:bg-yellow-900/20'}`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white">{alert.plateNumber}</h3>
                                    <p className="text-xs text-gray-500">{alert.model}</p>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded font-bold ${alert.status === 'OVERDUE' ? 'bg-red-200 text-red-800' : 'bg-yellow-200 text-yellow-800'}`}>
                                    {alert.status === 'OVERDUE' ? 'متأخر' : 'مستحق قريباً'}
                                </span>
                            </div>
                            <div className="mt-4 flex justify-between text-sm">
                                <div className="text-gray-600 dark:text-gray-400">
                                    العداد الحالي: <span className="font-bold text-gray-900 dark:text-white">{alert.currentOdometer.toLocaleString()} كم</span>
                                </div>
                                <div className="text-gray-600 dark:text-gray-400">
                                    متبقي: <span className={`font-bold ${alert.kmRemaining <= 0 ? 'text-red-600' : 'text-yellow-600'}`}>{alert.kmRemaining} كم</span>
                                </div>
                            </div>
                        </div>
                    ))}

                    {alerts.length === 0 && (
                        <div className="bg-green-50 text-green-700 p-4 rounded-lg shadow border border-green-200 text-center">
                            ✅ جميع المركبات ضمن النطاق الآمن للصيانة.
                        </div>
                    )}
                </div>

                {/* Maintenance History */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
                        <h2 className="font-bold text-gray-800 dark:text-gray-200">سجل الصيانة الأخير</h2>
                    </div>
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                            <tr>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المركبة</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">التاريخ</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الوصف</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">العداد وقتها</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">التكلفة (SAR)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {maintenanceLogs.map((log: any) => (
                                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">
                                        {log.plateNumber}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {log.date}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                        {log.description}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                                        {log.odoAtMaintenance.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-bold text-red-600">
                                        {log.cost.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
