const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`
echo "=== Testing provision on MAIN-SITE (port 3000) ==="
curl -s -X POST http://127.0.0.1:3000/api/tenant/provision \
  -H "Content-Type: application/json" \
  -H "Host: namainvist.com" \
  -d '{
    "companyNameAr": "اختبار2",
    "companyNameEn": "TestCompany2",
    "businessDomain": "Retail",
    "branchName": "الفرع الرئيسي",
    "mobile": "0500000000",
    "city": "الرياض",
    "address": "شارع الاختبار",
    "buildingNo": "1234",
    "district": "العليا",
    "postalCode": "12345",
    "vatNumber": "300012345678903",
    "crnNumber": "7000000001",
    "clerkUserId": "test456",
    "clerkEmail": "test2@testcompany2.com"
  }' 2>&1 | head -5

echo ""
echo "=== Which port does main-site run on? ==="
pm2 show 17 | grep -E "port|script args|exec cwd"

echo ""
echo "=== Nginx: where does namainvist.com/api/tenant/provision go? ==="
grep -A5 "provision\|3000\|3500" /www/server/panel/vhost/nginx/namainvist.com.conf | head -20
    `, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
