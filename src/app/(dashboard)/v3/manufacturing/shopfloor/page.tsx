'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function ManufacturingShopFloorPage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const [machines, setMachines] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMachines = async () => {
            try {
                const res = await fetch('/api/v3/manufacturing/shopfloor');
                const data = await res.json();
                if (data.machines) setMachines(data.machines);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchMachines();
    }, []);

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'RUNNING': return 'bg-green-100 text-green-800 border-green-200';
            case 'IDLE': return 'bg-gray-100 text-gray-800 border-gray-200';
            case 'DOWN': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Real-time Shop Floor</h1>
                <Button variant="outline">Refresh Data</Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? <p>Loading...</p> : machines.map((m, idx) => (
                    <Card key={idx} className={`border-l-4 ${m.status === 'RUNNING' ? 'border-l-green-500' : m.status === 'DOWN' ? 'border-l-red-500' : 'border-l-gray-500'}`}>
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-xl">{m.name}</CardTitle>
                                    <p className="text-sm text-gray-500 font-mono mt-1">{m.id}</p>
                                </div>
                                <Badge className={getStatusColor(m.status)}>{m.status}</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="block text-gray-500">Current Order</span>
                                    <span className="font-bold">{m.currentOrder}</span>
                                </div>
                                <div>
                                    <span className="block text-gray-500">Operator</span>
                                    <span className="font-medium">{m.operator}</span>
                                </div>
                            </div>
                            
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-500">Performance</span>
                                    <span className="font-bold">{m.performance}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div className={`h-2 rounded-full ${m.performance > 80 ? 'bg-green-500' : m.performance > 40 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${m.performance}%` }}></div>
                                </div>
                            </div>

                            {m.error && (
                                <div className="mt-4 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                                    <strong>Alert:</strong> {m.error}
                                </div>
                            )}

                            <div className="pt-4 flex space-x-2">
                                <Button size="sm" className="w-full" variant={m.status === 'RUNNING' ? 'outline' : 'default'}>
                                    {m.status === 'RUNNING' ? 'Pause' : 'Start'}
                                </Button>
                                <Button size="sm" className="w-full" variant="outline">Log Issue</Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
