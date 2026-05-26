import React from 'react';
import { Send, CheckCircle, AlertTriangle, Clock, Play, Paintbrush, Layers } from 'lucide-react';
import Link from 'next/link';

import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.app.(dashboard).' });
// Revalidate every 60 seconds or make it dynamic
export const dynamic = 'force-dynamic';

export default async function CustomerStatementsOverview() {
    const _t = (ar: string, _en: string) => ar;
    let thisMonthSent = 0;
    let deliveryIssues = 0;
    let activeSchedules = 0;
    let logs: any[] = [];

    try {
        const firstDayOfMonth = new Date(new Date().setDate(1));
        
        thisMonthSent = await (prisma as any).statementDispatchLog.count({
            where: { generatedAt: { gte: firstDayOfMonth } }
        }).catch(() => 0);
        
        deliveryIssues = await (prisma as any).statementDispatchLog.count({
            where: { status: { in: ['FAILED', 'BOUNCED', 'SOFT_BOUNCED'] } }
        }).catch(() => 0);

        // Fallback for activeSchedules since it might not be in DB yet
        activeSchedules = await (prisma as any).statementSchedule?.count({
            where: { enabled: true }
        }).catch(() => 0) || 0;

        logs = await (prisma as any).statementDispatchLog.findMany({
            take: 10,
            orderBy: { generatedAt: 'desc' },
            include: { customer: true }
        }).catch(() => []);
    } catch (e) {
        log.error('Error fetching dashboard data:', e);
    }

    const openRate = thisMonthSent > 0 ? Math.floor(((thisMonthSent - deliveryIssues) / thisMonthSent) * 100) : 0;

    return (
        <div className="max-w-6xl mx-auto space-y-6 p-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                        <Layers className="w-8 h-8 text-blue-600" />
                        كشوف حسابات العملاء
                    </h1>
                    <p className="text-gray-500 mt-2">إدارة وإرسال ومتابعة كشوف الحسابات الشهرية والدورية للعملاء</p>
                </div>
                <div className="flex gap-3">
                    <Link href="/accounting/customer-statements/templates" className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                        <Paintbrush className="w-4 h-4" />
                        القوالب (Templates)
                    </Link>
                    <Link href="/accounting/customer-statements/bulk" className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                        <Play className="w-4 h-4" />
                        التشغيل المجمع (Bulk)
                    </Link>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-600">تم الإرسال (هذا الشهر)</h3>
                        <Send className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="mt-4 text-3xl font-bold text-gray-900">{thisMonthSent}</div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-600">{_t('معدل الفتح (مفتوح معدل)', 'معدل الفتح (Open Rate)')}</h3>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="mt-4 text-3xl font-bold text-gray-900">{openRate}%</div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-600">أخطاء الإرسال (Bounced)</h3>
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                    </div>
                    <div className="mt-4 text-3xl font-bold text-red-600">{deliveryIssues}</div>
                    <p className="text-xs text-gray-500 mt-1">كشوفات فشل تسليمها للعميل</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-600">الجدولة التلقائية</h3>
                        <Clock className="h-5 w-5 text-orange-500" />
                    </div>
                    <div className="mt-4 text-3xl font-bold text-gray-900">{activeSchedules}</div>
                    <p className="text-xs text-gray-500 mt-1">مهام إرسال مجدولة نشطة</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900">سجل الإرسال الحديث (Recent Dispatches)</h2>
                </div>
                <div>
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تاريخ الإرسال</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">العميل</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">القناة</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">لا يوجد سجل إرسال</td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {new Date(log.generatedAt).toLocaleString('ar-SA')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {log.customer?.name || `رقم العميل: ${log.customerId}`}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {log.deliveryChannel === 'EMAIL' ? 'بريد إلكتروني' : 'بوابة العملاء'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                log.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                                                log.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                                                'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {log.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
