'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export default function LoyaltyRedemptionPage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const [accounts] = useState([
        { id: 'CUST-1001', name: 'Ahmed Ali', phone: '+966500000001', tier: 'GOLD', pointsBalance: 4500, status: 'ACTIVE' },
        { id: 'CUST-1002', name: 'Mohammed Omar', phone: '+966500000002', tier: 'SILVER', pointsBalance: 1200, status: 'ACTIVE' },
    ]);

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">{_t('برنامج الولاء والمكافآت', 'Loyalty & Rewards Program')}</h1>
                <Button>{_t('تسجيل العميل', 'Enroll Customer')}</Button>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>{_t('حسابات ولاء العملاء', 'Customer Loyalty Accounts')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex mb-4 space-x-2">
                        <Input placeholder="Search by Phone or Name..." className="max-w-sm" />
                        <Button variant="outline">{_t('بحث', 'Search')}</Button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                <tr>
                                    <th className="px-4 py-3">{_t('معرف العميل', 'Customer ID')}</th>
                                    <th className="px-4 py-3">{_t('الاسم', 'Name')}</th>
                                    <th className="px-4 py-3">{_t('الهاتف', 'Phone')}</th>
                                    <th className="px-4 py-3">{_t('الطبقة', 'Tier')}</th>
                                    <th className="px-4 py-3 text-right">{_t('رصيد النقاط', 'Points Balance')}</th>
                                    <th className="px-4 py-3">{_t('الحالة', 'Status')}</th>
                                    <th className="px-4 py-3 text-right">{_t('إجراءات', 'Actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {accounts.map((acc, idx) => (
                                    <tr key={idx} className="border-b dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800">
                                        <td className="px-4 py-3 font-mono">{acc.id}</td>
                                        <td className="px-4 py-3 font-bold">{acc.name}</td>
                                        <td className="px-4 py-3 text-gray-500">{acc.phone}</td>
                                        <td className="px-4 py-3">
                                            <Badge className={acc.tier === 'GOLD' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}>{acc.tier}</Badge>
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-blue-600">{acc.pointsBalance.toLocaleString()}</td>
                                        <td className="px-4 py-3">
                                            <Badge className="bg-green-100 text-green-800">{_t('نشطة', 'Active')}</Badge>
                                        </td>
                                        <td className="px-4 py-3 text-right space-x-2">
                                            <Button size="sm" variant="outline">{_t('عرض التاريخ', 'View History')}</Button>
                                            <Button size="sm" variant="outline" className="text-blue-600 border-blue-500">{_t('يسترد', 'Redeem')}</Button>
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
