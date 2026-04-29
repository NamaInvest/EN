const { Client } = require('ssh2');
const fs = require('fs');

const routeTsContent = fs.readFileSync('c:\\Users\\1\\Desktop\\alfa\\src\\app\\api\\tenant\\provision\\route.ts', 'utf8');
const pageTsxContent = fs.readFileSync('c:\\Users\\1\\Desktop\\alfa\\src\\app\\onboarding\\provisioning\\page.tsx', 'utf8');
const healthTsContent = fs.readFileSync('c:\\Users\\1\\Desktop\\alfa\\src\\app\\api\\health\\route.ts', 'utf8');

const bashCommand = `
cat << 'EOF1' > /www/wwwroot/namainvist.com/src/app/api/tenant/provision/route.ts
${routeTsContent}
EOF1

cat << 'EOF2' > /www/wwwroot/namainvist.com/src/app/onboarding/provisioning/page.tsx
${pageTsxContent}
EOF2

mkdir -p /www/wwwroot/namainvist.com/src/app/api/health
cat << 'EOF3' > /www/wwwroot/namainvist.com/src/app/api/health/route.ts
${healthTsContent}
EOF3

cd /www/wwwroot/namainvist.com
echo "Building Landing Page Data..."
npm run build
pm2 reload namainvist.com || pm2 reload nama-landing || pm2 reload 0
echo "Deployment Finished!!"
`;

const conn = new Client();
conn.on('ready', () => {
    console.log('SSH connection ready. Sending patch to landing page server...');
    conn.exec(bashCommand, (err, stream) => {
        if (err) throw err;
        stream.on('data', (d) => process.stdout.write(d));
        stream.stderr.on('data', (d) => process.stdout.write(d));
        stream.on('close', () => {
			console.log('Done SSH');
			conn.end()
		});
    });
}).connect({
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b',
	readyTimeout: 10000
});
