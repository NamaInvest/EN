const { Client } = require('ssh2');
const fs = require('fs');

function ssh(cmd) {
  return new Promise(r => {
    const c = new Client();
    c.on('ready', () => {
      console.log(`Executing: ${cmd}`);
      c.exec(cmd, (err, stream) => {
        let out = '';
        stream.on('data', d => { process.stdout.write(d); out += d; });
        stream.stderr.on('data', d => { process.stderr.write(d); out += d; });
        stream.on('close', () => { c.end(); r(out.trim()); });
      });
    }).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
  });
}

function writeFile(remotePath, localPath) {
  return new Promise(r => {
    const c = new Client();
    c.on('ready', () => {
      c.sftp((err, sftp) => {
        if (err) { console.error('sftp error:', err.message); return r(); }
        const stream = sftp.createWriteStream(remotePath);
        stream.write(fs.readFileSync(localPath));
        stream.end();
        stream.on('close', () => { console.log('[✓] Uploaded', remotePath); c.end(); r(); });
        stream.on('error', e => { console.error('[✗]', remotePath, e.message); c.end(); r(); });
      });
    }).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
  });
}

(async () => {
  const bases = [
      '/www/wwwroot/namainvist.com',
      '/www/wwwroot/n11.namainvist.com'
  ];
  
  for (const base of bases) {
      console.log(`\n=== Creating new directories on ${base} ===`);
      await ssh(`mkdir -p ${base}/src/app/api/vendor-ratings ${base}/src/app/api/fiscal-periods ${base}/src/app/api/work-shifts ${base}/src/app/api/reports/cash-flow ${base}/src/app/api/reports/what-if ${base}/src/app/api/banks/import ${base}/src/app/api/field-service ${base}/src/app/api/cron/scheduled-reports "${base}/src/app/api/customers/[id]/gdpr-delete"`);

      console.log(`\n=== Uploading dynamic version files to ${base} ===`);
      await writeFile(`${base}/src/app/page.tsx`, 'src/app/page.tsx');
      await writeFile(`${base}/src/app/api/version/route.ts`, 'src/app/api/version/route.ts');
      await writeFile(`${base}/src/middleware.ts`, 'src/middleware.ts');
      await writeFile(`${base}/package.json`, 'package.json');
      await writeFile(`${base}/next.config.ts`, 'next.config.ts');
      await writeFile(`${base}/src/app/globals.css`, 'src/app/globals.css');
      await writeFile(`${base}/src/app/company-setup/page.tsx`, 'src/app/company-setup/page.tsx');
      await writeFile(`${base}/src/app/ice/page.tsx`, 'src/app/ice/page.tsx');
      await writeFile(`${base}/src/app/api/ice/desktop-register/route.ts`, 'src/app/api/ice/desktop-register/route.ts');
      await writeFile(`${base}/src/app/api/ice/desktop-licenses/route.ts`, 'src/app/api/ice/desktop-licenses/route.ts');
      await writeFile(`${base}/src/app/updates/desktop/[file]/route.ts`, 'src/app/updates/desktop/[file]/route.ts');
      await writeFile(`${base}/src/app/api/demo/enter/route.ts`, 'src/app/api/demo/enter/route.ts');

      // === Gap Closure — New Libraries ===
      await writeFile(`${base}/src/lib/hijri.ts`, 'src/lib/hijri.ts');
      await writeFile(`${base}/src/lib/costing.ts`, 'src/lib/costing.ts');
      await writeFile(`${base}/src/lib/encryption.ts`, 'src/lib/encryption.ts');
      await writeFile(`${base}/src/lib/mrp-engine.ts`, 'src/lib/mrp-engine.ts');

      // === Gap Closure — New APIs ===
      await writeFile(`${base}/src/app/api/vendor-ratings/route.ts`, 'src/app/api/vendor-ratings/route.ts');
      await writeFile(`${base}/src/app/api/fiscal-periods/route.ts`, 'src/app/api/fiscal-periods/route.ts');
      await writeFile(`${base}/src/app/api/work-shifts/route.ts`, 'src/app/api/work-shifts/route.ts');
      await writeFile(`${base}/src/app/api/reports/cash-flow/route.ts`, 'src/app/api/reports/cash-flow/route.ts');
      await writeFile(`${base}/src/app/api/reports/what-if/route.ts`, 'src/app/api/reports/what-if/route.ts');
      await writeFile(`${base}/src/app/api/banks/import/route.ts`, 'src/app/api/banks/import/route.ts');
      await writeFile(`${base}/src/app/api/field-service/route.ts`, 'src/app/api/field-service/route.ts');
      await writeFile(`${base}/src/app/api/cron/scheduled-reports/route.ts`, 'src/app/api/cron/scheduled-reports/route.ts');
      await writeFile(`${base}/src/app/api/customers/[id]/gdpr-delete/route.ts`, 'src/app/api/customers/[id]/gdpr-delete/route.ts');

      // === Integration — Modified Existing Files ===
      await ssh(`mkdir -p ${base}/src/app/api/inventory/costing ${base}/src/components`);
      await writeFile(`${base}/src/app/(dashboard)/layout.tsx`, 'src/app/(dashboard)/layout.tsx');
      await writeFile(`${base}/src/components/HijriDate.tsx`, 'src/components/HijriDate.tsx');
      await writeFile(`${base}/src/app/api/employees/route.ts`, 'src/app/api/employees/route.ts');
      await writeFile(`${base}/src/app/api/manufacturing/orders/route.ts`, 'src/app/api/manufacturing/orders/route.ts');
      await writeFile(`${base}/src/app/api/inventory/costing/route.ts`, 'src/app/api/inventory/costing/route.ts');

      // === Updated Schema ===
      await writeFile(`${base}/prisma/schema.prisma`, 'prisma/schema.prisma');
      
      console.log(`\n=== Building Next.js for ${base} ===`);
      await ssh(`cd ${base} && rm -rf .next && npm run build`);
  }
  
  console.log(`\n=== Restarting PM2 ===`);
  await ssh(`pm2 restart main-site && pm2 restart saas-app`);
  
  console.log('\n=== Done ===');
})();
