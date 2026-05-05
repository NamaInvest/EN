'use client';
import React from 'react';
import { HardHat, FileBarChart2, Truck, CheckSquare, Hammer } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ConstructionBOQ() {
  return (
    <div className="p-6 bg-stone-100 min-h-screen text-slate-800 space-y-6">      {/* Global System Features Bar */} \n      <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl shadow-xl flex justify-between items-center mb-6 animate-fade-in">\n        <div className="flex items-center gap-2">\n          <span className="text-yellow-400 font-black tracking-widest text-sm border border-yellow-400/50 bg-yellow-400/10 px-2 py-1 rounded">GLOBAL ENTERPRISE FEATURES</span>\n        </div>\n        <div className="flex gap-3">\n        <Button className="bg-stone-600 text-white font-bold hover:opacity-90 shadow-lg"><Building2 className="w-4 h-4 mr-2"/> Open BIM Viewer 3D</Button>\n        <Button className="bg-blue-600 text-white font-bold hover:opacity-90 shadow-lg"><Plane className="w-4 h-4 mr-2"/> Drone Survey Import</Button>\n        <Button className="bg-sky-500 text-white font-bold hover:opacity-90 shadow-lg"><CloudRain className="w-4 h-4 mr-2"/> Weather Impact Forecast</Button>\n        </div>\n      </div>
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-stone-200">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3 text-stone-800"><HardHat className="text-amber-500 w-8 h-8"/> Project: Riyadh Metro Line 4</h1>
          <p className="text-stone-500 mt-1 font-medium">BOQ & Progress Billing • Subcontractor Management</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-stone-500 font-bold">Total Budget</p>
          <p className="text-2xl font-black text-amber-600">SAR 14,500,000</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <Card className="p-6 bg-white shadow-sm border-stone-200">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4 border-b pb-4"><FileBarChart2 className="text-stone-600"/> Bill of Quantities (BOQ)</h2>
            <div className="space-y-3 font-medium">
              <div className="grid grid-cols-12 gap-4 bg-stone-50 p-3 rounded-lg border border-stone-200 font-bold text-sm text-stone-600">
                <div className="col-span-1">Item</div><div className="col-span-5">Description</div><div className="col-span-2">Qty</div><div className="col-span-2">Unit P.</div><div className="col-span-2">Total</div>
              </div>
              {[
                {id: '1.1', desc: 'Site Excavation & Leveling', qty: '12,000 m³', price: '45', total: '540,000'},
                {id: '1.2', desc: 'Reinforced Concrete (Foundations)', qty: '3,500 m³', price: '320', total: '1,120,000'},
                {id: '1.3', desc: 'Steel Rebar Supply', qty: '800 Ton', price: '2,400', total: '1,920,000'}
              ].map(item => (
                <div key={item.id} className="grid grid-cols-12 gap-4 p-3 border-b border-stone-100 text-sm items-center">
                  <div className="col-span-1 font-mono text-amber-600">{item.id}</div>
                  <div className="col-span-5 font-bold text-stone-700">{item.desc}</div>
                  <div className="col-span-2 text-stone-500">{item.qty}</div>
                  <div className="col-span-2 text-stone-500">{item.price}</div>
                  <div className="col-span-2 font-bold text-stone-800">{item.total}</div>
                </div>
              ))}
            </div>
            <Button onClick={() => { fetch("/api/v3/construction/boq", { method: "POST", body: JSON.stringify({ projectId: 1, totalCost: 14500000 }) }).then(()=>alert("Progress Invoice Generated & Saved!")); }} className="mt-6 w-full bg-amber-500 hover:bg-amber-600 text-white font-bold"><Hammer className="w-4 h-4 mr-2"/> Generate Progress Invoice</Button>
          </Card>
        </div>
        <div className="space-y-6">
          <Card className="p-6 shadow-sm border-stone-200 bg-white">
            <h2 className="font-bold flex items-center gap-2 mb-4"><Truck className="w-5 h-5 text-stone-600"/> Fleet Allocation</h2>
            <div className="space-y-3">
              <div className="p-3 border rounded-lg bg-stone-50 flex justify-between items-center"><span className="font-bold text-sm">Excavator CAT-320</span><span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-bold">On Site</span></div>
              <div className="p-3 border rounded-lg bg-stone-50 flex justify-between items-center"><span className="font-bold text-sm">Crane Liebherr 50T</span><span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded font-bold">Maintenance</span></div>
            </div>
          </Card>
          <Card className="p-6 shadow-sm border-stone-200 bg-white">
            <h2 className="font-bold flex items-center gap-2 mb-4"><CheckSquare className="w-5 h-5 text-stone-600"/> Subcontractors</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1 font-bold"><span>Alpha Steel Co.</span><span className="text-stone-500">SAR 120k Retained</span></div>
                <div className="w-full bg-stone-200 rounded-full h-2"><div className="bg-amber-500 h-2 rounded-full w-[65%]"></div></div>
                <p className="text-xs text-stone-400 mt-1">65% Completion</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}