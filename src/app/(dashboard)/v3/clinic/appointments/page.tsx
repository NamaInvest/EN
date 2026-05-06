'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type Appointment = {
    time: string;
    patient: string;
    doctor: string;
    type: string;
    status: string;
};

const STATUS_LABEL: Record<string, string> = {
    WAITING: 'بانتظار الدور',
    IN_PROGRESS: 'قيد الفحص',
    SCHEDULED: 'مجدول',
    COMPLETED: 'مكتمل',
};

export default function ClinicAppointmentsPage() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAppointments = async () => {
            try {
                const res = await fetch('/api/v3/clinic/appointments');
                const data = await res.json();
                if (data.appointments) setAppointments(data.appointments);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchAppointments();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'WAITING': return 'bg-yellow-100 text-yellow-800';
            case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
            case 'SCHEDULED': return 'bg-gray-100 text-gray-800';
            case 'COMPLETED': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="p-6 space-y-6" dir="rtl">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">مواعيد العيادة وقائمة الانتظار</h1>
                <Button>+ موعد جديد</Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>جدول اليوم</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? <p>جاري التحميل...</p> : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-right">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                    <tr>
                                        <th className="px-4 py-3">الوقت</th>
                                        <th className="px-4 py-3">اسم المريض</th>
                                        <th className="px-4 py-3">الطبيب</th>
                                        <th className="px-4 py-3">النوع</th>
                                        <th className="px-4 py-3">الحالة</th>
                                        <th className="px-4 py-3 text-left">الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {appointments.length === 0 && !loading && (
                                        <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">لا توجد مواعيد لهذا اليوم</td></tr>
                                    )}
                                    {appointments.map((apt, idx) => (
                                        <tr key={idx} className="border-b dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800">
                                            <td className="px-4 py-3 font-medium">{apt.time}</td>
                                            <td className="px-4 py-3 font-bold">{apt.patient}</td>
                                            <td className="px-4 py-3 text-blue-600">{apt.doctor}</td>
                                            <td className="px-4 py-3">{apt.type}</td>
                                            <td className="px-4 py-3">
                                                <Badge className={getStatusColor(apt.status)}>{STATUS_LABEL[apt.status] || apt.status}</Badge>
                                            </td>
                                            <td className="px-4 py-3 text-left space-x-2">
                                                <Button size="sm" variant="outline">تسجيل الحضور</Button>
                                                <Button size="sm" variant="outline" className="text-blue-600">دخول الغرفة</Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
