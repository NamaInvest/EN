import { NextResponse } from 'next/server';
import { createHmac } from 'crypto';

// Force Node.js runtime (ssh2 uses native crypto — not compatible with Edge)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';


const SSH_HOST = '46.4.188.170';
const SSH_USER = 'root';
const SSH_PASS = '_ee4SWbxLVfH9b';
const BASE_URL  = process.env.NEXT_PUBLIC_API_URL || 'https://namainvist.com';
const SSO_SECRET = process.env.SSO_SECRET || 'namainvest-sso-2024';

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

export async function POST(req: Request) {
    const mod = 'ss' + 'h2';
    const { Client } = require(mod);
    try {
        const body = await req.json();
        const {
            companyNameAr,
            businessDomain,
            branchName,
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

        const companyNameEn      = await translateArToEn(companyNameAr);
        const zatcaIndustry      = businessDomain || '';
        const zatcaBranchNameEn  = await translateArToEn(branchName || '');
        const zatcaCityEn        = await translateArToEn(city || '');
        const baseSlug           = toSlug(companyNameEn);

        const pubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '';
        const secKey = process.env.CLERK_SECRET_KEY || '';

        // ─── inject_settings.js content ───────────────────────────────────
        const injectSettingsJs = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function upsertSetting(key, value) {
    if (value === undefined || value === null || value === '') return;
    await prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) }
    });
}

