'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function DistributionRoutesPage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const [routes, setRoutes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRoutes = async () => {
            try {
                const res = await fetch('/api/v3/distribution/routes');
                const data = await res.json();
                if (data.routes) setRoutes(data.routes);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchRoutes();
    }, []);

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Route Optimization & Dispatch</h1>
                <Button>Optimize New Route</Button>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Delivery Routes</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? <p>Loading...</p> : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                    <tr>
                                        <th className="px-4 py-3">Route ID</th>
                                        <th className="px-4 py-3">Region</th>
                                        <th className="px-4 py-3">Driver</th>
                                        <th className="px-4 py-3">Vehicle</th>
                                        <th className="px-4 py-3 text-center">Stops</th>
                                        <th className="px-4 py-3">Est. Completion</th>
                                        <th className="px-4 py-3">{_t('الحالة', 'Status')}</th>
                                        <th className="px-4 py-3 text-right">{_t('إجراءات', 'Actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {routes.map((rt, idx) => (
                                        <tr key={idx} className="border-b dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800">
                                            <td className="px-4 py-3 font-mono font-bold">{rt.id}</td>
                                            <td className="px-4 py-3">{rt.region}</td>
                                            <td className="px-4 py-3 font-medium">{rt.driver}</td>
                                            <td className="px-4 py-3">{rt.vehicle}</td>
                                            <td className="px-4 py-3 text-center font-bold text-blue-600">{rt.stops}</td>
                                            <td className="px-4 py-3 text-gray-500">{rt.estCompletion}</td>
                                            <td className="px-4 py-3">
                                                {rt.status === 'DISPATCHED' ? (
                                                    <Badge className="bg-green-100 text-green-800">Dispatched</Badge>
                                                ) : (
                                                    <Badge variant="outline">Planning</Badge>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right space-x-2">
                                                <Button size="sm" variant="outline">Map View</Button>
                                                {rt.status === 'PLANNING' && (
                                                    <Button size="sm" variant="outline" className="text-blue-600 border-blue-500">Dispatch</Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
