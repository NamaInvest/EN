/**
 * deploy_n1_to_n10_security.js
 * Deploys all security + optimization updates to nodes N1 through N10 sequentially.
 */
const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const SSH_CONFIG = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 60000 };

const nodes = [
    { name: 'n1',  pm2: 'n1-main', path: '/www/wwwroot/n1.namainvist.com/' },
    { name: 'n2',  pm2: 'n2',      path: '/www/wwwroot/n2.namainvist.com/' },
    { name: 'n3',  pm2: 'n3',      path: '/www/wwwroot/n3.namainvist.com/' },
    { name: 'n4',  pm2: 'n4',      path: '/www/wwwroot/n4.namainvist.com/' },
    { name: 'n5',  pm2: 'n5',      path: '/www/wwwroot/n5.namainvist.com/' },
    { name: 'n6',  pm2: 'n6',      path: '/www/wwwroot/n6.namainvist.com/' },
    { name: 'n7',  pm2: 'n7',      path: '/www/wwwroot/n7.namainvist.com/' },
    { name: 'n8',  pm2: 'n8',      path: '/www/wwwroot/n8.namainvist.com/' },
    { name: 'n9',  pm2: 'n9',      path: '/www/wwwroot/n9.namainvist.com/' },
    { name: 'n10', pm2: 'n10',     path: '/www/wwwroot/n10.namainvist.com/' },
];

const filesToUpload = [
    // Security core
    'src/lib/validations.ts',
    'src/lib/api-handler.ts',
    // Financial APIs
    'src/app/api/treasury/route.ts',
    'src/app/api/treasury/balance/route.ts',
    'src/app/api/expenses/route.ts',
    'src/app/api/purchases/route.ts',
    'src/app/api/purchase-returns/route.ts',
    'src/app/api/sales-returns/route.ts',
    'src/app/api/salaries/route.ts',
    // Query optimization
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

// ── Helper: upload + build a single node ──
function deployNode(node) {
    return new Promise((resolve, reject) => {
        const conn = new Client();
        const log = (msg) => console.log(`[${node.name.toUpperCase()}] ${msg}`);

        conn.on('ready', () => {
            log('✅ متصل');

            // Step 1: ensure all directories exist
            const dirs = [...new Set(filesToUpload.map(f => path.dirname(f).replace(/\\/g, '/')))];
            const mkdirCmd = dirs.map(d => `mkdir -p ${node.path}${d}`).join(' && ');

            conn.exec(mkdirCmd, (err, stream) => {
                if (err) return reject(err);
                stream.on('close', () => {
                    // Step 2: SFTP upload all files
                    conn.sftp((err, sftp) => {
                        if (err) return reject(err);
                        let done = 0;
                        let failed = 0;
                        filesToUpload.forEach(relPath => {
                            const localFile = path.join(__dirname, relPath);
                            const remoteFile = node.path + relPath.replace(/\\/g, '/');
                            sftp.fastPut(localFile, remoteFile, (err) => {
                                if (err) { log(`❌ ${relPath}`); failed++; }
                                else { log(`📤 ${relPath}`); }
                                done++;
                                if (done === filesToUpload.length) {
                                    if (failed > 0) log(`⚠️  ${failed} ملف فشل`);
                                    // Step 3: build & restart
                                    log('⏳ جاري البناء...');
                                    conn.exec(
                                        `cd ${node.path} && npm run build 2>&1 | tail -5 && pm2 restart ${node.pm2} && echo "DONE"`,
                                        (err, stream) => {
                                            if (err) return reject(err);
                                            stream.on('close', (code) => {
                                                log(`🚀 اكتمل! (exit: ${code})`);
                                                conn.end();
                                                resolve({ node: node.name, success: true });
                                            }).on('data', d => process.stdout.write(`[${node.name.toUpperCase()}] ${d}`))
                                              .stderr.on('data', d => process.stderr.write(`[${node.name.toUpperCase()}] ${d}`));
                                        }
                                    );
                                }
                            });
                        });
                    });
                });
            });
        }).on('error', (err) => {
            console.error(`[${node.name.toUpperCase()}] ❌ خطأ اتصال:`, err.message);
            reject(err);
        }).connect(SSH_CONFIG);
    });
}

// ── Main: deploy sequentially ──
async function main() {
    console.log(`\n🔐 بدء نشر تحديثات الأمان على N1 حتى N10`);
    console.log(`📦 ${filesToUpload.length} ملف لكل عقدة\n`);

    const results = [];
    for (const node of nodes) {
        try {
            const result = await deployNode(node);
            results.push(result);
            console.log(`\n✅ [${node.name.toUpperCase()}] جاهز\n${'─'.repeat(50)}`);
        } catch (err) {
            results.push({ node: node.name, success: false, error: err.message });
            console.error(`\n❌ [${node.name.toUpperCase()}] فشل: ${err.message}\n${'─'.repeat(50)}`);
        }
        // Small delay between nodes to avoid server overload
        await new Promise(r => setTimeout(r, 2000));
    }

    console.log('\n\n📊 تقرير النشر النهائي:');
    results.forEach(r => {
        const icon = r.success ? '✅' : '❌';
        console.log(`  ${icon} ${r.node.toUpperCase()}: ${r.success ? 'ناجح' : r.error}`);
    });
    const successCount = results.filter(r => r.success).length;
    console.log(`\n✅ ${successCount}/${nodes.length} عقدة تم تحديثها بنجاح`);
}

main().catch(console.error);
