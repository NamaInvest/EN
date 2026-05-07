import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, FileText, Send, Download, Mail, Filter } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

import prisma from '@/lib/prisma';
export default async function VendorStatementsPage() {
    // Fetch unique vendors that have purchase invoices
    // For this mock, we just fetch from purchase invoices and group by supplierName
    const invoices = await prisma.purchaseInvoice.findMany({
        select: {
            supplier: { select: { name: true } },
            total: true,
            remaining: true,
            status: true,
            date: true
        },
        orderBy: { date: 'desc' }
    });

    // Simple grouping
    const vendorsMap = new Map<string, { total: number, outstanding: number, invoiceCount: number, lastActivity: Date }>();
    invoices.forEach(inv => {
        const name = inv.supplier?.name || 'Unknown Vendor';
        const existing = vendorsMap.get(name) || { total: 0, outstanding: 0, invoiceCount: 0, lastActivity: inv.date };
        existing.total += Number(inv.total || 0);
        existing.invoiceCount += 1;
        if (inv.remaining > 0) {
            existing.outstanding += Number(inv.remaining || 0);
        }
        if (inv.date > existing.lastActivity) {
            existing.lastActivity = inv.date;
        }
        vendorsMap.set(name, existing);
    });

    const vendors = Array.from(vendorsMap.entries()).map(([name, data]) => ({
        name,
        ...data
    })).filter(v => v.outstanding > 0);

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Vendor Statements</h1>
                    <p className="text-gray-500 mt-2">Generate and send account statements to your suppliers to reconcile AP balances.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="bg-white">
                        <Filter className="w-4 h-4 mr-2" />
                        Aging Analysis
                    </Button>
                    <Link href="/accounting/vendor-statements/bulk">
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                            <Send className="w-4 h-4 mr-2" />
                            Bulk Send Statements
                        </Button>
                    </Link>
                </div>
            </div>

            <Card className="overflow-hidden border-gray-200 shadow-sm">
                <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row items-center gap-4 bg-white">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Search by vendor name..." 
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex gap-2 ml-auto">
                        <select className="border border-gray-200 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option>All Balances</option>
                            <option>&gt; 10,000 SAR</option>
                            <option>&gt; 50,000 SAR</option>
                        </select>
                        <select className="border border-gray-200 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option>As of Today</option>
                            <option>End of Last Month</option>
                        </select>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 border-b">
                            <tr>
                                <th className="px-4 py-3 font-medium">Vendor Name</th>
                                <th className="px-4 py-3 font-medium">Outstanding Balance</th>
                                <th className="px-4 py-3 font-medium">Total Invoices</th>
                                <th className="px-4 py-3 font-medium">Last Activity</th>
                                <th className="px-4 py-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {vendors.map((vendor, i) => (
                                <tr key={i} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 font-medium text-gray-900">
                                        {vendor.name}
                                    </td>
                                    <td className="px-4 py-3 font-medium text-red-600">
                                        {vendor.outstanding.toLocaleString()} SAR
                                    </td>
                                    <td className="px-4 py-3 text-gray-500">
                                        {vendor.invoiceCount}
                                    </td>
                                    <td className="px-4 py-3 text-gray-500">
                                        {format(new Date(vendor.lastActivity), 'MMM dd, yyyy')}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                                <FileText className="w-4 h-4 mr-1" /> View
                                            </Button>
                                            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                                                <Download className="w-4 h-4 mr-1" /> PDF
                                            </Button>
                                            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                                <Mail className="w-4 h-4 mr-1" /> Send
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {vendors.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center">
                                            <FileText className="w-8 h-8 text-gray-300 mb-2" />
                                            <p>No vendors with outstanding balances found.</p>
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
