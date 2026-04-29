const { Client } = require('ssh2');
const fs = require('fs');

const healthTsContent = fs.readFileSync('c:\\Users\\1\\Desktop\\alfa\\src\\app\\api\\health\\route.ts', 'utf8');

const bashCommand = `
mkdir -p /www/wwwroot/n1.namainvist.com/src/app/api/health
cat << 'EOF3' > /www/wwwroot/n1.namainvist.com/src/app/api/health/route.ts
${healthTsContent}
EOF3

cd /www/wwwroot/n1.namainvist.com
echo "Building Master Template N1..."
npm run build
pm2 reload n1 || pm2 reload n1.namainvist.com || true
echo "Master Template Patch Complete!"
`;

const conn = new Client();
conn.on('ready', () => {
    console.log('Sending patch to master N1 server...');
    conn.exec(bashCommand, (err, stream) => {
        if (err) throw err;
        stream.on('data', (d) => process.stdout.write(d));
        stream.stderr.on('data', (d) => process.stdout.write(d));
        stream.on('close', () => {
			console.log('Done SSH N1');
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
