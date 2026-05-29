const { Client } = require('ssh2');
const fs = require('fs');

// Read local files and encode as base64
const pageTsx = fs.readFileSync('c:\\Users\\1\\Desktop\\alfa\\src\\app\\onboarding\\provisioning\\page.tsx', 'utf8');
const layoutTsx = fs.readFileSync('c:\\Users\\1\\Desktop\\alfa\\src\\app\\onboarding\\layout.tsx', 'utf8');
const routeTs = fs.readFileSync('c:\\Users\\1\\Desktop\\alfa\\src\\app\\api\\tenant\\provision\\route.ts', 'utf8');

// Verify local files first
console.log('=== LOCAL FILE STATUS ===');
console.log('page.tsx has English field:', pageTsx.includes('اسم المنشأة بالإنجليزية'));
console.log('page.tsx has businessDomain:', pageTsx.includes('businessDomain'));
console.log('page.tsx has branchName:', pageTsx.includes('branchName'));
console.log('page.tsx CRN maxLength=10:', pageTsx.includes('maxLength={10}'));
console.log('layout.tsx force-dynamic:', layoutTsx.includes('force-dynamic'));
console.log('');

const pageB64 = Buffer.from(pageTsx).toString('base64');
const layoutB64 = Buffer.from(layoutTsx).toString('base64');
const routeB64 = Buffer.from(routeTs).toString('base64');

const LANDING = '/www/wwwroot/namainvist.com';

// Write files using base64 decode - no special character issues!
const writeScript = `
echo "${pageB64}" | base64 -d > ${LANDING}/src/app/onboarding/provisioning/page.tsx
echo "${layoutB64}" | base64 -d > ${LANDING}/src/app/onboarding/layout.tsx  
mkdir -p ${LANDING}/src/app/api/tenant/provision
echo "${routeB64}" | base64 -d > ${LANDING}/src/app/api/tenant/provision/route.ts

echo "=== VERIFY FILES ON SERVER ==="
grep -c "اسم المنشأة بالإنجليزية" ${LANDING}/src/app/onboarding/provisioning/page.tsx && echo "FAIL: Old EN field still there" || echo "OK: No EN field"
grep -c "businessDomain" ${LANDING}/src/app/onboarding/provisioning/page.tsx && echo "OK: businessDomain present" || echo "FAIL: missing businessDomain"
grep -c "force-dynamic" ${LANDING}/src/app/onboarding/layout.tsx && echo "OK: force-dynamic present" || echo "FAIL: no force-dynamic"
grep -c "7\\\\\\\\d{9}" ${LANDING}/src/app/api/tenant/provision/route.ts && echo "OK: CRN validation present" || echo "FAIL: no CRN validation"
`;

const conn = new Client();
conn.on('ready', () => {
    console.log('Connected. Writing files via base64...');
    conn.exec(writeScript, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', () => {
            console.log('\nFiles written. Now rebuilding...');
            conn.exec(`cd ${LANDING} && rm -rf .next && npm run build && pm2 restart nama-landing && echo "BUILD_SUCCESS"`, (e2, s2) => {
                if (e2) throw e2;
                s2.on('data', d => process.stdout.write(d));
                s2.stderr.on('data', d => process.stdout.write(d));
                s2.on('close', () => {
                    console.log('\nDone! Checking rendered build output type...');
                    conn.exec(`grep -r "onboarding/provisioning" ${LANDING}/.next/server/app-paths-manifest.json 2>/dev/null || echo "No manifest entry"`, (e3, s3) => {
                        s3.on('data', d => process.stdout.write(d));
                        s3.on('close', () => conn.end());
                    });
                });
            });
        });
    });
}).connect({
    host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 15000
});
