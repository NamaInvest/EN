const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    // Write a pass-through check-status for main-site (never called directly by middleware anymore)
    const passThroughCode = `import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// هذا الملف في main-site — الـ middleware يستدعي saas-app مباشرة
// هذا الـ route غير مستخدم لكن يجب أن يكون موجوداً لإتمام البناء
export async function GET() {
    return NextResponse.json({ provisioned: false, note: 'use saas-app endpoint' });
}

export async function POST() {
    return NextResponse.json({ success: false, note: 'use saas-app endpoint' });
}
`;
    conn.exec(
        `cat > /www/wwwroot/namainvist.com/src/app/api/tenant/check-status/route.ts << 'ENDOFFILE'\n${passThroughCode}\nENDOFFILE`,
        (err, stream) => {
            stream.on('data', d => process.stdout.write(d.toString()));
            stream.on('close', () => {
                console.log('✅ Written pass-through check-status to main-site');
                conn.exec(
                    'cd /www/wwwroot/namainvist.com && npm run build 2>&1 | tail -8 && pm2 restart main-site && sleep 5 && pm2 list | grep main-site',
                    (e, s) => {
                        s.on('data', d => process.stdout.write(d.toString()));
                        s.stderr.on('data', d => process.stderr.write(d.toString()));
                        s.on('close', () => conn.end());
                    }
                );
            });
        }
    );
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
