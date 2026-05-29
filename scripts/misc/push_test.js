const { Client } = require('ssh2'); 
const conn = new Client(); 
conn.on('ready', () => { 
  const code = `
import { NextResponse } from 'next/server';
import { translate } from '@/lib/translations';

export async function GET() {
    return NextResponse.json({
        raw_4294: translate('sys.str_4294', 'ar'),
        raw_4295: translate('sys.str_4295', 'ar'),
        raw_4278: translate('sys.str_4278', 'ar')
    });
}
`;
  conn.exec(`mkdir -p /www/wwwroot/n11.namainvist.com/src/app/api/test-translation && cat << 'EOF' > /www/wwwroot/n11.namainvist.com/src/app/api/test-translation/route.ts\n${code}\nEOF\ncd /www/wwwroot/n11.namainvist.com && npm run build && pm2 restart n11`, (err, stream) => { 
      stream.on('close', () => conn.end()).on('data', d => process.stdout.write(d.toString())); 
      stream.stderr.on('data', d => process.stderr.write(d.toString()));
  }); 
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD'});
