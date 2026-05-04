const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const SERVER = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b'
};

const TARGETS = [
    { base: '/www/wwwroot/namainvist.com', pm2: 'main-site' },
    { base: '/www/wwwroot/n1.namainvist.com', pm2: 'n1-main' },
    { base: '/www/wwwroot/n11.namainvist.com', pm2: 'saas-app' }
];

const LOCAL_BASE = 'd:\\namasoft9-3-main';

const FILES = [
    "deploy_today.js",
    "src/app/(dashboard)/accounting/banks/[id]/page.tsx",
    "src/app/(dashboard)/accounting/banks/page.tsx",
    "src/app/(dashboard)/accounting/dunning/page.tsx",
    "src/app/(dashboard)/accounting/journal/page.tsx",
    "src/app/(dashboard)/accounting/lc/page.tsx",
    "src/app/(dashboard)/accounting/leases/page.tsx",
    "src/app/(dashboard)/accounting/multi-book/page.tsx",
    "src/app/(dashboard)/accounting/page.tsx",
    "src/app/(dashboard)/accounting/revenue-recognition/page.tsx",
    "src/app/(dashboard)/accounting/trial-balance/page.tsx",
    "src/app/(dashboard)/affiliates/page.tsx",
    "src/app/(dashboard)/ai-bank/page.tsx",
    "src/app/(dashboard)/ai-cfo/page.tsx",
    "src/app/(dashboard)/ai-copilot/page.tsx",
    "src/app/(dashboard)/ai-scm/page.tsx",
    "src/app/(dashboard)/approvals/page.tsx",
    "src/app/(dashboard)/assets/page.tsx",
    "src/app/(dashboard)/attendance/page.tsx",
    "src/app/(dashboard)/audit-logs/page.tsx",
    "src/app/(dashboard)/barcode/page.tsx",
    "src/app/(dashboard)/batches/page.tsx",
    "src/app/(dashboard)/bookings/calendar/page.tsx",
    "src/app/(dashboard)/bookings/page.tsx",
    "src/app/(dashboard)/branches/page.tsx",
    "src/app/(dashboard)/com/rules/page.tsx",
    "src/app/(dashboard)/coupons/page.tsx",
    "src/app/(dashboard)/crm/leads/page.tsx",
    "src/app/(dashboard)/customers/page.tsx",
    "src/app/(dashboard)/dashboard/page.tsx",
    "src/app/(dashboard)/employees/page.tsx",
    "src/app/(dashboard)/enterprise/fleet/page.tsx",
    "src/app/(dashboard)/enterprise/legal/page.tsx",
    "src/app/(dashboard)/enterprise/mrp/page.tsx",
    "src/app/(dashboard)/enterprise/mrp/recipes/page.tsx",
    "src/app/(dashboard)/enterprise/projects/[id]/page.tsx",
    "src/app/(dashboard)/enterprise/projects/page.tsx",
    "src/app/(dashboard)/enterprise/property/page.tsx",
    "src/app/(dashboard)/enterprise/quality-management/page.tsx",
    "src/app/(dashboard)/enterprise/quality/page.tsx",
    "src/app/(dashboard)/enterprise/wms/page.tsx",
    "src/app/(dashboard)/expenses/page.tsx",
    "src/app/(dashboard)/finance/allocation/page.tsx",
    "src/app/(dashboard)/finance/assets/page.tsx",
    "src/app/(dashboard)/finance/budget-control/page.tsx",
    "src/app/(dashboard)/finance/cash-flow/page.tsx",
    "src/app/(dashboard)/finance/cfo-ai/page.tsx",
    "src/app/(dashboard)/finance/cfo/page.tsx",
    "src/app/(dashboard)/finance/consolidation/page.tsx",
    "src/app/(dashboard)/finance/ecl/page.tsx",
    "src/app/(dashboard)/finance/fx-revaluation/page.tsx",
    "src/app/(dashboard)/finance/payment-run/page.tsx",
    "src/app/(dashboard)/finance/variance/page.tsx",
    "src/app/(dashboard)/finance/wht/page.tsx",
    "src/app/(dashboard)/fixed-assets/page.tsx",
    "src/app/(dashboard)/fleet/fuel/page.tsx",
    "src/app/(dashboard)/fleet/page.tsx",
    "src/app/(dashboard)/fleet/trips/page.tsx",
    "src/app/(dashboard)/fng/budgets/page.tsx",
    "src/app/(dashboard)/fng/petty-cash-funds/page.tsx",
    "src/app/(dashboard)/gift-cards/page.tsx",
    "src/app/(dashboard)/hr/ai-enrollment/page.tsx",
    "src/app/(dashboard)/hr/attendance/page.tsx",
    "src/app/(dashboard)/hr/documents/page.tsx",
    "src/app/(dashboard)/hr/eos/page.tsx",
    "src/app/(dashboard)/hr/evaluations/page.tsx",
    "src/app/(dashboard)/hr/gosi/page.tsx",
    "src/app/(dashboard)/hr/jobs/page.tsx",
    "src/app/(dashboard)/hr/leaves/page.tsx",
    "src/app/(dashboard)/hr/loans/page.tsx",
    "src/app/(dashboard)/hr/payroll-process/page.tsx",
    "src/app/(dashboard)/hr/payslip/[id]/page.tsx",
    "src/app/(dashboard)/hr/training/page.tsx",
    "src/app/(dashboard)/hr/wps/page.tsx",
    "src/app/(dashboard)/installments/page.tsx",
    "src/app/(dashboard)/inv/serials/page.tsx",
    "src/app/(dashboard)/inventory/quality-control/page.tsx",
    "src/app/(dashboard)/layout.tsx",
    "src/app/(dashboard)/loyalty/page.tsx",
    "src/app/(dashboard)/maintenance/page.tsx",
    "src/app/(dashboard)/manufacturing/blockchain-trace/page.tsx",
    "src/app/(dashboard)/manufacturing/bom/page.tsx",
    "src/app/(dashboard)/manufacturing/capa/page.tsx",
    "src/app/(dashboard)/manufacturing/digital-twin/page.tsx",
    "src/app/(dashboard)/manufacturing/labor-efficiency/page.tsx",
    "src/app/(dashboard)/manufacturing/lean-kanban/page.tsx",
    "src/app/(dashboard)/manufacturing/mrp-dashboard/page.tsx",
    "src/app/(dashboard)/manufacturing/mrp-engine/page.tsx",
    "src/app/(dashboard)/manufacturing/page.tsx",
    "src/app/(dashboard)/manufacturing/qc/page.tsx",
    "src/app/(dashboard)/manufacturing/scheduler/page.tsx",
    "src/app/(dashboard)/manufacturing/standard-cost/page.tsx",
    "src/app/(dashboard)/manufacturing/subcontracting/page.tsx",
    "src/app/(dashboard)/manufacturing/variance/page.tsx",
    "src/app/(dashboard)/manufacturing/work-centers/page.tsx",
    "src/app/(dashboard)/manufacturing/work-orders/page.tsx",
    "src/app/(dashboard)/payroll/wps/page.tsx",
    "src/app/(dashboard)/pos-demo/page.tsx",
    "src/app/(dashboard)/price-quotes/page.tsx",
    "src/app/(dashboard)/products/page.tsx",
    "src/app/(dashboard)/promotions/page.tsx",
    "src/app/(dashboard)/purchase-orders/[id]/landed-costs/page.tsx",
    "src/app/(dashboard)/purchase-orders/page.tsx",
    "src/app/(dashboard)/purchase-returns/page.tsx",
    "src/app/(dashboard)/purchases/grn/page.tsx",
    "src/app/(dashboard)/purchases/letters-of-credit/page.tsx",
    "src/app/(dashboard)/purchases/matching/page.tsx",
    "src/app/(dashboard)/purchases/options/page.tsx",
    "src/app/(dashboard)/purchases/page.tsx",
    "src/app/(dashboard)/purchases/requisitions/page.tsx",
    "src/app/(dashboard)/purchases/rfq/page.tsx",
    "src/app/(dashboard)/purchases/three-way-match/page.tsx",
    "src/app/(dashboard)/receipt-vouchers/page.tsx",
    "src/app/(dashboard)/recurring-invoices/page.tsx",
    "src/app/(dashboard)/rem/installments/page.tsx",
    "src/app/(dashboard)/rem/leases/page.tsx",
    "src/app/(dashboard)/rem/page.tsx",
    "src/app/(dashboard)/rent/page.tsx",
    "src/app/(dashboard)/reports/104-modules/page.tsx",
    "src/app/(dashboard)/reports/73-modules/page.tsx",
    "src/app/(dashboard)/reports/allocations/page.tsx",
    "src/app/(dashboard)/reports/budget-variance/page.tsx",
    "src/app/(dashboard)/reports/builder/page.tsx",
    "src/app/(dashboard)/reports/cashflow/page.tsx",
    "src/app/(dashboard)/reports/consolidation/page.tsx",
    "src/app/(dashboard)/reports/customer-statement/page.tsx",
    "src/app/(dashboard)/reports/expiry/page.tsx",
    "src/app/(dashboard)/reports/fraud-ai/page.tsx",
    "src/app/(dashboard)/reports/manual-purchases/page.tsx",
    "src/app/(dashboard)/reports/page.tsx",
    "src/app/(dashboard)/reports/returns/page.tsx",
    "src/app/(dashboard)/reports/zatca-vat/page.tsx",
    "src/app/(dashboard)/salaries/page.tsx",
    "src/app/(dashboard)/sales-returns/page.tsx",
    "src/app/(dashboard)/sales/cash-application/page.tsx",
    "src/app/(dashboard)/sales/delivery-notes/page.tsx",
    "src/app/(dashboard)/sales/history/page.tsx",
    "src/app/(dashboard)/sales/options/page.tsx",
    "src/app/(dashboard)/sales/orders/create/page.tsx",
    "src/app/(dashboard)/sales/orders/page.tsx",
    "src/app/(dashboard)/sales/page.tsx",
    "src/app/(dashboard)/sales/routes/page.tsx",
    "src/app/(dashboard)/sales/targets/page.tsx",
    "src/app/(dashboard)/school/attendance/page.tsx",
    "src/app/(dashboard)/school/dashboard/page.tsx",
    "src/app/(dashboard)/school/exams/page.tsx",
    "src/app/(dashboard)/school/page.tsx",
    "src/app/(dashboard)/school/schedule/page.tsx",
    "src/app/(dashboard)/school/stages/page.tsx",
    "src/app/(dashboard)/school/transport/page.tsx",
    "src/app/(dashboard)/scm/page.tsx",
    "src/app/(dashboard)/settings/approvals/page.tsx",
    "src/app/(dashboard)/settings/bpm/page.tsx",
    "src/app/(dashboard)/settings/company/page.tsx",
    "src/app/(dashboard)/settings/currencies/page.tsx",
    "src/app/(dashboard)/settings/custom-fields/page.tsx",
    "src/app/(dashboard)/settings/page.tsx",
    "src/app/(dashboard)/settings/roles/page.tsx",
    "src/app/(dashboard)/settings/whatsapp/page.tsx",
    "src/app/(dashboard)/shifts/page.tsx",
    "src/app/(dashboard)/shl/classes/page.tsx",
    "src/app/(dashboard)/shl/students/page.tsx",
    "src/app/(dashboard)/smart-transfers/page.tsx",
    "src/app/(dashboard)/stock-transfers/page.tsx",
    "src/app/(dashboard)/stock/adjustments/page.tsx",
    "src/app/(dashboard)/stock/movements/page.tsx",
    "src/app/(dashboard)/stock/page.tsx",
    "src/app/(dashboard)/stocktake/page.tsx",
    "src/app/(dashboard)/stocktake/vision/page.tsx",
    "src/app/(dashboard)/sys/alerts/page.tsx",
    "src/app/(dashboard)/sys/health/page.tsx",
    "src/app/(dashboard)/treasury/bank-recon/page.tsx",
    "src/app/(dashboard)/treasury/bank-reconciliation/page.tsx",
    "src/app/(dashboard)/treasury/cash-flow/page.tsx",
    "src/app/(dashboard)/treasury/checks/page.tsx",
    "src/app/(dashboard)/treasury/page.tsx",
    "src/app/(dashboard)/treasury/petty-cash/page.tsx",
    "src/app/(dashboard)/vacations/page.tsx",
    "src/app/(dashboard)/warehouses/alerts/page.tsx",
    "src/app/(dashboard)/warehouses/options/page.tsx",
    "src/app/(dashboard)/warehouses/page.tsx",
    "src/app/(dashboard)/whatsapp-hub/page.tsx",
    "src/app/globals.css",
    "src/components/Sidebar.tsx",
    "src/components/Skeleton.tsx",
    "src/components/Toast.tsx",
    "prisma/schema.prisma"
];

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
            stream.on('data', d => { stdout += d; process.stdout.write(d.toString()); });
            stream.stderr.on('data', d => { stderr += d; process.stderr.write(d.toString()); });
            stream.on('close', (code) => resolve({ code, stdout, stderr }));
        });
    });
}

