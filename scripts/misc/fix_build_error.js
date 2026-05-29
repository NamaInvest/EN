const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const localFile = path.join(__dirname, 'src/app/api/tenant/provision/route.ts');
const fileData = fs.readFileSync(localFile, 'utf8');

const bashCommand = `
echo "Patching remote files with the fixed route.ts..."

cat << 'SERVER_EOF' > /tmp/route_fixed.ts
${fileData.replace(/\\/g, '\\\\').replace(/\$/g, '\\$').replace(/`/g, '\\`')}
SERVER_EOF

deploy_to() {
    local dir=$1
    local pm2_name=$2
    if [ -d "$dir" ]; then
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
    fi
}

deploy_to "/www/wwwroot/namainvist.com" "nama-landing"
deploy_to "/www/wwwroot/n1.namainvist.com" "nama-main"

for i in {2..11}; do
    deploy_to "/www/wwwroot/n$i.namainvist.com" "n$i"
done

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
