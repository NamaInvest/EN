const { Client } = require('ssh2');
const fs = require('fs');

const zipBase64 = fs.readFileSync('staging_banks.zip', 'base64');
const conn = new Client();

const commands = `
cd /var/www/namasoft &&
echo "${zipBase64}" | base64 -d > staging_banks.zip &&
mkdir -p src/app/api/banks/\\[id\\]/transactions &&
mkdir -p "src/app/(dashboard)/accounting/banks/[id]" &&
unzip -o staging_banks.zip -d staging_banks_tmp &&
mv staging_banks_tmp/api_banks_route.ts src/app/api/banks/route.ts &&
mv staging_banks_tmp/api_banks_id_route.ts "src/app/api/banks/[id]/route.ts" &&
mv staging_banks_tmp/api_banks_id_tx_route.ts "src/app/api/banks/[id]/transactions/route.ts" &&
mv staging_banks_tmp/ui_banks_page.tsx "src/app/(dashboard)/accounting/banks/page.tsx" &&
mv staging_banks_tmp/ui_banks_id_page.tsx "src/app/(dashboard)/accounting/banks/[id]/page.tsx" &&
mv staging_banks_tmp/Sidebar.tsx src/components/Sidebar.tsx &&
mv staging_banks_tmp/i18n.tsx src/lib/i18n.tsx &&
mv staging_banks_tmp/schema.prisma prisma/schema.prisma &&
mv staging_banks_tmp/schema_final_ready.prisma schema_final_ready.prisma &&
npx prisma db push --schema=prisma/schema.prisma &&
npx prisma generate &&
npm run build &&
pm2 restart namasoft
`;

conn.on('ready', () => {
  console.log('Connected to server');
  conn.exec(commands, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('Done! Exit code: ' + code);
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data.toString());
    }).stderr.on('data', (data) => {
      process.stderr.write(data.toString());
    });
  });
}).connect({
  host: '185.197.195.202',
  port: 22,
  username: 'root',
  password: 'VmJUML2LuezRSws'
});
