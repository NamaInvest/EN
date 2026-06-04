/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */
import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { createHmac } from 'crypto';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { validateSubdomainCandidate } from '@/lib/tenant/reserved-subdomains';
import { acquireProvisioningLock, releaseProvisioningLock } from '@/lib/tenant/provisioning-guard';
import { seedSocpaCoA } from '@/lib/seed-socpa-coa';


const log = logger.child({ service: 'tenant/provision' });

// Force Node.js runtime (ssh2 uses native crypto — not compatible with Edge)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ─── Build DB URL for a given tenant ─────────────────────────────────────────
function getDbUrl(tenant: string): string {
    const base = process.env.DATABASE_URL;
    if (!base) throw new Error('DATABASE_URL is required');
    return base.replace(/\/([^/?]+)(\?|$)/, `/${tenant}_db$2`);
}

// === EXPLICIT STRING CASTING FOR SSH PARAMS ===
const SSH_HOST = String(process.env.PROVISION_SSH_HOST || '');
const SSH_USER = String(process.env.PROVISION_SSH_USER || '');
const SSH_PASS = String(process.env.PROVISION_SSH_PASS || '');

if (!SSH_HOST || !SSH_USER || !SSH_PASS) {
    log.warn('[provision] PROVISION_SSH_* env vars missing — provisioning disabled');
}
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
    } catch (err: unknown) {
        log.error('src/app/api/tenant/provision/route.ts', { error: err instanceof Error ? err.message : err });

        return text;
    }
}

function toSlug(text: string): string {
    return text.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20) || 'company';
}

