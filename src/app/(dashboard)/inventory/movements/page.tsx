import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Activity, ArrowRightLeft, ArrowDownCircle, ArrowUpCircle, Settings } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

import prisma from '@/lib/prisma';
import { _t } from '@/lib/server-t';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.app.(dashboard).' });
export default async function StockMovementsPage() {
    const movements = await prisma.stockMovement.findMany({
        include: {
            product: true,
            stock: true,
            user: true
        },
        orderBy: { date: 'desc' },
        take: 100
    });

    const getMovementIcon = (type: string) => {
        switch (type.toLowerCase()) {
            case 'in': return <ArrowDownCircle className="w-4 h-4 text-green-500" />;
            case 'out': return <ArrowUpCircle className="w-4 h-4 text-red-500" />;
            case 'transfer': return <ArrowRightLeft className="w-4 h-4 text-blue-500" />;
            case 'adjustment': return <Settings className="w-4 h-4 text-orange-500" />;
            default: return <Activity className="w-4 h-4 text-gray-500" />;
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                        <Activity className="w-8 h-8 text-indigo-600" />{_t('سجل حركات الأسهم', 'Stock Movements Log')}</h1>
                    <p className="text-gray-500 mt-1">{_t('مسار التدقيق لجميع معاملات المخزون.', 'Audit trail for all inventory transactions.')}</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/inventory/wms">
                        <Button variant="outline" className="bg-white">{_t('العودة إلى WMS', 'Back to WMS')}</Button>
                    </Link>
                </div>
            </div>

            {/* Data Grid */}
            <Card className="overflow-hidden border-gray-200 shadow-sm">
                <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 bg-white">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Search product or ref..." 
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div className="flex gap-2 text-sm text-gray-600">
                        <span className="flex items-center gap-1"><ArrowDownCircle className="w-4 h-4 text-green-500"/> In</span>
                        <span className="flex items-center gap-1 ml-3"><ArrowUpCircle className="w-4 h-4 text-red-500"/>{_t('خارج', 'Out')}</span>
                        <span className="flex items-center gap-1 ml-3"><ArrowRightLeft className="w-4 h-4 text-blue-500"/>{_t('تحويل', 'Transfer')}</span>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 border-b">
                            <tr>
                                <th className="px-4 py-3 font-medium">{_t('النوع', 'Type')}</th>
                                <th className="px-4 py-3 font-medium">{_t('التاريخ', 'Date')}</th>
                                <th className="px-4 py-3 font-medium">{_t('إجراء', 'Product')}</th>
                                <th className="px-4 py-3 font-medium">{_t('المستودع', 'Warehouse')}</th>
                                <th className="px-4 py-3 font-medium">{_t('الكمية', 'Quantity')}</th>
                                <th className="px-4 py-3 font-medium">{_t('المرجع الوثيقة', 'Ref Doc')}</th>
                                <th className="px-4 py-3 font-medium">{_t('المستخدم', 'User')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {movements.map((mov) => (
                                <tr key={mov.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 font-medium text-gray-900 flex items-center gap-2 uppercase text-xs">
                                        {getMovementIcon(mov.type)}
                                        {mov.type}
                                    </td>
                                    <td className="px-4 py-3 text-gray-500">
                                        {format(new Date(mov.date), 'MMM dd, yyyy HH:mm')}
                                    </td>
                                    <td className="px-4 py-3 text-gray-900 font-medium">
                                        {mov.product?.name || 'Unknown Product'}
                                    </td>
                                    <td className="px-4 py-3 text-gray-700">
                                        {mov.stock?.name || '-'}
                                    </td>
                                    <td className="px-4 py-3 font-bold">
                                        <span className={
                                            mov.type.toLowerCase() === 'in' ? 'text-green-600' :
                                            mov.type.toLowerCase() === 'out' ? 'text-red-600' :
                                            'text-gray-900'
                                        }>
                                            {mov.type.toLowerCase() === 'in' ? '+' : mov.type.toLowerCase() === 'out' ? '-' : ''}
                                            {Number(mov.quantity)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-500">
                                        {mov.referenceType ? `${mov.referenceType} #${mov.referenceId}` : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-gray-500">
                                        {mov.user?.fullName || 'System'}
                                    </td>
                                </tr>
                            ))}
                            {movements.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                                        <p className="text-lg font-medium text-gray-900">{_t('لا توجد حركات', 'No Movements')}</p>
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
