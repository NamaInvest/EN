import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Hammer, Plus, Calendar, Settings, PlayCircle, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { OrdersClient } from './components/OrdersClient';
import prisma from '@/lib/prisma';
import { _t } from '@/lib/server-t';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.app.(dashboard).' });
export default async function ManufacturingOrdersPage() {
    const orders = await prisma.manufacturingOrder.findMany({
        take: 50,
        orderBy: { startDate: 'desc' }
    });

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed': return 'bg-green-100 text-green-800';
            case 'in_progress': return 'bg-blue-100 text-blue-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800'; // draft / planned
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                        <Hammer className="w-8 h-8 text-amber-600" />{_t('Work Orders (MO)', 'Work Orders (MO)')}</h1>
                    <p className="text-gray-500 mt-1">{_t('Track production progress and shop floor operations.', 'Track production progress and shop floor operations.')}</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/manufacturing">
                        <Button variant="outline" className="bg-white">{_t('Back to Dashboard', 'Back to Dashboard')}</Button>
                    </Link>
                    <Button className="bg-amber-600 hover:bg-amber-700 text-white shadow-sm">
                        <Plus className="w-4 h-4 mr-2" />{_t('Create Work Order', 'Create Work Order')}</Button>
                </div>
            </div>

            {/* Data Grid via DataTable v2 */}
            <OrdersClient data={orders} />
        </div>
    );
}
