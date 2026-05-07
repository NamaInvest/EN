'use client';
import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Settings, Plus, Network, Save, ServerCrash } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function BpmDashboard() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const [rules, setRules] = useState([
        { id: 1, name: 'Purchase Order Approval > 10K', trigger: 'PO_CREATED', condition: 'amount > 10000', action: 'REQUIRE_APPROVAL:CFO' },
        { id: 2, name: 'Auto-Post Paid Invoices', trigger: 'INVOICE_PAID', condition: 'status == PAID', action: 'POST_JOURNAL_ENTRY' },
        { id: 3, name: 'Low Stock Alert', trigger: 'INVENTORY_REDUCED', condition: 'stock_level < min_limit', action: 'SEND_NOTIFICATION:WAREHOUSE_MGR' }
    ]);

    return (
        <div className="max-w-6xl mx-auto space-y-6 p-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Network className="text-indigo-600 w-8 h-8" />
                        BPM Engine (Business Process Management)
                    </h1>
                    <p className="text-gray-500 mt-2">
                        Configure automated workflows, approval chains, and EventBus triggers.
                    </p>
                </div>
                <Button className="flex items-center gap-2">
                    <Plus className="w-4 h-4" /> New Rule
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {rules.map(rule => (
                    <Card key={rule.id} className="p-4 flex items-center justify-between border-l-4 border-l-indigo-500">
                        <div className="space-y-1">
                            <h3 className="font-bold text-lg">{rule.name}</h3>
                            <div className="flex gap-4 text-sm text-gray-600">
                                <span className="bg-gray-100 px-2 py-1 rounded">Trigger: {rule.trigger}</span>
                                <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">If: {rule.condition}</span>
                                <span className="bg-green-50 text-green-700 px-2 py-1 rounded">Then: {rule.action}</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm">Edit</Button>
                            <Button variant="destructive" size="sm">Disable</Button>
                        </div>
                    </Card>
                ))}
            </div>
            
            <div className="mt-8 p-6 bg-slate-900 rounded-lg text-white">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><ServerCrash className="w-5 h-5"/> EventBus Live Monitor</h3>
                <div className="h-48 overflow-y-auto font-mono text-sm space-y-2">
                    <p className="text-green-400">[10:45:02] EVENT: PO_CREATED (ID: 4092) - Evaluated 3 rules</p>
                    <p className="text-gray-400">[10:45:03] ACTION: REQUIRE_APPROVAL:CFO triggered successfully</p>
                    <p className="text-green-400">[10:46:11] EVENT: INVOICE_PAID (ID: 991) - Evaluated 3 rules</p>
                    <p className="text-gray-400">[10:46:12] ACTION: POST_JOURNAL_ENTRY completed</p>
                    <p className="animate-pulse text-indigo-400">Listening for new events...</p>
                </div>
            </div>
        </div>
    );
}
