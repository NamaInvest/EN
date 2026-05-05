'use client';
import React from 'react';
import { ChefHat, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function RestaurantKDS() {
  return (
    <div className="p-6 bg-slate-900 min-h-screen text-slate-100">
      <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <ChefHat className="w-8 h-8 text-orange-500" />
          <h1 className="text-3xl font-black tracking-tight">Kitchen Display (KDS)</h1>
        </div>
        <div className="flex gap-4">
          <div className="px-4 py-2 bg-slate-800 rounded-lg flex items-center gap-2"><Clock className="w-4 h-4 text-blue-400"/> Avg Time: 12m</div>
          <div className="px-4 py-2 bg-slate-800 rounded-lg text-emerald-400 font-bold">14 Active Orders</div>
        </div>
      </div>
      
      <div className="grid grid-cols-4 gap-4 overflow-x-auto pb-8">
        {[1,2,3,4,5,6].map(i => (
          <Card key={i} className={`p-0 flex flex-col h-96 border-0 ${i===1?'bg-red-950/40 border border-red-500/50':'bg-slate-800'}`}>
            <div className={`p-3 flex justify-between items-center rounded-t-xl ${i===1?'bg-red-600':'bg-slate-700'}`}>
              <span className="font-black text-lg">#{1020 + i}</span>
              <span className="font-bold">{i===1?'15:42':'04:12'}</span>
            </div>
            <div className="p-2 border-b border-slate-700/50 flex justify-between text-xs text-slate-300">
              <span>Table {i*2}</span>
              <span>Dine-in</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              <div className="flex gap-2 text-lg"><span className="font-black text-orange-400">1x</span> <span>Truffle Burger</span></div>
              <div className="flex gap-2 text-lg"><span className="font-black text-orange-400">2x</span> <span>Sweet Potato Fries</span></div>
              <div className="text-sm text-yellow-500 pl-6 border-l-2 border-yellow-500 ml-2">- No Onions<br/>- Extra Sauce</div>
            </div>
            <div className="p-3 border-t border-slate-700/50 mt-auto">
              <Button className="w-full h-14 text-lg font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl">BUMP <CheckCircle2 className="ml-2 w-5 h-5"/></Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}