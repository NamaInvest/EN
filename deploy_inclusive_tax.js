const fs = require('fs');
const { Client } = require('ssh2');

const f1 = fs.readFileSync('src/app/(dashboard)/sales/orders/create/page.tsx');
const f2 = fs.readFileSync('src/app/api/sales-orders/route.ts');
const f3 = fs.readFileSync('src/app/(dashboard)/price-quotes/page.tsx');
const f4 = fs.readFileSync('src/app/api/price-quotes/route.ts');

const conn = new Client();
conn.on('ready', () => {
    const script = `
const fs = require('fs');
fs.writeFileSync('/www/wwwroot/n11.namainvist.com/src/app/(dashboard)/sales/orders/create/page.tsx', Buffer.from('${f1.toString('base64')}', 'base64').toString('utf8'));
fs.writeFileSync('/www/wwwroot/n11.namainvist.com/src/app/api/sales-orders/route.ts', Buffer.from('${f2.toString('base64')}', 'base64').toString('utf8'));
fs.writeFileSync('/www/wwwroot/n11.namainvist.com/src/app/(dashboard)/price-quotes/page.tsx', Buffer.from('${f3.toString('base64')}', 'base64').toString('utf8'));
fs.writeFileSync('/www/wwwroot/n11.namainvist.com/src/app/api/price-quotes/route.ts', Buffer.from('${f4.toString('base64')}', 'base64').toString('utf8'));
console.log('Inclusive Tax Update Files Copied');
`;
    
    conn.exec(`node -e "${script}" && cd /www/wwwroot/n11.namainvist.com && rm -rf .next && npm run build && pm2 restart n11 --update-env`, (err, stream) => {
        stream.on('close', () => conn.end()).on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
    });
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b'});
