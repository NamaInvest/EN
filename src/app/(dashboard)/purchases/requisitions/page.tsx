import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Plus, ClipboardList, Clock, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

import prisma from '@/lib/prisma';
import { _t } from '@/lib/server-t';
export default async function PurchaseRequisitionsPage() {
    const requisitions = await prisma.purchaseRequisition.findMany({
        include: {
            requester: true,
            approver: true
        },
        orderBy: { date: 'desc' },
        take: 50
    });

    const pendingCount = requisitions.filter(r => r.status === 'pending').length;
    const approvedCount = requisitions.filter(r => r.status === 'approved').length;

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                        <ClipboardList className="w-8 h-8 text-indigo-600" />{_t('طلبات الشراء', 'Purchase Requisitions')}</h1>
                    <p className="text-gray-500 mt-1">{_t('الطلبات الداخلية للسلع والخدمات.', 'Internal requests for goods and services.')}</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/purchases/orders">
                        <Button variant="outline" className="bg-white">{_t('عرض أوامر الشراء', 'View POs')}</Button>
                    </Link>
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
                        <Plus className="w-4 h-4 mr-2" />{_t('طلب جديد', 'New Request')}</Button>
                </div>
            </div>

            {/* Metrics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-100">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-indigo-600">{_t('بانتظار الموافقة', 'Pending Approvals')}</p>
                            <Clock className="w-4 h-4 text-indigo-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mt-2">{pendingCount}</h3>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-500">{_t('تمت الموافقة (جاهز لأمر الشراء)', 'Approved (Ready for PO)')}</p>
                            <CheckCircle className="w-4 h-4 text-green-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mt-2">{approvedCount}</h3>
                    </CardContent>
                </Card>
            </div>

            {/* Data Grid */}
            <Card className="overflow-hidden border-gray-200 shadow-sm">
                <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row items-center gap-4 bg-white">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Search PRs or departments..." 
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 border-b">
                            <tr>
                                <th className="px-4 py-3 font-medium">Req #</th>
                                <th className="px-4 py-3 font-medium">{_t('القسم (Department)', 'Department')}</th>
                                <th className="px-4 py-3 font-medium">{_t('مقدم الطلب', 'Requested By')}</th>
                                <th className="px-4 py-3 font-medium">{_t('التاريخ', 'Date')}</th>
                                <th className="px-4 py-3 font-medium">{_t('الحالة', 'Status')}</th>
                                <th className="px-4 py-3 font-medium text-right">{_t('إجراءات', 'Actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {requisitions.map((req) => (
                                <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 font-medium text-gray-900">
                                        PR-{req.reqNo}
                                    </td>
                                    <td className="px-4 py-3 text-gray-700">
                                        {req.department || 'N/A'}
                                    </td>
                                    <td className="px-4 py-3 text-gray-700">
                                        {req.requester?.fullName || 'Unknown User'}
                                    </td>
                                    <td className="px-4 py-3 text-gray-500">
                                        {format(new Date(req.date), 'MMM dd, yyyy')}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                            req.status === 'approved' ? 'bg-green-100 text-green-800' :
                                            req.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                            'bg-orange-100 text-orange-800'
                                        }`}>
                                            {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {req.status === 'pending' && (
                                            <>
                                                <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700 hover:bg-green-50 mr-1" title="Approve">
                                                    <CheckCircle className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 mr-1" title="Reject">
                                                    <XCircle className="w-4 h-4" />
                                                </Button>
                                            </>
                                        )}
                                        {req.status === 'approved' && (
                                            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 mr-1">{_t('تحويل لأمر شراء', 'Convert to PO')}</Button>
                                        )}
                                        <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">{_t('عرض', 'View')}</Button>
                                    </td>
                                </tr>
                            ))}
                            {requisitions.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center">
                                            <ClipboardList className="w-10 h-10 text-gray-300 mb-3" />
                                            <p className="text-lg font-medium text-gray-900">{_t('لا توجد طلبات شراء', 'No Purchase Requisitions')}</p>
                                            <Button className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white">
                                                <Plus className="w-4 h-4 mr-2" />{_t('إنشاء أول طلب', 'Create First Request')}</Button>
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
