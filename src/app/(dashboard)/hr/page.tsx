import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, UserPlus, FileText, GraduationCap, TrendingUp, CalendarDays, Search, Play } from 'lucide-react';
import Link from 'next/link';

export default function HrCoreDashboard() {
    // Static mockup data
    const kpis = {
        totalEmployees: 245,
        openPositions: 8,
        expiringDocs: 12,
        pendingLeaves: 5
    };

    const recentHires = [
        { id: 1, name: 'Faisal Al-Otaibi', position: 'Senior Accountant', date: '2026-05-01' },
        { id: 2, name: 'Sara Kamel', position: 'HR Specialist', date: '2026-04-28' },
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                        <Users className="w-8 h-8 text-sky-600" />
                        Human Resources (HR Core)
                    </h1>
                    <p className="text-gray-500 mt-1">Manage employee lifecycle, recruitment, training, and performance.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="bg-white">
                        <FileText className="w-4 h-4 mr-2" />
                        Export Headcount
                    </Button>
                    <Link href="/hr/employees/create">
                        <Button className="bg-sky-600 hover:bg-sky-700 text-white shadow-sm">
                            <UserPlus className="w-4 h-4 mr-2" />
                            New Employee
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Metrics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-sky-50 to-white border-sky-100">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-sky-600">Total Employees</p>
                            <Users className="w-4 h-4 text-sky-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mt-2">{kpis.totalEmployees}</h3>
                        <p className="text-xs text-sky-500 mt-1">Active headcount</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-100">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-indigo-600">Open Positions</p>
                            <Search className="w-4 h-4 text-indigo-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mt-2">{kpis.openPositions}</h3>
                        <p className="text-xs text-indigo-500 mt-1">Active job postings</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-100">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-amber-600">Expiring Docs</p>
                            <FileText className="w-4 h-4 text-amber-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mt-2">{kpis.expiringDocs}</h3>
                        <p className="text-xs text-amber-500 mt-1">Iqamas/Passports in 30 days</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-emerald-600">Pending Leaves</p>
                            <CalendarDays className="w-4 h-4 text-emerald-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mt-2">{kpis.pendingLeaves}</h3>
                        <p className="text-xs text-emerald-500 mt-1">Awaiting approval</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Hires Table */}
                <Card className="overflow-hidden border-gray-200 shadow-sm bg-white">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                            <UserPlus className="w-4 h-4 text-sky-500" />
                            Recent Hires
                        </h3>
                        <Button variant="ghost" size="sm" className="text-sky-600">View All</Button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-600 border-b">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Name</th>
                                    <th className="px-4 py-3 font-medium">Position</th>
                                    <th className="px-4 py-3 font-medium">Hire Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {recentHires.map((h) => (
                                    <tr key={h.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 font-medium text-gray-900">{h.name}</td>
                                        <td className="px-4 py-3 text-gray-700">{h.position}</td>
                                        <td className="px-4 py-3 text-gray-500">{h.date}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Quick Actions */}
                <Card className="border-gray-200 shadow-sm bg-white">
                    <div className="p-4 border-b border-gray-100">
                        <h3 className="font-semibold text-gray-800">HR Operations</h3>
                    </div>
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Link href="/hr/jobs">
                            <div className="p-4 border rounded-lg hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer group">
                                <Search className="w-6 h-6 text-indigo-500 mb-2 group-hover:scale-110 transition-transform" />
                                <h4 className="font-medium text-gray-900">Recruitment (ATS)</h4>
                                <p className="text-xs text-gray-500 mt-1">Manage job postings, applicant tracking, and interviews.</p>
                            </div>
                        </Link>
                        <Link href="/hr/training">
                            <div className="p-4 border rounded-lg hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group">
                                <GraduationCap className="w-6 h-6 text-emerald-500 mb-2 group-hover:scale-110 transition-transform" />
                                <h4 className="font-medium text-gray-900">Learning & Dev</h4>
                                <p className="text-xs text-gray-500 mt-1">Track employee training, mandatory courses, and skills.</p>
                            </div>
                        </Link>
                        <Link href="/hr/evaluations">
                            <div className="p-4 border rounded-lg hover:border-amber-500 hover:shadow-md transition-all cursor-pointer group">
                                <TrendingUp className="w-6 h-6 text-amber-500 mb-2 group-hover:scale-110 transition-transform" />
                                <h4 className="font-medium text-gray-900">Performance</h4>
                                <p className="text-xs text-gray-500 mt-1">Run 360 evaluations, goal setting, and PIP tracking.</p>
                            </div>
                        </Link>
                        <Link href="/hr/documents">
                            <div className="p-4 border rounded-lg hover:border-red-500 hover:shadow-md transition-all cursor-pointer group">
                                <FileText className="w-6 h-6 text-red-500 mb-2 group-hover:scale-110 transition-transform" />
                                <h4 className="font-medium text-gray-900">Documents</h4>
                                <p className="text-xs text-gray-500 mt-1">Monitor Iqama, passport, and medical insurance expirations.</p>
                            </div>
                        </Link>
                    </div>
                </Card>
            </div>
        </div>
    );
}
