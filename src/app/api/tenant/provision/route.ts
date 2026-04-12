import { NextResponse } from 'next/server';
import { Client } from 'ssh2';

const SSH_HOST = '46.4.188.170';
const SSH_USER = 'root';
const SSH_PASS = '_ee4SWbxLVfH9b';

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

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            subdomain,
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
            clerkEmail,
            city
        } = body;

        // ─── Required fields ───────────────────────────────────────────
        if (!subdomain || !companyNameAr || !vatNumber || !crnNumber) {
            return NextResponse.json({ success: false, message: 'الرجاء تعبئة جميع الحقول المطلوبة.' }, { status: 400 });
        }

        // ─── Backend Validation (Cache-proof) ──────────────────────────
        if (!/^[a-z0-9]+$/.test(subdomain)) {
            return NextResponse.json({ success: false, message: 'اسم الموقع يجب أن يحتوي فقط على أحرف إنجليزية صغيرة وأرقام.' }, { status: 400 });
        }
        if (!/^3\d{13}3$/.test(vatNumber)) {
            return NextResponse.json({ success: false, message: 'الرقم الضريبي يجب أن يتكون من 15 رقماً بالضبط، ويبدأ بـ 3 وينتهي بـ 3.' }, { status: 400 });
        }
        if (!/^7\d{9}$/.test(crnNumber)) {
            return NextResponse.json({ success: false, message: 'السجل التجاري يجب أن يتكون من 10 أرقام بالضبط، ويبدأ برقم 7.' }, { status: 400 });
        }

        const domainUrl = `${subdomain}.namainvist.com`;
        const dbName = `${subdomain}_db`;
        const TARGET_DIR = `/www/wwwroot/${domainUrl}`;

        // ─── Auto-Translate Arabic → English ──────────────────────────
        const companyNameEn    = await translateArToEn(companyNameAr);
        const zatcaIndustry    = await translateArToEn(businessDomain || '');
        const zatcaBranchNameEn = await translateArToEn(branchName || '');
        const zatcaCityEn      = await translateArToEn(city || '');

        const pubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '';
        const secKey = process.env.CLERK_SECRET_KEY || '';

        // ─── Build inject_settings.js content separately (no heredoc collision) ───
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
    await upsertSetting('vatNumber',     ${JSON.stringify(vatNumber)});
    await upsertSetting('crNumber',      ${JSON.stringify(crnNumber)});
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
    await upsertSetting('trialActive',       'true');
    await upsertSetting('trialEndsAt',       trialEndMs.toString());
    await upsertSetting('maxTrialInvoices',  '30');

    ${clerkEmail ? `
    await prisma.user.upsert({
        where:  { username: ${JSON.stringify(clerkEmail)} },
        update: { role: 'admin', active: true },
        create: {
            username:     ${JSON.stringify(clerkEmail)},
            fullName:     ${JSON.stringify(companyNameAr + ' Admin')},
            passwordHash: 'clerk_managed_owner',
            role:         'admin',
            active:       true
        }
    });` : ''}

    console.log('Settings Injected Successfully!');
}
run().catch(console.error).finally(() => prisma.$disconnect());
`.trim();

        // ─── SSH Orchestration ─────────────────────────────────────────
        return new Promise<NextResponse>((resolve) => {
            const conn = new Client();

            conn.on('ready', () => {

                // Step 1: Check domain availability first (synchronous SSH check)
                conn.exec(`[ -d "${TARGET_DIR}" ] && echo "TAKEN" || echo "FREE"`, (err, stream) => {
                    if (err) {
                        conn.end();
                        return resolve(NextResponse.json({ success: false, message: 'فشل الاتصال بالخادم.' }, { status: 500 }));
                    }

                    let result = '';
                    stream.on('data', (d: Buffer) => result += d.toString());
                    stream.on('close', () => {
                        if (result.trim() === 'TAKEN') {
                            conn.end();
                            return resolve(NextResponse.json({ success: false, message: 'عفواً، هذا النطاق الفرعي محجوز مسبقاً، الرجاء اختيار اسم آخر.' }, { status: 400 }));
                        }

                        // Step 2: Launch the full provisioning script in background
                        const orchScript = `#!/bin/bash
