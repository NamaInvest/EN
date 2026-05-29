const { Client } = require('ssh2');
const fs = require('fs');
const conn = new Client();
const REMOTE = '/www/wwwroot/n11.namainvist.com/src/app/api/auth/login/route.ts';
const LOCAL = 'c:/Users/1/Desktop/alfa/src/app/api/auth/login/route.ts';

conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        const chunks = [];
        const readStream = sftp.createReadStream(REMOTE);
        readStream.on('data', d => chunks.push(d));
        readStream.on('end', () => {
            let content = Buffer.concat(chunks).toString('utf8');
            
            // تعديل: دعم البريد الإلكتروني كـ username
            const oldCode = `const user = await prisma.user.findFirst({
            where: { 
                username: {
                    equals: username,
                    mode: 'insensitive'
                }
            },
            include: { permissions: true },
        });`;
            
            const newCode = `// دعم تسجيل الدخول بالبريد الإلكتروني الكامل أو username
        const isEmail = username.includes('@');
        const emailPart = isEmail ? username.split('@')[0].replace(/[^a-z0-9._-]/gi, '').toLowerCase() : null;
        const user = await prisma.user.findFirst({
            where: isEmail
                ? {
                    OR: [
                        { username: { equals: username, mode: 'insensitive' } },
                        ...(emailPart ? [{ username: { equals: emailPart, mode: 'insensitive' } }] : []),
                    ]
                  }
                : { username: { equals: username, mode: 'insensitive' } },
            include: { permissions: true },
        });`;

            if (!content.includes(oldCode)) {
                console.error('❌ Could not find target code to replace!');
                console.log('Current content around findFirst:');
                const idx = content.indexOf('findFirst');
                console.log(content.substring(idx - 20, idx + 300));
                conn.end();
                return;
            }

            const modified = content.replace(oldCode, newCode);
            
            // حفظ محلياً
            fs.mkdirSync('c:/Users/1/Desktop/alfa/src/app/api/auth/login', { recursive: true });
            fs.writeFileSync(LOCAL, modified, 'utf8');
            console.log('✅ Modified file saved locally');
            
            // رفعه للسيرفر
            sftp.fastPut(LOCAL, REMOTE, {}, (e) => {
                if (e) { console.error('❌ Upload failed:', e.message); }
                else { console.log('✅ Uploaded to server'); }
                
                // إعادة بناء saas-app فقط
                conn.exec(`cd /www/wwwroot/n11.namainvist.com && npm run build 2>&1 | tail -5 && pm2 restart saas-app && echo "✅ saas-app restarted"`, (err2, stream) => {
                    stream.on('data', d => process.stdout.write(d.toString()));
                    stream.stderr.on('data', d => process.stderr.write(d.toString()));
                    stream.on('close', () => { console.log('🎉 Done!'); conn.end(); });
                });
            });
        });
        readStream.on('error', e => { console.error('Read error:', e); conn.end(); });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 30000 });
