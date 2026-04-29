const { Client } = require('ssh2');

const files = [
    'prisma/schema.prisma',
    'src/components/Sidebar.tsx',
    
    // API routes
    'src/app/api/hr/training/route.ts',
    'src/app/api/rem/leases/route.ts',
    'src/app/api/fleet/trips/route.ts',
    'src/app/api/hr/jobs/route.ts',
    'src/app/api/fng/budgets/route.ts',
    'src/app/api/shl/students/route.ts',
    'src/app/api/fleet/fuel/route.ts',
    'src/app/api/fng/petty-cash-funds/route.ts',
    'src/app/api/inv/serials/route.ts',
    'src/app/api/rem/installments/route.ts',
    'src/app/api/shl/classes/route.ts',
    'src/app/api/com/rules/route.ts',
    'src/app/api/hr/evaluations/route.ts',
    'src/app/api/sys/alerts/route.ts',
    'src/app/api/enterprise/projects/route.ts',

    // Dashboard pages
    'src/app/(dashboard)/hr/training/page.tsx',
    'src/app/(dashboard)/rem/leases/page.tsx',
    'src/app/(dashboard)/fleet/trips/page.tsx',
    'src/app/(dashboard)/hr/jobs/page.tsx',
    'src/app/(dashboard)/fng/budgets/page.tsx',
    'src/app/(dashboard)/shl/students/page.tsx',
    'src/app/(dashboard)/fleet/fuel/page.tsx',
    'src/app/(dashboard)/fng/petty-cash-funds/page.tsx',
    'src/app/(dashboard)/inv/serials/page.tsx',
    'src/app/(dashboard)/rem/installments/page.tsx',
    'src/app/(dashboard)/shl/classes/page.tsx',
    'src/app/(dashboard)/com/rules/page.tsx',
    'src/app/(dashboard)/hr/evaluations/page.tsx',
    'src/app/(dashboard)/sys/alerts/page.tsx'
];

const dirsToMake = [
    'src/app/api/hr/training', 'src/app/api/rem/leases', 'src/app/api/fleet/trips', 'src/app/api/hr/jobs', 'src/app/api/fng/budgets', 'src/app/api/shl/students', 'src/app/api/fleet/fuel', 'src/app/api/fng/petty-cash-funds', 'src/app/api/inv/serials', 'src/app/api/rem/installments', 'src/app/api/shl/classes', 'src/app/api/com/rules', 'src/app/api/hr/evaluations', 'src/app/api/sys/alerts',
    'src/app/(dashboard)/hr/training', 'src/app/(dashboard)/rem/leases', 'src/app/(dashboard)/fleet/trips', 'src/app/(dashboard)/hr/jobs', 'src/app/(dashboard)/fng/budgets', 'src/app/(dashboard)/shl/students', 'src/app/(dashboard)/fleet/fuel', 'src/app/(dashboard)/fng/petty-cash-funds', 'src/app/(dashboard)/inv/serials', 'src/app/(dashboard)/rem/installments', 'src/app/(dashboard)/shl/classes', 'src/app/(dashboard)/com/rules', 'src/app/(dashboard)/hr/evaluations', 'src/app/(dashboard)/sys/alerts'
];

async function orchestrate() {
    const conn = new Client();
    await new Promise((resolve, reject) => {
        conn.on('ready', () => {
            conn.sftp(async (err, sftp) => {
                if (err) return reject(err);
                
                try {
                    // PARALLEL UPLOAD TO ALL 10 TENANTS
                    const uploadPromises = [];
                    for(let i = 1; i <= 10; i++) {
                        const t = 'n' + i;
                        const rootPath = '/www/wwwroot/' + t + '.namainvist.com';
                        
                        // Execute mkdir
                        await new Promise((resMk, rejMk) => {
                            const mkCommand = 'mkdir -p ' + dirsToMake.map(d => "'" + rootPath + '/' + d + "'").join(' ');
                                
                            conn.exec(mkCommand, (err, stream) => {
                                if (err) return rejMk(err);
                                stream.on('data', (d) => console.log('STDOUT: ' + d));
                                stream.stderr.on('data', (d) => console.error('STDERR: ' + d));
                                stream.on('close', resMk);
                            });
                        });
                        
                        // Queue uploads
                        for (const f of files) {
                            const local = 'c:/Users/1/Desktop/alfa/' + f;
                            const remote = rootPath + '/' + f;
                            uploadPromises.push(new Promise((resUp, rejUp) => {
                                sftp.fastPut(local, remote, e => e ? rejUp(e) : resUp());
                            }));
                        }
                        console.log('Queued Phase Final Legacy Parity payloads for ' + t);
                    }
                    
                    console.log('Waiting for all parallel SFTP uploads to finish...');
                    await Promise.all(uploadPromises);
                    console.log("All 10 tenants synced.");

                    // trigger compile
                    console.log("Triggering global concurrent compilation and Prisma DB push...");
                    const buildCmd = [
                        'for i in {1..10}; do',
                        '  (',
                        '    cd /www/wwwroot/n$i.namainvist.com;',
                        '    rm -rf .next;',
                        '    npx prisma generate;',
                        '    npx prisma db push --accept-data-loss;',
                        '    npm run build;',
                        '    pm2 restart n$i --update-env;',
                        '  ) > /root/build_n$i_phase_final.log 2>&1 &',
                        'done'
                    ].join(' ');
                    
                    conn.exec(buildCmd, (err, stream) => {
                        if (err) throw err;
                        stream.resume();
                        stream.on('close', () => {
                            console.log("Servers are now compiling and restarting in the background!");
                            conn.end();
                            resolve();
                        });
                    });

                } catch (e) {
                    console.error(e);
                    conn.end();
                    reject(e);
                }
            });
        }).on('error', reject).connect({
            host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 20000
        });
    });
}

console.log("Starting FINAL ERP Legacy Parity Deployment to ALL sites...");
orchestrate().then(() => console.log('Deployment Script Fired Successfully!')).catch(e => console.error(e));
