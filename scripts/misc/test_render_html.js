const { Client } = require('ssh2');
const c = new Client();
c.on('ready', () => {
    c.exec('mkdir -p /www/wwwroot/n11.namainvist.com/src/app/api/test_render_html && cat << "EOF" > /www/wwwroot/n11.namainvist.com/src/app/api/test_render_html/route.tsx\nimport { NextResponse } from "next/server";\nimport { renderToString } from "react-dom/server";\nimport SettingsPage from "@/app/(dashboard)/settings/page";\nexport const dynamic = "force-dynamic";\nexport async function GET() {\n  try {\n    const html = renderToString(<SettingsPage />);\n    return new NextResponse(html, { headers: { "Content-Type": "text/html" } });\n  } catch(e) { return NextResponse.json({error: e.message}); }\n}\nEOF\ncd /www/wwwroot/n11.namainvist.com && npm run build && pm2 restart n11', (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => c.end());
    });
}).connect({host:'46.4.188.170', port:22, username:'root', password:'process.env.SSH_PASSWORD', readyTimeout:30000});
