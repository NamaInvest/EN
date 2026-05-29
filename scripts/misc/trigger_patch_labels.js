const { Client } = require('ssh2');
const fs = require('fs');

const config = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: 'process.env.SSH_PASSWORD',
    readyTimeout: 30000
};

const scriptCode = `
const fs = require('fs');

function patch(file, keys, vals) {
    if (!fs.existsSync(file)) return;
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    for (let i = 0; i < keys.length; i++) {
        data[keys[i]] = vals[i];
    }
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
    console.log('Patched ' + file);
}

patch('/www/wwwroot/n11.namainvist.com/src/locales/ar.json', 
    ['i.purchases_options', 'i.manual_purchases'], 
    ['خيارات المشتريات', 'فواتير المشتريات اليدوية']);
    
patch('/www/wwwroot/n11.namainvist.com/src/locales/en.json', 
    ['i.purchases_options', 'i.manual_purchases'], 
    ['Purchases Options', 'Manual Purchases']);

// Also patch the Sidebar labels directly just in case (the LABELS dictionary)
const sidebarPath = '/www/wwwroot/n11.namainvist.com/src/components/Sidebar.tsx';
let sb = fs.readFileSync(sidebarPath, 'utf8');
if (!sb.includes("'i.purchases_options':")) {
  sb = sb.replace("'i.sales_options': 'خيارات المبيعات',", "'i.sales_options': 'خيارات المبيعات',\\n    'i.purchases_options': 'خيارات المشتريات', 'i.manual_purchases': 'فواتير المشتريات اليدوية',");
  sb = sb.replace("'i.sales_options': 'Sales Options',", "'i.sales_options': 'Sales Options',\\n    'i.purchases_options': 'Purchases Options', 'i.manual_purchases': 'Manual Purchases',");
  fs.writeFileSync(sidebarPath, sb, 'utf8');
  console.log('Patched Sidebar labels');
}

// Build Next.js
const { execSync } = require('child_process');
console.log('Building Next.js... (this takes ~30 seconds)');
execSync('cd /www/wwwroot/n11.namainvist.com && npm run build', { stdio: 'inherit' });
console.log('Restarting PM2...');
execSync('pm2 restart n11', { stdio: 'inherit' });
`;

fs.writeFileSync('c:\\Users\\1\\Desktop\\alfa\\patch_missing_labels.js', scriptCode, 'utf8');

const conn = new Client();
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        sftp.fastPut('c:\\Users\\1\\Desktop\\alfa\\patch_missing_labels.js', '/tmp/patch_missing_labels.js', (err) => {
            if (err) throw err;
            conn.exec('node /tmp/patch_missing_labels.js', (err, stream) => {
                stream.on('close', () => {
                    conn.end();
                    console.log('🏁 Label patches finished.');
                }).on('data', (d) => process.stdout.write(d.toString()))
                  .stderr.on('data', (d) => process.stderr.write(d.toString()));
            });
        });
    });
}).on('error', console.error).connect(config);
