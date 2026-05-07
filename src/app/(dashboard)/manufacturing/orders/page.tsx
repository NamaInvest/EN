import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Hammer, Plus, Calendar, Settings, PlayCircle, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

import prisma from '@/lib/prisma';
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
                        <Hammer className="w-8 h-8 text-amber-600" />
                        Work Orders (MO)
                    </h1>
                    <p className="text-gray-500 mt-1">Track production progress and shop floor operations.</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/manufacturing">
                        <Button variant="outline" className="bg-white">Back to Dashboard</Button>
                    </Link>
                    <Button className="bg-amber-600 hover:bg-amber-700 text-white shadow-sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Work Order
                    </Button>
                </div>
            </div>

            {/* Data Grid */}
            <Card className="overflow-hidden border-gray-200 shadow-sm">
                <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 bg-white">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Search order number..." 
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 border-b">
                            <tr>
                                <th className="px-4 py-3 font-medium">Order #</th>
                                <th className="px-4 py-3 font-medium">Recipe / Product ID</th>
                                <th className="px-4 py-3 font-medium">Qty to Produce</th>
                                <th className="px-4 py-3 font-medium">Start Date</th>
                                <th className="px-4 py-3 font-medium">Total Cost</th>
                                <th className="px-4 py-3 font-medium">Status</th>
                                <th className="px-4 py-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {orders.map((order) => (
                                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 font-medium text-gray-900">
                                        {order.orderNumber}
                                    </td>
                                    <td className="px-4 py-3 text-gray-700">
                                        Recipe #{order.recipeId}
                                    </td>
                                    <td className="px-4 py-3 font-medium text-gray-900">
                                        {order.quantityToProduce}
                                    </td>
                                    <td className="px-4 py-3 text-gray-500 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {format(new Date(order.startDate), 'MMM dd, yyyy')}
                                    </td>
                                    <td className="px-4 py-3 font-medium">
                                        {order.totalCost > 0 ? `${order.totalCost.toLocaleString()} SAR` : '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${getStatusColor(order.status)}`}>
                                            {order.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {order.status === 'draft' && (
                                            <Button variant="ghost" size="sm" className="text-amber-600 hover:text-amber-700 hover:bg-amber-50">
                                                <PlayCircle className="w-4 h-4 mr-1" /> Start
                                            </Button>
                                        )}
                                        {order.status === 'in_progress' && (
                                            <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700 hover:bg-green-50">
                                                <CheckCircle className="w-4 h-4 mr-1" /> Complete
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {orders.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center">
                                            <Hammer className="w-10 h-10 text-gray-300 mb-3" />
                                            <p className="text-lg font-medium text-gray-900">No Work Orders</p>
                                            <p className="text-sm mt-1">Create your first manufacturing order.</p>
                                        </div>
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