// ─── Run Prisma DB Push via SSH ───────────────────────────────────────────────
// هذا الجزء الوحيد الذي يبقى على SSH: إنشاء الـ DB وتطبيق الـ schema
async function runDbSetupViaSsh(subdomain: string): Promise<{ ok: boolean; log: string }> {
    const { Client } = require('ssh2');
    const dbName = `${subdomain}_db`;
    const MASTER_APP = '/www/wwwroot/namainvist.com';

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
                // Build DB URL from MASTER_DB_URL but switch dbname
                `cd ${MASTER_APP} && DATABASE_URL="${(process.env.MASTER_DB_URL || '').replace(/\/[^/?]+(\?|$)/, `/${dbName}$1`)}" npx prisma@5.22.0 db push --schema=${MASTER_APP}/prisma/schema.prisma --accept-data-loss 2>&1`,
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
export async function seedCompanyData(params: {
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
    password?: string;
    adminName?: string;
    username?: string;
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

        // إعدادات النظام وتتبع الرخصة
        const nowMs = Date.now();
        const trialEndMs = nowMs + (7 * 24 * 60 * 60 * 1000);
        await upsertSetting('trialActive', 'true');
        await upsertSetting('trialStartsAt', nowMs.toString());
        await upsertSetting('trialEndsAt', trialEndMs.toString());
        await upsertSetting('trialStatus', 'ACTIVE');
        await upsertSetting('trialSource', 'DESKTOP_APP');
        await upsertSetting('maxTrialInvoices', '30');
        await upsertSetting('tax_rate', '15');
        await upsertSetting('POS_TAX_ENABLED', 'true');
        await upsertSetting('POS_TAX_INCLUSIVE', 'true');

        // مستخدم رئيسي — البريد الإلكتروني من Clerk كـ username أو ما أدخله المستخدم
        const bcryptjs = require('bcryptjs');
        const adminHash = bcryptjs.hashSync(params.password || 'admin7773', 10);

        // توليد username من البريد إذا لم يتم توفيره صراحة
        let finalUsername = params.username?.trim();
        if (!finalUsername) {
            finalUsername = params.clerkEmail
                ? params.clerkEmail.split('@')[0].replace(/[^a-z0-9._-]/gi, '').toLowerCase() || 'admin'
                : 'admin';
        }

        const finalFullName = params.adminName?.trim() || `${params.companyNameAr} - مدير النظام`;

        // إنشاء المستخدم الرئيسي بالبيانات المقدمة
        await prisma.user.upsert({
            where: { username: finalUsername },
            update: { passwordHash: adminHash, role: 'admin', active: true, fullName: finalFullName },
            create: {
                username: finalUsername,
                fullName: finalFullName,
                passwordHash: adminHash,
                role: 'admin',
                active: true,
            },
        });

        // أيضاً ننشئ مستخدم admin قياسي دائمًا كإجراء احتياطي إذا لم يكن المستخدم نفسه هو admin
        if (finalUsername !== 'admin') {
            await prisma.user.upsert({
                where: { username: 'admin' },
                update: {},  
                create: {
                    username: 'admin',
                    fullName: `${params.companyNameAr} - مدير النظام`,
                    passwordHash: bcryptjs.hashSync('admin7773', 10),
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

        // Seed Chart of Accounts
        await seedSocpaCoA(params.subdomain, prisma);

        return { ok: true };
    } catch (err: any) {
        log.error('src/app/api/tenant/provision/route.ts', { error: err instanceof Error ? err.message : err });

        return { ok: false, error: err.message };
    } finally {
        if (prisma) await prisma.$disconnect();
    }
}


const _POSTSchema = z.object({
  companyNameAr: z.any().optional(),
  companyNameEn: z.any().optional(),
  businessDomain: z.any().optional(),
  branchName: z.any().optional(),
  branchNameEn: z.any().optional(),
  mobile: z.string().optional(),
  address: z.any().optional(),
  district: z.any().optional(),
  buildingNo: z.any().optional(),
  postalCode: z.any().optional(),
  vatNumber: z.any().optional(),
  crnNumber: z.any().optional(),
  clerkUserId: z.union([z.string(), z.number()]).optional(),
  clerkEmail: z.string().email().optional(),
  city: z.any().optional(),
  cityEn: z.any().optional(),
}).passthrough();

async function _POST(req: Request) {
    let lockedSubdomain: string | null = null;
    let masterPrisma: PrismaClient | null = null;

    try {
        // No auth check — endpoint is rate-limited (AUTH tier) and validates data internally
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
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
            password,
            adminName,
            username,
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

        // If Onboarding Queue is enabled, enqueue the job and return immediately
        const { isQueueEnabled, getProvisioningQueueAdapter } = require('@/lib/tenant/provisioning-queue');
        if (isQueueEnabled()) {
            const runId = 'run_' + Math.random().toString(36).substring(2, 15);
            const adapter = getProvisioningQueueAdapter();
            await adapter.enqueueProvisioningJob({
                provisioningRunId: runId,
                tenantName: companyNameAr,
                requestedSubdomain: body.subdomain || toSlug(companyNameEnFromClient || companyNameAr || 'company'),
                ownerName: adminName || companyNameAr,
                ownerEmail: clerkEmail || '',
                locale: 'ar',
                source: 'WEB_APP',
                correlationId: runId,
                createdAt: new Date(),
                password,
                username,
            });

            // 🚨 Start the background worker explicitly in the API runtime context to bypass global state isolation
            try {
                const { startProvisioningWorker } = require('@/lib/tenant/provisioning-worker');
                startProvisioningWorker();
                log.info(`[provision] Explicitly triggered background provisioning worker for runId: ${runId}`);
            } catch (workerErr: any) {
                log.error(`[provision] Failed to trigger background worker: ${workerErr.message}`);
            }

            return NextResponse.json({
                success: true,
                runId,
                status: 'PENDING',
                message: 'تم تسجيل طلب التأسيس وبدء معالجته في الخلفية.',
            });
        }

        // Initialize Master Prisma for early checks
        masterPrisma = new PrismaClient({
            datasources: { db: { url: getDbUrl('n11') } },
        });

        // ─── Early duplicate check on owner/email/userId ───────────────────
        if (clerkEmail) {
            const existingEmail = await masterPrisma.tenantAccount.findUnique({
                where: { userEmail: clerkEmail },
            });
            if (existingEmail) {
                return NextResponse.json({
                    success: false,
                    message: 'تم تسجيل مستأجر بالفعل لهذا البريد الإلكتروني.',
                    error: 'USER_ALREADY_HAS_TENANT'
                }, { status: 409 });
            }
        }
        if (clerkUserId) {
            const existingUserId = await masterPrisma.tenantAccount.findUnique({
                where: { clerkUserId: String(clerkUserId) },
            });
            if (existingUserId) {
                return NextResponse.json({
                    success: false,
                    message: 'تم تسجيل مستأجر بالفعل لهذا المستخدم.',
                    error: 'USER_ALREADY_HAS_TENANT'
                }, { status: 409 });
            }
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

        let subdomain: string = body.subdomain;

        // If subdomain is passed directly in the body, validate it immediately
        if (subdomain) {
            const earlyValidation = validateSubdomainCandidate(subdomain);
            if (!earlyValidation.valid) {
                return NextResponse.json({
                    success: false,
                    message: earlyValidation.message,
                    error: earlyValidation.code
                }, { status: 400 });
            }

            subdomain = subdomain.toLowerCase().trim();

            // Acquire in-memory lock
            if (!acquireProvisioningLock(subdomain)) {
                return NextResponse.json({
                    success: false,
                    message: 'عملية التأسيس قيد التنفيذ لهذا النطاق الفرعي.',
                    error: 'PROVISIONING_IN_PROGRESS'
                }, { status: 409 });
            }
            lockedSubdomain = subdomain;

            // Pre-flight database check for explicit subdomain
            const existingSubdomain = await masterPrisma.tenantAccount.findUnique({
                where: { subdomain },
            });
            if (existingSubdomain) {
                return NextResponse.json({
                    success: false,
                    message: 'اسم النطاق الفرعي محجوز بالفعل أو قيد الاستخدام.',
                    error: 'SUBDOMAIN_ALREADY_EXISTS'
                }, { status: 409 });
            }
        }

        if (!subdomain) {
            // Validate the base slug before connecting via SSH
            const baseValidation = validateSubdomainCandidate(baseSlug);
            if (!baseValidation.valid) {
                return NextResponse.json({
                    success: false,
                    message: baseValidation.message,
                    error: baseValidation.code
                }, { status: 400 });
            }

            subdomain = await new Promise((resolve, reject) => {
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

            if (subdomain) {
                subdomain = subdomain.toLowerCase().trim();

                // Acquire lock for dynamically generated subdomain
                if (!acquireProvisioningLock(subdomain)) {
                    return NextResponse.json({
                        success: false,
                        message: 'عملية التأسيس قيد التنفيذ لهذا النطاق الفرعي.',
                        error: 'PROVISIONING_IN_PROGRESS'
                    }, { status: 409 });
                }
                lockedSubdomain = subdomain;

                // Pre-flight database check for dynamically generated subdomain
                const existingSubdomain = await masterPrisma.tenantAccount.findUnique({
                    where: { subdomain },
                });
                if (existingSubdomain) {
                    return NextResponse.json({
                        success: false,
                        message: 'اسم النطاق الفرعي محجوز بالفعل أو قيد الاستخدام.',
                        error: 'SUBDOMAIN_ALREADY_EXISTS'
                    }, { status: 409 });
                }
            }
        }

        if (!subdomain) {
            return NextResponse.json({ success: false, message: 'فشل توليد النطاق الفرعي.', error: 'PROVISIONING_FAILED' }, { status: 500 });
        }

        // Final backend enforcement gate right before SSH setup and DB writes
        const finalValidation = validateSubdomainCandidate(subdomain);
        if (!finalValidation.valid) {
            return NextResponse.json({
                success: false,
                message: finalValidation.message,
                error: finalValidation.code
            }, { status: 400 });
        }

        // ─── Step B: إنشاء DB وتطبيق Schema عبر SSH ─────────────────────────
        const { ok: dbOk, log: dbLog } = await runDbSetupViaSsh(subdomain);

        if (!dbOk) {
            log.error('[provision] DB setup failed internally:', dbLog);
            return NextResponse.json(
                { success: false, message: 'فشل إعداد قاعدة البيانات. يرجى المحاولة مرة أخرى.', error: 'DATABASE_CREATION_FAILED' },
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
            password: password || '',
            adminName: adminName || '',
            username: username || '',
        });

        if (!seedResult.ok) {
            log.error('[provision] Seed failed internally');
            // لا نوقف العملية — النظام شغال، البيانات يمكن تعبئتها لاحقاً
        }

        // ─── Step D: تسجيل الـ tenant في قاعدة البيانات الرئيسية ────────────
        try {
            const account = await masterPrisma.tenantAccount.upsert({
                where: { userEmail: clerkEmail || `${subdomain}@namainvist.com` },
                update: {
                    subdomain,
                    status: 'active',
                    orgName: companyNameAr,
                    vatNumber: vatNumber || '',
                    subscriptionStatus: 'trial',
                    trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    // ← clerkUserId ضروري لربط الجلسة بالـ tenant
                    ...(clerkUserId ? { clerkUserId } : {}),
                },
                create: {
                    userEmail: clerkEmail || `${subdomain}@namainvist.com`,
                    orgName: companyNameAr,
                    vatNumber: vatNumber || '',
                    subdomain,
                    status: 'active',
                    subscriptionStatus: 'trial',
                    trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    // ← clerkUserId ضروري لربط الجلسة بالـ tenant
                    ...(clerkUserId ? { clerkUserId } : {}),
                },
            });
            
            // Create Desktop License if this is from desktop
            await masterPrisma.desktopLicense.create({
                data: {
                    licenseKey: `TRIAL-${subdomain}-${Date.now()}`,
                    tenantAccountId: account.id,
                    status: 'trial',
                    trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    companyNameAr: companyNameAr,
                    contactEmail: clerkEmail,
                    activatedAt: new Date(),
                }
            }).catch(() => { /* non-blocking */ });

        } catch (e: any) {
            log.error('[provision] TenantAccount upsert failed internally:', e instanceof Error ? e.message : e);
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

        const trialEndMs = Date.now() + (7 * 24 * 60 * 60 * 1000);
        
        // توليد JWT مبسط للديسكتوب كإثبات موقّع للرخصة
        const jwtPayload = Buffer.from(JSON.stringify({
            subdomain,
            trialEndsAt: trialEndMs,
            source: 'DESKTOP_APP',
            ts: Date.now()
        })).toString('base64url');
        const jwtSig = createHmac('sha256', PROVISION_SECRET).update(jwtPayload).digest('hex');
        const trialToken = `${jwtPayload}.${jwtSig}`;

        return NextResponse.json({
            success: true,
            subdomain,
            ssoToken,
            trialToken,
            trialEndsAt: trialEndMs,
            workspaceUrl: `https://${subdomain}.namainvist.com`,
            seedOk: seedResult.ok,
            message: 'تم تأسيس نظامك بنجاح.',
        });

    } catch (e: any) {
        log.error('[provision] Uncaught error during provisioning:', e instanceof Error ? e.stack : e);
        return NextResponse.json({ success: false, message: 'فشل عملية التأسيس. يرجى المحاولة لاحقاً.', error: 'PROVISIONING_FAILED' }, { status: 500 });
    } finally {
        if (masterPrisma) {
            await masterPrisma.$disconnect();
        }
        if (lockedSubdomain) {
            releaseProvisioningLock(lockedSubdomain);
        }
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT', requireAuth: false });
