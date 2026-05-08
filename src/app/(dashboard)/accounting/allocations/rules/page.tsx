'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function CostCenterAllocationRulesPage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const [rules, setRules] = useState([
        { id: 1, name: 'IT Support Allocation', sourceCC: 'CC-900 (IT Dept)', targetCCs: [{ cc: 'CC-100 (Sales)', driver: 'HEADCOUNT', weight: 40 }, { cc: 'CC-200 (Marketing)', driver: 'HEADCOUNT', weight: 60 }], active: true },
        { id: 2, name: 'Rent Allocation', sourceCC: 'CC-800 (Facilities)', targetCCs: [{ cc: 'CC-100 (Sales)', driver: 'SQM', weight: 70 }, { cc: 'CC-200 (Marketing)', driver: 'SQM', weight: 30 }], active: true },
    ]);

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">{_t('Cost Center Allocations', 'Cost Center Allocations')}</h1>
                <div className="space-x-2">
                    <Button>{_t('إنشاء Allocation Rule', 'Create Allocation Rule')}</Button>
                    <Button variant="outline">{_t('Run Allocations Now', 'Run Allocations Now')}</Button>
                </div>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>{_t('Active Allocation Rules', 'Active Allocation Rules')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                <tr>
                                    <th className="px-4 py-3">{_t('Rule Name', 'Rule Name')}</th>
                                    <th className="px-4 py-3">{_t('Source Cost Center', 'Source Cost Center')}</th>
                                    <th className="px-4 py-3">Distribution Method / Targets</th>
                                    <th className="px-4 py-3">{_t('الحالة', 'Status')}</th>
                                    <th className="px-4 py-3 text-right">{_t('إجراءات', 'Actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rules.map((rule, idx) => (
                                    <tr key={idx} className="border-b dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800">
                                        <td className="px-4 py-3 font-medium">{rule.name}</td>
                                        <td className="px-4 py-3 font-bold text-blue-600">{rule.sourceCC}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col gap-1">
                                                {rule.targetCCs.map((t, i) => (
                                                    <span key={i} className="text-xs">
                                                        <span className="font-medium text-gray-700">{t.cc}</span>
                                                        <span className="text-gray-500 ml-2">({t.weight}% via {t.driver})</span>
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {rule.active ? (
                                                <Badge className="bg-green-100 text-green-800">{_t('نشطة', 'Active')}</Badge>
                                            ) : (
                                                <Badge variant="outline">{_t('مسودة', 'Draft')}</Badge>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right space-x-2">
                                            <Button size="sm" variant="outline">{_t('تعديل', 'Edit')}</Button>
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
