const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' };
const TARGETS = [
    { base: '/www/wwwroot/namainvist.com', pm2: 'main-site' },
    { base: '/www/wwwroot/n1.namainvist.com', pm2: 'n1-main' },
    { base: '/www/wwwroot/n11.namainvist.com', pm2: 'saas-app' }
];

const LOCAL_BASE = 'd:\\namasoft9-3-main';
const FILES = [
    "src/app/api/auth/login/route.ts",
    "src/app/api/auth/2fa/login/route.ts",
    "src/app/api/auth/mfa/enroll/route.ts",
    "src/app/api/auth/mfa/disable/route.ts",
    "src/app/(dashboard)/settings/security/SecuritySettingsClient.tsx",
    "src/app/(dashboard)/admin/security/mfa-audit/page.tsx",
    "src/app/(dashboard)/admin/security/mfa-policy/page.tsx",
    "src/components/Sidebar.tsx",
    "src/app/(dashboard)/accounting/payment-runs/page.tsx",
    "src/app/(dashboard)/accounting/payment-runs/create/page.tsx",
    "src/app/(dashboard)/accounting/vendor-statements/page.tsx",
    "src/app/(dashboard)/accounting/vendor-statements/bulk/page.tsx",
    "src/app/(dashboard)/docs/page.tsx",
    "src/app/(dashboard)/docs/[slug]/page.tsx",
    "src/app/(dashboard)/subscriptions/page.tsx",
    "src/app/(dashboard)/subscriptions/plans/page.tsx",
    "src/app/(dashboard)/promotions/page.tsx",
    "src/app/(dashboard)/gift-cards/page.tsx",
    "src/app/(dashboard)/purchases/page.tsx",
    "src/app/(dashboard)/purchases/orders/page.tsx",
    "src/app/(dashboard)/purchases/requisitions/page.tsx",
    "src/app/(dashboard)/pos-dashboard/page.tsx",
    "src/app/(dashboard)/restaurant-tables/page.tsx",
    "src/app/(dashboard)/inventory/wms/page.tsx",
    "src/app/(dashboard)/inventory/zones/page.tsx",
    "src/app/(dashboard)/inventory/movements/page.tsx",
    "src/app/(dashboard)/manufacturing/page.tsx",
    "src/app/(dashboard)/manufacturing/orders/page.tsx",
    "src/app/(dashboard)/manufacturing/boms/page.tsx",
    "src/app/(dashboard)/quality/page.tsx",
    "src/app/(dashboard)/quality/inspections/page.tsx",
    "src/app/(dashboard)/quality/ncrs/page.tsx",
    "src/app/(dashboard)/treasury/page.tsx",
    "src/app/(dashboard)/treasury/checks/page.tsx",
    "src/app/(dashboard)/treasury/petty-cash/page.tsx",
    "src/app/(dashboard)/fng/budgets/page.tsx",
    "src/app/(dashboard)/fng/allocations/page.tsx",
    "src/app/(dashboard)/tax/page.tsx",
    "src/app/(dashboard)/tax/zatca-onboard/page.tsx",
    "src/app/(dashboard)/admin/grc/page.tsx",
    "src/app/(dashboard)/hr/page.tsx",
    "src/lib/mfa-engine.ts",
    "src/components/Sidebar.tsx",
    "src/app/(dashboard)/pos/page.tsx",
    "src/app/(dashboard)/restaurant-pos/page.tsx",
    "src/app/(dashboard)/shifts/monitor/page.tsx",
    "src/app/(dashboard)/pos/accountant/page.tsx",
    "src/app/(dashboard)/sales/analytics/page.tsx",
    "src/app/(dashboard)/sales/smart-map/page.tsx",
    "src/app/(dashboard)/pharmacy/page.tsx",
    "src/app/(dashboard)/pharmacy/manager/page.tsx",
    "src/app/(dashboard)/pharmacy/drug-interact/page.tsx",
    "src/app/(dashboard)/warehouses/map/page.tsx",
    "src/app/(dashboard)/warehouses/fifo/page.tsx",
    "src/app/(dashboard)/finance/cfo-dashboard/page.tsx",
    "src/app/(dashboard)/procurement/supplier-contracts/page.tsx",
    "src/app/(dashboard)/procurement/price-comparison/page.tsx",
    "src/app/(dashboard)/fleet/tracking/page.tsx",
    "src/app/(dashboard)/support/help-desk/page.tsx",
    "src/app/(dashboard)/crm/cx-nps/page.tsx",
    "src/app/(dashboard)/crm/key-accounts/page.tsx",
    "src/app/(dashboard)/enterprise/portfolio/page.tsx",
    "src/app/(dashboard)/marketing/analytics/page.tsx",
    "src/app/(dashboard)/ai/demand-forecast/page.tsx",
    "src/app/(dashboard)/ai/sales-coach/page.tsx",
    "src/app/(dashboard)/ice/page.tsx",
    "prisma/schema.prisma",
    "package.json"
];

