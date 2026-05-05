const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'src', 'app', '(dashboard)', 'v3');

const files = {
  'retail/pos': `'use client';
import React, { useState } from 'react';
import { ShoppingCart, Search, CreditCard, ScanLine, Printer, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function RetailPOS() {
  const [cart, setCart] = useState([{ id: 1, name: 'Wireless Headphones', price: 299, qty: 1 }]);
  return (
    <div className="flex h-[85vh] gap-4 p-4 bg-slate-50">
      {/* Products Grid */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Scan Barcode or Search Products..." className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-lg shadow-sm" />
          <ScanLine className="absolute right-3 top-3 w-6 h-6 text-indigo-500" />
        </div>
        <div className="grid grid-cols-3 gap-4 overflow-y-auto pr-2 pb-20">
          {[1,2,3,4,5,6,7,8,9].map(i => (
            <Card key={i} className="p-4 cursor-pointer hover:border-indigo-500 hover:shadow-md transition-all flex flex-col items-center justify-center h-40 bg-white">
              <div className="w-16 h-16 bg-slate-100 rounded-full mb-2 flex items-center justify-center">
                <span className="text-2xl">📦</span>
              </div>
              <p className="font-semibold text-slate-700">Product Item {i}</p>
              <p className="text-indigo-600 font-bold mt-1">SAR {(Math.random() * 100 + 50).toFixed(2)}</p>
            </Card>
          ))}
        </div>
      </div>
      {/* Cart Sidebar */}
      <div className="w-96 bg-white rounded-xl shadow-lg border border-slate-200 flex flex-col">
        <div className="p-4 border-b bg-slate-900 text-white rounded-t-xl flex justify-between items-center">
          <div className="flex items-center gap-2"><ShoppingCart className="w-5 h-5"/> <h2 className="font-bold text-lg">Current Order</h2></div>
          <span className="text-sm bg-slate-800 px-2 py-1 rounded">Shift: 042</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.map(item => (
            <div key={item.id} className="flex justify-between items-center p-3 border rounded-lg bg-slate-50">
              <div><p className="font-semibold text-sm">{item.name}</p><p className="text-xs text-slate-500">SAR {item.price} x {item.qty}</p></div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-indigo-600">SAR {item.price * item.qty}</span>
                <Trash2 className="w-4 h-4 text-red-500 cursor-pointer hover:text-red-700" />
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t bg-slate-50 rounded-b-xl space-y-3">
          <div className="flex justify-between text-sm text-slate-600"><span>Subtotal</span><span>SAR 299.00</span></div>
          <div className="flex justify-between text-sm text-slate-600"><span>VAT (15%)</span><span>SAR 44.85</span></div>
          <div className="flex justify-between text-xl font-black text-slate-800 border-t pt-2 mt-2"><span>Total</span><span>SAR 343.85</span></div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <Button variant="outline" className="h-12 border-slate-300"><Printer className="w-4 h-4 mr-2"/> Print</Button>
            <Button className="h-12 bg-indigo-600 hover:bg-indigo-700"><CreditCard className="w-4 h-4 mr-2"/> Pay Now</Button>
          </div>
        </div>
      </div>
    </div>
  );
}`,
  'restaurant/kds': `'use client';
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
          <Card key={i} className={\`p-0 flex flex-col h-96 border-0 \${i===1?'bg-red-950/40 border border-red-500/50':'bg-slate-800'}\`}>
            <div className={\`p-3 flex justify-between items-center rounded-t-xl \${i===1?'bg-red-600':'bg-slate-700'}\`}>
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
}`,
  'manufacturing/mrp': `'use client';
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
}`,
  'clinic/emr': `'use client';
import React from 'react';
import { Activity, Stethoscope, FileText, Pill, CalendarDays } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ClinicEMR() {
  return (
    <div className="flex h-screen bg-slate-100 p-4 gap-4">
      <div className="w-1/4 space-y-4 flex flex-col">
        <Card className="p-6 bg-indigo-600 text-white shadow-lg rounded-2xl">
          <div className="flex gap-4 items-center mb-6">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center font-black text-indigo-600 text-xl border-4 border-indigo-300">SA</div>
            <div>
              <h2 className="font-bold text-xl">Sami Ahmed</h2>
              <p className="text-indigo-200 text-sm">ID: PAT-99213 • 34Y Male</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm font-medium">
            <div className="bg-indigo-700/50 p-3 rounded-lg"><span className="text-indigo-300 block text-xs">Blood Type</span> O+</div>
            <div className="bg-indigo-700/50 p-3 rounded-lg"><span className="text-indigo-300 block text-xs">Allergies</span> Penicillin</div>
          </div>
        </Card>
        <Card className="flex-1 p-4 bg-white shadow-sm overflow-y-auto">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><CalendarDays className="w-4 h-4"/> Past Visits</h3>
          <div className="space-y-4 border-l-2 border-slate-100 ml-2 pl-4">
            <div className="relative"><div className="w-3 h-3 bg-indigo-500 rounded-full absolute -left-[23px] top-1"></div><p className="font-bold text-sm">12 Oct 2025</p><p className="text-xs text-slate-500">Hypertension Follow-up</p></div>
            <div className="relative"><div className="w-3 h-3 bg-slate-300 rounded-full absolute -left-[23px] top-1"></div><p className="font-bold text-sm text-slate-600">05 Mar 2025</p><p className="text-xs text-slate-500">General Checkup</p></div>
          </div>
        </Card>
      </div>

      <div className="flex-1 flex flex-col gap-4">
        <div className="flex gap-4">
          <Card className="flex-1 p-6 flex items-center gap-4 shadow-sm border-t-4 border-t-rose-500">
            <Activity className="w-8 h-8 text-rose-500"/><div><p className="text-sm text-slate-500 font-bold">BP</p><p className="text-2xl font-black">120/80</p></div>
          </Card>
          <Card className="flex-1 p-6 flex items-center gap-4 shadow-sm border-t-4 border-t-blue-500">
            <Stethoscope className="w-8 h-8 text-blue-500"/><div><p className="text-sm text-slate-500 font-bold">HR</p><p className="text-2xl font-black">72 bpm</p></div>
          </Card>
        </div>

        <Card className="flex-1 p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-4 border-b pb-4">
            <h3 className="font-black text-xl text-slate-800 flex items-center gap-2"><FileText className="text-indigo-600"/> Clinical Notes (SOAP)</h3>
            <div className="flex gap-2">
              <Button variant="outline" className="flex items-center gap-2"><Pill className="w-4 h-4"/> e-Prescribe</Button>
              <Button className="bg-slate-900 text-white">Save Encounter</Button>
            </div>
          </div>
          <div className="space-y-4 flex-1">
            <div><label className="font-bold text-sm text-slate-700 mb-1 block">Subjective</label><textarea className="w-full h-24 p-3 border rounded-lg bg-slate-50 resize-none focus:ring-2 focus:ring-indigo-500" placeholder="Patient complains of..."></textarea></div>
            <div>
              <label className="font-bold text-sm text-slate-700 mb-1 block">Assessment (ICD-10)</label>
              <div className="p-3 border rounded-lg bg-slate-50 text-slate-600 flex items-center justify-between">
                <span>[I10] Essential (primary) hypertension</span>
                <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded font-bold">Primary</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}`
};

Object.keys(files).forEach(route => {
  const filePath = path.join(baseDir, route, 'page.tsx');
  fs.writeFileSync(filePath, files[route]);
});

console.log('High-fidelity React UIs generated for key verticals.');
