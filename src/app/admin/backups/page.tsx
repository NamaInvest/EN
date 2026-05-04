'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';

export default function BackupsPage() {
    const [backups, setBackups] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchBackups = async () => {
        try {
            const res = await fetch('/api/admin/backups');
            if (res.ok) {
                setBackups(await res.json());
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchBackups();
    }, []);

    const handleCreateBackup = async (type: string) => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/backups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type })
            });
            const data = await res.json();
            if (res.ok) {
                toast.success('تم البدء بأخذ النسخة الاحتياطية بنجاح');
                fetchBackups();
            } else {
                toast.error(data.error || 'فشل إنشاء النسخة الاحتياطية');
            }
        } catch (e) {
            toast.error('خطأ في الاتصال');
        } finally {
            setLoading(false);
        }
    };

    const formatBytes = (bytesStr: string) => {
        if (!bytesStr) return '0 B';
        const bytes = Number(bytesStr);
        if (isNaN(bytes)) return '0 B';
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="p-6 space-y-6 max-w-6xl mx-auto" dir="rtl">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">إدارة النسخ الاحتياطية</h1>
                <div className="space-x-2 space-x-reverse">
                    <Button onClick={() => handleCreateBackup('FULL')} disabled={loading} variant="default">
                        نسخة كاملة
                    </Button>
                    <Button onClick={() => handleCreateBackup('INCREMENTAL')} disabled={loading} variant="outline">
                        نسخة تفاضلية
                    </Button>
                </div>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>سجل النسخ</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b bg-gray-50 dark:bg-gray-800 text-right">
                                    <th className="p-3">المعرف</th>
                                    <th className="p-3">النوع</th>
                                    <th className="p-3">تاريخ البدء</th>
                                    <th className="p-3">الحجم</th>
                                    <th className="p-3">الحالة</th>
                                    <th className="p-3">اختبار الاستعادة</th>
                                </tr>
                            </thead>
                            <tbody>
                                {backups.map(b => (
                                    <tr key={b.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="p-3">#{b.id}</td>
                                        <td className="p-3">{b.type}</td>
                                        <td className="p-3">{new Date(b.startedAt).toLocaleString('ar-SA')}</td>
                                        <td className="p-3">{formatBytes(b.sizeBytes)}</td>
                                        <td className="p-3">
                                            <Badge variant={b.status === 'COMPLETED' ? 'default' : b.status === 'FAILED' ? 'destructive' : 'secondary'}
                                                   className={b.status === 'COMPLETED' ? 'bg-green-600' : ''}>
                                                {b.status}
                                            </Badge>
                                            {b.errorMessage && <p className="text-xs text-red-500 mt-1 max-w-xs truncate" title={b.errorMessage}>{b.errorMessage}</p>}
                                        </td>
                                        <td className="p-3">
                                            {b.restoreTestedAt ? (
                                                <span className="text-green-600 text-sm">تم الاختبار: {new Date(b.restoreTestedAt).toLocaleDateString('ar-SA')}</span>
                                            ) : b.status === 'COMPLETED' ? (
                                                <Button size="sm" variant="ghost">اختبار</Button>
                                            ) : null}
                                        </td>
                                    </tr>
                                ))}
                                {backups.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="text-center p-8 text-gray-500">لا يوجد نسخ احتياطية</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
