import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Plus, ShoppingBag, FileText, CheckCircle, Truck, DollarSign, Clock } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

import prisma from '@/lib/prisma';
import { _t } from '@/lib/server-t';
export default async function PurchaseOrdersPage() {
    const orders = await prisma.purchaseOrder.findMany({
        include: {
            supplier: true,
        },
        orderBy: { date: 'desc' },
        take: 50
    });

    const pendingCount = orders.filter(o => o.status === 'pending').length;
    const completedCount = orders.filter(o => o.status === 'completed').length;
    const totalValue = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                        <ShoppingBag className="w-8 h-8 text-blue-600" />{_t('Purchase Orders', 'Purchase Orders')}</h1>
                    <p className="text-gray-500 mt-1">{_t('Manage vendor POs, tracking, and approvals.', 'Manage vendor POs, tracking, and approvals.')}</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/purchases/requisitions">
                        <Button variant="outline" className="bg-white">{_t('View PRs', 'View PRs')}</Button>
                    </Link>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                        <Plus className="w-4 h-4 mr-2" />{_t('New PO', 'New PO')}</Button>
                </div>
            </div>

            {/* Metrics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-blue-600">Pending Approvals / Receipt</p>
                            <Clock className="w-4 h-4 text-blue-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mt-2">{pendingCount}</h3>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-500">{_t('Completed (Received)', 'Completed (Received)')}</p>
                            <CheckCircle className="w-4 h-4 text-green-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mt-2">{completedCount}</h3>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-500">{_t('Total Purchase Value (Recent)', 'Total Purchase Value (Recent)')}</p>
                            <DollarSign className="w-4 h-4 text-gray-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mt-2">
                            {totalValue.toLocaleString()} <span className="text-sm font-normal text-gray-500">{_t('ر.س', 'SAR')}</span>
                        </h3>
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
                            placeholder="Search orders or vendors..." 
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 border-b">
                            <tr>
                                <th className="px-4 py-3 font-medium">Order #</th>
                                <th className="px-4 py-3 font-medium">{_t('Vendor', 'Vendor')}</th>
                                <th className="px-4 py-3 font-medium">{_t('التاريخ', 'Date')}</th>
                                <th className="px-4 py-3 font-medium">{_t('الإجمالي', 'Total')}</th>
                                <th className="px-4 py-3 font-medium">{_t('الحالة', 'Status')}</th>
                                <th className="px-4 py-3 font-medium text-right">{_t('إجراءات', 'Actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {orders.map((po) => (
                                <tr key={po.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 font-medium text-gray-900">
                                        PO-{po.orderNo}
                                    </td>
                                    <td className="px-4 py-3 text-gray-700 font-medium">
                                        {po.supplier?.name || 'Walk-in Vendor'}
                                        {po.isForeign && <span className="ml-2 text-xs text-orange-500 bg-orange-50 px-1 py-0.5 rounded border border-orange-100">{_t('Import', 'Import')}</span>}
                                    </td>
                                    <td className="px-4 py-3 text-gray-500">
                                        {format(new Date(po.date), 'MMM dd, yyyy')}
                                    </td>
                                    <td className="px-4 py-3 font-medium text-gray-900">
                                        {Number(po.total).toLocaleString()} SAR
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                            po.status === 'completed' ? 'bg-green-100 text-green-800' :
                                            po.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                                            po.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                            'bg-orange-100 text-orange-800'
                                        }`}>
                                            {po.status.charAt(0).toUpperCase() + po.status.slice(1)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">{_t('عرض', 'View')}</Button>
                                    </td>
                                </tr>
                            ))}
                            {orders.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center">
                                            <FileText className="w-10 h-10 text-gray-300 mb-3" />
                                            <p className="text-lg font-medium text-gray-900">{_t('No Purchase Orders', 'No Purchase Orders')}</p>
                                            <Button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white">
                                                <Plus className="w-4 h-4 mr-2" />{_t('Create First PO', 'Create First PO')}</Button>
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
