/**
 * deploy_via_tmp.js
 * Strategy:
 * 1. Upload all changed files to /tmp/sec_update/ on the server (once)
 * 2. Server copies from /tmp/sec_update/ to each N1-N10 (instant, local)
 * 3. Trigger background builds on all nodes
 */
const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const SSH_CONFIG = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 60000 };
const TMP_BASE = '/tmp/sec_update';

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

const conn = new Client();
conn.on('ready', async () => {
    console.log('✅ متصل - المرحلة 1: رفع الملفات لـ /tmp/sec_update/');

    // Create tmp directories
    const dirs = [...new Set(files.map(f => path.dirname(f).replace(/\\/g, '/')))];
    const mkdirCmd = dirs.map(d => `mkdir -p ${TMP_BASE}/${d}`).join(' && ');

    conn.exec(mkdirCmd, (err, stream) => {
        stream.on('close', () => {
            conn.sftp((err, sftp) => {
                let done = 0;
                files.forEach(relPath => {
                    const localFile = path.join(__dirname, relPath);
                    const remoteFile = `${TMP_BASE}/${relPath.replace(/\\/g, '/')}`;
                    sftp.fastPut(localFile, remoteFile, (err) => {
                        if (err) console.error(`❌ ${relPath}: ${err.message}`);
                        else console.log(`📤 ${relPath}`);
                        done++;
                        if (done === files.length) {
                            console.log('\n✅ المرحلة 1 انتهت - الملفات في /tmp/sec_update/');
                            console.log('⏳ المرحلة 2: نسخ للعقد N1-N10 وتشغيل البناء...\n');

                            // Build server-side copy commands for all nodes
                            const copyAndBuildLines = [];
                            for (const node of nodes) {
                                // mkdir dirs in node
                                for (const d of dirs) {
                                    copyAndBuildLines.push(`mkdir -p ${node.path}/${d}`);
                                }
                                // cp files
                                for (const f of files) {
                                    copyAndBuildLines.push(`cp ${TMP_BASE}/${f} ${node.path}/${f}`);
                                }
                                copyAndBuildLines.push(`echo "COPIED to ${node.pm2}"`);
                                // trigger background build
                                copyAndBuildLines.push(
                                    `nohup sh -c "cd ${node.path} && npm run build > /tmp/build_${node.pm2}.log 2>&1 && pm2 restart ${node.pm2} && echo DONE >> /tmp/build_${node.pm2}.log" &`
                                );
                                copyAndBuildLines.push(`echo "BUILD_TRIGGERED: ${node.pm2}"`);
                            }
                            copyAndBuildLines.push('echo "ALL_DONE"');

                            const script = copyAndBuildLines.join('\n');
                            conn.exec(script, (err, stream) => {
                                stream.on('close', () => {
                                    console.log('\n🚀 كل العقد تبني في الخلفية!');
                                    console.log('📋 راقب N1: node check_build_log.js n1-main');
                                    console.log('📋 راقب N2: node check_build_log.js n2');
                                    conn.end();
                                }).on('data', d => process.stdout.write(d.toString()))
                                  .stderr.on('data', d => process.stderr.write(d.toString()));
                            });
                        }
                    });
                });
            });
        });
    });
}).connect(SSH_CONFIG);