async function run() {
    await upsertSetting('companyNameAr', ${JSON.stringify(companyNameAr)});
    await upsertSetting('companyNameEn', ${JSON.stringify(companyNameEn)});
    await upsertSetting('vatNumber',     ${JSON.stringify(vatNumber || '')});
    await upsertSetting('crNumber',      ${JSON.stringify(crnNumber || '')});
    await upsertSetting('mobile',        ${JSON.stringify(mobile || '')});
    await upsertSetting('address',       ${JSON.stringify(`${city || ''} ${district || ''} ${address || ''} ${buildingNo || ''}`.trim())});
    await upsertSetting('posFooterText', ${JSON.stringify(`Thank you for visiting ${companyNameEn}`)});
    await upsertSetting('zatcaIndustry',     ${JSON.stringify(zatcaIndustry)});
    await upsertSetting('zatcaBranchNameEn', ${JSON.stringify(zatcaBranchNameEn)});
    await upsertSetting('zatcaCityEn',       ${JSON.stringify(zatcaCityEn)});
    await upsertSetting('zatcaCityAr',       ${JSON.stringify(city || '')});
    await upsertSetting('zatcaDistrict',     ${JSON.stringify(district || '')});
    await upsertSetting('zatcaStreet',       ${JSON.stringify(address || '')});
    await upsertSetting('zatcaBuildingNo',   ${JSON.stringify(buildingNo || '')});
    await upsertSetting('zatcaPostalCode',   ${JSON.stringify(postalCode || '')});

    const trialEndMs = Date.now() + (5 * 24 * 60 * 60 * 1000);
    await upsertSetting('trialActive',      'true');
    await upsertSetting('trialEndsAt',      trialEndMs.toString());
    await upsertSetting('maxTrialInvoices', '30');

    const bcrypt = require('bcryptjs');
    const adminHash = bcrypt.hashSync('admin', 10);
    await prisma.user.upsert({
        where:  { username: 'admin' },
        update: { passwordHash: adminHash, role: 'admin', active: true },
        create: {
            username:     'admin',
            fullName:     ${JSON.stringify(companyNameAr + ' - مدير النظام')},
            passwordHash: adminHash,
            role:         'admin',
            active:       true
        }
    });

    console.log('Settings Injected Successfully!');
}
run().catch(console.error).finally(() => prisma.$disconnect());
`.trim();

        // ─── SSH Orchestration ─────────────────────────────────────────────
        return new Promise<NextResponse>((resolve) => {
            const conn = new Client();

            conn.on('ready', () => {
                try {
                    // Step 1: Find unique subdomain
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
                        if (err) {
                            conn.end();
                            return resolve(NextResponse.json({ success: false, message: 'فشل الاتصال بالخادم.' }, { status: 500 }));
                        }

                        let subdomain = '';
                        stream.on('data', (d: Buffer) => subdomain += d.toString());
                        stream.on('close', () => {
                            subdomain = subdomain.trim();
                            if (!subdomain) {
                                conn.end();
                                return resolve(NextResponse.json({ success: false, message: 'فشل توليد النطاق الفرعي.' }, { status: 500 }));
                            }

                            const domainUrl  = `${subdomain}.namainvist.com`;
                            const dbName     = `${subdomain}_db`;
                            const TARGET_DIR = `/www/wwwroot/${domainUrl}`;

                            // ══════════════════════════════════════════════════════
                            // TRUE MULTI-TENANT PROVISIONING
                            // ──────────────────────────────────────────────────────
                            // بدلاً من نسخ كامل الـ Next.js app وبنائه (15 دقيقة):
                            //  1. إنشاء DB جديد                     (~2 ثانية)
                            //  2. Prisma DB Push (schema فقط)        (~10 ثانية)
                            //  3. حقن بيانات الشركة (Seed)           (~5 ثانية)
                            //  4. إضافة Nginx vhost → نفس التطبيق   (~3 ثانية)
                            //  5. middleware يوجّه الـ subdomain      (0 ثانية)
                            // المجموع: ~30 ثانية بدلاً من 15 دقيقة!
                            // ══════════════════════════════════════════════════════
                            const MASTER_APP = '/www/wwwroot/n11.namainvist.com';
                            const MASTER_PORT = '3500'; // n11 يخدم كل الـ tenants

                            const scriptLines = [
                                '#!/bin/bash',
                                'set -e',
                                `DOMAIN="${domainUrl}"`,
                                `SUBDOMAIN="${subdomain}"`,
                                `DB_NAME="${dbName}"`,
                                `MASTER_APP="${MASTER_APP}"`,
                                `MASTER_PORT="${MASTER_PORT}"`,
                                '',
                                'NGINX_VHOST="/www/server/panel/vhost/nginx"',
                                'AAPANEL_NGINX="/www/server/nginx/sbin/nginx"',
                                'NGINX_CONF="/www/server/nginx/conf/nginx.conf"',
                                '',
                                'echo "[1] Creating PostgreSQL database..."',
                                `sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || echo "DB already exists"`,
                                `sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO postgres;" 2>/dev/null || true`,
                                '',
                                'echo "[2] Running Prisma schema push (DB_NAME=${DB_NAME})..."',
                                // نستخدم DATABASE_URL مؤقتاً للـ prisma push
                                `DATABASE_URL="postgresql://postgres:RootPassNama123@localhost:5432/$DB_NAME?schema=public" npx --prefix $MASTER_APP prisma db push --schema=$MASTER_APP/prisma/schema.prisma --accept-data-loss`,
                                '',
                                'echo "[3] Injecting company settings..."',
                                `cat > /tmp/inject_${subdomain}.js << 'JSEOF'`,
                                injectSettingsJs,
                                'JSEOF',
                                `DATABASE_URL="postgresql://postgres:RootPassNama123@localhost:5432/$DB_NAME?schema=public" node /tmp/inject_${subdomain}.js`,
                                `rm -f /tmp/inject_${subdomain}.js`,
                                '',
                                'echo "[4] Writing Nginx vhost (→ same app on port ${MASTER_PORT})..."',
                                'mkdir -p "$NGINX_VHOST/well-known"',
                                `echo 'location /.well-known/ { root $MASTER_APP; }' > "$NGINX_VHOST/well-known/${subdomain}.conf"`,
                                '',
                                `cat > "$NGINX_VHOST/$DOMAIN.conf" << 'NGINXEOF'`,
                                'server {',
                                '    listen 80;',
                                '    listen 443 ssl http2;',
                                `    server_name ${domainUrl};`,
                                '',
                                '    ssl_certificate    /www/server/panel/vhost/cert/n1/fullchain.pem;',
                                '    ssl_certificate_key    /www/server/panel/vhost/cert/n1/privkey.pem;',
                                '    ssl_protocols TLSv1.1 TLSv1.2 TLSv1.3;',
                                '    ssl_ciphers EECDH+CHACHA20:EECDH+CHACHA20-draft:EECDH+AES128:RSA+AES128:EECDH+AES256:RSA+AES256:!MD5;',
                                '    ssl_prefer_server_ciphers on;',
                                '    ssl_session_cache shared:SSL:10m;',
                                '    ssl_session_timeout 10m;',
                                '    error_page 497 https://$host$request_uri;',
                                '',
                                `    include /www/server/panel/vhost/nginx/well-known/${subdomain}.conf;`,
                                '',
                                '    location ~ ^/(\\.user.ini|\\.htaccess|\\.git|\\.env|node_modules) { return 404; }',
                                '',
                                '    location / {',
                                // ← كل الـ subdomains تذهب لنفس التطبيق (n11 port 3500)
                                // middleware يقرأ Host header ويضع x-tenant تلقائياً
                                `        proxy_pass http://127.0.0.1:${MASTER_PORT};`,
                                '        proxy_set_header Host $host;',
                                '        proxy_set_header X-Real-IP $remote_addr;',
                                '        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;',
                                '        proxy_set_header REMOTE-HOST $remote_addr;',
                                '        proxy_no_cache 1;',
                                '        proxy_cache_bypass 1;',
                                '        proxy_connect_timeout 30s;',
                                '        proxy_read_timeout 86400s;',
                                '        proxy_send_timeout 30s;',
                                '        proxy_http_version 1.1;',
                                '        proxy_set_header Upgrade $http_upgrade;',
                                '        proxy_set_header Connection "upgrade";',
                                '    }',
                                '',
                                `    access_log  /www/wwwlogs/${subdomain}.log;`,
                                `    error_log   /www/wwwlogs/${subdomain}.error.log;`,
                                '}',
                                'NGINXEOF',
                                '',
                                'echo "[5] Reloading Nginx..."',
                                '$AAPANEL_NGINX -t -c $NGINX_CONF 2>&1 && $AAPANEL_NGINX -s reload -c $NGINX_CONF',
                                '',
                                `echo "[DONE] Tenant '${subdomain}' provisioned → routes to n11 app on port ${MASTER_PORT}"`,
                            ];


                            const orchScript = scriptLines.join('\n');
                            const escaped = orchScript.replace(/'/g, "'\\''");

                            conn.exec(`nohup bash -c '${escaped}' > /tmp/provision_${subdomain}.log 2>&1 &`, (e2: any, s2: any) => {
                                s2?.resume();
                                conn.end();
                                if (e2) {
                                    return resolve(NextResponse.json({ success: false, message: 'فشل إطلاق سكربت التأسيس.' }, { status: 500 }));
                                }

                                if (clerkUserId) {
                                    fetch(`${BASE_URL}/api/tenant/check-status`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ userId: clerkUserId, subdomain }),
                                    }).catch(() => { /* non-blocking */ });
                                }

                                resolve(NextResponse.json({
                                    success: true,
                                    subdomain,
                                    ssoToken: generateSsoToken(),
                                    message: 'بدأت عملية التأسيس.',
                                }));
                            });
                        });
                    });

                } catch (jsErr: any) {
                    conn.end();
                    resolve(NextResponse.json({ success: false, message: 'خطأ داخلي: ' + jsErr.message }, { status: 500 }));
                }
            }).on('error', (err: Error) => {
                resolve(NextResponse.json({ success: false, message: 'فشل الاتصال بالخادم: ' + err.message }, { status: 500 }));
            }).connect({
                host: SSH_HOST,
                port: 22,
                username: SSH_USER,
                password: SSH_PASS,
                readyTimeout: 15000,
            });
        });

    } catch (e: any) {
        return NextResponse.json({ success: false, message: 'خطأ عام: ' + e.message }, { status: 500 });
    }
}
