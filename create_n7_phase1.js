const { Client } = require('ssh2');
const conn = new Client();
const N11 = '/www/wwwroot/n11.namainvist.com';
const N7  = '/www/wwwroot/n7.namainvist.com';
const N7_PORT = 3600;

conn.on('ready', () => {
    const cmd = `
echo "=== [1] فحص بيئة n11 ==="
node --version
npm --version
echo "Node path: $(which node)"
echo "PM2 version: $(pm2 --version)"
echo "Prisma CLI: $(npx prisma --version 2>/dev/null | head -1)"
echo "PostgreSQL: $(sudo -u postgres psql --version)"
echo "=== Global npm packages ==="
npm list -g --depth=0 2>/dev/null | grep -v "^npm"
echo "=== n11 .env contents ==="
cat ${N11}/.env | grep -v PASSWORD | grep -v SECRET | grep -v KEY
echo "=== [2] نسخ n11 → n7 (بدون node_modules و .next) ==="
mkdir -p ${N7}
rsync -av --progress \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='.git' \
    ${N11}/ ${N7}/
echo "✅ Files copied"
echo "=== [3] تحديث .env لـ n7 ==="
cp ${N11}/.env ${N7}/.env
sed -i "s/PORT=.*/PORT=${N7_PORT}/" ${N7}/.env
sed -i "s|DATABASE_URL=.*|DATABASE_URL=postgresql://postgres:RootPassNama123@localhost:5432/n7_db?schema=public|" ${N7}/.env
echo "TENANT=n7" >> ${N7}/.env
echo "DEFAULT_TENANT=n7" >> ${N7}/.env
cat ${N7}/.env | grep -E "PORT|DATABASE_URL|TENANT"
echo "=== [4] إنشاء قاعدة بيانات n7_db ==="
sudo -u postgres psql -c "DROP DATABASE IF EXISTS n7_db;" 2>/dev/null
sudo -u postgres psql -c "CREATE DATABASE n7_db OWNER postgres;" 2>/dev/null
echo "✅ n7_db created"
echo "=== [5] تثبيت الحزم في n7 ==="
cd ${N7} && npm install 2>&1 | tail -5
echo "✅ npm install done"
`;

    conn.exec(cmd, (err, s) => {
        s.on('data', d => process.stdout.write(d.toString()));
        s.stderr.on('data', d => process.stderr.write(d.toString()));
        s.on('close', () => {
            console.log('\n✅ Phase 1 (copy + setup) done. Starting build...');
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 });
