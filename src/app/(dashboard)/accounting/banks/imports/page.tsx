import { _t } from '@/lib/server-t';
'use client';
"use client";

import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, CheckCircle, AlertTriangle, ScanLine } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/Toast';

export default function BankStatementImportsPage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const { error: toastError, success: toastSuccess } = useToast();
    const [uploading, setUploading] = useState(false);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('bankAccountId', '1'); // Mock ID
            formData.append('formatHint', 'CSV');

            const res = await fetch('/api/accounting/banks/imports', {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                toastSuccess('Statement imported successfully');
            } else {
                const data = await res.json();
                toastError(data.error || 'Failed to import statement');
            }
        } catch (err: any) {
            toastError(err.message);
        } finally {
            setUploading(false);
            if (e.target) e.target.value = '';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{_t('Bank Statements', 'Bank Statements')}</h1>
                    <p className="text-muted-foreground">{_t('Import and manage bank statements (MT940, CSV, CAMT.053)', 'Import and manage bank statements (MT940, CSV, CAMT.053)')}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <ScanLine className="h-4 w-4 mr-2" />{_t('OCR PDF Import', 'OCR PDF Import')}</Button>
                    <label className="cursor-pointer">
                        <Button asChild variant="default">
                            <span>
                                <Upload className="h-4 w-4 mr-2" /> 
                                {uploading ? 'Uploading...' : 'Import Statement'}
                            </span>
                        </Button>
                        <input type="file" className="hidden" accept=".csv,.txt,.xml,.mt940" onChange={handleUpload} disabled={uploading} />
                    </label>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{_t('Statements This Month', 'Statements This Month')}</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">12</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{_t('Unreconciled Txns', 'Unreconciled Txns')}</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">45</div>
                        <p className="text-xs text-muted-foreground">{_t('Require matching', 'Require matching')}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{_t('Auto-match Rate', 'Auto-match Rate')}</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">82%</div>
                        <p className="text-xs text-muted-foreground">{_t('Based on rules', 'Based on rules')}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{_t('Failed Imports', 'Failed Imports')}</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">0</div>
                        <p className="text-xs text-muted-foreground">{_t('Format issues', 'Format issues')}</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{_t('Recent Statement Imports', 'Recent Statement Imports')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium">{_t('حساب', 'Account')}</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">{_t('Format', 'Format')}</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">{_t('Date Imported', 'Date Imported')}</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">{_t('رصيد الإغلاق', 'Closing Balance')}</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">{_t('الحالة', 'Status')}</th>
                                    <th className="px-4 py-3 text-right text-sm font-medium">{_t('إجراءات', 'Actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {[1, 2, 3].map((i) => (
                                    <tr key={i}>
                                        <td className="px-4 py-3 text-sm">{_t('Al Rajhi Main', 'Al Rajhi Main')}</td>
                                        <td className="px-4 py-3 text-sm"><span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">{i === 1 ? 'CAMT.053' : 'CSV'}</span></td>
                                        <td className="px-4 py-3 text-sm">2026-05-{10+i}</td>
                                        <td className="px-4 py-3 text-sm">SAR {(150.5 * i).toFixed(2)}k</td>
                                        <td className="px-4 py-3 text-sm">
                                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">{_t('ساري المفعول', 'VALID')}</span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right">
                                            <Link href="/accounting/banks/recon">
                                                <Button variant="ghost" size="sm">{_t('Reconcile', 'Reconcile')}</Button>
                                            </Link>
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
