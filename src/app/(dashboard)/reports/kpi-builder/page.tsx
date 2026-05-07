import { _t } from '@/lib/server-t';
'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function KPIBuilderPage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const [dashboards] = useState([
        { id: 'DB-01', name: 'Executive Financial Summary', widgets: 6, lastRefreshed: '10 mins ago', status: 'ACTIVE' },
        { id: 'DB-02', name: 'Sales Performance Map', widgets: 3, lastRefreshed: '1 hour ago', status: 'ACTIVE' },
        { id: 'DB-03', name: 'Warehouse OEE Tracking', widgets: 4, lastRefreshed: 'Draft', status: 'DRAFT' },
    ]);

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">{_t('KPI لوحة التحكم Builder', 'KPI Dashboard Builder')}</h1>
                <Button>+ Create New Dashboard</Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {dashboards.map((db, idx) => (
                    <Card key={idx} className="hover:border-blue-500 transition-colors cursor-pointer">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-lg">{db.name}</CardTitle>
                                {db.status === 'ACTIVE' ? (
                                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                ) : (
                                    <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-gray-500 mb-4">
                                {db.widgets} widgets configured
                            </div>
                            <div className="text-xs text-gray-400 flex justify-between items-center">
                                <span>Refreshed: {db.lastRefreshed}</span>
                                <Button size="sm" variant="ghost" className="text-blue-600 hover:text-blue-800 hover:bg-blue-50">{_t('Edit Layout', 'Edit Layout')}</Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
