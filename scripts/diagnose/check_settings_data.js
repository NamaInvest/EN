const { Client } = require('ssh2');
const c = new Client();
c.on('ready', () => {
    c.exec('mkdir -p /www/wwwroot/n11.namainvist.com/src/app/api/test_settings_direct && cat << "EOF" > /www/wwwroot/n11.namainvist.com/src/app/api/test_settings_direct/route.ts\nimport { NextResponse } from "next/server";\nimport { getSettingGroups } from "@/app/(dashboard)/settings/page";\nimport { translate } from "@/lib/translations";\nexport const dynamic = "force-dynamic";\nexport async function GET() {\n  try {\n    const groups = getSettingGroups(k => translate(k, "ar"));\n    return NextResponse.json(groups.map(g => ({ title: g.title, k0: g.keys[0].label })));\n  } catch(e) { return NextResponse.json({error: e.message}); }\n}\nEOF\ncd /www/wwwroot/n11.namainvist.com && npm run build && pm2 restart n11', (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => c.end());
    });
}).connect({host:'46.4.188.170', port:22, username:'root', password:'_ee4SWbxLVfH9b', readyTimeout:30000});
