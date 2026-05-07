'use client';
import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Plus, Repeat, TrendingUp, AlertTriangle, UserCheck, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function SubscriptionsDashboard() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    // Basic metrics aggregation
    const subscriptions = await prisma.customerSubscription.findMany({
        include: {
            customer: true,
            plan: true,
        },
        orderBy: { startDate: 'desc' },
        take: 50
    });

    const activeCount = subscriptions.filter(s => s.status === 'ACTIVE').length;
    const trialCount = subscriptions.filter(s => s.status === 'TRIAL').length;
    const pastDueCount = subscriptions.filter(s => s.status === 'PAST_DUE').length;

    // Calculate approximate MRR (Monthly Recurring Revenue)
    const mrr = subscriptions
        .filter(s => s.status === 'ACTIVE' && s.plan.billingCycle === 'MONTHLY')
        .reduce((sum, s) => sum + Number(s.plan.price), 0);

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                        <Repeat className="w-8 h-8 text-indigo-600" />
                        Subscriptions
                    </h1>
                    <p className="text-gray-500 mt-1">Manage recurring billing, plans, and customer life-cycles.</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/subscriptions/plans">
                        <Button variant="outline" className="bg-white">Manage Plans</Button>
                    </Link>
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
                        <Plus className="w-4 h-4 mr-2" />
                        New Subscription
                    </Button>
                </div>
            </div>

            {/* Metrics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-100">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-indigo-600">MRR (Monthly)</p>
                            <TrendingUp className="w-4 h-4 text-indigo-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mt-2">{mrr.toLocaleString()} <span className="text-sm font-normal text-gray-500">SAR</span></h3>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-500">Active Subscribers</p>
                            <UserCheck className="w-4 h-4 text-green-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mt-2">{activeCount}</h3>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-500">On Free Trial</p>
                            <ShieldCheck className="w-4 h-4 text-blue-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mt-2">{trialCount}</h3>
                    </CardContent>
                </Card>
                <Card className="bg-orange-50 border-orange-100">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-orange-600">Past Due / Failed</p>
                            <AlertTriangle className="w-4 h-4 text-orange-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mt-2">{pastDueCount}</h3>
                    </CardContent>
                </Card>
            </div>

            {/* Subscriptions Data Grid */}
            <Card className="overflow-hidden border-gray-200 shadow-sm">
                <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row items-center gap-4 bg-white">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Search by customer..." 
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div className="flex gap-2 ml-auto">
                        <select className="border border-gray-200 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            <option value="ALL">All Statuses</option>
                            <option value="ACTIVE">Active</option>
                            <option value="TRIAL">Trial</option>
                            <option value="PAST_DUE">Past Due</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 border-b">
                            <tr>
                                <th className="px-4 py-3 font-medium">Customer</th>
                                <th className="px-4 py-3 font-medium">Plan</th>
                                <th className="px-4 py-3 font-medium">Status</th>
                                <th className="px-4 py-3 font-medium">Cycle Ends</th>
                                <th className="px-4 py-3 font-medium">Price</th>
                                <th className="px-4 py-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {subscriptions.map((sub) => (
                                <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 font-medium text-gray-700">
                                        {sub.customer?.name || 'Unknown'}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        <span className="font-medium text-gray-900">{sub.plan.name}</span>
                                        <div className="text-xs text-gray-400">{sub.plan.billingCycle}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                            sub.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                            sub.status === 'TRIAL' ? 'bg-blue-100 text-blue-800' :
                                            sub.status === 'PAST_DUE' ? 'bg-orange-100 text-orange-800' :
                                            sub.status === 'CANCELLED' ? 'bg-gray-100 text-gray-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                            {sub.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-500">
                                        {format(new Date(sub.currentPeriodEnd), 'MMM dd, yyyy')}
                                    </td>
                                    <td className="px-4 py-3 font-medium text-gray-900">
                                        {Number(sub.plan.price).toLocaleString()} SAR
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                                            Manage
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {subscriptions.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center">
                                            <Repeat className="w-10 h-10 text-gray-300 mb-3" />
                                            <p className="text-lg font-medium text-gray-900">No subscriptions found</p>
                                            <p className="text-sm mt-1">Start by creating your first subscription plan and enrolling a customer.</p>
                                            <Button className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white">
                                                <Plus className="w-4 h-4 mr-2" />
                                                Create Subscription
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
