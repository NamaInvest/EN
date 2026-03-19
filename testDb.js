const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function check() {
  try {
    const start = Date.now();
    const count = await p.category.count();
    console.log(`DB OK: Connected to live database in ${Date.now()-start}ms. Category Count: ${count}`);
    
    const settingsCount = await p.settingItem.count();
    console.log(`DB OK: Settings Count: ${settingsCount}`);
  } catch (e) {
    console.error('DB ERROR:', e.message);
  } finally {
    await p.$disconnect();
  }
}

check();
