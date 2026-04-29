const { Client } = require('ssh2');
const fs = require('fs');

const config = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b',
    readyTimeout: 60000
};

const localFile = 'c:\\Users\\1\\Desktop\\alfa\\src\\app\\(dashboard)\\sales\\options\\page.tsx';
const remoteN1File = '/www/wwwroot/n1.namainvist.com/src/app/\\(dashboard\\)/sales/options/page.tsx';
const remoteN11File = '/www/wwwroot/n11.namainvist.com/src/app/\\(dashboard\\)/sales/options/page.tsx';

const fileContent = fs.readFileSync(localFile, 'utf8');

const cmd = `
cat << 'EOF' > ${remoteN1File}
${fileContent.replace(/\$/g, '\\$')}
EOF
cat << 'EOF' > ${remoteN11File}
${fileContent.replace(/\$/g, '\\$')}
EOF
echo "File uploaded to N1 and N11."

echo "Building N1..."
cd /www/wwwroot/n1.namainvist.com && npm run build && pm2 restart n1

echo "Building N11..."
cd /www/wwwroot/n11.namainvist.com && npm run build && pm2 restart n11

echo "N1 and N11 built and restarted successfully!"
`;

const conn = new Client();
conn.on('ready', () => {
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
            console.log('Finished deploy to N1 and N11');
            conn.end();
        });
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
    });
}).on('error', console.error).connect(config);
