const { Client } = require('ssh2');

const filesToUpload = [
    { local: 'c:\\Users\\1\\Desktop\\alfa\\src\\app\\api\\products\\import\\route.ts', remotePath: 'src/app/api/products/import/route.ts' },
    { local: 'c:\\Users\\1\\Desktop\\alfa\\src\\app\\(dashboard)\\layout.tsx', remotePath: 'src/app/(dashboard)/layout.tsx' },
    { local: 'c:\\Users\\1\\Desktop\\alfa\\src\\components\\Providers.tsx', remotePath: 'src/components/Providers.tsx' },
    { local: 'c:\\Users\\1\\Desktop\\alfa\\src\\app\\restaurant-pos\\page.tsx', remotePath: 'src/app/restaurant-pos/page.tsx' },
];

console.log('🚀 Emergency Fast Deploy to Edge Node N10...');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('pm2 jlist', (err, stream) => {
        let output = '';
        stream.on('data', d => output += d);
        stream.on('close', async () => {
            let plist = [];
            try { plist = JSON.parse(output.substring(output.indexOf('['), output.lastIndexOf(']')+1)); } catch(e) {}
            
            let n10 = plist.find(p => p.name === 'n10');
            if(!n10) { console.log('❌ N10 NOT FOUND IN PM2'); conn.end(); return; }

            const pmCwd = n10.pm2_env.pm_cwd;
            conn.sftp(async (errSftp, sftp) => {
                for (let f of filesToUpload) {
                    await new Promise(r => sftp.fastPut(f.local, `${pmCwd}/${f.remotePath}`, r));
                    console.log(`📤 Uploaded ${f.remotePath}`);
                }
                
                console.log('🔄 Executing NPM Build & PM2 Restart on N10...');
                conn.exec(`cd ${pmCwd} && npm run build && pm2 restart n10`, (errExec, execStream) => {
                    execStream.on('data', d => process.stdout.write(d))
                              .stderr.on('data', d => process.stderr.write(d))
                              .on('close', (code) => {
                                  console.log(`✅ N10 Deploy Finished with Code ${code}`);
                                  conn.end();
                              });
                });
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
