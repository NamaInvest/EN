const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`cat /www/wwwroot/n11.namainvist.com/src/app/api/auth/login/route.ts`, (err, stream) => {
        let out = '';
        stream.on('data', d => out += d.toString());
        stream.on('close', () => {
            // Write modified version
            const modified = out.replace(
                `const user = await prisma.user.findFirst({
            where: { 
                username: {
                    equals: username,
                    mode: 'insensitive'
                }
            },
            include: { permissions: true },
        });`,
                `// دعم تسجيل الدخول بالبريد الإلكتروني أو username
        const isEmail = username.includes('@');
        const user = await prisma.user.findFirst({
            where: isEmail
                ? {
                    OR: [
                        { username: { equals: username, mode: 'insensitive' } },
                        { username: { equals: username.split('@')[0], mode: 'insensitive' } },
                    ]
                  }
                : { username: { equals: username, mode: 'insensitive' } },
            include: { permissions: true },
        });`
            );
            require('fs').writeFileSync('/tmp/login_route_new.ts', modified);
            console.log('Modified login route written to /tmp/login_route_new.ts');
            console.log('--- Preview of change ---');
            const lines = modified.split('\n').slice(18, 35);
            console.log(lines.join('\n'));
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
