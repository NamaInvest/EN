'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
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

const STATUS_LABEL_AR: Record<string, string> = {
    WAITING: 'بانتظار الدور',
    IN_PROGRESS: 'قيد الفحص',
    SCHEDULED: 'مجدول',
    COMPLETED: 'مكتمل',
};

const STATUS_LABEL_EN: Record<string, string> = {
    WAITING: 'Awaiting Turn',
    IN_PROGRESS: 'In Progress',
    SCHEDULED: 'Scheduled',
    COMPLETED: 'Completed',
};

/**
 * ClinicAppointmentsPage - Clinic Appointments & Queue Flow Dashboard
 * fully localized with bilingual helper _t supporting both Arabic and English interfaces.
 */
export default function ClinicAppointmentsPage() {
  const { lang, dir } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
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
        <div className="p-6 space-y-6" dir={dir}>
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">
                    {_t('مواعيد العيادة وقائمة الانتظار', 'Clinic Appointments & Waiting Queue')}
                </h1>
                <Button>{_t('+ موعد جديد', '+ Create Appointment')}</Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{_t('جدول اليوم', 'Today\'s Schedule')}</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? <p>{_t('جاري التحميل...', 'Loading...')}</p> : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-right">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                    <tr>
                                        <th className="px-4 py-3">{_t('الوقت', 'Time')}</th>
                                        <th className="px-4 py-3">{_t('اسم المريض', 'Patient Name')}</th>
                                        <th className="px-4 py-3">{_t('الطبيب', 'Doctor')}</th>
                                        <th className="px-4 py-3">{_t('النوع', 'Type')}</th>
                                        <th className="px-4 py-3">{_t('الحالة', 'Status')}</th>
                                        <th className="px-4 py-3 text-left">{_t('الإجراءات', 'Actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {appointments.length === 0 && !loading && (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                                                {_t('لا توجد مواعيد لهذا اليوم', 'No appointments registered for today')}
                                            </td>
                                        </tr>
                                    )}
                                    {appointments.map((apt, idx) => (
                                        <tr key={idx} className="border-b dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800">
                                            <td className="px-4 py-3 font-medium">{apt.time}</td>
                                            <td className="px-4 py-3 font-bold">{apt.patient}</td>
                                            <td className="px-4 py-3 text-blue-600">{apt.doctor}</td>
                                            <td className="px-4 py-3">{apt.type}</td>
                                            <td className="px-4 py-3">
                                                <Badge className={getStatusColor(apt.status)}>
                                                    {_t(STATUS_LABEL_AR[apt.status], STATUS_LABEL_EN[apt.status]) || apt.status}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-left space-x-2">
                                                <Button size="sm" variant="outline">{_t('تسجيل الحضور', 'Mark Check-in')}</Button>
                                                <Button size="sm" variant="outline" className="text-blue-600">
                                                    {_t('دخول الغرفة', 'Enter Room')}
                                                </Button>
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

