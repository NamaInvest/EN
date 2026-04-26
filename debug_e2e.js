const {Client} = require('ssh2');
const c = new Client();
function exec(conn, cmd) { return new Promise((resolve) => { conn.exec(cmd, (err, stream) => { if (err) { resolve('ERROR: ' + err.message); return; } let out = ''; stream.on('data', d => out += d.toString()); stream.stderr.on('data', d => out += d.toString()); stream.on('close', () => resolve(out.trim())); }); }); }
c.on('ready', async () => {
    // Check if Prisma thinks unitId is available in ProductCreateInput
    let r = await exec(c, 'grep "unitId" /www/wwwroot/n11.namainvist.com/node_modules/.prisma/client/index.d.ts | grep -i "create\\|unchecked" | head -5');
    console.log('unitId in create types:', r || 'NOT FOUND');

    r = await exec(c, 'grep -B2 -A2 "ProductUncheckedCreateInput" /www/wwwroot/n11.namainvist.com/node_modules/.prisma/client/index.d.ts | head -20');
    console.log('\nUnchecked type:', r || 'NOT FOUND');

    // Check what ProductCreateInput allows
    r = await exec(c, 'grep -A 40 "export type ProductCreateInput" /www/wwwroot/n11.namainvist.com/node_modules/.prisma/client/index.d.ts | head -45');
    console.log('\nProductCreateInput:\n', r);

    r = await exec(c, 'grep -A 40 "export type ProductUncheckedCreateInput" /www/wwwroot/n11.namainvist.com/node_modules/.prisma/client/index.d.ts | head -45');
    console.log('\nProductUncheckedCreateInput:\n', r);
    c.end();
});
c.on('error', e => console.error(e.message));
c.connect({host:'46.4.188.170', port:22, username:'root', password:'_ee4SWbxLVfH9b', readyTimeout:15000});
