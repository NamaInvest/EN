'use client';
import React from 'react';
import { Cpu, Settings, Factory, Workflow, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ManufacturingMRP() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center p-6 bg-gradient-to-r from-slate-900 to-indigo-900 rounded-xl shadow-lg text-white">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3"><Factory className="text-indigo-400"/> MRP Engine</h1>
          <p className="text-indigo-200 mt-2">Multi-level BOM Explosion & Work Order Routing</p>
        </div>
        <Button className="bg-indigo-500 hover:bg-indigo-400 text-white font-bold px-6 h-12 rounded-lg">Run MRP Calculation</Button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <Card className="p-6 border-slate-200 shadow-sm">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4 border-b pb-4"><Workflow className="text-indigo-600"/> Exploded BOM Tree: Electric Motor V2</h2>
            <div className="space-y-2 font-mono text-sm">
              <div className="flex items-center gap-4 bg-indigo-50 p-3 rounded-lg border border-indigo-100 font-bold"><span>[-/+]</span> <span>1x</span> <span>Electric Motor V2 (FG)</span> <span className="ml-auto text-indigo-600">Cost: $124.50</span></div>
              <div className="flex items-center gap-4 p-2 pl-12 border-b border-dashed"><span>├─</span> <span>1x</span> <span>Rotor Assembly (WIP)</span> <span className="ml-auto text-slate-500">$45.00</span></div>
              <div className="flex items-center gap-4 p-2 pl-24 border-b border-dashed text-slate-600"><span>├─</span> <span>2kg</span> <span>Copper Wire (RM)</span> <span className="ml-auto text-slate-400">$12.00</span></div>
              <div className="flex items-center gap-4 p-2 pl-24 border-b border-dashed text-slate-600"><span>└─</span> <span>1x</span> <span>Steel Shaft (RM)</span> <span className="ml-auto text-slate-400">$8.00</span></div>
              <div className="flex items-center gap-4 p-2 pl-12 border-b border-dashed"><span>└─</span> <span>1x</span> <span>Stator Housing (RM)</span> <span className="ml-auto text-slate-500">$65.00</span></div>
            </div>
          </Card>
        </div>
        <div className="space-y-6">
          <Card className="p-6 shadow-sm border-orange-200 bg-orange-50/50">
            <h2 className="font-bold flex items-center gap-2 mb-4 text-orange-800"><AlertTriangle className="w-5 h-5"/> Material Shortages</h2>
            <div className="space-y-3">
              <div className="bg-white p-3 rounded border border-orange-200 shadow-sm flex justify-between">
                <div><p className="font-bold text-sm">Copper Wire</p><p className="text-xs text-orange-600 mt-1">Shortage: 450 kg</p></div>
                <Button size="sm" variant="outline" className="text-xs h-8">Auto PR</Button>
              </div>
            </div>
          </Card>
          <Card className="p-6 shadow-sm bg-slate-900 text-white">
            <h2 className="font-bold flex items-center gap-2 mb-4"><Settings className="w-5 h-5 text-indigo-400"/> Work Centers Load</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1"><span>Assembly Line 1</span><span className="text-indigo-400 font-bold">85%</span></div>
                <div className="w-full bg-slate-800 rounded-full h-2"><div className="bg-indigo-500 h-2 rounded-full w-[85%]"></div></div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1"><span>CNC Machining</span><span className="text-red-400 font-bold">110% (Over)</span></div>
                <div className="w-full bg-slate-800 rounded-full h-2"><div className="bg-red-500 h-2 rounded-full w-[100%]"></div></div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}