'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function WorkOrdersPage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const [orders] = useState([
        { id: 'WO-1001', client: 'Alpha Corp', issue: 'Server Maintenance', assignedTo: 'Tech Team A', priority: 'HIGH', status: 'IN_PROGRESS' },
        { id: 'WO-1002', client: 'Beta LLC', issue: 'Network Setup', assignedTo: 'Unassigned', priority: 'MEDIUM', status: 'NEW' },
    ]);

    const getPriorityColor = (priority: string) => {
        if (priority === 'HIGH') return 'text-red-600 bg-red-100';
        if (priority === 'MEDIUM') return 'text-yellow-600 bg-yellow-100';
        return 'text-green-600 bg-green-100';
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">{_t('Work Order إدارةment', 'Work Order Management')}</h1>
                <Button>{_t('إنشاء Work Order', 'Create Work Order')}</Button>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>{_t('أوامر العمل النشطة', 'Active Work Orders')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                <tr>
                                    <th className="px-4 py-3">{_t('رقم طلب العمل', 'WO Number')}</th>
                                    <th className="px-4 py-3">{_t('العميل', 'Client')}</th>
                                    <th className="px-4 py-3">{_t('وصف المشكلة', 'Issue Description')}</th>
                                    <th className="px-4 py-3">{_t('تم تعيينه ل', 'Assigned To')}</th>
                                    <th className="px-4 py-3">{_t('أولوية', 'Priority')}</th>
                                    <th className="px-4 py-3">{_t('الحالة', 'Status')}</th>
                                    <th className="px-4 py-3 text-right">{_t('إجراءات', 'Actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((wo, idx) => (
                                    <tr key={idx} className="border-b dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800">
                                        <td className="px-4 py-3 font-mono font-bold">{wo.id}</td>
                                        <td className="px-4 py-3 font-bold">{wo.client}</td>
                                        <td className="px-4 py-3 text-gray-600">{wo.issue}</td>
                                        <td className="px-4 py-3">{wo.assignedTo}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${getPriorityColor(wo.priority)}`}>{wo.priority}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {wo.status === 'IN_PROGRESS' ? (
                                                <Badge className="bg-blue-100 text-blue-800">{_t('في تَقَدم', 'In Progress')}</Badge>
                                            ) : (
                                                <Badge variant="outline">{_t('جديد', 'New')}</Badge>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right space-x-2">
                                            <Button size="sm" variant="outline">{_t('تحديث', 'Update')}</Button>
                                            {wo.status === 'NEW' && (
                                                <Button size="sm" variant="outline" className="text-blue-600 border-blue-500">{_t('إرسال', 'Dispatch')}</Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
