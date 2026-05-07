'use client';
import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Plus, CreditCard, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';

export default function GiftCardsPage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const giftCards = await prisma.giftCard.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50
    });

    const activeCards = giftCards.filter(g => g.isActive);
    const liability = activeCards.reduce((sum, g) => sum + Number(g.currentBalance || 0), 0);

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                        <CreditCard className="w-8 h-8 text-teal-600" />
                        Gift Cards
                    </h1>
                    <p className="text-gray-500 mt-1">Issue, manage, and track digital and physical gift cards.</p>
                </div>
                <div className="flex gap-2">
                    <Button className="bg-teal-600 hover:bg-teal-700 text-white shadow-sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Issue Gift Card
                    </Button>
                </div>
            </div>

            {/* Metrics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-teal-50 to-white border-teal-100">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-teal-600">Active Cards</p>
                            <CreditCard className="w-4 h-4 text-teal-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mt-2">{activeCards.length}</h3>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-500">Total Liability</p>
                            <CreditCard className="w-4 h-4 text-gray-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mt-2">{liability.toLocaleString()} <span className="text-sm font-normal text-gray-500">SAR</span></h3>
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
                            placeholder="Search by code..." 
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 border-b">
                            <tr>
                                <th className="px-4 py-3 font-medium">Code</th>
                                <th className="px-4 py-3 font-medium">Initial Balance</th>
                                <th className="px-4 py-3 font-medium">Current Balance</th>
                                <th className="px-4 py-3 font-medium">Issued At</th>
                                <th className="px-4 py-3 font-medium">Status</th>
                                <th className="px-4 py-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {giftCards.map((card) => (
                                <tr key={card.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 font-medium text-gray-900">
                                        {card.code}
                                    </td>
                                    <td className="px-4 py-3 text-gray-700">
                                        {Number(card.initialBalance).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 font-medium text-teal-600">
                                        {Number(card.currentBalance).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 text-gray-500">
                                        {format(new Date(card.createdAt), 'MMM dd, yyyy')}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                            card.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                            {card.isActive ? 'Active' : 'Blocked / Used'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {card.isActive && (
                                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" title="Block Card">
                                                <ShieldAlert className="w-4 h-4" />
                                            </Button>
                                        )}
                                        <Button variant="ghost" size="sm" className="text-teal-600 hover:text-teal-700 hover:bg-teal-50 ml-1">
                                            Manage
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {giftCards.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center">
                                            <CreditCard className="w-10 h-10 text-gray-300 mb-3" />
                                            <p className="text-lg font-medium text-gray-900">No Gift Cards Issued</p>
                                            <Button className="mt-4 bg-teal-600 hover:bg-teal-700 text-white">
                                                <Plus className="w-4 h-4 mr-2" />
                                                Issue First Card
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
