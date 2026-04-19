const {Client} = require('ssh2');
const fs = require('fs');
const c = new Client();

const FILES = [
  'src/app/api/customers/route.ts',
  'src/app/api/sales/route.ts',
  'src/app/api/warehouses/[id]/route.ts',
];

c.on('ready', () => {
    c.sftp((e, sftp) => {
        let done = 0;
        FILES.forEach(f => {
            const content = fs.readFileSync(f);
            sftp.writeFile('/www/wwwroot/n11.namainvist.com/' + f, content, (err) => {
                console.log(err ? '❌ ' + f : '✅ ' + f);
                if (++done === FILES.length) {
                    sftp.end();
                    c.exec('cd /www/wwwroot/n11.namainvist.com && npm run build 2>&1 | tail -5 && pm2 restart saas-app --silent && echo "=== BUILD OK ==="', (e, s) => {
                        s.on('data', d => process.stdout.write(d.toString()));
                        s.stderr.on('data', d => process.stderr.write(d.toString()));
                        s.on('close', () => { console.log('\nDone!'); c.end(); });
                    });
                }
            });
        });
    });
});
c.connect({host:'46.4.188.170',port:22,username:'root',password:'_ee4SWbxLVfH9b'});
