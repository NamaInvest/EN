'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function PutawayRulesPage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const [rules, setRules] = useState([
        { id: 1, name: 'Cold Storage', condition: 'Category == Perishable', targetZone: 'Zone-A (Cold)', active: true },
        { id: 2, name: 'Heavy Items', condition: 'Weight > 50kg', targetZone: 'Zone-C (Floor)', active: true },
        { id: 3, name: 'Electronics', condition: 'Category == Electronics', targetZone: 'Zone-B (Secure)', active: false },
    ]);

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">WMS Putaway Rules</h1>
                <Button>{_t('إنشاء New Rule', 'Create New Rule')}</Button>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Active Routing Rules</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                <tr>
                                    <th className="px-4 py-3">Rule Name</th>
                                    <th className="px-4 py-3">Condition (Criteria)</th>
                                    <th className="px-4 py-3">Target Zone / Bin</th>
                                    <th className="px-4 py-3">{_t('الحالة', 'Status')}</th>
                                    <th className="px-4 py-3 text-right">{_t('إجراءات', 'Actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rules.map((rule, idx) => (
                                    <tr key={idx} className="border-b dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800">
                                        <td className="px-4 py-3 font-medium">{rule.name}</td>
                                        <td className="px-4 py-3 font-mono text-xs">{rule.condition}</td>
                                        <td className="px-4 py-3 text-blue-600 font-bold">{rule.targetZone}</td>
                                        <td className="px-4 py-3">
                                            {rule.active ? (
                                                <Badge className="bg-green-100 text-green-800">{_t('نشطة', 'Active')}</Badge>
                                            ) : (
                                                <Badge variant="outline">Disabled</Badge>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right space-x-2">
                                            <Button size="sm" variant="outline">{_t('تعديل', 'Edit')}</Button>
                                            <Button size="sm" variant="outline" className="text-red-600 border-red-500">{_t('حذف', 'Delete')}</Button>
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
