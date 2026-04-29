const { Client } = require('ssh2');
const conn = new Client();
const N11 = '/www/wwwroot/n11.namainvist.com';
const MAIN = '/www/wwwroot/namainvist.com';

const fixEnvScript = `
const fs = require('fs');

function fix(path) {
    if (!fs.existsSync(path)) return;
    let env = fs.readFileSync(path, 'utf8');
    
    env = env.split(/\\r?\\n/).filter(line => {
        if (line.includes('NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL')) return false;
        if (line.includes('NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL')) return false;
        if (line.includes('NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL')) return false;
        if (line.includes('NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL')) return false;
        return true;
    }).join('\\n');
    
    if (!env.endsWith('\\n')) env += '\\n';
    
    env += 'NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/company-info\\n';
    env += 'NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/company-info\\n';
    
    fs.writeFileSync(path, env);
    console.log('Successfully fixed env at: ' + path);
}

fix('${N11}/.env');
fix('${MAIN}/.env');
`;

conn.on('ready', () => {
    conn.exec(`
node -e "${fixEnvScript.replace(/"/g, '\\"').replace(/\n/g, ' ')}"
echo "Building main-site..."
cd ${MAIN}
npm run build 2>&1 | tail -6
pm2 restart main-site
echo "Building n11..."
cd ${N11}
npm run build 2>&1 | tail -6
pm2 restart saas-app
`, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => { console.log('🎉 Done'); conn.end(); });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 60000 });
