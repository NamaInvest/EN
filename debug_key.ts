import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const setting = await prisma.setting.findUnique({ where: { key: 'gemini_api_key' } });
        console.log('CURRENT DB KEY:', setting?.value || "NULL");
        
        // Also run the API check on whatever key is found
        if (setting?.value) {
            const https = require('https');
            const req = https.request(`https://generativelanguage.googleapis.com/v1beta/models?key=${setting.value}`, {
                method: 'GET'
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    console.log(`\nGoogle API Verification for this key:\nStatus: ${res.statusCode}`);
                    const json = JSON.parse(data);
                    if (json.error) console.log('Error:', json.error.message);
                    else console.log('✅ Key is fully valid and authorized.');
                });
            });
            req.end();
        }
    } catch (e) {
        console.error('❌ Error reading DB:', e);
    } finally {
        // Disconnect immediately after query
        setTimeout(() => prisma.$disconnect(), 1000);
    }
}

main();
