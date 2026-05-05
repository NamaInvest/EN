'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function TenantPortalPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white border-b px-6 py-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-blue-900">Tenant Portal</h1>
                <div className="flex items-center space-x-4">
                    <span className="font-medium">Welcome, TechCorp LLC (Unit 401)</span>
                    <Button variant="outline">Logout</Button>
                </div>
            </header>

            <main className="flex-1 p-6 max-w-6xl mx-auto w-full space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-blue-600 text-white">
                        <CardHeader>
                            <CardTitle className="text-blue-100">Current Balance</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold">SAR 45,000</div>
                            <p className="text-sm mt-2 text-blue-100">Due by May 15, 2026</p>
                            <Button className="w-full mt-4 bg-white text-blue-600 hover:bg-gray-100">Pay Now</Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Active Lease</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between"><span className="text-gray-500">Property</span><span className="font-medium">Riyadh Business Park</span></div>
                                <div className="flex justify-between"><span className="text-gray-500">Unit</span><span className="font-medium">Office 401</span></div>
                                <div className="flex justify-between"><span className="text-gray-500">Start Date</span><span className="font-medium">Jan 1, 2024</span></div>
                                <div className="flex justify-between"><span className="text-gray-500">End Date</span><span className="font-medium">Dec 31, 2028</span></div>
                            </div>
                            <Button variant="outline" className="w-full mt-4">Download Contract</Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Maintenance</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <p className="text-sm text-gray-500">You have 1 active maintenance request.</p>
                                <div className="p-3 bg-gray-100 rounded-md text-sm border-l-4 border-yellow-500">
                                    <div className="font-bold">AC Not Cooling</div>
                                    <div className="text-gray-500">Status: Scheduled for Tomorrow 10 AM</div>
                                </div>
                            </div>
                            <Button variant="outline" className="w-full mt-4">New Request</Button>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
