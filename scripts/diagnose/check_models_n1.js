const { Client } = require('ssh2');
const fs = require('fs');

const scriptContent = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'gemini_api_key' } });
    if(!setting || !setting.value) { console.log('NO KEY'); return; }
    const key = setting.value.trim().replace(/['"]/g, '');
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + key);
    const data = await res.json();
    if (data.error) {
       console.log('API Error:', data.error.message);
    } else if (data.models) {
       const supported = data.models.filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent') && m.name.includes('gemini'));
       console.log('Models supporting generateContent:', supported.map(m => m.name.split('/')[1]).join(', '));
       console.log('ALL models RAW:', data.models.map(m => m.name.split('/')[1]).join(', '));
    } else {
       console.log('Unknown response:', data);
    }
  } catch(e) {
    console.error(e.message);
  }
}
run();
`;

fs.writeFileSync('c:\\Users\\1\\Desktop\\alfa\\n1_temp_check_script.js', scriptContent);

const conn = new Client();
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        sftp.fastPut('c:\\Users\\1\\Desktop\\alfa\\n1_temp_check_script.js', '/www/wwwroot/n1.namainvist.com/n1_temp_check_script.js', (err) => {
            if (err) throw err;
            conn.exec('cd /www/wwwroot/n1.namainvist.com && node n1_temp_check_script.js', (err, stream) => {
                if (err) throw err;
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.stderr.on('data', d => process.stderr.write(d.toString()));
                stream.on('close', () => {
                    conn.end();
                });
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
