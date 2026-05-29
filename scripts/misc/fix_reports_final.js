const { Client } = require('ssh2'); 
const conn = new Client(); 
conn.on('ready', () => { 
  const scriptContent = `
const fs = require('fs');
const path = '/www/wwwroot/n11.namainvist.com/src/app/(dashboard)/reports/page.tsx';
let txt = fs.readFileSync(path, 'utf8');

txt = txt.replace(/'sys.str_4294'/g, "'ملخص يومي للمبيعات'");
txt = txt.replace(/'sys.str_4295'/g, "'فواتير المبيعات'");
txt = txt.replace(/'sys.str_4296'/g, "'فواتير الموردين'");
txt = txt.replace(/'sys.str_4297'/g, "'إيرادات - تكلفة يومياً'");
txt = txt.replace(/'sys.str_4298'/g, "'كل المنتجات + كميات + قيمة'");
txt = txt.replace(/'sys.str_4299'/g, "'من عدّل المخزون ومتى وكم'");
txt = txt.replace(/'sys.str_4300'/g, "'حسب الفئة'");
txt = txt.replace(/'sys.str_4301'/g, "'أرصدة + أنواع'");
txt = txt.replace(/'sys.str_4302'/g, "'ضريبة محصّلة - مدفوعة = مستحقة'");
txt = txt.replace(/'sys.str_4303'/g, "'من عمل التخفيض وكم ومتى'");
txt = txt.replace(/'sys.str_4304'/g, "'منتجات لم تُباع خلال 30/60/90 يوم'");
txt = txt.replace(/'sys.str_4305'/g, "'مبيعات + مشتريات + مصروفات'");
txt = txt.replace(/'sys.str_4306'/g, "'إيرادات - تكلفة = صافي ربح'");
txt = txt.replace(/'sys.str_4307'/g, "'أعلى 20 منتج'");
txt = txt.replace(/'sys.str_4308'/g, "'لكل صنف'");
txt = txt.replace(/'sys.str_4309'/g, "'تصنيف 30/60/90+ يوم'");

fs.writeFileSync(path, txt);
  `;
  conn.exec(`node -e "${scriptContent.replace(/"/g, '\\"')}" && cd /www/wwwroot/n11.namainvist.com && pm2 stop n11 && rm -rf .next && npm run build && pm2 start n11 --update-env`, (err, stream) => { 
      stream.on('close', () => conn.end()).on('data', d => process.stdout.write(d.toString())); 
      stream.stderr.on('data', d => process.stderr.write(d.toString()));
  }); 
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD'});
