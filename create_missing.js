const fs = require('fs');
const path = require('path');

const missingRoutes = [
'/pos',
'/restaurant-pos',
'/shifts/monitor',
'/pos/accountant',
'/sales/analytics',
'/sales/smart-map',
'/pharmacy',
'/pharmacy/manager',
'/pharmacy/drug-interact',
'/warehouses/map',
'/warehouses/fifo',
'/finance/cfo-dashboard',
'/procurement/supplier-contracts',
'/procurement/price-comparison',
'/fleet/tracking',
'/support/help-desk',
'/crm/cx-nps',
'/crm/key-accounts',
'/enterprise/portfolio',
'/marketing/analytics',
'/ai/demand-forecast',
'/ai/sales-coach',
'/admin/siem',
'/ice'
];

function toTitleCase(str) {
  return str.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

for (const route of missingRoutes) {
    const parts = route.split('/').filter(Boolean);
    const title = parts.length > 0 ? toTitleCase(parts[parts.length - 1]) : 'Dashboard';
    const componentName = title.replace(/\s+/g, '') + 'Page';
    
    const targetDir = path.join('src/app/(dashboard)', ...parts);
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }
    
    const filePath = path.join(targetDir, 'page.tsx');
    if (fs.existsSync(filePath)) continue;

    const code = `import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, LayoutGrid, Clock, Settings, ArrowRight } from 'lucide-react';

export default function ${componentName}() {
    return (
        <div className="max-w-7xl mx-auto space-y-6 p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                        <LayoutGrid className="w-8 h-8 text-indigo-600" />
                        ${title} Dashboard
                    </h1>
                    <p className="text-gray-500 mt-1">Manage and monitor ${title.toLowerCase()} operations efficiently.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="bg-white">
                        <Settings className="w-4 h-4 mr-2" />
                        Configure
                    </Button>
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
                        <Activity className="w-4 h-4 mr-2" />
                        Generate Report
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                    <Card key={i} className="bg-white border-gray-200 shadow-sm">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-500">Metric {i}</p>
                                <Clock className="w-4 h-4 text-indigo-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mt-2">0.00</h3>
                            <p className="text-xs text-green-500 mt-1">+0.0% from last month</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="border-gray-200 shadow-sm bg-white overflow-hidden">
                <div className="p-12 text-center flex flex-col items-center justify-center">
                    <LayoutGrid className="w-16 h-16 text-gray-300 mb-4" />
                    <h3 className="text-xl font-bold text-gray-800">Module Activation Pending</h3>
                    <p className="text-gray-500 mt-2 max-w-md">
                        This enterprise module (${title}) is currently being provisioned. Features will be available in the upcoming release cycle.
                    </p>
                    <Button variant="outline" className="mt-6">
                        View Documentation <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            </Card>
        </div>
    );
}
`;

    fs.writeFileSync(filePath, code);
    console.log('Created:', filePath);
}

// Add these to deploy_new_modules.js
const deployContent = fs.readFileSync('deploy_new_modules.js', 'utf8');
const fileLines = deployContent.split('\\n');
const insertIndex = fileLines.findIndex(l => l.includes('prisma/schema.prisma'));
const uploads = missingRoutes.map(r => `    "src/app/(dashboard)${r}/page.tsx",`);
fileLines.splice(insertIndex, 0, ...uploads);
fs.writeFileSync('deploy_new_modules.js', fileLines.join('\\n'));
console.log('deploy_new_modules.js updated');
