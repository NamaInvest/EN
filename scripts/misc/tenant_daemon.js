const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const fs = require('fs');

const prisma = new PrismaClient();
const BASE_DOMAIN = 'namainvist.com';
const MASTER_DIR = `/www/wwwroot/${BASE_DOMAIN}`;

async function runDaemon() {
    console.log('[DAEMON] Sleeping 10s... Check for pending SaaS instances.');
    
    try {
        const pendingTenants = await prisma.tenantAccount.findMany({
            where: { status: 'pending' },
            orderBy: { createdAt: 'asc' }
        });

        for (const tenant of pendingTenants) {
            console.log(`\n==============================================`);
            console.log(`[DAEMON] 🚀 DETECTED NEW TENANT RECORD!`);
            console.log(`[DAEMON] User: ${tenant.userEmail}`);
            console.log(`[DAEMON] Target Subdomain: ${tenant.subdomain}`);
            console.log(`[DAEMON] Org Name: ${tenant.orgName}`);
            
            const targetDir = `/www/wwwroot/${tenant.subdomain}.${BASE_DOMAIN}`;
            const targetPort = 3000 + parseInt(tenant.subdomain.replace('n', '')); // e.g. n11 -> 3011
            
            console.log(`[DAEMON] Cloning filesystem to ${targetDir}...`);
            execSync(`cp -r ${MASTER_DIR} ${targetDir}`);

            console.log(`[DAEMON] Configuring Environment Variables for Port ${targetPort}...`);
            const envContent = `DATABASE_URL="file:./data.db"
DIRECT_URL="file:./data.db"
PORT=${targetPort}
NODE_ENV="production"
`;
            fs.writeFileSync(`${targetDir}/.env`, envContent);

            console.log(`[DAEMON] Regenerating isolated Prisma SQLite Engine...`);
            execSync(`cd ${targetDir} && npx prisma generate --schema=prisma/schema.standalone.prisma`);
            execSync(`cd ${targetDir} && npx prisma db push --schema=prisma/schema.standalone.prisma --accept-data-loss`);

            console.log(`[DAEMON] Natively injecting ZATCA settings into Tenant SQLite DB...`);
            const injectionScript = `
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function inject() {
    await p.setting.upsert({ where: { key: 'company_name' }, update: { value: '${tenant.orgName}' }, create: { key: 'company_name', value: '${tenant.orgName}' }});
    await p.setting.upsert({ where: { key: 'vat_number' }, update: { value: '${tenant.vatNumber}' }, create: { key: 'vat_number', value: '${tenant.vatNumber}' }});
    console.log('✅ SQLite Tenant Variables Written!');
}
inject().then(() => p.$disconnect());
            `;
            fs.writeFileSync(`${targetDir}/seed_tenant.js`, injectionScript);
            execSync(`cd ${targetDir} && node seed_tenant.js`);

            console.log(`[DAEMON] Building Next.js Production Turbopack...`);
            // To save time in automated deployment, we bypass heavy build if we copy already-built files.
            // But we must rebuild to ensure env vars take effect.
            execSync(`cd ${targetDir} && npm run build`);

            console.log(`[DAEMON] Spawning PM2 Daemon ${tenant.subdomain}...`);
            execSync(`cd ${targetDir} && pm2 start npm --name "nama_${tenant.subdomain}" -- run start -- -p ${targetPort}`);
            execSync(`pm2 save`);

            console.log(`[DAEMON] Configuring NGINX Subdomain Router...`);
            const nginxConfig = `
server {
    listen 80;
    server_name ${tenant.subdomain}.${BASE_DOMAIN};
    location / {
        proxy_pass http://127.0.0.1:${targetPort};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
`;
            fs.writeFileSync(`/www/server/panel/vhost/nginx/${tenant.subdomain}.${BASE_DOMAIN}.conf`, nginxConfig);
            execSync(`service nginx reload`);

            console.log(`[DAEMON] Finalizing Master Tracking Entry...`);
            await prisma.tenantAccount.update({
                where: { id: tenant.id },
                data: { status: 'active' }
            });
            console.log(`[DAEMON] ✅ ZERO-TOUCH PROVISIONING COMPLETE FOR ${tenant.subdomain}`);
        }
    } catch (e) {
        console.error('[DAEMON] CRITICAL FAILURE:', e);
    }
}

// Supervisor loop
setInterval(runDaemon, 10000);
console.log('--- NAMA_INVEST ROOT PROVISIONING DAEMON INITIALIZED ---');
runDaemon();
