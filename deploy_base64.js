const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const SSH_CONFIG = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 };

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

// Encode each file as base64, write it via echo on the server
function buildFileCommands() {
    const cmds = [];
    for (const relPath of files) {
        const localPath = path.join(__dirname, relPath);
        const content = fs.readFileSync(localPath);
        const b64 = content.toString('base64');
        // Write to /tmp/sec/ first
        const dir = path.dirname(relPath).replace(/\\/g, '/');
        cmds.push(`mkdir -p /tmp/sec/${dir}`);
        // Split b64 into chunks to avoid arg length limits
        cmds.push(`echo ${b64} | base64 -d > /tmp/sec/${relPath.replace(/\\/g, '/')}`);
    }
    return cmds;
}

// Build copy commands for all nodes
function buildCopyCommands() {
    const cmds = [];
    const dirs = [...new Set(files.map(f => path.dirname(f).replace(/\\/g, '/')))];
    for (const node of nodes) {
        for (const d of dirs) cmds.push(`mkdir -p ${node.path}/${d}`);
        for (const f of files) cmds.push(`cp /tmp/sec/${f} ${node.path}/${f}`);
        cmds.push(`echo "✅ COPIED: ${node.pm2}"`);
    }
    return cmds;
}

// Build background build commands
function buildBuildCommands() {
    return nodes.map(n =>
        `nohup sh -c "cd ${n.path} && npm run build > /tmp/bld_${n.pm2}.log 2>&1 && pm2 restart ${n.pm2} && echo DONE >> /tmp/bld_${n.pm2}.log" &`
    );
}

async function runCommand(conn, cmd) {
    return new Promise((resolve, reject) => {
        conn.exec(cmd, (err, stream) => {
            if (err) return reject(err);
            let out = '';
            stream.on('close', () => resolve(out))
                .on('data', d => { out += d; process.stdout.write(d.toString()); })
                .stderr.on('data', d => process.stderr.write(d.toString()));
        });
    });
}

async function main() {
    const conn = new Client();
    await new Promise((resolve, reject) => {
        conn.on('ready', resolve).on('error', reject).connect(SSH_CONFIG);
    });

    console.log('✅ متصل!\n');
    console.log('📦 المرحلة 1: كتابة الملفات على السيرفر عبر base64...');
    
    const fileCommands = buildFileCommands();
    // Run in batches of 5
    for (let i = 0; i < fileCommands.length; i += 5) {
        const batch = fileCommands.slice(i, i + 5).join(' && ');
        await runCommand(conn, batch);
    }
    
    console.log('\n📋 المرحلة 2: نسخ للعقد N1-N10...');
    const copyCmd = buildCopyCommands().join('\n');
    await runCommand(conn, copyCmd);
    
    console.log('\n🚀 المرحلة 3: تشغيل البناء في الخلفية...');
    const buildCmd = buildBuildCommands().join('\n') + '\necho "ALL_BUILDS_TRIGGERED"';
    await runCommand(conn, buildCmd);

    console.log('\n✅ تم! راقب N1: node check_build_log.js n1-main');
    conn.end();
}

main().catch(console.error);
