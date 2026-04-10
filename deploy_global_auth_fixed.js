const fs = require('fs');
const { Client } = require('ssh2');

const authGuardContent = fs.readFileSync('src/components/GlobalAuthGuard.tsx', 'utf8');
const layoutContent = fs.readFileSync('src/app/layout.tsx', 'utf8');

const conn = new Client();
conn.on('ready', () => {
    const script = `
const fs = require('fs');
fs.writeFileSync('/www/wwwroot/n11.namainvist.com/src/components/GlobalAuthGuard.tsx', Buffer.from('${Buffer.from(authGuardContent).toString('base64')}', 'base64').toString('utf8'));
fs.writeFileSync('/www/wwwroot/n11.namainvist.com/src/app/layout.tsx', Buffer.from('${Buffer.from(layoutContent).toString('base64')}', 'base64').toString('utf8'));
console.log('Files upgraded on N11');
`;
    
    conn.exec(`node -e "${script}" && cd /www/wwwroot/n11.namainvist.com && rm -rf .next && npm run build && pm2 restart n11 --update-env`, (err, stream) => {
        stream.on('close', () => conn.end()).on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
    });
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b'});
