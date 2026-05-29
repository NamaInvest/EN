const { Client } = require('ssh2');
const c = new Client();
c.on('ready', () => {
    c.exec([
        // Test 1: Toggle API without auth = should get JSON {error: "Unauthorized"} not HTML redirect
        "echo '=== Test 1: Toggle API (no auth) ==='",
        "curl -s -X POST http://127.0.0.1:3000/api/ice/toggle -H 'Content-Type: application/json' -d '{\"subdomain\":\"test\",\"moduleName\":\"Sales\",\"enabled\":false}' | head -200",
        "echo ''",
        "echo ''",
        // Test 2: Tenants API without auth
        "echo '=== Test 2: Tenants API (no auth) ==='",
        "curl -s http://127.0.0.1:3000/api/ice/tenants | head -200",
        "echo ''",
        "echo ''",
        // Test 3: hidden-modules on saas-app
        "echo '=== Test 3: hidden-modules API (saas) ==='",
        "curl -s http://127.0.0.1:3500/api/tenant/hidden-modules | head -200",
    ].join(' && '), (e, s) => {
        let o = '';
        s.on('data', d => { o += d.toString(); });
        s.on('close', () => { console.log(o); c.end(); });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
