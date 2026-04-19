const {Client} = require('ssh2');
const fs = require('fs');
const c = new Client();
const FILES = [
  'src/app/api/branches/route.ts',
  'src/app/api/purchases/grn/route.ts',
  'src/app/api/purchases/rfq/route.ts',
  'src/app/api/shifts/route.ts',
  'src/app/api/stock/adjustments/route.ts',
  'src/app/api/enterprise/wms/route.ts',
];
c.on('ready', () => {
    c.sftp((e, sftp) => {
        let done = 0;
        const next = (i) => {
            if (i >= FILES.length) {
                sftp.end();
                console.log('✅ ' + done + '/' + FILES.length + ' uploaded');
                c.exec('cd /www/wwwroot/n11.namainvist.com && npm run build 2>&1 | tail -5 && pm2 restart saas-app --silent && echo "=== DONE ==="', (e, s) => {
                    s.on('data', d => process.stdout.write(d.toString()));
                    s.stderr.on('data', d => process.stderr.write(d.toString()));
                    s.on('close', () => { console.log('\nOK!'); c.end(); });
                });
                return;
            }
            try {
                sftp.writeFile('/www/wwwroot/n11.namainvist.com/' + FILES[i], fs.readFileSync(FILES[i]), () => { done++; next(i+1); });
            } catch(e) { next(i+1); }
        };
        next(0);
    });
});
c.connect({host:'46.4.188.170',port:22,username:'root',password:'_ee4SWbxLVfH9b'});
