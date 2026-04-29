const { execSync } = require('child_process');

const injectJs = `
const { PrismaClient } = require(process.cwd() + '/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function upsertSetting(key, value) {
    if (value === undefined || value === null || value === '') return;
    await prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) }
    });
}

async function run() {
    await upsertSetting('companyNameAr', 'شركة اختبار');
    await upsertSetting('companyNameEn', 'Test Company');
    await upsertSetting('vatNumber',     '312345678912343');
    await upsertSetting('crNumber',      '7123456789');
    await upsertSetting('mobile',        '0500000000');
    await upsertSetting('address',       'Riyadh');
    await upsertSetting('posFooterText', 'Thank you for visiting');
    await upsertSetting('zatcaIndustry',     'Retail');
    await upsertSetting('zatcaCityEn',       'Riyadh');
    await upsertSetting('zatcaCityAr',       'الرياض');

    const trialEndMs = Date.now() + (5 * 24 * 60 * 60 * 1000);
    await upsertSetting('trialActive',      'true');
    await upsertSetting('trialEndsAt',      trialEndMs.toString());
    await upsertSetting('maxTrialInvoices', '30');
    await upsertSetting('tax_rate',         '15');
    await upsertSetting('POS_TAX_ENABLED',  'true');
    await upsertSetting('POS_TAX_INCLUSIVE', 'true');

    const bcrypt = require(process.cwd() + '/node_modules/bcryptjs');
    const adminHash = bcrypt.hashSync('admin', 10);
    await prisma.user.upsert({
        where:  { username: 'admin' },
        update: { passwordHash: adminHash, role: 'admin', active: true },
        create: {
            username:     'admin',
            fullName:     'مدير النظام',
            passwordHash: adminHash,
            role:         'admin',
            active:       true
        }
    });

    console.log('Settings Injected Successfully!');
}
run().catch(console.error).finally(() => prisma.$disconnect());
`;

const fs = require('fs');
fs.writeFileSync('/tmp/inject_manual.js', injectJs);

try {
    console.log('Running db push...');
    execSync('DATABASE_URL="postgresql://postgres:RootPassNama123@localhost:5432/namainvest_db?schema=public" npx --prefix /www/wwwroot/n11.namainvist.com prisma db push --schema=/www/wwwroot/n11.namainvist.com/prisma/schema.prisma --accept-data-loss', { stdio: 'inherit' });
    
    console.log('Running inject...');
    execSync('cd /www/wwwroot/n11.namainvist.com && DATABASE_URL="postgresql://postgres:RootPassNama123@localhost:5432/namainvest_db?schema=public" node /tmp/inject_manual.js', { stdio: 'inherit' });
} catch (e) {
    console.error(e);
}
