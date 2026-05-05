const fs = require('fs');
const path = require('path');

const apis = [
  { path: 'retail/pos', model: 'retailPOSOrder', fields: 'total: body.total || 0, status: "completed", branchId: body.branchId || 1' },
  { path: 'restaurant/kds', model: 'restaurantKDSTicket', fields: 'tableNo: body.tableNo || 1, status: "pending", items: body.items || []' },
  { path: 'manufacturing/mrp', model: 'manufacturingBOM', fields: 'productId: body.productId || 1, version: "v1.0", components: body.components || []' },
  { path: 'construction/boq', model: 'constructionBOQ', fields: 'projectId: body.projectId || 1, totalCost: body.totalCost || 0, items: body.items || []' },
  { path: 'clinic/emr', model: 'clinicPatientRecord', fields: 'patientName: body.patientName || "Unknown", icd10Codes: body.icd10Codes || [], vitals: body.vitals || {}' },
  { path: 'school/sis', model: 'schoolStudent', fields: 'name: body.name || "Unknown", grade: body.grade || "G1"' },
  { path: 'realestate/leases', model: 'realEstateLease', fields: 'propertyId: body.propertyId || 1, tenantId: body.tenantId || 1, rentAmount: body.rentAmount || 0, startDate: new Date(), endDate: new Date(), status: "active"' },
  { path: 'distribution/wms', model: 'distributionRoute', fields: 'driverId: body.driverId || 1, status: "pending", stops: body.stops || []' },
  { path: 'services/timesheet', model: 'serviceTimesheet', fields: 'employeeId: body.employeeId || 1, projectId: body.projectId || 1, hours: body.hours || 0, date: new Date()' }
];

apis.forEach(api => {
  const dirPath = path.join(__dirname, 'src', 'app', 'api', 'v3', ...api.path.split('/'));
  fs.mkdirSync(dirPath, { recursive: true });

  const routeContent = [
    'import { NextRequest, NextResponse } from "next/server";',
    'import prisma from "@/lib/prisma";',
    '',
    'export async function GET(req: NextRequest) {',
    '    try {',
    '        const data = await prisma.' + api.model + '.findMany({ take: 50, orderBy: { id: "desc" } });',
    '        return NextResponse.json({ success: true, data });',
    '    } catch (error: any) {',
    '        return NextResponse.json({ error: error.message }, { status: 500 });',
    '    }',
    '}',
    '',
    'export async function POST(req: NextRequest) {',
    '    try {',
    '        const body = await req.json().catch(() => ({}));',
    '        const data = await prisma.' + api.model + '.create({',
    '            data: { ' + api.fields + ' }',
    '        });',
    '        return NextResponse.json({ success: true, data });',
    '    } catch (error: any) {',
    '        return NextResponse.json({ error: error.message }, { status: 500 });',
    '    }',
    '}'
  ].join('\\n');

  fs.writeFileSync(path.join(dirPath, 'route.ts'), routeContent);
});

const srPath = path.join(__dirname, 'sync_report.json');
let sr = JSON.parse(fs.readFileSync(srPath, 'utf8'));
apis.forEach(api => {
  const apiFile = 'src/app/api/v3/' + api.path + '/route.ts';
  if (!sr.includes(apiFile)) sr.push(apiFile);
});
fs.writeFileSync(srPath, JSON.stringify(sr, null, 4));

console.log('9 APIs generated successfully!');
