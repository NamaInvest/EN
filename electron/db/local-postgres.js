const path = require('path');
const fs = require('fs');
const { app } = require('electron');
const { execSync, spawn } = require('child_process');

// ──────────────────────────────────────────────────────────────────────────────
// Nama Invest — Local PostgreSQL Manager (Embedded)
// 
// FIX LOG (2026-04-21):
// Problem: In packaged Electron builds, the embedded-postgres library resolves
//   binary paths via ESM import.meta.url which points inside app.asar.
//   Since executables cannot be spawned from inside asar archives, this causes
//   ENOENT errors for initdb.exe and postgres.exe.
// Solution: In packaged mode, bypass the embedded-postgres library entirely
//   and spawn binaries directly from the known app.asar.unpacked path.
//   The asarUnpack config in electron-builder.yml extracts @embedded-postgres
//   binaries to: resources/app.asar.unpacked/node_modules/@embedded-postgres/
// Related files:
//   - electron-builder.yml: asarUnpack includes "**/@embedded-postgres/**"
//   - This file: _startPackaged() bypasses library for packaged builds
// ──────────────────────────────────────────────────────────────────────────────

const DB_NAME = 'nama_local';
const DB_USER = 'nama';
const DB_PASS = 'NamaLocal2026!';
const DB_PORT = 5433; // Different from default 5432 to avoid conflicts

class LocalPostgres {
  constructor() {
    this.dataDir = path.join(app.getPath('userData'), 'pgdata');
    this.pg = null;
    this.pgProcess = null; // For packaged mode direct process
    this.isRunning = false;
  }

  get connectionString() {
    return `postgresql://${DB_USER}:${DB_PASS}@localhost:${DB_PORT}/${DB_NAME}`;
  }

  /**
   * Get the path to the PG binaries in packaged mode.
   * In packaged builds, asarUnpack extracts @embedded-postgres to app.asar.unpacked
   */
  _getPackagedBinDir() {
    return path.join(
      process.resourcesPath,
      'app.asar.unpacked',
      'node_modules',
      '@embedded-postgres',
      'windows-x64',
      'native',
      'bin'
    );
  }

  async start() {
    console.log('🐘 Starting local PostgreSQL...');
    console.log(`   Data: ${this.dataDir}`);
    console.log(`   Port: ${DB_PORT}`);
    console.log(`   Packaged: ${app.isPackaged}`);

    if (app.isPackaged) {
      return this._startPackaged();
    }
    return this._startDev();
  }

  // ── DEV MODE: Use embedded-postgres library as-is ──
  async _startDev() {
    try {
      const epModule = require('embedded-postgres');
      const EmbeddedPostgres = epModule.default || epModule;

      this.pg = new EmbeddedPostgres({
        databaseDir: this.dataDir,
        user: DB_USER,
        password: DB_PASS,
        port: DB_PORT,
        persistent: true,
        initdbFlags: ['--encoding=UTF8', '--locale=C', '--lc-messages=C'],
      });

      await this.pg.initialise();
      await this.pg.start();
      this.isRunning = true;
      await this.createDatabase();
      console.log('✅ PostgreSQL running on port ' + DB_PORT);
      return true;
    } catch (err) {
      console.error('❌ PostgreSQL start error:', err.message);
      if (err.message.includes('already') || err.message.includes('exists')) {
        try {
          await this.pg.start();
          this.isRunning = true;
          console.log('✅ PostgreSQL running (existing data)');
          return true;
        } catch (e2) {
          console.error('❌ PostgreSQL retry failed:', e2.message);
        }
      }
      return false;
    }
  }

  // ── PACKAGED MODE: Bypass library, spawn binaries directly ──
  async _startPackaged() {
    const binDir = this._getPackagedBinDir();
    const initdbExe = path.join(binDir, 'initdb.exe');
    const postgresExe = path.join(binDir, 'postgres.exe');

    console.log(`   📂 Bin dir: ${binDir}`);
    console.log(`   📄 initdb: ${fs.existsSync(initdbExe) ? '✅ found' : '❌ NOT FOUND'}`);
    console.log(`   📄 postgres: ${fs.existsSync(postgresExe) ? '✅ found' : '❌ NOT FOUND'}`);

    if (!fs.existsSync(initdbExe) || !fs.existsSync(postgresExe)) {
      console.error('❌ PostgreSQL binaries not found in unpacked directory!');
      return false;
    }

    try {
      // Step 1: Initialize data directory if needed
      const pgVersionFile = path.join(this.dataDir, 'PG_VERSION');
      if (!fs.existsSync(pgVersionFile)) {
        console.log('   📦 First run — initializing database...');
        await this._runInitdb(initdbExe);
      } else {
        console.log('   📦 Database already initialized');
      }

      // Step 2: Start postgres process
      await this._runPostgres(postgresExe);
      this.isRunning = true;

      // Step 3: Create app database
      await this.createDatabase();

      console.log('✅ PostgreSQL running on port ' + DB_PORT);
      return true;
    } catch (err) {
      console.error('❌ PostgreSQL packaged start error:', err.message);
      return false;
    }
  }

