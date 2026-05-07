const { Client } = require('ssh2');

const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' };
const TARGETS = [
    { base: '/www/wwwroot/namainvist.com', pm2: 'main-site' },
    { base: '/www/wwwroot/n1.namainvist.com', pm2: 'n1-main' },
    { base: '/www/wwwroot/n11.namainvist.com', pm2: 'saas-app' }
];

const dups = [
    'src/app/(dashboard)/admin/siem',
    'src/app/(dashboard)/ai/demand-forecast',
    'src/app/(dashboard)/ai/sales-coach',
    'src/app/(dashboard)/crm/cx-nps',
    'src/app/(dashboard)/crm/key-accounts',
    'src/app/(dashboard)/enterprise/portfolio',
    'src/app/(dashboard)/fleet/tracking',
    'src/app/(dashboard)/marketing/analytics',
    'src/app/(dashboard)/procurement/price-comparison',
    'src/app/(dashboard)/procurement/supplier-contracts',
    'src/app/(dashboard)/support/help-desk'
];

function execCommand(conn, cmd) {
    return new Promise((resolve, reject) => {
        conn.exec(cmd, (err, stream) => {
            if (err) return reject(err);
            let stdout = '', stderr = '';
            stream.on('data', d => { stdout += d; });
            stream.stderr.on('data', d => { stderr += d; });
            stream.on('close', (code) => resolve({ code, stdout, stderr }));
        });
    });
}

const conn = new Client();
conn.on('ready', async () => {
    console.log('Connected to server.');
    try {
        for (const target of TARGETS) {
            console.log(`Cleaning ${target.base}...`);
            const rmCmd = dups.map(d => `rm -rf "${target.base}/${d}"`).join(' && ');
            await execCommand(conn, rmCmd);
            
            console.log(`Building Next.js for ${target.base}...`);
            const { code, stdout, stderr } = await execCommand(conn, `cd ${target.base} && npm run build && pm2 restart ${target.pm2}`);
            console.log(`Build code: ${code}`);
            if(code !== 0) {
                console.log(stderr);
            }
        }
    } catch(e) {
        console.error(e);
    }
    conn.end();
    console.log('Done!');
}).connect(SERVER);
