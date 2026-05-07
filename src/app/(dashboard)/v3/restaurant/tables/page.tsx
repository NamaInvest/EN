'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function RestaurantTablesPage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const [tables] = useState([
        { id: 'T-01', name: 'Table 1', capacity: 2, status: 'OCCUPIED', orderId: 'ORD-9912', duration: '45m' },
        { id: 'T-02', name: 'Table 2', capacity: 4, status: 'RESERVED', orderId: '-', duration: '-' },
        { id: 'T-03', name: 'Table 3', capacity: 4, status: 'AVAILABLE', orderId: '-', duration: '-' },
        { id: 'T-04', name: 'Table 4', capacity: 6, status: 'DIRTY', orderId: '-', duration: '-' },
    ]);

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'AVAILABLE': return 'bg-green-100 text-green-800 border-green-300';
            case 'OCCUPIED': return 'bg-red-100 text-red-800 border-red-300';
            case 'RESERVED': return 'bg-blue-100 text-blue-800 border-blue-300';
            case 'DIRTY': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">{_t('Table إدارةment & Reservations', 'Table Management & Reservations')}</h1>
                <div className="space-x-2">
                    <Button variant="outline">Reservations List</Button>
                    <Button>New Reservation</Button>
                </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {tables.map((t, idx) => (
                    <Card key={idx} className={`border-2 ${getStatusColor(t.status)}`}>
                        <CardHeader className="text-center pb-2">
                            <CardTitle className="text-2xl">{t.name}</CardTitle>
                            <p className="text-xs font-mono">Capacity: {t.capacity}</p>
                        </CardHeader>
                        <CardContent className="text-center space-y-3">
                            <Badge className={`w-full justify-center ${getStatusColor(t.status)}`}>{t.status}</Badge>
                            
                            {t.status === 'OCCUPIED' && (
                                <div className="text-sm">
                                    <div className="font-bold">{t.orderId}</div>
                                    <div className="text-gray-600">Seated: {t.duration} ago</div>
                                </div>
                            )}

                            <div className="pt-2">
                                {t.status === 'AVAILABLE' && <Button size="sm" className="w-full">Walk-in</Button>}
                                {t.status === 'RESERVED' && <Button size="sm" className="w-full">Seat Guest</Button>}
                                {t.status === 'DIRTY' && <Button size="sm" variant="outline" className="w-full">Mark Clean</Button>}
                                {t.status === 'OCCUPIED' && <Button size="sm" variant="outline" className="w-full">View Order</Button>}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
