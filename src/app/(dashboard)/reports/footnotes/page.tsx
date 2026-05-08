'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function FootnotesBuilderPage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const [footnotes] = useState([
        { id: 'FN-1', category: 'Significant Accounting Policies', title: 'Basis of Preparation', content: 'These financial statements have been prepared in accordance with IFRS.', status: 'PUBLISHED' },
        { id: 'FN-2', category: 'Related Parties', title: 'Transactions with Affiliates', content: 'Auto-populated: 4 transactions with Alpha Corp totaling SAR 45,000.', status: 'DRAFT' },
    ]);

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">{_t('Financial Statement Footnotes', 'Financial Statement Footnotes')}</h1>
                <div className="space-x-2">
                    <Button variant="outline">{_t('Auto-Populate', 'Auto-Populate')}</Button>
                    <Button>{_t('New Footnote', 'New Footnote')}</Button>
                </div>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>{_t('Disclosures & Footnotes (FY 2026)', 'Disclosures & Footnotes (FY 2026)')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {footnotes.map((fn, idx) => (
                            <div key={idx} className="border p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{fn.category}</span>
                                        <h3 className="text-lg font-bold text-blue-900 dark:text-blue-400">{fn.id}: {fn.title}</h3>
                                    </div>
                                    <span className={`px-2 py-1 text-xs rounded ${fn.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {fn.status}
                                    </span>
                                </div>
                                <p className="text-gray-700 dark:text-gray-300">{fn.content}</p>
                                <div className="mt-4 flex space-x-2">
                                    <Button size="sm" variant="outline">{_t('Edit Content', 'Edit Content')}</Button>
                                    <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">{_t('حذف', 'Delete')}</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
