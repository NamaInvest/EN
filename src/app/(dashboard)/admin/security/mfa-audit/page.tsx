import React from 'react';
import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';
import { Shield, ShieldAlert, AlertTriangle, CheckCircle, Activity } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default async function MfaAuditPage() {
    const logs = await prisma.mfaAttempt.findMany({
        orderBy: { attemptedAt: 'desc' },
        take: 100,
        include: {
            user: { select: { username: true, fullName: true, id: true } }
        }
    });

    const stats = {
        total: logs.length,
        success: logs.filter(l => l.success).length,
        failed: logs.filter(l => !l.success).length,
        locked: await prisma.user.count({ where: { mfaLockedUntil: { gt: new Date() } } })
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">MFA Audit Log</h1>
                <p className="text-gray-500 mt-2">Monitor two-factor authentication attempts across the organization.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Attempts</p>
                                <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</h3>
                            </div>
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                                <Activity className="w-5 h-5" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Successful Logins</p>
                                <h3 className="text-2xl font-bold text-green-600 mt-1">{stats.success}</h3>
                            </div>
                            <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                                <CheckCircle className="w-5 h-5" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Failed Attempts</p>
                                <h3 className="text-2xl font-bold text-red-600 mt-1">{stats.failed}</h3>
                            </div>
                            <div className="p-3 bg-red-50 text-red-600 rounded-lg">
                                <ShieldAlert className="w-5 h-5" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Currently Locked</p>
                                <h3 className="text-2xl font-bold text-orange-600 mt-1">{stats.locked}</h3>
                            </div>
                            <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 border-b">
                            <tr>
                                <th className="px-4 py-3 font-medium">Time</th>
                                <th className="px-4 py-3 font-medium">User</th>
                                <th className="px-4 py-3 font-medium">Method</th>
                                <th className="px-4 py-3 font-medium">Result</th>
                                <th className="px-4 py-3 font-medium">Reason</th>
                                <th className="px-4 py-3 font-medium">IP Address</th>
                                <th className="px-4 py-3 font-medium">Device/Agent</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {logs.map(log => (
                                <tr key={log.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                                        {format(new Date(log.attemptedAt), 'yyyy-MM-dd HH:mm:ss')}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-gray-900">{log.user.fullName}</div>
                                        <div className="text-xs text-gray-500">{log.user.username}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                                            {log.method.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {log.success ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                                Success
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                                                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                                Failed
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {log.failureReason || '-'}
                                    </td>
                                    <td className="px-4 py-3 font-mono text-xs text-gray-500">
                                        {log.ipAddress || 'unknown'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="max-w-[200px] truncate text-xs text-gray-500" title={log.userAgent || ''}>
                                            {log.userAgent || '-'}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {logs.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                                        No MFA attempts recorded yet.
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
