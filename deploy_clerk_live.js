const { Client } = require('ssh2');

const PK = 'pk_live_Y2xlcmsubmFtYWludmlzdC5jb20k';
const SK = 'sk_live_btdBcZHEiJ4Et53T81Kb1dVz2TWmYFCMPQ8ClStM6R';

const bashCommand = `
echo "Deploying Production Clerk Keys to Fleet..."

# Function to patch env and rebuild
deploy_to() {
    local dir=$1
    local pm2_name=$2
    if [ -d "$dir" ]; then
        echo "Patching $dir..."
        # Replace keys in .env
        sed -i "s|^NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=.*|NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${PK}|g" "$dir/.env"
        sed -i "s|^CLERK_SECRET_KEY=.*|CLERK_SECRET_KEY=${SK}|g" "$dir/.env"
        
        echo "Rebuilding $dir (This might take a few minutes)..."
        cd "$dir"
        npm run build > build_clerk.log 2>&1
        
        echo "Restarting PM2 process: $pm2_name..."
        pm2 restart "$pm2_name"
        echo "Done for $dir!"
    fi
}

# 1. Main Landing Page
deploy_to "/www/wwwroot/namainvist.com" "nama-landing"

# 2. Master Clone Node (N1)
deploy_to "/www/wwwroot/n1.namainvist.com" "nama-main"

# 3. Existing Fleet (N2 to N11)
for i in {2..11}; do
    deploy_to "/www/wwwroot/n$i.namainvist.com" "n$i"
done

echo "🎉 All nodes have successfully transitioned to Clerk Production!"
pm2 save
`;

const conn = new Client();
conn.on('ready', () => {
    console.log('Connected to Fleet Server 46.4.188.170...');
    conn.exec(bashCommand, (err, stream) => {
        if (err) throw err;
        stream.on('data', (d) => process.stdout.write(d));
        stream.stderr.on('data', (d) => process.stdout.write(d));
        stream.on('close', () => {
            console.log('Deployment completed! Connection closed.');
            conn.end();
        });
    });
}).connect({
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b'
});
