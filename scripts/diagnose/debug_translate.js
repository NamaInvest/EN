const { Client } = require('ssh2');
const fs = require('fs');

// Create a debug API route that logs what translate returns
const debugRoute = `import { NextResponse } from "next/server";
import { translate } from "@/lib/translations";
export const dynamic = "force-dynamic";
export async function GET() {
  const key = "sys.str_4390";
  const val = translate(key, "ar");
  const keys = Object.keys(require("@/locales/ar.json")).slice(0, 5);
  return NextResponse.json({ 
    key, 
    val, 
    works: val !== key,
    sample_keys: keys,
    has_ar: !!require("@/locales/ar.json")[key]
  });
}`;

const c = new Client();
c.on('ready', () => {
    c.exec('mkdir -p /www/wwwroot/n11.namainvist.com/src/app/api/debug_t', (err) => {
        c.sftp((err2, sftp) => {
            const tmpFile = 'debug_route_tmp.ts';
            fs.writeFileSync(tmpFile, debugRoute);
            sftp.fastPut(tmpFile, '/www/wwwroot/n11.namainvist.com/src/app/api/debug_t/route.ts', (err3) => {
                if (err3) { console.error(err3); c.end(); return; }
                console.log('Uploaded debug route');
                c.exec('cd /www/wwwroot/n11.namainvist.com && npm run build && pm2 restart n11 && echo "BUILT"', (err4, stream) => {
                    stream.on('data', d => process.stdout.write(d.toString()));
                    stream.on('close', () => c.end());
                });
            });
        });
    });
}).connect({host:'46.4.188.170', port:22, username:'root', password:'_ee4SWbxLVfH9b', readyTimeout:30000});
