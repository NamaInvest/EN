'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export default function CustomerStatementGeneratorPage() {
  const { lang } = useTranslation();
  const { error: toastError, success: toastSuccess } = useToast();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTemplate, setSelectedTemplate] = useState('standard');
    const [filter, setFilter] = useState('all');

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            // In a real app, this fetches from your CRM/AR API
            const mockData = [
                { id: 1, name: 'Acme Corp', balance: 5000, daysOverdue: 15, dunningLevel: 1 },
                { id: 2, name: 'TechFlow', balance: 12000, daysOverdue: 45, dunningLevel: 2 },
                { id: 3, name: 'Global Supply', balance: 0, daysOverdue: 0, dunningLevel: 0 },
            ];
            
            const filtered = filter === 'overdue' ? mockData.filter(c => c.daysOverdue > 0) : mockData;
            setCustomers(filtered);
        } catch (err) {
            console.error('Failed to fetch customers', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, [filter]);

    const handleGenerateBulk = async () => {
        try {
            await fetch('/api/sales/statements/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ template: selectedTemplate, customerIds: customers.map(c => c.id) })
            });
            toastSuccess('Bulk statements generated successfully.');
        } catch (error) {
            console.error('Error generating bulk', error);
            toastError('Failed to generate bulk statements');
        }
    };

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">{_t('مولد بيان العملاء', 'Customer Statement Generator')}</h1>
            
            <div className="flex space-x-4 mb-4 items-center">
                <select 
                    className="border p-2 rounded"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                >
                    <option value="all">{_t('جميع العملاء', 'All Customers')}</option>
                    <option value="overdue">{_t('المتأخرة فقط', 'Overdue Only')}</option>
                </select>

                <select 
                    className="border p-2 rounded"
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                >
                    <option value="standard">{_t('القالب القياسي', 'Standard Template')}</option>
                    <option value="dunning">Dunning / Warning Template</option>
                </select>

                <Button onClick={handleGenerateBulk}>{_t('توليد السائبة', 'Generate Bulk')}</Button>
                <Button variant="outline">{_t('معاينة', 'Preview')}</Button>
                <Button variant="outline">{_t('إرسال البريد الإلكتروني', 'Send Email')}</Button>
                <Button variant="outline">{_t('جدول', 'Schedule')}</Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{_t('الجمهور المستهدف', 'Target Audience')}</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? <p>{_t('جاري التحميل...', 'Loading...')}</p> : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                    <tr>
                                        <th className="px-4 py-3">{_t('اسم العميل', 'Customer Name')}</th>
                                        <th className="px-4 py-3">{_t('الرصيد', 'Balance')}</th>
                                        <th className="px-4 py-3">{_t('أيام متأخرة', 'Days Overdue')}</th>
                                        <th className="px-4 py-3">{_t('مستوى المطالبة', 'Dunning Level')}</th>
                                        <th className="px-4 py-3 text-right">{_t('إجراءات', 'Actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {customers.map((c, idx) => (
                                        <tr key={idx} className="border-b dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800">
                                            <td className="px-4 py-3 font-medium">{c.name}</td>
                                            <td className="px-4 py-3">${c.balance.toLocaleString()}</td>
                                            <td className="px-4 py-3">
                                                {c.daysOverdue > 0 ? (
                                                    <span className="text-red-600 font-bold">{c.daysOverdue} days</span>
                                                ) : (
                                                    <span>{_t('حاضِر', 'Current')}</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant="outline">Level {c.dunningLevel}</Badge>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Button size="sm" variant="outline">{_t('معاينة', 'Preview')}</Button>
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
