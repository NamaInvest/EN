const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Starting Database Name Update...');
    
    // 1. Update Settings table
    const settings = await prisma.setting.findMany();
    let settingsUpdated = 0;
    for (const s of settings) {
        if (s.value && (s.value.includes('Namasoft') || s.value.includes('NamaSoft') || s.value.includes('namasoft') || s.value.includes('نما سوفت'))) {
            let newVal = s.value
                .replace(/Namasoft/g, 'namainvist')
                .replace(/NamaSoft/g, 'namainvist')
                .replace(/namasoft/g, 'namainvist')
                .replace(/نما سوفت/g, 'نما إنفست');
            await prisma.setting.update({
                where: { key: s.key },
                data: { value: newVal }
            });
            settingsUpdated++;
            console.log(`Updated setting ${s.key}`);
        }
    }
    
    // 2. Update Company table
    const companies = await prisma.company.findMany();
    let companiesUpdated = 0;
    for (const c of companies) {
        if (c.name.includes('Namasoft') || c.name.includes('NamaSoft') || c.name.includes('namasoft') || c.name.includes('نما سوفت')) {
            let newVal = c.name
                .replace(/Namasoft/g, 'namainvist')
                .replace(/NamaSoft/g, 'namainvist')
                .replace(/namasoft/g, 'namainvist')
                .replace(/نما سوفت/g, 'نما إنفست');
            await prisma.company.update({
                where: { id: c.id },
                data: { name: newVal }
            });
            companiesUpdated++;
            console.log(`Updated company ${c.id}`);
        }
    }

    // 3. Update Branch table
    const branches = await prisma.branch.findMany();
    let branchesUpdated = 0;
    for (const b of branches) {
        if (b.name.includes('Namasoft') || b.name.includes('NamaSoft') || b.name.includes('namasoft') || b.name.includes('نما سوفت')) {
            let newVal = b.name
                .replace(/Namasoft/g, 'namainvist')
                .replace(/NamaSoft/g, 'namainvist')
                .replace(/namasoft/g, 'namainvist')
                .replace(/نما سوفت/g, 'نما إنفست');
            await prisma.branch.update({
                where: { id: b.id },
                data: { name: newVal }
            });
            branchesUpdated++;
            console.log(`Updated branch ${b.id}`);
        }
    }

    console.log(`Update Complete!`);
    console.log(`Settings updated: ${settingsUpdated}`);
    console.log(`Companies updated: ${companiesUpdated}`);
    console.log(`Branches updated: ${branchesUpdated}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
