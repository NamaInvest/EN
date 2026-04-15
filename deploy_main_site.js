/**
 * deploy_main_site.js
 * Deploy landing page updates to the main marketing site (main-site PM2 process)
 */
const { Client } = require('ssh2');
const path = require('path');
const fs = require('fs');

const SSH_CONFIG = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 };

// First, find the main-site path
const conn = new Client();

conn.on('ready', () => {
    console.log('✅ متصل - جاري البحث عن مسار main-site...');

    conn.exec(`pm2 show main-site | grep "script path\\|root directory\\|cwd" | head -5`, (err, stream) => {
        let out = '';
        stream.on('close', () => {
            console.log('PM2 info:\n', out);

            // Common main site paths
            const mainSitePaths = [
                '/www/wwwroot/namainvist.com',
                '/www/wwwroot/main.namainvist.com',
                '/www/wwwroot/www.namainvist.com',
                '/root/namasoft9-3-main',
                '/home/namasoft9-3-main',
            ];

            const checkCmd = mainSitePaths.map(p => `[ -d "${p}/.next" ] && echo "FOUND:${p}"`).join('; ');

            conn.exec(checkCmd, (err, stream2) => {
                let found = '';
                stream2.on('close', () => {
                    const match = found.match(/FOUND:(.+)/);
                    if (match) {
                        const mainPath = match[1].trim();
                        console.log(`✅ main-site موجود في: ${mainPath}`);
                        deployToPath(conn, mainPath);
                    } else {
                        // Try to get from pm2 ecosystem
                        console.log('⚠️ جاري البحث بطريقة أخرى...');
                        conn.exec(`pm2 jlist | python3 -c "import sys,json; procs=[p for p in json.load(sys.stdin) if p['name']=='main-site']; print(procs[0]['pm2_env'].get('pm_cwd','') if procs else '')" 2>/dev/null || echo ""`, (err, stream3) => {
                            stream3.on('close', () => {
                                conn.end();
                            }).on('data', d => {
                                const p = d.toString().trim();
                                if (p) {
                                    console.log(`Found from PM2: ${p}`);
                                    deployToPath(conn, p);
                                } else {
                                    console.log('❌ ما قدرت أحدد المسار تلقائياً');
                                    console.log('شغّل: node deploy_main_site.js <PATH>');
                                    conn.end();
                                }
                            });
                        });
                    }
                }).on('data', d => { found += d; process.stdout.write(d.toString()); });
            });
        }).on('data', d => { out += d; process.stdout.write(d.toString()); });
    });
}).connect(SSH_CONFIG);

function deployToPath(conn, mainPath) {
    const files = [
        'src/app/page.tsx',
        'src/app/pharmacy/page.tsx',
        'src/app/retail/page.tsx',
        'src/app/restaurant/page.tsx',
        'src/app/factory/page.tsx',
    ];

    const dirs = [...new Set(files.map(f => path.dirname(f)))];
    const mkdirCmd = dirs.map(d => `mkdir -p ${mainPath}/${d}`).join(' && ');

    conn.exec(mkdirCmd, (err, stream) => {
        stream.on('close', () => {
            conn.sftp((err, sftp) => {
                let done = 0;
                files.forEach(f => {
                    sftp.fastPut(path.join(__dirname, f), `${mainPath}/${f}`, (err) => {
                        if (err) console.log(`❌ ${f}: ${err.message}`);
                        else console.log(`📤 ${f}`);
                        done++;
                        if (done === files.length) {
                            console.log('\n⏳ بناء main-site...');
                            conn.exec(`cd ${mainPath} && npm run build 2>&1 | tail -5 && pm2 restart main-site && echo "MAIN_SITE_DONE"`, (err, stream2) => {
                                stream2.on('close', (code) => {
                                    console.log(`\n✅ main-site انتهى (exit: ${code})`);
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
}
