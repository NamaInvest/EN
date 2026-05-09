const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
const models = Object.keys(p).filter(k => !k.startsWith('_') && !k.startsWith('$'));
const expected = ['prescription', 'medicationLog', 'controlledDrugLog', 'pharmacyInsurance', 'manufacturingOrder'];
expected.forEach(m => {
  console.log(m + ':', models.includes(m) ? 'EXISTS in schema' : 'MISSING - keep @ts-ignore');
});
p.$disconnect().catch(() => {});
