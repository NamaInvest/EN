const { Client } = require('ssh2');
const fs = require('fs');
const config = { host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 120000 };

const conn = new Client();
conn.on('ready', () => {
    console.log('Connected. Uploading clean page.tsx...');
    conn.sftp((err, sftp) => {
        if (err) throw err;
        
        sftp.fastPut('c:\\Users\\1\\Desktop\\alfa\\src\\app\\page.tsx', '/www/wwwroot/namainvist.com/src/app/page.tsx', (err) => {
            if (err) throw err;
            console.log('Uploaded page.tsx successfully!');
            
            // Verify it was uploaded correctly  
            conn.exec("grep -c 'sys.str' /www/wwwroot/namainvist.com/src/app/page.tsx || echo '0'", (err, stream) => {
                let verify = '';
                stream.on('data', d => verify += d.toString());
                stream.on('close', () => {
                    console.log('sys.str count in uploaded page.tsx:', verify.trim());
                    
                    // Now rebuild
                    console.log('Starting full clean rebuild...');
                    conn.exec(`nohup sh -c '
cd /www/wwwroot/namainvist.com
echo "--- STEP 1: Stop ---"
pm2 stop nama-landing || true
echo "--- STEP 2: Clean build ---"
rm -rf .next
echo "--- STEP 3: Build ---"
npm run build
echo "--- STEP 4: Start ---"
pm2 start npm --name nama-landing -- start -- -p 2999 || pm2 restart nama-landing
echo "--- DONE ---"
' > /www/wwwroot/landing_final_rebuild.log 2>&1 &`, (err2, stream2) => {
                        if (err2) throw err2;
                        stream2.on('close', () => {
                            console.log('Rebuild launched in background. Will take ~3 minutes.');
                            conn.end();
                        });
                    });
                });
            });
        });
    });
}).on('error', console.error).connect(config);
