const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const N11 = '/www/wwwroot/n11.namainvist.com';

function ssh(c, cmd) {
  return new Promise(r => {
    c.exec(cmd, (err, stream) => {
      let out = '';
      stream.on('data', d => out += d);
      stream.stderr.on('data', d => out += d);
      stream.on('close', () => r(out.trim()));
    });
  });
}

function sftp_upload(sftp, localPath, remotePath) {
  return new Promise((res, rej) => sftp.fastPut(localPath, remotePath, e => e ? rej(e) : res()));
}

function sftp_mkdir(sftp, dir) {
  return new Promise(res => sftp.mkdir(dir, () => res()));
}

async function run() {
  const c = new Client();
  await new Promise(r => c.on('ready', r).connect({ 
    host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' 
  }));
  
  const sftp = await new Promise((res, rej) => c.sftp((e, s) => e ? rej(e) : res(s)));

  // 1. Check hidden-modules on n11
  console.log('=== Check hidden-modules on n11 ===');
  const hiddenCheck = await ssh(c, `ls "${N11}/src/app/api/tenant/hidden-modules/" 2>/dev/null || echo "NOT FOUND"`);
  console.log(hiddenCheck);

  // 2. Upload hidden-modules if missing
  if (hiddenCheck.includes('NOT FOUND')) {
    console.log('Creating hidden-modules directory and uploading route.ts...');
    await ssh(c, `mkdir -p "${N11}/src/app/api/tenant/hidden-modules"`);
    await sftp_upload(sftp, 
      'src/app/api/tenant/hidden-modules/route.ts', 
      `${N11}/src/app/api/tenant/hidden-modules/route.ts`
    );
    console.log('✅ hidden-modules route uploaded');
  } else {
    console.log('⚠️ hidden-modules already exists on n11');
  }

  // 3. Check manufacturing Prisma issue
  console.log('\n=== Manufacturing Prisma Issue ===');
  const mfgRoute = await ssh(c, `
    find "${N11}/src/app" -path "*/manufacturing*" -name "*.ts" 2>/dev/null | head -10
    find "${N11}/src/app" -path "*/api/manufacturing*" -name "*.ts" 2>/dev/null | head -5
  `);
  console.log(mfgRoute);

  // Check Prisma schema for ManufacturingOrder
  const prismaSchema = await ssh(c, `
    grep -A 20 "model ManufacturingOrder" "${N11}/prisma/schema.prisma" 2>/dev/null | head -25
  `);
  console.log('\n=== ManufacturingOrder schema ===');
  console.log(prismaSchema);

  // Find the API file with the bad query
  const badQuery = await ssh(c, `
    grep -r "stock.*include\\|include.*stock" "${N11}/src/app/api" --include="*.ts" -l 2>/dev/null | head -5
    grep -rn "wastages\\|ManufacturingOrder" "${N11}/src/app/api" --include="*.ts" -l 2>/dev/null | head -5
  `);
  console.log('\n=== Files with bad query ===');
  console.log(badQuery);

  // 4. Check n11 has the latest API routes 
  console.log('\n=== Check all API tenant routes on n11 ===');
  const apiTenant = await ssh(c, `ls "${N11}/src/app/api/tenant/" 2>/dev/null`);
  console.log(apiTenant);

  // 5. Compare local vs n11 API routes count
  console.log('\n=== Local API routes count ===');
  const localCount = await ssh(c, `ls "${N11}/src/app/api/" 2>/dev/null | wc -l`);
  console.log(`n11 api dirs: ${localCount}`);

  c.end();
}

run().catch(console.error);
