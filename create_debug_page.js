const { Client } = require('ssh2');
const fs = require('fs');

const debugPageContent = `'use client';
import { useTranslation } from "@/lib/i18n";
import { getSettingGroups } from "@/app/(dashboard)/settings/page";
import { useMemo } from "react";
import { translate } from "@/lib/translations";

export default function DebugPage() {
    const { t, lang } = useTranslation();
    const groups = useMemo(() => getSettingGroups(t), [t]);
    const direct4390 = t("sys.str_4390");
    const direct_translate = translate("sys.str_4390", "ar");
    return (
        <div style={{ padding: "20px", fontFamily: "Arial" }}>
            <h1>Translation Debug</h1>
            <p><strong>Current lang:</strong> {lang}</p>
            <p><strong>t("sys.str_4390"):</strong> {direct4390}</p>
            <p><strong>translate("sys.str_4390", "ar"):</strong> {direct_translate}</p>
            <p><strong>groups[0].title:</strong> {groups[0]?.title}</p>
            <p><strong>groups[0].keys[0].label:</strong> {groups[0]?.keys[0]?.label}</p>
            <hr/>
            <h2>All group titles:</h2>
            <ul>
                {groups.map((g, i) => (
                    <li key={i}><strong>{i}:</strong> {g.title}</li>
                ))}
            </ul>
        </div>
    );
}`;

const c = new Client();
c.on('ready', () => {
    c.exec('mkdir -p /www/wwwroot/n11.namainvist.com/src/app/debug_i18n', (err) => {
        c.sftp((err2, sftp) => {
            fs.writeFileSync('debug_page.tsx', debugPageContent);
            sftp.fastPut('debug_page.tsx', '/www/wwwroot/n11.namainvist.com/src/app/debug_i18n/page.tsx', (err3) => {
                if (err3) { console.error(err3); c.end(); return; }
                console.log('Uploaded debug page');
                c.exec('cd /www/wwwroot/n11.namainvist.com && npm run build && pm2 restart n11 && echo "BUILT"', (err4, stream) => {
                    stream.on('data', d => process.stdout.write(d.toString()));
                    stream.on('close', () => c.end());
                });
            });
        });
    });
}).connect({host:'46.4.188.170', port:22, username:'root', password:'_ee4SWbxLVfH9b', readyTimeout:30000});
