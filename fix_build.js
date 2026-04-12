const { Client } = require('ssh2');

const bashCommand = `
rm -f "/www/wwwroot/ice.namainvist.com/src/app/(dashboard)/sales/page_localized.tsx"
rm -f "/www/wwwroot/namainvist.com/src/app/(dashboard)/sales/page_localized.tsx"
rm -f "/www/wwwroot/n1.namainvist.com/src/app/(dashboard)/sales/page_localized.tsx"
rm -f "/www/wwwroot/ice.namainvist.com/src/app/(dashboard)/sales/page_localized_backup.tsx"

cd /www/wwwroot/ice.namainvist.com
npm run build > build_fixed.log 2>&1
`;

const conn = new Client();
conn.on('ready', () => {
    console.log('Fixing corrupted typescript and rebuilding...');
    conn.exec(bashCommand, (err, stream) => {
        if (err) throw err;
        stream.on('data', (d) => process.stdout.write(d))
              .on('error', (d) => process.stderr.write(d))
              .on('close', () => conn.end());
    });
}).connect({
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b'
});
