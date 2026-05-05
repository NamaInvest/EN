const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'src', 'app', '(dashboard)', 'v3');

const files = {
  'construction/boq': `'use client';
import React from 'react';
import { HardHat, FileBarChart2, Truck, CheckSquare, Hammer } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ConstructionBOQ() {
  return (
    <div className="p-6 bg-stone-100 min-h-screen text-slate-800 space-y-6">
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
            <Button className="mt-6 w-full bg-amber-500 hover:bg-amber-600 text-white font-bold"><Hammer className="w-4 h-4 mr-2"/> Generate Progress Invoice</Button>
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
}`,
  'school/sis': `'use client';
import React from 'react';
import { Users, GraduationCap, Bus, Bell, BookOpen } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function SchoolSIS() {
  return (
    <div className="p-6 bg-slate-50 min-h-screen text-slate-800 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center bg-indigo-900 text-white p-6 rounded-2xl shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-indigo-800 rounded-full flex items-center justify-center border-4 border-indigo-400">
            <GraduationCap className="w-8 h-8 text-indigo-100"/>
          </div>
          <div>
            <h1 className="text-2xl font-black">Student Information System (SIS)</h1>
            <p className="text-indigo-200 text-sm mt-1">Academic Year 2025-2026 • Term 2</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" className="bg-white text-indigo-900 hover:bg-slate-100 font-bold"><BookOpen className="w-4 h-4 mr-2"/> LMS Portal</Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <div className="col-span-1 space-y-6">
          <Card className="p-6 border-indigo-100 shadow-sm bg-white">
            <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><Bus className="w-4 h-4 text-indigo-500"/> Transport</h3>
            <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
              <p className="font-black text-yellow-800 text-lg">Route B</p>
              <p className="text-sm text-yellow-700 mt-1">Driver: Ahmed Ali</p>
              <p className="text-xs font-bold text-emerald-600 mt-2">● En Route</p>
            </div>
          </Card>
          <Card className="p-6 border-red-100 shadow-sm bg-red-50">
            <h3 className="font-bold text-red-800 mb-2 flex items-center gap-2"><Bell className="w-4 h-4"/> Dunning Alert</h3>
            <p className="text-sm text-red-700 font-medium">Installment #2 is overdue by 14 days. LMS access will be restricted in 48 hours.</p>
            <Button size="sm" variant="destructive" className="w-full mt-4">Send Reminder</Button>
          </Card>
        </div>
        
        <div className="col-span-3 space-y-6">
          <Card className="p-6 bg-white shadow-sm border-slate-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2"><Users className="text-indigo-600"/> Class 4A Attendance & Grades</h2>
              <input type="text" placeholder="Search student..." className="px-4 py-2 border rounded-lg text-sm bg-slate-50"/>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-100 text-sm text-slate-500">
                  <th className="pb-3 pl-2">Student Name</th>
                  <th className="pb-3">ID</th>
                  <th className="pb-3">Attendance</th>
                  <th className="pb-3">Math</th>
                  <th className="pb-3">Science</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {[
                  { name: 'Omar Khalid', id: 'STU-1021', att: '98%', m: 'A', s: 'A+', st: 'Active' },
                  { name: 'Sarah Ahmed', id: 'STU-1022', att: '85%', m: 'B', s: 'B+', st: 'Active' },
                  { name: 'Fahad Yaser', id: 'STU-1023', att: '60%', m: 'C', s: 'D', st: 'Warning' }
                ].map((s, i) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-4 pl-2 font-bold text-slate-700">{s.name}</td>
                    <td className="py-4 font-mono text-xs text-slate-500">{s.id}</td>
                    <td className="py-4 font-bold text-slate-600">{s.att}</td>
                    <td className="py-4 font-bold text-indigo-600">{s.m}</td>
                    <td className="py-4 font-bold text-emerald-600">{s.s}</td>
                    <td className="py-4"><span className={\`px-2 py-1 rounded text-xs font-bold \${s.st==='Warning'?'bg-red-100 text-red-700':'bg-emerald-100 text-emerald-700'}\`}>{s.st}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </div>
  );
}`,
  'realestate/leases': `'use client';
import React from 'react';
import { Building, Key, Wallet, FileText, Wrench } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function RealEstateLeases() {
  return (
    <div className="p-6 bg-slate-100 min-h-screen text-slate-800 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3 text-slate-800"><Building className="text-teal-600 w-8 h-8"/> Al-Faisaliah Tower</h1>
          <p className="text-slate-500 mt-1 font-medium">Commercial Property • 45 Units • 92% Occupancy</p>
        </div>
        <Button className="bg-teal-600 hover:bg-teal-700 font-bold"><Key className="w-4 h-4 mr-2"/> New Lease Contract</Button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <Card className="p-6 bg-white shadow-sm border-slate-200">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4 border-b pb-4"><Wallet className="text-teal-600"/> PDC Vault (Post-Dated Checks)</h2>
            <div className="space-y-4 font-medium">
              {[
                {unit: 'Office 401', date: '01 Nov 2025', amt: '120,000', bank: 'Al-Rajhi Bank', status: 'Due in 5 Days'},
                {unit: 'Retail 02', date: '15 Dec 2025', amt: '45,000', bank: 'SNB', status: 'Vaulted'},
                {unit: 'Office 205', date: '01 Jan 2026', amt: '90,000', bank: 'Riyad Bank', status: 'Vaulted'}
              ].map((c,i) => (
                <div key={i} className="flex justify-between items-center p-4 bg-slate-50 border border-slate-100 rounded-lg">
                  <div>
                    <p className="font-bold text-slate-700">{c.unit}</p>
                    <p className="text-xs text-slate-500 mt-1">{c.bank}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-teal-700">SAR {c.amt}</p>
                    <p className={\`text-xs font-bold mt-1 \${i===0?'text-red-500':'text-slate-400'}\`}>{c.date} • {c.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
        <div className="space-y-6">
          <Card className="p-6 shadow-sm border-slate-200 bg-white">
            <h2 className="font-bold flex items-center gap-2 mb-4"><Wrench className="w-5 h-5 text-teal-600"/> Maintenance Tickets</h2>
            <div className="space-y-3">
              <div className="p-3 border-l-4 border-l-red-500 rounded-r-lg bg-slate-50 shadow-sm">
                <p className="font-bold text-sm">AC Leakage</p>
                <p className="text-xs text-slate-500 mt-1">Office 401 • Reported 2h ago</p>
              </div>
              <div className="p-3 border-l-4 border-l-amber-500 rounded-r-lg bg-slate-50 shadow-sm">
                <p className="font-bold text-sm">Elevator #2 Stuck</p>
                <p className="text-xs text-slate-500 mt-1">Lobby • Reported 5h ago</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}`,
  'distribution/wms': `'use client';
import React from 'react';
import { PackageCheck, Map, MapPin, Truck, Layers } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function DistributionWMS() {
  return (
    <div className="p-6 bg-slate-900 min-h-screen text-slate-100 space-y-6">
      <div className="flex justify-between items-center border-b border-slate-800 pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-500/20 rounded-xl"><PackageCheck className="w-8 h-8 text-indigo-400"/></div>
          <div><h1 className="text-3xl font-black">Advanced WMS</h1><p className="text-slate-400 mt-1">3D Bin Locations • Route Sales Dispatch</p></div>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-500 font-bold"><Layers className="w-4 h-4 mr-2"/> Start Replenishment</Button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <Card className="p-0 border-slate-700 bg-slate-800 overflow-hidden h-[600px] flex flex-col">
            <div className="p-4 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
              <h2 className="font-bold flex items-center gap-2"><Map className="w-5 h-5 text-indigo-400"/> Interactive Warehouse Layout</h2>
              <span className="text-xs bg-slate-700 px-2 py-1 rounded font-mono">Zone A - Racks</span>
            </div>
            <div className="flex-1 p-6 grid grid-cols-4 gap-4">
              {/* Mocking 3D Racks */}
              {[1,2,3,4,5,6,7,8].map(rack => (
                <div key={rack} className="bg-slate-900 border border-slate-700 rounded-lg p-2 space-y-2 flex flex-col justify-end">
                  <div className="text-center font-black text-slate-600 text-xs mb-2">Aisle {rack}</div>
                  <div className="h-12 bg-emerald-500/20 border border-emerald-500/50 rounded flex items-center justify-center text-xs text-emerald-400 font-bold">100% Full</div>
                  <div className="h-12 bg-amber-500/20 border border-amber-500/50 rounded flex items-center justify-center text-xs text-amber-400 font-bold">45% Full</div>
                  <div className="h-12 bg-red-500/20 border border-red-500/50 rounded flex items-center justify-center text-xs text-red-400 font-bold">Empty</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
        <div className="space-y-6">
          <Card className="p-6 border-slate-700 bg-slate-800">
            <h2 className="font-bold flex items-center gap-2 mb-4"><Truck className="w-5 h-5 text-indigo-400"/> Active Fleet Routes</h2>
            <div className="space-y-4">
              <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                <div className="flex justify-between items-center mb-2"><span className="font-bold">Truck #42</span><span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded">Delivering</span></div>
                <div className="flex items-center gap-2 text-sm text-slate-400 mt-3"><MapPin className="w-4 h-4 text-emerald-400"/> Next Stop: HyperPanda (Olaya)</div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 mt-4"><div className="bg-indigo-500 h-1.5 rounded-full w-[40%]"></div></div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}`,
  'services/timesheet': `'use client';
import React from 'react';
import { Clock, Briefcase, FileText, CheckCircle, DollarSign } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ServicesTimesheet() {
  return (
    <div className="p-6 bg-slate-50 min-h-screen text-slate-800 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3 text-indigo-900"><Briefcase className="text-indigo-600 w-8 h-8"/> Professional Services</h1>
          <p className="text-slate-500 mt-1 font-medium">Timesheets • Retainers • WIP Revenue</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700 font-bold"><Clock className="w-4 h-4 mr-2"/> Log Hours</Button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <Card className="p-6 bg-white shadow-sm border-slate-200">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4 border-b pb-4"><FileText className="text-indigo-600"/> Weekly Timesheet</h2>
            <div className="space-y-3 font-medium">
              <div className="grid grid-cols-12 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200 font-bold text-sm text-slate-600 text-center">
                <div className="col-span-4 text-left">Client / Matter</div><div className="col-span-1">Mon</div><div className="col-span-1">Tue</div><div className="col-span-1">Wed</div><div className="col-span-1">Thu</div><div className="col-span-1">Fri</div><div className="col-span-1">Sat</div><div className="col-span-2">Total</div>
              </div>
              <div className="grid grid-cols-12 gap-4 p-3 border-b border-slate-100 items-center text-center text-sm">
                <div className="col-span-4 text-left font-bold text-slate-700">Aramco / Contract Review</div>
                <div className="col-span-1">2.5</div><div className="col-span-1 bg-indigo-50 border border-indigo-200 rounded text-indigo-700 font-bold">4.0</div><div className="col-span-1">1.0</div><div className="col-span-1">-</div><div className="col-span-1">-</div><div className="col-span-1">-</div>
                <div className="col-span-2 font-black text-indigo-800">7.5 h</div>
              </div>
            </div>
          </Card>
        </div>
        <div className="space-y-6">
          <Card className="p-6 shadow-sm border-slate-200 bg-white">
            <h2 className="font-bold flex items-center gap-2 mb-4"><DollarSign className="w-5 h-5 text-emerald-600"/> Retainer Balances</h2>
            <div className="space-y-4">
              <div className="p-4 border border-emerald-100 bg-emerald-50 rounded-xl">
                <p className="font-bold text-emerald-900">Aramco Trust Account</p>
                <h3 className="text-3xl font-black text-emerald-600 mt-2">$ 45,000</h3>
                <p className="text-xs text-emerald-700 mt-2 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Sufficient funds for WIP</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}`
};

Object.keys(files).forEach(route => {
  const filePath = path.join(baseDir, route, 'page.tsx');
  fs.writeFileSync(filePath, files[route]);
});

console.log('Remaining 5 high-fidelity React UIs generated successfully.');
