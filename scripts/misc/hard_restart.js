const { Client } = require('ssh2');
const fs = require('fs');

const c = new Client();
c.on('ready', () => {
    console.log('Connected to server...');
    
    // First, find the pm2 process name for n11
    c.exec("pm2 list | grep n11", (err, s0) => {
        let o0 = '';
        s0.on('data', d => { o0 += d.toString(); });
        s0.on('close', () => {
            console.log('PM2 processes:', o0);
            
            // Step 1: Verify what's actually in the built i18n chunk
            c.exec("grep -c 'Hindi\\|Urdu\\|Bengali\\|hi.*ur.*bn' /www/wwwroot/n11.namainvist.com/.next/static/chunks/*.js 2>/dev/null | grep -v ':0' | head -5", (err, s1) => {
                let o1 = '';
                s1.on('data', d => { o1 += d.toString(); });
                s1.on('close', () => {
                    console.log('Chunks with Hindi/Urdu/Bengali:', o1.trim() || 'NONE - clean!');
                    
                    // Step 2: Find the i18n chunk (the one with useTranslation + languages)
                    c.exec("grep -l 'useTranslation\\|I18nProvider' /www/wwwroot/n11.namainvist.com/.next/static/chunks/*.js 2>/dev/null | xargs grep -l 'Hindi\\|Urdu\\|Bengali' 2>/dev/null | head -3", (err, s2) => {
                        let o2 = '';
                        s2.on('data', d => { o2 += d.toString(); });
                        s2.on('close', () => {
                            console.log('\nChunks with useTranslation + Hindi:', o2.trim() || 'NONE!');
                            
                            // Step 3: Check the exact i18n chunk content
                            c.exec("grep -l 'useTranslation' /www/wwwroot/n11.namainvist.com/.next/static/chunks/*.js 2>/dev/null | head -1 | xargs grep -o 'code.*ar.*en.*hi\\|ar.*en.*hi\\|hindi\\|Arabic.*English.*Hindi' 2>/dev/null | head -3", (err, s3) => {
                                let o3 = '';
                                s3.on('data', d => { o3 += d.toString(); });
                                s3.on('close', () => {
                                    console.log('\ni18n content check:', o3.trim() || 'No Hindi/Urdu!');
                                    
                                    // Step 4: Reload pm2 properly
                                    c.exec("pm2 reload n11 --update-env && echo 'RELOADED' || pm2 restart n11 && echo 'RESTARTED'", (err, s4) => {
                                        let o4 = '';
                                        s4.on('data', d => { o4 += d.toString(); });
                                        s4.stderr.on('data', d => { process.stderr.write(d.toString()); });
                                        s4.on('close', () => {
                                            console.log('\nPM2:', o4.trim());
                                            
                                            // Step 5: Clear nginx cache if exists
                                            c.exec("nginx -s reload 2>/dev/null && echo 'nginx reloaded' || echo 'nginx not found/needed'", (err, s5) => {
                                                let o5 = '';
                                                s5.on('data', d => { o5 += d.toString(); });
                                                s5.on('close', () => {
                                                    console.log('Nginx:', o5.trim());
                                                    c.end();
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 30000 });
