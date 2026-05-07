'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

export default function BudgetPlanningPage() {
    const [versions, setVersions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState('ميزانية 2026');
    const [newType, setNewType] = useState('BUDGET');

    useEffect(() => { fetchVersions(); }, []);

    async function fetchVersions() {
        setLoading(true);
        const res = await fetch('/api/finance/budget');
        if (res.ok) setVersions(await res.json());
        setLoading(false);
    }

    async function createVersion(e: any) {
        e.preventDefault();
        await fetch('/api/finance/budget', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'create-version', name: newName, versionType: newType })
        });
        setShowCreate(false);
        fetchVersions();
    }

    async function lockVersion(id: string) {
        await fetch('/api/finance/budget', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'lock', versionId: id })
        });
        fetchVersions();
    }

    const statusColors: any = {
        DRAFT: 'bg-yellow-100 text-yellow-700',
        LOCKED: 'bg-green-100 text-green-700',
        ARCHIVED: 'bg-gray-100 text-gray-500'
    };

    const typeLabels: any = {
        BUDGET: 'ميزانية',
        FORECAST: 'توقعات',
        SCENARIO: 'سيناريو',
        ACTUAL_OVERLAY: 'فعلي'
    };

    return (
        <div className="p-6 space-y-6" dir="rtl">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">التخطيط والميزانية (xP&A)</h1>
                    <p className="text-sm text-gray-500">إنشاء وإدارة إصدارات الميزانية والتوقعات المالية</p>
                </div>
                <Button onClick={() => setShowCreate(!showCreate)}>+ إصدار جديد</Button>
            </div>

            {showCreate && (
                <Card className="border-2 border-blue-200 bg-blue-50/20">
                    <CardContent className="p-4">
                        <form onSubmit={createVersion} className="flex gap-4 items-end">
                            <div className="flex-1">
                                <label className="block text-sm mb-1">اسم الإصدار</label>
                                <Input value={newName} onChange={e => setNewName(e.target.value)} required />
                            </div>
                            <div>
                                <label className="block text-sm mb-1">النوع</label>
                                <select value={newType} onChange={e => setNewType(e.target.value)}
                                    className="border rounded-md px-3 py-2 text-sm">
                                    <option value="BUDGET">ميزانية</option>
                                    <option value="FORECAST">توقعات</option>
                                    <option value="SCENARIO">سيناريو</option>
                                </select>
                            </div>
                            <Button type="submit">إنشاء</Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? <p>جاري التحميل...</p> : versions.map((v: any) => (
                    <Card key={v.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-lg">{v.name}</CardTitle>
                                <span className={`px-2 py-1 rounded text-xs ${statusColors[v.status] || ''}`}>
                                    {v.status === 'DRAFT' ? 'مسودة' : v.status === 'LOCKED' ? 'مقفلة' : 'مؤرشفة'}
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">النوع:</span>
                                    <span className="font-medium">{typeLabels[v.versionType] || v.versionType}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">عدد البنود:</span>
                                    <span className="font-medium">{v._count?.lines || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">السنة المالية:</span>
                                    <span className="font-medium">{v.fiscalYearId}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">تاريخ الإنشاء:</span>
                                    <span dir="ltr">{new Date(v.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                            {v.status === 'DRAFT' && (
                                <div className="flex gap-2 mt-4">
                                    <Button size="sm" variant="outline" className="flex-1">فتح الجدول</Button>
                                    <Button size="sm" className="bg-green-600" onClick={() => lockVersion(v.id)}>🔒 قفل</Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {!loading && versions.length === 0 && (
                <Card className="p-12 text-center text-gray-500">
                    لا توجد إصدارات ميزانية بعد. اضغط "إصدار جديد" للبدء.
                </Card>
            )}
        </div>
    );
}
