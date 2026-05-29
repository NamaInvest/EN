const { Client } = require('ssh2');
const fs = require('fs');

const config = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: 'process.env.SSH_PASSWORD',
    readyTimeout: 30000
};

console.log('🔄 Patching locales on N11...');

const conn = new Client();
conn.on('ready', () => {
    // We will append to locales files using jq or sed.
    // Sed is easier. We will insert the key right after the opening brace.
    const run = (cmd) => new Promise((resolve) => {
        conn.exec(cmd, (err, stream) => {
            stream.on('close', resolve);
        });
    });

    const patch = async () => {
        // Add 3501, 3502 to ar.json
        await run(`sed -i '1 a "sys.str_3501": "الموقع (Location)",' /www/wwwroot/n11.namainvist.com/src/locales/ar.json`);
        await run(`sed -i '1 a "sys.str_3502": "تحديث الموقع",' /www/wwwroot/n11.namainvist.com/src/locales/ar.json`);
        
        // Add 3501, 3502 to en.json
        await run(`sed -i '1 a "sys.str_3501": "Location",' /www/wwwroot/n11.namainvist.com/src/locales/en.json`);
        await run(`sed -i '1 a "sys.str_3502": "Update Location",' /www/wwwroot/n11.namainvist.com/src/locales/en.json`);

        // Change the sidebar module for i.manual_purchases to purchases
        await run(`sed -i "s/module: 'reports' },/module: 'purchases' },/g" /www/wwwroot/n11.namainvist.com/src/components/Sidebar.tsx`);

        console.log('🏁 Patch complete. Running build...');
        
        conn.exec('cd /www/wwwroot/n11.namainvist.com && npm run build && pm2 restart n11', (err, stream) => {
            stream.on('close', () => {
                conn.end();
                console.log('✅ Build and restart completed.');
            }).on('data', (data) => process.stdout.write(data.toString()))
              .stderr.on('data', (data) => process.stderr.write(data.toString()));
        });
    };
    
    patch();
}).on('error', (err) => {
    console.error('❌ Error:', err);
}).connect(config);
