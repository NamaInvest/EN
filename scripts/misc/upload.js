const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const key = 'C:\\Users\\1\\Desktop\\namasoftkey\\namasoft_key';
const host = 'root@204.168.144.74';
const base = 'c:\\Users\\1\\Desktop\\alfa';

const filesToUpload = [
    { local: 'src/app/api/products/route.ts', remote: '/var/www/namasoft2/src/app/api/products/route.ts' },
    { local: 'src/app/api/products/[id]/route.ts', remote: '/var/www/namasoft2/src/app/api/products/[id]/route.ts' },
    { local: 'src/app/(dashboard)/products/page.tsx', remote: '/var/www/namasoft2/src/app/(dashboard)/products/page.tsx' },
    { local: 'src/app/api/sales/route.ts', remote: '/var/www/namasoft2/src/app/api/sales/route.ts' },
    { local: 'src/app/api/purchases/route.ts', remote: '/var/www/namasoft2/src/app/api/purchases/route.ts' },
    { local: 'scripts/seed-warehouses.ts', remote: '/var/www/namasoft2/scripts/seed-warehouses.ts' },
    { local: 'prisma/schema.prisma', remote: '/var/www/namasoft2/prisma/schema.prisma' }
];

for (const tf of filesToUpload) {
    const localFile = path.join(base, tf.local);
    console.log(`Uploading ${localFile}...`);
    // Create remote directory first to be safe
    const remoteDir = path.dirname(tf.remote);
    try {
        execSync(`ssh -o StrictHostKeyChecking=no -i "${key}" ${host} "mkdir -p '${remoteDir}'"`, { stdio: 'inherit' });
        execSync(`scp -o StrictHostKeyChecking=no -i "${key}" "${localFile}" ${host}:"${tf.remote}"`, { stdio: 'inherit' });
    } catch(e) {
        console.error(`Failed to upload ${tf.local}:`, e.message);
    }
}
console.log('Upload complete.');
