const { PrismaClient } = require('@prisma/client');

async function fix() {
  const prisma = new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL || 'postgresql://nama:NamaLocal2026!@localhost:5433/nama_local' } }
  });

  try {
    await prisma.setting.upsert({
      where: { key: 'company_name' },
      update: { value: 'نما إنفست' },
      create: { key: 'company_name', value: 'نما إنفست' },
    });
    await prisma.setting.upsert({
      where: { key: 'company_name_ar' },
      update: { value: 'نما إنفست' },
      create: { key: 'company_name_ar', value: 'نما إنفست' },
    });
    await prisma.setting.upsert({
      where: { key: 'company_name_en' },
      update: { value: 'Nama Invest ERP' },
      create: { key: 'company_name_en', value: 'Nama Invest ERP' },
    });
    console.log('Done!');
    const s = await prisma.setting.findMany({ where: { key: { startsWith: 'company' } } });
    s.forEach(x => console.log(x.key, '=', x.value));
  } catch (e) { console.error(e.message); }
  await prisma.$disconnect();
}
fix();
