/**
 * deploy_all_nodes_fast.js
 * Uploads files to all N1-N10, then triggers builds in background on each node via nohup.
 */
const { Client } = require('ssh2');
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

function uploadAndTrigger(node) {
    return new Promise((resolve, reject) => {
        const conn = new Client();
        conn.on('ready', () => {
            // mkdir all dirs
            const dirs = [...new Set(filesToUpload.map(f => path.dirname(f).replace(/\\/g, '/')))];
            const mkdirCmd = dirs.map(d => `mkdir -p ${node.path}${d}`).join(' && ');
            conn.exec(mkdirCmd, (err, stream) => {
                stream.on('close', () => {
                    conn.sftp((err, sftp) => {
                        let done = 0;
                        filesToUpload.forEach(relPath => {
                            sftp.fastPut(
                                path.join(__dirname, relPath),
                                node.path + relPath.replace(/\\/g, '/'),
                                () => {
                                    done++;
                                    if (done === filesToUpload.length) {
                                        // Trigger build in background (nohup) - doesn't block
                                        const buildCmd = `nohup sh -c "cd ${node.path} && npm run build >> /tmp/build_${node.name}.log 2>&1 && pm2 restart ${node.pm2} && echo DONE >> /tmp/build_${node.name}.log" &`;
                                        conn.exec(buildCmd, (err, stream) => {
                                            stream.on('close', () => {
                                                console.log(`✅ [${node.name.toUpperCase()}] ملفات رُفعت + بناء بدأ في الخلفية`);
                                                conn.end();
                                                resolve(node.name);
                                            }).on('data', () => {}).stderr.on('data', () => {});
                                        });
                                    }
                                }
                            );
                        });
                    });
                });
            });
        }).on('error', (err) => { console.error(`❌ [${node.name}]:`, err.message); resolve(node.name); })
          .connect(SSH_CONFIG);
    });
}

async function main() {
    console.log('🔐 رفع الملفات وتشغيل البناء في الخلفية على N1-N10...\n');
    
    // Upload to all nodes - slightly staggered to avoid overwhelming SSH
    for (const node of nodes) {
        await uploadAndTrigger(node);
        await new Promise(r => setTimeout(r, 500)); // small gap
    }

    console.log('\n✅ تم رفع الملفات على جميع العقد!');
    console.log('⏳ البناء يعمل في الخلفية على كل عقدة.');
    console.log('📋 لمراقبة تقدم البناء على أي عقدة: node check_build_log.js n1');
}

main();
