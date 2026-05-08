import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, ClipboardCheck, Plus, CheckCircle, XCircle, AlertTriangle, Package, Settings, RefreshCcw } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

import prisma from '@/lib/prisma';
import { _t } from '@/lib/server-t';
export default async function QualityInspectionsPage() {
    const inspections = await prisma.qualityInspection.findMany({
        include: {
            product: true
        },
        orderBy: { inspectionDate: 'desc' },
        take: 50
    });

    const getStatusIcon = (status: string) => {
        switch (status.toUpperCase()) {
            case 'PASSED': return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'FAILED': return <XCircle className="w-4 h-4 text-red-500" />;
            case 'REWORK': return <RefreshCcw className="w-4 h-4 text-orange-500" />;
            default: return <AlertTriangle className="w-4 h-4 text-gray-400" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status.toUpperCase()) {
            case 'PASSED': return 'bg-green-100 text-green-800';
            case 'FAILED': return 'bg-red-100 text-red-800';
            case 'REWORK': return 'bg-orange-100 text-orange-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                        <ClipboardCheck className="w-8 h-8 text-teal-600" />{_t('Quality Inspections', 'Quality Inspections')}</h1>
                    <p className="text-gray-500 mt-1">{_t('Review inspection results for GRN and Manufacturing workflows.', 'Review inspection results for GRN and Manufacturing workflows.')}</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/quality">
                        <Button variant="outline" className="bg-white">{_t('Back to QMS', 'Back to QMS')}</Button>
                    </Link>
                    <Button className="bg-teal-600 hover:bg-teal-700 text-white shadow-sm">
                        <Plus className="w-4 h-4 mr-2" />{_t('Start Inspection', 'Start Inspection')}</Button>
                </div>
            </div>

            {/* Data Grid */}
            <Card className="overflow-hidden border-gray-200 shadow-sm">
                <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 bg-white">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Search reference number..." 
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 border-b">
                            <tr>
                                <th className="px-4 py-3 font-medium">{_t('Ref Number', 'Ref Number')}</th>
                                <th className="px-4 py-3 font-medium">{_t('التاريخ', 'Date')}</th>
                                <th className="px-4 py-3 font-medium">{_t('إجراء', 'Product')}</th>
                                <th className="px-4 py-3 font-medium">{_t('Sample Qty', 'Sample Qty')}</th>
                                <th className="px-4 py-3 font-medium">{_t('Inspector ID', 'Inspector ID')}</th>
                                <th className="px-4 py-3 font-medium">{_t('الحالة', 'Status')}</th>
                                <th className="px-4 py-3 font-medium text-right">{_t('إجراءات', 'Actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {inspections.map((insp) => (
                                <tr key={insp.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 font-medium text-gray-900">
                                        {insp.referenceNumber}
                                    </td>
                                    <td className="px-4 py-3 text-gray-500">
                                        {format(new Date(insp.inspectionDate), 'MMM dd, yyyy HH:mm')}
                                    </td>
                                    <td className="px-4 py-3 text-gray-900 font-medium flex items-center gap-2">
                                        <Package className="w-4 h-4 text-gray-400" />
                                        {insp.product?.name || 'Multiple/Unknown'}
                                    </td>
                                    <td className="px-4 py-3 text-gray-700">
                                        {insp.inspectedQty !== null ? Number(insp.inspectedQty) : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-gray-500">
                                        USER-{insp.inspectorId}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(insp.status)}`}>
                                            {getStatusIcon(insp.status)}
                                            {insp.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Button variant="ghost" size="sm" className="text-teal-600 hover:text-teal-700 hover:bg-teal-50">
                                            <Settings className="w-4 h-4 mr-1" />{_t('View Results', 'View Results')}</Button>
                                    </td>
                                </tr>
                            ))}
                            {inspections.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center">
                                            <ClipboardCheck className="w-10 h-10 text-gray-300 mb-3" />
                                            <p className="text-lg font-medium text-gray-900">{_t('No Inspections Found', 'No Inspections Found')}</p>
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
