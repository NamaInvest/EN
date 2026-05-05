'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionFilter, setActionFilter] = useState('');
    const [tableFilter, setTableFilter] = useState('');

    const fetchLogs = async () => {
        setLoading(true);
        try {
            let url = '/api/audit-logs?limit=100';
            if (actionFilter) url += `&action=${actionFilter}`;
            if (tableFilter) url += `&tableName=${tableFilter}`;
            const res = await fetch(url);
            const data = await res.json();
            if (Array.isArray(data)) {
                setLogs(data);
            }
        } catch (err) {
            console.error('Failed to fetch audit logs', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [actionFilter, tableFilter]);

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Audit Trail</h1>
                <Button variant="outline">Export CSV</Button>
            </div>
            
            <div className="flex space-x-4 mb-4">
                <Input 
                    placeholder="Filter by Action (e.g. CREATE)" 
                    value={actionFilter}
                    onChange={(e) => setActionFilter(e.target.value)}
                    className="max-w-xs"
                />
                <Input 
                    placeholder="Filter by Entity (e.g. Invoice)" 
                    value={tableFilter}
                    onChange={(e) => setTableFilter(e.target.value)}
                    className="max-w-xs"
                />
                <Button onClick={fetchLogs}>Refresh</Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>System Activity Logs</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? <p>Loading...</p> : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                    <tr>
                                        <th className="px-4 py-3">Timestamp</th>
                                        <th className="px-4 py-3">User</th>
                                        <th className="px-4 py-3">Action</th>
                                        <th className="px-4 py-3">Entity</th>
                                        <th className="px-4 py-3">Entity ID</th>
                                        <th className="px-4 py-3">Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map((log, idx) => (
                                        <tr key={idx} className="border-b dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800">
                                            <td className="px-4 py-3 whitespace-nowrap">{new Date(log.date).toLocaleString()}</td>
                                            <td className="px-4 py-3 font-medium">{log.user?.fullName || 'System'}</td>
                                            <td className="px-4 py-3">
                                                <Badge variant="outline" className={log.action === 'DELETE' ? 'bg-red-100' : 'bg-gray-100'}>
                                                    {log.action}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3">{log.tableName}</td>
                                            <td className="px-4 py-3">{log.recordId}</td>
                                            <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate" title={log.details}>
                                                {log.details || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                    {logs.length === 0 && (
                                        <tr><td colSpan={6} className="text-center py-6 text-gray-500">No logs found matching criteria.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
