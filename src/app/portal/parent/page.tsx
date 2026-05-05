'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ParentPortalPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white border-b px-6 py-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-indigo-900">Parent Portal</h1>
                <div className="flex items-center space-x-4">
                    <span className="font-medium">Welcome, Mr. Ali (Parent of Omar)</span>
                    <Button variant="outline">Logout</Button>
                </div>
            </header>

            <main className="flex-1 p-6 max-w-6xl mx-auto w-full space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-indigo-600 text-white">
                        <CardHeader>
                            <CardTitle className="text-indigo-100">Outstanding Fees</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold">SAR 2,500</div>
                            <p className="text-sm mt-2 text-indigo-100">Term 1 Tuition Due</p>
                            <Button className="w-full mt-4 bg-white text-indigo-600 hover:bg-gray-100">Pay Now</Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Academic Performance</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between"><span className="text-gray-500">Mathematics</span><span className="font-bold text-green-600">A</span></div>
                                <div className="flex justify-between"><span className="text-gray-500">Science</span><span className="font-bold text-green-600">A-</span></div>
                                <div className="flex justify-between"><span className="text-gray-500">English</span><span className="font-bold text-yellow-600">B+</span></div>
                            </div>
                            <Button variant="outline" className="w-full mt-4">Download Report Card</Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Attendance</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between"><span className="text-gray-500">Days Present</span><span className="font-medium">45</span></div>
                                <div className="flex justify-between"><span className="text-gray-500">Days Absent</span><span className="font-medium text-red-500">2</span></div>
                                <div className="flex justify-between"><span className="text-gray-500">Late Arrivals</span><span className="font-medium text-yellow-500">1</span></div>
                            </div>
                            <Button variant="outline" className="w-full mt-4">View Calendar</Button>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
