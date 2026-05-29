const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const cmds = `
        echo "Killing all zombie Chrome processes..."
        pkill -f chrome || true
        pkill -f chromium || true
        
        echo "Patching whatsapp.ts across all instances..."
        for i in {1..10}; do
            dir="/www/wwwroot/n$i.namainvist.com"
            if [ -d "$dir" ]; then
                echo "Fixing n$i..."
                # Replace the puppeteer args to include dev-shm-usage
                sed -i "s/'--no-sandbox', '--disable-setuid-sandbox'/'--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'/g" $dir/src/workers/whatsapp.ts
                
                # Delete the specific lock file safely
                rm -f $dir/.wwebjs_auth/*/SingletonLock || true
                
                # Wait, in development when running tsx it compiles on the fly, but Next.js builds the app. 
                # tsx runs the raw .ts file directly in production! So modifying the .ts file is enough.
                
                pm2 restart n$i-whatsapp || true
            fi
        done
        echo "Done!"
    `;
    conn.exec(cmds, (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('data', d => out += d.toString());
        stream.stderr.on('data', d => out += d.toString());
        stream.on('close', () => {
            console.log(out);
            conn.end();
        });
    });
}).connect({
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: 'process.env.SSH_PASSWORD',
    keepaliveInterval: 10000
});
