const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const localFile = path.join(__dirname, 'src/app/api/tenant/provision/route.ts');
const fileData = fs.readFileSync(localFile, 'utf8');
const base64Data = Buffer.from(fileData).toString('base64');

const bashCommand = `
echo "Patching remote files with the fixed route.ts using base64..."

echo "${base64Data}" | base64 -d > /tmp/route_fixed.ts

deploy_to() {
    local dir=$1
    local pm2_name=$2
    if [ -d "$dir/src/app/api/tenant/provision" ]; then
        echo "Updating $dir..."
        cp /tmp/route_fixed.ts "$dir/src/app/api/tenant/provision/route.ts"
        cd "$dir"
        echo "Rebuilding $dir..."
        npm run build > build_recover.log 2>&1
        if [ $? -eq 0 ]; then
            pm2 restart "$pm2_name" || pm2 start ecosystem.config.js --name "$pm2_name"
            echo "Success for $dir"
        else
            echo "Build failed for $dir. See build_recover.log"
        fi
    else
        echo "Skipping $dir, no provision API exists."
    fi
}

deploy_to "/www/wwwroot/namainvist.com" "nama-landing"
pm2 save
echo "Recovery Complete!"
`;

const conn = new Client();
conn.on('ready', () => {
    console.log('Connected. Starting recovery deployment...');
    conn.exec(bashCommand, (err, stream) => {
        if (err) throw err;
        stream.on('data', (d) => process.stdout.write(d));
        stream.stderr.on('data', (d) => process.stdout.write(d));
        stream.on('close', () => {
            console.log('Done!');
            conn.end();
        });
    });
}).connect({
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: 'process.env.SSH_PASSWORD'
});
