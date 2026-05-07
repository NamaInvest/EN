'use client';
import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Play, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function E2ETesterDashboard() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const [loading, setLoading] = useState<string | null>(null);
    const [results, setResults] = useState<Record<string, any>>({});

    const runScenario = async (scenario: string) => {
        setLoading(scenario);
        try {
            const res = await fetch(`/api/admin/e2e-test`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scenario })
            });
            const data = await res.json();
            setResults(prev => ({ ...prev, [scenario]: data }));
        } catch (e: any) {
            setResults(prev => ({ ...prev, [scenario]: { error: e.message } }));
        }
        setLoading(null);
    };

    const scenarios = [
        { id: 'Q2C', name: 'Quote to Cash (Q2C)', desc: 'Creates Customer → Quote → Sales Order → Invoice → Payment.' },
        { id: 'P2P', name: 'Procure to Pay (P2P)', desc: 'Creates Supplier → PR → PO → GRN → Bill → Payment.' },
        { id: 'H2R', name: 'Hire to Retire (H2R)', desc: 'Creates Employee → Payroll Run → JEs.' },
        { id: 'R2R', name: 'Record to Report (R2R)', desc: 'Simulates month-end close and FX revaluation JEs.' },
        { id: 'O2D', name: 'Order to Delivery (O2D)', desc: 'Sales Order → WMS Picking → Fleet Dispatch → PoD.' },
        { id: 'P2P_MFG', name: 'Plan to Produce', desc: 'Demand Forecast → MRP → Work Order → FG.' },
        { id: 'A2R', name: 'Acquire to Retire (A2R)', desc: 'CapEx → Asset Creation → Depreciation → Disposal.' },
        { id: 'I2R', name: 'Issue to Resolve (I2R)', desc: 'Ticket → Field Service → SLA Metrics.' }
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-6 p-6">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <Play className="text-blue-600 w-8 h-8" />
                    V2 End-to-End Integrations Tester
                </h1>
                <p className="text-gray-500 mt-2">
                    Automatically simulate complex business flows to verify Saga Transactions, Event Bus, and Cross-Module Journal Entries.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {scenarios.map(s => (
                    <Card key={s.id} className="p-6 space-y-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-bold">{s.name}</h3>
                                <p className="text-sm text-gray-500">{s.desc}</p>
                            </div>
                            <Button 
                                onClick={() => runScenario(s.id)} 
                                disabled={loading !== null}
                                className="flex gap-2"
                            >
                                {loading === s.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                                Run
                            </Button>
                        </div>

                        {results[s.id] && (
                            <div className={`p-4 rounded border text-sm ${results[s.id].error ? 'bg-red-50 border-red-200 text-red-800' : 'bg-green-50 border-green-200 text-green-800'}`}>
                                <div className="font-semibold mb-2 flex items-center gap-2">
                                    {results[s.id].error ? <XCircle className="w-4 h-4"/> : <CheckCircle className="w-4 h-4"/>}
                                    {results[s.id].error ? 'Simulation Failed' : 'Simulation Success'}
                                </div>
                                <pre className="whitespace-pre-wrap overflow-x-auto">
                                    {JSON.stringify(results[s.id], null, 2)}
                                </pre>
                            </div>
                        )}
                    </Card>
                ))}
            </div>
        </div>
    );
}
