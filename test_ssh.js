const { Client } = require('ssh2');
const fs = require('fs');

const testHost = (host, auth) => {
    return new Promise((resolve) => {
        const c = new Client();
        c.on('ready', () => {
            console.log('SUCCESS: ' + host);
            c.end();
            resolve(true);
        }).on('error', (e) => {
            console.log('FAILED: ' + host + ' (' + e.message + ')');
            resolve(false);
        }).connect({
            host, port: 22, username: 'root',
            readyTimeout: 5000,
            ...auth
        });
    });
};

const run = async () => {
    const passwordAuth = { password: 'VmJUML2LuezRSws' };
    const keyAuth = { privateKey: fs.readFileSync('C:/Users/1/.ssh/hetzner_key') };
    
    console.log('Testing 95.217.187.44 (Hetzner Key)...');
    await testHost('95.217.187.44', keyAuth);
    
    console.log('Testing 46.224.178.153 (Password)...');
    let res = await testHost('46.224.178.153', passwordAuth);
    if (!res) {
        console.log('Testing 46.224.178.153 (Hetzner Key)...');
        await testHost('46.224.178.153', keyAuth);
    }
    
    console.log('Testing 204.168.144.74 (Password)...');
    res = await testHost('204.168.144.74', passwordAuth);
    if (!res) {
        console.log('Testing 204.168.144.74 (Hetzner Key)...');
        await testHost('204.168.144.74', keyAuth);
    }
};

run();