  /**
   * Run initdb to create the data directory (packaged mode)
   */
  _runInitdb(initdbExe) {
    return new Promise((resolve, reject) => {
      console.log('   🔧 Running initdb...');

      // Create a temp password file
      const pwFile = path.join(app.getPath('temp'), `pg-pw-${Date.now()}`);
      fs.writeFileSync(pwFile, DB_PASS + '\n');

      const child = spawn(initdbExe, [
        `--pgdata=${this.dataDir}`,
        `--auth=password`,
        `--username=${DB_USER}`,
        `--pwfile=${pwFile}`,
        '--lc-messages=C',
        '--encoding=UTF8',
        '--locale=C',
      ], {
        env: { ...process.env, LC_MESSAGES: 'C' },
      });

      let output = '';
      child.stdout?.on('data', (d) => {
        output += d.toString();
        console.log('   [initdb]', d.toString().trim());
      });
      child.stderr?.on('data', (d) => {
        output += d.toString();
        console.log('   [initdb stderr]', d.toString().trim());
      });

      child.on('close', (code) => {
        try { fs.unlinkSync(pwFile); } catch {}
        if (code === 0) {
          console.log('   ✅ initdb completed');
          resolve();
        } else {
          reject(new Error(`initdb failed (code ${code}): ${output.slice(-500)}`));
        }
      });

      child.on('error', (err) => {
        try { fs.unlinkSync(pwFile); } catch {}
        reject(err);
      });
    });
  }

