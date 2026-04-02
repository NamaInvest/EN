const { Client } = require('ssh2');
const conn = new Client();
const BASE = '/www/wwwroot/n3.namainvist.com';
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        const fixContent = `'use client';
import { useTranslation } from '@/lib/i18n';
export default function TestI18n() {
    const { t } = useTranslation();
    return (
        <div style={{ padding: 50, color: 'white', backgroundColor: 'black' }}>
            <h1>TEST I18N PAGE</h1>
            <h2 id="test-key-1">{t('dashboard.title')}</h2>
            <h2 id="test-key-2">{t('common.sar')}</h2>
        </div>
    );
}`;
        sftp.fastPut('src/app/test-i18n/page.tsx', `${BASE}/src/app/test-i18n/page.tsx`, (err) => {
            conn.exec(`echo "${fixContent}" > ${BASE}/src/app/test-i18n/page.tsx && cd ${BASE} && npm run build 2>&1 | tail -5 && pm2 restart n3 && sleep 3 && curl -s http://localhost:3003/test-i18n | head -c 1000`, (err, stream) => {
                let out = '';
                stream.on('data', d => out += d.toString());
                stream.on('close', () => { console.log(out); conn.end(); });
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
