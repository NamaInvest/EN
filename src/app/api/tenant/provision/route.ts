import { NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { PrismaClient } from '@prisma/client';

// Force Node.js runtime (ssh2 uses native crypto — not compatible with Edge)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ─── Build DB URL for a given tenant ─────────────────────────────────────────
function getDbUrl(tenant: string): string {
    const base =
        process.env.DATABASE_URL ||
        'postgresql://n11_db:n11_pass123@localhost:5432/n11_db?schema=public';
    return base.replace(/\/([^/?]+)(\?|$)/, `/${tenant}_db$2`);
}

const SSH_HOST = '46.4.188.170';
const SSH_USER = 'root';
const SSH_PASS = '_ee4SWbxLVfH9b';
const BASE_URL  = process.env.NEXT_PUBLIC_API_URL || 'https://namainvist.com';
const SSO_SECRET = process.env.SSO_SECRET || 'namainvest-sso-2024';
const PROVISION_SECRET = process.env.PROVISION_SECRET || 'namainvest-provision-2024';

function generateSsoToken(): string {
    const payload = Buffer.from(JSON.stringify({
        type: 'sso-auto-login',
        ts: Date.now(),
        exp: Date.now() + 15 * 60 * 1000,
    })).toString('base64url');
    const sig = createHmac('sha256', SSO_SECRET).update(payload).digest('hex');
    return `${payload}:${sig}`;
}

async function translateArToEn(text: string): Promise<string> {
    if (!text) return '';
    try {
        const res = await fetch(
            `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ar&tl=en&dt=t&q=${encodeURIComponent(text)}`,
            { signal: AbortSignal.timeout(5000) }
        );
        const data = await res.json();
        return data?.[0]?.[0]?.[0] || text;
    } catch {
        return text;
    }
}

function toSlug(text: string): string {
    return text.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20) || 'company';
}

// ─── Run Prisma DB Push via SSH ───────────────────────────────────────────────
// هذا الجزء الوحيد الذي يبقى على SSH: إنشاء الـ DB وتطبيق الـ schema
async function runDbSetupViaSsh(subdomain: string): Promise<{ ok: boolean; log: string }> {
    const mod = 'ss' + 'h2';
    const { Client } = require(mod);
    const dbName = `${subdomain}_db`;
    const MASTER_APP = '/www/wwwroot/n11.namainvist.com';

    return new Promise((resolve) => {
        const conn = new Client();
        let log = '';

        conn.on('ready', () => {
            // الخطوة 1: إنشاء DB + منح صلاحيات (باستخدام postgres superuser عبر TCP)
            const createDbCmd = [
                `PGPASSWORD="$(sudo -u postgres psql -h localhost -p 5432 -t -c "SELECT 'connected';"  2>/dev/null && echo ok)"`,
                `sudo -u postgres psql -h localhost -p 5432 -U postgres -c "CREATE DATABASE ${dbName};" 2>/dev/null || echo "DB already exists"`,
                `sudo -u postgres psql -h localhost -p 5432 -U postgres -c "ALTER DATABASE ${dbName} OWNER TO n11_db;" 2>/dev/null || true`,
                `sudo -u postgres psql -h localhost -p 5432 -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE ${dbName} TO n11_db;" 2>/dev/null || true`,
                // الخطوة 2: Prisma db push
                `echo "[PRISMA_PUSH]"`,
                `cd ${MASTER_APP} && DATABASE_URL="postgresql://n11_db:n11_pass123@localhost:5432/${dbName}?schema=public" npx prisma db push --schema=${MASTER_APP}/prisma/schema.prisma --accept-data-loss 2>&1`,
                `echo "[DONE]"`,
            ].join('\n');

            conn.exec(createDbCmd, (err: any, stream: any) => {
                if (err) {
                    conn.end();
                    return resolve({ ok: false, log: `SSH exec error: ${err.message}` });
                }
                stream.on('data', (d: Buffer) => { log += d.toString(); });
                stream.stderr.on('data', (d: Buffer) => { log += d.toString(); });
                stream.on('close', () => {
                    conn.end();
                    const ok = log.includes('[DONE]') && !log.includes('Error:');
                    resolve({ ok, log });
                });
            });
        });

        conn.on('error', (err: Error) => {
            resolve({ ok: false, log: `SSH connection error: ${err.message}` });
        });

        conn.connect({
            host: SSH_HOST,
            port: 22,
            username: SSH_USER,
            password: SSH_PASS,
            readyTimeout: 20000,
        });
    });
}

