const { Client } = require('ssh2'); 
const fs = require('fs');

const conn = new Client(); 
conn.on('ready', () => { 
  const scriptContent = `
cd /www/wwwroot/n11.namainvist.com

# Apply the explicit arData import to reports/page.tsx to bypass useTranslation bugs
sed -i 's/import { useTranslation } from "@\\/lib\\/i18n";/import { useTranslation } from "@\\/lib\\/i18n";\\nimport arData from "..\\/..\\/..\\/locales\\/ar.json";\\nimport enData from "..\\/..\\/..\\/locales\\/en.json";/' src/app/\\(dashboard\\)/reports/page.tsx

sed -i 's/{t(r.label)}/{t(r.label) !== r.label ? t(r.label) : (t("sys.str_4278") === "⬅️ رجوع للتقارير" ? (enData as any)[r.label] : (arData as any)[r.label]) || r.label}/g' src/app/\\(dashboard\\)/reports/page.tsx

rm -rf .next
npm run build
pm2 restart n11 --update-env
  `;
  conn.exec(scriptContent, (err, stream) => { 
      stream.on('close', () => conn.end()).on('data', d => process.stdout.write(d.toString())); 
      stream.stderr.on('data', d => process.stderr.write(d.toString()));
  }); 
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD'});
