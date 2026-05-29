/**
 * server_side_deploy.js
 * Strategy: Upload files to N11 only (already done), then cp from N11 to N1-N10 on the server side.
 * This is MUCH faster since all nodes are on the same server filesystem.
 */
const { Client } = require('ssh2');
const SSH_CONFIG = { host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 30000 };

const files = [
    'src/lib/validations.ts',
    'src/lib/api-handler.ts',
    'src/app/api/treasury/route.ts',
    'src/app/api/treasury/balance/route.ts',
    'src/app/api/expenses/route.ts',
    'src/app/api/purchases/route.ts',
    'src/app/api/purchase-returns/route.ts',
    'src/app/api/sales-returns/route.ts',
    'src/app/api/salaries/route.ts',
    'src/app/api/vacations/route.ts',
    'src/app/api/sales/targets/route.ts',
    'src/app/api/hr/loans/route.ts',
    'src/app/api/finance/petty-cash/route.ts',
    'src/app/api/finance/petty-cash/[id]/process/route.ts',
    'src/app/api/attendance/route.ts',
    'src/app/api/reports/[type]/route.ts',
    'src/app/api/purchase-orders/route.ts',
    'src/app/api/installments/route.ts',
    'src/app/api/bookings/invoice/route.ts',
    'src/app/api/sales-orders/route.ts',
    'src/app/api/ai-auditor/route.ts',
    'src/app/api/cron/trigger-invoices/route.ts',
];

const source = '/www/wwwroot/n11.namainvist.com';
const nodes = [
    { path: '/www/wwwroot/n1.namainvist.com',  pm2: 'n1-main' },
    { path: '/www/wwwroot/n2.namainvist.com',  pm2: 'n2' },
    { path: '/www/wwwroot/n3.namainvist.com',  pm2: 'n3' },
    { path: '/www/wwwroot/n4.namainvist.com',  pm2: 'n4' },
    { path: '/www/wwwroot/n5.namainvist.com',  pm2: 'n5' },
    { path: '/www/wwwroot/n6.namainvist.com',  pm2: 'n6' },
    { path: '/www/wwwroot/n7.namainvist.com',  pm2: 'n7' },
    { path: '/www/wwwroot/n8.namainvist.com',  pm2: 'n8' },
    { path: '/www/wwwroot/n9.namainvist.com',  pm2: 'n9' },
    { path: '/www/wwwroot/n10.namainvist.com', pm2: 'n10' },
];

// Build the server-side copy commands for all nodes
const copyLines = [];
for (const node of nodes) {
    // mkdir all needed subdirs
    const dirs = [...new Set(files.map(f => {
        const parts = f.split('/'); parts.pop();
        return parts.join('/');
    }))];
    for (const d of dirs) {
        copyLines.push(`mkdir -p ${node.path}/${d}`);
    }
    // cp each file
    for (const f of files) {
        copyLines.push(`cp ${source}/${f} ${node.path}/${f}`);
    }
    copyLines.push(`echo "FILES_COPIED: ${node.pm2}"`);
}

// Build all nodes in a loop with nohup
const buildLines = nodes.map(n =>
    `nohup sh -c "cd ${n.path} && npm run build > /tmp/build_${n.pm2}.log 2>&1 && pm2 restart ${n.pm2} && echo DONE >> /tmp/build_${n.pm2}.log" &`
);

const fullScript = [
    'echo "=== Step 1: Copying files server-side ==="',
    ...copyLines,
    'echo "=== Step 2: Triggering background builds ==="',
    ...buildLines,
    'echo "ALL_BUILDS_TRIGGERED"',
    'echo "Monitor with: tail -f /tmp/build_n1-main.log"',
].join('\n');

const conn = new Client();
conn.on('ready', () => {
    console.log('✅ متصل - تنفيذ النسخ والبناء...');
    conn.exec(fullScript, (err, stream) => {
        if (err) throw err;
        stream.on('close', (code) => {
            console.log(`\n✅ انتهى! (exit: ${code})`);
            console.log('⏳ البناء يعمل في الخلفية على N1-N10');
            console.log('📋 لمراقبة عقدة: node check_build_log.js n1-main');
            conn.end();
        }).on('data', d => process.stdout.write(d.toString()))
          .stderr.on('data', d => process.stderr.write(d.toString()));
    });
}).connect(SSH_CONFIG);
