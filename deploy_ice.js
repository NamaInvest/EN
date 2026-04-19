const {Client} = require('ssh2');
const fs = require('fs');
const c = new Client();

const FILES = [
  'src/app/api/accounting/accounts/route.ts',
  'src/app/api/banks/[id]/route.ts',
  'src/app/api/batches/[id]/route.ts',
  'src/app/api/branches/route.ts',
  'src/app/api/coupons/[id]/route.ts',
  'src/app/api/customers/route.ts',
  'src/app/api/customers/[id]/route.ts',
  'src/app/api/employees/[id]/route.ts',
  'src/app/api/enterprise/projects/route.ts',
  'src/app/api/enterprise/projects/tasks/route.ts',
  'src/app/api/fixed-assets/[id]/route.ts',
  'src/app/api/fng/budgets/route.ts',
  'src/app/api/fng/petty-cash-funds/route.ts',
  'src/app/api/gift-cards/[id]/route.ts',
  'src/app/api/manufacturing/orders/[id]/route.ts',
  'src/app/api/manufacturing/recipes/[id]/route.ts',
  'src/app/api/products/[id]/route.ts',
  'src/app/api/sales/route.ts',
  'src/app/api/shifts/route.ts',
  'src/app/api/units/route.ts',
  'src/app/api/warehouses/[id]/route.ts',
];

c.on('ready', () => {
    console.log('Connected! Uploading ' + FILES.length + ' files...');
    c.sftp((e, sftp) => {
        let done = 0;
        let errs = 0;
        const uploadNext = (idx) => {
            if (idx >= FILES.length) {
                sftp.end();
                console.log('\n✅ Upload complete: ' + done + '/' + FILES.length);
                c.exec('cd /www/wwwroot/n11.namainvist.com && npm run build 2>&1 | tail -5 && pm2 restart saas-app --silent && echo "=== BUILD OK ==="', (e, s) => {
                    s.on('data', d => process.stdout.write(d.toString()));
                    s.stderr.on('data', d => process.stderr.write(d.toString()));
                    s.on('close', () => { console.log('\nDone!'); c.end(); });
                });
                return;
            }
            const f = FILES[idx];
            try {
                const content = fs.readFileSync(f);
                sftp.writeFile('/www/wwwroot/n11.namainvist.com/' + f, content, (err) => {
                    if (err) { errs++; console.log('  ❌ ' + f); }
                    else done++;
                    uploadNext(idx + 1);
                });
            } catch (e) { errs++; uploadNext(idx + 1); }
        };
        uploadNext(0);
    });
});
c.connect({host:'46.4.188.170',port:22,username:'root',password:'_ee4SWbxLVfH9b'});
