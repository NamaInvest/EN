const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    const bashScript = `
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    try {
        const settings = await prisma.setting.findMany();
        const dict = {};
        settings.forEach(s => dict[s.key] = s.value);
        console.log('--- N2 ZATCA USER SETTINGS IN DB ---');
        console.log('VAT NUMBER:', dict.tax_number);
        console.log('CRN:', dict.zatca_crn);
        console.log('Company Name:', dict.company_name_en);
        console.log('City (EN):', dict.zatca_city_en);
        console.log('Street:', dict.zatca_street);
        console.log('Branch Name:', dict.branch_name_en);
    } catch(e) { console.error('DB ERROR:', e); } finally { await prisma.$disconnect(); }
}
main();
"
`;
    conn.exec(`cd /www/wwwroot/n2.namainvist.com && ${bashScript}`, (err, stream) => {
        if (err) throw err;
        let output = '';
        stream.on('close', () => {
            console.log(output);
            conn.end();
        }).on('data', data => output += data.toString());
    });
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD'});
