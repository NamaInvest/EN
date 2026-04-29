const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('Connected to N1 for checking Gemini Error...');
    
    // We will write a clean JS file to N1 and run it
    const script = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Checking DB...');
    const setting = await prisma.setting.findUnique({ where: { key: 'gemini_api_key' } });
    if (!setting || !setting.value) {
        console.log('No Gemini Key found in DB!');
        process.exit(1);
    }
    const key = setting.value.replace(/['"\\\\]/g, '').trim();
    console.log('Key length:', key.length, 'starts with:', key.substring(0, 10));
    
    const url = 'https://generativelanguage.googleapis.com/v1beta/models?key=' + key;
    try {
        const fetch = (await import('node-fetch')).default || require('node-fetch');
        const res = await fetch(url);
        const data = await res.json();
        console.log('STATUS:', res.status);
        console.log('JSON:', JSON.stringify(data.models ? data.models.map(m => m.name) : data, null, 2));
    } catch(e) {
        console.error('FETCH ERR:', e.message);
    }
}
main().catch(console.error).finally(() => prisma.$disconnect());
`;
    const escapedScript = Buffer.from(script).toString('base64');
    
    const cmd = `echo "${escapedScript}" | base64 -d > /www/wwwroot/n1.namainvist.com/test_gemini_raw.js && cd /www/wwwroot/n1.namainvist.com && node test_gemini_raw.js`;
    
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