DOMAIN="${domainUrl}"
SUBDOMAIN="${subdomain}"
DB_NAME="${dbName}"
TARGET_DIR="${TARGET_DIR}"
MASTER_DIR="/www/wwwroot/n1.namainvist.com"

echo "[1] Discovering next available port..."
USED_PORTS=$(for d in /www/wwwroot/*/; do [ -f "$d/.env" ] && grep "^PORT=" "$d/.env" | cut -d= -f2; done | sort -nu)
NEXT_PORT=3013
while echo "$USED_PORTS" | grep -qx "$NEXT_PORT"; do
  NEXT_PORT=$((NEXT_PORT + 1))
done
echo "Selected PORT: $NEXT_PORT"

echo "[2] Setting up PostgreSQL..."
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO postgres;" 2>/dev/null || true

echo "[3] Cloning master N1..."
cp -r "$MASTER_DIR" "$TARGET_DIR"

echo "[4] Writing .env..."
cat > "$TARGET_DIR/.env" << 'ENVEOF'
DATABASE_URL="postgresql://postgres:RootPassNama123@localhost:5432/${dbName}?schema=public"
NEXT_PUBLIC_API_URL="https://${domainUrl}"
PORT=__PORT__
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="${pubKey}"
CLERK_SECRET_KEY="${secKey}"
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
ENVEOF
sed -i "s/__PORT__/$NEXT_PORT/" "$TARGET_DIR/.env"

echo "[5] Prisma DB Push..."
cd "$TARGET_DIR"
npx prisma db push --accept-data-loss

echo "[6] Injecting company settings..."
cat > "$TARGET_DIR/inject_settings.js" << 'JSEOF'
${injectSettingsJs}
JSEOF
node "$TARGET_DIR/inject_settings.js"

echo "[7] Building Next.js..."
rm -rf .next
npm run build

echo "[8] Starting PM2..."
pm2 delete "$SUBDOMAIN" 2>/dev/null || true
pm2 start node_modules/next/dist/bin/next --name "$SUBDOMAIN" -- start -p $NEXT_PORT
pm2 save

echo "[9] Configuring Nginx..."
cat > "/etc/nginx/sites-available/$DOMAIN" << NGINXEOF
server {
    listen 80;
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    ssl_certificate /etc/ssl/namainvist/origin.crt;
    ssl_certificate_key /etc/ssl/namainvist/origin.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    location / {
        proxy_pass http://localhost:$NEXT_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\$host;
        proxy_cache_bypass \\$http_upgrade;
        proxy_set_header X-Real-IP \\$remote_addr;
        proxy_set_header X-Forwarded-For \\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\$scheme;
    }
}
NGINXEOF
ln -sf "/etc/nginx/sites-available/$DOMAIN" "/etc/nginx/sites-enabled/"
nginx -t && systemctl reload nginx

echo "[DONE] Provisioning complete for $DOMAIN on port $NEXT_PORT"
`;

                        const escaped = orchScript.replace(/'/g, "'\\''");
                        conn.exec(`nohup bash -c '${escaped}' > /tmp/provision_${subdomain}.log 2>&1 &`, (e2) => {
                            conn.end();
                            if (e2) {
                                return resolve(NextResponse.json({ success: false, message: 'فشل إطلاق سكربت التأسيس.' }, { status: 500 }));
                            }
                            resolve(NextResponse.json({ success: true, message: 'بدأت عملية التأسيس.' }));
                        });
                    });
                });
            }).on('error', (err: Error) => {
                resolve(NextResponse.json({ success: false, message: 'فشل الاتصال بالخادم: ' + err.message }, { status: 500 }));
            }).connect({
                host: SSH_HOST,
                port: 22,
                username: SSH_USER,
                password: SSH_PASS,
                readyTimeout: 15000
            });
        });

    } catch (e: any) {
        return NextResponse.json({ success: false, message: 'خطأ عام: ' + e.message }, { status: 500 });
    }
}
