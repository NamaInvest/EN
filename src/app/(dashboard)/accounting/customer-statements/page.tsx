import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Send, Clock, CheckCircle, Mail, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';

export default async function CustomerStatementsOverview() {
    const thisMonthSent = await prisma.statementDispatchLog.count({
        where: { generatedAt: { gte: new Date(new Date().setDate(1)) } }
    });
    
    const deliveryIssues = await prisma.statementDispatchLog.count({
        where: { status: { in: ['FAILED', 'BOUNCED', 'SOFT_BOUNCED'] } }
    });

    const activeSchedules = await prisma.statementSchedule.count({
        where: { enabled: true }
    });

    const logs = await prisma.statementDispatchLog.findMany({
        take: 10,
        orderBy: { generatedAt: 'desc' },
        include: { customer: true }
    });

    // Dummy open rate for now as we don't have enough events
    const openRate = 82;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Customer Statements</h1>
                    <p className="text-muted-foreground">Manage and dispatch customer account statements</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/accounting/customer-statements/templates">
                        <Button variant="outline">Manage Templates</Button>
                    </Link>
                    <Link href="/accounting/customer-statements/bulk">
                        <Button variant="default">Bulk Run</Button>
                    </Link>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Statements Sent (This Month)</CardTitle>
                        <Send className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{thisMonthSent}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{openRate}%</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Delivery Issues</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">{deliveryIssues}</div>
                        <p className="text-xs text-muted-foreground">Bounced or failed</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Scheduled Runs</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeSchedules}</div>
                        <p className="text-xs text-muted-foreground">Active cron schedules</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Dispatch Log</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Generated At</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Customer</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Channel</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Closing Bal</th>
                                    <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {logs.length === 0 ? (
                                    <tr><td colSpan={6} className="text-center py-4 text-muted-foreground">No recent dispatch logs.</td></tr>
                                ) : logs.map((log) => (
                                    <tr key={log.id}>
                                        <td className="px-4 py-3 text-sm">{format(log.generatedAt, 'yyyy-MM-dd HH:mm')}</td>
                                        <td className="px-4 py-3 text-sm">{log.customer?.name || 'Unknown'}</td>
                                        <td className="px-4 py-3 text-sm"><Mail className="inline h-4 w-4 mr-1"/> {log.deliveryChannel}</td>
                                        <td className="px-4 py-3 text-sm">
                                            <span className={`px-2 py-1 rounded-full text-xs ${log.status === 'DELIVERED' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {log.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm">SAR {Number(log.closingBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        <td className="px-4 py-3 text-sm text-right space-x-2">
                                            {log.pdfUrl ? (
                                              <a href={log.pdfUrl} target="_blank" rel="noreferrer">
                                                  <Button variant="ghost" size="sm">View PDF</Button>
                                              </a>
                                            ) : (
                                              <Button variant="ghost" size="sm" disabled>No PDF</Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
