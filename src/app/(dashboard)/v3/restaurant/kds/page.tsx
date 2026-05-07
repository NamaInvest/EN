'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function KitchenDisplaySystemPage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const [tickets] = useState([
        { 
            id: 'ORD-9912', table: 'Table 1', time: '10m', type: 'Dine-in', course: 'Main Course',
            items: [
                { name: 'Grilled Salmon', qty: 1, notes: 'No salt', allergens: ['Fish'] },
                { name: 'Caesar Salad', qty: 1, notes: 'Extra dressing', allergens: ['Dairy', 'Eggs'] }
            ],
            status: 'PREPARING'
        },
        { 
            id: 'ORD-9913', table: 'Table 4', time: '2m', type: 'Dine-in', course: 'Appetizer',
            items: [
                { name: 'Garlic Bread', qty: 2, notes: '', allergens: ['Gluten', 'Dairy'] }
            ],
            status: 'NEW'
        }
    ]);

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4">
            <header className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-yellow-500">Kitchen Display System (KDS)</h1>
                <div className="flex space-x-4">
                    <div className="text-center"><div className="text-2xl font-bold text-red-500">2</div><div className="text-xs uppercase">Pending</div></div>
                    <div className="text-center"><div className="text-2xl font-bold text-green-500">14</div><div className="text-xs uppercase">Completed</div></div>
                </div>
            </header>

            <div className="flex space-x-4 overflow-x-auto pb-4">
                {tickets.map((t, idx) => (
                    <Card key={idx} className="min-w-[300px] bg-gray-800 border-gray-700 text-white shrink-0">
                        <CardHeader className={`border-b border-gray-700 ${t.time.includes('m') && parseInt(t.time) > 15 ? 'bg-red-900/50' : 'bg-gray-800'}`}>
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-xl">#{t.id}</CardTitle>
                                <span className="font-mono text-yellow-400 font-bold">{t.time}</span>
                            </div>
                            <div className="flex justify-between text-sm mt-2 text-gray-400">
                                <span>{t.table} | {t.type}</span>
                                <Badge className="bg-blue-600 text-white">{t.course}</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                            {t.items.map((item, i) => (
                                <div key={i} className="border-b border-gray-700 pb-2 last:border-0">
                                    <div className="flex justify-between font-bold text-lg">
                                        <span>{item.qty}x {item.name}</span>
                                    </div>
                                    {item.notes && <div className="text-sm text-yellow-300 italic mt-1">Note: {item.notes}</div>}
                                    {item.allergens.length > 0 && (
                                        <div className="text-xs text-red-400 font-bold mt-1">ALLERGY: {item.allergens.join(', ')}</div>
                                    )}
                                </div>
                            ))}
                            
                            <div className="pt-4 space-y-2">
                                {t.status === 'NEW' && <Button className="w-full bg-blue-600 hover:bg-blue-700">Start Preparing</Button>}
                                {t.status === 'PREPARING' && <Button className="w-full bg-green-600 hover:bg-green-700">Mark Ready</Button>}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}