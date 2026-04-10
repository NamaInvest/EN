
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

patch('/www/wwwroot/n11.namainvist.com/src/locales/ar.json', ['sys.str_3501', 'sys.str_3502'], ['الموقع (Location)', 'تحديث الموقع']);
patch('/www/wwwroot/n11.namainvist.com/src/locales/en.json', ['sys.str_3501', 'sys.str_3502'], ['Location', 'Update Location']);

// Now patch Sidebar.tsx
const sidebarPath = '/www/wwwroot/n11.namainvist.com/src/components/Sidebar.tsx';
let sb = fs.readFileSync(sidebarPath, 'utf8');
sb = sb.replace("module: 'reports' }", "module: 'purchases' }");
fs.writeFileSync(sidebarPath, sb, 'utf8');
console.log('Patched Sidebar.tsx');

// Now build Next.js
const { execSync } = require('child_process');
console.log('Building Next.js... (this takes ~30 seconds)');
execSync('cd /www/wwwroot/n11.namainvist.com && npm run build', { stdio: 'inherit' });
console.log('Restarting PM2...');
execSync('pm2 restart n11', { stdio: 'inherit' });
