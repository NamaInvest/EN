import React from 'react';
import { getPrisma } from '@/lib/prisma';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { logger } from '@/lib/logger';
import { useTranslation } from "@/lib/i18n";

const log = logger.child({ service: 'D:.namasoft9-3-main.src.app.(dashboard).' });

export const metadata = {
    title: 'تكلفة الذكاء الاصطناعي (AI Cost)',
};

export default async function CostDashboardPage() {
    const { lang } = useTranslation();
        const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const prisma = getPrisma();
    
    // Aggregations
    const usageByPrompt = await prisma.promptUsageLog.groupBy({
        by: ['promptKey'],
        _sum: {
            promptTokens: true,
            completionTokens: true,
            costUsd: true
        },
        _count: {
            id: true
        },
        orderBy: {
            _sum: {
                promptTokens: 'desc'
            }
        }
    });

    const usageByTenant = await prisma.promptUsageLog.groupBy({
        by: ['tenantId'],
        _sum: {
            promptTokens: true,
            completionTokens: true,
            costUsd: true
        },
        _count: {
            id: true
        },
        orderBy: {
            _sum: {
                promptTokens: 'desc'
            }
        }
    });

    const totalUsage = await prisma.promptUsageLog.aggregate({
        _sum: {
            promptTokens: true,
            completionTokens: true,
            costUsd: true
        },
        _count: {
            id: true
        }
    });

    const totalCostStr = (totalUsage._sum.costUsd?.toNumber() || 0).toFixed(4);

    return (
        <div className="p-6 space-y-6" dir="rtl">
            <h1 className="text-2xl font-bold">{_t('لوحة تحكم تكلفة الذكاء الاصطناعي (AI التكلفة)', 'لوحة تحكم تكلفة الذكاء الاصطناعي (AI Cost)')}</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-gray-500">إجمالي الطلبات</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalUsage._count.id}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-gray-500">توكنز الإدخال (Prompt)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{(totalUsage._sum.promptTokens || 0).toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-gray-500">توكنز الإخراج (Completion)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{(totalUsage._sum.completionTokens || 0).toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-gray-500">التكلفة التقديرية (USD)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">${totalCostStr}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>الاستهلاك حسب البرومبت</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-right">البرومبت</TableHead>
                                    <TableHead className="text-right">الطلبات</TableHead>
                                    <TableHead className="text-right">مجموع التوكنز</TableHead>
                                    <TableHead className="text-right">التكلفة ($)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {usageByPrompt.map((row) => {
                                    const totalT = (row._sum.promptTokens || 0) + (row._sum.completionTokens || 0);
                                    const cost = (row._sum.costUsd?.toNumber() || 0).toFixed(4);
                                    return (
                                        <TableRow key={row.promptKey}>
                                            <TableCell className="font-medium" dir="ltr">{row.promptKey}</TableCell>
                                            <TableCell>{row._count.id}</TableCell>
                                            <TableCell>{totalT.toLocaleString()}</TableCell>
                                            <TableCell>${cost}</TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>الاستهلاك حسب مساحة العمل (Tenant)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-right">مساحة العمل</TableHead>
                                    <TableHead className="text-right">الطلبات</TableHead>
                                    <TableHead className="text-right">مجموع التوكنز</TableHead>
                                    <TableHead className="text-right">التكلفة ($)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {usageByTenant.map((row) => {
                                    const totalT = (row._sum.promptTokens || 0) + (row._sum.completionTokens || 0);
                                    const cost = (row._sum.costUsd?.toNumber() || 0).toFixed(4);
                                    return (
                                        <TableRow key={row.tenantId}>
                                            <TableCell className="font-medium">{row.tenantId}</TableCell>
                                            <TableCell>{row._count.id}</TableCell>
                                            <TableCell>{totalT.toLocaleString()}</TableCell>
                                            <TableCell>${cost}</TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
