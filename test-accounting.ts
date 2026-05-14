import fs from 'fs';

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInRlbmFudElkIjoiYWhtZWRhbHlhbWljb21wYW55Iiwicm9sZSI6ImFkbWluIiwiYWN0aXZlIjp0cnVlLCJpYXQiOjE3Nzg3Mjk3MjMsImV4cCI6MTc3ODczMzMyM30.zxW_TAXfGG2lyQ4pHCFeBxmdBkB3G-rumEA_rmW1Fj4';
const baseUrl = 'https://ahmedalyamicompany.namainvist.com/api/accounting';

const endpoints = [
  '/accounts',
  '/journals',
  '/trial-balance',
  '/profit-loss',
  '/balance-sheet',
  '/cost-centers',
  '/profit-centers',
  '/segments',
  '/books',
  '/opening-balances',
  '/aging',
  '/accruals',
  '/statement?type=CUSTOMER&entityId=1',
  '/collection-workflow'
];

async function run() {
  const report: string[] = [];
  report.push('# NamaSoft Accounting Endpoints Health Report\n');
  report.push('| Endpoint | Status | Message / Error |');
  report.push('|---|---|---|');

  for (const ep of endpoints) {
    try {
      const res = await fetch(`${baseUrl}${ep}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const status = res.status;
      let text = await res.text();
      let msg = '';
      
      try {
        const json = JSON.parse(text);
        if (status >= 400) {
           msg = JSON.stringify(json).substring(0, 100);
        } else {
           // Success
           msg = Array.isArray(json) ? `Success (${json.length} items)` : (json.error || json.message || 'Success (Object)');
        }
      } catch(e) {
        msg = `Text: ${text.substring(0, 100).replace(/\n/g, ' ')}`;
      }

      report.push(`| \`${ep}\` | ${status === 200 ? '✅ 200' : `❌ ${status}`} | ${msg} |`);
      console.log(`${ep} -> ${status}`);
    } catch (e: any) {
      report.push(`| \`${ep}\` | 🚨 FAIL | ${e.message} |`);
      console.log(`${ep} -> ERROR`);
    }
  }

  fs.writeFileSync('accounting-health-report.md', report.join('\n'));
  console.log('Report saved to accounting-health-report.md');
}

run();
