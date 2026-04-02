const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    // Check inside pm2 instances' folders for the Arabic string
    conn.exec('pm2 jlist', (err, stream) => {
        let output = '';
        stream.on('data', d => output += d);
        stream.on('close', () => {
            let processes = JSON.parse(output.substring(output.indexOf('['), output.lastIndexOf(']')+1));
            let n2 = processes.find(p => p.name === 'n2');
            
            if (n2) {
                console.log('Found n2 pmCwd:', n2.pm2_env.pm_cwd);
                // grep the static chunks for 'الوكيل المساعد'
                conn.exec(`cd ${n2.pm2_env.pm_cwd}/.next/static && grep -rn "الوكيل المساعد" .`, (err2, stream2) => {
                    let out2 = "";
                    stream2.on('data', d => out2 += d);
                    stream2.on('close', () => {
                        console.log("n2 GREP ARABIC RESULT:\n", out2.substring(0, 500));
                        
                        // Grep the static chunks for 'AI Copilot'
                        conn.exec(`cd ${n2.pm2_env.pm_cwd}/.next/static && grep -rn "AI Copilot" .`, (err3, stream3) => {
                            let out3 = "";
                            stream3.on('data', d => out3 += d);
                            stream3.on('close', () => {
                                console.log("\nn2 GREP ENGLISH RESULT:\n", out3.substring(0, 500));
                                conn.end();
                            });
                        });
                    });
                });
            } else {
                conn.end();
            }
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
