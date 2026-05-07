import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Plus, Network, Play, FileText, ArrowRight } from 'lucide-react';

import prisma from '@/lib/prisma';
import { _t } from '@/lib/server-t';
export default async function AllocationsPage() {
    // Fetch Allocation Rules
    const rules = await prisma.allocationRule.findMany({
        orderBy: { id: 'asc' },
        take: 50
    });

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                        <Network className="w-8 h-8 text-teal-600" />{_t('Allocation Engine', 'Allocation Engine')}</h1>
                    <p className="text-gray-500 mt-1">{_t('Manage overhead cost allocation rules and revenue distribution.', 'Manage overhead cost allocation rules and revenue distribution.')}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="bg-white">
                        <Play className="w-4 h-4 mr-2" />{_t('Run All Rules', 'Run All Rules')}</Button>
                    <Button className="bg-teal-600 hover:bg-teal-700 text-white shadow-sm">
                        <Plus className="w-4 h-4 mr-2" />{_t('New Rule', 'New Rule')}</Button>
                </div>
            </div>

            {/* Data Grid */}
            <Card className="overflow-hidden border-gray-200 shadow-sm bg-white">
                <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Search rules..." 
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 border-b">
                            <tr>
                                <th className="px-4 py-3 font-medium">{_t('Rule Number', 'Rule Number')}</th>
                                <th className="px-4 py-3 font-medium">{_t('الاسم', 'Name')}</th>
                                <th className="px-4 py-3 font-medium">{_t('النوع', 'Type')}</th>
                                <th className="px-4 py-3 font-medium">{_t('Driver', 'Driver')}</th>
                                <th className="px-4 py-3 font-medium">{_t('الحالة', 'Status')}</th>
                                <th className="px-4 py-3 font-medium text-right">{_t('إجراءات', 'Actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {rules.map((r) => (
                                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 font-medium text-gray-900">
                                        RUL-{r.id.toString().padStart(4, '0')}
                                    </td>
                                    <td className="px-4 py-3 text-gray-700">
                                        {r.name}
                                    </td>
                                    <td className="px-4 py-3 text-gray-500">
                                        <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded text-xs">
                                            {r.basis}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-500">
                                        {r.basis || 'N/A'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 border rounded text-xs font-bold ${
                                            r.isActive ? 'bg-teal-100 text-teal-800 border-teal-200' : 'bg-gray-100 text-gray-800 border-gray-200'
                                        }`}>
                                            {r.isActive ? 'ACTIVE' : 'INACTIVE'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Button variant="ghost" size="sm" className="text-teal-600 hover:text-teal-700 hover:bg-teal-50">{_t('Execute', 'Execute')}<ArrowRight className="w-4 h-4 ml-1" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {rules.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center">
                                            <Network className="w-10 h-10 text-gray-300 mb-3" />
                                            <p className="text-lg font-medium text-gray-900">{_t('No Allocation Rules', 'No Allocation Rules')}</p>
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
