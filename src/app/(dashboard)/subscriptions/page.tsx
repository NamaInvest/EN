import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Plus, Repeat, TrendingUp, AlertTriangle, UserCheck, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

import prisma from '@/lib/prisma';
import { _t, getServerLang } from '@/lib/server-t';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.app.(dashboard).' });

export default async function SubscriptionsDashboard() {
    // Determine current language for UI layout and date formatting
    // Assuming getServerLang() returns 'ar' or 'en'
    let currentLang = 'ar';
    try {
        currentLang = await getServerLang() || 'ar';
    } catch(e) {
        // Fallback
    }
    const isRTL = currentLang === 'ar';
    const dateLocale = isRTL ? ar : enUS;

    // Fetch up to 500 recent subscriptions for grid (better than 50 for a real dashboard)
    const subscriptions = await prisma.customerSubscription.findMany({
        include: {
            customer: true,
            plan: true,
        },
        orderBy: { startDate: 'desc' },
        take: 500
    });

    const activeCount = subscriptions.filter(s => s.status === 'ACTIVE').length;
    const trialCount = subscriptions.filter(s => s.status === 'TRIAL').length;
    const pastDueCount = subscriptions.filter(s => s.status === 'PAST_DUE').length;

    // Calculate approximate MRR (Monthly Recurring Revenue)
    const mrr = subscriptions
        .filter(s => s.status === 'ACTIVE' && s.plan?.billingCycle === 'MONTHLY')
        .reduce((sum, s) => sum + Number(s.plan?.price || 0), 0);

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-6" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                        <Repeat className="w-8 h-8 text-indigo-600" />
                        {_t('الاشتراكات', 'Subscriptions')}
                    </h1>
                    <p className="text-gray-500 mt-1">
                        {_t('إدارة الفواتير المتكررة والخطط ودورات حياة العملاء.', 'Manage recurring billing, plans, and customer life-cycles.')}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link href="/subscriptions/plans">
                        <Button variant="outline" className="bg-white">{_t('إدارة الخطط', 'Manage Plans')}</Button>
                    </Link>
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
                        <Plus className="w-4 h-4 mr-2" />{_t('اشتراك جديد', 'New Subscription')}
                    </Button>
                </div>
            </div>

            {/* Metrics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-linear-to-br from-indigo-50 to-white border-indigo-100">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-indigo-600">{_t('الإيرادات المتكررة (شهرياً)', 'MRR (Monthly)')}</p>
                            <TrendingUp className="w-4 h-4 text-indigo-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mt-2">{mrr.toLocaleString()} <span className="text-sm font-normal text-gray-500">{_t('ر.س', 'SAR')}</span></h3>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-500">{_t('المشتركين النشطين', 'Active Subscribers')}</p>
                            <UserCheck className="w-4 h-4 text-green-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mt-2">{activeCount}</h3>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-500">{_t('في الفترة التجريبية', 'On Free Trial')}</p>
                            <ShieldCheck className="w-4 h-4 text-blue-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mt-2">{trialCount}</h3>
                    </CardContent>
                </Card>
                <Card className="bg-orange-50 border-orange-100">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-orange-600">{_t('متأخر / فشل', 'Past Due / Failed')}</p>
                            <AlertTriangle className="w-4 h-4 text-orange-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mt-2">{pastDueCount}</h3>
                    </CardContent>
                </Card>
            </div>

            {/* Subscriptions Data Grid */}
            <Card className="overflow-hidden border-gray-200 shadow-sm">
                <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row items-center gap-4 bg-white">
                    <div className="relative w-full md:w-80">
                        <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400`} />
                        <input 
                            type="text" 
                            placeholder={_t('البحث عن عميل...', 'Search by customer...')} 
                            className={`w-full ${isRTL ? 'pr-9 pl-4' : 'pl-9 pr-4'} py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                        />
                    </div>
                    <div className={`flex gap-2 ${isRTL ? 'mr-auto' : 'ml-auto'}`}>
                        <select className="border border-gray-200 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            <option value="ALL">{_t('جميع الحالات', 'All Statuses')}</option>
                            <option value="ACTIVE">{_t('نشط', 'Active')}</option>
                            <option value="TRIAL">{_t('تجريبي', 'Trial')}</option>
                            <option value="PAST_DUE">{_t('متأخر', 'Past Due')}</option>
                            <option value="CANCELLED">{_t('ملغية', 'Cancelled')}</option>
                        </select>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className={`w-full text-sm ${isRTL ? 'text-right' : 'text-left'}`}>
                        <thead className="bg-gray-50 text-gray-600 border-b">
                            <tr>
                                <th className="px-4 py-3 font-medium">{_t('العميل', 'Customer')}</th>
                                <th className="px-4 py-3 font-medium">{_t('الخطة', 'Plan')}</th>
                                <th className="px-4 py-3 font-medium">{_t('الحالة', 'Status')}</th>
                                <th className="px-4 py-3 font-medium">{_t('نهاية الدورة', 'Cycle Ends')}</th>
                                <th className="px-4 py-3 font-medium">{_t('السعر', 'Price')}</th>
                                <th className={`px-4 py-3 font-medium ${isRTL ? 'text-left' : 'text-right'}`}>{_t('إجراءات', 'Actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {subscriptions.map((sub) => (
                                <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 font-medium text-gray-700">
                                        {sub.customer?.name || _t('غير معروف', 'Unknown')}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        <span className="font-medium text-gray-900">{sub.plan?.name || _t('لا توجد خطة', 'No Plan')}</span>
                                        <div className="text-xs text-gray-400">
                                            {sub.plan?.billingCycle === 'MONTHLY' ? _t('شهري', 'Monthly') : 
                                             sub.plan?.billingCycle === 'YEARLY' ? _t('سنوي', 'Yearly') : 
                                             (sub.plan?.billingCycle || _t('غير متوفر', 'N/A'))}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                            sub.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                            sub.status === 'TRIAL' ? 'bg-blue-100 text-blue-800' :
                                            sub.status === 'PAST_DUE' ? 'bg-orange-100 text-orange-800' :
                                            sub.status === 'CANCELLED' ? 'bg-gray-100 text-gray-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                            {sub.status === 'ACTIVE' ? _t('نشط', 'Active') :
                                             sub.status === 'TRIAL' ? _t('تجريبي', 'Trial') :
                                             sub.status === 'PAST_DUE' ? _t('متأخر', 'Past Due') :
                                             sub.status === 'CANCELLED' ? _t('ملغي', 'Cancelled') : sub.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-500">
                                        {sub.currentPeriodEnd ? format(new Date(sub.currentPeriodEnd), 'MMM dd, yyyy', { locale: dateLocale }) : _t('غير متوفر', 'N/A')}
                                    </td>
                                    <td className="px-4 py-3 font-medium text-gray-900">
                                        {Number(sub.plan?.price || 0).toLocaleString()} {_t('ر.س', 'SAR')}
                                    </td>
                                    <td className={`px-4 py-3 ${isRTL ? 'text-left' : 'text-right'}`}>
                                        <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">{_t('إدارة', 'Manage')}</Button>
                                    </td>
                                </tr>
                            ))}
                            {subscriptions.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center">
                                            <Repeat className="w-10 h-10 text-gray-300 mb-3" />
                                            <p className="text-lg font-medium text-gray-900">{_t('لم يتم العثور على اشتراكات', 'No subscriptions found')}</p>
                                            <p className="text-sm mt-1">{_t('ابدأ بإنشاء خطة اشتراكك الأولى وتسجيل عميل.', 'Start by creating your first subscription plan and enrolling a customer.')}</p>
                                            <Button className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white">
                                                <Plus className="w-4 h-4 mr-2" />{_t('إنشاء اشتراك', 'Create Subscription')}
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
