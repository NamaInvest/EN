import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, FileWarning, Plus, AlertCircle, AlertTriangle, ShieldAlert, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

import prisma from '@/lib/prisma';
import { _t } from '@/lib/server-t';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.app.(dashboard).' });
export default async function NcrPage() {
    const ncrs = await prisma.nonConformanceReport.findMany({
        include: {
            inspection: true
        },
        orderBy: { createdAt: 'desc' },
        take: 50
    });

    const getSeverityIcon = (severity: string) => {
        switch (severity.toUpperCase()) {
            case 'CRITICAL': return <ShieldAlert className="w-4 h-4 text-red-600" />;
            case 'HIGH': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
            case 'MEDIUM': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
            default: return <AlertCircle className="w-4 h-4 text-blue-400" />;
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity.toUpperCase()) {
            case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200';
            case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default: return 'bg-blue-100 text-blue-800 border-blue-200';
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                        <FileWarning className="w-8 h-8 text-red-600" />{_t('Non-Conformance Reports (NCR)', 'Non-Conformance Reports (NCR)')}</h1>
                    <p className="text-gray-500 mt-1">{_t('Manage material review board (MRB) decisions and dispositions.', 'Manage material review board (MRB) decisions and dispositions.')}</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/quality">
                        <Button variant="outline" className="bg-white">{_t('Back to QMS', 'Back to QMS')}</Button>
                    </Link>
                    <Button className="bg-red-600 hover:bg-red-700 text-white shadow-sm">
                        <Plus className="w-4 h-4 mr-2" />{_t('Create NCR', 'Create NCR')}</Button>
                </div>
            </div>

            {/* Data Grid */}
            <Card className="overflow-hidden border-gray-200 shadow-sm">
                <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 bg-white">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Search NCRs..." 
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 border-b">
                            <tr>
                                <th className="px-4 py-3 font-medium">{_t('NCR ID', 'NCR ID')}</th>
                                <th className="px-4 py-3 font-medium">{_t('التاريخ', 'Date')}</th>
                                <th className="px-4 py-3 font-medium">{_t('Inspection Ref', 'Inspection Ref')}</th>
                                <th className="px-4 py-3 font-medium">{_t('Severity', 'Severity')}</th>
                                <th className="px-4 py-3 font-medium">{_t('الحالة', 'Status')}</th>
                                <th className="px-4 py-3 font-medium">{_t('الوصف', 'Description')}</th>
                                <th className="px-4 py-3 font-medium text-right">{_t('إجراءات', 'Actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {ncrs.map((ncr) => (
                                <tr key={ncr.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 font-medium text-gray-900">
                                        NCR-{String(ncr.id).padStart(4, '0')}
                                    </td>
                                    <td className="px-4 py-3 text-gray-500">
                                        {format(new Date(ncr.createdAt), 'MMM dd, yyyy')}
                                    </td>
                                    <td className="px-4 py-3 text-gray-700 font-medium">
                                        {ncr.inspection?.referenceNumber || '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 border rounded text-xs font-bold ${getSeverityColor(ncr.severity)}`}>
                                            {getSeverityIcon(ncr.severity)}
                                            {ncr.severity}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                            ncr.dispositionType === 'USE_AS_IS' ? 'bg-blue-100 text-blue-800' :
                                            ncr.dispositionType === 'REWORK' ? 'bg-green-100 text-green-800' :
                                            ncr.dispositionType === 'SCRAP' ? 'bg-red-100 text-red-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                            {ncr.dispositionType}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-500 truncate max-w-[200px]" title={ncr.description || ''}>
                                        {ncr.description || 'No description provided'}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">{_t('MRB Review', 'MRB Review')}<ArrowRight className="w-4 h-4 ml-1" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {ncrs.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center">
                                            <FileWarning className="w-10 h-10 text-gray-300 mb-3" />
                                            <p className="text-lg font-medium text-gray-900">{_t('No NCRs Found', 'No NCRs Found')}</p>
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
