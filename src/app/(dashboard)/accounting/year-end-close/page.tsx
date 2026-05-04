"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, FileOutput, ShieldAlert, CheckSquare } from 'lucide-react';

export default function YearEndCloseDashboard() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Period & Year-End Close</h1>
                    <p className="text-muted-foreground">Manage financial period locking, retained earnings rollover, and audit trails</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <FileOutput className="h-4 w-4 mr-2" /> Generate TB
                    </Button>
                    <Button variant="default">
                        <Lock className="h-4 w-4 mr-2" /> Execute Soft Close
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Current Open Period</CardTitle>
                        <Lock className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">May 2026</div>
                        <p className="text-xs text-muted-foreground">Closes in 27 days</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pre-close Checklist</CardTitle>
                        <CheckSquare className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">4 / 12</div>
                        <p className="text-xs text-muted-foreground">Tasks completed</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Unposted JEs</CardTitle>
                        <ShieldAlert className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">15</div>
                        <p className="text-xs text-muted-foreground">Require posting before close</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Last Hard Close</CardTitle>
                        <Lock className="h-4 w-4 text-gray-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">FY 2025</div>
                        <p className="text-xs text-muted-foreground">Locked by Admin</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Closing Checklist (May 2026)</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Task</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Owner</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                                    <th className="px-4 py-3 text-right text-sm font-medium">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                <tr>
                                    <td className="px-4 py-3 text-sm">Post all pending Journal Entries</td>
                                    <td className="px-4 py-3 text-sm">Accounting Team</td>
                                    <td className="px-4 py-3 text-sm"><span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">PENDING</span></td>
                                    <td className="px-4 py-3 text-sm text-right"><Button variant="ghost" size="sm">Review</Button></td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-3 text-sm">Complete Bank Reconciliation</td>
                                    <td className="px-4 py-3 text-sm">Treasury Team</td>
                                    <td className="px-4 py-3 text-sm"><span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">DONE</span></td>
                                    <td className="px-4 py-3 text-sm text-right"><Button variant="ghost" size="sm">View</Button></td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-3 text-sm">Run Depreciation (Fixed Assets)</td>
                                    <td className="px-4 py-3 text-sm">Asset Manager</td>
                                    <td className="px-4 py-3 text-sm"><span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">OVERDUE</span></td>
                                    <td className="px-4 py-3 text-sm text-right"><Button variant="ghost" size="sm">Execute</Button></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
