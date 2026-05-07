import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Monitor, Terminal, FileText, CheckCircle, Clock, Plus } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

import prisma from '@/lib/prisma';
import { _t } from '@/lib/server-t';
export default async function PosSessionsPage() {
    const sessions = await prisma.posSession.findMany({
        include: {
            user: true,
        },
        orderBy: { openedAt: 'desc' },
        take: 50
    });

    const openCount = sessions.filter(s => s.status === 'OPEN').length;
    const closedCount = sessions.filter(s => s.status === 'CLOSED').length;
    
    // Sum opening float + variance for quick stats
    const totalVariance = sessions.reduce((sum, s) => sum + Number(s.variance || 0), 0);

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                        <Terminal className="w-8 h-8 text-violet-600" />{_t('POS Sessions (Back Office)', 'POS Sessions (Back Office)')}</h1>
                    <p className="text-gray-500 mt-1">{_t('Manage cash drawers, terminal sessions, and end-of-day reconciliations.', 'Manage cash drawers, terminal sessions, and end-of-day reconciliations.')}</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/restaurant-tables">
                        <Button variant="outline" className="bg-white">{_t('Restaurant Setup', 'Restaurant Setup')}</Button>
                    </Link>
                    <Link href="/pos" target="_blank">
                        <Button className="bg-violet-600 hover:bg-violet-700 text-white shadow-sm">
                            <Monitor className="w-4 h-4 mr-2" />{_t('Launch POS Terminal', 'Launch POS Terminal')}</Button>
                    </Link>
                </div>
            </div>

            {/* Metrics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-violet-50 to-white border-violet-100">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-violet-600">{_t('Active Terminals (OPEN)', 'Active Terminals (OPEN)')}</p>
                            <Monitor className="w-4 h-4 text-violet-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mt-2">{openCount}</h3>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-500">{_t('Closed Sessions', 'Closed Sessions')}</p>
                            <CheckCircle className="w-4 h-4 text-green-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mt-2">{closedCount}</h3>
                    </CardContent>
                </Card>
                <Card className={totalVariance < 0 ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <p className={`text-sm font-medium ${totalVariance < 0 ? 'text-red-600' : 'text-green-600'}`}>{_t('Total Cash Variance', 'Total Cash Variance')}</p>
                            <FileText className={`w-4 h-4 ${totalVariance < 0 ? 'text-red-400' : 'text-green-400'}`} />
                        </div>
                        <h3 className={`text-2xl font-bold ${totalVariance < 0 ? 'text-red-900' : 'text-green-900'} mt-2`}>
                            {totalVariance.toLocaleString()} <span className="text-sm font-normal opacity-70">{_t('ر.س', 'SAR')}</span>
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
                            placeholder="Search by cashier or terminal..." 
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 border-b">
                            <tr>
                                <th className="px-4 py-3 font-medium">{_t('Session ID', 'Session ID')}</th>
                                <th className="px-4 py-3 font-medium">{_t('كاشير', 'Cashier')}</th>
                                <th className="px-4 py-3 font-medium">{_t('Terminal', 'Terminal')}</th>
                                <th className="px-4 py-3 font-medium">{_t('Opened At', 'Opened At')}</th>
                                <th className="px-4 py-3 font-medium">{_t('Opening Float', 'Opening Float')}</th>
                                <th className="px-4 py-3 font-medium">{_t('Variance', 'Variance')}</th>
                                <th className="px-4 py-3 font-medium">{_t('الحالة', 'Status')}</th>
                                <th className="px-4 py-3 font-medium text-right">{_t('إجراءات', 'Actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {sessions.map((sess) => (
                                <tr key={sess.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 font-medium text-gray-900">
                                        SES-{sess.id}
                                    </td>
                                    <td className="px-4 py-3 text-gray-700 font-medium">
                                        {sess.user?.fullName || 'Unknown User'}
                                    </td>
                                    <td className="px-4 py-3 text-gray-500">
                                        Terminal #{sess.terminalId || '01'}
                                    </td>
                                    <td className="px-4 py-3 text-gray-500">
                                        {format(new Date(sess.openedAt), 'MMM dd, yyyy HH:mm')}
                                    </td>
                                    <td className="px-4 py-3 font-medium text-gray-900">
                                        {Number(sess.openingFloat).toLocaleString()} SAR
                                    </td>
                                    <td className="px-4 py-3 font-medium">
                                        {sess.variance !== null ? (
                                            <span className={Number(sess.variance) < 0 ? 'text-red-600' : Number(sess.variance) > 0 ? 'text-green-600' : 'text-gray-500'}>
                                                {Number(sess.variance).toLocaleString()} SAR
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                            sess.status === 'OPEN' ? 'bg-blue-100 text-blue-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                            {sess.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Button variant="ghost" size="sm" className="text-violet-600 hover:text-violet-700 hover:bg-violet-50">{_t('Z-Report', 'Z-Report')}</Button>
                                    </td>
                                </tr>
                            ))}
                            {sessions.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center">
                                            <Terminal className="w-10 h-10 text-gray-300 mb-3" />
                                            <p className="text-lg font-medium text-gray-900">{_t('No POS Sessions', 'No POS Sessions')}</p>
                                            <p className="text-sm mt-1">{_t('Open a terminal session to start receiving payments.', 'Open a terminal session to start receiving payments.')}</p>
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
