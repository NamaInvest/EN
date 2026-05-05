'use client';
import React from 'react';
import { Card } from '@/components/ui/card';
import { Layers, GitCommit, FileText } from 'lucide-react';

export default function PLMDashboard() {
    return (
        <div className="max-w-7xl mx-auto space-y-6 p-6">
            <h1 className="text-3xl font-bold flex items-center gap-2">
                <Layers className="w-8 h-8 text-blue-600" />
                Product Lifecycle Management (PLM)
            </h1>
            <p className="text-gray-500">Manage engineering change orders, product revisions, and technical documentation.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-2 flex items-center gap-2"><GitCommit className="text-orange-500"/> Active ECOs</h2>
                    <p className="text-3xl font-bold">0</p>
                    <p className="text-sm text-gray-500 mt-2">Engineering Change Orders pending review.</p>
                </Card>
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-2 flex items-center gap-2"><Layers className="text-blue-500"/> Product Revisions</h2>
                    <p className="text-3xl font-bold">0</p>
                    <p className="text-sm text-gray-500 mt-2">New revisions published this month.</p>
                </Card>
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-2 flex items-center gap-2"><FileText className="text-green-500"/> CAD/Specs</h2>
                    <p className="text-3xl font-bold">0</p>
                    <p className="text-sm text-gray-500 mt-2">Technical documents attached to BOMs.</p>
                </Card>
            </div>
            
            <Card className="p-12 text-center text-gray-500 border-dashed">
                <Layers className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <h3 className="text-lg font-medium">PLM Module Initialized</h3>
                <p>The core PLM schemas are ready. Start adding Projects and ECOs to see them here.</p>
            </Card>
        </div>
    );
}
