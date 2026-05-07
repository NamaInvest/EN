'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function TraceabilityPage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const [searchQuery, setSearchQuery] = useState('');
    const [searchType, setSearchType] = useState('serial');
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const handleSearch = () => {
        setLoading(true);
        // Mock data fetch
        setTimeout(() => {
            setResult({
                id: 'SR-9921',
                product: 'Industrial Pump X-200',
                productionLot: 'LOT-2026-05A',
                batch: 'BCH-0091',
                salesInvoice: 'INV-2026-10442',
                customer: 'Acme Corp',
                status: 'DELIVERED',
                events: [
                    { date: '2026-05-01 08:00', event: 'Manufactured (Production Order #PO-991)' },
                    { date: '2026-05-02 10:15', event: 'Quality Check Passed (QA-772)' },
                    { date: '2026-05-03 14:00', event: 'Transferred to Main Warehouse (Zone-A)' },
                    { date: '2026-05-05 09:30', event: 'Picked for Sales Order #SO-5022' },
                    { date: '2026-05-06 11:45', event: 'Delivered to Customer (Acme Corp)' },
                ]
            });
            setLoading(false);
        }, 800);
    };

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Lot/Serial Traceability</h1>
            
            <Card>
                <CardHeader>
                    <CardTitle>Trace Query</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex space-x-4">
                        <select 
                            className="border p-2 rounded"
                            value={searchType}
                            onChange={(e) => setSearchType(e.target.value)}
                        >
                            <option value="serial">Serial Number</option>
                            <option value="batch">{_t('رقم التشغيلة (Batch)', 'Batch Number')}</option>
                            <option value="lot">Production Lot</option>
                            <option value="invoice">{_t('فاتورة مبيعات', 'Sales Invoice')}</option>
                        </select>
                        <Input 
                            placeholder={`Enter ${searchType}...`} 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-1/3"
                        />
                        <Button onClick={handleSearch}>Trace Forward/Backward</Button>
                    </div>
                </CardContent>
            </Card>

            {loading && <p>Tracing components...</p>}

            {result && !loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Item Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div><strong className="block text-sm text-gray-500">{_t('المنتج', 'Product')}</strong>{result.product}</div>
                            <div><strong className="block text-sm text-gray-500">Serial Number</strong>{result.id}</div>
                            <div><strong className="block text-sm text-gray-500">{_t('رقم التشغيلة (Batch)', 'Batch Number')}</strong>{result.batch}</div>
                            <div><strong className="block text-sm text-gray-500">Production Lot</strong>{result.productionLot}</div>
                            <div><strong className="block text-sm text-gray-500">Customer</strong>{result.customer} ({result.salesInvoice})</div>
                            <div><strong className="block text-sm text-gray-500">{_t('الوضع الحالي', 'Current Status')}</strong>
                                <span className="text-green-600 font-bold">{result.status}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Lifecycle Timeline</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4 relative border-l-2 border-gray-200 dark:border-gray-700 ml-3">
                                {result.events.map((ev: any, idx: number) => (
                                    <div key={idx} className="ml-6 relative">
                                        <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[1.65rem] top-1.5 border-2 border-white dark:border-gray-900"></div>
                                        <div className="text-sm font-medium">{ev.event}</div>
                                        <div className="text-xs text-gray-500">{ev.date}</div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
