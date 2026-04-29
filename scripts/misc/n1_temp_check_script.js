
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
