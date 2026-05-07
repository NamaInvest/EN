'use client';
import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Plus, Tag, Calendar, Percent, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';

export default function PromotionsPage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const promotions = await prisma.promotion.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50
    });

    const activeCount = promotions.filter(p => p.isActive).length;

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                        <Tag className="w-8 h-8 text-rose-600" />
                        Promotions Engine
                    </h1>
                    <p className="text-gray-500 mt-1">Manage discounts, BOGO offers, coupons, and promotional stacking.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="bg-white">View Coupons</Button>
                    <Button className="bg-rose-600 hover:bg-rose-700 text-white shadow-sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Promotion
                    </Button>
                </div>
            </div>

            {/* Metrics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-rose-50 to-white border-rose-100">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-rose-600">Active Campaigns</p>
                            <ShieldCheck className="w-4 h-4 text-rose-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mt-2">{activeCount}</h3>
                    </CardContent>
                </Card>
            </div>

            {/* Data Grid */}
            <Card className="overflow-hidden border-gray-200 shadow-sm">
                <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row items-center gap-4 bg-white">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Search campaigns..." 
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 border-b">
                            <tr>
                                <th className="px-4 py-3 font-medium">Promotion Name</th>
                                <th className="px-4 py-3 font-medium">Type</th>
                                <th className="px-4 py-3 font-medium">Dates</th>
                                <th className="px-4 py-3 font-medium">Discount Value</th>
                                <th className="px-4 py-3 font-medium">Status</th>
                                <th className="px-4 py-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {promotions.map((promo) => {
                                const isActive = promo.isActive;
                                return (
                                <tr key={promo.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 font-medium text-gray-900">
                                        {promo.name}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                            {promo.type.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-500 text-xs">
                                        {promo.startDate ? format(new Date(promo.startDate), 'MMM dd') : 'N/A'} - {promo.endDate ? format(new Date(promo.endDate), 'MMM dd, yyyy') : 'N/A'}
                                    </td>
                                    <td className="px-4 py-3 font-medium text-gray-900">
                                        {promo.discountValue} {promo.discountType === 'percentage' ? '%' : 'SAR'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                            isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                                        }`}>
                                            {isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Button variant="ghost" size="sm" className="text-rose-600 hover:text-rose-700 hover:bg-rose-50">
                                            Manage
                                        </Button>
                                    </td>
                                </tr>
                            )})}
                            {promotions.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center">
                                            <Tag className="w-10 h-10 text-gray-300 mb-3" />
                                            <p className="text-lg font-medium text-gray-900">No Promotions Active</p>
                                            <p className="text-sm mt-1">Boost your sales by creating custom discount logic.</p>
                                            <Button className="mt-4 bg-rose-600 hover:bg-rose-700 text-white">
                                                <Plus className="w-4 h-4 mr-2" />
                                                Create Promotion
                                            </Button>
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