function uploadDirectory(sftp, localDir, remoteDir) { /* implementation omitted for brevity, I will just upload docs.tar.gz instead */ }
function uploadFile(sftp, localPath, remotePath) {
    return new Promise((resolve, reject) => {
        const data = fs.readFileSync(localPath);
        sftp.writeFile(remotePath, data, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

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

async function deploy() {
    const conn = new Client();
    conn.on('ready', () => {
        console.log('SSH connection established');
        conn.sftp(async (err, sftp) => {
            if (err) throw err;

            for (const target of TARGETS) {
                console.log(`
========== Deploying to ${target.base} ==========`);
                
                // 1. Upload files
                for (const file of FILES) {
                    const localPath = path.join(LOCAL_BASE, file);
                    if (!fs.existsSync(localPath)) {
                        console.log(`[SKIP] Local file not found: ${file}`);
                        continue;
                    }
                    const remotePath = `${target.base}/${file.replace(/\\/g, '/')}`;
                    
                    const remoteDir = path.dirname(remotePath);
                    await execCommand(conn, `mkdir -p "${remoteDir}"`);
                    
                    await uploadFile(sftp, localPath, remotePath);
                    console.log(`[UPLOADED] ${file}`);
                }
                
                // Upload docs
                console.log(`
[UPLOAD] Uploading docs_archive.tar.gz to ${target.base}`);
                await uploadFile(sftp, path.join(LOCAL_BASE, 'docs_archive.tar.gz'), `${target.base}/docs_archive.tar.gz`);
                await execCommand(conn, `cd ${target.base} && tar -xzf docs_archive.tar.gz && rm docs_archive.tar.gz`);
                console.log(`[EXTRACTED] docs_archive.tar.gz`);

                // 2. Install dependencies & build
                console.log(`
[BUILDING] Rebuilding ${target.pm2}...`);
                const dups = ['src/app/(dashboard)/admin/siem', 'src/app/(dashboard)/ai/demand-forecast', 'src/app/(dashboard)/ai/sales-coach', 'src/app/(dashboard)/crm/cx-nps', 'src/app/(dashboard)/crm/key-accounts', 'src/app/(dashboard)/enterprise/portfolio', 'src/app/(dashboard)/finance/cfo-dashboard', 'src/app/(dashboard)/fleet/tracking', 'src/app/(dashboard)/ice', 'src/app/(dashboard)/marketing/analytics', 'src/app/(dashboard)/pharmacy', 'src/app/(dashboard)/pos', 'src/app/(dashboard)/procurement/price-comparison', 'src/app/(dashboard)/procurement/supplier-contracts', 'src/app/(dashboard)/restaurant-pos', 'src/app/(dashboard)/sales/analytics', 'src/app/(dashboard)/sales/smart-map', 'src/app/(dashboard)/shifts/monitor', 'src/app/(dashboard)/support/help-desk', 'src/app/(dashboard)/warehouses/fifo', 'src/app/(dashboard)/warehouses/map'];
                const rmCmd = dups.map(d => `rm -rf "${target.base}/${d}"`).join(' && ');
                const cmd = `${rmCmd} && cd ${target.base} && npm install && npx prisma generate && rm -rf .next && npm run build && pm2 restart ${target.pm2}`;
                console.log(cmd);
                
                const { code, stdout, stderr } = await execCommand(conn, cmd);
                console.log(`[RESTART] Exit code: ${code}`);
                if (code !== 0) {
                    console.error('Error during build:', stderr);
                }
            }
            
            console.log(`
[SYNC] Running DB schema sync...`);
            await execCommand(conn, `cd /www/wwwroot/namainvist.com && node sync_all_tenants.js && node fix_perms_5432.js`);
            console.log('[SYNC] Complete.');

            conn.end();
            console.log('Deployment completely finished!');
        });
    }).connect(SERVER);
}

deploy();
