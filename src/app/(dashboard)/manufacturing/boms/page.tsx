'use client';
import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, ClipboardList, Plus, FileText, Settings, Layers } from 'lucide-react';
import Link from 'next/link';

export default function BomsPage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const recipes = await prisma.recipe.findMany({
        orderBy: { name: 'asc' }
    });

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                        <ClipboardList className="w-8 h-8 text-indigo-600" />
                        Bill of Materials (BOM) & Recipes
                    </h1>
                    <p className="text-gray-500 mt-1">Manage product formulas, yield expectations, and standard costs.</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/manufacturing">
                        <Button variant="outline" className="bg-white">Back to Dashboard</Button>
                    </Link>
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Create BOM
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
                            placeholder="Search recipes..." 
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 border-b">
                            <tr>
                                <th className="px-4 py-3 font-medium">Recipe Name</th>
                                <th className="px-4 py-3 font-medium">Finished Product ID</th>
                                <th className="px-4 py-3 font-medium">Total Cost (Standard)</th>
                                <th className="px-4 py-3 font-medium">Expected Yield Qty</th>
                                <th className="px-4 py-3 font-medium">Scrap %</th>
                                <th className="px-4 py-3 font-medium">Status</th>
                                <th className="px-4 py-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {recipes.map((recipe) => (
                                <tr key={recipe.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 font-medium text-gray-900 flex items-center gap-2">
                                        <Layers className="w-4 h-4 text-indigo-400" />
                                        {recipe.name}
                                    </td>
                                    <td className="px-4 py-3 text-gray-700">
                                        PROD-{recipe.finishedProductId}
                                    </td>
                                    <td className="px-4 py-3 font-medium text-gray-900">
                                        {recipe.totalCost.toLocaleString()} SAR
                                    </td>
                                    <td className="px-4 py-3 text-gray-700">
                                        {recipe.expectedYieldQty || '-'}
                                    </td>
                                    <td className="px-4 py-3 text-red-600">
                                        {recipe.scrapPercentage}%
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                            recipe.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                        }`}>
                                            {recipe.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                                            <FileText className="w-4 h-4 mr-1" /> Details
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {recipes.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center">
                                            <ClipboardList className="w-10 h-10 text-gray-300 mb-3" />
                                            <p className="text-lg font-medium text-gray-900">No BOMs Defined</p>
                                            <p className="text-sm mt-1">Create your first recipe to start manufacturing.</p>
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
