import React from 'react';
import { prisma } from '@/lib/prisma';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Search, FileText, CheckCircle, Clock, AlertTriangle, ArrowRight, Zap } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default async function PaymentRunsPage() {
    // Fetch recent payment runs
    const runs = await prisma.paymentRun.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20
    });

    const stats = {
        totalPending: runs.filter(r => r.status === 'PENDING_APPROVAL').length,
        totalPaid: runs.filter(r => r.status === 'COMPLETED').length,
        totalAmount: runs.filter(r => r.status === 'COMPLETED').reduce((acc, curr) => acc + Number(curr.totalAmount || 0), 0)
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Payment Runs (F110)</h1>
                    <p className="text-gray-500 mt-2">Manage automated batch payments via SARIE, SEPA, and SWIFT.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="bg-white">
                        <Zap className="w-4 h-4 mr-2 text-yellow-500" />
                        Discount Opportunities
                    </Button>
                    <Link href="/accounting/payment-runs/create">
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                            <Plus className="w-4 h-4 mr-2" />
                            New Payment Run
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Pending Approval</p>
                                <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.totalPending}</h3>
                            </div>
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
                                <Clock className="w-5 h-5" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-green-500">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Completed Runs</p>
                                <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.totalPaid}</h3>
                            </div>
                            <div className="p-3 bg-green-50 text-green-600 rounded-full">
                                <CheckCircle className="w-5 h-5" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-purple-500">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Disbursed (SAR)</p>
                                <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.totalAmount.toLocaleString()}</h3>
                            </div>
                            <div className="p-3 bg-purple-50 text-purple-600 rounded-full">
                                <FileText className="w-5 h-5" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="overflow-hidden border-gray-200 shadow-sm">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
                    <div className="relative w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Search by run ID, status..." 
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <Button variant="ghost" size="sm" className="text-gray-600">Filter</Button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 border-b">
                            <tr>
                                <th className="px-4 py-3 font-medium">Run ID</th>
                                <th className="px-4 py-3 font-medium">Date</th>
                                <th className="px-4 py-3 font-medium">Created By</th>
                                <th className="px-4 py-3 font-medium">Status</th>
                                <th className="px-4 py-3 font-medium">Invoices</th>
                                <th className="px-4 py-3 font-medium">Total Amount</th>
                                <th className="px-4 py-3 font-medium text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {runs.map(run => (
                                <tr key={run.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 font-medium text-gray-900">
                                        PR-{String(run.id).padStart(5, '0')}
                                    </td>
                                    <td className="px-4 py-3 text-gray-500">
                                        {format(new Date(run.createdAt), 'MMM dd, yyyy')}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {run.proposedByUserId || 'System'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                            run.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border-green-200' :
                                            run.status === 'PENDING_APPROVAL' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                            run.status === 'PROPOSAL' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                            'bg-red-50 text-red-700 border-red-200'
                                        }`}>
                                            {run.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-500">
                                        {run.totalCount || 0}
                                    </td>
                                    <td className="px-4 py-3 font-medium text-gray-900">
                                        {Number(run.totalAmount || 0).toLocaleString()} <span className="text-gray-400 font-normal">{run.currency || 'SAR'}</span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                            View <ArrowRight className="w-4 h-4 ml-1" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {runs.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center">
                                            <FileText className="w-8 h-8 text-gray-300 mb-2" />
                                            <p>No payment runs found.</p>
                                            <Link href="/accounting/payment-runs/create" className="mt-2 text-sm text-blue-600 hover:underline">
                                                Create your first payment run
                                            </Link>
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
