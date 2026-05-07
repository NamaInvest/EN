import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Plus, Map, Layers, Archive } from 'lucide-react';
import Link from 'next/link';

import prisma from '@/lib/prisma';
export default async function WarehouseZonesPage() {
    const zones = await prisma.warehouseZone.findMany({
        include: {
            stock: true,
            racks: true
        },
        orderBy: { name: 'asc' }
    });

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                        <Map className="w-8 h-8 text-cyan-600" />
                        Storage Zones & Racks
                    </h1>
                    <p className="text-gray-500 mt-1">Configure hierarchical storage layout for warehouses.</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/inventory/wms">
                        <Button variant="outline" className="bg-white">Back to WMS</Button>
                    </Link>
                    <Button className="bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Zone
                    </Button>
                </div>
            </div>

            {/* Data Grid */}
            <Card className="overflow-hidden border-gray-200 shadow-sm">
                <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row items-center gap-4 bg-white">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Search zones..." 
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 border-b">
                            <tr>
                                <th className="px-4 py-3 font-medium">Zone Name</th>
                                <th className="px-4 py-3 font-medium">Warehouse</th>
                                <th className="px-4 py-3 font-medium">Type</th>
                                <th className="px-4 py-3 font-medium">Racks Count</th>
                                <th className="px-4 py-3 font-medium">Description</th>
                                <th className="px-4 py-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {zones.map((zone) => (
                                <tr key={zone.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 font-medium text-gray-900 flex items-center gap-2">
                                        <Layers className="w-4 h-4 text-gray-400" />
                                        {zone.name}
                                    </td>
                                    <td className="px-4 py-3 text-gray-700 font-medium">
                                        {zone.stock?.name || 'Unassigned'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                            zone.type === 'RECEIVING' ? 'bg-blue-100 text-blue-800' :
                                            zone.type === 'PICK' ? 'bg-green-100 text-green-800' :
                                            zone.type === 'BULK' ? 'bg-orange-100 text-orange-800' :
                                            zone.type === 'QC' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                            {zone.type}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 font-medium text-gray-900">
                                        {zone.racks?.length || 0}
                                    </td>
                                    <td className="px-4 py-3 text-gray-500 truncate max-w-[200px]" title={zone.description || ''}>
                                        {zone.description || '-'}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Button variant="ghost" size="sm" className="text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50">
                                            Manage Layout
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {zones.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center">
                                            <Archive className="w-10 h-10 text-gray-300 mb-3" />
                                            <p className="text-lg font-medium text-gray-900">No Zones Defined</p>
                                            <p className="text-sm mt-1">Start by creating storage zones for your warehouse.</p>
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
