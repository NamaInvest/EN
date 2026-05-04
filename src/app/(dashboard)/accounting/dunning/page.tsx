"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, FileWarning, Handshake, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function DunningDashboard() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dunning Management</h1>
                    <p className="text-muted-foreground">Automated collections and overdue follow-ups</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="default">
                        <Play className="h-4 w-4 mr-2" /> Run Daily Dunning
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Overdue</CardTitle>
                        <FileWarning className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">SAR 425k</div>
                        <p className="text-xs text-muted-foreground">Across 84 invoices</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Letters Today</CardTitle>
                        <FileWarning className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">12</div>
                        <p className="text-xs text-muted-foreground">Sent automatically</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Promises</CardTitle>
                        <Handshake className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">5</div>
                        <p className="text-xs text-muted-foreground">SAR 120k expected</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Blocked Customers</CardTitle>
                        <ShieldAlert className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">2</div>
                        <p className="text-xs text-muted-foreground">Credit hold (Level 4)</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader className="flex justify-between items-center flex-row">
                        <CardTitle>Recent Letters</CardTitle>
                        <Link href="/accounting/dunning/letters">
                            <Button variant="ghost" size="sm">View All</Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <table className="min-w-full divide-y divide-border">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Customer</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Level</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {[1, 2, 3].map((i) => (
                                        <tr key={i}>
                                            <td className="px-4 py-3 text-sm">Customer {i}</td>
                                            <td className="px-4 py-3 text-sm">Level {i}</td>
                                            <td className="px-4 py-3 text-sm">SAR {(i * 1500).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex justify-between items-center flex-row">
                        <CardTitle>Promises to Pay</CardTitle>
                        <Link href="/accounting/dunning/promises">
                            <Button variant="ghost" size="sm">View All</Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <table className="min-w-full divide-y divide-border">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Customer</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Promised Date</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {[1, 2].map((i) => (
                                        <tr key={i}>
                                            <td className="px-4 py-3 text-sm">Customer {i+3}</td>
                                            <td className="px-4 py-3 text-sm">2026-05-1{i}</td>
                                            <td className="px-4 py-3 text-sm"><span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">ACTIVE</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
