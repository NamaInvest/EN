/**
 * Read-only inspection of the production main site.
 * Reports commit, pm2 status, disk, db reachability, .next freshness.
 *
 * Usage: node scripts/inspect-prod.js
 */
const { Client } = require('ssh2');

const SERVER = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: 'process.env.SSH_PASSWORD',
    readyTimeout: 20000,
};

const APP_DIR = '/www/wwwroot/namainvist.com';
const PM2_NAME = 'main-site';

const PROBES = [
    { label: 'OS / Kernel',           cmd: 'uname -a' },
    { label: 'Disk usage',            cmd: 'df -h / | tail -1' },
    { label: 'Memory',                cmd: 'free -h | head -2 | tail -1' },
    { label: 'Node version',          cmd: 'node -v' },
    { label: 'NPM version',           cmd: 'npm -v' },
    { label: 'PostgreSQL on 5432',    cmd: 'pg_isready -h localhost -p 5432 || echo NOT_READY' },
    { label: 'PM2 processes',         cmd: 'pm2 list --no-color | head -20' },
    { label: 'App: branch',           cmd: `cd ${APP_DIR} && git rev-parse --abbrev-ref HEAD 2>&1` },
    { label: 'App: HEAD commit',      cmd: `cd ${APP_DIR} && git log -1 --pretty=format:'%h %ad %s' --date=iso` },
    { label: 'App: last 5 commits',   cmd: `cd ${APP_DIR} && git log -5 --oneline` },
    { label: 'App: working tree',     cmd: `cd ${APP_DIR} && git status --short | head -30` },
    { label: 'App: remotes',          cmd: `cd ${APP_DIR} && git remote -v` },
    { label: 'App: .next age',        cmd: `cd ${APP_DIR} && stat -c '%y  size=%s bytes' .next 2>&1 | head -3 || echo MISSING` },
    { label: 'App: package.json hash',cmd: `cd ${APP_DIR} && md5sum package.json package-lock.json 2>&1` },
    { label: 'App: schema hash',      cmd: `cd ${APP_DIR} && md5sum prisma/schema.prisma 2>&1` },
    { label: 'App: env exists',       cmd: `cd ${APP_DIR} && ls -la .env .env.local .env.production 2>&1 | head -5` },
    { label: 'PM2 logs (last 30)',    cmd: `pm2 logs ${PM2_NAME} --lines 30 --nostream --no-color 2>&1 | tail -40` },
    { label: 'Port 3000 listener',    cmd: 'ss -tlnp | grep :3000 || echo NOT_LISTENING' },
    { label: 'Localhost health',      cmd: 'curl -s -o /dev/null -w "code=%{http_code} time=%{time_total}s" http://localhost:3000/api/health' },
];

function run(conn, cmd) {
    return new Promise((resolve) => {
        let out = '';
        conn.exec(cmd, (err, stream) => {
            if (err) return resolve(`<exec err: ${err.message}>`);
            stream.on('close', () => resolve(out.trim()));
            stream.on('data', (data) => { out += data.toString(); });
            stream.stderr.on('data', (data) => { out += data.toString(); });
        });
    });
}

async function main() {
    const conn = new Client();
    await new Promise((resolve, reject) => {
        conn.on('ready', resolve).on('error', reject).connect(SERVER);
    });
    console.log(`Connected to ${SERVER.host} as ${SERVER.username}\n`);

    for (const probe of PROBES) {
        const out = await run(conn, probe.cmd);
        console.log(`══ ${probe.label} ${'═'.repeat(Math.max(2, 60 - probe.label.length))}`);
        console.log(out || '(empty)');
        console.log('');
    }

    conn.end();
    console.log('Disconnected.');
}

main().catch(err => {
    console.error('FATAL:', err.message);
    process.exit(1);
});
