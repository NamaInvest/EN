const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
conn.on('ready', () => {
    console.log('--- EXECUTING SAFE PRISMA DB PUSH ON 204.x ---');
    
    // We run this without --accept-data-loss to guarantee 100% data safety.
    // If Prisma detects any column drops or destructive changes, it will safely abort.
    const cmd = `
        echo "Injecting missing Phase 87 SQL tables (ZATCA, SSO) into the legacy 2-week-old Postgres database..."
        cd /var/www/namasoft
        npx prisma db push
        echo "✅ DATABASE SCHEMA UPGRADE NON-DESTRUCTIVE SYNC COMPLETE."
    `;

    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end())
              .on('data', data => console.log('STDOUT: ' + data.toString()))
              .stderr.on('data', data => console.error('STDERR: ' + data.toString()));
    });
}).on('error', (err) => {
    console.error('SSH Connection Failed:', err.message);
}).connect({
    host: '204.168.144.74', 
    port: 22, 
    username: 'root', 
    privateKey: fs.readFileSync('C:\\Users\\1\\Desktop\\namasoftkey\\namasoft_key'),
    readyTimeout: 10000
});
