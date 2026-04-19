const path = require('path');
const fs = require('fs');
const { app } = require('electron');
const { execSync, spawn } = require('child_process');

// ──────────────────────────────────────────────────────────────────────────────
// Nama Invest — Local PostgreSQL Manager (Embedded)
// ──────────────────────────────────────────────────────────────────────────────

const DB_NAME = 'nama_local';
const DB_USER = 'nama';
const DB_PASS = 'NamaLocal2026!';
const DB_PORT = 5433; // Different from default 5432 to avoid conflicts

class LocalPostgres {
  constructor() {
    this.dataDir = path.join(app.getPath('userData'), 'pgdata');
    this.pg = null;
    this.isRunning = false;
  }

  get connectionString() {
    return `postgresql://${DB_USER}:${DB_PASS}@localhost:${DB_PORT}/${DB_NAME}`;
  }

  async start() {
    console.log('🐘 Starting local PostgreSQL...');
    console.log(`   Data: ${this.dataDir}`);
    console.log(`   Port: ${DB_PORT}`);

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
      
      // Create database if not exists
      await this.createDatabase();
      
      console.log('✅ PostgreSQL running on port ' + DB_PORT);
      return true;
    } catch (err) {
      console.error('❌ PostgreSQL start error:', err.message);
      
      // If already initialized, try just starting
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

  async createDatabase() {
    try {
      const { Client } = require('pg');
      
      // Connect to default 'postgres' database first
      const adminClient = new Client({
        host: 'localhost',
        port: DB_PORT,
        user: DB_USER,
        password: DB_PASS,
        database: 'postgres',
      });
      
      await adminClient.connect();
      
      // Check if database exists
      const result = await adminClient.query(
        `SELECT 1 FROM pg_database WHERE datname = $1`, [DB_NAME]
      );
      
      if (result.rows.length === 0) {
        await adminClient.query(`CREATE DATABASE ${DB_NAME}`);
        console.log(`📦 Created database: ${DB_NAME}`);
      }
      
      await adminClient.end();
    } catch (err) {
      // Database might already exist
      if (!err.message.includes('already exists')) {
        console.error('DB create error:', err.message);
      }
    }
  }

  async runMigrations() {
    console.log('🔄 Running Prisma migrations...');
    
    const prismaSchemaPath = path.join(
      app.isPackaged ? process.resourcesPath : path.join(__dirname, '..', '..'),
      'prisma', 'schema.prisma'
    );

    try {
      // Set DATABASE_URL for Prisma
      const env = {
        ...process.env,
        DATABASE_URL: this.connectionString,
      };

      const cwd = app.isPackaged
        ? path.join(process.resourcesPath, 'standalone')
        : path.join(__dirname, '..', '..');

      // Push schema (creates tables without migration history)
      execSync('npx prisma db push --skip-generate --accept-data-loss', {
        cwd,
        env,
        timeout: 120000,
        stdio: 'pipe',
      });

      console.log('✅ Database schema synced');
      return true;
    } catch (err) {
      console.error('❌ Migration error:', err.message);
      // Try to show a more useful error
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

      // Check if already seeded
      const check = await client.query(`SELECT COUNT(*) FROM "User" WHERE username = 'admin'`).catch(() => ({ rows: [{ count: '0' }] }));
      
      if (parseInt(check.rows[0].count) > 0) {
        console.log('ℹ️ Already seeded, skipping');
        await client.end();
        return;
      }

      // Hash password "admin"
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin', 10);

      // Create admin user
      await client.query(`
        INSERT INTO "User" (username, password, "fullName", role, "isActive", "createdAt", "updatedAt")
        VALUES ('admin', $1, 'مدير النظام', 'admin', true, NOW(), NOW())
        ON CONFLICT (username) DO NOTHING
      `, [hashedPassword]);

      // Create default warehouse
      await client.query(`
        INSERT INTO "Warehouse" (name, code, "isDefault", "createdAt", "updatedAt")
        VALUES ('المستودع الرئيسي', 'WH-001', true, NOW(), NOW())
        ON CONFLICT DO NOTHING
      `);

      // Create default unit
      await client.query(`
        INSERT INTO "Unit" (name, "isDefault", "createdAt", "updatedAt")
        VALUES ('قطعة', true, NOW(), NOW())
        ON CONFLICT DO NOTHING
      `);

      // Create cash customer
      await client.query(`
        INSERT INTO "Customer" (name, phone, "createdAt", "updatedAt")
        VALUES ('عميل نقدي', '0000000000', NOW(), NOW())
        ON CONFLICT DO NOTHING
      `);

      // Create default chart of accounts
      const accounts = [
        [1, 'الأصول', 'asset', null],
        [2, 'الخصوم', 'liability', null],
        [3, 'حقوق الملكية', 'equity', null],
        [4, 'الإيرادات', 'revenue', null],
        [5, 'المصروفات', 'expense', null],
        [11, 'النقدية والبنوك', 'asset', 1],
        [12, 'المدينون', 'asset', 1],
        [13, 'المخزون', 'asset', 1],
        [21, 'الدائنون', 'liability', 2],
        [41, 'إيرادات المبيعات', 'revenue', 4],
        [51, 'تكلفة المبيعات', 'expense', 5],
      ];

      for (const [code, name, type, parentCode] of accounts) {
        await client.query(`
          INSERT INTO "Account" (code, name, "accountType", "parentCode", "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, NOW(), NOW())
          ON CONFLICT DO NOTHING
        `, [code.toString(), name, type, parentCode?.toString() || null]);
      }

      console.log('✅ Default data seeded');
      await client.end();
    } catch (err) {
      console.error('⚠️ Seed error (non-fatal):', err.message);
    }
  }

  async stop() {
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
