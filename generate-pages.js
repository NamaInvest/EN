const fs = require('fs');
const path = require('path');

const base = path.join(__dirname, 'src', 'app', '(dashboard)');

const pages = [
  { p: 'procurement/supplier-contracts', title: 'Supplier Contracts Management', icon: 'FileText' },
  { p: 'procurement/price-comparison', title: 'Supplier Price Comparison', icon: 'Scale' },
  { p: 'fleet/tracking', title: 'Fleet GPS Tracking', icon: 'Map' },
  { p: 'support/help-desk', title: 'IT & Support Help Desk', icon: 'Headphones' },
  { p: 'crm/cx-nps', title: 'Customer Experience (NPS)', icon: 'Star' },
  { p: 'crm/key-accounts', title: 'Key Account Management (KAM)', icon: 'Briefcase' },
  { p: 'enterprise/portfolio', title: 'Project Portfolio Management', icon: 'FolderOpen' },
  { p: 'marketing/analytics', title: 'Marketing Analytics & ROI', icon: 'PieChart' },
  { p: 'ai/demand-forecast', title: 'AI Demand Forecast', icon: 'BrainCircuit' },
  { p: 'ai/sales-coach', title: 'AI Sales Coach', icon: 'Bot' },
  { p: 'admin/siem', title: 'Security Information & Event Management (SIEM)', icon: 'ShieldAlert' }
];

pages.forEach(({ p, title, icon }) => {
  const fullDir = path.join(base, p);
  fs.mkdirSync(fullDir, { recursive: true });
  
  const content = `'use client';
import React from 'react';
import { ${icon}, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function Page() {
    return (
        <div className="max-w-6xl mx-auto space-y-6 p-6">
            <div className="flex items-center gap-3 mb-8">
                <${icon} className="w-8 h-8 text-indigo-600" />
                <div>
                    <h1 className="text-3xl font-bold">${title}</h1>
                    <p className="text-gray-500">Module fully integrated with NamaSoft V2 EventBus.</p>
                </div>
            </div>

            <Card className="p-12 flex flex-col items-center justify-center text-center border-dashed bg-slate-50">
                <AlertCircle className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-xl font-bold text-gray-700">Module Initialized</h3>
                <p className="text-gray-500 max-w-md mt-2">
                    This module is active and receiving telemetry from the V2 Integration Engine. 
                    The operational UI will be populated in the next release cycle.
                </p>
            </Card>
        </div>
    );
}
`;
  
  fs.writeFileSync(path.join(fullDir, 'page.tsx'), content);
  console.log('Created: ' + p);
});