  /**
   * Start postgres server process (packaged mode)
   */
  _runPostgres(postgresExe) {
    return new Promise((resolve, reject) => {
      console.log('   🚀 Starting postgres server...');

      this.pgProcess = spawn(postgresExe, [
        '-D', this.dataDir,
        '-p', DB_PORT.toString(),
      ], {
        env: { ...process.env, LC_MESSAGES: 'C' },
      });

      let resolved = false;

      this.pgProcess.stderr?.on('data', (d) => {
        const msg = d.toString();
        console.log('   [pg]', msg.trim());
        if (!resolved && msg.includes('database system is ready to accept connections')) {
          resolved = true;
          resolve();
        }
      });

      this.pgProcess.stdout?.on('data', (d) => {
        console.log('   [pg out]', d.toString().trim());
      });

      this.pgProcess.on('close', (code) => {
        if (!resolved) {
          reject(new Error(`postgres exited early (code ${code})`));
        }
        this.isRunning = false;
      });

      this.pgProcess.on('error', (err) => {
        if (!resolved) reject(err);
      });

      // Timeout after 30s
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          reject(new Error('PostgreSQL start timeout (30s)'));
        }
      }, 30000);
    });
  }

  async createDatabase() {
    try {
      const { Client } = require('pg');

      const adminClient = new Client({
        host: 'localhost',
        port: DB_PORT,
        user: DB_USER,
        password: DB_PASS,
        database: 'postgres',
      });

      await adminClient.connect();

      const result = await adminClient.query(
        `SELECT 1 FROM pg_database WHERE datname = $1`, [DB_NAME]
      );

      if (result.rows.length === 0) {
        await adminClient.query(`CREATE DATABASE ${DB_NAME}`);
        console.log(`📦 Created database: ${DB_NAME}`);
      }

      await adminClient.end();
    } catch (err) {
      if (!err.message.includes('already exists')) {
        console.error('DB create error:', err.message);
      }
    }
  }

  async runMigrations() {
    console.log('🔄 Running Prisma migrations...');

    try {
      const cwd = app.isPackaged
        ? path.join(process.resourcesPath, 'standalone')
        : path.join(__dirname, '..', '..');

      const enginesDir = path.join(cwd, 'node_modules', '@prisma', 'engines');

      const env = {
        ...process.env,
        DATABASE_URL: this.connectionString,
        ELECTRON_RUN_AS_NODE: '1',
        PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING: '1',
        PRISMA_CLI_QUERY_ENGINE_TYPE: 'binary',
        PRISMA_DISABLE_WARNINGS: '1',
        PRISMA_QUERY_ENGINE_LIBRARY: path.join(enginesDir, 'query_engine-windows.dll.node'),
        PRISMA_SCHEMA_ENGINE_BINARY: path.join(enginesDir, 'schema-engine-windows.exe'),
        PRISMA_FMT_BINARY: path.join(enginesDir, 'prisma-fmt-windows.exe')
      };

      // Use embedded prisma CLI directly instead of depending on npx
      const prismaScript = path.join(cwd, 'node_modules', 'prisma', 'build', 'index.js');
      
      let cmd;
      if (fs.existsSync(prismaScript)) {
        cmd = `"${process.execPath}" "${prismaScript}" db push --schema=./prisma/schema.prisma --accept-data-loss --skip-generate`;
      } else {
        cmd = 'npx prisma db push --schema=./prisma/schema.prisma --accept-data-loss --skip-generate';
      }

      execSync(cmd, {
        cwd,
        env,
        timeout: 120000,
        stdio: 'pipe',
      });

      console.log('✅ Database schema synced');
      return true;
    } catch (err) {
      console.error('❌ Migration error:', err.message);
      if (err.stderr) {
        console.error('STDERR:', err.stderr.toString().slice(0, 500));
      }
      return false;
    }
  }

  async seedDefaults() {
    console.log('🌱 Seeding default data...');

    try {
      const { Client } = require('pg');
      const client = new Client({
        host: 'localhost',
        port: DB_PORT,
        user: DB_USER,
        password: DB_PASS,
        database: DB_NAME,
      });

      await client.connect();

      const check = await client.query(`SELECT COUNT(*) FROM users WHERE username = 'admin'`).catch(() => ({ rows: [{ count: '0' }] }));

      if (parseInt(check.rows[0].count) > 0) {
        console.log('ℹ️ Already seeded, skipping');
        await client.end();
        return;
      }

      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin', 10);

      await client.query(`
        INSERT INTO users (username, password_hash, full_name, role, active)
        VALUES ('admin', $1, 'مدير النظام', 'admin', true)
        ON CONFLICT (username) DO NOTHING
      `, [hashedPassword]);

      const stockCheck = await client.query(`SELECT id FROM stocks WHERE name = 'المستودع الرئيسي'`);
      if (stockCheck.rowCount === 0) {
        await client.query(`INSERT INTO stocks (name, active) VALUES ('المستودع الرئيسي', true)`);
      }

      const unitCheck = await client.query(`SELECT id FROM units WHERE name = 'قطعة'`);
      if (unitCheck.rowCount === 0) {
        await client.query(`INSERT INTO units (name) VALUES ('قطعة')`);
      }

      const customerCheck = await client.query(`SELECT id FROM customers WHERE name = 'عميل نقدي'`);
      if (customerCheck.rowCount === 0) {
        await client.query(`INSERT INTO customers (name, phone) VALUES ('عميل نقدي', '0000000000')`);
      }

      const accounts = [
        [1, 'الأصول', null],
        [2, 'الخصوم', null],
        [3, 'حقوق الملكية', null],
        [4, 'الإيرادات', null],
        [5, 'المصروفات', null],
        [11, 'النقدية والبنوك', 1],
        [12, 'المدينون', 1],
        [13, 'المخزون', 1],
        [21, 'الدائنون', 2],
        [41, 'إيرادات المبيعات', 4],
        [51, 'تكلفة المبيعات', 5],
      ];

      for (const [code, name, parentCode] of accounts) {
        const accCheck = await client.query(`SELECT id FROM accounts WHERE code = $1`, [code.toString()]);
        if (accCheck.rowCount === 0) {
          await client.query(`
            INSERT INTO accounts (code, name, parent_id)
            VALUES ($1, $2, $3)
          `, [code.toString(), name, parentCode]);
        }
      }

      console.log('✅ Default data seeded');
      await client.end();
    } catch (err) {
      console.error('⚠️ Seed error (non-fatal):', err.message);
    }
  }

  async stop() {
    // Packaged mode: kill the direct process
    if (this.pgProcess) {
      console.log('🐘 Stopping PostgreSQL (packaged)...');
      try {
        if (this.pgProcess.pid) {
          spawn('taskkill', ['/pid', this.pgProcess.pid.toString(), '/f', '/t']);
        }
        this.pgProcess = null;
        this.isRunning = false;
        console.log('✅ PostgreSQL stopped');
      } catch (err) {
        console.error('PostgreSQL stop error:', err.message);
      }
      return;
    }

    // Dev mode: use library's stop
    if (this.pg && this.isRunning) {
      console.log('🐘 Stopping PostgreSQL...');
      try {
        await this.pg.stop();
        this.isRunning = false;
        console.log('✅ PostgreSQL stopped');
      } catch (err) {
        console.error('PostgreSQL stop error:', err.message);
      }
    }
  }

  getEnvVars() {
    return {
      DATABASE_URL: this.connectionString,
      DESKTOP_MODE: 'true',
      CLERK_SECRET_KEY: '',
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: '',
      JWT_SECRET: 'nama-desktop-jwt-secret-2026-local',
      PORT: '3500',
      HOSTNAME: 'localhost',
      NODE_ENV: app.isPackaged ? 'production' : 'development',
    };
  }
}

module.exports = { LocalPostgres, DB_PORT, DB_NAME, DB_USER, DB_PASS };
