import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Grid, Plus, Users, Utensils, CheckCircle, Search } from 'lucide-react';
import Link from 'next/link';

import prisma from '@/lib/prisma';
import { _t } from '@/lib/server-t';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.app.(dashboard).' });
export default async function RestaurantTablesPage() {
    const tables = await prisma.restaurantTable.findMany({
        include: {
            zone: true,
            sessions: {
                where: { status: 'OPEN' },
                take: 1
            }
        },
        orderBy: { name: 'asc' }
    });

    const occupiedCount = tables.filter(t => t.status.toUpperCase() === 'OCCUPIED' || t.sessions.length > 0).length;
    const availableCount = tables.filter(t => t.status.toUpperCase() === 'AVAILABLE' && t.sessions.length === 0).length;
    const reservedCount = tables.filter(t => t.status.toUpperCase() === 'RESERVED').length;

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                        <Grid className="w-8 h-8 text-orange-600" />{_t('Restaurant Tables & Zones', 'Restaurant Tables & Zones')}</h1>
                    <p className="text-gray-500 mt-1">{_t('Manage dining areas, table status, and floor plans.', 'Manage dining areas, table status, and floor plans.')}</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/pos-dashboard">
                        <Button variant="outline" className="bg-white">{_t('POS Sessions', 'POS Sessions')}</Button>
                    </Link>
                    <Button className="bg-orange-600 hover:bg-orange-700 text-white shadow-sm">
                        <Plus className="w-4 h-4 mr-2" />{_t('Add Table', 'Add Table')}</Button>
                </div>
            </div>

            {/* Metrics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-green-50 to-white border-green-100">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-green-600">{_t('Available Tables', 'Available Tables')}</p>
                            <CheckCircle className="w-4 h-4 text-green-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mt-2">{availableCount}</h3>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-orange-50 to-white border-orange-100">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-orange-600">{_t('Occupied Tables', 'Occupied Tables')}</p>
                            <Users className="w-4 h-4 text-orange-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mt-2">{occupiedCount}</h3>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-blue-600">{_t('Reserved', 'Reserved')}</p>
                            <Utensils className="w-4 h-4 text-blue-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mt-2">{reservedCount}</h3>
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Search tables..." 
                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 pt-4">
                {tables.map((table) => {
                    const isOccupied = table.status.toUpperCase() === 'OCCUPIED' || table.sessions.length > 0;
                    const isReserved = table.status.toUpperCase() === 'RESERVED';
                    
                    let bgClass = "bg-white hover:bg-gray-50 border-gray-200";
                    let textClass = "text-gray-900";
                    let statusLabel = "Available";
                    
                    if (isOccupied) {
                        bgClass = "bg-orange-50 hover:bg-orange-100 border-orange-200";
                        textClass = "text-orange-900";
                        statusLabel = "Occupied";
                    } else if (isReserved) {
                        bgClass = "bg-blue-50 hover:bg-blue-100 border-blue-200";
                        textClass = "text-blue-900";
                        statusLabel = "Reserved";
                    }

                    return (
                        <Card key={table.id} className={`cursor-pointer transition-colors border-2 shadow-sm ${bgClass}`}>
                            <CardContent className="p-4 flex flex-col items-center justify-center h-32 text-center relative">
                                <div className={`absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider ${
                                    isOccupied ? 'bg-orange-200 text-orange-800' : 
                                    isReserved ? 'bg-blue-200 text-blue-800' : 
                                    'bg-green-100 text-green-700'
                                }`}>
                                    {table.zone?.name?.substring(0, 3).toUpperCase() || 'ZN'}
                                </div>
                                <h4 className={`text-2xl font-bold mb-1 ${textClass}`}>{table.name}</h4>
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <Users className="w-3 h-3" />
                                    <span>{table.capacity} Seats</span>
                                </div>
                                <div className={`mt-2 text-xs font-medium ${
                                    isOccupied ? 'text-orange-600' : 
                                    isReserved ? 'text-blue-600' : 
                                    'text-green-600'
                                }`}>
                                    {statusLabel}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
                {tables.length === 0 && (
                    <div className="col-span-full p-12 text-center text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
                        <Grid className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">{_t('No Tables Configured', 'No Tables Configured')}</h3>
                        <p className="mt-1">{_t('Add your first restaurant tables and configure floor zones.', 'Add your first restaurant tables and configure floor zones.')}</p>
                        <Button className="mt-4 bg-orange-600 hover:bg-orange-700 text-white">
                            <Plus className="w-4 h-4 mr-2" />{_t('Create Table', 'Create Table')}</Button>
                    </div>
                )}
            </div>
        </div>
    );
}
