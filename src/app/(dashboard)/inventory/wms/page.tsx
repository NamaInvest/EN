import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Boxes, MapPin, Truck, ArrowRight, ScanLine, Activity, Layers } from 'lucide-react';
import Link from 'next/link';

import prisma from '@/lib/prisma';
export default async function WmsDashboardPage() {
    // Basic stats
    const stocks = await prisma.stock.findMany();
    const zones = await prisma.warehouseZone.count();
    
    // Recent movements
    const movementsCount = await prisma.stockMovement.count({
        where: {
            date: { gte: new Date(new Date().setDate(new Date().getDate() - 7)) }
        }
    });

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                        <Boxes className="w-8 h-8 text-cyan-600" />
                        Warehouse Management (WMS)
                    </h1>
                    <p className="text-gray-500 mt-1">Manage locations, stock transfers, picking, and receiving operations.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="bg-white">Cycle Count</Button>
                    <Link href="/inventory/movements">
                        <Button className="bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm">
                            <Activity className="w-4 h-4 mr-2" />
                            Stock Movements
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Metrics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-cyan-50 to-white border-cyan-100">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-cyan-600">Active Warehouses</p>
                            <MapPin className="w-4 h-4 text-cyan-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mt-2">{stocks.length}</h3>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-500">Storage Zones</p>
                            <Layers className="w-4 h-4 text-gray-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mt-2">{zones}</h3>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-500">Movements (Last 7 Days)</p>
                            <Activity className="w-4 h-4 text-blue-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mt-2">{movementsCount}</h3>
                    </CardContent>
                </Card>
            </div>

            {/* Navigation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                {/* Zones Card */}
                <Link href="/inventory/zones">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer border-gray-200 hover:border-cyan-300">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xl flex items-center gap-2 text-gray-800">
                                <Layers className="w-6 h-6 text-cyan-600" />
                                Zones & Locations
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-500 mb-4">Hierarchical storage management. Define Receiving, Bulk Storage, Picking, and Quarantine zones.</p>
                            <div className="flex items-center text-sm font-medium text-cyan-600">
                                Manage Zones <ArrowRight className="w-4 h-4 ml-1" />
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                {/* Stock Movements Card */}
                <Link href="/inventory/movements">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer border-gray-200 hover:border-cyan-300">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xl flex items-center gap-2 text-gray-800">
                                <Activity className="w-6 h-6 text-indigo-600" />
                                Stock Movements
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-500 mb-4">Track all inventory changes (in, out, transfer, adjustment) with full audit trails.</p>
                            <div className="flex items-center text-sm font-medium text-indigo-600">
                                View Movements <ArrowRight className="w-4 h-4 ml-1" />
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                {/* Goods Receipt (GRN) Card */}
                <Card className="hover:shadow-md transition-shadow cursor-pointer border-gray-200 hover:border-cyan-300">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xl flex items-center gap-2 text-gray-800">
                            <Truck className="w-6 h-6 text-green-600" />
                            Goods Receipt (GRN)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-500 mb-4">Receive stock from vendors, link to Purchase Orders, and trigger putaway tasks.</p>
                        <div className="flex items-center text-sm font-medium text-green-600">
                            Receive Goods <ArrowRight className="w-4 h-4 ml-1" />
                        </div>
                    </CardContent>
                </Card>

                {/* Picking & Wave Card */}
                <Card className="hover:shadow-md transition-shadow cursor-pointer border-gray-200 hover:border-cyan-300">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xl flex items-center gap-2 text-gray-800">
                            <ScanLine className="w-6 h-6 text-orange-600" />
                            Picking & Dispatch
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-500 mb-4">Generate pick lists, wave picking, and prepare stock for Sales Order fulfillment.</p>
                        <div className="flex items-center text-sm font-medium text-orange-600">
                            Manage Picking <ArrowRight className="w-4 h-4 ml-1" />
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            {/* Warehouses List */}
            <h2 className="text-xl font-bold tracking-tight text-gray-900 mt-8 mb-4">Registered Warehouses</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stocks.map((stock) => (
                    <Card key={stock.id} className="border-l-4 border-l-cyan-500">
                        <CardContent className="p-4 flex justify-between items-center">
                            <div>
                                <h4 className="font-bold text-gray-900 text-lg">{stock.name}</h4>
                                <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                    <MapPin className="w-3 h-3" />
                                    {stock.address || 'Address not specified'}
                                </p>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${stock.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {stock.active ? 'Active' : 'Inactive'}
                            </span>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
