const { Client } = require('ssh2');
function ssh(cmd, timeout = 180000) {
  return new Promise(r => {
    const c = new Client(); let out = '';
    const t = setTimeout(() => { c.end(); r(out + '[TIMEOUT]'); }, timeout);
    c.on('ready', () => c.exec(cmd, (e, s) => {
      if (e) { clearTimeout(t); r('[ERR]'); return; }
      s.on('data', d => out += d); s.stderr.on('data', d => out += d);
      s.on('close', () => { clearTimeout(t); c.end(); r(out.trim()); });
    })).connect({ host:'46.4.188.170', port:22, username:'root', password:'_ee4SWbxLVfH9b' });
  });
}
const N11 = '/www/wwwroot/n11.namainvist.com';

async function uploadFile(remotePath, content) {
  const b64 = Buffer.from(content, 'utf8').toString('base64');
  const result = await ssh(`echo '${b64}' | base64 -d > '${remotePath}' && echo OK`);
  return result.includes('OK') ? `✅ ${remotePath.replace(N11,'')}` : `❌ ${result}`;
}

(async () => {
  const SEP = '\n' + '─'.repeat(55) + '\n';

  // اقرأ الملفات التي بها أخطاء
  console.log('Reading error files...');
  const attendancesContent = await ssh(`cat ${N11}/src/app/api/attendances/route.ts`);
  const notificationsContent = await ssh(`cat ${N11}/src/app/api/notifications/route.ts`);
  const wmsContent = await ssh(`cat ${N11}/src/app/api/enterprise/wms/route.ts`);
  const broadcastContent = await ssh(`cat ${N11}/src/app/api/crm/whatsapp/broadcast/route.ts`);
  const projectsTasksContent = await ssh(`cat ${N11}/src/app/api/enterprise/projects/tasks/route.ts`);
  const qualityContent = await ssh(`cat ${N11}/src/app/api/enterprise/quality/route.ts`);
  const legalContent = await ssh(`cat ${N11}/src/app/api/enterprise/legal/route.ts`);
  const loginContent = await ssh(`cat ${N11}/src/app/login/page.tsx | head -20`);
  const recurringContent = await ssh(`grep -n "auth\\.id\|JWTPayload\\.id" ${N11}/src/app/api/recurring-invoices/route.ts | head -5`);
  const zatcaErrors = await ssh(`cd ${N11} && npx tsc --noEmit 2>&1 | grep "zatca/route" | head -5`, 60000);
  
  console.log('Attendance errors:', (await ssh(`cd ${N11} && npx tsc --noEmit 2>&1 | grep "attendances" | head -5`, 60000)));
  console.log('Notifications errors:', (await ssh(`cd ${N11} && npx tsc --noEmit 2>&1 | grep "notifications" | head -5`, 60000)));
  console.log('WMS errors:', (await ssh(`cd ${N11} && npx tsc --noEmit 2>&1 | grep "wms" | head -10`, 60000)));
  console.log('Legal errors:', (await ssh(`cd ${N11} && npx tsc --noEmit 2>&1 | grep "legal" | head -5`, 60000)));
  console.log('Quality errors:', (await ssh(`cd ${N11} && npx tsc --noEmit 2>&1 | grep "quality" | head -5`, 60000)));
  console.log('Zatca errors:', zatcaErrors);
  console.log('Recurring errors:', recurringContent);
  
  console.log('\nWMS content:\n', wmsContent);
  console.log('\nLegal content first 30 lines:');
  console.log(await ssh(`head -40 ${N11}/src/app/api/enterprise/legal/route.ts`));
  console.log('\nQuality content:');
  console.log(await ssh(`cat ${N11}/src/app/api/enterprise/quality/route.ts`));
  console.log('\nBroadcast content first 60:');
  console.log(await ssh(`head -60 ${N11}/src/app/api/crm/whatsapp/broadcast/route.ts`));
  console.log('\nProjects tasks first 60:');
  console.log(await ssh(`head -60 ${N11}/src/app/api/enterprise/projects/tasks/route.ts`));
  console.log('\nRecurring invoices - auth lines:');
  console.log(await ssh(`grep -n "auth\|JWTPayload\|\.id" ${N11}/src/app/api/recurring-invoices/route.ts | head -20`));
  console.log('\nLogin page - signIn lines:');
  console.log(await ssh(`grep -n "signIn" ${N11}/src/app/login/page.tsx | head -10`));
  console.log('\nAttendance Prisma schema:');
  console.log(await ssh(`grep -A 20 "model Attendance {" ${N11}/prisma/schema.prisma`));
})();