function mkdirRecursive(sftp, dirPath) {
    return new Promise((resolve) => {
        sftp.mkdir(dirPath, (err) => {
            resolve();
        });
    });
}

async function deploy() {
    const conn = new Client();
    
    console.log('🔌 Connecting to Fleet Server (46.4.188.170)...');
    
    conn.on('ready', async () => {
        console.log('✅ Connected!\n');
        
        try {
            const sftp = await new Promise((resolve, reject) => {
                conn.sftp((err, sftp) => err ? reject(err) : resolve(sftp));
            });

            for (const target of TARGETS) {
                console.log(`\n==================================================`);
                console.log(`🚀 DEPLOYING TO ${target.base}`);
                console.log(`==================================================\n`);

                const dirs = new Set();
                for (const file of FILES) {
                    const parts = file.split('/');
                    let current = target.base;
                    for (let i = 0; i < parts.length - 1; i++) {
                        current += '/' + parts[i];
                        dirs.add(current);
                    }
                }

                for (const dir of [...dirs].sort()) {
                    await mkdirRecursive(sftp, dir);
                }

                let uploaded = 0;
                for (const file of FILES) {
                    const localPath = path.join(LOCAL_BASE, file.replace(/\//g, '\\'));
                    const remotePath = `${target.base}/${file}`;
                    
                    if (!fs.existsSync(localPath)) {
                        console.log(`  ⚠️  SKIP (not found): ${file}`);
                        continue;
                    }
                    
                    try {
                        await uploadFile(sftp, localPath, remotePath);
                        uploaded++;
                        console.log(`  ✅ ${file}`);
                    } catch (e) {
                        console.log(`  ❌ FAIL: ${file} — ${e.message}`);
                    }
                }

                console.log(`\n📊 Uploaded ${uploaded}/${FILES.length} files to ${target.base}\n`);

                console.log('🔧 Running prisma generate...');
                await execCommand(conn, `cd ${target.base} && npx prisma generate`);

                console.log('\n🔧 Running prisma db push...');
                
                let dbUrl = "postgresql://postgres@localhost:5432/namadb?schema=public";
                if (target.base.includes("n11")) dbUrl = "postgresql://postgres@localhost:5432/n11_db?schema=public";
                else if (target.base.includes("n1.")) dbUrl = "postgresql://postgres@localhost:5432/n1_db?schema=public";

                await execCommand(conn, `cd ${target.base} && DATABASE_URL="${dbUrl}" npx prisma db push --accept-data-loss`);

                console.log('\n🗑️  Clearing Next.js cache...');
                await execCommand(conn, `cd ${target.base} && rm -rf .next`);

                console.log('\n🏗️  Building Next.js...');
                await execCommand(conn, `cd ${target.base} && npm run build`);

                console.log(`\n🔄 Restarting PM2 (${target.pm2})...`);
                await execCommand(conn, `pm2 restart ${target.pm2}`);

                console.log(`\n🎉 Deploy to ${target.base} COMPLETE!`);
            }
        } catch (err) {
            console.error('❌ Deploy error:', err.message);
        }
        
        conn.end();
    });

    conn.on('error', (err) => {
        console.error('❌ Connection error:', err.message);
    });

    conn.connect(SERVER);
}

deploy();
