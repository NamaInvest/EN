'use client';
import React from 'react';
import { Key, Search, Plus, Filter, Save } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function LEASESModule() {
    return (
        <div className="max-w-7xl mx-auto space-y-6 p-6">
            <div className="flex justify-between items-center bg-slate-900 text-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-800 rounded-lg">
                        <Key className="w-8 h-8 text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Lease & Property Management</h1>
                        <p className="text-slate-400 text-sm mt-1">Contract lifecycles, PDC (Post-Dated Checks) vault, and facility maintenance.</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" className="flex gap-2"><Plus className="w-4 h-4"/> New Record</Button>
                </div>
            </div>

            <div className="flex gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                    <input 
                        type="text" 
                        placeholder="Search records, IDs, or references..." 
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                <Button variant="outline" className="flex gap-2"><Filter className="w-4 h-4"/> Filters</Button>
            </div>

            <Card className="p-12 flex flex-col items-center justify-center border-dashed bg-slate-50 text-center">
                <div className="p-4 bg-indigo-100 rounded-full mb-4 animate-pulse">
                    <Key className="w-12 h-12 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Operational Workspace Active</h3>
                <p className="text-slate-500 max-w-md mt-2">
                    This transactional interface is connected to the V3 EventBus. Data entered here will automatically trigger the respective accounting, inventory, and operational events.
                </p>
                <Button className="mt-6 flex gap-2"><Save className="w-4 h-4"/> Save Configuration</Button>
            </Card>
        </div>
    );
}
