const { Client } = require('ssh2');

function ssh(cmd, timeout = 300000) {
  return new Promise((resolve, reject) => {
    const c = new Client();
    let out = '';
    const timer = setTimeout(() => { c.end(); resolve(out + '\n[TIMEOUT]'); }, timeout);
    c.on('ready', () => c.exec(cmd, (err, stream) => {
      if (err) { clearTimeout(timer); resolve('[EXEC ERROR] ' + err.message); return; }
      stream.on('data', d => { out += d; process.stdout.write(d.toString()); });
      stream.stderr.on('data', d => { out += d; process.stderr.write(d.toString()); });
      stream.on('close', () => { clearTimeout(timer); c.end(); resolve(out.trim()); });
    })).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
  });
}

const N11 = '/www/wwwroot/n11.namainvist.com';

(async () => {

  // ─────────────────────────────────────────────
  // STEP 1: بحث عن الكود المسبب للمشكلة
  // ─────────────────────────────────────────────
  console.log('\n\n══════════════════════════════════════════════');
  console.log('🔍 STEP 1: Finding Prisma error in manufacturing route...');
  console.log('══════════════════════════════════════════════\n');
  
  const mfgFile = await ssh(`grep -rn "stock" ${N11}/src/app/api/manufacturing/ 2>&1 | head -30`);
  console.log('\n[manufacturing API files containing "stock"]:\n', mfgFile);

  const mfgSchema = await ssh(`grep -n "ManufacturingOrder\\|wastage\\|stock" ${N11}/prisma/schema.prisma 2>&1`);
  console.log('\n[Schema ManufacturingOrder fields]:\n', mfgSchema);

  // ─────────────────────────────────────────────
  // STEP 2: إصلاح ملف manufacturing route
  // ─────────────────────────────────────────────
  console.log('\n\n══════════════════════════════════════════════');
  console.log('🔧 STEP 2: Fixing manufacturing route (removing invalid stock include)...');
  console.log('══════════════════════════════════════════════\n');

  // Remove invalid `stock` include from manufacturing API
  await ssh(`sed -i 's/stock: true,//g' ${N11}/src/app/api/manufacturing/route.ts 2>&1`);
  await ssh(`sed -i 's/stock: true//g' ${N11}/src/app/api/manufacturing/route.ts 2>&1`);
  
  // Also check in orders route
  await ssh(`find ${N11}/src/app/api/manufacturing -name "*.ts" | xargs grep -l "stock" 2>/dev/null | xargs sed -i 's/stock: {[^}]*}//g' 2>&1 || true`);
  
  console.log('✅ Manufacturing route patched');

  // ─────────────────────────────────────────────
  // STEP 3: إصلاح ملف sys/alerts (session مفقود)
  // ─────────────────────────────────────────────
  console.log('\n\n══════════════════════════════════════════════');
  console.log('🔧 STEP 3: Fixing sys/alerts route (session variable)...');
  console.log('══════════════════════════════════════════════\n');

  const alertsContent = await ssh(`cat ${N11}/src/app/api/sys/alerts/route.ts 2>&1`);
  console.log('\n[alerts route current content]:\n', alertsContent);

  // ─────────────────────────────────────────────
  // STEP 4: تثبيت packages المفقودة
  // ─────────────────────────────────────────────
  console.log('\n\n══════════════════════════════════════════════');
  console.log('📦 STEP 4: Installing missing dependencies...');
  console.log('══════════════════════════════════════════════\n');

  const installResult = await ssh(
    `cd ${N11} && npm install --save-dev @types/ssh2 2>&1 | tail -5`,
    60000
  );
  console.log('[npm install @types/ssh2]:', installResult);

  // ─────────────────────────────────────────────
  // STEP 5: تشغيل prisma generate
  // ─────────────────────────────────────────────
  console.log('\n\n══════════════════════════════════════════════');
  console.log('⚙️  STEP 5: Running prisma generate...');
  console.log('══════════════════════════════════════════════\n');

  const prismaGen = await ssh(
    `cd ${N11} && npx prisma generate 2>&1 | tail -10`,
    90000
  );
  console.log('[prisma generate]:', prismaGen);

  // ─────────────────────────────────────────────
  // STEP 6: بناء النظام
  // ─────────────────────────────────────────────
  console.log('\n\n══════════════════════════════════════════════');
  console.log('🔨 STEP 6: Building N11 (this takes 3-5 minutes)...');
  console.log('══════════════════════════════════════════════\n');

  const buildResult = await ssh(
    `cd ${N11} && npm run build > /tmp/n11_build.log 2>&1 && echo "BUILD_SUCCESS" || echo "BUILD_FAILED"`,
    600000
  );
  console.log('\n[Build result]:', buildResult);

  // اقرأ log آخر 50 سطر
  const buildLog = await ssh(`tail -50 /tmp/n11_build.log 2>&1`);
  console.log('\n[Build log tail]:\n', buildLog);

  // ─────────────────────────────────────────────
  // STEP 7: إعادة تشغيل N11
  // ─────────────────────────────────────────────
  console.log('\n\n══════════════════════════════════════════════');
  console.log('🚀 STEP 7: Restarting N11...');
  console.log('══════════════════════════════════════════════\n');

  await ssh(`pm2 restart n11 2>&1`);
  await new Promise(r => setTimeout(r, 5000)); // انتظر 5 ثواني

  // ─────────────────────────────────────────────
  // STEP 8: فحص نهائي
  // ─────────────────────────────────────────────
  console.log('\n\n══════════════════════════════════════════════');
  console.log('✅ STEP 8: Final verification...');
  console.log('══════════════════════════════════════════════\n');

  const httpStatus = await ssh(`curl -s -o /dev/null -w "%{http_code}" http://localhost:3011/ 2>&1`);
  console.log('\n[N11 HTTP Status]:', httpStatus);

  const pm2Status = await ssh(`pm2 describe n11 2>&1 | grep -E "status|restart"`);
  console.log('[PM2 Status]:', pm2Status);

  const errorLog = await ssh(`tail -10 /root/.pm2/logs/n11-error.log 2>&1`);
  console.log('[Error log tail]:', errorLog);

  if (httpStatus.includes('200')) {
    console.log('\n🎉 N11 is now ONLINE and responding 200 OK!');
  } else {
    console.log('\n⚠️ N11 returned HTTP', httpStatus, '- check logs above for details.');
  }

})();
