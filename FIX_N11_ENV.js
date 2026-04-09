const { Client } = require('ssh2');

const conn = new Client();
console.log('🚀 Connecting to N11 to fix .env and missing section configurations...');

conn.on('ready', () => {
    // We will carefully read .env, replace n1 with n11 where appropriate, and restart
    const bashScript = `
cd /www/wwwroot/n11.namainvist.com
if [ -f .env ]; then
    echo "📄 Updating .env file for n11..."
    sed -i 's/NEXT_PUBLIC_NODE_NAME="n1"/NEXT_PUBLIC_NODE_NAME="n11"/g' .env
    sed -i 's/NEXT_PUBLIC_NODE_NAME=n1/NEXT_PUBLIC_NODE_NAME=n11/g' .env
    # Usually public URLs might be named after the node
    sed -i 's/n1.namainvist.com/n11.namainvist.com/g' .env
    
    echo "✅ Configuration fixed. Rebuilding quietly to apply node name..."
    npm run build
    pm2 restart n11
    echo "🎉 Sections will now load properly for n11!"
else
    echo "⚠️ No .env file found!"
fi
    `;
    
    conn.exec(bashScript, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', (code) => {
            console.log('Done with exit code: ' + code);
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
