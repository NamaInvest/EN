import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Plus, ToggleLeft, ToggleRight, Trash2, Edit } from 'lucide-react';
import { format } from 'date-fns';

import prisma from '@/lib/prisma';
export default async function MfaPolicyPage() {
    const policies = await prisma.mfaPolicy.findMany({
        orderBy: { createdAt: 'desc' }
    });

    return (
        <div className="max-w-6xl mx-auto space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">MFA Policies</h1>
                    <p className="text-gray-500 mt-2">Enforce Two-Factor Authentication based on user roles and actions.</p>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    New Policy
                </Button>
            </div>

            {policies.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 border border-dashed rounded-xl">
                    <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No policies defined</h3>
                    <p className="text-gray-500 mt-1 max-w-sm mx-auto">Create a policy to enforce MFA for specific roles (e.g. Administrators) or specific sensitive actions.</p>
                    <Button className="mt-6 bg-blue-600 hover:bg-blue-700 text-white">
                        <Plus className="w-4 h-4 mr-2" />
                        Create First Policy
                    </Button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {policies.map(policy => (
                        <Card key={policy.id} className={!policy.enabled ? 'opacity-70 bg-gray-50' : ''}>
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-lg font-semibold text-gray-900">{policy.name}</h3>
                                            {policy.enabled ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">Active</span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-800">Disabled</span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500">{policy.description || 'No description provided.'}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="icon">
                                            <Edit className="w-4 h-4 text-gray-500" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-gray-100">
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Target Roles</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {policy.requireForRoles.length > 0 ? (
                                                policy.requireForRoles.map(r => (
                                                    <span key={r} className="inline-flex items-center px-2 py-1 rounded bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">{r}</span>
                                                ))
                                            ) : (
                                                <span className="text-sm text-gray-400">None</span>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Configuration</p>
                                        <ul className="space-y-1.5 text-sm text-gray-600">
                                            <li>Allowed Methods: {policy.allowedMethods.join(', ') || 'All'}</li>
                                            <li>Grace Period: {policy.gracePeriodDays} days</li>
                                            <li>Device Trust: {policy.trustedDeviceDays} days</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Enforcement Details</p>
                                        <ul className="space-y-1.5 text-sm text-gray-600">
                                            <li>Enforce From: {format(new Date(policy.enforceFromDate), 'MMM d, yyyy')}</li>
                                            <li>Step-up Auth: {policy.stepUpRequired ? `Yes (after ${policy.stepUpAfterMinutes}m)` : 'No'}</li>
                                        </ul>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