// ─── Seed company data directly via Prisma (no SSH) ──────────────────────────
async function seedCompanyData(params: {
    subdomain: string;
    companyNameAr: string;
    companyNameEn: string;
    vatNumber: string;
    crnNumber: string;
    mobile: string;
    city: string;
    district: string;
    address: string;
    buildingNo: string;
    postalCode: string;
    businessDomain: string;
    branchName: string;
    zatcaBranchNameEn: string;
    zatcaCityEn: string;
    clerkEmail: string;  // ← البريد الإلكتروني للمستخدم الرئيسي
}): Promise<{ ok: boolean; error?: string }> {
    let prisma: PrismaClient | null = null;
    try {
        const dbUrl = getDbUrl(params.subdomain);
        prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });

        async function upsertSetting(key: string, value: string) {
            if (!value && value !== '0') return;
            await prisma!.setting.upsert({
                where: { key },
                update: { value },
                create: { key, value },
            });
        }

        // بيانات المنشأة
        await upsertSetting('company_name', params.companyNameAr);
        await upsertSetting('company_name_en', params.companyNameEn);
        await upsertSetting('tax_number', params.vatNumber);
        await upsertSetting('zatca_crn', params.crnNumber);
        await upsertSetting('company_phone', params.mobile);
        await upsertSetting('company_address', `${params.city} ${params.district} ${params.address} ${params.buildingNo}`.trim());
        await upsertSetting('posFooterText', `Thank you for visiting ${params.companyNameEn || params.companyNameAr}`);
        await upsertSetting('zatca_industry', params.businessDomain);
        await upsertSetting('branch_name_en', params.zatcaBranchNameEn);
        await upsertSetting('zatca_city_en', params.zatcaCityEn);
        await upsertSetting('zatca_city', params.city);
        await upsertSetting('zatca_district', params.district);
        await upsertSetting('zatca_street', params.address);
        await upsertSetting('zatca_building', params.buildingNo);
        await upsertSetting('zatca_postal_code', params.postalCode);

        // إعدادات النظام
        const trialEndMs = Date.now() + (5 * 24 * 60 * 60 * 1000);
        await upsertSetting('trialActive', 'true');
        await upsertSetting('trialEndsAt', trialEndMs.toString());
        await upsertSetting('maxTrialInvoices', '30');
        await upsertSetting('tax_rate', '15');
        await upsertSetting('POS_TAX_ENABLED', 'true');
        await upsertSetting('POS_TAX_INCLUSIVE', 'true');

        // مستخدم رئيسي — البريد الإلكتروني من Clerk كـ username
        const bcryptjs = require('bcryptjs');
        const adminHash = bcryptjs.hashSync('admin', 10);

        // توليد username من البريد: user@example.com → user
        const emailUsername = params.clerkEmail
            ? params.clerkEmail.split('@')[0].replace(/[^a-z0-9._-]/gi, '').toLowerCase() || 'admin'
            : 'admin';

        // إنشاء المستخدم الرئيسي بالبريد كـ username (مع admin كـ fallback إضافي)
        await prisma.user.upsert({
            where: { username: emailUsername },
            update: { passwordHash: adminHash, role: 'admin', active: true },
            create: {
                username: emailUsername,
                fullName: `${params.companyNameAr} - مدير النظام`,
                passwordHash: adminHash,
                role: 'admin',
                active: true,
            },
        });

        // أيضاً ننشئ مستخدم admin قياسي إذا لم يكن emailUsername هو admin
        if (emailUsername !== 'admin') {
            await prisma.user.upsert({
                where: { username: 'admin' },
                update: {},  // لا نغير إذا كان موجوداً
                create: {
                    username: 'admin',
                    fullName: `${params.companyNameAr} - مدير النظام`,
                    passwordHash: adminHash,
                    role: 'admin',
                    active: true,
                },
            }).catch(() => { /* قد يكون موجوداً */ });
        }

        // الكيانات الأساسية (إذا لم تكن موجودة)

        // إنشاء سجل الشركة أولاً (مطلوب لـ Branch FK)
        const existingCompany = await prisma.company.findFirst();
        const company = existingCompany ?? await prisma.company.create({
            data: {
                name: params.companyNameAr,
                nameEn: params.companyNameEn || params.companyNameAr,
                taxNumber: params.vatNumber || null,
                address: `${params.city} ${params.address}`.trim() || null,
            },
        });

        const existingBranch = await prisma.branch.findFirst();
        if (!existingBranch) {
            const defaultBranch = await prisma.branch.create({
                data: {
                    companyId: company.id,
                    name: params.branchName || 'الفرع الرئيسي',
                    nameEn: 'Main Branch',
                    address: `${params.city} ${params.address}`.trim() || null,
                    isActive: true,
                },
            });

            await prisma.stock.create({
                data: {
                    name: 'المستودع الرئيسي',
                    address: params.address || null,
                    branchId: defaultBranch.id,
                },
            });

            await prisma.customer.create({
                data: {
                    name: 'عميل نقدي',
                    phone: '0000000000',
                    active: true,
                },
            });

            await prisma.unit.createMany({
                data: [
                    { name: 'حبة' },
                    { name: 'كرتون' },
                ],
                skipDuplicates: true,
            });
        }

        return { ok: true };
    } catch (err: any) {
        return { ok: false, error: err.message };
    } finally {
        if (prisma) await prisma.$disconnect();
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            companyNameAr,
            companyNameEn: companyNameEnFromClient,
            businessDomain,
            branchName,
            branchNameEn: branchNameEnFromClient,
            mobile,
            address,
            district,
            buildingNo,
            postalCode,
            vatNumber,
            crnNumber,
            clerkUserId,
            clerkEmail,
            city,
            cityEn: cityEnFromClient,
        } = body;

        if (!companyNameAr || !city || !mobile) {
            return NextResponse.json(
                { success: false, message: 'الرجاء تعبئة جميع الحقول المطلوبة.' },
                { status: 400 }
            );
        }

        if (vatNumber && !/^3\d{13}3$/.test(vatNumber)) {
            return NextResponse.json(
                { success: false, message: 'الرقم الضريبي يجب أن يتكون من 15 رقماً (يبدأ بـ 3 وينتهي بـ 3).' },
                { status: 400 }
            );
        }
        if (crnNumber && !/^7\d{9}$/.test(crnNumber)) {
            return NextResponse.json(
                { success: false, message: 'السجل التجاري يجب أن يتكون من 10 أرقام (يبدأ بـ 7).' },
                { status: 400 }
            );
        }

        // ─── ترجمة الأسماء (يفضل القيم القادمة من الـ form، والترجمة كـ fallback) ──────
        const companyNameEn     = companyNameEnFromClient?.trim() || await translateArToEn(companyNameAr);
        const zatcaIndustry     = businessDomain || '';
        const zatcaBranchNameEn = branchNameEnFromClient?.trim() || await translateArToEn(branchName || '');
        const zatcaCityEn       = cityEnFromClient?.trim() || await translateArToEn(city || '');
        const baseSlug          = toSlug(companyNameEn);

        // ─── Step A: إيجاد subdomain فريد عبر SSH ─────────────────────────────
        const mod = 'ss' + 'h2';
        const { Client } = require(mod);

        const subdomain: string = await new Promise((resolve, reject) => {
            const conn = new Client();
            conn.on('ready', () => {
                const checkCmd = [
                    `BASE="${baseSlug}"`,
                    'SLUG="$BASE"',
                    'COUNTER=2',
                    'while [ -d "/www/wwwroot/$SLUG.namainvist.com" ]; do',
                    '  SLUG="$BASE$COUNTER"',
                    '  COUNTER=$((COUNTER + 1))',
                    'done',
                    'echo "$SLUG"',
                ].join('\n');

                conn.exec(checkCmd, (err: any, stream: any) => {
                    if (err) { conn.end(); return reject(err); }
                    let out = '';
                    stream.on('data', (d: Buffer) => out += d.toString());
                    stream.on('close', () => { conn.end(); resolve(out.trim()); });
                });
            });
            conn.on('error', reject);
            conn.connect({ host: SSH_HOST, port: 22, username: SSH_USER, password: SSH_PASS, readyTimeout: 15000 });
        });

        if (!subdomain) {
            return NextResponse.json({ success: false, message: 'فشل توليد النطاق الفرعي.' }, { status: 500 });
        }

        // ─── Step B: إنشاء DB وتطبيق Schema عبر SSH ─────────────────────────
        const { ok: dbOk, log: dbLog } = await runDbSetupViaSsh(subdomain);

        if (!dbOk) {
            console.error('[provision] DB setup failed:', dbLog);
            return NextResponse.json(
                { success: false, message: 'فشل إعداد قاعدة البيانات. يرجى المحاولة مرة أخرى.', debug: dbLog },
                { status: 500 }
            );
        }

        // ─── Step C: زرع بيانات الشركة مباشرة عبر Prisma (بدون SSH) ──────────
        const seedResult = await seedCompanyData({
            subdomain,
            companyNameAr,
            companyNameEn,
            vatNumber: vatNumber || '',
            crnNumber: crnNumber || '',
            mobile: mobile || '',
            city: city || '',
            district: district || '',
            address: address || '',
            buildingNo: buildingNo || '',
            postalCode: postalCode || '',
            businessDomain: zatcaIndustry,
            branchName: branchName || 'الفرع الرئيسي',
            zatcaBranchNameEn,
            zatcaCityEn,
            clerkEmail: clerkEmail || '',  // ← البريد الإلكتروني للمستخدم الرئيسي
        });

        if (!seedResult.ok) {
            console.error('[provision] Seed failed:', seedResult.error);
            // لا نوقف العملية — النظام شغال، البيانات يمكن تعبئتها لاحقاً
        }

        // ─── Step D: تسجيل الـ tenant في قاعدة البيانات الرئيسية ────────────
        // استخدام PrismaClient مباشر على n11_db (الـ master DB)
        let masterPrisma: PrismaClient | null = null;
        try {
            masterPrisma = new PrismaClient({
                datasources: { db: { url: getDbUrl('n11') } },
            });
            await masterPrisma.tenantAccount.upsert({
                where: { userEmail: clerkEmail || `${subdomain}@namainvist.com` },
                update: { subdomain, status: 'active', orgName: companyNameAr, vatNumber: vatNumber || '' },
                create: {
                    userEmail: clerkEmail || `${subdomain}@namainvist.com`,
                    orgName: companyNameAr,
                    vatNumber: vatNumber || '',
                    subdomain,
                    status: 'active',
                },
            });
        } catch (e) {
            console.error('[provision] TenantAccount upsert failed:', e);
        } finally {
            if (masterPrisma) await masterPrisma.$disconnect();
        }

        // ─── Step E: إرجاع الاستجابة للمتصفح ────────────────────────────────
        const ssoToken = generateSsoToken();

        if (clerkUserId) {
            fetch(`${BASE_URL}/api/tenant/check-status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: clerkUserId, subdomain }),
            }).catch(() => { /* non-blocking */ });
        }

        return NextResponse.json({
            success: true,
            subdomain,
            ssoToken,
            seedOk: seedResult.ok,
            message: 'تم تأسيس نظامك بنجاح.',
        });

    } catch (e: any) {
        return NextResponse.json({ success: false, message: 'خطأ عام: ' + e.message }, { status: 500 });
    }
}
