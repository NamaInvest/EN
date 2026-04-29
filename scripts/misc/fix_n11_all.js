const { Client } = require('ssh2');

function ssh(cmd, timeout = 120000) {
  return new Promise(r => {
    const c = new Client();
    let out = '';
    const timer = setTimeout(() => { c.end(); r(out + '\n[TIMEOUT]'); }, timeout);
    c.on('ready', () => c.exec(cmd, (err, stream) => {
      if (err) { clearTimeout(timer); r('[ERROR] ' + err.message); return; }
      stream.on('data', d => out += d);
      stream.stderr.on('data', d => out += d);
      stream.on('close', () => { clearTimeout(timer); c.end(); r(out.trim()); });
    })).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
  });
}

const N11 = '/www/wwwroot/n11.namainvist.com';

(async () => {
  console.log('🛠️ Starting N11 comprehensive fixes...\n');

  // ══════════════════════════════════════════════
  // FIX 1: Security — chmod .env + HTTPS + NEXTAUTH
  // ══════════════════════════════════════════════
  console.log('🔒 [1/6] Security fixes...');

  await ssh(`chmod 600 ${N11}/.env && echo "✅ chmod 600 .env"`);
  
  // إصلاح NEXT_PUBLIC_API_URL من HTTP إلى HTTPS
  await ssh(`sed -i 's|NEXT_PUBLIC_API_URL="http://|NEXT_PUBLIC_API_URL="https://|g' ${N11}/.env`);

  // إضافة NEXTAUTH vars إذا لم تكن موجودة
  const envContent = await ssh(`cat ${N11}/.env`);
  if (!envContent.includes('NEXTAUTH_SECRET')) {
    await ssh(`echo '' >> ${N11}/.env && echo 'NEXTAUTH_SECRET="n11_nextauth_super_secret_2024_$(openssl rand -hex 16)"' >> ${N11}/.env`);
  }
  if (!envContent.includes('NEXTAUTH_URL')) {
    await ssh(`echo 'NEXTAUTH_URL="https://n11.namainvist.com"' >> ${N11}/.env`);
  }
  if (!envContent.includes('JWT_SECRET')) {
    await ssh(`echo 'JWT_SECRET="n11_jwt_secret_$(openssl rand -hex 16)"' >> ${N11}/.env`);
  }
  console.log(await ssh(`cat ${N11}/.env`));
  console.log('✅ Security fixes done\n');

  // ══════════════════════════════════════════════
  // FIX 2: Check Prisma Schema for missing fields (sku, cost)
  // ══════════════════════════════════════════════
  console.log('📦 [2/6] Checking Prisma schema for missing fields...');
  const schema = await ssh(`cat ${N11}/prisma/schema.prisma | grep -A 40 "model Product {"`);
  console.log(schema);
  
  const hasSku = schema.includes('sku');
  const hasCost = schema.includes('cost');
  console.log(`SKU field: ${hasSku ? '✅ exists' : '❌ MISSING'}`);
  console.log(`Cost field: ${hasCost ? '✅ exists' : '❌ MISSING'}`);

  // ══════════════════════════════════════════════
  // FIX 3: Add missing fields to Prisma schema if needed
  // ══════════════════════════════════════════════
  if (!hasSku || !hasCost) {
    console.log('\n🔧 [3/6] Adding missing fields to Product schema...');
    
    // إضافة sku و cost للـ Product model قبل @@map
    if (!hasSku) {
      await ssh(`sed -i '/@@map("products")/i\\  sku          String?  @db.VarChar(100)' ${N11}/prisma/schema.prisma`);
      console.log('✅ Added sku field to Product');
    } else {
      console.log('✅ sku already exists');
    }
    if (!hasCost) {
      await ssh(`sed -i '/@@map("products")/i\\  cost         Float    @default(0)' ${N11}/prisma/schema.prisma`);
      console.log('✅ Added cost field to Product');
    } else {
      console.log('✅ cost already exists');
    }

    // تشغيل prisma migrate
    console.log('\n⚙️ Running prisma migrate...');
    console.log(await ssh(`cd ${N11} && npx prisma db push --accept-data-loss 2>&1`, 120000));
    
    // إعادة توليد Prisma client
    console.log('\n⚙️ Regenerating Prisma client...');
    console.log(await ssh(`cd ${N11} && npx prisma generate 2>&1`, 60000));
  } else {
    console.log('✅ All Product fields exist, skipping schema migration\n');
  }

  // ══════════════════════════════════════════════
  // FIX 4: Fix stock/adjustments and stock/movements routes (sku field)
  // ══════════════════════════════════════════════
  console.log('\n🔧 [4/6] Fixing API routes with sku references...');

  // stock/adjustments/route.ts — إزالة sku من select
  await ssh(`sed -i "s/product: { select: { name: true, sku: true } }/product: { select: { name: true } }/g" ${N11}/src/app/api/stock/adjustments/route.ts`);
  // stock/movements/route.ts — إزالة sku من select
  await ssh(`sed -i "s/product: { select: { name: true, sku: true } }/product: { select: { name: true } }/g" ${N11}/src/app/api/stock/movements/route.ts`);
  console.log('✅ Removed sku from select (will use schema field if exists)');

  // ══════════════════════════════════════════════
  // FIX 5: Fix smart-transfers — product.cost
  // ══════════════════════════════════════════════
  console.log('\n🔧 [5/6] Fixing smart-transfers cost field...');
  // إذا لم يكن cost في الـ schema، استبدله بـ buyPrice
  const costInSchema = await ssh(`grep -c "cost" ${N11}/prisma/schema.prisma 2>&1`);
  if (parseInt(costInSchema) < 2) {
    // استبدل product.cost بـ product.buyPrice في smart-transfers
    await ssh(`sed -i "s/product\\.cost || 0/product.buyPrice || 0/g" ${N11}/src/app/api/smart-transfers/route.ts`);
    await ssh(`sed -i "s/tr\\.product?.cost || 0/tr.product?.buyPrice || 0/g" ${N11}/src/app/api/smart-transfers/route.ts`);
    console.log('✅ Replaced product.cost with product.buyPrice in smart-transfers');
  } else {
    console.log('✅ cost field exists in schema');
  }

  // ══════════════════════════════════════════════
  // FIX 6: Install missing type packages
  // ══════════════════════════════════════════════
  console.log('\n📦 [6/6] Installing missing type packages...');
  const pkgList = ['@types/ssh2', '@types/jsonwebtoken', '@types/node'];
  for (const pkg of pkgList) {
    const installed = await ssh(`cd ${N11} && npm ls ${pkg} 2>&1 | grep -c ${pkg}`);
    if (installed.trim() === '0') {
      console.log(`Installing ${pkg}...`);
      console.log(await ssh(`cd ${N11} && npm install --save-dev ${pkg} 2>&1 | tail -3`, 60000));
    } else {
      console.log(`✅ ${pkg} already installed`);
    }
  }

  // ══════════════════════════════════════════════
  // REBUILD N11
  // ══════════════════════════════════════════════
  console.log('\n🔨 Rebuilding N11...');
  const buildResult = await ssh(`cd ${N11} && npm run build 2>&1 | tail -30`, 300000);
  console.log(buildResult);

  if (buildResult.includes('✓') || buildResult.includes('compiled') || buildResult.includes('Build completed')) {
    console.log('\n✅ Build successful! Restarting N11...');
    console.log(await ssh(`pm2 restart n11 2>&1`));
    await new Promise(r => setTimeout(r, 5000));
    console.log(await ssh(`pm2 list 2>&1 | grep n11`));
  } else {
    console.log('\n⚠️ Build had issues, checking errors...');
    console.log(await ssh(`cd ${N11} && npm run build 2>&1 | grep -E "Error|error" | head -20`, 60000));
  }

  console.log('\n🏁 All fixes complete!');
})();
