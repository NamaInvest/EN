const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'src', 'app', '(dashboard)', 'v3');
if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true });

const verticals = [
  {
    id: 'retail',
    name: 'Retail Chains',
    icon: 'ShoppingCart',
    kpis: ['Sales per SqM', 'Sell-Through Rate', 'Footfall Conversion', 'Avg Basket Size'],
    desc: 'Multi-branch POS, centralized inventory, loyalty programs.'
  },
  {
    id: 'restaurant',
    name: 'Restaurant & F&B',
    icon: 'Utensils',
    kpis: ['RevPASH', 'Food Cost %', 'Table Turnover Rate', 'Jahez/HungerStation Orders'],
    desc: 'Table Management, Kitchen Display System (KDS), Recipe costing.'
  },
  {
    id: 'manufacturing',
    name: 'Advanced Manufacturing',
    icon: 'Factory',
    kpis: ['OEE', 'Scrap Rate', 'Cycle Time', 'Yield Variance'],
    desc: 'Multi-level BOMs, MRP Engine, Shop Floor Routing, Quality Control.'
  },
  {
    id: 'construction',
    name: 'Construction & Contracting',
    icon: 'HardHat',
    kpis: ['Cost Performance Index (CPI)', 'Schedule Performance Index (SPI)', 'Earned Value (EV)', 'Retention %'],
    desc: 'BOQ, Progress Billing, Subcontractor tracking, Project P&L.'
  },
  {
    id: 'clinic',
    name: 'Healthcare & Clinics',
    icon: 'Stethoscope',
    kpis: ['Patient Wait Time', 'Claim Rejection Rate', 'Revenue per Doctor', 'Bed Occupancy'],
    desc: 'Electronic Medical Records (EMR), Appointments, Insurance Claims.'
  },
  {
    id: 'school',
    name: 'Education & Schools',
    icon: 'GraduationCap',
    kpis: ['Collection Rate', 'Dropout Rate', 'Avg Class Size', 'Student-to-Teacher Ratio'],
    desc: 'SIS, Academic Terms, Bus Routing, Tuition Installments.'
  },
  {
    id: 'realestate',
    name: 'Real Estate & Property',
    icon: 'Building',
    kpis: ['Occupancy Rate', 'Rental Yield', 'Maintenance Cost/SqFt', 'Rent Arrears'],
    desc: 'Unit Management, Lease Contracts, PDC tracking, IFRS 16.'
  },
  {
    id: 'distribution',
    name: 'Wholesale & Distribution',
    icon: 'Truck',
    kpis: ['Order Fill Rate', 'Order Cycle Time', 'Inventory Turnover', 'GMROI'],
    desc: 'Route Accounting, B2B Credit Limits, WMS with Bin Locations.'
  },
  {
    id: 'services',
    name: 'Professional Services',
    icon: 'Briefcase',
    kpis: ['Utilization Rate', 'Realization Rate', 'Revenue per Employee', 'WIP-to-Cash'],
    desc: 'Billable Hours, Retainer Management, Expense disbursement.'
  }
];

verticals.forEach(v => {
  const dir = path.join(baseDir, v.id);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const content = `'use client';
import React from 'react';
import { ${v.icon}, TrendingUp, Activity, BarChart, Settings, Download } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ${v.name.replace(/[^a-zA-Z0-9]/g, '')}Dashboard() {
    return (
        <div className="max-w-7xl mx-auto space-y-6 p-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-xl border shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-indigo-50 text-indigo-600 rounded-lg">
                        <${v.icon} className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">${v.name} V3</h1>
                        <p className="text-slate-500 mt-1">${v.desc}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="flex gap-2"><Download className="w-4 h-4"/> Export Report</Button>
                    <Button className="flex gap-2"><Settings className="w-4 h-4"/> Module Settings</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                ${v.kpis.map((kpi, i) => `
                <Card className="p-5 border-l-4 ${i % 2 === 0 ? 'border-l-indigo-500' : 'border-l-emerald-500'} hover:shadow-md transition-shadow">
                    <p className="text-sm font-medium text-slate-500">${kpi}</p>
                    <h3 className="text-2xl font-bold mt-2 text-slate-800">
                        ${i === 0 ? 'SAR 450,200' : i === 1 ? '84.5%' : i === 2 ? '1,204' : '15%'}
                    </h3>
                    <div className="mt-2 flex items-center text-xs text-emerald-600 font-medium">
                        <TrendingUp className="w-3 h-3 mr-1" /> +4.2% from last month
                    </div>
                </Card>`).join('')}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="col-span-2 p-6 h-96 flex flex-col items-center justify-center border-dashed bg-slate-50">
                    <BarChart className="w-16 h-16 text-slate-300 mb-4" />
                    <h3 className="text-lg font-bold text-slate-600">Core Process Analytics</h3>
                    <p className="text-sm text-slate-500 text-center max-w-sm mt-2">
                        Live telemetry from the V3 EventBus will render operational charts here based on the specific needs of ${v.name}.
                    </p>
                </Card>
                
                <Card className="p-6 h-96 flex flex-col items-start justify-start">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                        <Activity className="w-5 h-5 text-blue-500"/> Live Activity Feed
                    </h3>
                    <div className="space-y-4 w-full">
                        {[1,2,3,4,5].map(n => (
                            <div key={n} className="flex gap-3 text-sm border-b pb-3 last:border-0">
                                <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500"></div>
                                <div>
                                    <p className="font-medium text-slate-700">System Event #{Math.floor(Math.random()*1000)}</p>
                                    <p className="text-slate-500 text-xs mt-0.5">Processed 2 mins ago via V3 Engine</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}
`;
  
  fs.writeFileSync(path.join(dir, 'page.tsx'), content);
});

console.log('9 V3 Dashboards generated successfully.');
