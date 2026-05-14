const fs = require('fs');
const path = require('path');

function replaceModels(filePath) {
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace model names
  content = content.replace(/prisma\.adminUser/g, 'prisma.iceAdmin');
  content = content.replace(/prisma\.adminAuditLog/g, 'prisma.iceAuditLog');
  content = content.replace(/prisma\.subscriptionInvoice/g, 'prisma.iceSubscriptionInvoice');
  content = content.replace(/prisma\.desktopLicense/g, 'prisma.iceDesktopLicense');
  content = content.replace(/prisma\.systemModule/g, 'prisma.iceSystemModule');
  content = content.replace(/prisma\.tenantSubscription/g, 'prisma.iceTenantSubscription');
  content = content.replace(/prisma\.supportTicket/g, 'prisma.iceSupportTicket');
  content = content.replace(/prisma\.systemSetting/g, 'prisma.iceSystemSetting');
  content = content.replace(/prisma\.adminLoginLog/g, 'prisma.iceLoginLog');

  fs.writeFileSync(filePath, content);
}

const filesToUpdate = [
  'src/app/ice/page.tsx',
  'src/app/ice/admins/page.tsx',
  'src/app/ice/audit/page.tsx',
  'src/app/ice/billing/page.tsx',
  'src/app/ice/licenses/page.tsx',
  'src/app/ice/modules/page.tsx',
  'src/app/ice/support/page.tsx',
  'src/app/ice/tenants/page.tsx',
  'src/app/ice/settings/page.tsx',
  'src/app/api/ice/auth/login/route.ts'
];

filesToUpdate.forEach(file => {
  const fullPath = path.join('d:/namasoft9-3-main', file);
  replaceModels(fullPath);
  console.log(`Updated ${file}`);
});
