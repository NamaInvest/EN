"use client"
import React, { useState } from 'react';

export default function ConsolidationDashboard() {
    const [isGenerating, setIsGenerating] = useState(false);
    const [status, setStatus] = useState<string>("DRAFT");

    const handleRunConsolidation = async () => {
        setIsGenerating(true);
        try {
            const res = await fetch('/api/accounting/consolidation/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ groupId: 1, fiscalPeriodId: 1, userId: "1" }) // Mocked
            });
            const data = await res.json();
            if (data.success) {
                setStatus("REVIEWED");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsGenerating(false);
        }
    };

    const handlePostConsolidation = async () => {
        try {
             const res = await fetch('/api/accounting/consolidation/commit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ runId: 1 }) // Mocked run ID
            });
            const data = await res.json();
            if (data.success) {
                setStatus("POSTED");
                alert("Consolidation Posted Successfully!");
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="p-8 space-y-6 bg-[#F9FAFB] min-h-screen">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Financial Consolidation Engine</h1>
                    <p className="text-sm text-slate-500 mt-1">Group-level Trial Balances, Eliminations, and Reporting</p>
                </div>
                <div className="flex gap-4">
                    <button 
                        onClick={handleRunConsolidation}
                        disabled={isGenerating}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {isGenerating ? "Running Engine..." : "Run Consolidation"}
                    </button>
                    {status === 'REVIEWED' && (
                        <button 
                            onClick={handlePostConsolidation}
                            className="px-4 py-2 bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700"
                        >
                            Post to GL
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <p className="text-sm font-medium text-slate-500">Group Total Assets</p>
                    <p className="text-2xl font-bold text-indigo-600 mt-2">$2,450,000</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <p className="text-sm font-medium text-slate-500">Total Eliminations</p>
                    <p className="text-2xl font-bold text-rose-500 mt-2">-$150,000</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <p className="text-sm font-medium text-slate-500">Non-Controlling Interest (NCI)</p>
                    <p className="text-2xl font-bold text-slate-700 mt-2">$85,000</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <p className="text-sm font-medium text-slate-500">Consolidated Net Income</p>
                    <p className="text-2xl font-bold text-indigo-600 mt-2">$420,000</p>
                </div>
            </div>

            <div className="mt-8 bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Elimination Entries</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200">
                                <th className="py-3 px-4 font-medium text-slate-500 text-sm">Type</th>
                                <th className="py-3 px-4 font-medium text-slate-500 text-sm">Description</th>
                                <th className="py-3 px-4 font-medium text-slate-500 text-sm">Amount</th>
                                <th className="py-3 px-4 font-medium text-slate-500 text-sm">Status</th>
                                <th className="py-3 px-4 font-medium text-slate-500 text-sm">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-slate-100 hover:bg-slate-50">
                                <td className="py-3 px-4 text-sm text-slate-700">AR_AP</td>
                                <td className="py-3 px-4 text-sm text-slate-700">Eliminate Intercompany AR/AP (Sub A - Sub B)</td>
                                <td className="py-3 px-4 text-sm font-medium text-rose-500">-$45,000</td>
                                <td className="py-3 px-4 text-sm text-slate-700"><span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Reconciled</span></td>
                                <td className="py-3 px-4 text-sm text-indigo-600 cursor-pointer font-medium hover:underline">Drill-down</td>
                            </tr>
                            <tr className="hover:bg-slate-50">
                                <td className="py-3 px-4 text-sm text-slate-700">UNREALIZED_PROFIT</td>
                                <td className="py-3 px-4 text-sm text-slate-700">Eliminate Unrealized Profit in Inventory</td>
                                <td className="py-3 px-4 text-sm font-medium text-rose-500">-$12,500</td>
                                <td className="py-3 px-4 text-sm text-slate-700"><span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs">Pending Adj.</span></td>
                                <td className="py-3 px-4 text-sm text-indigo-600 cursor-pointer font-medium hover:underline">Drill-down</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
