import React from 'react';
import { prisma } from '@/lib/prisma';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Factory, Cog, ClipboardList, TrendingUp, AlertTriangle, Hammer, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default async function ManufacturingDashboardPage() {
    const orders = await prisma.manufacturingOrder.count();
    const activeOrders = await prisma.manufacturingOrder.count({
        where: { status: 'in_progress' }
    });
    const recipes = await prisma.recipe.count({
        where: { isActive: true }
    });

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                        <Factory className="w-8 h-8 text-amber-600" />
                        Manufacturing (MRP & Production)
                    </h1>
                    <p className="text-gray-500 mt-1">Manage Work Orders, Bill of Materials (BOM), and Shop Floor Operations.</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/manufacturing/boms">
                        <Button variant="outline" className="bg-white">Manage BOMs</Button>
                    </Link>
                    <Link href="/manufacturing/orders">
                        <Button className="bg-amber-600 hover:bg-amber-700 text-white shadow-sm">
                            <Hammer className="w-4 h-4 mr-2" />
                            Work Orders
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Metrics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-100">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-amber-600">Active Work Orders</p>
                            <Cog className="w-4 h-4 text-amber-400 animate-spin-slow" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mt-2">{activeOrders}</h3>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-500">Total Work Orders</p>
                            <ClipboardList className="w-4 h-4 text-gray-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mt-2">{orders}</h3>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-500">Active BOMs / Recipes</p>
                            <TrendingUp className="w-4 h-4 text-indigo-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mt-2">{recipes}</h3>
                    </CardContent>
                </Card>
            </div>

            {/* Modules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                
                {/* Work Orders Card */}
                <Link href="/manufacturing/orders">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer border-gray-200 hover:border-amber-300">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xl flex items-center gap-2 text-gray-800">
                                <Hammer className="w-6 h-6 text-amber-600" />
                                Work Orders (MO)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-500 mb-4">Track production progress, record actual times, materials issued, and scrap reporting.</p>
                            <div className="flex items-center text-sm font-medium text-amber-600">
                                View Work Orders <ArrowRight className="w-4 h-4 ml-1" />
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                {/* BOMs / Recipes Card */}
                <Link href="/manufacturing/boms">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer border-gray-200 hover:border-amber-300">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xl flex items-center gap-2 text-gray-800">
                                <ClipboardList className="w-6 h-6 text-indigo-600" />
                                Bill of Materials
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-500 mb-4">Manage multi-level recipes, routing operations, expected yield, and engineering changes.</p>
                            <div className="flex items-center text-sm font-medium text-indigo-600">
                                Manage BOMs <ArrowRight className="w-4 h-4 ml-1" />
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                {/* MRP Run Card (Future/Mock) */}
                <Card className="bg-gray-50 border-gray-200 opacity-75">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xl flex items-center gap-2 text-gray-600">
                            <TrendingUp className="w-6 h-6 text-gray-500" />
                            MRP Suggestions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-500 mb-4">Calculate net requirements, identify raw material shortages, and auto-generate Purchase Requisitions.</p>
                        <div className="flex items-center text-sm font-medium text-gray-500">
                            <AlertTriangle className="w-4 h-4 mr-1 text-yellow-500" />
                            Configuration Required
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                <Card className="bg-gradient-to-br from-slate-50 to-white">
                    <CardContent className="p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                            <Cog className="w-5 h-5 text-slate-500" />
                            Shop Floor Routing
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">Define Work Centers, machine capacities, and operator shifts for accurate scheduling and finite capacity planning.</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-slate-50 to-white">
                    <CardContent className="p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-slate-500" />
                            Quality Checks (QC)
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">In-process quality inspections. Failures generate Non-Conformance Reports (NCR) and CAPA workflows.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
