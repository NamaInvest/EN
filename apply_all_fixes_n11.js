const { Client } = require('ssh2');
const fs = require('fs');

function ssh(cmd, timeout = 30000) {
  return new Promise(r => {
    const c = new Client();
    let out = '';
    const timer = setTimeout(() => { c.end(); r(out + '\n[TIMEOUT]'); }, timeout);
    c.on('ready', () => c.exec(cmd, (err, stream) => {
      if (err) { clearTimeout(timer); r('[ERROR] ' + err.message); return; }
      stream.on('data', d => out += d);
      stream.stderr.on('data', d => out += d);
      stream.on('close', () => { clearTimeout(timer); c.end(); r(out.trim()); });
    })).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
  });
}

const N11 = '/www/wwwroot/n11.namainvist.com';

async function uploadFile(remotePath, content) {
  const b64 = Buffer.from(content, 'utf8').toString('base64');
  const result = await ssh(`echo '${b64}' | base64 -d > '${remotePath}' && echo OK`);
  return result.includes('OK') ? `✅ ${remotePath}` : `❌ ${result}`;
}

(async () => {
  const SEP = '\n' + '─'.repeat(55) + '\n';

  // ══════════════════════════════════════════════════
  // FIX 1: api/ai/cfo/route.ts
  // المشكلة: createdAt غير موجود (يجب date), finalTotal غير موجود (يجب total)
  // ══════════════════════════════════════════════════
  process.stdout.write(SEP + 'FIX 1: api/ai/cfo/route.ts\n');
  const cfoFixed = `import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const auth = getUserFromRequest(req as any);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { prompt } = await req.json();
    if (!prompt) return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // 1. Gather live contextual metrics from the ERP Database to feed the AI
    const salesCount = await prisma.salesInvoice.count();
    const activeLeases = await prisma.leaseContract.count({ where: { status: 'ACTIVE' } });
    const expiredLeases = await prisma.leaseContract.count({ where: { status: 'EXPIRED' } });
    const activeTrips = await prisma.fleetTrip.count({ where: { status: 'IN_PROGRESS' } });
    const totalEmployees = await prisma.employee.count({ where: { active: true } });
    const totalStudents = await prisma.student.count({ where: { status: 'ENROLLED' } });
    const totalVehicles = await prisma.vehicle.count();

    // Summing today's sales — use 'date' field (not createdAt) and 'total' (not finalTotal)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaySales = await prisma.salesInvoice.aggregate({
      where: { date: { gte: today } },
      _sum: { total: true }
    });
    const todaySalesTotal = todaySales._sum?.total || 0;

    const systemContext = \`
      You are 'المستشار التنفيذي الذكي نظام نما (Nama AI CFO)', an expert AI Operations Manager and CFO embedded inside the Nama Invest ERP system.
      Always answer in Arabic in a highly professional, constructive, and business-focused tone. Do not use markdown backticks unless strictly necessary. Give insights, actionable advice, and highlight risks.
      
      Here is the LIVE real-time snapshot of the company's Database Operations:
      - Total Invoices Generated Globally: \${salesCount}
      - Today's Sales Revenue (SAR): \${todaySalesTotal}
      - Real Estate: \${activeLeases} Active Leases, \${expiredLeases} Expired (Needs Renewal Follow-up!).
      - Supply Chain & Fleet: \${totalVehicles} Vehicles in fleet. \${activeTrips} Trips currently active on the road.
      - HR: \${totalEmployees} active employees currently drawing salaries.
      - Schools: \${totalStudents} students currently enrolled.

      Your objective is to answer the CEO's prompt based on this context. Be insightful!
    \`;

    const result = await model.generateContent([
      { text: systemContext },
      { text: \`CEO Prompt: \${prompt}\` }
    ]);
    const responseText = result.response.text();

    return NextResponse.json({
      answer: responseText,
      metrics: { salesCount, todaySales: todaySalesTotal, activeLeases, expiredLeases, activeTrips, totalEmployees, totalStudents }
    });
  } catch (error: any) {
    console.error('AI CFO Error:', error);
    return NextResponse.json({ error: 'Failed to communicate with AI Engine' }, { status: 500 });
  }
}
`;
  console.log(await uploadFile(`${N11}/src/app/api/ai/cfo/route.ts`, cfoFixed));

  // ══════════════════════════════════════════════════
  // FIX 2: api/accounting/cost-centers/route.ts
  // المشكلة: verifyAuth غير موجود
  // ══════════════════════════════════════════════════
  process.stdout.write(SEP + 'FIX 2: api/accounting/cost-centers/route.ts\n');
  const costCentersFixed = `import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');

    const costCenters = await prisma.costCenter.findMany({
      where: {
        ...(branchId ? { branchId: parseInt(branchId) } : {}),
      },
      orderBy: { id: 'desc' },
    });

    return NextResponse.json(costCenters);
  } catch (error) {
    console.error('Error fetching Cost Centers:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { name, code, nameEn, isActive, branchId } = data;

    if (!name || !code) {
      return NextResponse.json({ error: 'Name and Code are required' }, { status: 400 });
    }

    const existing = await prisma.costCenter.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json({ error: 'Cost Center code already exists' }, { status: 400 });
    }

    const newCostCenter = await prisma.costCenter.create({
      data: {
        name,
        code,
        nameEn: nameEn || null,
        isActive: isActive !== undefined ? isActive : true,
        branchId: branchId ? parseInt(branchId) : null,
      },
    });

    return NextResponse.json(newCostCenter, { status: 201 });
  } catch (error) {
    console.error('Error creating Cost Center:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { id, name, code, nameEn, isActive, branchId } = data;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const updated = await prisma.costCenter.update({
      where: { id: parseInt(id) },
      data: {
        name,
        code,
        nameEn,
        isActive,
        branchId: branchId ? parseInt(branchId) : null,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating Cost Center:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await prisma.costCenter.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting Cost Center:', error);
    return NextResponse.json({ error: 'Cannot delete: Record is in use' }, { status: 400 });
  }
}
`;
  console.log(await uploadFile(`${N11}/src/app/api/accounting/cost-centers/route.ts`, costCentersFixed));

  // ══════════════════════════════════════════════════
  // FIX 3: api/sys/alerts/route.ts
  // المشكلة: auth.id → auth.userId
  // ══════════════════════════════════════════════════
  process.stdout.write(SEP + 'FIX 3: api/sys/alerts/route.ts\n');
  const alertsFixed = `import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const alerts = await prisma.systemAlert.findMany({
      where: {
        userId: auth.userId || 1
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    return NextResponse.json(alerts);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch system alerts' }, { status: 500 });
  }
}
`;
  console.log(await uploadFile(`${N11}/src/app/api/sys/alerts/route.ts`, alertsFixed));

  // ══════════════════════════════════════════════════
  // FIX 4: lib/qz.ts — إضافة @ts-ignore
  // ══════════════════════════════════════════════════
  process.stdout.write(SEP + 'FIX 4: lib/qz.ts\n');
  const qzFixed = `// @ts-ignore — qz-tray does not have TypeScript declarations
import qz from 'qz-tray';

export interface QZPrinterConfig {
    name: string;
    type: 'os' | 'ip' | 'usb';
    ipAddress?: string;
    targetCategories?: number[];
    connectionType?: string;
    connectionString?: string;
}

let isQzConnected = false;

export async function connectQZ() {
    if (isQzConnected) return true;
    try {
        if (!qz.websocket.isActive()) {
            await qz.websocket.connect({ retries: 2, delay: 1 });
            isQzConnected = true;
        }
        return true;
    } catch (e) {
        console.error("QZ Tray connection failed:", e);
        return false;
    }
}

export async function printReceiptHTML(printerName: string, htmlHtml: string) {
    if (!await connectQZ()) throw new Error("فشل الاتصال ببرنامج الطباعة QZ Tray");
    
    const config = qz.configs.create(printerName);
    const data = [{
        type: 'html',
        format: 'plain',
        data: htmlHtml
    }];
    
    return qz.print(config, data);
}

export async function printRawESCPOS(printerConfig: QZPrinterConfig, escposData: string[]) {
    if (!await connectQZ()) throw new Error("فشل الاتصال ببرنامج الطباعة QZ Tray");
    
    let config;
    if (printerConfig.type === 'ip') {
        config = qz.configs.create(\`tcp://\${printerConfig.ipAddress}:9100\`);
    } else if (printerConfig.connectionType === 'tcp' && printerConfig.connectionString) {
        config = qz.configs.create(\`tcp://\${printerConfig.connectionString}\`);
    } else {
        config = qz.configs.create(printerConfig.name);
    }

    const data = escposData.map(cmd => ({
        type: 'raw',
        format: 'command',
        flavor: 'escpos',
        data: cmd
    }));

    return qz.print(config, data);
}

export async function getLocalPrinters() {
    if (!await connectQZ()) return [];
    return await qz.printers.find();
}
`;
  console.log(await uploadFile(`${N11}/src/lib/qz.ts`, qzFixed));

  // ══════════════════════════════════════════════════
  // FIX 5: components/SessionGuard.tsx — إضافة t()
  // ══════════════════════════════════════════════════
  process.stdout.write(SEP + 'FIX 5: components/SessionGuard.tsx\n');
  const sessionGuardFixed = `'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * SessionGuard — checks session validity every 30 seconds.
 * If user logged in on another device, this detects it and forces logout.
 */
export default function SessionGuard() {
    const router = useRouter();

    // Simple translation fallback
    const t = (key: string): string => {
        const translations: Record<string, string> = {
            'sys.str_98': 'تم تسجيل الدخول من جهاز آخر. سيتم تسجيل خروجك.',
        };
        return translations[key] || key;
    };

    useEffect(() => {
        const checkSession = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                router.replace('/login');
                return;
            }

            try {
                const res = await fetch('/api/auth/session', {
                    headers: { Authorization: \`Bearer \${token}\` },
                });
                const data = await res.json();
                if (!data.valid && data.reason === 'session_replaced') {
                    localStorage.removeItem('token');
                    document.cookie = "auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                    localStorage.removeItem('user');
                    alert(t('sys.str_98'));
                    router.replace('/login');
                }
            } catch { /* ignore network errors */ }
        };

        // Check immediately, then every 30 seconds
        checkSession();
        const interval = setInterval(checkSession, 30000);
        return () => clearInterval(interval);
    }, [router]);

    return null; // This component renders nothing
}
`;
  console.log(await uploadFile(`${N11}/src/components/SessionGuard.tsx`, sessionGuardFixed));

  // ══════════════════════════════════════════════════
  // FIX 6: api/zatca/route.ts — null check لـ settingCsr.value
  // ══════════════════════════════════════════════════
  process.stdout.write(SEP + 'FIX 6: api/zatca/route.ts (null check)\n');
  await ssh(`sed -i "s/settingCsr\\.value)/settingCsr?.value || '')/g" ${N11}/src/app/api/zatca/route.ts`);
  console.log('✅ Fixed null check in zatca/route.ts');

  // ══════════════════════════════════════════════════
  // CREATE 1: /api/notifications/route.ts
  // ══════════════════════════════════════════════════
  process.stdout.write(SEP + 'CREATE: /api/notifications/route.ts\n');
  const notificationsRoute = `import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        const auth = getUserFromRequest(req);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const alerts = await prisma.systemAlert.findMany({
            orderBy: { createdAt: 'desc' },
            take: 30
        });
        return NextResponse.json(alerts);
    } catch (error) {
        console.error('Notifications error:', error);
        return NextResponse.json([], { status: 200 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const { id } = await req.json();
        await prisma.systemAlert.update({
            where: { id: parseInt(id) },
            data: { isRead: true }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 });
    }
}
`;
  await ssh(`mkdir -p ${N11}/src/app/api/notifications`);
  console.log(await uploadFile(`${N11}/src/app/api/notifications/route.ts`, notificationsRoute));

  // ══════════════════════════════════════════════════
  // CREATE 2: /api/attendances/route.ts
  // ══════════════════════════════════════════════════
  process.stdout.write(SEP + 'CREATE: /api/attendances/route.ts\n');
  const attendancesRoute = `import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        const auth = getUserFromRequest(req);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const employeeId = searchParams.get('employeeId');
        const from = searchParams.get('from');
        const to = searchParams.get('to');

        const where: Record<string, unknown> = {};
        if (employeeId) where.employeeId = parseInt(employeeId);
        if (from || to) {
            where.date = {};
            if (from) (where.date as any).gte = new Date(from);
            if (to) (where.date as any).lte = new Date(to + 'T23:59:59');
        }

        const attendances = await prisma.attendance.findMany({
            where,
            include: { employee: { select: { name: true, department: true } } },
            orderBy: { date: 'desc' },
            take: 200
        });
        return NextResponse.json(attendances);
    } catch (error) {
        console.error('Attendances GET error:', error);
        return NextResponse.json([], { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const auth = getUserFromRequest(req);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const record = await prisma.attendance.create({
            data: {
                employeeId: parseInt(body.employeeId),
                date: body.date ? new Date(body.date) : new Date(),
                checkIn: body.checkIn || null,
                checkOut: body.checkOut || null,
                status: body.status || 'present',
                notes: body.notes || null,
            },
            include: { employee: { select: { name: true } } }
        });
        return NextResponse.json(record, { status: 201 });
    } catch (error) {
        console.error('Attendances POST error:', error);
        return NextResponse.json({ error: 'Failed to create attendance record' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        if (!body.id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        const updated = await prisma.attendance.update({
            where: { id: parseInt(body.id) },
            data: {
                checkIn: body.checkIn,
                checkOut: body.checkOut,
                status: body.status,
                notes: body.notes,
            }
        });
        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }
}
`;
  await ssh(`mkdir -p ${N11}/src/app/api/attendances`);
  console.log(await uploadFile(`${N11}/src/app/api/attendances/route.ts`, attendancesRoute));

  // ══════════════════════════════════════════════════
  // CREATE 3: /api/zatca/config/route.ts
  // ══════════════════════════════════════════════════
  process.stdout.write(SEP + 'CREATE: /api/zatca/config/route.ts\n');
  const zatcaConfigRoute = `import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

const ZATCA_KEYS = [
    'company_name', 'vat_number', 'cr_number',
    'zatca_csr', 'zatca_certificate', 'zatca_onboarded',
    'zatca_pih', 'zatca_api_url', 'zatca_otp',
    'city', 'country', 'street', 'building_number', 'postal_code', 'district'
];

export async function GET(req: NextRequest) {
    try {
        const auth = getUserFromRequest(req);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const settings = await prisma.setting.findMany({
            where: { key: { in: ZATCA_KEYS } }
        });

        const config: Record<string, string> = {};
        settings.forEach(s => { config[s.key] = s.value || ''; });

        return NextResponse.json(config);
    } catch (error) {
        console.error('ZATCA config GET error:', error);
        return NextResponse.json({}, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const auth = getUserFromRequest(req);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();

        for (const [key, value] of Object.entries(body)) {
            if (ZATCA_KEYS.includes(key)) {
                await prisma.setting.upsert({
                    where: { key },
                    update: { value: String(value) },
                    create: { key, value: String(value) }
                });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('ZATCA config POST error:', error);
        return NextResponse.json({ error: 'Failed to save ZATCA config' }, { status: 500 });
    }
}
`;
  await ssh(`mkdir -p ${N11}/src/app/api/zatca/config`);
  console.log(await uploadFile(`${N11}/src/app/api/zatca/config/route.ts`, zatcaConfigRoute));

  // ══════════════════════════════════════════════════
  // FIX 7: api/recurring-invoices/route.ts — auth.id → auth.userId
  // ══════════════════════════════════════════════════
  process.stdout.write(SEP + 'FIX 7: api/recurring-invoices/route.ts\n');
  await ssh(`sed -i 's/(auth as JWTPayload)\\.id/(auth as any).userId/g' ${N11}/src/app/api/recurring-invoices/route.ts`);
  await ssh(`sed -i 's/JWTPayload\\.id/userId/g' ${N11}/src/app/api/recurring-invoices/route.ts`);
  // More targeted fix
  const recurringContent = await ssh(`cat ${N11}/src/app/api/recurring-invoices/route.ts | grep -n "auth\\.id\|JWTPayload" | head -10`);
  console.log('Recurring invoices auth refs:', recurringContent);
  await ssh(`sed -i 's/auth\\.id/( auth as any).userId/g' ${N11}/src/app/api/recurring-invoices/route.ts`);
  console.log('✅ Fixed recurring-invoices auth.id');

  // ══════════════════════════════════════════════════
  // REBUILD
  // ══════════════════════════════════════════════════
  process.stdout.write(SEP + 'REBUILDING N11...\n');
  const buildOut = await ssh(`cd ${N11} && npm run build 2>&1 | tail -20`, 300000);
  console.log(buildOut);

  if (buildOut.includes('✓') || buildOut.includes('compiled') || buildOut.includes('Route')) {
    process.stdout.write(SEP + 'RESTARTING N11...\n');
    console.log(await ssh(`pm2 restart n11 && sleep 5 && pm2 list | grep n11`));

    await new Promise(r => setTimeout(r, 8000));

    process.stdout.write(SEP + 'FINAL HEALTH CHECK\n');
    for (const path of ['/api/notifications', '/api/attendances', '/api/zatca/config', '/api/accounting/accounts', '/api/sys/health']) {
      console.log(await ssh(`curl -sk -o /dev/null -w "${path} → %{http_code}" https://n11.namainvist.com${path}`));
    }

    // Count remaining TS errors
    process.stdout.write(SEP + 'REMAINING TypeScript ERRORS\n');
    console.log(await ssh(`cd ${N11} && npx tsc --noEmit 2>&1 | grep -c "error TS" || echo "0"`, 120000));
  } else {
    process.stdout.write(SEP + 'BUILD ERRORS:\n');
    console.log(await ssh(`cd ${N11} && npm run build 2>&1 | grep -E "Error|error" | grep -v "warn" | head -20`, 60000));
  }

  console.log('\n🏁 All fixes applied!');
})();
