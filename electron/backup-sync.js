const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

// ──────────────────────────────────────────────────────────────────────────────
// Nama Invest — Backup Sync Engine
// يرفع نسخة احتياطية كل 24 ساعة عند توفر الإنترنت
// يفحص الاتصال كل ساعة
// ──────────────────────────────────────────────────────────────────────────────

const BACKUP_API = 'https://namainvist.com/api/ice/backup/upload';
const CHECK_INTERVAL = 60 * 60 * 1000;      // كل ساعة
const BACKUP_INTERVAL = 24 * 60 * 60 * 1000; // كل 24 ساعة

class BackupSync {
  constructor(store) {
    this.store = store;
    this.timer = null;
    this.isRunning = false;
  }

  start() {
    console.log('💾 Backup Sync started — checking every 1 hour');
    this.check(); // First check immediately
    this.timer = setInterval(() => this.check(), CHECK_INTERVAL);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    console.log('💾 Backup Sync stopped');
  }

  async check() {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      const lastBackup = this.store.get('lastBackupTime') || 0;
      const elapsed = Date.now() - lastBackup;

      if (elapsed < BACKUP_INTERVAL) {
        const hoursLeft = Math.round((BACKUP_INTERVAL - elapsed) / (1000 * 60 * 60));
        console.log(`💾 Next backup in ~${hoursLeft} hours`);
        this.isRunning = false;
        return;
      }

      // Check internet connectivity
      const online = await this.isOnline();
      if (!online) {
        console.log('📡 No internet — will retry in 1 hour');
        this.store.set('backupPending', true);
        this.isRunning = false;
        return;
      }

      console.log('💾 Starting backup...');
      await this.performBackup();
    } catch (err) {
      console.error('💾 Backup error:', err.message);
    }

    this.isRunning = false;
  }

  async isOnline() {
    return new Promise((resolve) => {
      const req = https.get('https://namainvist.com/api/sys/health', (res) => {
        resolve(res.statusCode === 200);
      });
      req.on('error', () => resolve(false));
      req.setTimeout(5000, () => { req.destroy(); resolve(false); });
    });
  }

  async performBackup() {
    const license = this.store.get('license');
    if (!license?.key) {
      console.log('💾 No license — skipping backup');
      return;
    }

    try {
      // Get database path
      const dbPath = this.getDbPath();
      if (!dbPath || !fs.existsSync(dbPath)) {
        console.log('💾 No local database found');
        return;
      }

      // Read and compress database
      const dbData = fs.readFileSync(dbPath);
      const zlib = require('zlib');
      const compressed = zlib.gzipSync(dbData);

      // Upload
      const result = await this.upload(compressed, license.key);
      
      if (result.success) {
        this.store.set('lastBackupTime', Date.now());
        this.store.set('lastBackupSize', compressed.length);
        this.store.set('backupPending', false);
        console.log(`✅ Backup uploaded: ${(compressed.length / 1024 / 1024).toFixed(2)} MB`);
      } else {
        console.error('❌ Backup upload failed:', result.error);
      }
    } catch (err) {
      console.error('💾 Backup error:', err.message);
    }
  }

  getDbPath() {
    // Check for local PostgreSQL data dump or SQLite file
    const userDataPath = app.getPath('userData');
    const possiblePaths = [
      path.join(userDataPath, 'nama-local.db'),
      path.join(userDataPath, 'database', 'nama.db'),
      path.join(userDataPath, 'pg_dump.sql.gz'),
    ];
    
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) return p;
    }
    
    // If no local DB, create a dump of the running PostgreSQL
    return this.createPgDump();
  }

  createPgDump() {
    try {
      const { execSync } = require('child_process');
      const dumpPath = path.join(app.getPath('userData'), 'pg_dump.sql.gz');
      const pgBinDir = path.join(require.resolve('embedded-postgres').replace(/[/\\]index\..*$/, ''), '..', '@embedded-postgres', process.platform === 'win32' ? 'windows-x64' : 'linux-x64', 'native', 'bin');
      const pgDump = path.join(pgBinDir, process.platform === 'win32' ? 'pg_dump.exe' : 'pg_dump');
      
      if (fs.existsSync(pgDump)) {
        const env = { ...process.env, PGPASSWORD: 'NamaLocal2026!' };
        execSync(`"${pgDump}" -h localhost -p 5433 -U nama -Fc nama_local > "${dumpPath}"`, {
          timeout: 60000, env, shell: true,
        });
        return dumpPath;
      }

      // Fallback: system pg_dump
      execSync(`pg_dump -h localhost -p 5433 -U nama -Fc nama_local > "${dumpPath}"`, {
        timeout: 60000,
        env: { ...process.env, PGPASSWORD: 'NamaLocal2026!' },
        shell: true,
      });
      return dumpPath;
    } catch (err) {
      console.error('pg_dump failed:', err.message);
      return null;
    }
  }

  upload(data, licenseKey) {
    return new Promise((resolve) => {
      const url = new URL(BACKUP_API);
      const boundary = '----NamaBackup' + Date.now();
      const hardwareId = this.store.get('hardwareId') || 'unknown';
      
      const bodyParts = [
        `--${boundary}\r\n`,
        `Content-Disposition: form-data; name="license_key"\r\n\r\n`,
        `${licenseKey}\r\n`,
        `--${boundary}\r\n`,
        `Content-Disposition: form-data; name="hardware_id"\r\n\r\n`,
        `${hardwareId}\r\n`,
        `--${boundary}\r\n`,
        `Content-Disposition: form-data; name="file"; filename="backup_${Date.now()}.sql.gz"\r\n`,
        `Content-Type: application/gzip\r\n\r\n`,
      ];

      const header = Buffer.from(bodyParts.join(''));
      const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
      const body = Buffer.concat([header, data, footer]);

      const options = {
        hostname: url.hostname,
        port: 443,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': body.length,
        },
      };

      const req = https.request(options, (res) => {
        let responseData = '';
        res.on('data', (d) => (responseData += d));
        res.on('end', () => {
          try {
            resolve(JSON.parse(responseData));
          } catch {
            resolve({ success: res.statusCode === 200 });
          }
        });
      });

      req.on('error', (err) => resolve({ success: false, error: err.message }));
      req.setTimeout(120000, () => { req.destroy(); resolve({ success: false, error: 'timeout' }); });
      req.write(body);
      req.end();
    });
  }
}

module.exports = BackupSync;
