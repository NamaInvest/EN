import fs from 'fs';
import path from 'path';

const fixes = [
  {
    file: 'src/app/api/accounting/year-end/[runId]/reports/route.ts',
    replacements: [
      { from: 'nameAr: true', to: 'nameEn: true' }
    ]
  },
  {
    file: 'src/app/api/accounting/statement/route.ts',
    replacements: [
      { from: 'nameAr: true', to: 'nameEn: true' },
      { from: 'name:       entity.nameAr ?? entity.name', to: 'name:       entity.name' },
      { from: 'name: entity.nameAr ?? entity.name', to: 'name: entity.name' }
    ]
  },
  {
    file: 'src/app/api/accounting/opening-balances/route.ts',
    replacements: [
      { from: 'nameAr: true', to: 'nameEn: true' },
      { from: 'nameAr ?? a.name', to: 'name ?? a.nameEn' }
    ]
  },
  {
    file: 'src/app/api/accounting/inventory-valuation-snapshot/route.ts',
    replacements: [
      { from: 'nameAr: true', to: 'nameEn: true' },
      { from: 'nameAr ?? prod.name', to: 'name' }
    ]
  },
  {
    file: 'src/app/api/accounting/gr-ir-clearing/route.ts',
    replacements: [
      { from: 'nameAr: true', to: 'nameEn: true' },
      { from: "supplier?.nameAr ?? grObj?.purchaseOrder?.supplier?.name", to: "supplier?.name" }
    ]
  },
  {
    file: 'src/app/api/accounting/cost-center-report/route.ts',
    replacements: [
      { from: 'name:         cc.nameAr ?? cc.name', to: 'name:         cc.name' },
      { from: 'nameAr: true', to: 'nameEn: true' }
    ]
  },
  {
    file: 'src/app/api/accounting/collection-workflow/route.ts',
    replacements: [
      { from: 'nameAr: true', to: 'nameEn: true' },
      { from: 'customerName:    inv.customer?.nameAr ?? inv.customer?.name', to: 'customerName:    inv.customer?.name' }
    ]
  },
  {
    file: 'src/app/api/accounting/chart-of-accounts-import/route.ts',
    replacements: [
      { from: 'nameAr:', to: 'name:' },
      { from: 'name:', to: 'nameEn:' }, // Wait, if I do this I will replace the one I just replaced! Let's do it smarter.
    ]
  },
  {
    file: 'src/app/api/accounting/aging/route.ts',
    replacements: [
      { from: 'entity.name ?? entity.nameAr', to: 'entity.name ?? entity.nameEn' }
    ]
  },
  {
    file: 'src/app/api/accounting/accruals/route.ts',
    replacements: [
      { from: 'nameAr: true', to: 'nameEn: true' }
    ]
  }
];

for (const fix of fixes) {
  const filePath = path.join(process.cwd(), fix.file);
  if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    continue;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (fix.file.includes('chart-of-accounts-import')) {
     // Specific fix for chart of accounts import
     content = content.replace(/nameAr/g, 'name');
     // Be careful, 'name:' might be valid as it was 'name: a.name ?? a.nameAr'
     // I'll just change the text directly
     content = content.replace(/name:     acct\.name \?\? acct\.name/g, 'nameEn:   acct.nameEn ?? acct.name');
     content = content.replace(/name: a\.nameAr/g, 'name: a.name');
     content = content.replace(/name: data\.name/g, 'nameEn: data.nameEn');
     content = content.replace(/name:     z\.string/g, 'nameEn:   z.string');
     content = content.replace(/name: \{ contains: search \}/g, 'nameEn: { contains: search }');
  } else {
    for (const rep of fix.replacements) {
      content = content.replace(new RegExp(rep.from.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), rep.to);
    }
  }

  fs.writeFileSync(filePath, content);
  console.log('Fixed:', fix.file);
}
