import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, FileText, Globe, AlertTriangle, Play, FileSpreadsheet, Plus, Settings } from 'lucide-react';
import Link from 'next/link';

export default function TaxDashboard() {
    // Mock data to prevent Prisma schema errors before backend sync
    const vatReturns = [
        { id: 1, period: 'Q1 2026', status: 'DRAFT', amount: 45000, deadline: '2026-04-30' },
        { id: 2, period: 'Q4 2025', status: 'SUBMITTED', amount: 42100, deadline: '2026-01-31' },
    ];

    const zatcaStatus = {
        cleared: 1432,
        failed: 3,
        pending: 12
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                        <ShieldCheck className="w-8 h-8 text-emerald-600" />
                        Tax & ZATCA Compliance
                    </h1>
                    <p className="text-gray-500 mt-1">Manage VAT, Zakat, WHT, and ZATCA Phase 2 E-Invoicing integrations.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="bg-white">
                        <Settings className="w-4 h-4 mr-2" />
                        ZATCA Settings
                    </Button>
                    <Link href="/tax/vat-returns">
                        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                            <Plus className="w-4 h-4 mr-2" />
                            New VAT Return
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Metrics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-emerald-600">ZATCA Cleared</p>
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mt-2">{zatcaStatus.cleared}</h3>
                        <p className="text-xs text-emerald-500 mt-1">Total phase 2 cleared B2B/B2C</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-red-50 to-white border-red-100">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-red-600">ZATCA Failed</p>
                            <AlertTriangle className="w-4 h-4 text-red-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mt-2">{zatcaStatus.failed}</h3>
                        <p className="text-xs text-red-500 mt-1">Require immediate attention</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-blue-600">WHT Pending</p>
                            <Globe className="w-4 h-4 text-blue-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mt-2">SAR 12,450</h3>
                        <p className="text-xs text-blue-500 mt-1">Withholding tax payable</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-purple-600">Zakat Provision</p>
                            <FileText className="w-4 h-4 text-purple-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mt-2">SAR 85,200</h3>
                        <p className="text-xs text-purple-500 mt-1">Estimated current fiscal year</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* VAT Returns Table */}
                <Card className="overflow-hidden border-gray-200 shadow-sm bg-white">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-800">Recent VAT Returns</h3>
                        <Button variant="ghost" size="sm" className="text-emerald-600">View All</Button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-600 border-b">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Period</th>
                                    <th className="px-4 py-3 font-medium text-right">Net VAT</th>
                                    <th className="px-4 py-3 font-medium">Deadline</th>
                                    <th className="px-4 py-3 font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {vatReturns.map((r) => (
                                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 font-medium text-gray-900">{r.period}</td>
                                        <td className="px-4 py-3 text-right font-medium">SAR {r.amount.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-gray-500">{r.deadline}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                                                r.status === 'SUBMITTED' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'
                                            }`}>
                                                {r.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Quick Actions */}
                <Card className="border-gray-200 shadow-sm bg-white">
                    <div className="p-4 border-b border-gray-100">
                        <h3 className="font-semibold text-gray-800">Compliance Shortcuts</h3>
                    </div>
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Link href="/tax/zatca-onboard">
                            <div className="p-4 border rounded-lg hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group">
                                <ShieldCheck className="w-6 h-6 text-emerald-500 mb-2 group-hover:scale-110 transition-transform" />
                                <h4 className="font-medium text-gray-900">ZATCA Onboarding</h4>
                                <p className="text-xs text-gray-500 mt-1">Generate CSR, obtain CSID & PCSID for E-Invoicing Phase 2.</p>
                            </div>
                        </Link>
                        <Link href="/tax/wht">
                            <div className="p-4 border rounded-lg hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group">
                                <Globe className="w-6 h-6 text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
                                <h4 className="font-medium text-gray-900">WHT Management</h4>
                                <p className="text-xs text-gray-500 mt-1">Calculate withholding tax and issue certificates to foreign vendors.</p>
                            </div>
                        </Link>
                        <Link href="/tax/zakat">
                            <div className="p-4 border rounded-lg hover:border-purple-500 hover:shadow-md transition-all cursor-pointer group">
                                <FileSpreadsheet className="w-6 h-6 text-purple-500 mb-2 group-hover:scale-110 transition-transform" />
                                <h4 className="font-medium text-gray-900">Zakat Declaration</h4>
                                <p className="text-xs text-gray-500 mt-1">Estimate Zakatable base (2.577%) based on current financials.</p>
                            </div>
                        </Link>
                        <div className="p-4 border rounded-lg hover:border-red-500 hover:shadow-md transition-all cursor-pointer group bg-red-50/30">
                            <AlertTriangle className="w-6 h-6 text-red-500 mb-2 group-hover:scale-110 transition-transform" />
                            <h4 className="font-medium text-gray-900">Failed Submissions</h4>
                            <p className="text-xs text-gray-500 mt-1">Review and retry {zatcaStatus.failed} failed ZATCA invoice submissions.</p>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
