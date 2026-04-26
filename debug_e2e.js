const {Client} = require('ssh2');
const c = new Client();
function exec(conn, cmd) { return new Promise((resolve) => { conn.exec(cmd, (err, stream) => { if (err) { resolve('ERROR: ' + err.message); return; } let out = ''; stream.on('data', d => out += d.toString()); stream.stderr.on('data', d => out += d.toString()); stream.on('close', () => resolve(out.trim())); }); }); }
c.on('ready', async () => {
    // Check the actual generated Prisma client types for Product
    let r = await exec(c, 'grep -A 2 "categoryId" /www/wwwroot/n11.namainvist.com/prisma/schema.prisma');
    console.log('Schema categoryId:', r || 'NOT FOUND');

    r = await exec(c, 'grep -A 2 "category" /www/wwwroot/n11.namainvist.com/prisma/schema.prisma | head -20');
    console.log('\nSchema category:', r || 'NOT FOUND');

    // Check how the DB column is named
    r = await exec(c, `PGPASSWORD=n11_pass123 psql -h localhost -U n11_db -d brightstartradingco_db -c "SELECT column_name FROM information_schema.columns WHERE table_name='products' AND column_name LIKE '%categ%';" 2>&1`);
    console.log('\nDB category column:', r);

    // Check the full Prisma schema Product model
    r = await exec(c, 'grep -B 2 -A 30 "buy_price\\|sellPrice\\|sell_price\\|buyPrice" /www/wwwroot/n11.namainvist.com/prisma/schema.prisma | head -50');
    console.log('\nProduct model:', r || 'NOT FOUND');

    // Check node_modules for generated type
    r = await exec(c, 'grep "categoryId" /www/wwwroot/n11.namainvist.com/node_modules/.prisma/client/index.d.ts | head -5');
    console.log('\nGenerated type categoryId:', r || 'NOT FOUND');

    r = await exec(c, 'grep "category" /www/wwwroot/n11.namainvist.com/node_modules/.prisma/client/index.d.ts | head -10');
    console.log('\nGenerated type category:', r || 'NOT FOUND');

    c.end();
});
c.on('error', e => console.error(e.message));
c.connect({host:'46.4.188.170', port:22, username:'root', password:'_ee4SWbxLVfH9b', readyTimeout:15000});
