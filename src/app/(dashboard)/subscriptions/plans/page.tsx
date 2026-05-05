import React from 'react';
import { prisma } from '@/lib/prisma';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Plus, Layers, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function SubscriptionPlansPage() {
    const plans = await prisma.subscriptionPlan.findMany({
        orderBy: { price: 'asc' }
    });

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-6">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/subscriptions">
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <ArrowLeft className="w-5 h-5 text-gray-500" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Subscription Plans</h1>
                    <p className="text-gray-500">Configure billing tiers, cycles, and usage limits.</p>
                </div>
            </div>

            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Search plans..." 
                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Plan
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                {plans.map((plan) => (
                    <Card key={plan.id} className={`border-t-4 ${plan.isActive ? 'border-t-indigo-500' : 'border-t-gray-300'} shadow-sm hover:shadow-md transition-shadow relative overflow-hidden`}>
                        {!plan.isActive && (
                            <div className="absolute top-4 right-4 bg-gray-100 text-gray-600 text-xs font-medium px-2 py-1 rounded">Archived</div>
                        )}
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center justify-between">
                                {plan.name}
                            </CardTitle>
                            <p className="text-sm text-gray-500 font-mono">{plan.code}</p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <div className="flex items-end gap-1">
                                    <span className="text-3xl font-bold text-gray-900">{Number(plan.price).toLocaleString()}</span>
                                    <span className="text-sm text-gray-500 mb-1">SAR</span>
                                    <span className="text-sm text-gray-500 mb-1">/{plan.billingCycle.toLowerCase()}</span>
                                </div>
                                {plan.setupFee && Number(plan.setupFee) > 0 && (
                                    <p className="text-xs text-gray-500 mt-1">+ {Number(plan.setupFee).toLocaleString()} SAR setup fee</p>
                                )}
                            </div>

                            <div className="pt-4 border-t border-gray-100 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Trial Period:</span>
                                    <span className="font-medium text-gray-900">{plan.trialDays ? `${plan.trialDays} Days` : 'No Trial'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Features:</span>
                                    <span className="font-medium text-gray-900 truncate max-w-[150px]" title={plan.features || ''}>{plan.features || 'None'}</span>
                                </div>
                            </div>

                            <div className="pt-6">
                                <Button variant="outline" className="w-full text-indigo-600 border-indigo-200 hover:bg-indigo-50">
                                    Edit Plan
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                
                {plans.length === 0 && (
                    <div className="col-span-full p-12 text-center text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
                        <Layers className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No Plans Yet</h3>
                        <p className="mt-1">Create your first subscription tier to start billing customers.</p>
                        <Button className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white">
                            <Plus className="w-4 h-4 mr-2" />
                            Create Basic Plan
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
