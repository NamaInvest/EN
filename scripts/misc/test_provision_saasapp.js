const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`
echo "Testing provision on SAAS-APP (port 3500)..."
curl -s -X POST http://127.0.0.1:3500/api/tenant/provision \
  -H "Content-Type: application/json" \
  -H "Host: namainvist.com" \
  -d '{
    "companyNameAr": "اختبار",
    "companyNameEn": "TestCompany",
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
    "clerkUserId": "test123",
    "clerkEmail": "testcompany@test.com"
  }' 2>&1 | python3 -m json.tool 2>/dev/null || echo "raw output above"
    `, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
